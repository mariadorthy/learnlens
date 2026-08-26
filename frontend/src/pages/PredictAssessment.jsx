import { useEffect, useState } from "react";

import AssessmentQuestionNavigator from "../components/AssessmentQuestionNavigator";
import AdaptiveRecovery from "../components/AdaptiveRecovery";
import { predictWeaknesses } from "../data/concepts.js";

import {
  saveMistakeHistory,
} from "../utils/mistakeTracker";

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
  const [latestSubmittedScores, setLatestSubmittedScores] =
    useState(null);
  const [completedIds, setCompletedIds] = useState(new Set());
  const [questionScores, setQuestionScores] = useState({});
  const [questionAttempts, setQuestionAttempts] = useState({});
  const [predictScore, setPredictScore] = useState(0);

  const [adaptiveWeakness, setAdaptiveWeakness] = useState(null);

  // True when testing weak questions again
  const [isRetest, setIsRetest] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;

  // ============================================================
  // TRACK THEORY MISTAKE
  // ============================================================

  const trackTheoryMistake = async ({
    question,
    mistakeType,
    score,
    attemptNumber,
    weakness,
    weaknessType,
  }) => {
    return saveMistakeHistory({
      API_URL,

      studentId: student?.id,

      topic: concept?.id || "loops",
      concept: concept?.id || "loops",
      dimension: "recall",

      questionId: question?.id,
      questionType: "mcq",
      questionFormat: "multiple_choice",

      question: question?.question || "",

      score: score ?? 0,
      maxScore: 100,
      attemptNumber,

      studentAnswer:
        selectedAnswer !== null
          ? question?.options?.[Number(selectedAnswer)]
          : null,

      correctAnswer:
        question?.options?.[
        Number(question?.correctAnswer)
        ],

      mistakeType,

      mistake:
        weakness?.title ||
        mistakeType ||
        "Incorrect theory answer",

      weakness:
        weakness?.title ||
        weakness?.type ||
        null,

      weaknessType:
        weaknessType ||
        weakness?.type ||
        null,

      misconception:
        weakness?.description ||
        null,

      whatHappened:
        "The student selected an incorrect answer.",

      recommendation:
        "Review the concept and retry the question.",

      code: null,
      errorMessage: null,
      expectedOutput: null,
      actualOutput: null,

      retestMode: isRetest,
      isRetest,

      metadata: {
        assessment_stage: "theory",
        question_index: questionIndex,
        selected_index: selectedAnswer,
        correct_index: Number(question?.correctAnswer),
        mastery_threshold: MASTERY_THRESHOLD,
      },
    });
  };

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
  // TRACK PREDICT MISTAKE
  // ============================================================

  const trackPredictMistake = async ({
    question,
    mistakeType,
    score,
    attemptNumber,
    weakness,
    weaknessType,
  }) => {
    return saveMistakeHistory({
      API_URL,

      studentId: student?.id,

      // --------------------------------------------------------
      // LEARNING HIERARCHY
      // --------------------------------------------------------

      topic: concept?.id || "loops",

      concept: concept?.id || "loops",

      dimension: "predict",

      // --------------------------------------------------------
      // QUESTION
      // --------------------------------------------------------

      questionId: question?.id,

      questionType: "mcq",

      questionFormat: "multiple_choice",

      question:
        question?.question || "",

      // --------------------------------------------------------
      // PREDICT CODE
      // --------------------------------------------------------

      code:
        question?.code || null,

      expectedOutput:
        question?.expectedOutput ||
        question?.output ||
        null,

      // --------------------------------------------------------
      // ATTEMPT
      // --------------------------------------------------------

      score: score ?? 0,

      maxScore: 100,

      attemptNumber,

      // --------------------------------------------------------
      // STUDENT ANSWER
      // --------------------------------------------------------

      studentAnswer:
        selectedAnswer !== null
          ? question?.options?.[
          Number(selectedAnswer)
          ]
          : null,

      correctAnswer:
        question?.options?.[
        Number(question?.correctAnswer)
        ],

      // --------------------------------------------------------
      // MISTAKE
      // --------------------------------------------------------

      mistakeType,

      mistake:
        weakness?.title ||
        mistakeType ||
        "Incorrect prediction",

      // --------------------------------------------------------
      // WEAKNESS
      // --------------------------------------------------------

      weakness:
        weakness?.title ||
        weakness?.type ||
        null,

      weaknessType:
        weaknessType ||
        weakness?.type ||
        null,

      // --------------------------------------------------------
      // ANALYSIS
      // --------------------------------------------------------

      misconception:
        weakness?.description ||
        null,

      whatHappened:
        "The student selected an incorrect prediction.",

      recommendation:
        "Review the code carefully, predict its behavior again, and retry the question.",

      // --------------------------------------------------------
      // NOT A CODE EXECUTION ERROR
      // --------------------------------------------------------

      errorMessage: null,

      actualOutput: null,

      // --------------------------------------------------------
      // RETEST
      // --------------------------------------------------------

      retestMode: isRetest,

      isRetest,

      // --------------------------------------------------------
      // EXTRA
      // --------------------------------------------------------

      metadata: {
        assessment_stage: "predict",

        question_index:
          questionIndex,

        selected_index:
          selectedAnswer,

        correct_index:
          Number(question?.correctAnswer),

        mastery_threshold:
          MASTERY_THRESHOLD,
      },
    });
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

    const finalScore =
      calculatePredictScore(scores);

    const fingerprint =
      getPredictFingerprint(scores);

    const masteredCount =
      predictQuestions.filter(
        (question) =>
          Number(
            scores[question.id] ?? 0
          ) >= MASTERY_THRESHOLD
      ).length;

    const total =
      predictQuestions.length;

    console.log(
      "PREDICT ASSESSMENT COMPLETE:",
      {
        dimension: "predict",
        correct: masteredCount,
        total,
        score: finalScore,
        source: "predict_assessment",
        questionScores: scores,
        fingerprint,
      }
    );

    onComplete({
      dimension: "predict",
      correct: masteredCount,
      total,
      score: finalScore,
      source: "predict_assessment",
      questionScores: scores,
    });
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

        const loadedAttempts =
          data.question_attempts &&
            typeof data.question_attempts === "object"
            ? data.question_attempts
            : {};

        setQuestionAttempts(
          loadedAttempts
        );

        // --------------------------------------------------------
        // BUILD COMPLETED IDS
        // --------------------------------------------------------

        // --------------------------------------------------------
        // BUILD COMPLETED IDS
        //
        // IMPORTANT:
        // A Predict question is completed ONLY when it is mastered.
        //
        // Do NOT trust backend completed_question_ids here,
        // because the backend may contain answered-but-wrong
        // questions that should still be retested.
        // --------------------------------------------------------

        const loadedCompletedIds = new Set(
          predictQuestions
            .filter(
              (question) =>
                Number(
                  loadedScores[question.id] ?? 0
                ) >= MASTERY_THRESHOLD
            )
            .map((question) => question.id)
        );

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

    // ----------------------------------------------------------
    // ATTEMPT NUMBER
    // ----------------------------------------------------------

    const attemptNumber =
      Number(
        questionAttempts[
        question.id
        ] ?? 0
      ) + 1;

    const updatedAttempts = {
      ...questionAttempts,
      [question.id]: attemptNumber,
    };

    setQuestionAttempts(
      updatedAttempts
    );

    // Build the new scores BEFORE doing anything async.

    // Keep the best score achieved for this question.
    const previousScore = Number(
      questionScores[question.id] ?? 0
    );

    const updatedScores = {
      ...questionScores,
      [question.id]: Math.max(
        previousScore,
        score
      ),
    };
    setLatestSubmittedScores(updatedScores);
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
            attempt_number:
              attemptNumber,

            mistake: isCorrect
              ? "none"
              : "prediction_error",

            mistake_type:
              isCorrect
                ? "none"
                : (
                  predictWeaknesses?.[
                    question.id
                  ]?.type ||
                  "prediction_error"
                ),

            weakness_type:
              isCorrect
                ? null
                : (
                  predictWeaknesses?.[
                    question.id
                  ]?.type ||
                  "prediction_error"
                ),

            weakness_title:
              isCorrect
                ? null
                : (
                  predictWeaknesses?.[
                    question.id
                  ]?.title ||
                  null
                ),

            weakness_description:
              isCorrect
                ? null
                : (
                  predictWeaknesses?.[
                    question.id
                  ]?.description ||
                  null
                ),

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
      // TRACK MISTAKE HISTORY
      //
      // IMPORTANT:
      // Only incorrect Predict answers are tracked.
      // Correct answers do not create mistake records.
      // ========================================================

      if (!isCorrect) {
        const weakness =
          predictWeaknesses?.[
          question.id
          ] || {
            type: "general_predict",

            title:
              "Strengthen your prediction skills",

            description:
              "Review the code carefully and predict what it will do before running it.",
          };

        const mistakeType =
          weakness.type ||
          "prediction_error";

        console.log(
          "PREDICT MISTAKE TRACKER PAYLOAD:",
          {
            studentId: student?.id,

            questionId:
              question?.id,

            question:
              question?.question,

            selectedAnswer,

            selectedAnswerText:
              selectedAnswer !== null
                ? question?.options?.[
                Number(selectedAnswer)
                ]
                : null,

            correctAnswer:
              question?.correctAnswer,

            correctAnswerText:
              question?.options?.[
              Number(
                question?.correctAnswer
              )
              ],

            score,

            attemptNumber,

            mistakeType,

            weakness,

            weaknessType:
              weakness?.type ||
              mistakeType,

            isRetest,
          }
        );

        await trackPredictMistake({
          mistakeType,

          score,

          attemptNumber,

          question,

          weakness,

          weaknessType:
            weakness?.type ||
            mistakeType,
        });
      }

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

      // --------------------------------------------------------
      // UPDATE COMPLETED IDS
      //
      // A question is completed only when its current/best
      // score reaches the mastery threshold.
      // --------------------------------------------------------

      setCompletedIds((previous) => {
        const updated = new Set(previous);

        if (
          Number(updatedScores[question.id] ?? 0) >=
          MASTERY_THRESHOLD
        ) {
          updated.add(question.id);
        }

        return updated;
      });

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

  const continueToNextQuestion = async (
    latestScores = questionScores
  ) => {
    // ========================================================
    // ALWAYS MAKE SURE THE CURRENT QUESTION IS INCLUDED
    // ========================================================

    const finalScores = {
      ...latestScores,
      [question.id]: Math.max(
        Number(latestScores[question.id] ?? 0),
        100
      ),
    };

    // Keep local state synchronized
    setQuestionScores(finalScores);

    const finalPredictScore =
      calculatePredictScore(finalScores);

    setPredictScore(finalPredictScore);

    console.log("================================");
    console.log("PREDICT CONTINUE");
    console.log("QUESTION:", question.id);
    console.log("SCORES:", finalScores);
    console.log("PREDICT SCORE:", finalPredictScore);
    console.log("RETEST:", isRetest);
    console.log("================================");

    // ========================================================
    // RETEST MODE
    // ========================================================

    if (isRetest) {
      const nextWeakIndex =
        findNextWeakQuestion(
          finalScores,
          questionIndex
        );

      if (nextWeakIndex !== -1) {
        openQuestion(nextWeakIndex);
        return;
      }

      // ------------------------------------------------------
      // NO MORE WEAK QUESTIONS
      // ------------------------------------------------------

      if (
        finalPredictScore >=
        MASTERY_THRESHOLD
      ) {
        console.log(
          "RETEST MASTERED → COMPLETE PREDICT"
        );

        await completePredictAssessment(
          finalScores
        );

        return;
      }

      // ------------------------------------------------------
      // STILL NOT MASTERED
      // ------------------------------------------------------

      const weakestQuestion =
        findWeakestQuestion(finalScores);

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
          Number(
            finalScores[q.id] ?? 0
          ) < MASTERY_THRESHOLD
      );

    if (nextIndex !== -1) {
      openQuestion(nextIndex);
      return;
    }

    // ========================================================
    // CHECK ALL QUESTIONS
    // ========================================================

    const allCompleted =
      predictQuestions.every(
        (q) =>
          Number(
            finalScores[q.id] ?? 0
          ) >= MASTERY_THRESHOLD
      );

    if (!allCompleted) {
      const firstIncompleteIndex =
        predictQuestions.findIndex(
          (q) =>
            Number(
              finalScores[q.id] ?? 0
            ) < MASTERY_THRESHOLD
        );

      if (firstIncompleteIndex !== -1) {
        openQuestion(firstIncompleteIndex);
      }

      return;
    }

    // ========================================================
    // ALL QUESTIONS MASTERED
    // ========================================================

    console.log(
      "ALL PREDICT QUESTIONS MASTERED"
    );

    if (
      finalPredictScore >=
      MASTERY_THRESHOLD
    ) {
      console.log(
        "PREDICT MASTERED → UPDATING FINGERPRINT"
      );

      await completePredictAssessment(
        finalScores
      );

      return;
    }

    // ========================================================
    // NOT MASTERED → ADAPTIVE RECOVERY
    // ========================================================

    console.log(
      "PREDICT NOT MASTERED → ADAPTIVE RECOVERY"
    );

    const weakestQuestion =
      findWeakestQuestion(finalScores);

    if (weakestQuestion) {
      setAdaptiveWeakness(
        predictWeaknesses[
        weakestQuestion.id
        ] || {
          type: "general_predict",
          title:
            "Strengthen your prediction skills",
          description:
            "Review the code carefully and predict what it will do before running it.",
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
        ← Back
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
                      ${isSelected
                        ? "selected"
                        : ""
                      }
                      ${result &&
                        result.correct &&
                        isCorrect
                        ? "correct"
                        : ""
                      }
                      ${isWrong
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
                    onClick={() =>
                      continueToNextQuestion(
                        latestSubmittedScores || questionScores
                      )
                    }
                  >
                    {isRetest
                      ? "Continue Retest →"
                      : "Continue →"}
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
