import os
import sys
import requests
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.preprocessing import MinMaxScaler
from sklearn.dummy import DummyClassifier
import mlflow
import mlflow.sklearn
import smtplib
from email.message import EmailMessage
import nltk
from nltk.corpus import stopwords

# -----------------------------
# Configuración MLflow
# -----------------------------
MLFLOW_TRACKING_URI = os.getenv("MLFLOW_TRACKING_URI")
mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)
mlflow.set_experiment("Deployment Risk Prediction")

# -----------------------------
# Configuración GitHub y SonarCloud
# -----------------------------
GH_PAT = os.getenv("GH_PAT")
SONAR_TOKEN = os.getenv("SONAR_TOKEN")
OWNER = os.getenv("OWNER")
REPO = os.getenv("REPO")
SONAR_PROJECT_KEY = os.getenv("SONAR_PROJECT_KEY")

headers = {"Authorization": f"Bearer {GH_PAT}"}

# -----------------------------
# Funciones de extracción
# -----------------------------
def get_latest_commits(limit=11):
    url = f"https://api.github.com/repos/{OWNER}/{REPO}/commits"
    r = requests.get(url, headers=headers, params={"per_page": limit})
    if r.status_code == 200:
        commits = []
        for c in r.json():
            full_message = c["commit"]["message"]
            title = full_message.split("\n")[0]
            description = "\n".join(full_message.split("\n")[1:]).strip()
            commits.append({
                "sha": c["sha"],
                "title": title,
                "description": description,
                "message": full_message
            })
        return commits
    return []

def get_sonar_metrics():
    r = requests.get(
        "https://sonarcloud.io/api/measures/component",
        params={"component": SONAR_PROJECT_KEY, "metricKeys": "bugs,vulnerabilities,code_smells,complexity"},
        auth=(SONAR_TOKEN, "")
    )
    if r.status_code == 200:
        measures = r.json()["component"]["measures"]
        return {m["metric"]: float(m["value"]) for m in measures}
    return {}

def get_github_commit_stats(commit_sha):
    """Devuelve total loc cambiadas, additions y deletions."""
    r = requests.get(f"https://api.github.com/repos/{OWNER}/{REPO}/commits/{commit_sha}", headers=headers)
    if r.status_code == 200:
        stats = r.json()["stats"]
        return stats["total"], stats["additions"], stats["deletions"]
    return 0, 0, 0

def detect_commit_type(message):
    """Detecta si un commit es: bugfix, feature o refactor."""
    message = message.lower()
    stop_words = set(stopwords.words("english"))
    words = [w for w in message.split() if w not in stop_words]

    bugfix_keywords = {"fix", "bug", "error", "issue", "patch", "correct"}
    feature_keywords = {"add", "feature", "implement", "create", "new"}
    refactor_keywords = {"refactor", "cleanup", "restructure", "optimize"}

    if any(word in bugfix_keywords for word in words):
        return "bugfix"
    elif any(word in feature_keywords for word in words):
        return "feature"
    elif any(word in refactor_keywords for word in words):
        return "refactor"
    else:
        return "other"

# -----------------------------
# Función para enviar correo
# -----------------------------
def send_email_with_artifacts(to_email, subject, body, attachments):
    smtp_server = "smtp.gmail.com"
    smtp_port = 587
    sender_email = os.getenv("EMAIL_USER")
    sender_password = os.getenv("EMAIL_PASS")

    msg = EmailMessage()
    msg["From"] = sender_email
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.set_content(body)

    for file_path in attachments:
        with open(file_path, "rb") as f:
            file_data = f.read()
            file_name = os.path.basename(file_path)
        msg.add_attachment(file_data, maintype="application", subtype="octet-stream", filename=file_name)

    with smtplib.SMTP(smtp_server, smtp_port) as server:
        server.starttls()
        server.login(sender_email, sender_password)
        server.send_message(msg)

    print(f"📧 Correo enviado a {to_email} con {len(attachments)} archivos.")

# -----------------------------
# Pipeline principal
# -----------------------------
def main():
    commits = get_latest_commits(limit=11)
    if not commits:
        print("❌ No se pudieron obtener commits.")
        sys.exit(1)

    latest_commit = commits[0]
    latest_title = latest_commit["title"]
    latest_description = latest_commit["description"] if latest_commit["description"] else "(sin descripción)"

    records = []
    sonar_metrics = get_sonar_metrics()

    for c in commits:
        sha, message = c["sha"], c["message"]
        total_loc, additions, deletions = get_github_commit_stats(sha)
        commit_type = detect_commit_type(message)
        record = {**sonar_metrics,
                  "loc_changed": total_loc,
                  "additions": additions,
                  "deletions": deletions,
                  "commit": sha,
                  "message": message,
                  "commit_type": commit_type}
        records.append(record)
    df = pd.DataFrame(records)

    metrics = ["bugs", "complexity", "code_smells", "vulnerabilities", "loc_changed"]
    scaler = MinMaxScaler()
    df_scaled = df.copy()
    df_scaled[metrics] = scaler.fit_transform(df[metrics])
    df_scaled["risk_score"] = df_scaled[metrics].sum(axis=1)
    df_scaled = df_scaled.sort_values("risk_score", ascending=False)

    df_scaled["risk_label"] = (df_scaled["risk_score"] > 2.5).astype(int)
    df_scaled[metrics] = df_scaled[metrics].astype("float64")

    X = df_scaled[metrics].astype("float64")
    y = df_scaled["risk_label"]

    clf = DummyClassifier(strategy="most_frequent")
    clf.fit(X, y)

    input_example = X.iloc[:1].astype("float64")
    if mlflow.active_run():
        mlflow.end_run()
    with mlflow.start_run():
        mlflow.log_param("num_commits", len(df))
        latest_risk = df_scaled.loc[df_scaled["commit"] == latest_commit["sha"], "risk_score"].values[0]
        mlflow.log_metric("latest_risk_score", latest_risk)

        mlflow.sklearn.log_model(
            sk_model=clf,
            name="RiskCommitModel",
            input_example=input_example
        )

        df_scaled.to_csv("risk_scores.csv", index=False)
        mlflow.log_artifact("risk_scores.csv", artifact_path="data")
    mlflow.end_run()

    # -----------------------------
    # Gráfico de riesgo
    # -----------------------------
    plt.figure(figsize=(10, 6))
    colors = ["red" if c == latest_commit["sha"] else "steelblue" for c in df_scaled["commit"]]
    plt.barh(df_scaled["message"], df_scaled["risk_score"], color=colors)
    plt.xlabel("Puntaje de riesgo (normalizado)")
    plt.ylabel("Commit Message")
    plt.title("Riesgo del commit más reciente comparado con los últimos 10")
    plt.gca().invert_yaxis()
    plt.tight_layout()
    graph_path = "commit_risk_report.png"
    plt.savefig(graph_path)
    mlflow.log_artifact(graph_path, artifact_path="figures")
    plt.show()

    # -----------------------------
    # Reporte deuda técnica
    # -----------------------------
    df_scaled["deuda_tecnica"] = df_scaled["code_smells"] + df_scaled["complexity"]
    df_scaled["deuda_acumulada"] = df_scaled["deuda_tecnica"].cumsum()

    plt.figure(figsize=(10, 6))
    plt.plot(df_scaled["message"], df_scaled["deuda_acumulada"], marker="o", linestyle="-", color="darkorange")
    plt.xticks(rotation=45, ha="right")
    plt.xlabel("Commit Message")
    plt.ylabel("Deuda técnica acumulada")
    plt.title("Evolución acumulada de la deuda técnica")
    plt.tight_layout()
    debt_path = "technical_debt_report.png"
    plt.savefig(debt_path)
    mlflow.log_artifact(debt_path, artifact_path="figures")
    plt.show()

    # -----------------------------
    # Reporte líneas añadidas vs eliminadas
    # -----------------------------
    plt.figure(figsize=(10, 6))
    plt.bar(df["message"], df["additions"], color="green", label="Additions")
    plt.bar(df["message"], -df["deletions"], color="red", label="Deletions")
    plt.xticks(rotation=45, ha="right")
    plt.xlabel("Commit Message")
    plt.ylabel("Líneas (+ / -)")
    plt.title("Líneas añadidas vs eliminadas por commit")
    plt.legend()
    plt.tight_layout()
    changes_path = "additions_deletions_report.png"
    plt.savefig(changes_path)
    mlflow.log_artifact(changes_path, artifact_path="figures")
    plt.show()

    # -----------------------------
    # Reporte tipo de commit
    # -----------------------------
    commit_type_counts = df_scaled["commit_type"].value_counts()
    plt.figure(figsize=(8, 5))
    commit_type_counts.plot(kind="bar", color=["red", "green", "blue", "gray"])
    plt.xlabel("Tipo de commit")
    plt.ylabel("Cantidad de commits")
    plt.title("Cantidad de commits por tipo (NLP)")
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.savefig("commit_type_count.png")
    plt.show()

    # -----------------------------
    # Enviar correo con título y descripción
    # -----------------------------
    body = (
        f"Título del commit: {latest_title}\n\n"
        f"Descripción:\n{latest_description}\n\n"
        f"Puntaje de riesgo: {latest_risk:.2f}\n"
        "Adjunto CSV, gráfico de riesgo, reporte de deuda técnica y cambios de líneas."
    )

    send_email_with_artifacts(
        to_email="erik.gaibor@epn.edu.ec",
        subject=f"Reporte de riesgo commit {latest_title[:50]}...",
        body=body,
        attachments=[
            "risk_scores.csv",
            "commit_risk_report.png",
            "technical_debt_report.png",
            "additions_deletions_report.png"
        ]
    )

    if latest_risk > 2.5:
        print("❌ Riesgo muy alto, no se permite el despliegue.")
        sys.exit(1)
    else:
        print("✅ Riesgo aceptable, se permite el despliegue.")
        sys.exit(0)

if __name__ == "__main__":
    main()
