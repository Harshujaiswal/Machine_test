from sqlalchemy import text


def _get_columns(db, table_name: str) -> set[str]:
    rows = db.execute(text(f"PRAGMA table_info({table_name})")).fetchall()
    return {row[1] for row in rows}


def run_sqlite_migrations(db, database_url: str):
    if not database_url.startswith("sqlite"):
        return

    candidate_cols = _get_columns(db, "candidates")
    if "test_level" not in candidate_cols:
        db.execute(text("ALTER TABLE candidates ADD COLUMN test_level TEXT DEFAULT 'intermediate'"))
    if "interview_marks" not in candidate_cols:
        db.execute(text("ALTER TABLE candidates ADD COLUMN interview_marks INTEGER"))
    if "test_duration_minutes" not in candidate_cols:
        db.execute(text("ALTER TABLE candidates ADD COLUMN test_duration_minutes INTEGER DEFAULT 60"))
    if "test_started_at" not in candidate_cols:
        db.execute(text("ALTER TABLE candidates ADD COLUMN test_started_at DATETIME"))
    if "submission_reason" not in candidate_cols:
        db.execute(text("ALTER TABLE candidates ADD COLUMN submission_reason TEXT"))
    if "submitted_at" not in candidate_cols:
        db.execute(text("ALTER TABLE candidates ADD COLUMN submitted_at DATETIME"))
    db.execute(text("UPDATE candidates SET test_level = 'intermediate' WHERE test_level IS NULL"))
    db.execute(text("UPDATE candidates SET test_duration_minutes = 60 WHERE test_duration_minutes IS NULL"))

    question_cols = _get_columns(db, "questions")
    if "level" not in question_cols:
        db.execute(text("ALTER TABLE questions ADD COLUMN level TEXT DEFAULT 'intermediate'"))
    db.execute(text("UPDATE questions SET level = 'intermediate' WHERE level IS NULL"))

    db.execute(
        text(
            """
            CREATE TABLE IF NOT EXISTS app_settings (
                key TEXT PRIMARY KEY,
                value TEXT,
                updated_at DATETIME
            )
            """
        )
    )

    db.execute(
        text(
            """
            CREATE TABLE IF NOT EXISTS evaluation_marks (
                id INTEGER PRIMARY KEY,
                candidate_id INTEGER NOT NULL,
                question_id INTEGER NOT NULL,
                marks INTEGER NOT NULL,
                updated_at DATETIME,
                FOREIGN KEY(candidate_id) REFERENCES candidates(id),
                FOREIGN KEY(question_id) REFERENCES questions(id)
            )
            """
        )
    )
    db.execute(
        text(
            "CREATE UNIQUE INDEX IF NOT EXISTS uq_candidate_question_mark ON evaluation_marks(candidate_id, question_id)"
        )
    )

    db.commit()
