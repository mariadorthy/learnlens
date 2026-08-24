import { useEffect, useState } from "react";

import AssessmentQuestionNavigator from "../components/AssessmentQuestionNavigator";
import AdaptiveRecovery from "../components/AdaptiveRecovery";
import { predictWeaknesses } from "../data/concepts.js";

const MASTERY_THRESHOLD = 80;

function PredictAssessment({
  concept,
  student,
  onComplete,
  onBack,
}) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(true);

  const [completedIds, setCompletedIds] = useState(new Set());
  const [questionScores, setQuestionScores] = useState({});
  const [predictScore, setPredictScore] = useState(0);

  const [adaptiveWeakness, setAdaptiveWeakness] = useState(null);

  // True when testing weak questions again
  const [isRetest, setIsRetest] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;

  const predictQuestions = concept?.predictQuestions || [];

  // ============================================================
  // CALCULATE OVERALL PREDICT SCORE
  // ============================================================

  const calculatePredictScore = (scores) => {
    if (!predictQuestions.length) {
      return 0;
    }

    const answeredCount = predictQuestions.filter(
      (question) => scores[question.id] !== undefined
    ).length;

    // Do not allow mastery until every question
    // has been answered.
    if (answeredCount < predictQuestions.length) {
      return 0;
    }

    const total = predictQuestions.reduce(
      (sum, question) =>
        sum + Number(scores[question.id] ?? 0),
      0
    );

    return Math.round(total / predictQuestions.length);
  };

  // ============================================================
  // PREDICT FINGERPRINT
  // ============================================================

  const getPredictFingerprint = (scores) => {
    const masteredQuestions = predictQuestions.filter(
      (question) =>
        Number(scores[question.id] ?? 0) >= MASTERY_THRESHOLD
    );

    const correct = masteredQuestions.length;
    const total = predictQuestions.length;

    return {
      fingerprint_score:
        total === 0
          ? 0
          : Math.round((correct / total) * 100),

      fingerprint_correct: correct,
      fingerprint_total: total,
    };
  };

  // ============================================================
  // UPDATE KNOWLEDGE FINGERPRINT
  // ============================================================

  const updateKnowledgeFingerprint = async (scores) => {
    const fingerprint = getPredictFingerprint(scores);

    console.log(
      "UPDATING PREDICT FINGERPRINT:",
      fingerprint
    );

    if (!API_URL) {
      console.error(
        "VITE_API_URL is not configured."
      );

      return {
        success: false,
        skipped: true,
        reason: "missing_api_url",
        fingerprint,
      };
    }

    if (!student?.id || !concept?.id) {
      console.error(
        "Cannot update fingerprint: missing student or concept."
      );

      return {
        success: false,
        skipped: true,
        reason: "missing_student_or_concept",
        fingerprint,
      };
    }

    try {
      const response = await fetch(
        `${API_URL}/knowledge-fingerprint`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            student_id: String(student.id),
            concept_id: concept.id,

            // Predict fingerprint
            predict_score:
              fingerprint.fingerprint_score,

            predict_correct:
              fingerprint.fingerprint_correct,

            predict_total:
              fingerprint.fingerprint_total,
          }),
        }
      );

      const responseText = await response.text();

      // --------------------------------------------------------
      // IMPORTANT:
      // A 404 means the backend route does not exist.
      // Do not treat it as an assessment failure.
      // --------------------------------------------------------

      if (response.status === 404) {
        console.warn(
          "Knowledge fingerprint endpoint does not exist:",
          `${API_URL}/knowledge-fingerprint`
        );

        console.warn(
          "Predict assessment will continue, but the fingerprint was NOT saved."
        );

        return {
          success: false,
          skipped: true,
          reason: "endpoint_not_found",
          fingerprint,
        };
      }

      if (!response.ok) {
        console.error(
          "Predict fingerprint update failed:",
          response.status,
          responseText
        );

        return {
          success: false,
          skipped: false,
          reason: "server_error",
          status: response.status,
          fingerprint,
        };
      }

      console.log(
        "PREDICT FINGERPRINT UPDATED:",
        responseText
      );

      return {
        success: true,
        skipped: false,
        fingerprint,
      };
    } catch (error) {
      console.error(
        "Knowledge fingerprint request failed:",
        error
      );

      return {
        success: false,
        skipped: false,
        reason: "network_error",
        error,
        fingerprint,
      };
    }
  };

  // ============================================================
  // COMPLETE ASSESSMENT
  // ============================================================

  const completePredictAssessment = async (scores) => {
    const fingerprintResult =
      await updateKnowledgeFingerprint(scores);

    if (!fingerprintResult.success) {
      console.warn(
        "Predict completed, but knowledge fingerprint was not saved.",
        fingerprintResult
      );
    }

    // IMPORTANT:
    // The assessment itself is complete even if the
    // fingerprint endpoint is missing.
    onComplete();
  };

  // ============================================================
  // FIND WEAKEST QUESTION
  // ============================================================

  const findWeakestQuestion = (scores) => {
    const weakQuestions = predictQuestions.filter(
      (question) =>
        Number(scores[question.id] ?? 0) <
        MASTERY_THRESHOLD
    );

    if (weakQuestions.length === 0) {
      return null;
    }

    return weakQuestions.reduce(
      (weakest, current) => {
        const weakestScore = Number(
          scores[weakest.id] ?? 0
        );

        const currentScore = Number(
          scores[current.id] ?? 0
        );

        return currentScore < weakestScore
          ? current
          : weakest;
      }
    );
  };

  // ============================================================
  // FIND NEXT WEAK QUESTION
  // ============================================================

  const findNextWeakQuestion = (
    scores,
    currentIndex = -1
  ) => {
    return predictQuestions.findIndex(
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
      predictQuestions[index];

    if (!selectedQuestion) {
      return;
    }

    setQuestionIndex(index);
    setSelectedAnswer(null);
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
    let cancelled = false;

    if (!student?.id || !concept?.id) {
      setLoadingProgress(false);
      return;
    }

    const loadProgress = async () => {
      try {
        setLoadingProgress(true);

        const response = await fetch(
          `${API_URL}/progress/${student.id}/${concept.id}/predict`
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load predict progress"
          );
        }

        const data = await response.json();

        if (cancelled) {
          return;
        }

        console.log(
          "PREDICT PROGRESS:",
          data
        );

        // --------------------------------------------------------
        // LOAD SCORES
        // --------------------------------------------------------

        const loadedScores =
          data.question_scores || {};

        // --------------------------------------------------------
        // BUILD COMPLETED IDS
        // --------------------------------------------------------

        const backendCompletedIds =
          new Set(
            data.completed_question_ids || []
          );

        const scoreCompletedIds =
          new Set(
            predictQuestions
              .filter(
                (question) =>
                  Number(
                    loadedScores[question.id] ?? 0
                  ) >= MASTERY_THRESHOLD
              )
              .map((question) => question.id)
          );

        const loadedCompletedIds =
          new Set([
            ...backendCompletedIds,
            ...scoreCompletedIds,
          ]);

        setCompletedIds(
          loadedCompletedIds
        );

        setQuestionScores(
          loadedScores
        );

        // --------------------------------------------------------
        // CALCULATE OVERALL SCORE
        // --------------------------------------------------------

        const loadedPredictScore =
          calculatePredictScore(
            loadedScores
          );

        setPredictScore(
          loadedPredictScore
        );

        console.log(
          "LOADED PREDICT SCORE:",
          loadedPredictScore
        );

        // --------------------------------------------------------
        // ALREADY MASTERED
        // --------------------------------------------------------

        if (
          loadedPredictScore >=
          MASTERY_THRESHOLD
        ) {
          console.log(
            "PREDICT ALREADY MASTERED"
          );

          // Update fingerprint before moving on.
          await completePredictAssessment(
            loadedScores
          );

          return;
        }

        // --------------------------------------------------------
        // FIND FIRST INCOMPLETE QUESTION
        // --------------------------------------------------------

        const nextIncompleteIndex =
          predictQuestions.findIndex(
            (question) =>
              !loadedCompletedIds.has(
                question.id
              )
          );

        if (nextIncompleteIndex !== -1) {
          console.log(
            "OPENING INCOMPLETE PREDICT QUESTION:",
            nextIncompleteIndex
          );

          setQuestionIndex(
            nextIncompleteIndex
          );

          return;
        }

        // --------------------------------------------------------
        // ALL QUESTIONS COMPLETED BUT MASTERY
        // NOT REACHED
        // --------------------------------------------------------

        console.log(
          "ALL PREDICT QUESTIONS COMPLETED BUT MASTERY NOT REACHED"
        );

        const weakestQuestion =
          findWeakestQuestion(
            loadedScores
          );

        if (weakestQuestion) {
          console.log(
            "WEAKEST PREDICT QUESTION:",
            weakestQuestion.id
          );

          setAdaptiveWeakness(
            predictWeaknesses[
              weakestQuestion.id
            ] || {
              type: "general_predict",
              title:
                "Strengthen your prediction skills",
              description:
                "Review the code carefully and predict its behavior again before running it.",
            }
          );
        }
      } catch (error) {
        if (!cancelled) {
          console.error(
            "Could not load predict progress:",
            error
          );
        }
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

        <h1>
          Student information not found
        </h1>

        <p>
          Please log in again before
          starting the assessment.
        </p>
      </main>
    );
  }

  if (
    !concept ||
    predictQuestions.length === 0
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
          Predict questions not found
        </h1>

        <p>
          This concept does not have any
          Predict questions yet.
        </p>
      </main>
    );
  }

  // ============================================================
  // LOADING
  // ============================================================

  if (loadingProgress) {
    return (
      <main className="predict-assessment">
        <p>
          Loading your progress...
        </p>
      </main>
    );
  }

  // ============================================================
  // CURRENT QUESTION
  // ============================================================

  const question =
    predictQuestions[questionIndex];

  if (!question) {
    return (
      <main className="predict-assessment">
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

  // ============================================================
  // CHECK PREDICTION
  // ============================================================

  const checkPrediction = async () => {
    if (
      selectedAnswer === null ||
      saving
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

    // Build the new scores BEFORE doing anything async.
    const updatedScores = {
      ...questionScores,
      [question.id]: score,
    };

    const updatedPredictScore =
      calculatePredictScore(
        updatedScores
      );

    try {
      setSaving(true);

      // ========================================================
      // 1. SAVE PREDICT ATTEMPT
      // ========================================================

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
            dimension: "predict",

            question_id: question.id,

            score,

            question:
              question.question,

            code:
              question.code || "",

            correct_code:
              question.correctCode ||
              question.code ||
              "",

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
              : "prediction_error",

            recommendation: isCorrect
              ? "Continue to the next learning dimension."
              : "Review the code carefully and try the prediction again.",
          }),
        }
      );

      const responseText =
        await response.text();

      if (!response.ok) {
        console.error(
          "Predict attempt failed:",
          response.status,
          responseText
        );

        throw new Error(
          `Failed to save prediction: ${response.status}`
        );
      }

      console.log(
        "Predict attempt saved:",
        responseText
      );

      // ========================================================
      // 2. UPDATE LOCAL SCORES
      // ========================================================

      setQuestionScores(
        updatedScores
      );

      setPredictScore(
        updatedPredictScore
      );

      console.log(
        "UPDATED PREDICT SCORES:",
        updatedScores
      );

      console.log(
        "UPDATED PREDICT SCORE:",
        updatedPredictScore
      );

      // ========================================================
      // 3. MARK QUESTION COMPLETE
      // ========================================================

      if (isCorrect) {
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

      // ========================================================
      // 4. SHOW RESULT
      // ========================================================

      setResult({
        success: true,
        correct: isCorrect,
        score,

        message: isCorrect
          ? "Your prediction matches the program's output."
          : "Your prediction does not match the program's output. Review the code and try again.",
      });
    } catch (error) {
      console.error(
        "Predict submission error:",
        error
      );

      setResult({
        success: false,
        correct: false,

        message:
          error.message ||
          "Could not save your prediction.",
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
      "CURRENT PREDICT QUESTION:",
      question
    );

    const weakness =
      predictWeaknesses?.[
        question.id
      ];

    console.log(
      "PREDICT WEAKNESS:",
      weakness
    );

    setAdaptiveWeakness(
      weakness || {
        type: "general_predict",

        title:
          "Strengthen your prediction skills",

        description:
          "Review the code carefully and predict what it will do before running it.",
      }
    );
  };

  // ============================================================
  // CONTINUE TO NEXT QUESTION
  // ============================================================

  const continueToNextQuestion =
    async () => {
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
        // NO MORE WEAK QUESTIONS
        // CHECK MASTERY
        // ------------------------------------------------------

        const currentScore =
          calculatePredictScore(
            questionScores
          );

        setPredictScore(
          currentScore
        );

        console.log(
          "RETEST PREDICT SCORE:",
          currentScore
        );

        if (
          currentScore >=
          MASTERY_THRESHOLD
        ) {
          console.log(
            "RETEST MASTERED → UPDATING FINGERPRINT"
          );

          await completePredictAssessment(
            questionScores
          );

          return;
        }

        // ------------------------------------------------------
        // STILL NOT MASTERED
        // START ANOTHER RECOVERY CYCLE
        // ------------------------------------------------------

        const weakestQuestion =
          findWeakestQuestion(
            questionScores
          );

        if (weakestQuestion) {
          setAdaptiveWeakness(
            predictWeaknesses[
              weakestQuestion.id
            ] || {
              type: "general_predict",

              title:
                "Strengthen your prediction skills",

              description:
                "Review the code carefully and predict its behavior again.",
            }
          );
        }

        return;
      }

      // ========================================================
      // NORMAL MODE
      // ========================================================

      const nextIndex =
        predictQuestions.findIndex(
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
        predictQuestions.every(
          (q) =>
            completedIds.has(q.id)
        );

      if (!allCompleted) {
        const firstIncompleteIndex =
          predictQuestions.findIndex(
            (q) =>
              !completedIds.has(q.id)
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
        calculatePredictScore(
          questionScores
        );

      setPredictScore(
        overallScore
      );

      console.log(
        "FINAL PREDICT SCORE:",
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
          "PREDICT MASTERED → UPDATING FINGERPRINT"
        );

        await completePredictAssessment(
          questionScores
        );

        return;
      }

      // ========================================================
      // NOT MASTERED
      // ========================================================

      console.log(
        "PREDICT NOT MASTERED → ADAPTIVE RECOVERY"
      );

      const weakestQuestion =
        findWeakestQuestion(
          questionScores
        );

      if (weakestQuestion) {
        setAdaptiveWeakness(
          predictWeaknesses[
            weakestQuestion.id
          ] || {
            type: "general_predict",

            title:
              "Strengthen your prediction skills",

            description:
              "Review the code carefully and predict its behavior again.",
          }
        );
      }
    };

  // ============================================================
  // RECOVERY COMPLETE → START RETEST
  // ============================================================

  const handleRecoveryComplete =
    () => {
      console.log(
        "ADAPTIVE PREDICT RECOVERY COMPLETE"
      );

      setAdaptiveWeakness(null);
      setSelectedAnswer(null);
      setResult(null);

      // Enter retest mode.
      setIsRetest(true);

      // --------------------------------------------------------
      // Find weakest question using latest scores.
      // --------------------------------------------------------

      const weakestQuestion =
        findWeakestQuestion(
          questionScores
        );

      if (!weakestQuestion) {
        return;
      }

      const weakestIndex =
        predictQuestions.findIndex(
          (q) =>
            q.id ===
            weakestQuestion.id
        );

      if (weakestIndex !== -1) {
        console.log(
          "STARTING PREDICT RETEST AT:",
          weakestQuestion.id
        );

        setQuestionIndex(
          weakestIndex
        );
      }
    };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <main className="predict-assessment">

      {/* BACK */}

      <button
        type="button"
        className="back-button"
        onClick={onBack}
      >
        ← Back to explain
      </button>

      {/* HEADER */}

      <div className="predict-header">
        <p className="section-label">
          STEP 4 • PREDICT ASSESSMENT
        </p>

        <h1>
          Predict before you run
        </h1>

        <p>
          Don't execute the code yet.
          Think about what the program
          will produce.
        </p>
      </div>

      {/* SCORE DISPLAY */}

      <div className="recall-score">
        <strong>
          Predict Score:{" "}
          {predictScore}%
        </strong>

        <span>
          {predictScore >=
          MASTERY_THRESHOLD
            ? " ✓ Mastered"
            : ` — ${MASTERY_THRESHOLD}% needed to continue`}
        </span>
      </div>

      {/* RETEST INDICATOR */}

      {isRetest && (
        <div className="retest-banner">
          <strong>
            🔄 Predict Retest
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
        questions={predictQuestions}
        currentIndex={questionIndex}
        completedIds={completedIds}
        questionScores={questionScores}
        onSelectQuestion={
          handleQuestionSelect
        }
      />

      {/* ADAPTIVE RECOVERY */}

      {adaptiveWeakness ? (
        <div className="mastery-recovery">

          <h2>
            You're not ready to move on
            yet.
          </h2>

          <p>
            Your Predict score is{" "}
            <strong>
              {predictScore}%
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

        /* NORMAL QUESTION UI */

        <div className="predict-card">

          {/* QUESTION NUMBER */}

          <div className="question-number">
            QUESTION{" "}
            {String(
              questionIndex + 1
            ).padStart(2, "0")}{" "}
            /{" "}
            {String(
              predictQuestions.length
            ).padStart(2, "0")}
          </div>

          {/* QUESTION */}

          <div className="question-box">

            <p className="question-label">
              PREDICT THE OUTPUT
            </p>

            <pre>
              {question.code}
            </pre>

            <h2>
              {question.question}
            </h2>

          </div>

          {/* OPTIONS */}

          <div className="predict-options">

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
                  result.correct ===
                    false &&
                  isSelected &&
                  !isCorrect;

                return (
                  <button
                    type="button"
                    key={`${question.id}-${index}`}
                    className={`
                      predict-option
                      ${
                        isSelected
                          ? "selected"
                          : ""
                      }
                      ${
                        result &&
                        result.correct &&
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
                      result.correct &&
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

          {/* SUBMIT */}

          {!result && (
            <button
              type="button"
              className="primary-button"
              onClick={
                checkPrediction
              }
              disabled={
                selectedAnswer ===
                  null ||
                saving
              }
            >
              {saving
                ? "Saving..."
                : "Check Prediction →"}
            </button>
          )}

          {/* RESULT */}

          {result && (
            <div
              className={
                result.success
                  ? result.correct
                    ? "predict-result correct"
                    : "predict-result incorrect"
                  : "predict-result error"
              }
            >

              {/* SUCCESS RESULT */}

              {result.success && (
                <>
                  <div className="predict-score">
                    {result.score}%
                  </div>

                  <strong>
                    {result.correct
                      ? "✓ Correct Prediction"
                      : "✕ Incorrect Prediction"}
                  </strong>

                  <p>
                    {result.message}
                  </p>
                </>
              )}

              {/* SAVE ERROR */}

              {!result.success && (
                <>
                  <strong>
                    Unable to save
                    prediction
                  </strong>

                  <p>
                    {result.message}
                  </p>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() =>
                      setResult(null)
                    }
                  >
                    Try Again
                  </button>
                </>
              )}

              {/* INCORRECT ANSWER */}

              {result.success &&
                !result.correct && (
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
                        setSelectedAnswer(
                          null
                        );

                        setResult(null);
                      }}
                    >
                      Try Again
                    </button>
                  </>
                )}

              {/* CORRECT ANSWER */}

              {result.success &&
                result.correct && (
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
                        predictQuestions.length
                        ? "Continue →"
                        : "Check Predict Mastery →"}
                  </button>
                )}

            </div>
          )}

        </div>
      )}
    </main>
  );
}

export default PredictAssessment;