from .auth import hash_password
from .models import Admin, AppSetting, Question, Submission


HIGH_TEST_INSTRUCTIONS = (
    "Instructions:\n\n"
    "Attempt all 8 questions in this notebook itself.\n"
    "Questions 1-5 are Python-based.\n"
    "Questions 6-8 are AI (Generative AI) based and are equally important (if you know AI) - you must attempt them.\n"
    "Write clean, modular, and well-commented code.\n"
    "Do not use any external files - everything must run here.\n"
    "Use print statements or markdowns to display outputs clearly.\n"
    "If you have knowledge of AI (Generative AI), you are encouraged to attempt these as well - doing so is a plus point."
)


INTERMEDIATE_QUESTIONS = [
    (
        "python",
        "Generate Parentheses",
        (
            "Given an integer n representing the number of pairs of parentheses, generate all combinations "
            "of well-formed parentheses.\n\n"
            "Input: Integer n (1 <= n <= 8)\n"
            "Output: List of valid parentheses combinations in any order.\n\n"
            "Example:\n"
            "n = 3 -> [\"((()))\", \"(()())\", \"(())()\", \"()(())\", \"()()()\"]\n"
            "n = 1 -> [\"()\"]"
        ),
    ),
    (
        "python",
        "Remove Nth Node From End of List",
        (
            "Given the head of a linked list, remove the nth node from the end and return the head.\n\n"
            "Example:\n"
            "head = [1,2,3,4,5], n = 2 -> [1,2,3,5]\n"
            "head = [1,2], n = 1 -> [1]\n\n"
            "Constraints:\n"
            "- 1 <= sz <= 30\n"
            "- 0 <= Node.val <= 100\n"
            "- 1 <= n <= sz"
        ),
    ),
    (
        "python",
        "Generate All Subsequences Recursively",
        (
            "A subsequence is derived by deleting zero or more characters without changing order.\n"
            "Write a recursive Python function to generate all subsequences of a string, including empty.\n\n"
            "Example:\n"
            "\"abc\" -> [\"\", \"a\", \"b\", \"c\", \"ab\", \"ac\", \"bc\", \"abc\"]"
        ),
    ),
    (
        "python",
        "Flatten Nested List Recursively",
        (
            "Given a nested list of integers, write a recursive Python function to flatten it while preserving order.\n"
            "Do not use itertools or sum() trick.\n\n"
            "Example:\n"
            "[1, [2, [3, 4], 5], 6] -> [1, 2, 3, 4, 5, 6]\n\n"
            "Constraint: nesting level up to 10."
        ),
    ),
    (
        "python",
        "Rotate NxN Matrix 90 Degrees Clockwise",
        (
            "Given an n x n matrix, rotate it 90 degrees clockwise in-place.\n"
            "Do not allocate another matrix.\n\n"
            "Example:\n"
            "[[1,2,3],[4,5,6],[7,8,9]] -> [[7,4,1],[8,5,2],[9,6,3]]"
        ),
    ),
    (
        "sql",
        "Department-wise Total Salary",
        (
            "Using SQLite table employees(employee_id, employee_name, department_id, salary, age, joining_date), "
            "write a SQL query to calculate total salary paid to employees in each department."
        ),
    ),
    (
        "sql",
        "Employees Joined in Last 6 Months",
        (
            "Using table employees(employee_id, employee_name, department_id, salary, age, joining_date), "
            "write a SQL query to find employees who joined in the last 6 months."
        ),
    ),
    (
        "sql",
        "Department-wise Highest Salary",
        (
            "Using table employees(employee_id, employee_name, department_id, salary, age, joining_date), "
            "write a SQL query to find department-wise highest salary."
        ),
    ),
    (
        "python",
        "GenAI Q1: Text Summarization with Gemini",
        (
            "Use Google Gemini to summarize a given paragraph in 2-3 sentences.\n"
            "Use imports:\n"
            "import google.generativeai as genai\n"
            "genai.configure(api_key=\"YOUR_API_KEY\")\n"
            "model = genai.GenerativeModel('gemini-2.5-flash')\n\n"
            "Example Input: Artificial Intelligence is transforming industries...\n"
            "Expected Output: concise 2-3 sentence summary."
        ),
    ),
    (
        "python",
        "GenAI Q2: Creative Healthcare Startup Ideas",
        (
            "Use Gemini to generate 5 innovative AI-based startup ideas in healthcare.\n"
            "Each idea should include a one-line description."
        ),
    ),
    (
        "python",
        "GenAI Q3: Summarize a 200-page PDF with LLM",
        (
            "Explain complete step-by-step architecture, libraries, chunking, retrieval and summarization flow "
            "to summarize a 200-page PDF using an LLM."
        ),
    ),
    (
        "python",
        "GenAI Q4: Audio Upload to Summary System Design",
        (
            "Design a system: user uploads audio file and system returns summary.\n"
            "Explain tools, flow, libraries, and where/how LLM is used."
        ),
    ),
]


FRESHER_QUESTIONS = [
    (
        "python",
        "Remove Duplicate Characters (Preserve Order)",
        (
            "Write a Python function that takes a string and returns a new string with all duplicate "
            "characters removed, preserving first occurrence order.\n\n"
            "Input: uppercase string (example: AAABBC)\n"
            "Output: string without duplicates (example: ABC)\n\n"
            "Examples:\n"
            "\"AAABBC\" -> \"ABC\"\n"
            "\"HELLO\" -> \"HELO\"\n"
            "\"AABBCCDD\" -> \"ABCD\""
        ),
    ),
    (
        "python",
        "Check Anagrams (No sort, no lower/upper)",
        (
            "Write a function to check if two strings are anagrams.\n"
            "Ignore case and consider only letters.\n"
            "Constraint: do not use sort() and do not use lower()/upper().\n\n"
            "Examples:\n"
            "listen, silent -> True\n"
            "hello, world -> False\n"
            "Listen, Silent -> True\n"
            "A gentleman, Elegant man -> True"
        ),
    ),
    (
        "python",
        "Bubble Sort",
        (
            "Write a Python program to sort a list using Bubble Sort.\n"
            "Repeatedly compare adjacent elements and swap when out of order.\n\n"
            "Input: list of integers or floats\n"
            "Output: sorted list (ascending)\n\n"
            "Examples:\n"
            "[64,34,25,12,22,11,90] -> [11,12,22,25,34,64,90]\n"
            "[5.5,3.3,2.2,4.4,1.1] -> [1.1,2.2,3.3,4.4,5.5]"
        ),
    ),
    (
        "python",
        "Merge Tuple Key-Value Pairs to Dictionary",
        (
            "Given list of tuples (key, value), merge into one dictionary.\n"
            "If key repeats, sum values.\n\n"
            "Examples:\n"
            "[(\"a\",1),(\"b\",2),(\"a\",3)] -> {\"a\":4,\"b\":2}\n"
            "[(\"x\",5),(\"y\",10),(\"x\",15)] -> {\"x\":20,\"y\":10}"
        ),
    ),
    (
        "sql",
        "Filter Employees by Salary",
        (
            "Using employees(employee_id, employee_name, department_id, salary, age), "
            "write SQL to find all employees earning more than 50000."
        ),
    ),
    (
        "sql",
        "Sort Employees by Age Desc",
        (
            "Using employees(employee_id, employee_name, department_id, salary, age), "
            "write SQL to retrieve all employees sorted by age in descending order."
        ),
    ),
    (
        "sql",
        "Department-wise Average Salary",
        (
            "Using employees(employee_id, employee_name, department_id, salary, age), "
            "write SQL to find average salary in each department."
        ),
    ),
]


HIGH_QUESTIONS = [
    (
        "python",
        "Q1: Flatten Nested List",
        (
            "Write a function flatten_list(nested_list) that converts a list of lists into a single flat list "
            "without using Python's built-in sum() or itertools.\n\n"
            "Example:\n"
            "flatten_list([[1, 2, [3]], [4, 5], 6]) -> [1, 2, 3, 4, 5, 6]"
        ),
    ),
    (
        "python",
        "Q2: Simulate API Call",
        (
            "Simulate an API call using Python's requests module or a mock function.\n"
            "Create get_user_data() returning:\n"
            "{\"name\": \"Steves\", \"age\": 28, \"skills\": [\"Python\", \"Django\", \"AI\"]}\n\n"
            "Print keys and values in readable format.\n"
            "Handle missing keys using try-except."
        ),
    ),
    (
        "python",
        "Q3: Longest Unique Substring",
        (
            "Write longest_unique_substring(s) that returns length of longest substring "
            "without repeating characters.\n\n"
            "Examples:\n"
            "longest_unique_substring(\"abcabcbb\") -> 3\n"
            "longest_unique_substring(\"bbbbb\") -> 1"
        ),
    ),
    (
        "python",
        "Q4: Keyword-Based Text Summarizer",
        (
            "Build a simple summarizer using only standard Python:\n"
            "- Accept paragraph input\n"
            "- Extract top 5 frequent keywords\n"
            "- Generate one-line summary from those keywords\n"
            "- No external libraries\n\n"
            "Example output format:\n"
            "Keywords: [...]\n"
            "Summary: ..."
        ),
    ),
    (
        "python",
        "Q5: Parse Server Logs",
        (
            "Given multiline logs in format [timestamp] [level] [message], do:\n"
            "1) Count INFO/ERROR/WARNING occurrences\n"
            "2) Extract all ERROR messages with timestamps\n"
            "3) Find most frequent level\n"
            "4) (Bonus) Build summary dict like {'INFO':2,'ERROR':2,'WARNING':1,'Most Frequent':'INFO'}"
        ),
    ),
    (
        "python",
        "Q6: GenAI Text Summarization (Gemini)",
        (
            "Use Gemini model to summarize a paragraph in 2-3 sentences.\n"
            "Use:\n"
            "import google.generativeai as genai\n"
            "genai.configure(api_key=\"YOUR_API_KEY\")\n"
            "model = genai.GenerativeModel('gemini-2.5-flash')\n\n"
            "Input example: AI is transforming industries...\n"
            "Output: concise 2-3 sentence summary."
        ),
    ),
    (
        "python",
        "Q7: GenAI Healthcare Startup Ideas",
        (
            "Use Gemini to design 5 high-impact AI healthcare startup ideas.\n"
            "For each idea include:\n"
            "1) one-line idea summary\n"
            "2) AI techniques/models used\n"
            "3) one ethical/privacy challenge + mitigation"
        ),
    ),
    (
        "python",
        "Q8: Explain AI Concepts with Analogy",
        (
            "Ask Gemini to compare supervised, unsupervised, self-supervised, and reinforcement learning "
            "using a real-world analogy (e.g., doctor learning diagnosis).\n"
            "Then identify best approach for:\n"
            "- early cancer detection from scans\n"
            "- patient readmission prediction\n"
            "- training a surgical robot\n"
            "Output should be clear and logically reasoned."
        ),
    ),
]


QUESTION_BANKS = {
    "intermediate": INTERMEDIATE_QUESTIONS,
    "fresher": FRESHER_QUESTIONS,
    "high": HIGH_QUESTIONS,
}


def seed_admins(db, admin_string: str):
    parts = [x.strip() for x in admin_string.split(",") if x.strip()]
    for item in parts:
        if ":" not in item:
            continue
        email, password = item.split(":", 1)
        exists = db.query(Admin).filter(Admin.email == email).first()
        if not exists:
            db.add(Admin(email=email, password_hash=hash_password(password)))
    db.commit()


def seed_app_settings(db, default_gemini_api_key: str):
    key = "gemini_api_key"
    exists = db.query(AppSetting).filter(AppSetting.key == key).first()
    if not exists:
        db.add(AppSetting(key=key, value=default_gemini_api_key))
        db.commit()


def seed_questions(db):
    existing_questions = db.query(Question).order_by(Question.level.asc(), Question.order_no.asc()).all()
    expected_signature = []
    for level, qs in QUESTION_BANKS.items():
        for qtype, title, _ in qs:
            expected_signature.append(f"{level}|{qtype}|{title}")

    existing_signature = [f"{q.level}|{q.qtype}|{q.title}" for q in existing_questions]
    if existing_signature == expected_signature and len(existing_questions) == len(expected_signature):
        return

    db.query(Submission).delete()
    db.query(Question).delete()

    for level, questions in QUESTION_BANKS.items():
        for i, (qtype, title, prompt) in enumerate(questions, start=1):
            db.add(Question(level=level, order_no=i, qtype=qtype, title=title, prompt=prompt))
    db.commit()
