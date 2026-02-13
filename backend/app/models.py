from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship

from .database import Base


class Admin(Base):
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    invite_token = Column(String(255), unique=True, nullable=False, index=True)
    token_expires_at = Column(DateTime, nullable=False)
    is_submitted = Column(Boolean, default=False)
    test_level = Column(String(20), nullable=False, default="intermediate")
    interview_marks = Column(Integer, nullable=True)
    test_duration_minutes = Column(Integer, nullable=False, default=60)
    test_started_at = Column(DateTime, nullable=True)
    submission_reason = Column(String(50), nullable=True)
    submitted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    submissions = relationship("Submission", back_populates="candidate", cascade="all, delete-orphan")
    evaluation_marks = relationship(
        "EvaluationMark",
        back_populates="candidate",
        cascade="all, delete-orphan",
    )


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    order_no = Column(Integer, nullable=False)
    level = Column(String(20), nullable=False, default="intermediate")
    qtype = Column(String(20), nullable=False)  # python | sql
    title = Column(String(255), nullable=False)
    prompt = Column(Text, nullable=False)

    submissions = relationship("Submission", back_populates="question")


class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    answer_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    candidate = relationship("Candidate", back_populates="submissions")
    question = relationship("Question", back_populates="submissions")


class AppSetting(Base):
    __tablename__ = "app_settings"

    key = Column(String(100), primary_key=True, index=True)
    value = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class EvaluationMark(Base):
    __tablename__ = "evaluation_marks"
    __table_args__ = (UniqueConstraint("candidate_id", "question_id", name="uq_candidate_question_mark"),)

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=False, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False, index=True)
    marks = Column(Integer, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    candidate = relationship("Candidate", back_populates="evaluation_marks")
    question = relationship("Question")
