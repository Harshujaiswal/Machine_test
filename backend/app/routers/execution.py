import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..deps import get_db
from ..models import Question
from ..python_harnesses import RESULT_MARKER, get_test_harness
from ..python_runner import run_python_code
from ..schemas import PythonExecuteIn, PythonExecuteOut, SQLExecuteIn, SQLExecuteOut
from ..sql_runner import run_sql_query


router = APIRouter(prefix="/execute", tags=["Execution"])


def _extract_test_results(stdout: str) -> tuple[str, list[dict]]:
    lines = stdout.splitlines()
    for index in range(len(lines) - 1, -1, -1):
        line = lines[index]
        if not line.startswith(RESULT_MARKER):
            continue
        clean_stdout = "\n".join(lines[:index] + lines[index + 1 :])
        try:
            results = json.loads(line[len(RESULT_MARKER) :])
        except (json.JSONDecodeError, TypeError):
            results = []
        return clean_stdout, results if isinstance(results, list) else []
    return stdout, []


@router.post("/python", response_model=PythonExecuteOut)
def execute_python(payload: PythonExecuteIn, db: Session = Depends(get_db)):
    try:
        harness = None
        if payload.question_id is not None:
            question = db.query(Question).filter(Question.id == payload.question_id).first()
            harness = get_test_harness(question.title if question else None)

        code_to_run = f"{payload.code.rstrip()}\n\n{harness}" if harness else payload.code
        result = run_python_code(code_to_run, payload.stdin, timeout=5, enable_ai_fallback=True)

        test_results: list[dict] = []
        if harness and result["return_code"] == 0 and not result["timed_out"]:
            result["stdout"], test_results = _extract_test_results(result["stdout"])
            if not test_results:
                test_results = [{
                    "name": "Evaluator",
                    "input": "Candidate solution",
                    "passed": False,
                    "expected": "All test cases to execute",
                    "actual": "Test harness did not complete",
                    "error": "Do not terminate the program before the evaluator runs.",
                }]

        result["test_results"] = test_results
        result["passed_tests"] = sum(1 for item in test_results if item.get("passed"))
        result["total_tests"] = len(test_results)

        if (
            result["return_code"] == 0
            and not result["timed_out"]
            and not result["stdout"].strip()
            and not result["stderr"].strip()
            and not test_results
        ):
            result["stdout"] = (
                "Code executed successfully, but it produced no output. "
                "Call your function with sample input or add a print() statement.\n"
            )

        return result
    except SyntaxError as e:
        raise HTTPException(status_code=400, detail=f"Syntax error: {e}")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Python execution failed: {e}")


@router.post("/sql", response_model=SQLExecuteOut)
def execute_sql(payload: SQLExecuteIn):
    try:
        return run_sql_query(payload.query)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"SQL execution failed: {e}")