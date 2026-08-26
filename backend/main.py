import json
import time
from pwdlib import PasswordHash

password_hash = PasswordHash.recommended()
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import subprocess
import tempfile
import os
import models
from database import engine, get_db
from ai_analysis import analyze_mistake
from pydantic import BaseModel
from collections import OrderedDict

# ============================================================
# DATABASE
# ============================================================

models.Base.metadata.create_all(bind=engine)
try:
    with engine.connect() as connection:
        print("DATABASE CONNECTION: OK")
except Exception as error:
    print("DATABASE CONNECTION FAILED:")
    print(repr(error))

# ============================================================
# APP
# ============================================================

app = FastAPI(title="LearnLens API")

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://learnlens-eight.vercel.app",
]

frontend_url = os.getenv("FRONTEND_URL")

if frontend_url:
    frontend_url = frontend_url.strip().rstrip("/")

    if frontend_url and frontend_url not in ALLOWED_ORIGINS:
        ALLOWED_ORIGINS.append(frontend_url)

print("CORS allowed origins:", ALLOWED_ORIGINS)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# LEARNING FRAMEWORK
#
# These are the dimensions supported by LearnLens.
# They are NOT tied to a particular topic.
# ============================================================

DIMENSIONS = [
    "recall",
    "explain",
    "predict",
    "implement",
    "debug",
    "apply",
]
SUPPORTED_QUESTION_TYPES = [
    "mcq",
    "qna",
    "code"
]

# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():
    return {
        "message": "LearnLens API is running"
    }

# ============================================================
# MISTAKE HISTORY
# ============================================================

def record_mistake(
    student_id: str,
    concept: str,
    dimension: str,
    question_type: str,
    question_id: str = None,
    mistake_type: str = None,
    mistake_detail: str = None,
    db: Session = None,
):
    """
    Common mistake recorder.

    Used by:
        MCQ
        Q&A
        Code

    Used across:
        recall
        explain
        predict
        implement
        debug
        apply
    """

    existing = (
        db.query(models.MistakeHistory)
        .filter(
            models.MistakeHistory.student_id == str(student_id),
            models.MistakeHistory.concept == str(concept),
            models.MistakeHistory.dimension == str(dimension),
            models.MistakeHistory.question_type == str(question_type),
            models.MistakeHistory.question_id == question_id,
            models.MistakeHistory.mistake_type == mistake_type,
        )
        .first()
    )

    # --------------------------------------------------------
    # SAME MISTAKE ALREADY EXISTS
    # --------------------------------------------------------

    if existing:

        existing.count += 1

        if mistake_detail:
            existing.mistake_detail = mistake_detail

        db.commit()
        db.refresh(existing)

        return existing

    # --------------------------------------------------------
    # NEW MISTAKE
    # --------------------------------------------------------

    new_mistake = models.MistakeHistory(
        student_id=str(student_id),
        concept=str(concept),
        dimension=str(dimension),
        question_type=str(question_type),
        question_id=question_id,
        mistake_type=mistake_type,
        mistake_detail=mistake_detail,
        count=1,
    )

    db.add(new_mistake)
    db.commit()
    db.refresh(new_mistake)

    return new_mistake

# ============================================================
# VALIDATION HELPERS
# ============================================================

def require_student_id(attempt: dict):
    student_id = attempt.get("student_id")

    if not student_id:
        raise HTTPException(
            status_code=400,
            detail="student_id is required"
        )

    return str(student_id).strip()


def require_concept(attempt: dict):
    concept = (
        attempt.get("concept")
        or attempt.get("topic")
    )

    if not concept:
        raise HTTPException(
            status_code=400,
            detail="concept or topic is required"
        )

    return str(concept).strip()

def require_dimension(attempt: dict):
    dimension = attempt.get("dimension")

    if not dimension:
        raise HTTPException(
            status_code=400,
            detail="dimension is required"
        )

    dimension = str(dimension).strip().lower()

    if dimension not in DIMENSIONS:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Unknown learning dimension",
                "received": dimension,
                "supported_dimensions": DIMENSIONS
            }
        )

    return dimension


# ============================================================
# FINGERPRINT CALCULATION
# ============================================================

def calculate_knowledge_fingerprint(
    student_id,
    concept,
    db
):
    REQUIRED_QUESTIONS = 6

    attempts = (
        db.query(models.LearningAttempt)
        .filter(
            models.LearningAttempt.student_id == student_id
        )
        .filter(
            models.LearningAttempt.concept == concept
        )
        .all()
    )

    fingerprint = {
        dimension: {
            "score": 0,
            "correct": 0,
            "total": 0,
            "answered_count": 0,
            "completed_count": 0,
            "mastered_count": 0,
            "question_count": REQUIRED_QUESTIONS,
        }
        for dimension in DIMENSIONS
    }

    for dimension in DIMENSIONS:

        dimension_attempts = [
            attempt
            for attempt in attempts
            if attempt.dimension == dimension
        ]

        # ----------------------------------------------------
        # BEST SCORE FOR EACH QUESTION
        # ----------------------------------------------------

        best_scores = {}

        for attempt in dimension_attempts:

            if not attempt.question_id:
                continue

            question_id = str(attempt.question_id)

            score = (
                float(attempt.score)
                if attempt.score is not None
                else 0
            )

            previous = best_scores.get(question_id)

            if previous is None or score > previous:
                best_scores[question_id] = score

       # ----------------------------------------------------
        # HOW MANY UNIQUE QUESTIONS WERE ANSWERED?
        # ----------------------------------------------------

        answered_count = min(
            len(best_scores),
            REQUIRED_QUESTIONS
        )

        # ----------------------------------------------------
        # CORRECT / MASTERED QUESTIONS
        #
        # A question is mastered only when its BEST score
        # reaches the mastery threshold.
        # ----------------------------------------------------

        mastered_count = min(
            sum(
                1
                for score in best_scores.values()
                if score >= 80
            ),
            REQUIRED_QUESTIONS
        )

        # ----------------------------------------------------
        # COMPLETED PROGRESS
        #
        # IMPORTANT:
        # "completed" means MASTERED here.
        #
        # Answered-but-wrong questions are NOT completed.
        # ----------------------------------------------------

        completed_count = mastered_count

        # ----------------------------------------------------
        # COMPLETED PROGRESS
        #
        # IMPORTANT:
        # "completed" means MASTERED here.
        #
        # Answered-but-wrong questions are NOT completed.
        # ----------------------------------------------------

        completed_count = mastered_count

        # ----------------------------------------------------
        # PROGRESS SCORE
        #
        # 1 / 6 = 16.67 -> 17
        # 2 / 6 = 33.33 -> 33
        # etc.
        # ----------------------------------------------------

        progress_score = round(
            completed_count / REQUIRED_QUESTIONS * 100
        )

        fingerprint[dimension] = {

            # IMPORTANT:
            # This is now PROGRESS, not average answer score.
            "score": progress_score,

            "correct": mastered_count,

            # Fixed denominator
            "total": REQUIRED_QUESTIONS,

            # Number actually answered
            "answered_count": answered_count,

            # Number completed out of the required 6
            "completed_count": completed_count,

            "mastered_count": mastered_count,

            # Always 6
            "question_count": REQUIRED_QUESTIONS,
        }

    return fingerprint

# ============================================================
# FIND CURRENT WEAKNESS
# ============================================================

def choose_next_dimension(
    fingerprint: dict,
    recent_attempts: list
):
    """
    Choose the next learning dimension adaptively.

    Priority:
    1. Unattempted dimensions
    2. Weak dimensions
    3. Recent poor performance
    4. Otherwise advance
    """

    # --------------------------------------------------------
    # 1. FIND UNATTEMPTED DIMENSIONS
    # --------------------------------------------------------

    unattempted = [
        dimension
        for dimension, data in fingerprint.items()
        if data["question_count"] == 0
    ]

    if unattempted:
        return {
            "dimension": unattempted[0],
            "reason": "unattempted_dimension",
            "action": "explore"
        }

    # --------------------------------------------------------
    # 2. FIND WEAKEST DIMENSION
    # --------------------------------------------------------

    weakest_dimension = min(
        fingerprint,
        key=lambda dimension:
            fingerprint[dimension]["score"]
    )

    weakest_score = fingerprint[
        weakest_dimension
    ]["score"]

    # --------------------------------------------------------
    # 3. CHECK RECENT PERFORMANCE
    # --------------------------------------------------------

    recent_scores = [
        attempt.score
        for attempt in recent_attempts
        if attempt.score is not None
    ]

    recent_average = None

    if recent_scores:
        recent_average = (
            sum(recent_scores)
            / len(recent_scores)
        )

    # --------------------------------------------------------
    # 4. WEAK DIMENSION
    # --------------------------------------------------------

    if weakest_score < 50:
        return {
            "dimension": weakest_dimension,
            "reason": "weakest_dimension",
            "action": "reinforce",
            "score": weakest_score,
            "recent_average": recent_average
        }

    # --------------------------------------------------------
    # 5. MODERATE DIMENSION
    # --------------------------------------------------------

    if weakest_score < 80:
        return {
            "dimension": weakest_dimension,
            "reason": "needs_practice",
            "action": "practice",
            "score": weakest_score,
            "recent_average": recent_average
        }

    # --------------------------------------------------------
    # 6. EVERYTHING IS STRONG
    # --------------------------------------------------------

    return {
        "dimension": None,
        "reason": "all_dimensions_strong",
        "action": "advance",
        "score": weakest_score,
        "recent_average": recent_average
    }

# ============================================================
# GENERATE ADAPTIVE RECOMMENDATION
# ============================================================

def generate_adaptive_recommendation(
    student_id: str,
    concept: str,
    fingerprint: dict,
    db: Session
):
    """
    Decide the student's next learning step
    using their actual history.
    """

    recent_attempts = (
        db.query(models.LearningAttempt)
        .filter(
            models.LearningAttempt.student_id
            == student_id
        )
        .filter(
            models.LearningAttempt.concept
            == concept
        )
        .order_by(
            models.LearningAttempt.id.desc()
        )
        .limit(5)
        .all()
    )

    decision = choose_next_dimension(
        fingerprint,
        recent_attempts
    )

    dimension = decision["dimension"]

    # --------------------------------------------------------
    # FIRST-TIME STUDENT / UNATTEMPTED DIMENSION
    # --------------------------------------------------------

    if decision["reason"] == "unattempted_dimension":

        return {
            "concept": concept,
            "dimension": dimension,
            "action": "explore",
            "reason": "unattempted_dimension",
            "message": (
                f"Start with the {dimension} dimension "
                f"for {concept}."
            )
        }

    # --------------------------------------------------------
    # WEAK DIMENSION
    # --------------------------------------------------------

    if decision["reason"] == "weakest_dimension":

        return {
            "concept": concept,
            "dimension": dimension,
            "action": "reinforce",
            "reason": "weakest_dimension",
            "score": decision["score"],
            "message": (
                f"Focus on {dimension}. "
                f"Your current score is "
                f"{decision['score']}%."
            )
        }

    # --------------------------------------------------------
    # MODERATE DIMENSION
    # --------------------------------------------------------

    if decision["reason"] == "needs_practice":

        return {
            "concept": concept,
            "dimension": dimension,
            "action": "practice",
            "reason": "needs_practice",
            "score": decision["score"],
            "message": (
                f"Continue practicing {dimension} "
                f"to improve your understanding."
            )
        }

    # --------------------------------------------------------
    # ALL STRONG
    # --------------------------------------------------------

    return {
        "concept": concept,
        "dimension": None,
        "action": "advance",
        "reason": "all_dimensions_strong",
        "message": (
            f"You are strong across the current "
            f"learning dimensions for {concept}. "
            f"Move to a more challenging application."
        )
    }

# ============================================================
# CREATE ACCOUNT
# ============================================================

@app.get("/debug")
def debug():
    return {
        "status": "ok",
        "message": "Latest backend code is running"
    }

@app.post("/auth/register")
def register(
    data: dict,
    db: Session = Depends(get_db)
):
    username = str(data.get("username", "")).strip().lower()
    password = str(data.get("password", ""))

    if not username:
        raise HTTPException(
            status_code=400,
            detail="Username is required"
        )

    if len(username) < 3:
        raise HTTPException(
            status_code=400,
            detail="Username must be at least 3 characters"
        )

    if len(password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 characters"
        )

    existing_student = (
        db.query(models.Student)
        .filter(models.Student.username == username)
        .first()
    )

    if existing_student:
        raise HTTPException(
            status_code=409,
            detail="Username already exists"
        )

    hashed_password = password_hash.hash(password)

    student = models.Student(
        username=username,
        password_hash=hashed_password
    )

    db.add(student)
    db.commit()
    db.refresh(student)

    return {
        "success": True,
        "message": "Account created successfully",
        "student_id": str(student.id),
        "username": student.username
    }

# ============================================================
# LOGIN
# ============================================================

@app.post("/auth/login")
def login(
    data: dict,
    db: Session = Depends(get_db)
):
    username = str(data.get("username", "")).strip().lower()
    password = str(data.get("password", ""))

    if not username or not password:
        raise HTTPException(
            status_code=400,
            detail="Username and password are required"
        )

    student = (
        db.query(models.Student)
        .filter(models.Student.username == username)
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )

    if not password_hash.verify(
        password,
        student.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )

    return {
        "success": True,
        "message": "Login successful",
        "student_id": str(student.id),
        "username": student.username
    }

# ============================================================
# RUN PYTHON CODE
# ============================================================

class RunCodeRequest(BaseModel):
    language: str
    code: str


# ============================================================
# FORMAT PYTHON ERROR
# ============================================================

def format_python_error(error_text):
    """
    Convert raw Python errors into clean,
    student-friendly messages.

    IMPORTANT:
    Never expose temporary Windows paths,
    filenames, or internal server details.
    """

    error_text = str(error_text or "").strip()

    # --------------------------------------------------------
    # REMOVE WINDOWS TEMP PATHS
    # --------------------------------------------------------

    error_text = error_text.replace("\\", "/")

    # --------------------------------------------------------
    # GET ERROR TYPE
    # --------------------------------------------------------

    if "SyntaxError" in error_text:
        return (
            "Syntax Error\n\n"
            "There is a syntax mistake in your code.\n\n"
            "Check your brackets, indentation, quotes, "
            "and make sure statements such as for, if, "
            "and while end with a colon (:)."
        )

    if "IndentationError" in error_text:
        return (
            "Indentation Error\n\n"
            "Python uses indentation to define blocks of code.\n\n"
            "Check the spacing before the affected line."
        )

    if "TabError" in error_text:
        return (
            "Indentation Error\n\n"
            "Your code mixes tabs and spaces.\n\n"
            "Use consistent indentation throughout your code."
        )

    if "NameError" in error_text:
        return (
            "Name Error\n\n"
            "Your program is using a variable or function "
            "that has not been defined.\n\n"
            "Check the spelling and make sure the variable "
            "is created before you use it."
        )

    if "TypeError" in error_text:
        return (
            "Type Error\n\n"
            "Your program is using a value with an "
            "incompatible type.\n\n"
            "Check the types of the values you are using."
        )

    if "ValueError" in error_text:
        return (
            "Value Error\n\n"
            "A value has an incorrect format or cannot "
            "be used for this operation."
        )

    if "ZeroDivisionError" in error_text:
        return (
            "Math Error\n\n"
            "Your program tried to divide by zero."
        )

    if "IndexError" in error_text:
        return (
            "Index Error\n\n"
            "Your program tried to access an item "
            "outside the valid range."
        )

    if "KeyError" in error_text:
        return (
            "Key Error\n\n"
            "Your program tried to access a dictionary "
            "key that does not exist."
        )

    if "AttributeError" in error_text:
        return (
            "Attribute Error\n\n"
            "Your program tried to use an attribute "
            "or method that does not exist."
        )

    if "ModuleNotFoundError" in error_text:
        return (
            "Module Error\n\n"
            "Your code tried to use a Python module "
            "that is not available."
        )

    # --------------------------------------------------------
    # FALLBACK
    # --------------------------------------------------------

    return (
        "Python Error\n\n"
        "Your program could not run.\n\n"
        "Check your code and try again."
    )


# ============================================================
# RUN PYTHON CODE
# ============================================================

class RunCodeRequest(BaseModel):
    language: str
    code: str


@app.post("/run-code")
def run_code(request: RunCodeRequest):

    if request.language.lower() != "python":
        return {
            "output": "",
            "error": "Only Python is currently supported."
        }

    file_path = None

    try:

        # ----------------------------------------------------
        # CREATE TEMPORARY PYTHON FILE
        # ----------------------------------------------------

        with tempfile.NamedTemporaryFile(
            mode="w",
            suffix=".py",
            delete=False,
            encoding="utf-8"
        ) as temp_file:

            temp_file.write(request.code)
            file_path = temp_file.name

        # ----------------------------------------------------
        # RUN PYTHON
        # ----------------------------------------------------

        result = subprocess.run(
            ["python", file_path],
            capture_output=True,
            text=True,
            timeout=5
        )

        # ----------------------------------------------------
        # SUCCESS
        # ----------------------------------------------------

        if result.returncode == 0:
            return {
                "output": result.stdout,
                "error": None
            }

        # ----------------------------------------------------
        # ERROR
        # ----------------------------------------------------

        clean_error = format_python_error(
            result.stderr
        )

        return {
            "output": result.stdout,
            "error": clean_error
        }

    # --------------------------------------------------------
    # TIMEOUT
    # --------------------------------------------------------

    except subprocess.TimeoutExpired:

        return {
            "output": "",
            "error": (
                "Execution Timeout\n\n"
                "Your program took too long to finish.\n\n"
                "Check your loops and make sure they eventually stop."
            )
        }

    # --------------------------------------------------------
    # OTHER SERVER ERROR
    # --------------------------------------------------------

    except Exception as error:

        # Log the real error ONLY in the backend console.
        print(
            "Internal code execution error:",
            repr(error)
        )

        return {
            "output": "",
            "error": (
                "Execution Error\n\n"
                "The program could not be executed.\n\n"
                "Please check your code and try again."
            )
        }

    # --------------------------------------------------------
    # DELETE TEMP FILE
    # --------------------------------------------------------

    finally:

        if file_path:

            try:
                os.remove(file_path)

            except Exception as cleanup_error:
                print(
                    "Temporary file cleanup failed:",
                    repr(cleanup_error)
                )

# ============================================================
# CREATE NORMAL LEARNING ATTEMPT
# ============================================================

@app.post("/attempts")
def create_attempt(
    attempt: dict,
    db: Session = Depends(get_db)
):

    student_id = require_student_id(attempt)

    concept = require_concept(attempt)

    dimension = require_dimension(attempt)

    score = float(
        attempt.get("score", 0)
    )
    print("QUESTION SCORES RECEIVED:")
    print(attempt.get("question_scores"))

    print("QUESTION ATTEMPTS RECEIVED:")
    print(attempt.get("question_attempts"))

    print("KNOWLEDGE FINGERPRINT RECEIVED:")
    print(attempt.get("knowledge_fingerprint"))

    # --------------------------------------------------------
    # AI ANALYSIS
    # --------------------------------------------------------

    ai_analysis = None

    if score < 80:

        try:

            print(
                "🤖 Starting Gemini analysis..."
            )

            start_time = time.perf_counter()

            ai_analysis = analyze_mistake(

                question=attempt.get(
                    "question",
                    ""
                ),

                student_answer=attempt.get(
                    "student_answer",
                    ""
                ),

                correct_answer=attempt.get(
                    "correct_answer",
                    ""
                ),

                topic=concept,

                dimension=dimension,
            )

            end_time = time.perf_counter()

            print(
                f"⏱️ Gemini took "
                f"{end_time - start_time:.2f} seconds"
            )

        except Exception as error:

            print(
                "AI analysis failed:",
                error
            )

            ai_analysis = {
                "mistake_type":
                    "analysis_unavailable",

                "weakness": {
                    "dimension": dimension,
                    "skill": "unknown"
                },

                "explanation":
                    "AI analysis could not be generated.",

                "misconception": "",

                "hint": "",

                "recommended_action": ""
            }

    # --------------------------------------------------------
    # SERIALIZE AI ANALYSIS
    # --------------------------------------------------------

    ai_analysis_text = None

    if ai_analysis is not None:

        ai_analysis_text = json.dumps(
            ai_analysis
        )

    # --------------------------------------------------------
    # SAVE ATTEMPT
    # --------------------------------------------------------

    new_attempt = models.LearningAttempt(

        student_id=student_id,

        concept=concept,

        dimension=dimension,
        question_id=attempt.get(
        "question_id"
    ),

        score=score,

        mistake=attempt.get(
            "mistake",
            attempt.get(
                "student_answer",
                ""
            )
        ),

        recommendation=attempt.get(
            "recommendation"
        ),

        ai_analysis=ai_analysis_text
    )

    db.add(new_attempt)

    db.commit()

    db.refresh(new_attempt)

    # --------------------------------------------------------
    # RECALCULATE STUDENT FINGERPRINT
    # --------------------------------------------------------

    fingerprint = calculate_knowledge_fingerprint(
        student_id,
        concept,
        db
    )
    print("UPDATED FINGERPRINT AFTER ATTEMPT:")
    print(json.dumps(fingerprint, indent=2))

    recommendation = generate_adaptive_recommendation(
    student_id,
    concept,
    fingerprint,
    db
    )

    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------

    return {

        "success": True,

        "message":
            "Learning attempt saved successfully",

        "attempt_id":
            new_attempt.id,

        "student_id":
            student_id,

        "concept":
            concept,

        "dimension":
            dimension,

        "score":
            score,

        "ai_analysis":
            ai_analysis,

        "fingerprint":
            fingerprint,

        "recommendation":
            recommendation
    }

@app.get("/progress/{student_id}/{concept}/{dimension}")
def get_progress(
    student_id: str,
    concept: str,
    dimension: str,
    db: Session = Depends(get_db),
):
    print("====================================")
    print("PROGRESS REQUEST")
    print("student_id:", student_id)
    print("concept:", concept)
    print("dimension:", dimension)
    print("====================================")

    # ---------------------------------------------------------
    # CONSTANTS
    # ---------------------------------------------------------

    REQUIRED_QUESTIONS = 6
    MASTERY_SCORE = 80

    # ---------------------------------------------------------
    # NORMALIZE / VALIDATE DIMENSION
    # ---------------------------------------------------------

    dimension = dimension.strip().lower()

    if dimension not in DIMENSIONS:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Unknown learning dimension",
                "received": dimension,
                "supported_dimensions": DIMENSIONS,
            },
        )

    # ---------------------------------------------------------
    # GET ALL ATTEMPTS
    # ---------------------------------------------------------

    attempts = (
        db.query(models.LearningAttempt)
        .filter(
            models.LearningAttempt.student_id == student_id,
            models.LearningAttempt.concept == concept,
            models.LearningAttempt.dimension == dimension,
        )
        .order_by(models.LearningAttempt.id.asc())
        .all()
    )

    # ---------------------------------------------------------
    # GROUP ATTEMPTS BY QUESTION
    # ---------------------------------------------------------

    question_attempts = {}

    for attempt in attempts:

        if not attempt.question_id:
            continue

        question_id = str(attempt.question_id)

        if question_id not in question_attempts:
            question_attempts[question_id] = {
                "question_id": question_id,
                "attempts": 0,
                "scores": [],
                "latest_score": None,
                "best_score": None,
                "mistakes": [],
            }

        item = question_attempts[question_id]

        # Count attempt
        item["attempts"] += 1

        # Store score
        if attempt.score is not None:

            score = float(attempt.score)

            item["scores"].append(score)

            # Latest submitted score
            item["latest_score"] = score

            # Best score ever achieved
            if (
                item["best_score"] is None
                or score > item["best_score"]
            ):
                item["best_score"] = score

        # Store mistake
        if attempt.mistake:
            item["mistakes"].append(attempt.mistake)

    # ---------------------------------------------------------
    # QUESTION COUNTS
    # ---------------------------------------------------------

    answered_question_ids = list(question_attempts.keys())

    answered_count = len(answered_question_ids)

    # ---------------------------------------------------------
    # MASTERED QUESTIONS
    #
    # A question becomes mastered once its BEST score
    # reaches 80.
    #
    # A later failed retest does NOT remove mastery.
    # ---------------------------------------------------------

    mastered_question_ids = [
        question_id
        for question_id, item in question_attempts.items()
        if (
            item["best_score"] is not None
            and item["best_score"] >= MASTERY_SCORE
        )
    ]

    mastered_count = len(mastered_question_ids)

    # ---------------------------------------------------------
    # BEST SCORE PER QUESTION
    # ---------------------------------------------------------

    best_scores = [
        item["best_score"]
        for item in question_attempts.values()
        if item["best_score"] is not None
    ]

    if best_scores:
        dimension_score = round(
            sum(best_scores) / len(best_scores)
        )
    else:
        dimension_score = None

    # ---------------------------------------------------------
    # MASTERY STATUS
    # ---------------------------------------------------------

    if answered_count == 0:
        mastery_status = "not_started"

    elif mastered_count >= REQUIRED_QUESTIONS:
        mastery_status = "mastered"

    else:
        mastery_status = "in_progress"

    # ---------------------------------------------------------
    # LAST QUESTION
    # ---------------------------------------------------------

    last_question_id = None

    for attempt in reversed(attempts):
        if attempt.question_id:
            last_question_id = str(attempt.question_id)
            break

    # ---------------------------------------------------------
    # PROGRESS PERCENTAGE
    # ---------------------------------------------------------

    progress_percentage = round(
        mastered_count / REQUIRED_QUESTIONS * 100
    )

    # ---------------------------------------------------------
    # RESPONSE
    # ---------------------------------------------------------

    return {
        "student_id": student_id,
        "concept": concept,
        "dimension": dimension,

        # Average of best score for each question
        "score": dimension_score,

        # -----------------------------------------------------
        # QUESTION DATA
        # -----------------------------------------------------

        "question_scores": {
            question_id: item["best_score"]
            for question_id, item in question_attempts.items()
        },

        "question_attempts": {
            question_id: item["attempts"]
            for question_id, item in question_attempts.items()
        },

        # -----------------------------------------------------
        # COMPLETION / MASTERY
        # -----------------------------------------------------

        "completed_question_ids": mastered_question_ids,

        "completed_count": mastered_count,

        "mastered_question_ids": mastered_question_ids,

        "mastered_count": mastered_count,

        "question_count": REQUIRED_QUESTIONS,

        # -----------------------------------------------------
        # PROGRESS
        # -----------------------------------------------------

        "progress": {
            "completed": mastered_count,
            "total": REQUIRED_QUESTIONS,
            "percentage": progress_percentage,
            "display": f"{mastered_count}/{REQUIRED_QUESTIONS}",
        },

        # -----------------------------------------------------
        # MASTERY
        # -----------------------------------------------------

        "mastery": {
            "status": mastery_status,
            "is_mastered": (
                mastered_count >= REQUIRED_QUESTIONS
            ),
        },

        # -----------------------------------------------------
        # ATTEMPT INFO
        # -----------------------------------------------------

        "attempt_count": len(attempts),

        "last_question_id": last_question_id,
    }

@app.post("/execution-attempts")
def create_execution_attempt(
    payload: dict,
    db: Session = Depends(get_db),
):
    attempt = models.LearningExecution(
        student_id=str(payload["student_id"]),
        concept=payload["concept"],
        dimension=payload["dimension"],
        question_id=payload.get("question_id"),
        code=payload.get("code", ""),
        output=payload.get("output", ""),
        expected_output=payload.get(
            "expected_output",
            "",
        ),
        success=bool(payload.get("success", False)),
        score=payload.get("score"),
        mistake=payload.get("mistake"),
    )

    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    return {
        "id": attempt.id,
        "success": attempt.success,
    }

# ============================================================
# ADAPTIVE ATTEMPT
# ============================================================

@app.post("/adaptive-attempt")
def save_adaptive_attempt(
    attempt: dict,
    db: Session = Depends(get_db)
):

    student_id = require_student_id(attempt)

    concept = require_concept(attempt)

    dimension = require_dimension(attempt)

    score = float(
        attempt.get("score", 0)
    )

    new_attempt = models.LearningAttempt(

        student_id=student_id,

        concept=concept,

        dimension=dimension,
        question_id=attempt.get(
        "question_id"
    ),

        score=score,

        mistake=attempt.get(
            "mistake"
        ),

        recommendation=attempt.get(
            "recommendation"
        ),

        ai_analysis=None
    )

    db.add(new_attempt)

    db.commit()

    db.refresh(new_attempt)

    # --------------------------------------------------------
    # UPDATE FINGERPRINT
    # --------------------------------------------------------

    fingerprint = calculate_knowledge_fingerprint(
        student_id,
        concept,
        db
    )

    # --------------------------------------------------------
    # GENERATE NEXT ADAPTIVE DECISION
    # --------------------------------------------------------

    recommendation = generate_adaptive_recommendation(
    student_id,
    concept,
    fingerprint,
    db
    )

    return {

        "success": True,

        "message":
            "Adaptive attempt saved successfully",

        "attempt_id":
            new_attempt.id,

        "student_id":
            student_id,

        "concept":
            concept,

        "dimension":
            dimension,

        "score":
            score,

        "fingerprint":
            fingerprint,

        "recommendation":
            recommendation
    }


# ============================================================
# GET STUDENT + CONCEPT FINGERPRINT
# ============================================================

@app.get("/fingerprint/{student_id}/{concept}")
def get_fingerprint(
    student_id: str,
    concept: str,
    db: Session = Depends(get_db)
):
    fingerprint = calculate_knowledge_fingerprint(
        student_id,
        concept,
        db
    )

    recommendation = generate_adaptive_recommendation(
        student_id,
        concept,
        fingerprint,
        db
    )

    attempts = (
        db.query(models.LearningAttempt)
        .filter(
            models.LearningAttempt.student_id == student_id
        )
        .filter(
            models.LearningAttempt.concept == concept
        )
        .all()
    )

    # ---------------------------------------------------------
    # CALCULATE OVERALL QUESTION PROGRESS
    # ---------------------------------------------------------

    questions_by_dimension = {}

    for attempt in attempts:
        if not attempt.question_id:
            continue

        dimension = attempt.dimension
        question_id = str(attempt.question_id)

        if dimension not in questions_by_dimension:
            questions_by_dimension[dimension] = {}

        existing = questions_by_dimension[dimension].get(
            question_id
        )

        score = (
            float(attempt.score)
            if attempt.score is not None
            else None
        )

        if existing is None:
            questions_by_dimension[dimension][question_id] = {
                "best_score": score
            }

        elif score is not None:
            current_best = existing["best_score"]

            if (
                current_best is None
                or score > current_best
            ):
                existing["best_score"] = score

    # ---------------------------------------------------------
    # BUILD DIMENSION PROGRESS
    # ---------------------------------------------------------

    dimension_progress = {}

    total_completed = 0
    total_questions = 0
    REQUIRED_QUESTIONS = 6
    MASTERY_SCORE = 80

    for dimension in DIMENSIONS:

        questions = questions_by_dimension.get(
            dimension,
            {}
        )

        # Best score for each question in this dimension
        best_scores = {
            question_id: item["best_score"]
            for question_id, item in questions.items()
        }

        question_count = len(best_scores)

        answered_count = sum(
            1
            for score in best_scores.values()
            if score is not None
        )

        completed_count = sum(
            1
            for score in best_scores.values()
            if score is not None
            and score >= MASTERY_SCORE
        )

        total_questions += question_count
        total_completed += completed_count

        dimension_progress[dimension] = {
            "completed": completed_count,
            "total": question_count,
            "required": REQUIRED_QUESTIONS,
            "display": f"{completed_count}/{REQUIRED_QUESTIONS}",
            "attempted": question_count,
            "mastered": completed_count >= REQUIRED_QUESTIONS,
        }

    # ---------------------------------------------------------
    # OVERALL MASTERY
    # ---------------------------------------------------------

    overall_mastered = all(
    sum(
        1
        for item in questions_by_dimension.get(dimension, {}).values()
        if (
            item["best_score"] is not None
            and item["best_score"] >= MASTERY_SCORE
        )
    ) >= REQUIRED_QUESTIONS
    for dimension in DIMENSIONS
)

    return {
        "student_id": student_id,
        "concept": concept,

        "fingerprint": fingerprint,

        "dimension_progress": dimension_progress,

        "progress": {
            "completed": total_completed,
            "total": total_questions,
            "display": (
                f"{total_completed}/{total_questions}"
                if total_questions > 0
                else "0/0"
            ),
        },

        "mastery": {
            "status": (
                "mastered"
                if overall_mastered
                else (
                    "in_progress"
                    if total_questions > 0
                    else "not_started"
                )
            ),
            "is_mastered": overall_mastered,
        },

        "attempt_count": len(attempts),

        "recommendation": recommendation,
    }

# ============================================================
# GET ATTEMPTS
# ============================================================

@app.get("/attempts/{student_id}")
def get_attempts(
    student_id: str,
    db: Session = Depends(get_db)
):
    attempts = (
        db.query(models.LearningAttempt)
        .filter(
            models.LearningAttempt.student_id == student_id
        )
        .order_by(
            models.LearningAttempt.id.asc()
        )
        .all()
    )

    result = []

    for attempt in attempts:
        ai_analysis = None

        if attempt.ai_analysis:
            try:
                ai_analysis = json.loads(
                    attempt.ai_analysis
                )
            except json.JSONDecodeError:
                ai_analysis = None

        result.append({
            "id": attempt.id,
            "student_id": attempt.student_id,
            "concept": attempt.concept,
            "dimension": attempt.dimension,
            "question_id": (
                str(attempt.question_id)
                if attempt.question_id is not None
                else None
            ),
            "score": (
                float(attempt.score)
                if attempt.score is not None
                else None
            ),
            "mistake": attempt.mistake,
            "recommendation": attempt.recommendation,
            "ai_analysis": ai_analysis,
        })

    return {
        "student_id": student_id,
        "attempts": result,
        "attempt_count": len(result),
    }

# ============================================================
# ANALYZE MISTAKE
# ============================================================

@app.post("/analyze-mistake")
def analyze_mistake_endpoint(data: dict):
    try:
        result = analyze_mistake(
            question=data.get("question", ""),
            student_answer=data.get("student_answer", ""),
            correct_answer=data.get("correct_answer", ""),
            topic=data.get("topic", ""),
            dimension=data.get("dimension", ""),
        )

        return result

    except Exception as e:
        error_text = str(e)

        print("❌ /analyze-mistake error:")
        print(error_text)

        if "429" in error_text or "RESOURCE_EXHAUSTED" in error_text:
            raise HTTPException(
                status_code=429,
                detail="Gemini API quota exceeded. Please try again later."
            )

        raise HTTPException(
            status_code=500,
            detail="AI analysis failed."
        )

# ============================================================
# RECORD MISTAKE HISTORY
# ============================================================

@app.post("/mistake-history")
def create_mistake_history(
    payload: dict,
    db: Session = Depends(get_db),
):

    student_id = str(
        payload.get("student_id", "")
    ).strip()

    concept = str(
        payload.get("concept")
        or payload.get("topic")
        or ""
    ).strip()

    dimension = str(
        payload.get("dimension", "")
    ).strip().lower()

    question_type = str(
        payload.get("question_type", "")
    ).strip().lower()

    # --------------------------------------------------------
    # VALIDATION
    # --------------------------------------------------------

    if not student_id:
        raise HTTPException(
            status_code=400,
            detail="student_id is required"
        )

    if not concept:
        raise HTTPException(
            status_code=400,
            detail="concept or topic is required"
        )

    if dimension not in DIMENSIONS:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Invalid learning dimension",
                "received": dimension,
                "supported_dimensions": DIMENSIONS,
            }
        )

    if question_type not in SUPPORTED_QUESTION_TYPES:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Invalid question type",
                "received": question_type,
                "supported_question_types": SUPPORTED_QUESTION_TYPES,
            }
        )

    # --------------------------------------------------------
    # RECORD MISTAKE
    # --------------------------------------------------------

    mistake = record_mistake(
        student_id=student_id,
        concept=concept,
        dimension=dimension,
        question_type=question_type,
        question_id=payload.get("question_id"),
        mistake_type=payload.get("mistake_type"),
        mistake_detail=(
            payload.get("mistake")
            or payload.get("what_happened")
            or payload.get("misconception")
        ),
        db=db,
    )

    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------

    return {
        "success": True,
        "mistake_id": mistake.id,
        "count": mistake.count,
    }

# ============================================================
# GET MISTAKE HISTORY
# ============================================================

@app.get("/mistakes/{student_id}")
def get_mistake_history(
    student_id: str,
    db: Session = Depends(get_db),
):
    mistakes = (
        db.query(models.MistakeHistory)
        .filter(
            models.MistakeHistory.student_id == student_id
        )
        .order_by(
            models.MistakeHistory.count.desc(),
            models.MistakeHistory.id.desc()
        )
        .all()
    )

    result = []

    for mistake in mistakes:
        result.append({
            "id": mistake.id,
            "student_id": mistake.student_id,
            "concept": mistake.concept,
            "dimension": mistake.dimension,
            "question_id": mistake.question_id,
            "mistake_type": mistake.mistake_type,
            "mistake_detail": mistake.mistake_detail,
            "count": mistake.count,
            "created_at": mistake.created_at,
            "updated_at": mistake.updated_at,
        })

    total_mistake_types = len(result)

    total_mistake_attempts = sum(
        int(mistake.count or 0)
        for mistake in mistakes
    )

    return {
        "student_id": student_id,
        "mistakes": result,
        "mistake_count": total_mistake_types,
        "total_mistake_attempts": total_mistake_attempts,
    }
