import os
import requests
import pandas as pd
import json

# Credenciales y URLs
GH_PAT = os.environ['GH_PAT']
SONAR_TOKEN = os.environ['SONAR_TOKEN_API']
SONAR_URL = "https://sonarcloud.io/api"
OWNER = "DTIC-Concepto"  # Reemplaza con tu usuario o nombre de organización de GitHub
REPO = "backPrueba"      # Reemplaza con el nombre de tu repositorio
SONAR_PROJECT_KEY = os.environ['SONAR_PROJECT_KEY']  # Reemplaza con tu clave de proyecto en SonarCloud

headers = {'Authorization': f'Bearer {GH_PAT}'}

def get_sonar_metrics(commit_sha):
    params = {
        'project': SONAR_PROJECT_KEY,
        'commit': commit_sha,
        'metrics': 'bugs,vulnerabilities,code_smells,complexity'
    }
    response = requests.get(f"{SONAR_URL}/measures/search", params=params, auth=(SONAR_TOKEN, ''))
    if response.status_code == 200:
        data = response.json()
        metrics = {m['metric']: m['value'] for m in data.get('measures', [])}
        return metrics
    else:
        print(f"❌ Error Sonar {response.status_code} para commit {commit_sha}")
    return None

def get_github_changes(commit_sha):
    response = requests.get(
        f"https://api.github.com/repos/{OWNER}/{REPO}/commits/{commit_sha}",
        headers=headers
    )
    if response.status_code == 200:
        data = response.json()
        total_changes = data['stats']['total']
        return {'loc_changed': total_changes}
    else:
        print(f"❌ Error GitHub {response.status_code} para commit {commit_sha}")
    return None

def get_commits(limit=10):
    """Obtiene los últimos N commits del repo"""
    url = f"https://api.github.com/repos/{OWNER}/{REPO}/commits"
    response = requests.get(url, headers=headers, params={"per_page": limit})
    if response.status_code == 200:
        data = response.json()
        return [commit["sha"] for commit in data]
    else:
        print(f"❌ Error al traer commits: {response.status_code}")
    return []

def main():
    commits = get_commits(limit=10)  # últimos 10 commits
    results = []

    for commit_sha in commits:
        print(f"🔍 Procesando commit {commit_sha}")
        sonar_metrics = get_sonar_metrics(commit_sha)
        github_changes = get_github_changes(commit_sha)

        if sonar_metrics and github_changes:
            combined_data = {
                **sonar_metrics,
                **github_changes,
                "commit": commit_sha
            }
            results.append(combined_data)

    if results:
        df = pd.DataFrame(results)
        df.to_csv("dataset.csv", index=False)
        print("✅ Dataset creado con métricas de varios commits")
        print(df)
    else:
        print("⚠️ No se pudieron obtener métricas")

if __name__ == "__main__":
    main()
