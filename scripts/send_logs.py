import os
import smtplib
from email.message import EmailMessage
from glob import glob

EMAIL_USER = os.environ.get("EMAIL_USER")
EMAIL_PASS = os.environ.get("EMAIL_PASS")
COMMIT = os.environ.get("COMMIT", "unknown")

msg = EmailMessage()
msg['Subject'] = f'Test Logs for commit {COMMIT}'
msg['From'] = EMAIL_USER
msg['To'] = "erik.gaibor@epn.edu.ec"

# Adjuntar todos los logs
logs = glob('logs/*.log')
for log_file in logs:
    with open(log_file, 'rb') as f:
        data = f.read()
        msg.add_attachment(data, maintype='text', subtype='plain', filename=os.path.basename(log_file))

# Enviar correo
with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
    smtp.login(EMAIL_USER, EMAIL_PASS)
    smtp.send_message(msg)

print(f"Logs sent for commit {COMMIT}")
