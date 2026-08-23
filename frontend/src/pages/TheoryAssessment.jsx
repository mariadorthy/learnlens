import { useEffect, useMemo, useState } from "react";

import AssessmentQuestionNavigator from "../components/AssessmentQuestionNavigator";
import AdaptiveRecovery from "../components/AdaptiveRecovery";
import { theoryWeaknesses } from "../data/concepts.js";

const MASTERY_THRESHOLD = 80;

function TheoryAssessment({
  concept,
  student,
  onComplete,
  onBack,
}) {
  const API_URL = import.meta.env.VITE_API_URL;

  const theoryQuestions = concept?.theoryQuestions || [];

  // ------------------------------------------------------------
  // STATE
  // ------------------------------------------------------------

  const [questionIndex, setQuestionIndex] = useState(0);

  const [selectedAnswer, setSelectedAnswer] = useState(null);

  const [result, setResult] = useState(null);

  const [adaptiveWeakness, setAdaptiveWeakness] = useState(null);

  const [saving, setSaving] = useState(false);

  const [loadingProgress, setLoadingProgress] = useState(true);

  const [completedIds, setCompletedIds] = useState(new Set());

  const [questionScores, setQuestionScores] = useState({});

  const [recallScore, setRecallScore] = useState(0);

  // false = first attempt
  // true  = retesting weak questions
  const [isRetest, setIsRetest] = useState(false);

  // ------------------------------------------------------------
  // MEMOIZED SCORE
  // ------------------------------------------------------------

  const calculatedRecallScore = useMemo(() => {
    if (!theoryQuestions.length) {
      return 0;
    }

    const total = theoryQuestions.reduce((sum, question) => {
      return sum + Number(questionScores[question.id] ?? 0);
    }, 0);

    return Math.round(total / theoryQuestions.length);
  }, [questionScores, theoryQuestions]);

  // Keep displayed score synchronized.
  useEffect(() => {
    setRecallScore(calculatedRecallScore);
  }, [calculatedRecallScore]);

  // ------------------------------------------------------------
  // CALCULATE SCORE FROM ANY SCORE OBJECT
  // ------------------------------------------------------------

  const calculateRecallScore = (scores) => {
    if (!theoryQuestions.length) {
      return 0;
    }

    const total = theoryQuestions.reduce((sum, question) => {
      return sum + Number(scores[question.id] ?? 0);
    }, 0);

    return Math.round(total / theoryQuestions.length);
  };

  // ------------------------------------------------------------
  // FIND WEAKEST QUESTION
  // ------------------------------------------------------------

  const findWeakestQuestion = (scores) => {
    const weakQuestions = theoryQuestions.filter((question) => {
      return Number(scores[question.id] ?? 0) < MASTERY_THRESHOLD;
    });

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

  // ------------------------------------------------------------
  // FIND NEXT WEAK QUESTION
  // ------------------------------------------------------------

  const findNextWeakQuestion = (
    scores,
    currentIndex = -1
  ) => {
    return theoryQuestions.findIndex(
      (question, index) =>
        index > currentIndex &&
        Number(scores[question.id] ?? 0) <
          MASTERY_THRESHOLD
    );
  };

  // ------------------------------------------------------------
  // OPEN QUESTION
  // ------------------------------------------------------------

  const openQuestion = (index) => {
    if (
      index < 0 ||
      index >= theoryQuestions.length
    ) {
      return;
    }

    setQuestionIndex(index);
    setSelectedAnswer(null);
    setResult(null);
  };

  // ------------------------------------------------------------
  // QUESTION NAVIGATOR
  // ------------------------------------------------------------

  const handleQuestionSelect = (index) => {
    // Do not allow navigation while saving.
    if (saving) {
      return;
    }

    openQuestion(index);
  };

  // ------------------------------------------------------------
  // GET ADAPTIVE WEAKNESS
  // ------------------------------------------------------------

  const getWeakness = (question) => {
    if (!question) {
      return {
        type: "general_recall",
        title: "Strengthen your recall",
        description:
          "Review the concept and practice another recall challenge.",
      };
    }

    return (
      theoryWeaknesses[question.id] || {
        type: "general_recall",
        title: "Strengthen your recall",
        description:
          "Review the concept and practice another recall challenge.",
      }
    );
  };

  // ------------------------------------------------------------
  // LOAD EXISTING PROGRESS
  // ------------------------------------------------------------

  useEffect(() => {
    if (!student?.id || !concept?.id) {
      setLoadingProgress(false);
      return;
    }

    let cancelled = false;

    const loadProgress = async () => {
      try {
        setLoadingProgress(true);

        const response = await fetch(
          `${API_URL}/progress/${student.id}/${concept.id}/recall`
        );

        if (!response.ok) {
          throw new Error(
            `Failed to load progress: ${response.status}`
          );
        }

        const data = await response.json();

        if (cancelled) {
          return;
        }

        console.log(
          "THEORY PROGRESS:",
          data
        );

        const loadedCompletedIds = new Set(
          data.completed_question_ids || []
        );

        const loadedScores =
          data.question_scores || {};

        setCompletedIds(loadedCompletedIds);
        setQuestionScores(loadedScores);

        const loadedRecallScore =
          calculateRecallScore(loadedScores);

        setRecallScore(loadedRecallScore);

        console.log(
          "LOADED RECALL SCORE:",
          loadedRecallScore
        );

        // --------------------------------------------------------
        // ALREADY MASTERED
        // --------------------------------------------------------

        if (
          loadedRecallScore >=
          MASTERY_THRESHOLD
        ) {
          console.log(
            "RECALL ALREADY MASTERED → MOVING TO EXPLAIN"
          );

          onComplete();
          return;
        }

        // --------------------------------------------------------
        // FIND INCOMPLETE QUESTION
        // --------------------------------------------------------

        const nextIncompleteIndex =
          theoryQuestions.findIndex(
            (question) =>
              !loadedCompletedIds.has(
                question.id
              )
          );

        if (nextIncompleteIndex !== -1) {
          console.log(
            "OPENING INCOMPLETE QUESTION:",
            nextIncompleteIndex
          );

          setQuestionIndex(
            nextIncompleteIndex
          );

          return;
        }

        // --------------------------------------------------------
        // ALL QUESTIONS COMPLETED BUT NOT MASTERED
        // --------------------------------------------------------

        console.log(
          "ALL RECALL QUESTIONS COMPLETED BUT MASTERY NOT REACHED"
        );

        const weakestQuestion =
          findWeakestQuestion(loadedScores);

        if (weakestQuestion) {
          setAdaptiveWeakness(
            getWeakness(weakestQuestion)
          );
        }
      } catch (error) {
        console.error(
          "Could not load learning progress:",
          error
        );
      } finally {
        if (!cancelled) {
          setLoadingProgress(false);
        }
      }
    };

    loadProgress();

    return () => {
      cancelled = true;
    };
  }, [
    student?.id,
    concept?.id,
    API_URL,
  ]);

  // ------------------------------------------------------------
  // SAFETY CHECKS
  // ------------------------------------------------------------

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

        <h1>
          Student information not found
        </h1>

        <p>
          Please log in again before starting
          the assessment.
        </p>
      </main>
    );
  }

  if (
    !concept ||
    theoryQuestions.length === 0
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

        <h1>
          Theory questions not found
        </h1>

        <p>
          This concept does not have any
          theory questions yet.
        </p>
      </main>
    );
  }

  if (loadingProgress) {
    return (
      <main className="theory-assessment">
        <p>
          Loading your progress...
        </p>
      </main>
    );
  }

  // ------------------------------------------------------------
  // CURRENT QUESTION
  // ------------------------------------------------------------

  const question =
    theoryQuestions[questionIndex];

  if (!question) {
    return (
      <main className="theory-assessment">
        <button
          type="button"
          className="back-button"
          onClick={onBack}
        >
          ← Back
        </button>

        <h1>
          Question not found
        </h1>
      </main>
    );
  }

  // ------------------------------------------------------------
  // CHECK ANSWER
  // ------------------------------------------------------------

  const checkAnswer = async () => {
    if (
      selectedAnswer === null ||
      saving ||
      result
    ) {
      return;
    }

    const selectedIndex =
      Number(selectedAnswer);

    const correctIndex =
      Number(question.correctAnswer);

    const isCorrect =
      selectedIndex === correctIndex;

    const score = isCorrect ? 100 : 0;

    // Show immediate result.
    setResult({
      correct: isCorrect,
      message: isCorrect
        ? "Correct!"
        : "Not quite. Try again.",
    });

    // ----------------------------------------------------------
    // CREATE UPDATED SCORE IMMEDIATELY
    // ----------------------------------------------------------

    const updatedScores = {
      ...questionScores,
      [question.id]: score,
    };

    const updatedRecallScore =
      calculateRecallScore(updatedScores);

    console.log(
      "ANSWER:",
      question.id
    );

    console.log(
      "ANSWER CORRECT:",
      isCorrect
    );

    console.log(
      "UPDATED SCORES:",
      updatedScores
    );

    console.log(
      "UPDATED RECALL SCORE:",
      updatedRecallScore
    );

    // Update React immediately.
    setQuestionScores(updatedScores);
    setRecallScore(updatedRecallScore);

    // ----------------------------------------------------------
    // MARK CORRECT QUESTION COMPLETE
    // ----------------------------------------------------------

    if (isCorrect) {
      setCompletedIds((previous) => {
        const updated =
          new Set(previous);

        updated.add(question.id);

        return updated;
      });
    }

    // ----------------------------------------------------------
    // SAVE TO BACKEND
    // ----------------------------------------------------------

    try {
      setSaving(true);

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

            dimension: "recall",

            question_id: question.id,

            score,

            question:
              question.question,

            student_answer:
              question.options[
                selectedIndex
              ],

            correct_answer:
              question.options[
                correctIndex
              ],

            mistake: isCorrect
              ? "none"
              : "incorrect_theory_answer",
          }),
        }
      );

      const responseText =
        await response.text();

      if (!response.ok) {
        console.error(
          "Failed to save theory answer:",
          response.status,
          responseText
        );

        // Do not destroy the local state.
        // The user can continue, but backend
        // failure is visible in console.
        return;
      }

      console.log(
        "THEORY ANSWER SAVED:",
        responseText
      );
    } catch (error) {
      console.error(
        "Theory answer network error:",
        error
      );
    } finally {
      setSaving(false);
    }
  };

  // ------------------------------------------------------------
  // TRY AGAIN / ADAPTIVE RECOVERY
  // ------------------------------------------------------------

  const tryAgain = () => {
    console.log(
      "CURRENT QUESTION:",
      question
    );

    const weakness =
      getWeakness(question);

    console.log(
      "WEAKNESS:",
      weakness
    );

    setAdaptiveWeakness(weakness);
  };

  // ------------------------------------------------------------
  // MOVE AFTER CORRECT ANSWER
  // ------------------------------------------------------------

  const continueToNextQuestion = () => {
    if (!result?.correct) {
      return;
    }

    // ----------------------------------------------------------
    // RETEST MODE
    // ----------------------------------------------------------

    if (isRetest) {
      console.log(
        "RETEST CURRENT SCORES:",
        questionScores
      );

      const nextWeakIndex =
        findNextWeakQuestion(
          questionScores,
          questionIndex
        );

      if (nextWeakIndex !== -1) {
        console.log(
          "NEXT WEAK QUESTION:",
          nextWeakIndex
        );

        openQuestion(nextWeakIndex);
        return;
      }

      // --------------------------------------------------------
      // NO MORE WEAK QUESTIONS AFTER CURRENT
      // --------------------------------------------------------

      const currentScore =
        calculateRecallScore(
          questionScores
        );

      setRecallScore(currentScore);

      console.log(
        "RETEST FINAL SCORE:",
        currentScore
      );

      if (
        currentScore >=
        MASTERY_THRESHOLD
      ) {
        console.log(
          "RETEST MASTERED → MOVING TO EXPLAIN"
        );

        onComplete();
        return;
      }

      // --------------------------------------------------------
      // STILL NOT MASTERED
      // --------------------------------------------------------

      const weakestQuestion =
        findWeakestQuestion(
          questionScores
        );

      if (weakestQuestion) {
        console.log(
          "RETEST STILL WEAK:",
          weakestQuestion.id
        );

        setAdaptiveWeakness(
          getWeakness(weakestQuestion)
        );
      }

      return;
    }

    // ----------------------------------------------------------
    // NORMAL MODE
    // ----------------------------------------------------------

    const updatedCompletedIds =
      new Set(completedIds);

    // ----------------------------------------------------------
    // FIND NEXT INCOMPLETE QUESTION
    // ----------------------------------------------------------

    const nextIndex =
      theoryQuestions.findIndex(
        (q, index) =>
          index > questionIndex &&
          !updatedCompletedIds.has(q.id)
      );

    if (nextIndex !== -1) {
      openQuestion(nextIndex);
      return;
    }

    // ----------------------------------------------------------
    // CHECK ALL QUESTIONS
    // ----------------------------------------------------------

    const allCompleted =
      theoryQuestions.every((q) =>
        updatedCompletedIds.has(q.id)
      );

    if (!allCompleted) {
      const firstIncompleteIndex =
        theoryQuestions.findIndex(
          (q) =>
            !updatedCompletedIds.has(
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

    // ----------------------------------------------------------
    // ALL QUESTIONS COMPLETE
    //
    // IMPORTANT:
    // Use the current question score directly
    // because React state may still be stale.
    // ----------------------------------------------------------

    const finalScores = {
      ...questionScores,
      [question.id]:
        Number(
          questionScores[question.id] ??
            0
        ),
    };

    const overallScore =
      calculateRecallScore(
        finalScores
      );

    setRecallScore(overallScore);

    console.log(
      "ALL QUESTIONS COMPLETE"
    );

    console.log(
      "FINAL SCORES:",
      finalScores
    );

    console.log(
      "FINAL RECALL SCORE:",
      overallScore
    );

    // ----------------------------------------------------------
    // MASTERED
    // ----------------------------------------------------------

    if (
      overallScore >=
      MASTERY_THRESHOLD
    ) {
      console.log(
        "RECALL MASTERED → MOVING TO EXPLAIN"
      );

      onComplete();
      return;
    }

    // ----------------------------------------------------------
    // NOT MASTERED
    // ----------------------------------------------------------

    console.log(
      "RECALL NOT MASTERED → ADAPTIVE RECOVERY"
    );

    const weakestQuestion =
      findWeakestQuestion(
        finalScores
      );

    if (weakestQuestion) {
      setAdaptiveWeakness(
        getWeakness(weakestQuestion)
      );
    }
  };

  // ------------------------------------------------------------
  // RECOVERY COMPLETE → RETEST
  // ------------------------------------------------------------

  const handleRecoveryComplete = () => {
    console.log(
      "ADAPTIVE RECOVERY COMPLETE"
    );

    setAdaptiveWeakness(null);

    setSelectedAnswer(null);

    setResult(null);

    setIsRetest(true);

    // Find weakest question using
    // latest available scores.
    const weakestQuestion =
      findWeakestQuestion(
        questionScores
      );

    if (!weakestQuestion) {
      const currentScore =
        calculateRecallScore(
          questionScores
        );

      if (
        currentScore >=
        MASTERY_THRESHOLD
      ) {
        onComplete();
      }

      return;
    }

    const weakestIndex =
      theoryQuestions.findIndex(
        (q) =>
          q.id ===
          weakestQuestion.id
      );

    if (weakestIndex !== -1) {
      console.log(
        "STARTING RETEST AT:",
        weakestQuestion.id
      );

      setQuestionIndex(
        weakestIndex
      );
    }
  };

  // ------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------

  return (
    <main className="theory-assessment">

      {/* BACK */}

      <button
        type="button"
        className="back-button"
        onClick={onBack}
      >
        ← Back to learning
      </button>

      {/* HEADER */}

      <div className="theory-header">

        <p className="section-label">
          STEP 2 • THEORY ASSESSMENT
        </p>

        <h1>
          Check your understanding
        </h1>

        <p>
          Don't just remember the syntax.
          Predict what the program actually
          does.
        </p>

      </div>

      {/* SCORE */}

      <div className="recall-score">

        <strong>
          Recall Score: {recallScore}%
        </strong>

        <span>
          {recallScore >=
          MASTERY_THRESHOLD
            ? " ✓ Mastered"
            : ` — ${MASTERY_THRESHOLD}% needed to continue`}
        </span>

      </div>

      {/* RETEST BANNER */}

      {isRetest && (
        <div className="retest-banner">

          <strong>
            🔄 Recall Retest
          </strong>

          <span>
            Let's strengthen the questions
            that need more practice.
          </span>

        </div>
      )}

      {/* QUESTION NAVIGATOR */}

      <AssessmentQuestionNavigator
        questions={theoryQuestions}
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
            You're not ready to move on yet.
          </h2>

          <p>
            Your Recall score is{" "}
            <strong>
              {recallScore}%
            </strong>.
          </p>

          <p>
            You need at least{" "}
            <strong>
              {MASTERY_THRESHOLD}%
            </strong>{" "}
            to continue to Explain.
          </p>

          <AdaptiveRecovery
            weakness={adaptiveWeakness}
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

        <div className="theory-card">

          {/* QUESTION NUMBER */}

          <div className="question-number">

            QUESTION{" "}

            {String(
              questionIndex + 1
            ).padStart(2, "0")}

            {" / "}

            {String(
              theoryQuestions.length
            ).padStart(2, "0")}

          </div>

          {/* QUESTION */}

          <h2>
            {question.question}
          </h2>

          {/* CODE */}

          {question.code && (
            <pre className="theory-code">
              <code>
                {question.code}
              </code>
            </pre>
          )}

          {/* CORRECT CODE */}

          {result?.correct &&
            question.correctCode && (

              <div className="correct-code-section">

                <p className="answer-label">
                  CORRECT CODE
                </p>

                <pre className="theory-code">
                  <code>
                    {question.correctCode}
                  </code>
                </pre>

              </div>

            )}

          {/* OPTIONS */}

          <div className="theory-options">

            {question.options.map(
              (option, index) => {

                const isSelected =
                  selectedAnswer ===
                  index;

                const isCorrect =
                  index ===
                  Number(
                    question.correctAnswer
                  );

                const isWrong =
                  result &&
                  isSelected &&
                  !isCorrect;

                return (

                  <button
                    type="button"
                    key={`${question.id}-${index}`}
                    className={`
                      theory-option
                      ${
                        isSelected
                          ? "selected"
                          : ""
                      }
                      ${
                        result &&
                        isCorrect
                          ? "correct"
                          : ""
                      }
                      ${
                        isWrong
                          ? "wrong"
                          : ""
                      }
                    `}
                    onClick={() => {

                      if (
                        !result &&
                        !saving
                      ) {
                        setSelectedAnswer(
                          index
                        );
                      }

                    }}
                    disabled={
                      !!result ||
                      saving
                    }
                  >

                    <span className="option-letter">
                      {String.fromCharCode(
                        65 + index
                      )}
                    </span>

                    <span className="option-text">
                      {option}
                    </span>

                    {result &&
                      isCorrect && (
                        <span className="answer-icon">
                          ✓
                        </span>
                      )}

                    {isWrong && (
                      <span className="answer-icon">
                        ✕
                      </span>
                    )}

                  </button>

                );
              }
            )}

          </div>

          {/* CHECK ANSWER */}

          {!result && (

            <button
              type="button"
              className="primary-button"
              onClick={checkAnswer}
              disabled={
                selectedAnswer === null ||
                saving
              }
            >

              {saving
                ? "Saving..."
                : "Check Answer →"}

            </button>

          )}

          {/* RESULT */}

          {result && (

            <div
              className={
                result.correct
                  ? "theory-result correct"
                  : "theory-result incorrect"
              }
            >

              <strong>

                {result.correct
                  ? "✓ Correct"
                  : "✕ Incorrect"}

              </strong>

              <p>
                {result.message}
              </p>

              {/* SHOW CORRECT ANSWER */}

              {!result.correct && (

                <div className="correct-answer-display">

                  <span>
                    Correct answer:
                  </span>

                  <strong>

                    {String.fromCharCode(
                      65 +
                        Number(
                          question.correctAnswer
                        )
                    )}

                    {" — "}

                    {
                      question.options[
                        Number(
                          question.correctAnswer
                        )
                      ]
                    }

                  </strong>

                </div>

              )}

              {/* ADAPTIVE RECOVERY */}

              {!result.correct && (

                <button
                  type="button"
                  className="secondary-button"
                  onClick={tryAgain}
                >
                  Strengthen This Weakness →
                </button>

              )}

              {/* CONTINUE */}

              {result.correct && (

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
                      theoryQuestions.length
                    ? "Continue →"
                    : "Check Recall Mastery →"}

                </button>

              )}

            </div>

          )}

        </div>

      )}

    </main>
  );
}

export default TheoryAssessment;