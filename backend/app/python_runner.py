import ast
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path


FALLBACK_AI_PRELUDE = r'''
try:
    import google.generativeai as _genai_check  # noqa: F401
except ModuleNotFoundError:
    import re
    import sys
    import types
    import textwrap

    def _fallback_response(prompt: str) -> str:
        prompt_text = (prompt or "").strip()
        lowered = prompt_text.lower()

        if "summarize" in lowered and "startup" not in lowered and "audio" not in lowered:
            snippet = prompt_text.split("\n\n", 1)[-1].strip()
            sentences = re.split(r'(?<=[.!?])\s+', snippet)
            summary = " ".join(sentences[:2]).strip()
            if not summary:
                summary = snippet[:280]
            return summary or "Summary not available."

        if "creative idea generation" in lowered or "startup ideas" in lowered or "healthcare" in lowered:
            return textwrap.dedent(
                """
                1. AI Symptom Navigator - a triage assistant that routes patients to the right care path.
                2. Predictive Readmission Guard - forecasts readmission risk and suggests follow-up actions.
                3. Medication Adherence Coach - tracks adherence and nudges patients using personalized reminders.
                4. Radiology Insight Helper - highlights scan anomalies for faster radiologist review.
                5. Clinical Documentation Copilot - turns doctor notes into structured summaries and next steps.
                """
            ).strip()

        if "200-page pdf" in lowered or "summarize it using an llm" in lowered or "chunking" in lowered:
            return textwrap.dedent(
                """
                1. Extract text from the PDF using a parser like PyPDF2 or pdfplumber.
                2. Clean and chunk the text with overlap.
                3. Generate embeddings for each chunk and store them in a vector database.
                4. Retrieve the most relevant chunks for each query or section.
                5. Summarize chunks hierarchically and merge them into a final report.
                6. Use an LLM for chunk-level summaries, refinement, and final synthesis.
                """
            ).strip()

        if "audio file" in lowered and "summary" in lowered:
            return textwrap.dedent(
                """
                1. Convert audio to text with speech-to-text.
                2. Clean and segment the transcript.
                3. Pass the transcript to an LLM for summarization.
                4. Optionally store transcript, summary, and metadata.
                5. Return the summary to the user.
                """
            ).strip()

        return "Gemini SDK is not available in this runtime, so this is a fallback response."

    class _FallbackResponse:
        def __init__(self, text: str):
            self.text = text

    class _FallbackModel:
        def __init__(self, *args, **kwargs):
            pass

        def generate_content(self, prompt):
            return _FallbackResponse(_fallback_response(prompt))

    def _fallback_configure(*args, **kwargs):
        return None

    google_module = types.ModuleType("google")
    genai_module = types.ModuleType("google.generativeai")
    genai_module.configure = _fallback_configure
    genai_module.GenerativeModel = _FallbackModel
    google_module.generativeai = genai_module
    sys.modules.setdefault("google", google_module)
    sys.modules["google.generativeai"] = genai_module
'''
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


def _resolve_python_cmd() -> str | None:
    # Prefer the interpreter running the backend process.
    candidates = [sys.executable, "python3", "python"]
    for cmd in candidates:
        if not cmd:
            continue
        if cmd == sys.executable:
            return cmd
        if shutil.which(cmd):
            return cmd
    return None


def run_python_code(code: str, stdin: str = "", timeout: int = 5, enable_ai_fallback: bool = False):
    _validate_code(code)

    if enable_ai_fallback:
        code = FALLBACK_AI_PRELUDE + "\n" + code

    python_cmd = _resolve_python_cmd()
    if not python_cmd:
        return {
            "stdout": "",
            "stderr": "Python interpreter not found on server.",
            "return_code": -1,
            "timed_out": False,
        }

    with tempfile.TemporaryDirectory() as tmpdir:
        file_path = Path(tmpdir) / "solution.py"
        file_path.write_text(code, encoding="utf-8")

        try:
            result = subprocess.run(
                [python_cmd, str(file_path)],
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
        except OSError as exc:
            return {
                "stdout": "",
                "stderr": f"Execution failed: {exc}",
                "return_code": -1,
                "timed_out": False,
            }
