# LearnLens — Project Overview

## 1. Introduction

**LearnLens — From Learning to Proof of Understanding**

LearnLens is an **AI-enabled adaptive learning and learning-verification platform** designed to move beyond traditional lesson completion and quiz-based scoring.

Instead of asking only whether a learner answered a question correctly, LearnLens focuses on collecting evidence from learner attempts, assessments, coding activity, mistakes, and progress to build a clearer picture of **what the learner understands and where further practice is needed**.

The platform was developed for **Prasunethon 2.0 — Round 2** by **Team Tech Nova**.

---

## 2. Project Vision

Traditional learning systems often follow:

```text
Learn
  ↓
Quiz
  ↓
Score
  ↓
Completion
```

LearnLens introduces an evidence-driven approach:

```text
Learn
  ↓
Attempt
  ↓
Evidence
  ↓
Understanding
  ↓
Adaptive Action
  ↓
Proof-of-Learn
```

The goal is to make learning progress more meaningful by connecting assessment results with the learner's next action.

---

## 3. Problem Being Addressed

A single score does not always represent complete understanding.

A learner may:

* Recall a definition but fail to explain it.
* Understand a concept theoretically but struggle to implement it.
* Solve a familiar problem but struggle with a variation.
* Make repeated coding mistakes.
* Complete a lesson without demonstrating practical understanding.

Traditional assessment can therefore answer:

> **"Did the learner get the answer right?"**

but may not adequately answer:

> **"What does the learner actually understand?"**

LearnLens is designed around this second question.

---

## 4. Proposed Approach

LearnLens treats learner interactions as **learning evidence**.

Evidence can come from areas such as:

* Theory assessment responses
* Coding attempts
* Program execution results
* Errors and failed submissions
* Assessment performance
* Mistake analysis
* Learning progress

This evidence is used by the implemented learning workflow to identify areas requiring additional practice.

The core process is:

```text
Learner Attempt
      ↓
Evidence Collection
      ↓
Assessment / Analysis
      ↓
Knowledge Fingerprint
      ↓
Weak Area Identification
      ↓
Adaptive Challenge
      ↓
Reassessment
      ↓
Proof-of-Learn
```

---

## 5. Core Concept — Knowledge Fingerprint

One of the central concepts of LearnLens is the **Knowledge Fingerprint**.

Instead of representing understanding using only a single score, the platform considers multiple dimensions:

```text
Recall
  ↓
Explain
  ↓
Predict
  ↓
Implement
  ↓
Debug
  ↓
Apply
```

These dimensions represent different forms of demonstrating understanding.

For example, a learner may have strong recall and explanation skills but struggle with implementation or debugging.

This provides a more useful basis for identifying learning gaps and selecting the next learning activity.

---

## 6. Core MVP Features

The current LearnLens MVP focuses on six capabilities:

### 1. Adaptive Learning Roadmap

Provides structured concept-based learning progression and supports reinforcement of weaker areas.

### 2. Theory + Coding Assessment

Evaluates both conceptual understanding and practical programming ability.

### 3. Code Execution & Mistake Tracking

Executes submitted Python code and uses execution results, errors, and attempts as learning evidence.

### 4. Knowledge Fingerprint

Represents learner understanding across multiple dimensions rather than relying only on a single score.

### 5. Adaptive Challenges

Provides targeted practice based on identified learning weaknesses.

### 6. Proof-of-Learn

Uses accumulated learning evidence to support verification that a learner has sufficiently demonstrated understanding of a concept.

---

## 7. AI in LearnLens

AI is used as an **intelligence and analysis layer** within the platform.

The current implementation integrates **Google GenAI** through backend analysis modules to support the analysis of learner attempts and mistakes.

The AI component is not presented as a standalone chatbot or as a fully autonomous learning system.

Its role is to support the implemented learning workflow:

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
      ↓
Adaptive Action
```

The current MVP intentionally keeps AI capabilities focused on the implemented analysis workflow.

---

## 8. Example Learning Journey

A typical learner journey begins with concept selection:

```text
Learner selects a concept
        ↓
Studies the concept
        ↓
Completes assessment
        ↓
Submits attempt
        ↓
System evaluates response
        ↓
Knowledge Fingerprint updated
        ↓
Weak areas identified
        ↓
Adaptive challenge
        ↓
Reassessment
        ↓
Proof-of-Learn
        ↓
Next concept
```

This creates a continuous learning loop rather than treating each assessment as an isolated event.

---

## 9. Technology Overview

LearnLens uses a separate frontend and backend architecture.

### Frontend

* React
* Vite
* React Router
* Axios / Fetch

### Backend

* Python
* FastAPI
* Uvicorn
* SQLAlchemy
* Pydantic
* pwdlib
* Google GenAI
* Python `subprocess`
* Python `tempfile`

### Database

The current implementation uses **SQLite** with SQLAlchemy:

```text
SQLite
   ↑
SQLAlchemy ORM
   ↑
FastAPI Backend
```

### Code Execution

The current MVP executes submitted Python code using `subprocess` and temporary files.

A dedicated sandbox is **not currently implemented**.

---

## 10. High-Level Architecture

```text
┌───────────────────────────┐
│      React Frontend       │
└─────────────┬─────────────┘
              │
              │ HTTP / API
              ▼
┌───────────────────────────┐
│       FastAPI Backend     │
└──────┬─────────┬──────────┘
       │         │
       ▼         ▼
┌───────────┐  ┌────────────────┐
│  SQLite   │  │  Google GenAI  │
│ Database  │  │ AI Analysis    │
└───────────┘  └────────────────┘
       │
       │
       ▼
┌───────────────────────────┐
│ Python Code Execution     │
│ subprocess + tempfile     │
└───────────────────────────┘
```

The components work together to turn learner activity into evidence that can support adaptive learning and verification.

---

## 11. Core Learning Philosophy

The central philosophy of LearnLens is:

```text
Attempt
   ↓
Evidence
   ↓
Understanding
   ↓
Adaptive Action
   ↓
Proof-of-Learn
```

This shifts the focus from simply recording **completion** toward demonstrating **understanding**.

---

## 12. Project Scope

The current project is an **MVP / hackathon prototype** focused on demonstrating the core adaptive learning and learning-verification workflow.

The implementation prioritizes:

* A complete learner workflow
* Theory and coding assessment
* Evidence collection
* Knowledge Fingerprinting
* Mistake analysis
* Adaptive challenges
* Proof-of-Learn

Advanced capabilities such as sophisticated learner modeling, RAG-based document learning, institution-wide analytics, and multi-language code execution remain **future scope** unless implemented separately.

---

## 13. Project Information

| Field            | Details                                                       |
| ---------------- | ------------------------------------------------------------- |
| **Project Name** | LearnLens                                                     |
| **Tagline**      | From Learning to Proof of Understanding                       |
| **Hackathon**    | Prasunethon 2.0 — Round 2                                     |
| **Team**         | Tech Nova                                                     |
| **Category**     | Education / Applied AI                                        |
| **Project Type** | AI-Enabled Adaptive Learning & Learning-Verification Platform |
| **Status**       | MVP / Hackathon Prototype                                     |

---

## 14. Summary

LearnLens is built around a simple idea:

> **Learning should not end with a score. It should produce evidence of understanding.**

By connecting learner attempts, assessment results, coding evidence, Knowledge Fingerprinting, adaptive challenges, and Proof-of-Learn, LearnLens creates a continuous learning-verification loop:

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
Prove
  ↓
Progress
```

The project demonstrates how an AI-assisted learning platform can use available evidence to make the learning journey more **adaptive, measurable, and focused on demonstrated understanding**.

---