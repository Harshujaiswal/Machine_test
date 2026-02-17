# Machine Test Platform

Full-stack platform with:
- FastAPI + PostgreSQL + SQLAlchemy
- JWT admin authentication
- bcrypt password hashing
- SMTP email invite + submission confirmation
- Safe Python code execution endpoint (`timeout=5s`, dangerous imports blocked)
- React (Vite) + TailwindCSS + Axios + Monaco editor

## Project Structure

- `backend/` FastAPI server
- `frontend/` React app

## Backend Setup

1. Open terminal in `backend/`
2. Create virtual environment and activate
3. Install dependencies
4. Create `.env` from `.env.example`
5. Run server

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload
```

Backend runs at `http://localhost:8000`

### PostgreSQL Setup

Set `DATABASE_URL` in `backend/.env`:

`postgresql+psycopg2://<username>:<password>@<host>:<port>/<database>`

Example:

`postgresql+psycopg2://postgres:postgres@localhost:5432/machine_test`

### Default Admins

Configured through `DEFAULT_ADMINS` in `.env`:
- `admin1@example.com / admin123`
- `admin2@example.com / admin123`

### SMTP Notes

- If `SMTP_USERNAME` and `SMTP_PASSWORD` are empty, emails are mocked and printed in backend logs.
- For real delivery, set SMTP credentials in `backend/.env`.

## Frontend Setup

1. Open terminal in `frontend/`
2. Install dependencies
3. Create `.env` from `.env.example`
4. Run dev server

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

Frontend runs at `http://localhost:5173`

## Implemented Features

1. Multi-admin login (JWT)
2. Admin invite candidate by email with test level, interview marks, and test timer
3. Unique candidate token link
4. Multiple test levels: `fresher` and `intermediate` question banks
5. Python code execution endpoint (subprocess, 5-second timeout)
6. Candidate submission confirmation email
7. Admin dashboard to view submissions
8. Clean modern UI with Tailwind + Monaco
9. Candidate deletion from admin dashboard
10. Timed tests with countdown and auto-submit on time expiry

## Main API Endpoints

- `POST /auth/login` admin login
- `POST /admin/invite` invite candidate (admin token required)
- `DELETE /admin/candidates/{candidate_id}` delete candidate + submissions
- `GET /admin/settings/gemini-key` get Gemini API key used in GenAI prompts
- `PUT /admin/settings/gemini-key` update Gemini API key from admin panel
- `GET /admin/submissions` view all candidate submissions (admin token required)
- `GET /candidate/token/{token}` candidate session + questions
- `POST /candidate/submit/{token}` submit candidate answers
- `POST /execute/python` run python code safely
- `POST /execute/sql` run read-only SQL (`SELECT`/`WITH`) on sample `employees` dataset
- `GET /health` service health check

## SQL Runtime Dataset

For SQL execution, platform loads this SQLite in-memory table on each run:
- `employees(employee_id, employee_name, department_id, salary, age, joining_date)`

## Note on Question Bank Updates

If predefined question titles change, the app reseeds questions and clears previous submissions to keep mappings consistent.
