import { useEffect, useState } from "react";

import AssessmentQuestionNavigator from "../components/AssessmentQuestionNavigator";
import AdaptiveRecovery from "../components/AdaptiveRecovery";

import { explainWeaknesses } from "../data/concepts.js";

const MASTERY_THRESHOLD = 80;

function ExplainAssessment({
  concept,
  student,
  onComplete,
  onBack,
}) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState(null);
  const [adaptiveWeakness, setAdaptiveWeakness] = useState(null);

  const [saving, setSaving] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(true);

  const [completedIds, setCompletedIds] = useState(new Set());
  const [questionScores, setQuestionScores] = useState({});
  const [explainScore, setExplainScore] = useState(0);

  // True when we are testing weak questions again
  const [isRetest, setIsRetest] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;

  const explainQuestions = concept?.explainQuestions || [];

  // ============================================================
  // CALCULATE OVERALL EXPLAIN SCORE
  // ============================================================

  const calculateExplainScore = (scores) => {
    if (!explainQuestions.length) {
      return 0;
    }

    const values = explainQuestions.map((question) => {
      return Number(scores[question.id] ?? 0);
    });

    const total = values.reduce(
      (sum, score) => sum + score,
      0
    );

    return Math.round(total / explainQuestions.length);
  };

  // ============================================================
  // FIND WEAKEST QUESTION
  // ============================================================

  const findWeakestQuestion = (scores) => {
    const weakQuestions = explainQuestions.filter(
      (question) =>
        Number(scores[question.id] ?? 0) < MASTERY_THRESHOLD
    );

    if (weakQuestions.length === 0) {
      return null;
    }

    return weakQuestions.reduce((weakest, current) => {
      const weakestScore = Number(
        scores[weakest.id] ?? 0
      );

      const currentScore = Number(
        scores[current.id] ?? 0
      );

      return currentScore < weakestScore
        ? current
        : weakest;
    });
  };

  // ============================================================
  // FIND NEXT WEAK QUESTION
  // ============================================================

  const findNextWeakQuestion = (
    scores,
    currentIndex = -1
  ) => {
    return explainQuestions.findIndex(
      (question, index) =>
        index > currentIndex &&
        Number(scores[question.id] ?? 0) <
          MASTERY_THRESHOLD
    );
  };

  // ============================================================
  // OPEN QUESTION
  // ============================================================

  const openQuestion = (index) => {
    const selectedQuestion =
      explainQuestions[index];

    if (!selectedQuestion) {
      return;
    }

    setQuestionIndex(index);
    setAnswer("");
    setResult(null);
  };

  // ============================================================
  // QUESTION NAVIGATOR
  // ============================================================

  const handleQuestionSelect = (index) => {
    openQuestion(index);
  };

  // ============================================================
  // LOAD PROGRESS
  // ============================================================

  useEffect(() => {
    if (!student?.id || !concept?.id) {
      setLoadingProgress(false);
      return;
    }

    const loadProgress = async () => {
      try {
        setLoadingProgress(true);

        const response = await fetch(
          `${API_URL}/progress/${student.id}/${concept.id}/explain`
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load explain progress"
          );
        }

        const data = await response.json();

        console.log("EXPLAIN PROGRESS:", data);

        const loadedCompletedIds = new Set(
          data.completed_question_ids || []
        );

        const loadedScores =
          data.question_scores || {};

        setCompletedIds(loadedCompletedIds);
        setQuestionScores(loadedScores);

        const loadedExplainScore =
          calculateExplainScore(loadedScores);

        setExplainScore(loadedExplainScore);

        console.log(
          "LOADED EXPLAIN SCORE:",
          loadedExplainScore
        );

        // ======================================================
        // ALREADY MASTERED
        // ======================================================

        if (
          loadedExplainScore >=
          MASTERY_THRESHOLD
        ) {
          console.log(
            "EXPLAIN ALREADY MASTERED → MOVING TO NEXT"
          );

          onComplete();
          return;
        }

        // ======================================================
        // FIND FIRST INCOMPLETE QUESTION
        // ======================================================

        const nextIncompleteIndex =
          explainQuestions.findIndex(
            (question) =>
              !loadedCompletedIds.has(
                question.id
              )
          );

        if (nextIncompleteIndex !== -1) {
          console.log(
            "OPENING INCOMPLETE EXPLAIN QUESTION:",
            nextIncompleteIndex
          );

          setQuestionIndex(
            nextIncompleteIndex
          );

          return;
        }

        // ======================================================
        // ALL QUESTIONS COMPLETED BUT NOT MASTERED
        // ======================================================

        console.log(
          "ALL EXPLAIN QUESTIONS COMPLETED BUT MASTERY NOT REACHED"
        );

        const weakestQuestion =
          findWeakestQuestion(loadedScores);

        if (weakestQuestion) {
          console.log(
            "WEAKEST EXPLAIN QUESTION:",
            weakestQuestion.id
          );

          setAdaptiveWeakness(
            explainWeaknesses[
              weakestQuestion.id
            ] || {
              type: "general_explain",
              title:
                "Strengthen your explanation",
              description:
                "Review the concept and explain it again in your own words.",
            }
          );
        }
      } catch (error) {
        console.error(
          "Could not load explain progress:",
          error
        );
      } finally {
        setLoadingProgress(false);
      }
    };

    loadProgress();
  }, [
    student?.id,
    concept?.id,
    API_URL,
  ]);

  // ============================================================
  // SAFETY CHECKS
  // ============================================================

  if (!student?.id) {
    return (
      <main className="concept-page">
        <button
          type="button"
          className="back-button"
          onClick={onBack}
        >
          ← Back
        </button>

        <h1>Student information not found</h1>

        <p>
          Please log in again before starting the
          assessment.
        </p>
      </main>
    );
  }

  if (
    !concept ||
    explainQuestions.length === 0
  ) {
    return (
      <main className="concept-page">
        <button
          type="button"
          className="back-button"
          onClick={onBack}
        >
          ← Back
        </button>

        <h1>Explain questions not found</h1>

        <p>
          This concept does not have any Explain
          questions yet.
        </p>
      </main>
    );
  }

  if (loadingProgress) {
    return (
      <main className="explain-assessment">
        <p>Loading your progress...</p>
      </main>
    );
  }

  // ============================================================
  // CURRENT QUESTION
  // ============================================================

  const question =
    explainQuestions[questionIndex];

  if (!question) {
    return (
      <main className="explain-assessment">
        <button
          type="button"
          className="back-button"
          onClick={onBack}
        >
          ← Back
        </button>

        <h1>Question not found</h1>
      </main>
    );
  }

  // ============================================================
  // EVALUATE ANSWER
  // ============================================================

  const evaluateAnswer = (text) => {
    const lower = text.toLowerCase().trim();

    if (!lower) {
      return 0;
    }

    // ----------------------------------------------------------
    // SYNONYM GROUPS
    // ----------------------------------------------------------

    const conceptGroups = {
      loop: [
        "loop",
        "loops",
        "iteration",
        "iterations",
        "repeat",
        "repeats",
        "repeated",
        "repetition",
      ],

      for: [
        "for loop",
        "for",
        "iterate",
        "iterates",
        "iteration",
        "sequence",
      ],

      while: [
        "while",
        "while loop",
        "condition",
      ],

      true: [
        "true",
        "true condition",
        "condition is true",
        "while true",
      ],

      false: [
        "false",
        "condition becomes false",
        "condition is false",
        "no longer true",
        "not true",
      ],

      infinite: [
        "infinite",
        "infinite loop",
        "run forever",
        "runs forever",
        "never stop",
        "never stops",
        "does not stop",
        "doesn't stop",
        "continues forever",
        "keeps running",
      ],

      update: [
        "update",
        "updates",
        "change the variable",
        "changes the variable",
        "increment",
        "incrementing",
        "decrement",
        "decrementing",
        "modify the variable",
        "changes the condition",
      ],

      range: [
        "range",
        "sequence of numbers",
        "numbers",
      ],

      break: [
        "break",
        "stop the loop",
        "stops the loop",
        "terminate",
        "terminates",
        "ends the loop",
        "end the loop",
      ],

      continue: [
        "continue",
        "skip",
        "skips",
        "skip the current iteration",
        "next iteration",
      ],

      nested: [
        "nested",
        "inside another loop",
        "loop inside",
        "inner loop",
        "outer loop",
      ],
    };

    // ----------------------------------------------------------
    // QUESTION KEYWORDS
    // ----------------------------------------------------------

    const keywords = question.keywords || [];

    if (keywords.length === 0) {
      return 0;
    }

    let matched = 0;

    keywords.forEach((keyword) => {
      const key = keyword.toLowerCase();

      // Direct match
      if (lower.includes(key)) {
        matched++;
        return;
      }

      // Synonym match
      const group = conceptGroups[key];

      if (
        group &&
        group.some((phrase) =>
          lower.includes(phrase)
        )
      ) {
        matched++;
      }
    });

    // ----------------------------------------------------------
    // KEYWORD SCORE
    // ----------------------------------------------------------

    const keywordScore =
      (matched / keywords.length) * 100;

    // ----------------------------------------------------------
    // DETAIL BONUS
    // ----------------------------------------------------------

    let detailBonus = 0;

    if (lower.length >= 40) {
      detailBonus += 5;
    }

    if (lower.length >= 70) {
      detailBonus += 5;
    }

    // ----------------------------------------------------------
    // FINAL SCORE
    // ----------------------------------------------------------

    return Math.min(
      100,
      Math.round(
        keywordScore * 0.9 + detailBonus
      )
    );
  };

  // ============================================================
  // FEEDBACK
  // ============================================================

  const getFeedback = (score) => {
    if (score >= 80) {
      return {
        title: "Strong explanation",
        message:
          "Your explanation demonstrates a strong understanding of the concept.",
      };
    }

    if (score >= 50) {
      return {
        title: "Good start",
        message:
          "You demonstrated part of the idea, but your explanation could be more complete.",
      };
    }

    return {
      title: "Needs more explanation",
      message:
        "Your answer shows limited evidence of understanding. Try explaining the important Python behavior in your own words.",
    };
  };

  // ============================================================
  // SUBMIT EXPLANATION
  // ============================================================

  const submitExplanation = async () => {
    if (saving) {
      return;
    }

    if (answer.trim().length < 20) {
      setResult({
        success: false,
        message:
          "Please explain your reasoning in at least a few sentences.",
      });

      return;
    }

    try {
      setSaving(true);

      const score =
        evaluateAnswer(answer);

      const feedback =
        getFeedback(score);

      console.log(
        "EXPLAIN SCORE:",
        score
      );

      // --------------------------------------------------------
      // SAVE ATTEMPT
      // --------------------------------------------------------

      const response = await fetch(
        `${API_URL}/attempts`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            student_id: String(student.id),

            concept: concept.id,

            dimension: "explain",

            question_id: question.id,

            score,

            question: question.question,

            student_answer: answer,

            correct_answer:
              question.expectedPoints?.join(
                " | "
              ) || "",

            correct_code:
              question.correctCode || "",

            mistake:
              score < MASTERY_THRESHOLD
                ? "weak_explanation"
                : "none",

            recommendation:
              score < MASTERY_THRESHOLD
                ? "Review the concept and explain it again using your own words."
                : "Continue to the next learning dimension.",
          }),
        }
      );

      const responseText =
        await response.text();

      if (!response.ok) {
        console.error(
          "Explain attempt failed:",
          response.status,
          responseText
        );

        throw new Error(
          `Failed to save explanation: ${response.status}`
        );
      }

      // --------------------------------------------------------
      // IMPORTANT:
      // CREATE UPDATED SCORES FIRST
      // --------------------------------------------------------

      const updatedScores = {
        ...questionScores,
        [question.id]: score,
      };

      setQuestionScores(
        updatedScores
      );

      // Calculate from UPDATED object,
      // not stale React state.
      const updatedExplainScore =
        calculateExplainScore(
          updatedScores
        );

      setExplainScore(
        updatedExplainScore
      );

      console.log(
        "UPDATED EXPLAIN SCORES:",
        updatedScores
      );

      console.log(
        "UPDATED EXPLAIN SCORE:",
        updatedExplainScore
      );

      // --------------------------------------------------------
      // MARK QUESTION COMPLETE ONLY IF ≥80
      // --------------------------------------------------------

      if (
        score >= MASTERY_THRESHOLD
      ) {
        setCompletedIds(
          (previous) => {
            const updated =
              new Set(previous);

            updated.add(
              question.id
            );

            return updated;
          }
        );
      }

      // --------------------------------------------------------
      // SHOW RESULT
      // --------------------------------------------------------

      setResult({
        success: true,
        score,
        title: feedback.title,
        message: feedback.message,
      });
    } catch (error) {
      console.error(
        "Explain submission error:",
        error
      );

      setResult({
        success: false,
        message:
          "Could not save your explanation. Check that the backend is running and that you are logged in.",
      });
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // TRY AGAIN / ADAPTIVE RECOVERY
  // ============================================================

  const tryAgain = () => {
    console.log(
      "CURRENT EXPLAIN QUESTION:",
      question
    );

    const weakness =
      explainWeaknesses?.[
        question.id
      ];

    console.log(
      "EXPLAIN WEAKNESS:",
      weakness
    );

    setAdaptiveWeakness(
      weakness || {
        type: "general_explain",
        title:
          "Strengthen your explanation",
        description:
          "Review the concept and explain it again in your own words.",
      }
    );
  };

  // ============================================================
  // CONTINUE TO NEXT QUESTION
  // ============================================================

  const continueToNextQuestion = () => {
    // ========================================================
    // RETEST MODE
    // ========================================================

    if (isRetest) {
      const nextWeakIndex =
        findNextWeakQuestion(
          questionScores,
          questionIndex
        );

      if (nextWeakIndex !== -1) {
        openQuestion(
          nextWeakIndex
        );

        return;
      }

      // ------------------------------------------------------
      // No weak questions after current question.
      // Check mastery using current scores.
      // ------------------------------------------------------

      const currentScore =
        calculateExplainScore(
          questionScores
        );

      setExplainScore(
        currentScore
      );

      console.log(
        "RETEST EXPLAIN SCORE:",
        currentScore
      );

      if (
        currentScore >=
        MASTERY_THRESHOLD
      ) {
        console.log(
          "RETEST MASTERED → MOVING TO NEXT"
        );

        onComplete();

        return;
      }

      // ------------------------------------------------------
      // Still not mastered.
      // Start another recovery cycle.
      // ------------------------------------------------------

      const weakestQuestion =
        findWeakestQuestion(
          questionScores
        );

      if (weakestQuestion) {
        setAdaptiveWeakness(
          explainWeaknesses[
            weakestQuestion.id
          ] || {
            type: "general_explain",
            title:
              "Strengthen your explanation",
            description:
              "Review the concept and explain it again in your own words.",
          }
        );
      }

      return;
    }

    // ========================================================
    // NORMAL MODE
    // ========================================================

    const nextIndex =
      explainQuestions.findIndex(
        (q, index) =>
          index > questionIndex &&
          !completedIds.has(q.id)
      );

    if (nextIndex !== -1) {
      openQuestion(
        nextIndex
      );

      return;
    }

    // ========================================================
    // CHECK ALL QUESTIONS
    // ========================================================

    const allCompleted =
      explainQuestions.every(
        (q) =>
          completedIds.has(q.id)
      );

    if (!allCompleted) {
      const firstIncompleteIndex =
        explainQuestions.findIndex(
          (q) =>
            !completedIds.has(
              q.id
            )
        );

      if (
        firstIncompleteIndex !== -1
      ) {
        openQuestion(
          firstIncompleteIndex
        );
      }

      return;
    }

    // ========================================================
    // ALL QUESTIONS COMPLETE
    // ========================================================

    const overallScore =
      calculateExplainScore(
        questionScores
      );

    setExplainScore(
      overallScore
    );

    console.log(
      "FINAL EXPLAIN SCORE:",
      overallScore
    );

    // ========================================================
    // MASTERED
    // ========================================================

    if (
      overallScore >=
      MASTERY_THRESHOLD
    ) {
      console.log(
        "EXPLAIN MASTERED → MOVING TO NEXT"
      );

      onComplete();

      return;
    }

    // ========================================================
    // NOT MASTERED
    // ========================================================

    console.log(
      "EXPLAIN NOT MASTERED → ADAPTIVE RECOVERY"
    );

    const weakestQuestion =
      findWeakestQuestion(
        questionScores
      );

    if (weakestQuestion) {
      setAdaptiveWeakness(
        explainWeaknesses[
          weakestQuestion.id
        ] || {
          type: "general_explain",
          title:
            "Strengthen your explanation",
          description:
            "Review the concept and explain it again in your own words.",
        }
      );
    }
  };

  // ============================================================
  // RECOVERY COMPLETE → START RETEST
  // ============================================================

  const handleRecoveryComplete = () => {
    console.log(
      "ADAPTIVE RECOVERY COMPLETE"
    );

    setAdaptiveWeakness(null);
    setAnswer("");
    setResult(null);

    // Enter retest mode
    setIsRetest(true);

    // Find weakest question using
    // latest scores
    const weakestQuestion =
      findWeakestQuestion(
        questionScores
      );

    if (weakestQuestion) {
      const weakestIndex =
        explainQuestions.findIndex(
          (q) =>
            q.id ===
            weakestQuestion.id
        );

      if (
        weakestIndex !== -1
      ) {
        console.log(
          "STARTING EXPLAIN RETEST AT:",
          weakestQuestion.id
        );

        setQuestionIndex(
          weakestIndex
        );
      }
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <main className="explain-assessment">

      {/* BACK */}

      <button
        type="button"
        className="back-button"
        onClick={onBack}
      >
        ← Back to learning
      </button>

      {/* HEADER */}

      <div className="explain-header">
        <p className="section-label">
          STEP 3 • EXPLAIN ASSESSMENT
        </p>

        <h1>
          Explain your reasoning
        </h1>

        <p>
          Don't just give an answer.
          Explain the idea in your own
          words.
        </p>
      </div>

      {/* SCORE DISPLAY */}

      <div className="recall-score">
        <strong>
          Explain Score:{" "}
          {explainScore}%
        </strong>

        <span>
          {explainScore >=
          MASTERY_THRESHOLD
            ? " ✓ Mastered"
            : ` — ${MASTERY_THRESHOLD}% needed to continue`}
        </span>
      </div>

      {/* RETEST INDICATOR */}

      {isRetest && (
        <div className="retest-banner">
          <strong>
            🔄 Explain Retest
          </strong>

          <span>
            Let's strengthen the
            questions that need more
            practice.
          </span>
        </div>
      )}

      {/* QUESTION NAVIGATOR */}

      <AssessmentQuestionNavigator
        questions={explainQuestions}
        currentIndex={questionIndex}
        completedIds={completedIds}
        questionScores={questionScores}
        onSelectQuestion={
          handleQuestionSelect
        }
      />

      {/* ======================================================
          ADAPTIVE RECOVERY
      ====================================================== */}

      {adaptiveWeakness ? (
        <div className="mastery-recovery">

          <h2>
            You're not ready to move on
            yet.
          </h2>

          <p>
            Your Explain score is{" "}
            <strong>
              {explainScore}%
            </strong>.
          </p>

          <p>
            You need at least{" "}
            <strong>
              {MASTERY_THRESHOLD}%
            </strong>{" "}
            to continue.
          </p>

          <AdaptiveRecovery
            weakness={
              adaptiveWeakness
            }
            concept={concept}
            onComplete={
              handleRecoveryComplete
            }
          />

        </div>
      ) : (

        /* ====================================================
           NORMAL QUESTION UI
        ==================================================== */

        <div className="explain-card">

          {/* QUESTION NUMBER */}

          <div className="question-number">
            QUESTION{" "}
            {String(
              questionIndex + 1
            ).padStart(2, "0")}{" "}
            /{" "}
            {String(
              explainQuestions.length
            ).padStart(2, "0")}
          </div>

          {/* QUESTION */}

          <div className="question-box">

            <p className="question-label">
              EXPLAIN
            </p>

            <h2>
              {question.question}
            </h2>

          </div>

          {/* TEXT INPUT */}

          <textarea
            value={answer}
            onChange={(event) =>
              setAnswer(
                event.target.value
              )
            }
            placeholder="Explain in your own words..."
            className="explain-input"
            disabled={
              saving || !!result
            }
          />

          {/* SUBMIT */}

          {!result && (
            <button
              type="button"
              className="primary-button"
              onClick={
                submitExplanation
              }
              disabled={
                saving ||
                answer.trim()
                  .length < 20
              }
            >
              {saving
                ? "Saving..."
                : "Submit Explanation →"}
            </button>
          )}

          {/* RESULT */}

          {result && (
            <div
              className={
                result.success
                  ? "explain-result success"
                  : "explain-result error"
              }
            >

              {/* SCORE */}

              {result.success && (
                <div className="explain-score">
                  {result.score}%
                </div>
              )}

              {/* TITLE */}

              <strong>
                {result.success
                  ? result.title
                  : "Needs More Explanation"}
              </strong>

              {/* MESSAGE */}

              <p>
                {result.message}
              </p>

              {/* SAVE ERROR */}

              {!result.success && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setResult(null);
                  }}
                >
                  Try Again
                </button>
              )}

              {/* LOW SCORE */}

              {result.success &&
                result.score <
                  MASTERY_THRESHOLD && (
                  <>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={
                        tryAgain
                      }
                    >
                      Strengthen This
                      Weakness →
                    </button>

                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => {
                        setAnswer("");
                        setResult(null);
                      }}
                    >
                      Try Again
                    </button>
                  </>
                )}

              {/* MASTERED ANSWER */}

              {result.success &&
                result.score >=
                  MASTERY_THRESHOLD && (
                  <button
                    type="button"
                    className="primary-button"
                    onClick={
                      continueToNextQuestion
                    }
                  >
                    {isRetest
                      ? "Continue Retest →"
                      : completedIds.size <
                        explainQuestions.length
                      ? "Continue →"
                      : "Check Explain Mastery →"}
                  </button>
                )}

            </div>
          )}

        </div>
      )}

    </main>
  );
}

export default ExplainAssessment;