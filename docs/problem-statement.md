# LearnLens — Problem Statement

## 1. Overview

Traditional learning platforms often measure progress through **lesson completion, quiz scores, and correct answers**. These metrics do not always prove whether a learner truly understands a concept.

A learner may complete a lesson while still struggling to:

* Explain a concept
* Predict program behavior
* Implement a solution
* Debug mistakes
* Apply knowledge to a different problem

This creates a gap between **completion and demonstrated understanding**.

---

## 2. The Core Problem

The central problem is:

> **How can a learning platform determine what a learner actually understands and identify where they need further practice?**

A conventional learning flow is:

```text
Lesson
  ↓
Quiz
  ↓
Score
  ↓
Completion
```

A score alone may not reveal the learner's specific strengths and weaknesses.

---

## 3. Problems with Traditional Assessment

### 3.1 Completion Does Not Equal Understanding

Completing a lesson does not necessarily mean that the learner can independently apply the concept.

### 3.2 Single Scores Hide Weaknesses

For example:

```text
Recursion: 75%
```

does not clearly show whether the learner is strong or weak at:

```text
Recall → Explain → Predict → Implement → Debug → Apply
```

### 3.3 Coding Mistakes Can Provide Valuable Evidence

Incorrect submissions and execution errors can reveal areas where a learner is struggling.

For example:

```text
Attempt 1 → Error
Attempt 2 → Similar Error
Attempt 3 → Similar Error
```

Repeated mistakes can become useful learning evidence instead of being treated only as failed attempts.

### 3.4 Theory and Implementation Can Differ

A learner may understand a concept theoretically but struggle to implement it, or successfully write code without being able to explain the underlying concept.

Therefore, LearnLens considers both **theory and coding assessment evidence**.

### 3.5 The Next Challenge Should Reflect the Learner's Weakness

Different learners can have different weaknesses.

```text
Theory Weakness
      ↓
Conceptual Challenge
```

```text
Implementation Weakness
      ↓
Coding Challenge
```

A learning system should therefore use available evidence to guide the next activity.

---

## 4. The Need for a Better Approach

LearnLens moves beyond:

```text
"Did the learner complete the lesson?"
```

toward:

```text
"What evidence shows that the learner understands the concept?"
```

The platform collects evidence from:

* Theory assessments
* Coding attempts
* Code execution results
* Errors and failed submissions
* Mistake analysis
* Assessment performance

This evidence contributes to the learner's **Knowledge Fingerprint** and can guide targeted practice.

---

## 5. Problem Statement

> **LearnLens addresses the gap between learning completion and demonstrated understanding. Traditional assessment can hide specific conceptual and practical weaknesses behind overall scores. LearnLens aims to address this by combining theory and coding assessments, execution results, mistake analysis, Knowledge Fingerprinting, adaptive challenges, and Proof-of-Learn to provide a more evidence-driven approach to learning verification.**

---

## 6. Desired Outcome

The goal is to make progress depend more on **demonstrated understanding** rather than simple completion.

```text
Learn
  ↓
Attempt
  ↓
Evidence
  ↓
Analyze
  ↓
Identify Weakness
  ↓
Adaptive Challenge
  ↓
Proof-of-Learn
  ↓
Progress / Reinforce
```

LearnLens therefore shifts the focus from:

> **"Did you finish it?"**

to:

> **"Can you demonstrate that you understand it?"**

---