import ast
import subprocess
import tempfile
from pathlib import Path


BANNED_IMPORTS = {
    "os",
    "sys",
    "subprocess",
    "socket",
    "shutil",
    "pathlib",
    "importlib",
    "ctypes",
    "multiprocessing",
    "threading",
    "signal",
    "resource",
    "pickle",
    "marshal",
}

BANNED_CALLS = {"eval", "exec", "__import__", "open", "compile", "input"}


def _validate_code(code: str):
    tree = ast.parse(code)
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                root = alias.name.split(".")[0]
                if root in BANNED_IMPORTS:
                    raise ValueError(f"Import '{root}' is not allowed")

        if isinstance(node, ast.ImportFrom):
            if node.module:
                root = node.module.split(".")[0]
                if root in BANNED_IMPORTS:
                    raise ValueError(f"Import '{root}' is not allowed")

        if isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name) and node.func.id in BANNED_CALLS:
                raise ValueError(f"Call '{node.func.id}' is not allowed")


def run_python_code(code: str, stdin: str = "", timeout: int = 5):
    _validate_code(code)

    with tempfile.TemporaryDirectory() as tmpdir:
        file_path = Path(tmpdir) / "solution.py"
        file_path.write_text(code, encoding="utf-8")

        try:
            result = subprocess.run(
                ["python", str(file_path)],
                input=stdin,
                text=True,
                capture_output=True,
                timeout=timeout,
                check=False,
            )
            return {
                "stdout": result.stdout,
                "stderr": result.stderr,
                "return_code": result.returncode,
                "timed_out": False,
            }
        except subprocess.TimeoutExpired:
            return {
                "stdout": "",
                "stderr": "Execution timed out after 5 seconds.",
                "return_code": -1,
                "timed_out": True,
            }

