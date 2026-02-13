from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..config import settings
from ..deps import get_db
from ..email_utils import send_email
from ..models import AppSetting, Candidate, Question, Submission
from ..seed import HIGH_TEST_INSTRUCTIONS
from ..schemas import CandidateSessionOut, CandidateSubmitIn, CandidateSubmitOut


router = APIRouter(prefix="/candidate", tags=["Candidate"])
GEMINI_KEY_SETTING = "gemini_api_key"


def _get_candidate_by_token(db: Session, token: str, require_not_submitted: bool = False) -> Candidate:
    candidate = db.query(Candidate).filter(Candidate.invite_token == token).first()
    if not candidate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invalid invite token")
    if candidate.token_expires_at < datetime.utcnow():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invite token has expired")
    if require_not_submitted and candidate.is_submitted:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Test already submitted")
    return candidate


@router.get("/token/{token}", response_model=CandidateSessionOut)
def get_candidate_session(token: str, db: Session = Depends(get_db)):
    candidate = _get_candidate_by_token(db, token, require_not_submitted=True)
    if not candidate.test_started_at:
        candidate.test_started_at = datetime.utcnow()
        db.commit()
        db.refresh(candidate)

    test_ends_at = candidate.test_started_at + timedelta(minutes=candidate.test_duration_minutes)
    time_left_seconds = int((test_ends_at - datetime.utcnow()).total_seconds())
    if time_left_seconds <= 0:
        candidate.is_submitted = True
        db.commit()
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Test time is over")

    questions = (
        db.query(Question)
        .filter(Question.level == candidate.test_level)
        .order_by(Question.order_no.asc())
        .all()
    )
    key_row = db.query(AppSetting).filter(AppSetting.key == GEMINI_KEY_SETTING).first()
    gemini_key = key_row.value if key_row and key_row.value else settings.default_gemini_api_key

    question_payload = []
    for q in questions:
        question_payload.append(
            {
                "id": q.id,
                "order_no": q.order_no,
                "qtype": q.qtype,
                "title": q.title,
                "prompt": (q.prompt or "").replace("YOUR_API_KEY", gemini_key),
            }
        )

    return {
        "candidate_name": candidate.name,
        "candidate_email": candidate.email,
        "test_level": candidate.test_level,
        "test_duration_minutes": candidate.test_duration_minutes,
        "test_ends_at": test_ends_at,
        "test_ends_at_ts": int(test_ends_at.timestamp()),
        "time_left_seconds": time_left_seconds,
        "test_instructions": HIGH_TEST_INSTRUCTIONS if candidate.test_level == "high" else None,
        "questions": question_payload,
    }


@router.post("/submit/{token}", response_model=CandidateSubmitOut)
def submit_test(token: str, payload: CandidateSubmitIn, db: Session = Depends(get_db)):
    candidate = _get_candidate_by_token(db, token, require_not_submitted=True)
    if not candidate.test_started_at:
        candidate.test_started_at = datetime.utcnow()
        db.commit()
        db.refresh(candidate)

    test_ends_at = candidate.test_started_at + timedelta(minutes=candidate.test_duration_minutes)
    if datetime.utcnow() >= test_ends_at:
        candidate.is_submitted = True
        db.commit()
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Test time is over")

    question_ids = {
        q.id for q in db.query(Question.id).filter(Question.level == candidate.test_level).all()
    }

    for ans in payload.answers:
        if ans.question_id not in question_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid question_id: {ans.question_id}",
            )
        normalized_answer = (ans.answer_text or "").strip()
        existing = (
            db.query(Submission)
            .filter(
                Submission.candidate_id == candidate.id,
                Submission.question_id == ans.question_id,
            )
            .first()
        )
        if not normalized_answer:
            if existing:
                db.delete(existing)
            continue

        if existing:
            existing.answer_text = normalized_answer
        else:
            db.add(
                Submission(
                    candidate_id=candidate.id,
                    question_id=ans.question_id,
                    answer_text=normalized_answer,
                )
            )

    candidate.submission_reason = payload.auto_submit_reason or "manual"
    candidate.is_submitted = True
    candidate.submitted_at = datetime.utcnow()
    db.commit()

    reason_text = {
        "manual": "Manual submit",
        "timeout": "Auto-submit due to timer expiry",
        "fullscreen_violation": "Auto-submit due to fullscreen policy violation",
    }.get(candidate.submission_reason or "manual", "Manual submit")
    submitted_at_str = candidate.submitted_at.strftime("%d %b %Y, %I:%M %p UTC") if candidate.submitted_at else "-"

    send_email(
        to_email=candidate.email,
        subject="Submission Received - Machine Test",
        body=(
            f"Hi {candidate.name},\n\n"
            "Your machine test submission has been received successfully.\n\n"
            f"Submission type: {reason_text}\n"
            f"Submitted at: {submitted_at_str}\n\n"
            "Our team will review your responses and get back to you.\n"
            "Thank you for your time."
        ),
        html_body=(
            "<div style=\"font-family:Arial,sans-serif;background:#f4f7fb;padding:24px;color:#0f172a;\">"
            "<div style=\"max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;\">"
            "<div style=\"background:linear-gradient(135deg,#14532d,#16a34a);padding:20px 24px;color:#ffffff;\">"
            "<h2 style=\"margin:0;font-size:22px;\">Submission Received</h2>"
            "<p style=\"margin:8px 0 0;opacity:0.9;\">Your machine test has been submitted.</p>"
            "</div>"
            "<div style=\"padding:22px 24px;line-height:1.6;\">"
            f"<p style=\"margin-top:0;\">Hi <strong>{candidate.name}</strong>,</p>"
            "<p>Your machine test submission has been received successfully.</p>"
            "<div style=\"background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px;\">"
            f"<div><strong>Submission type:</strong> {reason_text}</div>"
            f"<div><strong>Submitted at:</strong> {submitted_at_str}</div>"
            "</div>"
            "<p style=\"margin:16px 0 0;\">Our team will review your responses and get back to you.</p>"
            "<p style=\"margin:8px 0 0;font-size:13px;color:#475569;\">Thank you for your time and effort.</p>"
            "</div>"
            "</div>"
            "</div>"
        ),
    )

    return {"message": "Submission recorded successfully"}
