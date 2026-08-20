from sqlalchemy import text


def _get_columns_sqlite(db, table_name: str) -> set[str]:
    rows = db.execute(text(f"PRAGMA table_info({table_name})")).fetchall()
    return {row[1] for row in rows}


def _get_columns_postgres(db, table_name: str) -> set[str]:
    rows = db.execute(
        text(
            """
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = :table_name
            """
        ),
        {"table_name": table_name},
    ).fetchall()
    return {row[0] for row in rows}


def run_sqlite_migrations(db, database_url: str):
    if not database_url.startswith("sqlite"):
        return

    candidate_cols = _get_columns_sqlite(db, "candidates")
    if "test_level" not in candidate_cols:
        db.execute(text("ALTER TABLE candidates ADD COLUMN test_level TEXT DEFAULT 'intermediate'"))
    if "question_set_version" not in candidate_cols:
        db.execute(text("ALTER TABLE candidates ADD COLUMN question_set_version INTEGER DEFAULT 1"))
    if "interview_marks" not in candidate_cols:
        db.execute(text("ALTER TABLE candidates ADD COLUMN interview_marks INTEGER"))
    if "interviewer_name" not in candidate_cols:
        db.execute(text("ALTER TABLE candidates ADD COLUMN interviewer_name TEXT"))
    if "reviewer_emails" not in candidate_cols:
        db.execute(text("ALTER TABLE candidates ADD COLUMN reviewer_emails TEXT"))
    if "test_duration_minutes" not in candidate_cols:
        db.execute(text("ALTER TABLE candidates ADD COLUMN test_duration_minutes INTEGER DEFAULT 60"))
    if "test_started_at" not in candidate_cols:
        db.execute(text("ALTER TABLE candidates ADD COLUMN test_started_at DATETIME"))
    if "submission_reason" not in candidate_cols:
        db.execute(text("ALTER TABLE candidates ADD COLUMN submission_reason TEXT"))
    if "manual_machine_test_marks" not in candidate_cols:
        db.execute(text("ALTER TABLE candidates ADD COLUMN manual_machine_test_marks INTEGER"))
    if "hiring_decision" not in candidate_cols:
        db.execute(text("ALTER TABLE candidates ADD COLUMN hiring_decision TEXT"))
    if "decision_reason" not in candidate_cols:
        db.execute(text("ALTER TABLE candidates ADD COLUMN decision_reason TEXT"))
    if "submitted_at" not in candidate_cols:
        db.execute(text("ALTER TABLE candidates ADD COLUMN submitted_at DATETIME"))
    db.execute(text("UPDATE candidates SET test_level = 'intermediate' WHERE test_level IS NULL"))
    db.execute(text("UPDATE candidates SET question_set_version = 1 WHERE question_set_version IS NULL"))
    db.execute(text("UPDATE candidates SET test_duration_minutes = 60 WHERE test_duration_minutes IS NULL"))

    question_cols = _get_columns_sqlite(db, "questions")
    if "level" not in question_cols:
        db.execute(text("ALTER TABLE questions ADD COLUMN level TEXT DEFAULT 'intermediate'"))
    if "question_set_version" not in question_cols:
        db.execute(text("ALTER TABLE questions ADD COLUMN question_set_version INTEGER DEFAULT 1"))
    db.execute(text("UPDATE questions SET level = 'intermediate' WHERE level IS NULL"))
    db.execute(text("UPDATE questions SET question_set_version = 1 WHERE question_set_version IS NULL"))

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


def run_postgres_migrations(db, database_url: str):
    if database_url.startswith("sqlite"):
        return

    candidate_cols = _get_columns_postgres(db, "candidates")
    candidate_alters = [
        ("test_level", "ALTER TABLE candidates ADD COLUMN IF NOT EXISTS test_level VARCHAR(20) DEFAULT 'intermediate'"),
        ("question_set_version", "ALTER TABLE candidates ADD COLUMN IF NOT EXISTS question_set_version INTEGER DEFAULT 1"),
        ("interview_marks", "ALTER TABLE candidates ADD COLUMN IF NOT EXISTS interview_marks INTEGER"),
        ("interviewer_name", "ALTER TABLE candidates ADD COLUMN IF NOT EXISTS interviewer_name VARCHAR(255)"),
        ("reviewer_emails", "ALTER TABLE candidates ADD COLUMN IF NOT EXISTS reviewer_emails TEXT"),
        ("test_duration_minutes", "ALTER TABLE candidates ADD COLUMN IF NOT EXISTS test_duration_minutes INTEGER DEFAULT 60"),
        ("test_started_at", "ALTER TABLE candidates ADD COLUMN IF NOT EXISTS test_started_at TIMESTAMP"),
        ("submission_reason", "ALTER TABLE candidates ADD COLUMN IF NOT EXISTS submission_reason VARCHAR(50)"),
        ("manual_machine_test_marks", "ALTER TABLE candidates ADD COLUMN IF NOT EXISTS manual_machine_test_marks INTEGER"),
        ("hiring_decision", "ALTER TABLE candidates ADD COLUMN IF NOT EXISTS hiring_decision VARCHAR(20)"),
        ("decision_reason", "ALTER TABLE candidates ADD COLUMN IF NOT EXISTS decision_reason TEXT"),
        ("submitted_at", "ALTER TABLE candidates ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP"),
    ]
    for column_name, sql in candidate_alters:
        if column_name not in candidate_cols:
            db.execute(text(sql))

    question_cols = _get_columns_postgres(db, "questions")
    if "level" not in question_cols:
        db.execute(text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS level VARCHAR(20) DEFAULT 'intermediate'"))
    if "question_set_version" not in question_cols:
        db.execute(text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS question_set_version INTEGER DEFAULT 1"))

    db.execute(
        text(
            """
            CREATE TABLE IF NOT EXISTS app_settings (
                key VARCHAR(100) PRIMARY KEY,
                value TEXT,
                updated_at TIMESTAMP
            )
            """
        )
    )

    db.execute(
        text(
            """
            CREATE TABLE IF NOT EXISTS evaluation_marks (
                id SERIAL PRIMARY KEY,
                candidate_id INTEGER NOT NULL REFERENCES candidates(id),
                question_id INTEGER NOT NULL REFERENCES questions(id),
                marks INTEGER NOT NULL,
                updated_at TIMESTAMP
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
