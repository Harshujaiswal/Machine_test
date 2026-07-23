import smtplib
import ssl
from email.mime.text import MIMEText
from email.utils import formataddr

from .config import settings


def send_email(
    to_email: str,
    subject: str,
    body: str,
    html_body: str | None = None,
    template_id: str | None = None,
    extra_template_params: dict | None = None,
) -> bool:
    """
    Send email via SMTP.

    The extra template arguments are accepted for compatibility with older call sites,
    but SMTP delivery only uses subject/body/html_body.
    """
    if not settings.smtp_username or not settings.smtp_password:
        print(f"[EMAIL MOCK] To: {to_email} | Subject: {subject}\n{body}")
        if html_body:
            print(f"[EMAIL MOCK HTML]\n{html_body}")
        return False

    message = MIMEText(html_body or body, "html" if html_body else "plain", "utf-8")
    message["Subject"] = subject
    message["From"] = formataddr((settings.smtp_from_email or settings.smtp_username, settings.smtp_from_email or settings.smtp_username))
    message["To"] = to_email

    try:
        if settings.smtp_use_tls:
            context = ssl.create_default_context()
            with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=30) as server:
                server.ehlo()
                server.starttls(context=context)
                server.ehlo()
                server.login(settings.smtp_username, settings.smtp_password)
                server.sendmail(message["From"], [to_email], message.as_string())
        else:
            with smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, timeout=30) as server:
                server.login(settings.smtp_username, settings.smtp_password)
                server.sendmail(message["From"], [to_email], message.as_string())
        return True
    except Exception as exc:
        print(f"[EMAIL ERROR] SMTP send failed for {settings.smtp_host}:{settings.smtp_port} | {exc}")
        return False
