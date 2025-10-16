import os
import requests
import json
import smtplib
from email.message import EmailMessage
# Librería de Google Gemini
from google import genai
from google.genai.errors import APIError

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
# Configuración Gemini (gemini-2.5-pro)
# -----------------------------
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=GEMINI_API_KEY)
MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-2.5-pro") 

# Nombres de los archivos de artefactos
DEUDA_TECNICA_FILE = "deuda_tecnica_informe.txt" 
ANALISIS_IA_FILE = "analisis_ia_commit.txt"

# Carpeta donde están los logs generados por GitHub Actions
LOGS_FOLDER = "logs"

# -----------------------------
# Funciones auxiliares
# -----------------------------

def get_latest_commit():
    """Obtiene los detalles del commit más reciente."""
    url = f"https://api.github.com/repos/{OWNER}/{REPO}/commits"
    r = requests.get(url, headers=headers, params={"per_page": 1})
    
    if r.status_code == 200 and r.json():
        commit_data = r.json()[0]
        sha = commit_data["sha"]
        
        r_details = requests.get(f"{url}/{sha}", headers=headers)
        if r_details.status_code == 200:
            full_details = r_details.json()
            
            message_lines = full_details["commit"]["message"].splitlines()
            title = message_lines[0].strip()
            description = "\n".join(message_lines[1:]).strip()
            
            files_modified = [f["filename"] for f in full_details.get("files", [])]
            
            return {
                "sha": sha,
                "title": title,
                "description": description,
                "files_modified": files_modified,
                "full_message": full_details["commit"]["message"]
            }
    
    print(f"❌ Error obteniendo el último commit de GitHub: {r.status_code}")
    return None

def get_sonar_metrics_totals():
    """
    Obtiene SOLO las 5 métricas específicas de SonarCloud.
    """
    url = "https://sonarcloud.io/api/measures/component"
    metric_keys = "bugs,vulnerabilities,code_smells,complexity,coverage"
    params = {
        "component": SONAR_PROJECT_KEY,
        "metricKeys": metric_keys
    }
    
    r = requests.get(url, params=params, auth=(SONAR_TOKEN, ""))
    
    metrics = {}
    if r.status_code == 200:
        measures = r.json().get("component", {}).get("measures", [])
        for m in measures:
            value = m.get("value", "N/A")
            try:
                metrics[m["metric"]] = float(value)
            except (ValueError, TypeError):
                metrics[m["metric"]] = value
        print(f"✅ Las 5 métricas de SonarCloud se obtuvieron correctamente.")
    else:
        try:
            error_details = r.json()
        except json.JSONDecodeError:
            error_details = r.text[:200]
        print(f"❌ ERROR: Fallo al obtener métricas de SonarCloud (Totales): {r.status_code}")
        print(f"   URL de Solicitud: {r.url}")
        print(f"   Respuesta del servidor: {error_details}")
    
    return metrics

def get_sonar_issues_details(types_to_get, severities):
    """
    Obtiene los detalles de los issues (Bugs, Code Smells, Vulnerabilities).
    """
    base_url = "https://sonarcloud.io/api/issues/search"
    all_issues = []
    page = 1
    page_size = 500  
    
    while True:
        params = {
            "componentKeys": SONAR_PROJECT_KEY,
            "types": ",".join(types_to_get),
            "severities": ",".join(severities),
            "p": page,
            "ps": page_size,
            "s": "SEVERITY"
        }
        r = requests.get(base_url, params=params, auth=(SONAR_TOKEN, ""))
        if r.status_code != 200:
            print(f"❌ ERROR: Fallo al obtener detalles de Issues (Página {page}): {r.status_code}")
            break

        data = r.json()
        issues = data.get("issues", [])
        all_issues.extend(issues)
        
        total_issues = data.get("total", 0)
        if len(all_issues) >= total_issues or not issues:
            break
        page += 1
    
    issues_by_type = {}
    for issue in all_issues:
        issue_type = issue.get("type", "OTHER")
        if issue_type not in issues_by_type:
            issues_by_type[issue_type] = []
        issues_by_type[issue_type].append(issue)
        
    return issues_by_type

def generate_technical_debt_report(sonar_metrics, sonar_issues):
    """Genera el archivo de deuda técnica (TXT detallado)."""
    report = f"--- INFORME DETALLADO DE DEUDA TÉCNICA (SonarCloud) ---\n"
    report += f"Proyecto: {SONAR_PROJECT_KEY}\n\n"
    
    report += "--- RESUMEN DE MÉTRICAS GLOBALES ---\n"
    report += f"- Bugs: {sonar_metrics.get('bugs', 'N/A')}\n"
    report += f"- Vulnerabilidades: {sonar_metrics.get('vulnerabilities', 'N/A')}\n"
    report += f"- Code Smells: {sonar_metrics.get('code_smells', 'N/A')}\n"
    report += f"- Complejidad Ciclomática: {sonar_metrics.get('complexity', 'N/A')}\n"
    report += f"- Cobertura de Tests: {sonar_metrics.get('coverage', 'N/A')}%\n\n"

    issue_types_map = {
        "BUG": "BUGS 🐛", 
        "VULNERABILITY": "VULNERABILIDADES 🛡️", 
        "CODE_SMELL": "CODE SMELLS 👃"
    }
    
    has_details = False 
    
    for issue_type, title in issue_types_map.items():
        issues = sonar_issues.get(issue_type, [])
        report += f"================================\n"
        report += f"DETALLE DE ISSUES: {title} ({len(issues)})\n"
        report += f"================================\n"
        if not issues:
            report += "No se encontraron issues de este tipo.\n\n"
            continue
        has_details = True
        for i, issue in enumerate(issues):
            file_path = issue.get("component", "N/A").split(":")[-1] 
            line = issue.get("line", "N/A")
            severity = issue.get("severity", "N/A")
            message = issue.get("message", "Sin descripción")
            report += f"{i+1}. [{severity} / Línea {line}] en {file_path}\n"
            report += f"   - Regla: {issue.get('rule', 'N/A')}\n"
            report += f"   - Mensaje: {message}\n"
            report += "--------------------------------\n"
        report += "\n"

    if not has_details and not sonar_issues:
        report += "\nATENCIÓN: No se pudo recuperar el detalle de issues.\n"

    with open(DEUDA_TECNICA_FILE, 'w', encoding='utf-8') as f:
        f.write(report)
        
    return report

def analyze_commit_for_description(commit_message):
    """Genera descripción funcional del commit con Gemini."""
    prompt = f"""
    Eres un asistente de documentación. Analiza el siguiente mensaje de commit y genera una **Descripción Funcional Detallada** del commit.
    Tu respuesta DEBE comenzar y terminar SOLAMENTE con la descripción generada.
    Commit a analizar:
    {commit_message}
    """
    try:
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
            config=genai.types.GenerateContentConfig(temperature=0.2)
        )
        return response.text.strip()
    except APIError as e:
        error_msg = f"❌ Error al usar Gemini API: {e}"
        print(error_msg)
        return f"Error en el análisis de IA: {error_msg}"
    except Exception as e:
        error_msg = f"❌ Error inesperado al usar Gemini: {e}"
        print(error_msg)
        return f"Error en el análisis de IA: {error_msg}"

def generate_full_report_file(body_content):
    """Genera el archivo de informe general."""
    try:
        with open(ANALISIS_IA_FILE, 'w', encoding='utf-8') as f:
            f.write(body_content)
        print(f"✅ Archivo de informe general '{ANALISIS_IA_FILE}' generado.")
    except Exception as e:
        print(f"❌ Error al generar el archivo de informe general: {e}")

def send_email_with_artifacts(to_emails, subject, body, attachments=[]):
    """Envía correo con los archivos adjuntos."""
    smtp_server = "smtp.gmail.com"
    smtp_port = 587
    sender_email = os.getenv("EMAIL_USER")
    sender_password = os.getenv("EMAIL_PASS")

    msg = EmailMessage()
    msg["From"] = sender_email
    msg["To"] = ", ".join(to_emails)
    msg["Subject"] = subject
    msg.set_content(body, subtype='plain') 

    # Adjuntar archivos TXT de informe y todos los logs
    for file_path in attachments:
        if not os.path.exists(file_path):
            continue
        with open(file_path, "rb") as f:
            data = f.read()
            name = os.path.basename(file_path)
        if name.endswith(".txt"):
            msg.add_attachment(data, maintype="text", subtype="plain", filename=name)
        else:
            msg.add_attachment(data, maintype="application", subtype="octet-stream", filename=name)

    # Adjuntar todos los logs de CI/CD
    if os.path.exists(LOGS_FOLDER):
        for filename in os.listdir(LOGS_FOLDER):
            filepath = os.path.join(LOGS_FOLDER, filename)
            with open(filepath, "rb") as f:
                data = f.read()
            msg.add_attachment(data, maintype="text", subtype="plain", filename=filename)

    try:
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(sender_email, sender_password)
            server.send_message(msg)
        print(f"📧 Correo enviado a {', '.join(to_emails)}.")
    except Exception as e:
        print(f"❌ Error al enviar correo: {e}")

# -----------------------------
# Pipeline principal
# -----------------------------
def main():
    print("Iniciando pipeline de informe de commit y calidad (Descripción IA + 5 métricas + Detalle TXT + Logs).")
    
    latest_commit = get_latest_commit()
    if not latest_commit:
        print("❌ No se pudo obtener el último commit. Finalizando.")
        return

    sha = latest_commit["sha"]
    title = latest_commit["title"]
    description = latest_commit["description"]
    files_modified = latest_commit["files_modified"]
    full_message = latest_commit["full_message"]
    print(f"✅ Commit más reciente obtenido: {sha[:7]} - {title}")
    
    print("⏳ Obteniendo métricas totales de SonarCloud...")
    sonar_metrics = get_sonar_metrics_totals() 
    sonar_issues = {}
    
    if sonar_metrics:
        print("✅ Métricas obtenidas. Obteniendo detalles de issues...")
        issue_types = ["BUG", "VULNERABILITY", "CODE_SMELL"]
        severities_to_get = ["BLOCKER", "CRITICAL", "MAJOR", "MINOR", "INFO"]
        sonar_issues = get_sonar_issues_details(issue_types, severities_to_get)
    else:
        print("⚠️ No se pudieron obtener detalles de issues.")

    print(f"⚙️ Generando informe detallado de deuda técnica en '{DEUDA_TECNICA_FILE}'...")
    generate_technical_debt_report(sonar_metrics, sonar_issues)
    
    print(f"⏳ Analizando commit con Gemini...")
    llm_description = analyze_commit_for_description(full_message)
    
    files_list = "\n".join([f"- {f}" for f in files_modified])
    if not files_list:
        files_list = "- Ninguno detectado o error al obtener."
    
    metric_summary = (
        f"Bugs: {sonar_metrics.get('bugs', 'N/A')} | "
        f"Vulnerabilidades: {sonar_metrics.get('vulnerabilities', 'N/A')} | "
        f"Code Smells: {sonar_metrics.get('code_smells', 'N/A')} | "
        f"Complejidad: {sonar_metrics.get('complexity', 'N/A')} | "
        f"Cobertura: {sonar_metrics.get('coverage', 'N/A')}"
    )

    body = "--- Informe de Commit y Calidad de Código ---\n\n"
    body += f"⭐ Commit Analizado: {sha}\n"
    body += f"📝 Título: {title}\n"
    body += f"📖 Descripción original:\n{description}\n"
    body += "\n--- Descripción Funcional (Gemini 2.5 Pro) ---\n"
    body += f"{llm_description}\n" 
    body += "\n--- Archivos Modificados ---\n"
    body += f"{files_list}\n"
    body += "\n--- Resumen de Métricas Clave de SonarCloud ---\n"
    body += f"{metric_summary}\n"
    body += "\nSe adjuntan todos los logs de tests, cobertura y E2E junto con los informes TXT."

    generate_full_report_file(body)

    subject_line = f"Informe de Calidad: Commit {sha[:7]} - '{title[:50]}...'"
    attachments_list = [DEUDA_TECNICA_FILE, ANALISIS_IA_FILE]

    send_email_with_artifacts(
        to_emails=[
            "erik.gaibor@epn.edu.ec", 
            "kevin.lema02@epn.edu.ec",
            "denis.suntasig@epn.edu.ec",
            "victor.rodriguez01@epn.edu.ec",
            "jose.teran@epn.edu.ec"
        ],
        subject=subject_line,
        body=body,
        attachments=attachments_list
    )
    
    for f in attachments_list:
        if os.path.exists(f):
            os.remove(f)
            
    print("Fin del pipeline.")

if __name__ == "__main__":
    main()
