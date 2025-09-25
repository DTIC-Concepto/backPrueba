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
OWNER = os.getenv("OWNER")             # ejemplo: "DTIC-Concepto"
REPO = os.getenv("REPO")               # ejemplo: "backPrueba"
SONAR_PROJECT_KEY = os.getenv("SONAR_PROJECT_KEY")

headers = {"Authorization": f"Bearer {GH_PAT}"}

# -----------------------------
# Funciones de extracción
# -----------------------------
def get_latest_commits(limit=11):
    url = f"https://api.github.com/repos/{OWNER}/{REPO}/commits"
    r = requests.get(url, headers=headers, params={"per_page": limit})
    if r.status_code == 200:
        return [c["sha"] for c in r.json()]
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

def get_github_loc(commit_sha):
    r = requests.get(f"https://api.github.com/repos/{OWNER}/{REPO}/commits/{commit_sha}", headers=headers)
    if r.status_code == 200:
        return r.json()["stats"]["total"]
    return 0

# -----------------------------
# Función para enviar correo
# -----------------------------
def send_email_with_artifacts(to_email, subject, body, attachments):
    smtp_server = "smtp.gmail.com"   # Cambia si usas otro proveedor
    smtp_port = 587
    sender_email = os.getenv("EMAIL_USER")       # correo remitente
    sender_password = os.getenv("EMAIL_PASS")    # password de app

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

    records = []
    sonar_metrics = get_sonar_metrics()
    for sha in commits:
        loc = get_github_loc(sha)
        record = {**sonar_metrics, "loc_changed": loc, "commit": sha}
        records.append(record)
    df = pd.DataFrame(records)

    metrics = ["bugs", "complexity", "code_smells", "vulnerabilities", "loc_changed"]
    scaler = MinMaxScaler()
    df_scaled = df.copy()
    df_scaled[metrics] = scaler.fit_transform(df[metrics])
    df_scaled["risk_score"] = df_scaled[metrics].sum(axis=1)
    df_scaled = df_scaled.sort_values("risk_score", ascending=False)

    df_scaled["risk_label"] = (df_scaled["risk_score"] > 2.5).astype(int)

    X = df_scaled[metrics].astype(float)
    y = df_scaled["risk_label"]

    clf = DummyClassifier(strategy="most_frequent")
    clf.fit(X, y)

    input_example = X.iloc[:1].astype(float)

    with mlflow.start_run():
        mlflow.log_param("num_commits", len(df))
        latest_risk = df_scaled.loc[df_scaled["commit"] == latest_commit, "risk_score"].values[0]
        mlflow.log_metric("latest_risk_score", latest_risk)

        mlflow.sklearn.log_model(
            sk_model=clf,
            name="RiskCommitModel",
            input_example=input_example
        )

        df_scaled.to_csv("risk_scores.csv", index=False)
        mlflow.log_artifact("risk_scores.csv", artifact_path="data")

    plt.figure(figsize=(10, 6))
    colors = ["red" if c == latest_commit else "steelblue" for c in df_scaled["commit"]]
    plt.barh(df_scaled["commit"], df_scaled["risk_score"], color=colors)
    plt.xlabel("Puntaje de riesgo (normalizado)")
    plt.ylabel("Commit")
    plt.title("Riesgo del commit más reciente comparado con los últimos 10")
    plt.gca().invert_yaxis()
    plt.tight_layout()
    graph_path = "commit_risk_report.png"
    plt.savefig(graph_path)
    mlflow.log_artifact(graph_path, artifact_path="figures")
    plt.show()

    print(f"✅ Pipeline completado. Puntaje último commit ({latest_commit[:7]}): {latest_risk:.2f}")

    send_email_with_artifacts(
        to_email="erik.gaibor@epn.edu.ec",
        subject=f"Reporte de riesgo commit {latest_commit[:7]}",
        body=f"Puntaje de riesgo: {latest_risk:.2f}\nAdjunto CSV y gráfico del pipeline.",
        attachments=["risk_scores.csv", "commit_risk_report.png"]
    )

    if latest_risk > 2.5:
        print("❌ Riesgo muy alto, no se permite el despliegue.")
        sys.exit(1)
    else:
        print("✅ Riesgo aceptable, se permite el despliegue.")
        sys.exit(0)


if __name__ == "__main__":
    main()
