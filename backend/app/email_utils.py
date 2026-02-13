import smtplib
from email.message import EmailMessage

from .config import settings


def send_email(to_email: str, subject: str, body: str, html_body: str | None = None) -> bool:
    if not settings.smtp_username or not settings.smtp_password:
        print(f"[EMAIL MOCK] To: {to_email} | Subject: {subject}\n{body}")
        if html_body:
            print(f"[EMAIL MOCK HTML]\n{html_body}")
        return False

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = settings.smtp_from_email
    msg["To"] = to_email
    msg.set_content(body)
    if html_body:
        msg.add_alternative(html_body, subtype="html")

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
        if settings.smtp_use_tls:
            server.starttls()
        server.login(settings.smtp_username, settings.smtp_password)
        server.send_message(msg)
    return True
