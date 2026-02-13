import sqlite3
from datetime import date, timedelta


EMPLOYEES = [
    (1, "John", 1, 50000, 25, "2023-01-10"),
    (2, "Jane", 2, 60000, 28, "2022-11-15"),
    (3, "Alice", 2, 55000, 30, "2023-06-01"),
    (4, "Bob", 1, 45000, 22, "2024-01-20"),
    (5, "Charlie", 3, 70000, 35, "2021-09-25"),
]


def _is_safe_select(query: str) -> bool:
    q = query.strip().lower()
    if not q:
        return False
    if ";" in q[:-1]:
        return False
    blocked = ["insert", "update", "delete", "drop", "alter", "create", "attach", "detach", "pragma"]
    if any(word in q for word in blocked):
        return False
    return q.startswith("select") or q.startswith("with")


def run_sql_query(query: str):
    if not _is_safe_select(query):
        raise ValueError("Only SELECT/WITH read-only SQL queries are allowed.")

    conn = sqlite3.connect(":memory:")
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            CREATE TABLE employees (
                employee_id INTEGER,
                employee_name TEXT,
                department_id INTEGER,
                salary INTEGER,
                age INTEGER,
                joining_date TEXT
            )
            """
        )
        cursor.executemany(
            """
            INSERT INTO employees(employee_id, employee_name, department_id, salary, age, joining_date)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            EMPLOYEES,
        )

        # Helpful runtime constant for "last 6 months" style queries.
        six_months_ago = (date.today() - timedelta(days=180)).isoformat()
        cursor.execute("CREATE TEMP TABLE runtime_context (six_months_ago TEXT)")
        cursor.execute("INSERT INTO runtime_context(six_months_ago) VALUES (?)", (six_months_ago,))

        cursor.execute(query)
        rows = cursor.fetchall()
        columns = [col[0] for col in cursor.description] if cursor.description else []
        return {"columns": columns, "rows": [list(r) for r in rows], "row_count": len(rows)}
    finally:
        conn.close()

