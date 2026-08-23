import os
import json

from google import genai
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)


def analyze_mistake(
    question,
    student_answer,
    correct_answer,
    topic,
    dimension,
):
    prompt = f"""
You are an educational AI analyzing a student's mistake.

Topic:
{topic}

Learning dimension:
{dimension}

Question:
{question}

Student answer:
{student_answer}

Correct reference implementation:
{correct_answer}

Analyze the student's mistake.

Important evaluation rules:

- Judge the student's logic, not whether their code exactly matches the reference implementation.
- Variable names may be different and should not be considered a mistake.
- Equivalent implementations should be considered correct.
- Focus on the actual logical or conceptual problem.
- Do not invent a mistake if the implementation is logically equivalent.
- Explain the mistake in student-friendly language.


Return ONLY valid JSON with this exact structure:

{{
    "mistake_type": "one of: syntax_error, logic_error, concept_misunderstanding, range_error, variable_error, output_error, incomplete_solution",
    "weakness": {{
        "dimension": "one of: recall, explain, predict, implement, debug, apply",
        "skill": "one of: range_exclusive_upper_bound, even_number_range, loop_accumulation, python_syntax, loop_output, countdown_range, general_implementation"
    }},
    "explanation": "simple explanation of what went wrong",
    "misconception": "what the student appears to misunderstand",
    "hint": "one useful hint without giving the answer",
    "recommended_action": "what the student should practice next"
}}

Keep the explanation suitable for a student.
Do not be overly verbose.
"""

    response = client.models.generate_content(
    model="gemini-3.6-flash",
    contents=prompt,
)

    print("=== GEMINI RESPONSE ===")
    print(response)

    text = response.text.strip()

    print("=== GEMINI TEXT ===")
    print(text)

    # Remove markdown code fences if the model adds them
    if text.startswith("```"):
        text = text.replace("```json", "")
        text = text.replace("```", "")
        text = text.strip()

    return json.loads(text)