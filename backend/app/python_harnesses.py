RESULT_MARKER = "__MACHINE_TEST_RESULTS__="

_HARNESS_PRELUDE = r'''
import builtins as _builtins
import json as _json

_test_results = []

def _record(_name, _input_text, _expected, _callback):
    try:
        _actual = _callback()
        _test_results.append({
            "name": _name,
            "input": _input_text,
            "passed": _actual == _expected,
            "expected": repr(_expected),
            "actual": repr(_actual),
            "error": None,
        })
    except Exception as _error:
        _test_results.append({
            "name": _name,
            "input": _input_text,
            "passed": False,
            "expected": repr(_expected),
            "actual": "No result",
            "error": f"{type(_error).__name__}: {_error}",
        })

def _missing(_name, _input_text, _expected, _message):
    _test_results.append({
        "name": _name,
        "input": _input_text,
        "passed": False,
        "expected": repr(_expected),
        "actual": "Function/class not found",
        "error": _message,
    })
'''

_HARNESS_EPILOGUE = r'''
_builtins.print("__MACHINE_TEST_RESULTS__=" + _json.dumps(_test_results, separators=(",", ":")))
'''

_TEST_BODIES = {
    "Two Sum": r'''
_fn = globals().get("two_sum") or globals().get("twoSum")
_cases = [
    ("Basic pair", "nums=[2,7,11,15], target=9", [0, 1], lambda: _fn([2,7,11,15], 9)),
    ("Pair in middle", "nums=[3,2,4], target=6", [1, 2], lambda: _fn([3,2,4], 6)),
    ("Duplicate values", "nums=[3,3], target=6", [0, 1], lambda: _fn([3,3], 6)),
]
if _fn is None:
    for _name, _input, _expected, _callback in _cases:
        _missing(_name, _input, _expected, "Define two_sum(nums, target).")
else:
    for _name, _input, _expected, _callback in _cases:
        _record(_name, _input, _expected, _callback)
''',
    "Valid Parentheses": r'''
_fn = globals().get("is_valid_parentheses") or globals().get("isValid")
_cases = [
    ("Mixed valid brackets", "s='()[]{}'", True, lambda: _fn("()[]{}")),
    ("Wrong closing order", "s='([)]'", False, lambda: _fn("([)]")),
    ("Nested valid brackets", "s='{[]}'", True, lambda: _fn("{[]}")),
]
if _fn is None:
    for _name, _input, _expected, _callback in _cases:
        _missing(_name, _input, _expected, "Define is_valid_parentheses(s).")
else:
    for _name, _input, _expected, _callback in _cases:
        _record(_name, _input, _expected, _callback)
''',
    "Rotate NxN Matrix 90 Degrees Clockwise": r'''
_fn = globals().get("rotate_matrix") or globals().get("rotate")
def _run_matrix(_matrix):
    _copy = [list(_row) for _row in _matrix]
    _value = _fn(_copy)
    return _copy if _value is None else _value
_cases = [
    ("Three by three", "[[1,2,3],[4,5,6],[7,8,9]]", [[7,4,1],[8,5,2],[9,6,3]], lambda: _run_matrix([[1,2,3],[4,5,6],[7,8,9]])),
    ("Two by two", "[[1,2],[3,4]]", [[3,1],[4,2]], lambda: _run_matrix([[1,2],[3,4]])),
    ("Single value", "[[5]]", [[5]], lambda: _run_matrix([[5]])),
]
if _fn is None:
    for _name, _input, _expected, _callback in _cases:
        _missing(_name, _input, _expected, "Define rotate_matrix(matrix).")
else:
    for _name, _input, _expected, _callback in _cases:
        _record(_name, _input, _expected, _callback)
''',
    "Remove Nth Node From End of List": r'''
_fn = globals().get("remove_nth_from_end") or globals().get("removeNthFromEnd")
_node = globals().get("ListNode")
def _run_linked(_items, _n):
    _dummy = _node(0)
    _current = _dummy
    for _item in _items:
        _current.next = _node(_item)
        _current = _current.next
    _head = _fn(_dummy.next, _n)
    _result = []
    while _head:
        _result.append(_head.val)
        _head = _head.next
    return _result
_cases = [
    ("Remove middle node", "head=[1,2,3,4,5], n=2", [1,2,3,5], lambda: _run_linked([1,2,3,4,5], 2)),
    ("Remove tail", "head=[1,2], n=1", [1], lambda: _run_linked([1,2], 1)),
    ("Remove only node", "head=[1], n=1", [], lambda: _run_linked([1], 1)),
]
if _fn is None or _node is None:
    for _name, _input, _expected, _callback in _cases:
        _missing(_name, _input, _expected, "Define ListNode and remove_nth_from_end(head, n).")
else:
    for _name, _input, _expected, _callback in _cases:
        _record(_name, _input, _expected, _callback)
''',
    "Longest Substring Without Repeating Characters": r'''
_fn = globals().get("longest_unique_substring") or globals().get("lengthOfLongestSubstring")
_cases = [
    ("Repeating sequence", "s='abcabcbb'", 3, lambda: _fn("abcabcbb")),
    ("Single repeated character", "s='bbbbb'", 1, lambda: _fn("bbbbb")),
    ("Empty string", "s=''", 0, lambda: _fn("")),
]
if _fn is None:
    for _name, _input, _expected, _callback in _cases:
        _missing(_name, _input, _expected, "Define longest_unique_substring(s).")
else:
    for _name, _input, _expected, _callback in _cases:
        _record(_name, _input, _expected, _callback)
''',
    "Check Anagrams Without Sorting": r'''
_fn = globals().get("are_anagrams") or globals().get("is_anagram") or globals().get("isAnagram")
_cases = [
    ("Simple anagram", "'listen', 'silent'", True, lambda: _fn("listen", "silent")),
    ("Not an anagram", "'hello', 'world'", False, lambda: _fn("hello", "world")),
    ("Spaces and case", "'A gentleman', 'Elegant man'", True, lambda: _fn("A gentleman", "Elegant man")),
]
if _fn is None:
    for _name, _input, _expected, _callback in _cases:
        _missing(_name, _input, _expected, "Define are_anagrams(s1, s2).")
else:
    for _name, _input, _expected, _callback in _cases:
        _record(_name, _input, _expected, _callback)
''',
    "Merge Tuple Key-Value Pairs": r'''
_fn = globals().get("merge_tuple_pairs") or globals().get("merge_tuples") or globals().get("merge_pairs")
_cases = [
    ("Duplicate key", "[('a',1),('b',2),('a',3)]", {"a":4,"b":2}, lambda: _fn([("a",1),("b",2),("a",3)])),
    ("Larger duplicate values", "[('x',5),('y',10),('x',15)]", {"x":20,"y":10}, lambda: _fn([("x",5),("y",10),("x",15)])),
    ("Empty input", "[]", {}, lambda: _fn([])),
]
if _fn is None:
    for _name, _input, _expected, _callback in _cases:
        _missing(_name, _input, _expected, "Define merge_tuple_pairs(items).")
else:
    for _name, _input, _expected, _callback in _cases:
        _record(_name, _input, _expected, _callback)
''',
    "Bubble Sort": r'''
_fn = globals().get("bubble_sort") or globals().get("bubbleSort")
def _run_sort(_items):
    _copy = list(_items)
    _value = _fn(_copy)
    return _copy if _value is None else _value
_cases = [
    ("Unsorted integers", "[64,34,25,12,22,11,90]", [11,12,22,25,34,64,90], lambda: _run_sort([64,34,25,12,22,11,90])),
    ("Floating values", "[5.5,3.3,2.2,4.4,1.1]", [1.1,2.2,3.3,4.4,5.5], lambda: _run_sort([5.5,3.3,2.2,4.4,1.1])),
    ("Already sorted", "[1,2,3]", [1,2,3], lambda: _run_sort([1,2,3])),
]
if _fn is None:
    for _name, _input, _expected, _callback in _cases:
        _missing(_name, _input, _expected, "Define bubble_sort(values).")
else:
    for _name, _input, _expected, _callback in _cases:
        _record(_name, _input, _expected, _callback)
''',
    "Search Insert Position": r'''
_fn = globals().get("search_insert") or globals().get("searchInsert")
_cases = [
    ("Target exists", "nums=[1,3,5,6], target=5", 2, lambda: _fn([1,3,5,6], 5)),
    ("Insert in middle", "nums=[1,3,5,6], target=2", 1, lambda: _fn([1,3,5,6], 2)),
    ("Insert at end", "nums=[1,3,5,6], target=7", 4, lambda: _fn([1,3,5,6], 7)),
]
if _fn is None:
    for _name, _input, _expected, _callback in _cases:
        _missing(_name, _input, _expected, "Define search_insert(nums, target).")
else:
    for _name, _input, _expected, _callback in _cases:
        _record(_name, _input, _expected, _callback)
''',
    "Rotate Array In Place": r'''
_fn = globals().get("rotate_array") or globals().get("rotate")
def _run_rotate(_items, _steps):
    _copy = list(_items)
    _value = _fn(_copy, _steps)
    return _copy if _value is None else _value
_cases = [
    ("Standard rotation", "nums=[1,2,3,4,5,6,7], k=3", [5,6,7,1,2,3,4], lambda: _run_rotate([1,2,3,4,5,6,7], 3)),
    ("Steps exceed length", "nums=[1,2,3], k=4", [3,1,2], lambda: _run_rotate([1,2,3], 4)),
    ("Zero steps", "nums=[1,2], k=0", [1,2], lambda: _run_rotate([1,2], 0)),
]
if _fn is None:
    for _name, _input, _expected, _callback in _cases:
        _missing(_name, _input, _expected, "Define rotate_array(nums, k).")
else:
    for _name, _input, _expected, _callback in _cases:
        _record(_name, _input, _expected, _callback)
''',
}


def get_test_harness(question_title: str | None) -> str | None:
    body = _TEST_BODIES.get(question_title or "")
    if not body:
        return None
    return _HARNESS_PRELUDE + body + _HARNESS_EPILOGUE
