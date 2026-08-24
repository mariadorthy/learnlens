# LearnLens — Features

## 1. Overview

LearnLens MVP focuses on six core capabilities that work together to support **adaptive learning and evidence-based learning verification**.

---

## 2. Adaptive Learning Roadmap

Provides a structured learning progression:

```text
Basic → Intermediate → Advanced
```

Learner progress can be reinforced when additional practice is needed.

---

## 3. Theory + Coding Assessment

LearnLens evaluates both conceptual and practical understanding through activities such as:

* Explain
* Predict
* Implement
* Modify
* Debug

This provides multiple forms of learning evidence.

---

## 4. Code Execution & Mistake Tracking

Learners can submit Python code and receive execution results.

The system tracks evidence such as:

* Execution errors
* Wrong outputs
* Successful attempts
* Number of attempts
* Mistake patterns

```text
Code Submission
      ↓
Python Execution
      ↓
Result / Error
      ↓
Learning Evidence
```

The current MVP executes submitted Python code and uses the execution result as learning evidence.

---

## 5. AI-Assisted Mistake Analysis

LearnLens uses **Google GenAI** to support analysis of learner attempts and coding mistakes.

```text
Learner Attempt
      ↓
Execution / Assessment Result
      ↓
AI-Assisted Analysis
      ↓
Possible Learning Gap
```

The AI acts as an analysis layer within the learning workflow rather than as a standalone chatbot.

---

## 6. Knowledge Fingerprint

The Knowledge Fingerprint represents learner understanding across multiple dimensions:

```text
Recall → Explain → Predict → Implement → Debug → Apply
```

It helps identify areas where the learner demonstrates stronger or weaker understanding.

---

## 7. Proof-of-Learn

LearnLens uses collected evidence to support verification of understanding.

```text
Evidence
   ↓
Understanding Check
   ↓
Evidence Sufficient for Verification?
   ↙          ↘
 Yes          No
 ↓            ↓
Proof-of-   Reinforce
Learn       / Reassess
```

The goal is to move beyond simple lesson completion as the indicator of mastery.

---

## 8. Adaptive Challenges

Challenges can be targeted according to identified weaknesses.

```text
Theory Weakness
      ↓
Conceptual Challenge
```

```text
Coding Weakness
      ↓
Implementation / Debugging Challenge
```

This allows practice to be more relevant to the learner's demonstrated needs.

---

## 9. Feature Summary

| Feature               | Purpose                                         |
| --------------------- | ----------------------------------------------- |
| Adaptive Roadmap      | Guides learning progression                     |
| Theory + Coding       | Assesses conceptual and practical understanding |
| Code Execution        | Captures programming performance                |
| Mistake Tracking      | Records errors and recurring difficulties       |
| AI Analysis           | Supports mistake and learning-gap analysis      |
| Knowledge Fingerprint | Represents understanding across dimensions      |
| Proof-of-Learn        | Supports evidence-based verification            |
| Adaptive Challenges   | Targets identified weaknesses                   |

---

## 10. MVP Focus

The features work together as one learning loop:

```text
Learn
 ↓
Assess
 ↓
Collect Evidence
 ↓
Analyze
 ↓
Identify Weakness
 ↓
Adapt
 ↓
Verify
```

**LearnLens focuses on turning learner activity into meaningful evidence of understanding.**

---