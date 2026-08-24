# LearnLens — System Architecture

## 1. Overview

LearnLens follows a **frontend–backend architecture** where learner activity is processed by the backend and converted into learning evidence.

The core architecture is:

```text
Learner
   ↓
React Frontend
   ↓
FastAPI Backend
   ↓
Assessment / Code Execution
   ↓
Evidence & Mistake Analysis
   ↓
Knowledge Fingerprint
   ↓
Proof-of-Learn / Adaptive Action
```

---

## 2. High-Level Architecture

```text
┌─────────────────────────────┐
│       React Frontend        │
│                             │
│ Dashboard • Roadmap         │
│ Assessments • Coding        │
│ Results • Progress          │
└──────────────┬──────────────┘
               │
            HTTP / API
               ↓
┌─────────────────────────────┐
│       FastAPI Backend       │
│                             │
│ Learning • Assessments      │
│ Attempts • Mistakes         │
│ Progress • Analysis         │
└───────┬──────────┬──────────┘
        │          │
        ▼          ▼
┌────────────┐  ┌────────────────┐
│   SQLite   │  │  Google GenAI  │
│ SQLAlchemy │  │ AI Analysis    │
└────────────┘  └────────────────┘
        │
        ▼
┌─────────────────────────────┐
│ Python Code Execution       │
│ subprocess + tempfile       │
└─────────────────────────────┘
```

---

## 3. Frontend

The frontend is built with **React and Vite**.

It provides interfaces for:

* Learning roadmap
* Concept learning
* Theory assessments
* Coding activities
* Results and feedback
* Learning progress

The frontend communicates with the FastAPI backend through HTTP APIs.

---

## 4. Backend

The backend uses **FastAPI** and acts as the central application layer.

It handles:

* Learning data
* Assessments
* Learner attempts
* Progress
* Mistake analysis
* Code execution
* AI-assisted analysis
* Database operations

---

## 5. Database Layer

The current MVP uses **SQLite with SQLAlchemy**.

```text
FastAPI
   ↓
SQLAlchemy ORM
   ↓
SQLite
```

The database maintains application and learning data such as learners, concepts, attempts, assessment results, and related progress information.

---

## 6. Code Execution

Coding submissions are executed using Python `subprocess` and temporary files.

```text
Code Submission
      ↓
Temporary File
      ↓
subprocess
      ↓
Output / Error
      ↓
Learning Evidence
```

The current MVP does **not** implement a dedicated secure sandbox.

---

## 7. AI-Assisted Analysis

LearnLens integrates **Google GenAI** as an analysis layer.

```text
Learner Attempt
      ↓
Assessment / Execution Result
      ↓
AI-Assisted Analysis
      ↓
Possible Mistake / Learning Gap
      ↓
Learning Evidence
```

AI supports the implemented analysis workflow rather than functioning as a standalone chatbot.

---

## 8. Learning Evidence Flow

Different learner interactions contribute to the evidence used by LearnLens.

```text
Theory Response
      │
Coding Attempt
      │
Execution Result
      │
Mistake / Error
      │
Assessment Result
      ↓
Learning Evidence
      ↓
Knowledge Fingerprint
```

---

## 9. Knowledge Fingerprint & Adaptation

The Knowledge Fingerprint represents understanding across:

```text
Recall → Explain → Predict → Implement → Debug → Apply
```

The resulting evidence can help identify areas requiring reinforcement.

```text
Knowledge Fingerprint
        ↓
Identify Weakness
        ↓
Adaptive Challenge
        ↓
New Attempt
        ↓
Updated Evidence
```

---

## 10. Proof-of-Learn Flow

LearnLens separates **completion** from **demonstrated understanding**.

```text
Learning Evidence
      ↓
Understanding Check
      ↓
Evidence Sufficient for Verification?
       ↙                 ↘
     Yes                  No
      ↓                    ↓
Proof-of-Learn       Reinforce /
      ↓              Reassess
Next Concept
```

---

## 11. End-to-End Flow

A typical learner interaction follows:

```text
Learner
   ↓
Frontend
   ↓
FastAPI Backend
   ↓
Assessment / Code Execution
   ↓
Evidence Collection
   ↓
AI-Assisted Analysis
   ↓
Knowledge Fingerprint
   ↓
Proof-of-Learn
   ↓
Next Concept / Adaptive Challenge
```

---

## 12. Architecture Principle

LearnLens connects the frontend, backend, database, code execution, and AI analysis into one evidence-driven learning loop:

```text
Learn
  ↓
Attempt
  ↓
Evidence
  ↓
Analyze
  ↓
Understand
  ↓
Adapt
  ↓
Verify
```

> **The architecture is designed to support the MVP's core goal: turning learner activity into evidence of understanding.**

---