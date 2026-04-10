import httpx

from .config import settings


def send_email(to_email: str, subject: str, body: str, html_body: str | None = None, template_id: str | None = None, extra_template_params: dict | None = None) -> bool:
    """
    Sends an email using EmailJS. This replaces the previous SMTP implementation.
    """
    return send_email_emailjs(to_email, subject, body, html_body, template_id, extra_template_params)


def send_email_emailjs(to_email: str, subject: str, message: str, html_message: str | None = None, template_id: str | None = None, extra_template_params: dict | None = None) -> bool:
    """
    Sends an email using the EmailJS REST API.
    """
    if not settings.emailjs_service_id or not settings.emailjs_public_key:
        print(f"[EMAILJS MOCK] To: {to_email} | Subject: {subject}\n{message}")
        return False

    url = "https://api.emailjs.com/api/v1.0/email/send"
    actual_template_id = template_id or settings.emailjs_template_id
    
    template_params = {
        "to_email": to_email,
        "email": to_email,
        "subject": subject,
        "message": message,
        "html_message": html_message,
    }
    if extra_template_params:
        template_params.update(extra_template_params)

    payload = {
        "service_id": settings.emailjs_service_id,
        "template_id": actual_template_id,
        "user_id": settings.emailjs_public_key,
        "accessToken": settings.emailjs_private_key,
        "template_params": template_params,
    }

    try:
        response = httpx.post(url, json=payload, timeout=10.0)
        response.raise_for_status()
        return True
    except Exception as e:
        print(f"[EMAILJS ERROR] {e}")
        return False