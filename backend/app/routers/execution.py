from fastapi import APIRouter, HTTPException

from ..python_runner import run_python_code
from ..schemas import PythonExecuteIn, PythonExecuteOut, SQLExecuteIn, SQLExecuteOut
from ..sql_runner import run_sql_query


router = APIRouter(prefix="/execute", tags=["Execution"])


@router.post("/python", response_model=PythonExecuteOut)
def execute_python(payload: PythonExecuteIn):
    try:
        result = run_python_code(payload.code, payload.stdin, timeout=5)
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
