import os
import requests
import json
from datetime import datetime
import mlflow
import re

# 1. Configuración del entorno y tokens
api_url = os.environ.get('GITHUB_API_URL', 'https://api.github.com')
owner = os.environ['GITHUB_REPOSITORY_OWNER']
repo = os.environ['GITHUB_REPOSITORY'].split('/')[1]
run_id = os.environ['GITHUB_RUN_ID']
token = os.environ['GITHUB_TOKEN']
current_job_id = os.environ['GITHUB_JOB'] # Obtiene el ID del job actual

headers = {
    'Authorization': f'token {token}',
    'Accept': 'application/vnd.github.com+json'
}

# 2. Configuración del servidor MLflow desde el entorno
mlflow_tracking_uri = os.environ.get('MLFLOW_TRACKING_URI')
if not mlflow_tracking_uri:
    print("Error: MLFLOW_TRACKING_URI no está configurado.")
    exit(1)

mlflow.set_tracking_uri(mlflow_tracking_uri)
mlflow.set_experiment("Pipeline Performance")

# Función para sanitizar nombres de jobs
def sanitize_name(name):
    """
    Sanitiza un nombre de cadena para que sea compatible con los nombres de métricas de MLflow.
    Reemplaza cualquier carácter no permitido con un guión bajo.
    """
    # Expresión regular que permite alfanuméricos, guiones bajos, guiones, puntos, espacios, dos puntos y barras
    sanitized = re.sub(r'[^a-zA-Z0-9_.\- :/]', '_', name)
    return sanitized.strip().replace(' ', '_')

# 3. Obtención de datos del workflow
try:
    response = requests.get(f'{api_url}/repos/{owner}/{repo}/actions/runs/{run_id}/jobs', headers=headers)
    response.raise_for_status()
    jobs_data = response.json()['jobs']
except requests.exceptions.RequestException as e:
    print(f"Error al obtener datos de la API de GitHub: {e}")
    exit(1)

# 4. Inicio del "run" de MLflow y registro de métricas
with mlflow.start_run():
    # Registra los parámetros del run
    mlflow.log_param("github_run_id", run_id)
    mlflow.log_param("commit_sha", os.environ['GITHUB_SHA'])
    mlflow.log_param("branch", os.environ['GITHUB_REF_NAME'])

    # Extrae y registra métricas por cada job
    for job in jobs_data:
        # Ignorar el job actual (mlflow-tracking) ya que no ha terminado
        if str(job['id']) == current_job_id:
            continue
        
        # Ignorar jobs con conclusión nula
        if job['conclusion'] is None:
            continue

        try:
            start_time_str = job['started_at']
            end_time_str = job['completed_at']

            # Convierte las cadenas de tiempo a objetos datetime
            start_time = datetime.fromisoformat(start_time_str[:-1])
            end_time = datetime.fromisoformat(end_time_str[:-1])
            
            # Calcula la duración en segundos
            duration_seconds = (end_time - start_time).total_seconds()

            # Sanitiza el nombre del job antes de registrarlo
            sanitized_job_name = sanitize_name(job['name'])
            
            # Registra la métrica de duración en MLflow
            mlflow.log_metric(f"{sanitized_job_name}_duration_seconds", duration_seconds)
            
            # Registra el estado del job como parámetro
            mlflow.log_param(f"{sanitized_job_name}_status", job['conclusion'])
            
            print(f"Métrica registrada para el job '{job['name']}' (sanitizado: '{sanitized_job_name}'): {duration_seconds} segundos, Estado: {job['conclusion']}")
            
        except (KeyError, TypeError) as e:
            print(f"Error al procesar el job '{job.get('name', 'N/A')}': {e}")

print("Proceso de registro de métricas en MLflow finalizado.")
