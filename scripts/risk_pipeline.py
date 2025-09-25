import os
import sys
import requests
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.preprocessing import MinMaxScaler
import mlflow
import mlflow.sklearn

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
# Pipeline principal
# -----------------------------
def main():
    commits = get_latest_commits(limit=11)
    if not commits:
        print("❌ No se pudieron obtener commits.")
        sys.exit(1)

    latest_commit = commits[0]

    # Construir dataset
    records = []
    sonar_metrics = get_sonar_metrics()  # métricas globales
    for sha in commits:
        loc = get_github_loc(sha)
        record = {**sonar_metrics, "loc_changed": loc, "commit": sha}
        records.append(record)
    df = pd.DataFrame(records)

    # Normalización y puntaje de riesgo
    metrics = ["bugs", "complexity", "code_smells", "vulnerabilities", "loc_changed"]
    scaler = MinMaxScaler()
    df_scaled = df.copy()
    df_scaled[metrics] = scaler.fit_transform(df[metrics])
    df_scaled["risk_score"] = df_scaled[metrics].sum(axis=1)
    df_scaled = df_scaled.sort_values("risk_score", ascending=False)

    # Registrar métricas y modelo en MLflow
    with mlflow.start_run():
        mlflow.log_param("num_commits", len(df))
        latest_risk = df_scaled.loc[df_scaled["commit"] == latest_commit, "risk_score"].values[0]
        mlflow.log_metric("latest_risk_score", latest_risk)
        mlflow.sklearn.log_model(
            df_scaled[metrics],
            artifact_path="risk_model",
            registered_model_name="RiskCommitModel"
        )

    # Gráfico comparativo
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
    plt.show()

    print(f"✅ Pipeline completado. Gráfico generado. Puntaje último commit ({latest_commit[:7]}): {latest_risk:.2f}")

    # Control de riesgo → cortar pipeline si es alto
    if latest_risk > 2.5:
        print("❌ Riesgo muy alto, no se permite el despliegue.")
        sys.exit(1)
    else:
        print("✅ Riesgo aceptable, se permite el despliegue.")
        sys.exit(0)


if __name__ == "__main__":
    main()
