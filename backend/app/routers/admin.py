from datetime import datetime, timedelta
from uuid import uuid4

from openai import OpenAI

import json
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from ..config import settings
from ..deps import get_current_admin, get_db
from ..email_utils import send_email
from ..models import AppSetting, Candidate, EvaluationMark, Question, Submission
from ..schemas import (
    AIAutoGradeIn,
    AIAutoGradeOut,
    CandidateQuestionAnswerItem,
    CandidateSubmissionDetailOut,
    CandidateSubmissionGroup,
    CandidateSubmissionItem,
    GeminiAPIKeyIn,
    GeminiAPIKeyOut,
    InviteCandidateRequest,
    InviteCandidateResponse,
    SaveCandidateMarksIn,
    SaveCandidateMarksOut,
)


router = APIRouter(prefix="/admin", tags=["Admin"])

GEMINI_KEY_SETTING = "gemini_api_key"
REVIEWER_DIRECTORY = {
    "HARSH JAISWAL": "harshjaiswal.linuxbean@gmail.com",
    "RAHUL": "rahulparihar.stevesai@gmail.com",
}
EMAIL_TO_REVIEWER_NAME = {
    "harshjaiswal.linuxbean@gmail.com": "HARSH JAISWAL",
    "harshjaiswal.linuxbean@gmail.com": "HARSH JAISWAL",
    "rahulparihar.stevesai@gmail.com": "RAHUL",
}



def _resolve_frontend_base_url(request: Request | None = None) -> str:
    configured = (settings.frontend_base_url or "").strip().rstrip("/")
    if configured and not configured.startswith(("http://localhost", "http://127.0.0.1")):
        return configured
    if request is not None:
        origin = (request.headers.get("origin") or "").strip().rstrip("/")
        if origin:
            return origin
    return configured or "http://localhost:5173"

def _normalize_reviewer_emails(reviewer_emails: list[str]) -> list[str]:
    normalized: list[str] = []
    seen: set[str] = set()
    allowed = {"harshjaiswal.linuxbean@gmail.com", "harshjaiswal.linuxbean@gmail.com", "rahulparihar.stevesai@gmail.com"}
    for email in reviewer_emails:
        clean = (email or "").strip().lower()
        if not clean:
            continue
        if clean not in allowed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Reviewer email not allowed: {email}",
            )
        if clean in seen:
            continue
        seen.add(clean)
        normalized.append(clean)
    return normalized


def _reviewer_names_from_csv(csv_value: str | None) -> list[str]:
    if not csv_value:
        return []
    names: list[str] = []
    for email in [x.strip().lower() for x in csv_value.split(",") if x.strip()]:
        mapped = EMAIL_TO_REVIEWER_NAME.get(email)
        if mapped and mapped not in names:
            names.append(mapped)
    return names


@router.get("/reviewer-options")
def get_reviewer_options(_admin=Depends(get_current_admin)):
    return [{"name": name, "email": email} for name, email in REVIEWER_DIRECTORY.items()]


@router.get("/settings/gemini-key", response_model=GeminiAPIKeyOut)
def get_gemini_key(db: Session = Depends(get_db), _admin=Depends(get_current_admin)):
    row = db.query(AppSetting).filter(AppSetting.key == GEMINI_KEY_SETTING).first()
    return {"gemini_api_key": row.value if row and row.value else settings.default_gemini_api_key}


@router.put("/settings/gemini-key", response_model=GeminiAPIKeyOut)
def update_gemini_key(
    payload: GeminiAPIKeyIn,
    db: Session = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    row = db.query(AppSetting).filter(AppSetting.key == GEMINI_KEY_SETTING).first()
    if row:
        row.value = payload.gemini_api_key.strip()
    else:
        db.add(AppSetting(key=GEMINI_KEY_SETTING, value=payload.gemini_api_key.strip()))
    db.commit()
    return {"gemini_api_key": payload.gemini_api_key.strip()}


@router.post("/invite", response_model=InviteCandidateResponse)
def invite_candidate(
    payload: InviteCandidateRequest,
    request: Request,
    db: Session = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    token = uuid4().hex
    expires_at = datetime.utcnow() + timedelta(hours=settings.invite_token_expire_hours)
    reviewer_emails = _normalize_reviewer_emails([str(e) for e in payload.reviewer_emails])

    candidate = Candidate(
        name=payload.name,
        email=payload.email,
        invite_token=token,
        token_expires_at=expires_at,
        test_level=payload.test_level,
        interview_marks=payload.interview_marks,
        interviewer_name=(payload.interviewer_name or "").strip() or None,
        reviewer_emails=",".join(reviewer_emails) if reviewer_emails else None,
        test_duration_minutes=payload.test_duration_minutes,
        is_submitted=False,
    )
    db.add(candidate)
    try:
        db.commit()
        db.refresh(candidate)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Candidate with this email already exists. Use a different email or delete old entry first.",
        )
    frontend_base_url = _resolve_frontend_base_url(request)
    invite_link = f"{frontend_base_url}/candidate/{token}"
    expires_at_str = expires_at.strftime("%d %b %Y, %I:%M %p UTC")
    test_level_label = (candidate.test_level or "").capitalize()
    send_email(
        to_email=candidate.email,
        subject="Machine Test Invitation",
        body=(
            f"Hi {candidate.name},"
            "You have been invited to take the Machine Test Platform assessment."
            f"Test level: {test_level_label}"
            f"Test duration: {candidate.test_duration_minutes} minutes"
            f"Invite link: {invite_link}"
            f"Link expires at: {expires_at_str}"
            "Important:"
            "- Use this unique link only once."
            "- Keep stable internet during the test."
            "- Fullscreen policy may be enforced."
            "Best of luck."
        ),
        html_body=(
            "<div style=\"font-family:Arial,sans-serif;background:#f4f7fb;padding:24px;color:#0f172a;\">"
            "<div style=\"max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;\">"
            "<div style=\"background:linear-gradient(135deg,#0f172a,#1d4ed8);padding:20px 24px;color:#ffffff;\">"
            "<h2 style=\"margin:0;font-size:22px;\">Machine Test Invitation</h2>"
            "<p style=\"margin:8px 0 0;opacity:0.9;\">You are invited to start your assessment.</p>"
            "</div>"
            "<div style=\"padding:22px 24px;line-height:1.6;\">"
            f"<p style=\"margin-top:0;\">Hi <strong>{candidate.name}</strong>,</p>"
            "<p>You have been invited to take the Machine Test Platform assessment.</p>"
            "<div style=\"background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px;\">"
            f"<div><strong>Test level:</strong> {test_level_label}</div>"
            f"<div><strong>Test duration:</strong> {candidate.test_duration_minutes} minutes</div>"
            f"<div><strong>Link expiry:</strong> {expires_at_str}</div>"
            "</div>"
            f"<p style=\"margin:18px 0;\"><a href=\"{invite_link}\" style=\"display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:600;\">Start Test</a></p>"
            f"<p style=\"word-break:break-all;margin:0 0 12px;\"><strong>Direct link:</strong> <a href=\"{invite_link}\">{invite_link}</a></p>"
            "<p style=\"margin:0;font-size:13px;color:#475569;\">Important: Use this unique link only once and keep stable internet during the test.</p>"
            "</div>"
            "</div>"
            "</div>"
        ),
        template_id=settings.emailjs_invite_template_id,
        extra_template_params={
            "interviewer_name": candidate.name,
            "test_level": test_level_label,
            "test_duration_minutes": candidate.test_duration_minutes,
            "link_expiry": expires_at_str,
            "start_test_link": invite_link,
            "direct_link": invite_link,
            "invite_link": invite_link,
        },
    )

    return {
        "candidate_id": candidate.id,
        "invite_token": token,
        "invite_link": invite_link,
    }


@router.delete("/candidates/{candidate_id}")
def delete_candidate(candidate_id: int, db: Session = Depends(get_db), _admin=Depends(get_current_admin)):
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found")

    db.delete(candidate)
    db.commit()
    return {"message": "Candidate deleted successfully"}



OPENAI_GRADING_SYSTEM = (
    "You are a strict but fair technical evaluator. "
    "Grade each answer on a 0-2 scale based on correctness, completeness, and clarity.beause the total of this test is 10 marks, so each question can be graded with 0, 1,1.5, or 2 marks."
    "Return ONLY valid JSON with schema: {\"items\": [{\"question_id\": int, \"score\": int, \"feedback\": string}]}. for each answer feedback, provide a brief comment on why you gave that score and how the answer could be correqtly answered if it was not fully correct." 
    "If an answer is not correct only mark based on logic and approach and than create feedback based on that,"
    "Please be strict give the marks under the total of 10 marks and go to total output above the 10 marks so please assign marks of each question carefully."
    "If an answer is not correct right 0 marks this and some logic are assign only logic marks like 0.50 etc"
    "If an answer is empty or irrelevant, score 0 with short feedback."
)


def _call_openai_responses(messages: list[dict]) -> str:
    if not settings.openai_api_key:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OPENAI_API_KEY is not configured")
    client = OpenAI(api_key=settings.openai_api_key)
    try:
        response = client.chat.completions.create(
            model=settings.openai_model,
            messages=messages,
            response_format={"type": "json_object"},
            temperature=0.2,
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"OpenAI request failed: {e}")

    try:
        content = response.choices[0].message.content or ""
    except Exception:
        content = ""
    if not content.strip():
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="OpenAI returned empty response content")
    return content


def _extract_json_block(text: str) -> dict | None:
    try:
        return json.loads(text)
    except Exception:
        pass
    if not text:
        return None
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return None
    try:
        return json.loads(text[start : end + 1])
    except Exception:
        return None

@router.get("/submissions", response_model=list[CandidateSubmissionGroup])
def get_submissions(db: Session = Depends(get_db), _admin=Depends(get_current_admin)):
    candidates = (
        db.query(Candidate)
        .options(
            joinedload(Candidate.submissions).joinedload(Submission.question),
            joinedload(Candidate.evaluation_marks),
        )
        .order_by(Candidate.created_at.desc())
        .all()
    )

    data: list[CandidateSubmissionGroup] = []
    for candidate in candidates:
        time_taken_seconds = None
        if candidate.test_started_at and candidate.submitted_at:
            time_taken_seconds = max(
                0,
                int((candidate.submitted_at - candidate.test_started_at).total_seconds()),
            )

        items: list[CandidateSubmissionItem] = []
        for sub in sorted(candidate.submissions, key=lambda s: s.question.order_no):
            if not (sub.answer_text or "").strip():
                continue
            items.append(
                CandidateSubmissionItem(
                    question_id=sub.question_id,
                    question_title=sub.question.title,
                    qtype=sub.question.qtype,
                    answer_text=sub.answer_text,
                    updated_at=sub.updated_at,
                )
            )
        machine_test_marks = sum(m.marks for m in (candidate.evaluation_marks or []))
        data.append(
            CandidateSubmissionGroup(
                candidate_id=candidate.id,
                candidate_name=candidate.name,
                candidate_email=candidate.email,
                test_level=candidate.test_level,
                interview_marks=candidate.interview_marks,
                interviewer_name=candidate.interviewer_name,
                reviewer_names=_reviewer_names_from_csv(candidate.reviewer_emails),
                test_duration_minutes=candidate.test_duration_minutes,
                submission_reason=candidate.submission_reason,
                submitted_at=candidate.submitted_at,
                time_taken_seconds=time_taken_seconds,
                machine_test_marks=machine_test_marks,
                is_submitted=candidate.is_submitted,
                submissions=items,
            )
        )
    return data


@router.get("/submissions/{candidate_id}", response_model=CandidateSubmissionDetailOut)
def get_candidate_submission_detail(
    candidate_id: int,
    db: Session = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found")

    questions = (
        db.query(Question)
        .filter(Question.level == candidate.test_level)
        .order_by(Question.order_no.asc())
        .all()
    )
    submissions = (
        db.query(Submission)
        .options(joinedload(Submission.question))
        .filter(Submission.candidate_id == candidate_id)
        .all()
    )
    eval_marks = db.query(EvaluationMark).filter(EvaluationMark.candidate_id == candidate_id).all()
    submission_by_question = {s.question_id: s for s in submissions}
    marks_by_question = {m.question_id: m.marks for m in eval_marks}

    question_answers: list[CandidateQuestionAnswerItem] = []
    for q in questions:
        s = submission_by_question.get(q.id)
        question_answers.append(
            CandidateQuestionAnswerItem(
                question_id=q.id,
                order_no=q.order_no,
                qtype=q.qtype,
                question_title=q.title,
                prompt=q.prompt,
                answer_text=s.answer_text if s else "",
                awarded_marks=marks_by_question.get(q.id),
                updated_at=s.updated_at if s else None,
            )
        )

    time_taken_seconds = None
    if candidate.test_started_at and candidate.submitted_at:
        time_taken_seconds = max(
            0,
            int((candidate.submitted_at - candidate.test_started_at).total_seconds()),
        )

    return CandidateSubmissionDetailOut(
        candidate_id=candidate.id,
        candidate_name=candidate.name,
        candidate_email=candidate.email,
        test_level=candidate.test_level,
        interview_marks=candidate.interview_marks,
        interviewer_name=candidate.interviewer_name,
        reviewer_names=_reviewer_names_from_csv(candidate.reviewer_emails),
        test_duration_minutes=candidate.test_duration_minutes,
        submission_reason=candidate.submission_reason,
        submitted_at=candidate.submitted_at,
        time_taken_seconds=time_taken_seconds,
        machine_test_marks=sum(marks_by_question.values()) if marks_by_question else 0,
        is_submitted=candidate.is_submitted,
        questions=question_answers,
    )


@router.post("/submissions/{candidate_id}/marks", response_model=SaveCandidateMarksOut)
def save_candidate_marks(
    candidate_id: int,
    payload: SaveCandidateMarksIn,
    db: Session = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found")

    valid_question_ids = {
        q.id for q in db.query(Question.id).filter(Question.level == candidate.test_level).all()
    }
    for item in payload.marks:
        if item.question_id not in valid_question_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid question_id: {item.question_id}",
            )
        if item.marks is not None and item.marks < 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Marks cannot be negative")

    existing = db.query(EvaluationMark).filter(EvaluationMark.candidate_id == candidate_id).all()
    existing_by_question = {m.question_id: m for m in existing}

    for item in payload.marks:
        row = existing_by_question.get(item.question_id)
        if item.marks is None:
            if row:
                db.delete(row)
            continue
        if row:
            row.marks = item.marks
        else:
            db.add(EvaluationMark(candidate_id=candidate_id, question_id=item.question_id, marks=item.marks))

    db.commit()
    total_marks = (
        db.query(func.coalesce(func.sum(EvaluationMark.marks), 0))
        .filter(EvaluationMark.candidate_id == candidate_id)
        .scalar()
    )
    return {"message": "Machine test marks saved successfully", "machine_test_marks": int(total_marks or 0)}

@router.post("/submissions/{candidate_id}/ai-grade", response_model=AIAutoGradeOut)
@router.post("/submissions/{candidate_id}/ai_grade", response_model=AIAutoGradeOut)
def ai_grade_candidate(candidate_id: int, payload: AIAutoGradeIn | None = None, db: Session = Depends(get_db), _admin=Depends(get_current_admin)):
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found")

    questions = (
        db.query(Question)
        .filter(Question.level == candidate.test_level)
        .order_by(Question.order_no.asc())
        .all()
    )
    submissions = (
        db.query(Submission)
        .filter(Submission.candidate_id == candidate_id)
        .all()
    )
    submission_by_question = {s.question_id: s for s in submissions}
    items_payload = []
    for q in questions:
        s = submission_by_question.get(q.id)
        items_payload.append(
            {
                "question_id": q.id,
                "qtype": q.qtype,
                "title": q.title,
                "prompt": q.prompt,
                "answer": (s.answer_text if s else ""),
            }
        )

    user_content = (
        "Grade the following answers. Return JSON only."
        + json.dumps({"items": items_payload}, ensure_ascii=False)
    )
    raw = _call_openai_responses(
        [
            {"role": "system", "content": OPENAI_GRADING_SYSTEM},
            {"role": "user", "content": user_content},
        ]
    )

    parsed = _extract_json_block(raw)
    if not parsed or "items" not in parsed:
        preview = raw[:800] if isinstance(raw, str) else ""
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"OpenAI returned invalid grading JSON. Raw: {preview}",
        )

    valid_ids = {q.id for q in questions}
    out_items = []
    for item in parsed.get("items", []):
        try:
            qid = int(item.get("question_id"))
        except Exception:
            continue
        if qid not in valid_ids:
            continue
        score = item.get("score")
        if score is not None:
            try:
                score = int(score)
                score = max(0, min(10, score))
            except Exception:
                score = None
        feedback = item.get("feedback") if isinstance(item.get("feedback"), str) else None
        out_items.append({"question_id": qid, "score": score, "feedback": feedback})

    return {"model": settings.openai_model, "items": out_items}