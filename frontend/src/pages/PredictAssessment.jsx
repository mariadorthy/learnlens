import { useEffect, useState } from "react";

import AssessmentQuestionNavigator from "../components/AssessmentQuestionNavigator";
import AdaptiveRecovery from "../components/AdaptiveRecovery";
import { predictWeaknesses } from "../data/concepts.js";
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
  const [adaptiveWeakness, setAdaptiveWeakness] = useState(null);
  const API_URL = import.meta.env.VITE_API_URL;

  const predictQuestions = concept?.predictQuestions || [];

  // ============================================================
  // SELECT QUESTION
  // ============================================================

  const handleQuestionSelect = (index) => {
    const selectedQuestion = predictQuestions[index];

    if (!selectedQuestion) {
      return;
    }

    setQuestionIndex(index);
    setSelectedAnswer(null);
    setResult(null);
    setAdaptiveWeakness(null);
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
          `${API_URL}/progress/${student.id}/${concept.id}/predict`
        );

        if (!response.ok) {
          throw new Error("Failed to load predict progress");
        }

        const data = await response.json();

        console.log("PREDICT PROGRESS:", data);

        const loadedCompletedIds = new Set(
          data.completed_question_ids || []
        );

        setCompletedIds(loadedCompletedIds);

        if (data.question_scores) {
          setQuestionScores(data.question_scores);
        }

        // Find first unanswered question
        const nextIndex = predictQuestions.findIndex(
          (question) => !loadedCompletedIds.has(question.id)
        );

        if (nextIndex !== -1) {
          setQuestionIndex(nextIndex);
        } else if (predictQuestions.length > 0) {
          console.log(
            "ALL PREDICT QUESTIONS ALREADY COMPLETED"
          );

          onComplete();
        }
      } catch (error) {
        console.error(
          "Could not load predict progress:",
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

  if (!concept || predictQuestions.length === 0) {
    return (
      <main className="concept-page">
        <button
          type="button"
          className="back-button"
          onClick={onBack}
        >
          ← Back
        </button>

        <h1>Predict questions not found</h1>

        <p>
          This concept does not have any Predict
          questions yet.
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
        <p>Loading your progress...</p>
      </main>
    );
  }

  // ============================================================
  // CURRENT QUESTION
  // ============================================================

  const question = predictQuestions[questionIndex];

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

        <h1>Question not found</h1>
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

    const selectedIndex = Number(selectedAnswer);
    const correctIndex = Number(question.correctAnswer);

    const isCorrect =
      selectedIndex === correctIndex;

    const score = isCorrect ? 100 : 0;

    setSaving(true);

    try {
      // --------------------------------------------------------
      // SAVE ATTEMPT
      // --------------------------------------------------------

      const response = await fetch(
        `${API_URL}/attempts`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            student_id: String(student.id),
            concept: concept.id,
            dimension: "predict",
            question_id: question.id,

            score,

            question: question.question,

            code: question.code,

            correct_code:
              question.correctCode ||
              question.code ||
              "",

            student_answer:
              question.options[selectedIndex],

            correct_answer:
              question.options[correctIndex],

            mistake: isCorrect
              ? "none"
              : "prediction_error",

            recommendation: isCorrect
              ? "Continue to the next learning dimension."
              : "Review the code and try the prediction again.",
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

      // --------------------------------------------------------
      // MARK COMPLETE ONLY IF CORRECT
      // --------------------------------------------------------

      if (isCorrect) {
        setCompletedIds((previous) => {
          const updated = new Set(previous);

          updated.add(question.id);

          return updated;
        });

        setQuestionScores((previous) => ({
          ...previous,
          [question.id]: score,
        }));
      }

      // --------------------------------------------------------
      // SHOW RESULT
      // --------------------------------------------------------

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
          "Could not save your prediction. Check that the backend is running and that you are logged in.",
      });
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // TRY AGAIN
  // ============================================================

  const tryAgain = () => {
    console.log("CURRENT PREDICT QUESTION:", question);

    const weakness = predictWeaknesses?.[question.id];

    console.log("PREDICT WEAKNESS:", weakness);

    if (!weakness) {
      console.error(
        "No adaptive weakness found for predict question:",
        question.id
      );

      setSelectedAnswer(null);
      setResult(null);
      return;
    }

    setAdaptiveWeakness(weakness);
  };

  // ============================================================
  // CONTINUE
  // ============================================================

  const continueToNextQuestion = () => {
    // IMPORTANT:
    // Do NOT automatically add the current question here.
    //
    // A question is completed only when the backend save
    // succeeded and the prediction was correct.

    const nextIndex =
      predictQuestions.findIndex(
        (q, index) =>
          index > questionIndex &&
          completedIds.has(q.id) === false
      );

    if (nextIndex !== -1) {
      setQuestionIndex(nextIndex);
      setSelectedAnswer(null);
      setResult(null);

      return;
    }

    // ----------------------------------------------------------
    // CHECK WHETHER EVERYTHING IS COMPLETE
    // ----------------------------------------------------------

    const allCompleted =
      predictQuestions.every((q) =>
        completedIds.has(q.id)
      );

    if (allCompleted) {
      console.log(
        "PREDICT COMPLETE → MOVING TO CODING"
      );

      onComplete();

      return;
    }

    // ----------------------------------------------------------
    // FIND ANY INCOMPLETE QUESTION
    // ----------------------------------------------------------

    const firstIncompleteIndex =
      predictQuestions.findIndex(
        (q) => !completedIds.has(q.id)
      );

    if (firstIncompleteIndex !== -1) {
      setQuestionIndex(firstIncompleteIndex);
      setSelectedAnswer(null);
      setResult(null);
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

      {/* QUESTION NAVIGATOR */}

      <AssessmentQuestionNavigator
        questions={predictQuestions}
        currentIndex={questionIndex}
        completedIds={completedIds}
        questionScores={questionScores}
        onSelectQuestion={handleQuestionSelect}
      />

      {/* ADAPTIVE RECOVERY */}

      {adaptiveWeakness ? (
        <AdaptiveRecovery
          weakness={adaptiveWeakness}
          concept={concept}
          onComplete={() => {
            setAdaptiveWeakness(null);
            setSelectedAnswer(null);
            setResult(null);
          }}
        />
      ) : (
        <div className="predict-card">

          <div className="question-number">
            QUESTION{" "}
            {String(questionIndex + 1).padStart(2, "0")}{" "}
            /{" "}
            {String(predictQuestions.length).padStart(2, "0")}
          </div>

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

          <div className="predict-options">
            {question.options.map((option, index) => {
              const isSelected =
                selectedAnswer === index;

              const isCorrect =
                index === Number(question.correctAnswer);

              const isWrong =
                result &&
                result.correct === false &&
                isSelected &&
                !isCorrect;

              return (
                <button
                  type="button"
                  key={`${question.id}-${index}`}
                  className={`
              predict-option
              ${isSelected ? "selected" : ""}
              ${result &&
                      result.correct &&
                      isCorrect
                      ? "correct"
                      : ""
                    }
              ${isWrong ? "wrong" : ""}
            `}
                  onClick={() => {
                    if (!result && !saving) {
                      setSelectedAnswer(index);
                    }
                  }}
                  disabled={!!result || saving}
                >
                  <span className="option-letter">
                    {String.fromCharCode(65 + index)}
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
            })}
          </div>

          {!result && (
            <button
              type="button"
              className="primary-button"
              onClick={checkPrediction}
              disabled={
                selectedAnswer === null ||
                saving
              }
            >
              {saving
                ? "Saving..."
                : "Check Prediction →"}
            </button>
          )}

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

              {!result.success && (
                <>
                  <strong>
                    Unable to save prediction
                  </strong>

                  <p>
                    {result.message}
                  </p>
                </>
              )}

              {/* ADAPTIVE RETRY */}

              {result.success &&
                !result.correct && (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={tryAgain}
                  >
                    Strengthen This Weakness →
                  </button>
                )}

              {/* CONTINUE */}

              {result.success &&
                result.correct && (
                  <button
                    type="button"
                    className="primary-button"
                    onClick={continueToNextQuestion}
                  >
                    {completedIds.size <
                      predictQuestions.length
                      ? "Continue →"
                      : "Continue to Coding →"}
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