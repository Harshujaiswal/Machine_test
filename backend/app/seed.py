from .auth import hash_password
from .models import Admin, AppSetting, Candidate, Question, Submission


FRESHER_TEST_INSTRUCTIONS = (
    "Please read carefully:\n\n"
    "Attempt all 8 questions in the test.\n"
    "Questions 1-5 are Python problem-solving questions.\n"
    "Questions 6-8 are SQL questions and must use the provided employees dataset.\n"
    "Write clean, modular, and readable solutions.\n"
    "Do not use external files; every executable answer must run inside the platform.\n"
    "Use the Run Python or Run SQL button to verify your answers.\n"
    "Add print statements when you want to display additional Python output."
)

INTERMEDIATE_TEST_INSTRUCTIONS = (
    "Please read carefully:\n\n"
    "Attempt all 11 questions in the test.\n"
    "Questions 1-5 are Python problem-solving questions.\n"
    "Questions 6-8 are SQL questions and must use the provided employees dataset.\n"
    "Questions 9-11 are written Generative AI questions; no API key, LLM call, or executable code is required.\n"
    "Write clean, modular, and readable solutions for executable questions.\n"
    "For GenAI questions, provide clear and structured written answers.\n"
    "Do not use external files; every executable answer must run inside the platform."
)

HIGH_TEST_INSTRUCTIONS_V1 = (
    "Instructions:\n\n"
    "Attempt all 8 questions in this notebook itself.\n"
    "Questions 1-5 are Python-based.\n"
    "Questions 6-8 are AI (Generative AI) based and are equally important (if you know AI) - you must attempt them.\n"
    "Write clean, modular, and well-commented code.\n"
    "Do not use any external files - everything must run here.\n"
    "Use print statements or markdowns to display outputs clearly.\n"
    "If you have knowledge of AI (Generative AI), you are encouraged to attempt these as well - doing so is a plus point."
)


HIGH_TEST_INSTRUCTIONS_V3 = (
    "Instructions:\n\n"
    "Attempt all 10 questions in the test.\n"
    "Questions 1-5 are practical Python questions.\n"
    "Questions 6-7 are SQL questions and should be executed using the provided employees dataset.\n"
    "Questions 8-10 are Generative AI questions and are equally important if you know GenAI.\n"
    "Write clean, modular, and well-commented solutions.\n"
    "Do not use external files; every executable answer must run inside the platform.\n"
    "Use clear output and explain important assumptions where required."
)

HIGH_TEST_INSTRUCTIONS_V4 = (
    "Instructions:\n\n"
    "Attempt all 11 questions in the test.\n"
    "Questions 1-5 are practical Python questions.\n"
    "Questions 6-8 are SQL questions and should be executed using the provided employees dataset.\n"
    "Questions 9-11 are Generative AI questions and are equally important if you know GenAI.\n"
    "Write clean, modular, and well-commented solutions.\n"
    "Do not use external files; every executable answer must run inside the platform.\n"
    "Use clear output and explain important assumptions where required."
)

HIGH_TEST_INSTRUCTIONS = (
    "Instructions:\n\n"
    "Attempt all 11 questions in the test.\n"
    "Questions 1-5 are practical Python questions.\n"
    "Questions 6-8 are SQL questions and should be executed using the provided employees dataset.\n"
    "Questions 9-11 are written Generative AI questions. No API key, LLM call, or executable code is required.\n"
    "Write clean, modular, and well-commented solutions for executable questions.\n"
    "For GenAI questions, provide structured, production-focused answers and clearly state assumptions.\n"
    "Do not use external files; every executable answer must run inside the platform."
)

INTERMEDIATE_QUESTIONS_V1 = [
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


INTERMEDIATE_QUESTIONS_V2 = [
    (
        "python",
        "Valid Parentheses",
        (
            "Write a function is_valid_parentheses(s) that determines whether a string containing only "
            "the characters (), {}, and [] is valid.\n\n"
            "A string is valid when:\n"
            "- Every opening bracket is closed by the same type of bracket.\n"
            "- Brackets are closed in the correct order.\n"
            "- Every closing bracket has a corresponding opening bracket.\n\n"
            "Examples:\n"
            "s = \"()\" -> True\n"
            "s = \"()[]{}\" -> True\n"
            "s = \"(]\" -> False\n"
            "s = \"([)]\" -> False\n"
            "s = \"{[]}\" -> True\n\n"
            "Constraints:\n"
            "- 1 <= len(s) <= 10^4\n"
            "- Target time complexity: O(n)"
        ),
    ),
    (
        "python",
        "Rotate NxN Matrix 90 Degrees Clockwise",
        (
            "Write a function rotate_matrix(matrix) that rotates an n x n matrix 90 degrees clockwise.\n"
            "Modify the input matrix in place and do not allocate another n x n matrix.\n\n"
            "Example:\n"
            "Input: [[1,2,3],[4,5,6],[7,8,9]]\n"
            "Output: [[7,4,1],[8,5,2],[9,6,3]]\n\n"
            "Constraints:\n"
            "- 1 <= n <= 20\n"
            "- -1000 <= matrix[i][j] <= 1000\n"
            "- Extra space should be O(1), excluding loop variables"
        ),
    ),
    (
        "python",
        "Remove Nth Node From End of List",
        (
            "Given the head of a singly linked list and an integer n, remove the nth node from the end "
            "and return the updated head.\n\n"
            "Examples:\n"
            "head = [1,2,3,4,5], n = 2 -> [1,2,3,5]\n"
            "head = [1,2], n = 1 -> [1]\n"
            "head = [1], n = 1 -> []\n\n"
            "Constraints:\n"
            "- 1 <= number of nodes <= 30\n"
            "- 0 <= Node.val <= 100\n"
            "- 1 <= n <= number of nodes\n\n"
            "Requirement:\n"
            "- Solve it in one traversal using two pointers.\n"
            "- Target time: O(n), extra space: O(1)"
        ),
    ),
    (
        "python",
        "Longest Substring Without Repeating Characters",
        (
            "Write a function longest_unique_substring(s) that returns the length of the longest contiguous "
            "substring containing no repeated characters.\n\n"
            "Examples:\n"
            "s = \"abcabcbb\" -> 3\n"
            "s = \"bbbbb\" -> 1\n"
            "s = \"pwwkew\" -> 3\n"
            "s = \"\" -> 0\n\n"
            "Note: The answer must be a substring, not a subsequence.\n\n"
            "Constraints:\n"
            "- 0 <= len(s) <= 5 * 10^4\n"
            "- s may contain letters, digits, spaces, and symbols\n"
            "- Target time complexity: O(n)"
        ),
    ),
    (
        "python",
        "Generate Parentheses",
        (
            "Given n pairs of parentheses, write a function generate_parentheses(n) that returns every "
            "valid combination of well-formed parentheses.\n\n"
            "Examples:\n"
            "n = 3 -> [\"((()))\", \"(()())\", \"(())()\", \"()(())\", \"()()()\"]\n"
            "n = 1 -> [\"()\"]\n\n"
            "Constraints:\n"
            "- 1 <= n <= 8\n"
            "- The combinations may be returned in any order\n\n"
            "Requirement:\n"
            "- Use backtracking and stop invalid partial combinations early.\n"
            "- Do not generate every possible 2^(2n) string and filter afterward"
        ),
    ),
] + INTERMEDIATE_QUESTIONS_V1[5:]

INTERMEDIATE_QUESTIONS_V3 = INTERMEDIATE_QUESTIONS_V2[:5] + [
    (
        "sql",
        "Department Salary Summary",
        (
            "Using the employees table, write a SQL query that returns one row for each department.\n\n"
            "Table: employees(employee_id, employee_name, department_id, salary, age, joining_date)\n\n"
            "Return these columns:\n"
            "- department_id\n"
            "- employee_count: number of employees in the department\n"
            "- total_salary: total salary paid by the department\n"
            "- average_salary: average salary in the department\n\n"
            "Order the result by department_id in ascending order."
        ),
    ),
    (
        "sql",
        "Employees Earning Above Department Average",
        (
            "Using the employees table, find employees whose salary is greater than the average salary "
            "of their own department.\n\n"
            "Table: employees(employee_id, employee_name, department_id, salary, age, joining_date)\n\n"
            "Return these columns:\n"
            "- employee_id\n"
            "- employee_name\n"
            "- department_id\n"
            "- salary\n"
            "- department_average_salary\n\n"
            "Order the result by department_id and then salary in descending order. "
            "You may use a subquery or a common table expression (CTE)."
        ),
    ),
    (
        "sql",
        "Second Highest Salary in Each Department",
        (
            "Using the employees table, find the employee or employees receiving the second-highest "
            "distinct salary in each department.\n\n"
            "Table: employees(employee_id, employee_name, department_id, salary, age, joining_date)\n\n"
            "Return these columns:\n"
            "- department_id\n"
            "- employee_id\n"
            "- employee_name\n"
            "- salary\n\n"
            "If multiple employees share the second-highest salary, include all of them. Departments "
            "without a second distinct salary should not appear. Use a CTE and DENSE_RANK() window function. "
            "Order the result by department_id and employee_id."
        ),
    ),
] + INTERMEDIATE_QUESTIONS_V1[8:]

INTERMEDIATE_QUESTIONS_V4 = INTERMEDIATE_QUESTIONS_V3[:8] + [
    (
        "theory",
        "Design a Reliable Prompt for Support Ticket Classification",
        (
            "A customer-support team wants an LLM to classify incoming support messages. Write the complete "
            "prompt you would send to the model. Do not write API integration code.\n\n"
            "The model must return only valid JSON with these fields:\n"
            "- category: billing, technical, account, feedback, or other\n"
            "- priority: low, medium, or high\n"
            "- sentiment: positive, neutral, or negative\n"
            "- summary: one concise sentence\n\n"
            "Your prompt should include:\n"
            "- A clear role and task\n"
            "- Classification rules and output constraints\n"
            "- Instructions for missing or ambiguous information\n"
            "- Rules that prevent the model from inventing facts\n"
            "- At least two input/output examples\n"
            "- A placeholder showing where the actual support message will be inserted"
        ),
    ),
    (
        "theory",
        "Design a RAG System for a 200-Page PDF",
        (
            "Design a production-ready Retrieval-Augmented Generation (RAG) system in which a user uploads "
            "a 200-page PDF and asks questions about it. Explain the complete flow step by step.\n\n"
            "Cover these areas:\n"
            "- PDF ingestion, text extraction, and OCR for scanned pages\n"
            "- Cleaning, chunking strategy, overlap, and metadata\n"
            "- Embedding generation and vector database selection\n"
            "- Retrieval, optional reranking, and prompt construction\n"
            "- Generating answers with page-level citations\n"
            "- Reducing hallucinations and handling 'answer not found' cases\n"
            "- Suggested libraries/services and API architecture\n"
            "- Evaluation, security, document updates, and failure handling\n\n"
            "A diagram or structured text flow may be used. No executable code is required."
        ),
    ),
    (
        "theory",
        "Debug and Evaluate a Production LLM Assistant",
        (
            "A production LLM assistant sometimes gives incorrect answers, responds slowly, costs too much, "
            "and may receive sensitive user information. Explain how you would improve the system.\n\n"
            "Your answer should cover:\n"
            "- How you would identify whether failures come from prompts, retrieval, data, or the model\n"
            "- A representative evaluation dataset and relevant quality metrics\n"
            "- Methods for measuring correctness, relevance, groundedness, and hallucination rate\n"
            "- Prompt improvements, retrieval improvements, and fallback behavior\n"
            "- Guardrails, prompt-injection defense, and PII/privacy protection\n"
            "- Logging, monitoring, human review, and user-feedback loops\n"
            "- Practical ways to reduce latency and cost without significantly reducing quality\n\n"
            "Provide a structured, production-focused answer. No API key or executable code is required."
        ),
    ),
]

INTERMEDIATE_QUESTIONS_V6 = [
    (
        "python",
        "Two Sum",
        (
            "Given a list of integers nums and an integer target, return the indices of the two numbers whose "
            "sum equals target.\n\n"
            "Examples:\n"
            "nums = [2,7,11,15], target = 9 -> [0,1]\n"
            "nums = [3,2,4], target = 6 -> [1,2]\n"
            "nums = [3,3], target = 6 -> [0,1]\n\n"
            "Constraints:\n"
            "- 2 <= len(nums) <= 10^4\n"
            "- Exactly one valid answer exists\n"
            "- Do not use the same element twice\n"
            "- Target time complexity: O(n)"
        ),
    ),
] + INTERMEDIATE_QUESTIONS_V4[:4] + [
    (
        "sql",
        "Employees Earning More Than 50000",
        (
            "Using the employees table, find all employees whose salary is greater than 50000.\n\n"
            "Table: employees(employee_id, employee_name, department_id, salary, age, joining_date)\n\n"
            "Return these columns:\n"
            "- employee_id\n"
            "- employee_name\n"
            "- department_id\n"
            "- salary\n\n"
            "Order the result by salary in descending order and employee_id in ascending order when salaries are equal."
        ),
    ),
] + INTERMEDIATE_QUESTIONS_V4[5:7] + [
    (
        "theory",
        "Improve a Weak LLM Prompt",
        (
            "A user gives an LLM this prompt:\n\n"
            "Summarize this document.\n\n"
            "Rewrite it as a clear and reliable prompt for summarizing a technical document. The improved prompt "
            "should specify the model's role, target audience, required length, important content to preserve, "
            "information it must not invent, and a structured output format.\n\n"
            "After writing the improved prompt, briefly explain at least four changes you made and why each change "
            "should improve the response. No API call or executable code is required."
        ),
    ),
] + INTERMEDIATE_QUESTIONS_V4[8:10]

# V5 was briefly released with 14 questions. Keep it immutable for submitted tests.
INTERMEDIATE_QUESTIONS_V5 = (
    INTERMEDIATE_QUESTIONS_V6[:5]
    + [INTERMEDIATE_QUESTIONS_V4[4]]
    + INTERMEDIATE_QUESTIONS_V6[5:8]
    + [INTERMEDIATE_QUESTIONS_V4[7]]
    + INTERMEDIATE_QUESTIONS_V6[8:]
    + [INTERMEDIATE_QUESTIONS_V4[10]]
)
INTERMEDIATE_QUESTIONS = INTERMEDIATE_QUESTIONS_V6

FRESHER_QUESTIONS_V1 = [
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


FRESHER_QUESTIONS_V2 = [
    (
        "python",
        "Check Anagrams Without Sorting",
        (
            "Write a Python function that checks whether two strings are anagrams of each other.\n"
            "Ignore spaces and letter case, and consider only alphabetic characters.\n\n"
            "Restrictions:\n"
            "- Do not use sort() or sorted().\n"
            "- Do not use lower() or upper().\n\n"
            "Examples:\n"
            "s1 = \"listen\", s2 = \"silent\" -> True\n"
            "s1 = \"hello\", s2 = \"world\" -> False\n"
            "s1 = \"Listen\", s2 = \"Silent\" -> True\n"
            "s1 = \"A gentleman\", s2 = \"Elegant man\" -> True"
        ),
    ),
    (
        "python",
        "Merge Tuple Key-Value Pairs",
        (
            "Write a Python function that converts a list of (key, value) tuples into one dictionary.\n"
            "If a key appears more than once, add all values associated with that key.\n\n"
            "Examples:\n"
            "[(\"a\", 1), (\"b\", 2), (\"a\", 3)] -> {\"a\": 4, \"b\": 2}\n"
            "[(\"x\", 5), (\"y\", 10), (\"x\", 15)] -> {\"x\": 20, \"y\": 10}"
        ),
    ),
    (
        "python",
        "Bubble Sort",
        (
            "Implement Bubble Sort without using Python's built-in sort() or sorted().\n"
            "Repeatedly compare adjacent values and swap them when they are in the wrong order.\n\n"
            "Input: a list of integers or floats.\n"
            "Output: the same values sorted in ascending order.\n\n"
            "Examples:\n"
            "[64, 34, 25, 12, 22, 11, 90] -> [11, 12, 22, 25, 34, 64, 90]\n"
            "[5.5, 3.3, 2.2, 4.4, 1.1] -> [1.1, 2.2, 3.3, 4.4, 5.5]"
        ),
    ),
    (
        "python",
        "Search Insert Position",
        (
            "Given a sorted list of distinct integers nums and an integer target, return the target index "
            "if it exists. Otherwise, return the index where target should be inserted to keep nums sorted.\n\n"
            "Your algorithm must run in O(log n) time.\n\n"
            "Examples:\n"
            "nums = [1, 3, 5, 6], target = 5 -> 2\n"
            "nums = [1, 3, 5, 6], target = 2 -> 1\n"
            "nums = [1, 3, 5, 6], target = 7 -> 4\n\n"
            "Constraints:\n"
            "- 1 <= len(nums) <= 10^4\n"
            "- -10^4 <= nums[i], target <= 10^4\n"
            "- nums contains distinct values sorted in ascending order"
        ),
    ),
    (
        "python",
        "Rotate Array In Place",
        (
            "Given an integer list nums, rotate it to the right by k steps, where k is non-negative.\n"
            "Modify nums in place and use O(1) extra space.\n\n"
            "Examples:\n"
            "nums = [1, 2, 3, 4, 5, 6, 7], k = 3 -> [5, 6, 7, 1, 2, 3, 4]\n"
            "nums = [-1, -100, 3, 99], k = 2 -> [3, 99, -1, -100]\n\n"
            "Constraints:\n"
            "- 1 <= len(nums) <= 10^5\n"
            "- -2^31 <= nums[i] <= 2^31 - 1\n"
            "- 0 <= k <= 10^5"
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

FRESHER_QUESTIONS = FRESHER_QUESTIONS_V2[:5] + [
    (
        "sql",
        "SQL Easy: Filter and Sort Employees",
        (
            "Difficulty: Easy\n\n"
            "Table: employees(employee_id, employee_name, department_id, salary, age)\n\n"
            "Write a SQL query to return employee_id, employee_name, and salary for employees "
            "who earn more than 50000 and are at least 25 years old.\n\n"
            "Requirements:\n"
            "- Sort the result by salary from highest to lowest.\n"
            "- If two salaries are equal, sort by employee_id in ascending order."
        ),
    ),
    (
        "sql",
        "SQL Moderate: Department Salary Summary",
        (
            "Difficulty: Moderate\n\n"
            "Table: employees(employee_id, employee_name, department_id, salary, age)\n\n"
            "Write a SQL query that returns one row per department with these columns:\n"
            "- department_id\n"
            "- employee_count\n"
            "- average_salary rounded to 2 decimal places\n"
            "- highest_salary\n\n"
            "Requirements:\n"
            "- Include only departments whose average salary is greater than 50000.\n"
            "- Sort by average_salary descending, then department_id ascending.\n"
            "- Use GROUP BY, aggregate functions, and HAVING."
        ),
    ),
    (
        "sql",
        "SQL High: Top Earners with Department Analytics",
        (
            "Difficulty: High\n\n"
            "Table: employees(employee_id, employee_name, department_id, salary, age)\n\n"
            "Using a CTE and window functions, return the top two salary ranks from every department.\n"
            "Employees with equal salaries must receive the same rank.\n\n"
            "Return these columns:\n"
            "- employee_id\n"
            "- employee_name\n"
            "- department_id\n"
            "- salary\n"
            "- salary_rank within the department\n"
            "- department_average_salary rounded to 2 decimal places\n"
            "- salary_difference_from_department_average rounded to 2 decimal places\n\n"
            "Requirements:\n"
            "- Use DENSE_RANK() partitioned by department_id.\n"
            "- Use AVG() as a window function for the department average.\n"
            "- Keep rows where salary_rank is 1 or 2.\n"
            "- Sort by department_id, salary_rank, then employee_id."
        ),
    ),
]

HIGH_QUESTIONS_V1 = [
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


HIGH_QUESTIONS_V2 = [
    (
        "python",
        "LRU Cache Implementation",
        (
            "Implement an LRUCache class that stores key-value pairs with a fixed capacity.\n\n"
            "Required methods:\n"
            "- LRUCache(capacity): initialize the cache\n"
            "- get(key): return the value when the key exists, otherwise return -1\n"
            "- put(key, value): insert or update a value; when capacity is exceeded, remove the least "
            "recently used item\n\n"
            "Both get() and put() must run in O(1) average time. Implement the solution using a hash map "
            "and a doubly linked list. Do not use OrderedDict or an external caching library.\n\n"
            "Example:\n"
            "cache = LRUCache(2)\n"
            "cache.put(1, 10)\n"
            "cache.put(2, 20)\n"
            "cache.get(1) -> 10\n"
            "cache.put(3, 30)  # evicts key 2\n"
            "cache.get(2) -> -1\n\n"
            "Constraints:\n"
            "- 1 <= capacity <= 1000\n"
            "- At most 10^4 get/put operations"
        ),
    ),
    HIGH_QUESTIONS_V1[1],
    (
        "python",
        "Configurable Retry Decorator",
        (
            "Write a reusable retry decorator for functions that may fail temporarily.\n\n"
            "Create retry(max_attempts, exceptions, backoff_factor, sleeper), where:\n"
            "- max_attempts is the total number of allowed attempts\n"
            "- exceptions is a tuple of exception types that may be retried\n"
            "- backoff_factor controls exponential delay between retries\n"
            "- sleeper is an injectable function used for waiting, so tests can avoid real delays\n\n"
            "Requirements:\n"
            "- Preserve positional arguments, keyword arguments, return values, and function metadata\n"
            "- Retry only the configured exception types\n"
            "- Re-raise the final exception after all attempts fail\n"
            "- Before retry number n, call sleeper(backoff_factor * 2 ** (n - 1))\n"
            "- Use functools.wraps\n\n"
            "Include a short example with a function that fails twice and succeeds on the third attempt."
        ),
    ),
    HIGH_QUESTIONS_V1[3],
    HIGH_QUESTIONS_V1[4],
] + HIGH_QUESTIONS_V1[5:]

HIGH_QUESTIONS_V3 = HIGH_QUESTIONS_V2[:5] + [
    (
        "sql",
        "Department Salary Band Summary",
        (
            "Using the employees table, create a department-wise payroll summary with conditional aggregation.\n\n"
            "Table: employees(employee_id, employee_name, department_id, salary, age, joining_date)\n\n"
            "Return these columns:\n"
            "- department_id\n"
            "- employee_count\n"
            "- below_50k_count: employees with salary below 50000\n"
            "- from_50k_to_59999_count: employees with salary from 50000 through 59999\n"
            "- at_least_60k_count: employees with salary of 60000 or more\n"
            "- total_salary\n"
            "- average_salary rounded to two decimal places\n\n"
            "Use GROUP BY with CASE expressions and order the result by department_id."
        ),
    ),
    (
        "sql",
        "Employee Salary Analytics with Window Functions",
        (
            "Using the employees table, produce a salary analytics report for every employee.\n\n"
            "Table: employees(employee_id, employee_name, department_id, salary, age, joining_date)\n\n"
            "Return these columns:\n"
            "- department_id\n"
            "- employee_id\n"
            "- employee_name\n"
            "- salary\n"
            "- salary_rank: dense salary rank within the department, highest salary ranked first\n"
            "- department_average_salary\n"
            "- difference_from_department_average\n"
            "- department_payroll_percentage: employee salary as a percentage of department payroll, rounded "
            "to two decimal places\n\n"
            "Use window functions rather than separate queries. Order the final result by department_id, "
            "salary_rank, and employee_id."
        ),
    ),
] + HIGH_QUESTIONS_V2[5:]

HIGH_QUESTIONS_V4 = HIGH_QUESTIONS_V3[:5] + [
    (
        "sql",
        "Filter and Sort Employees",
        (
            "Using the employees table, find employees who earn at least 50000 and are younger than 35.\n\n"
            "Table: employees(employee_id, employee_name, department_id, salary, age, joining_date)\n\n"
            "Return these columns:\n"
            "- employee_id\n"
            "- employee_name\n"
            "- department_id\n"
            "- salary\n"
            "- age\n\n"
            "Order the result by salary in descending order and employee_id in ascending order when salaries are equal."
        ),
    ),
] + HIGH_QUESTIONS_V3[5:]

HIGH_QUESTIONS = HIGH_QUESTIONS_V4[:8] + [
    (
        "theory",
        "Design a Prompt for Structured Resume Extraction",
        (
            "A recruitment team wants an LLM to extract reliable information from candidate resumes. Write "
            "the complete prompt you would give the model. Do not write API integration code.\n\n"
            "The model must return only valid JSON containing:\n"
            "- candidate_name\n"
            "- total_experience_years\n"
            "- primary_skills\n"
            "- employment_history with company, role, and duration\n"
            "- education\n"
            "- missing_information\n\n"
            "Your prompt should define the model's role, extraction rules, output schema, handling of missing "
            "or conflicting details, and instructions not to invent information. Include at least two short "
            "input/output examples and defend against instructions embedded inside the resume text."
        ),
    ),
    (
        "theory",
        "Design a Tool-Using Customer Support AI Agent",
        (
            "Design an AI agent that receives a customer issue, checks account and order information, searches "
            "a knowledge base, proposes a resolution, and escalates to a human when necessary. No executable "
            "code is required.\n\n"
            "Explain:\n"
            "- The agent workflow and decision steps\n"
            "- Tools/functions and the input/output schema for each tool\n"
            "- System prompt, conversation state, and short-term memory\n"
            "- Tool selection, retries, timeouts, and fallback behavior\n"
            "- Actions that require user confirmation or human approval\n"
            "- Prompt-injection defense, authorization, audit logs, and protection of customer data\n"
            "- How you would test whether the agent selects tools and resolves tickets correctly"
        ),
    ),
    (
        "theory",
        "Design a Scalable Audio Meeting Intelligence System",
        (
            "Design a production system where users upload long meeting recordings and receive a transcript, "
            "speaker-wise summary, decisions, and action items. The system should support large files and "
            "multiple concurrent users. No executable code is required.\n\n"
            "Explain the complete architecture, including:\n"
            "- Secure upload, object storage, validation, and asynchronous job processing\n"
            "- Audio preprocessing, speech-to-text, timestamps, and speaker diarization\n"
            "- Transcript cleaning, chunking, and hierarchical LLM summarization\n"
            "- Extraction of decisions, owners, deadlines, and action items with source timestamps\n"
            "- APIs, queues, workers, database schema, status tracking, and retry/idempotency strategy\n"
            "- Evaluation of transcription and summary quality\n"
            "- Privacy, retention, access control, observability, latency, and cost optimization\n\n"
            "Provide a structured architecture and explain important trade-offs."
        ),
    ),
]

CURRENT_QUESTION_VERSIONS = {
    "intermediate": 6,
    "fresher": 3,
    "high": 5,
}

QUESTION_BANKS = {
    ("intermediate", 1): INTERMEDIATE_QUESTIONS_V1,
    ("intermediate", 2): INTERMEDIATE_QUESTIONS_V2,
    ("intermediate", 3): INTERMEDIATE_QUESTIONS_V3,
    ("intermediate", 4): INTERMEDIATE_QUESTIONS_V4,
    ("intermediate", 5): INTERMEDIATE_QUESTIONS_V5,
    ("intermediate", 6): INTERMEDIATE_QUESTIONS,
    ("fresher", 1): FRESHER_QUESTIONS_V1,
    ("fresher", 2): FRESHER_QUESTIONS_V2,
    ("fresher", 3): FRESHER_QUESTIONS,
    ("high", 1): HIGH_QUESTIONS_V1,
    ("high", 2): HIGH_QUESTIONS_V2,
    ("high", 3): HIGH_QUESTIONS_V3,
    ("high", 4): HIGH_QUESTIONS_V4,
    ("high", 5): HIGH_QUESTIONS,
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


def _migrate_pending_intermediate_v5_candidates(db):
    """Move unfinished 14-question tests to the corrected 11-question V6 set."""
    candidates = (
        db.query(Candidate)
        .filter(
            Candidate.test_level == "intermediate",
            Candidate.question_set_version == 5,
            Candidate.is_submitted.is_(False),
        )
        .all()
    )
    if not candidates:
        return

    target_questions = {
        question.title: question
        for question in db.query(Question)
        .filter(
            Question.level == "intermediate",
            Question.question_set_version == 6,
        )
        .all()
    }

    for candidate in candidates:
        existing_submissions = (
            db.query(Submission)
            .filter(Submission.candidate_id == candidate.id)
            .all()
        )
        target_question_ids = {
            submission.question_id
            for submission in existing_submissions
            if submission.question_id in {q.id for q in target_questions.values()}
        }

        for submission in existing_submissions:
            source_question = db.query(Question).filter(Question.id == submission.question_id).first()
            target_question = target_questions.get(source_question.title) if source_question else None
            if not target_question or target_question.id in target_question_ids:
                continue
            db.add(
                Submission(
                    candidate_id=candidate.id,
                    question_id=target_question.id,
                    answer_text=submission.answer_text,
                )
            )
            target_question_ids.add(target_question.id)

        candidate.question_set_version = 6

    db.commit()

def seed_questions(db):
    existing_questions = db.query(Question).all()
    existing_by_key = {
        (q.level, q.question_set_version or 1, q.title): q
        for q in existing_questions
    }

    for (level, version), questions in QUESTION_BANKS.items():
        for order_no, (qtype, title, prompt) in enumerate(questions, start=1):
            key = (level, version, title)
            existing = existing_by_key.get(key)
            if existing:
                existing.order_no = order_no
                existing.qtype = qtype
                existing.prompt = prompt
                continue

            db.add(
                Question(
                    level=level,
                    question_set_version=version,
                    order_no=order_no,
                    qtype=qtype,
                    title=title,
                    prompt=prompt,
                )
            )

    _migrate_pending_intermediate_v5_candidates(db)

    # Old question rows are intentionally retained because submissions reference them.
    db.commit()