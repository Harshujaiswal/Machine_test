from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, EmailStr


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AdminLogin(BaseModel):
    email: EmailStr
    password: str


class InviteCandidateRequest(BaseModel):
    name: str
    email: EmailStr
    test_level: Literal["fresher", "intermediate", "high"]
    interview_marks: Optional[int] = None
    test_duration_minutes: Literal[60, 90, 120, 180] = 60


class InviteCandidateResponse(BaseModel):
    candidate_id: int
    invite_token: str
    invite_link: str


class GeminiAPIKeyIn(BaseModel):
    gemini_api_key: str


class GeminiAPIKeyOut(BaseModel):
    gemini_api_key: str


class QuestionOut(BaseModel):
    id: int
    order_no: int
    qtype: Literal["python", "sql"]
    title: str
    prompt: str

    class Config:
        from_attributes = True


class CandidateSessionOut(BaseModel):
    candidate_name: str
    candidate_email: EmailStr
    test_level: Literal["fresher", "intermediate", "high"]
    test_duration_minutes: int
    test_ends_at: datetime
    test_ends_at_ts: int
    time_left_seconds: int
    test_instructions: Optional[str] = None
    questions: List[QuestionOut]


class CandidateAnswerIn(BaseModel):
    question_id: int
    answer_text: str


class CandidateSubmitIn(BaseModel):
    answers: List[CandidateAnswerIn]
    auto_submit_reason: Optional[Literal["fullscreen_violation", "timeout"]] = None


class CandidateSubmitOut(BaseModel):
    message: str


class CandidateSubmissionItem(BaseModel):
    question_id: int
    question_title: str
    qtype: str
    answer_text: str
    updated_at: datetime


class CandidateSubmissionGroup(BaseModel):
    candidate_id: int
    candidate_name: str
    candidate_email: EmailStr
    test_level: str
    interview_marks: Optional[int] = None
    test_duration_minutes: int
    submission_reason: Optional[str] = None
    submitted_at: Optional[datetime] = None
    time_taken_seconds: Optional[int] = None
    machine_test_marks: Optional[int] = None
    is_submitted: bool
    submissions: List[CandidateSubmissionItem]


class CandidateQuestionAnswerItem(BaseModel):
    question_id: int
    order_no: int
    qtype: str
    question_title: str
    prompt: str
    answer_text: str
    awarded_marks: Optional[int] = None
    updated_at: Optional[datetime] = None


class CandidateSubmissionDetailOut(BaseModel):
    candidate_id: int
    candidate_name: str
    candidate_email: EmailStr
    test_level: str
    interview_marks: Optional[int] = None
    test_duration_minutes: int
    submission_reason: Optional[str] = None
    submitted_at: Optional[datetime] = None
    time_taken_seconds: Optional[int] = None
    machine_test_marks: Optional[int] = None
    is_submitted: bool
    questions: List[CandidateQuestionAnswerItem]


class QuestionMarkIn(BaseModel):
    question_id: int
    marks: Optional[int] = None


class SaveCandidateMarksIn(BaseModel):
    marks: List[QuestionMarkIn]


class SaveCandidateMarksOut(BaseModel):
    message: str
    machine_test_marks: int


class PythonExecuteIn(BaseModel):
    code: str
    stdin: str = ""


class PythonExecuteOut(BaseModel):
    stdout: str
    stderr: str
    return_code: int
    timed_out: bool = False


class SQLExecuteIn(BaseModel):
    query: str


class SQLExecuteOut(BaseModel):
    columns: List[str]
    rows: List[List[object]]
    row_count: int
