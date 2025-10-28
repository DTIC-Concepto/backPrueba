import os
import requests
import json
import time
import smtplib
from datetime import datetime, timezone
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication

# ==========================================================
# CONFIGURACIÓN
# ==========================================================
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

LOCAL_INPUT_FILE = "./deuda_tecnica_informe.txt"
GEMINI_MODEL_NAME = "gemini-2.5-flash"
OUTPUT_JSON_FILE = "sonar_analysis_prioritization_results.json"
REPORT_TXT_FILE = "reporte_priorizacion_critica.txt"         
PROJECT_TAG = "CI/CD_DevOps_Analysis"
MAX_INPUT_CHARS = 70000
# ==========================================================
# CONFIGURACIÓN DE CORREO ELECTRÓNICO 
# ==========================================================
EMAIL_CONFIG = {
    "SENDER_EMAIL": os.getenv("EMAIL_USER"),
    "SENDER_PASSWORD":  os.getenv("EMAIL_PASS"),
    "RECEIVER_EMAIL": ["erik.gaibor@epn.edu.ec", "kevin.lema02@epn.edu.ec","jose.teran@epn.edu.ec"],
    "SMTP_SERVER": "smtp.gmail.com",
    "SMTP_PORT": 587

}
# ==========================================================

GEMINI_API_ENDPOINT = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL_NAME}:generateContent?key={GEMINI_API_KEY}"


def get_sonar_issues_for_analysis(file_path):
    if not os.path.exists(file_path):
        print(f"❌ ERROR: No se encontró el archivo de issues en la ruta: {file_path}")
        return None
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            issues_content = f.read().strip()

        if not issues_content:
            print("⚠️ El archivo de issues se encontró, pero está vacío.")
            return None
        
        if len(issues_content) > MAX_INPUT_CHARS:
            print(f"⚠️ Contenido truncado: {len(issues_content)} caracteres. Se usarán solo {MAX_INPUT_CHARS}.")
            issues_content = issues_content[:MAX_INPUT_CHARS]
        
        print(f"✅ Issues leídos con éxito. {len(issues_content)} caracteres listos para análisis.")
        return issues_content
        
    except Exception as e:
        print(f"❌ ERROR al leer el archivo local: {e}")
        return None


def analyze_sonar_issues_with_gemini(issues_text):
    # Modificaciones para priorizar Bugs y Vulnerabilidades
    system_prompt = (
        "Eres un analista senior de DevOps especializado en seguridad, calidad de código y CI/CD. "
        "Tu tarea es analizar issues detectados por SonarCloud y priorizarlos según riesgo operacional y de seguridad. "
        "La prioridad debe ser: 1. Vulnerabilidades de Seguridad, 2. Bugs de Confiabilidad, 3. Code Smells de Mantenibilidad (solo si son de alta severidad). "
        "Para cada issue seleccionado, debes proporcionar una corrección concreta en forma de un bloque de código que resuelva el problema. "
        "La respuesta debe ser únicamente un JSON válido, sin explicaciones fuera del JSON."
    )

    user_query = (
        "Analiza el siguiente bloque de issues de SonarCloud y selecciona los 10 más críticos, priorizando explícitamente: Bugs (Confiabilidad), Vulnerabilidades (Seguridad), y luego Code Smells (Mantenibilidad). "
        "Los issues seleccionados deben impactar la seguridad, la disponibilidad, o el MTTR del pipeline CI/CD. "
        "Para cada uno de los 10 issues seleccionados, incluye lo siguiente:\n"
        "- issue_prioridad: 1 al 10 (1 es el más urgente, siguiendo la jerarquía de riesgo: Seguridad > Confiabilidad > Mantenibilidad)\n"
        "- severidad_original: severidad reportada por SonarCloud\n"
        "- archivo_afectado: archivo donde ocurre el issue\n"
        "- justificacion_riesgo: explica el riesgo de forma concreta, detallando si es un riesgo de Seguridad, Disponibilidad o MTTR\n"
        "- solucion_codigo: bloque de código con la corrección ESPECÍFICA del issue (máximo 20 líneas)\n\n"
        "Devuelve únicamente un array JSON con esos 10 objetos.\n"
        f"--- ISSUES A ANALIZAR ---\n{issues_text}"
    )

    response_schema = {
        "type": "ARRAY",
        "description": "Lista de los 10 issues más críticos para el riesgo operativo.",
        "items": {
            "type": "OBJECT",
            "properties": {
                "issue_prioridad": {"type": "INTEGER"},
                "severidad_original": {"type": "STRING"},
                "archivo_afectado": {"type": "STRING"},
                "justificacion_riesgo": {"type": "STRING"},
                "solucion_codigo": {"type": "STRING"}
            },
            "required": ["issue_prioridad", "severidad_original", "archivo_afectado", "justificacion_riesgo", "solucion_codigo"]
        }
    }

    payload = {
        "systemInstruction": {"role": "system", "parts": [{"text": system_prompt}]},
        "generationConfig": {
            "temperature": 0.2,
            "responseMimeType": "application/json",
            "responseSchema": response_schema
        },
        "contents": [
            {
                "role": "user",
                "parts": [{"text": user_query}]
            }
        ]
    }

    start_time = time.time()

    try:
        response = requests.post(
            GEMINI_API_ENDPOINT,
            headers={'Content-Type': 'application/json'},
            data=json.dumps(payload),
            timeout=180
        )

        response.raise_for_status()

        end_time = time.time()
        latency_ms = int((end_time - start_time) * 1000)

        result_text = response.json()['candidates'][0]['content']['parts'][0]['text']
        llm_prioritization = json.loads(result_text)

        return {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "latency_ms": latency_ms,
            "llm_prioritization": llm_prioritization
        }

    except requests.exceptions.RequestException as e:
        print(f"❌ ERROR de conexión/API con Gemini: {e}")
        return None
    except json.JSONDecodeError:
        print("❌ ERROR: Gemini no devolvió JSON válido.")
        return None
    except Exception as e:
        print(f"❌ ERROR inesperado: {e}")
        return None


# ==========================================================
# FUNCIÓN PARA CONVERTIR JSON A REPORTE LEGIBLE
# ==========================================================
def create_readable_report(analysis_data):
    report_lines = [
        "==================================================================",
        f"INFORME DE PRIORIZACIÓN DE DEUDA TÉCNICA CRÍTICA",
        f"PROYECTO: {analysis_data['project_tag']}",
        f"FECHA DE ANÁLISIS: {analysis_data['experiment_timestamp']}",
        f"MODELO GEMINI USADO: {GEMINI_MODEL_NAME}",
        "==================================================================",
        "\n✅ TOP 10 ISSUES CRÍTICOS PRIORIZADOS POR RIESGO (Seguridad > Confiabilidad > Mantenibilidad)\n"
    ]
    
    # Ordenar por prioridad (1 es el más urgente)
    sorted_issues = sorted(analysis_data['gemini_diagnosis'], key=lambda x: x['issue_prioridad'])

    for issue in sorted_issues:
        report_lines.append("-" * 70)
        report_lines.append(f"PRIORIDAD (1-10): {issue['issue_prioridad']} | SEVERIDAD SONAR: {issue['severidad_original']}")
        report_lines.append(f"ARCHIVO AFECTADO: {issue['archivo_afectado']}")
        report_lines.append("\nJUSTIFICACIÓN DE RIESGO:")
        report_lines.append(f"  > {issue['justificacion_riesgo']}")
        report_lines.append("\nSOLUCIÓN DE CÓDIGO SUGERIDA:")
        report_lines.append("--------------------------------------------------")
        report_lines.append(issue['solucion_codigo'])
        report_lines.append("--------------------------------------------------")
        report_lines.append("\n")

    return "\n".join(report_lines)


# ==========================================================
# FUNCIÓN DE ENVÍO DE EMAIL MODIFICADA PARA DOBLE ADJUNTO
# ==========================================================
def send_email_report(report_text, subject, report_filename, json_filename):
    try:
        msg = MIMEMultipart()
        msg['From'] = EMAIL_CONFIG["SENDER_EMAIL"]
        msg['To'] = ", ".join(EMAIL_CONFIG["RECEIVER_EMAIL"]) if isinstance(EMAIL_CONFIG["RECEIVER_EMAIL"], (list, tuple)) else EMAIL_CONFIG["RECEIVER_EMAIL"]
        msg['Subject'] = subject

        # Cuerpo del correo
        body_intro = (
            f"Adjunto encontrará el informe de priorización de deuda técnica para el proyecto **{PROJECT_TAG}**.\n\n"
            f"1. **{report_filename}**: Informe legible y priorizado para el equipo.\n"
            f"2. **{json_filename}**: Archivo JSON original de la respuesta de Gemini (para registro técnico).\n"
        )
        msg.attach(MIMEText(body_intro, 'plain'))
        
        # 1. Adjuntar el Reporte Legible (TXT)
        attachment_txt = MIMEText(report_text, 'plain')
        attachment_txt.add_header('Content-Disposition', 'attachment', filename=report_filename)
        msg.attach(attachment_txt)
        
        # 2. Adjuntar el JSON (requiere leer el archivo o usar MIMEApplication)
        with open(json_filename, "rb") as f:
            attachment_json = MIMEApplication(f.read(), _subtype="json")
            attachment_json.add_header('Content-Disposition', 'attachment', filename=json_filename)
            msg.attach(attachment_json)

        # Conexión y envío
        with smtplib.SMTP(EMAIL_CONFIG["SMTP_SERVER"], EMAIL_CONFIG["SMTP_PORT"]) as server:
            server.starttls()  # Habilitar seguridad TLS
            server.login(EMAIL_CONFIG["SENDER_EMAIL"], EMAIL_CONFIG["SENDER_PASSWORD"])
            # sendmail acepta lista de destinatarios
            server.sendmail(EMAIL_CONFIG["SENDER_EMAIL"], EMAIL_CONFIG["RECEIVER_EMAIL"], msg.as_string())
        
        print(f"✅ Informe legible y JSON enviados con éxito a {EMAIL_CONFIG['RECEIVER_EMAIL']}!")
        return True

    except smtplib.SMTPAuthenticationError:
        print("❌ ERROR de Autenticación SMTP: Verifica el email y la Contraseña de Aplicación.")
    except Exception as e:
        print(f"❌ ERROR al enviar correo: {e}")
    return False


def main():
    if GEMINI_API_KEY == "TU_API_KEY_AQUI" or EMAIL_CONFIG["SENDER_PASSWORD"] == "tu_password_de_aplicacion":
        print("🚨 ERROR: Por favor, actualiza GEMINI_API_KEY y la configuración de EMAIL antes de ejecutar.")
        return
    
    issues_text_block = get_sonar_issues_for_analysis(LOCAL_INPUT_FILE)
    if not issues_text_block:
        print("Finalizando el pipeline. No hay issues para analizar.")
        return

    print(f"\n⏳ Enviando {len(issues_text_block) // 1024} KB de issues a Gemini para priorización de MTTR...")
    analysis_result = analyze_sonar_issues_with_gemini(issues_text_block)

    if not analysis_result:
        print("\n⛔ La API falló. No se generó informe para enviar.")
        return

    # --- Generación y guardado de archivos ---
    try:
        final_data = {
            "project_tag": PROJECT_TAG,
            "experiment_timestamp": analysis_result["timestamp"],
            "analysis_latency_ms": analysis_result["latency_ms"],
            "gemini_diagnosis": analysis_result["llm_prioritization"]
        }
        
        # 1. Guardar el JSON (Contenido técnico)
        report_content_json = json.dumps(final_data, indent=4, ensure_ascii=False)
        with open(OUTPUT_JSON_FILE, 'w', encoding='utf-8') as f:
            f.write(report_content_json)
        print(f"✅ Respaldo JSON guardado en: {OUTPUT_JSON_FILE}")
        
        # 2. Generar y guardar el reporte legible (Contenido de negocio)
        readable_report_text = create_readable_report(final_data)
        with open(REPORT_TXT_FILE, 'w', encoding='utf-8') as f:
            f.write(readable_report_text)
        print(f"✅ Reporte legible generado en: {REPORT_TXT_FILE}")
        
        # 3. Enviar el informe por correo con doble adjunto
        email_subject = f"Informe Crítico de Deuda Técnica: {PROJECT_TAG}"
        send_email_report(readable_report_text, email_subject, REPORT_TXT_FILE, OUTPUT_JSON_FILE)

    except Exception as e:
        print(f"❌ ERROR al guardar o enviar archivo: {e}")


if __name__ == "__main__":
    main()