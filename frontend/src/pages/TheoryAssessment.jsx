import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import AssessmentQuestionNavigator from "../components/AssessmentQuestionNavigator";
import AdaptiveRecovery from "../components/AdaptiveRecovery";
import { theoryWeaknesses } from "../data/concepts.js";

import {
  saveMistakeHistory,
} from "../utils/mistakeTracker";

const MASTERY_THRESHOLD = 80;

function TheoryAssessment({
  concept,
  student,
  onComplete,
  onProgress,
  onBack,
}) {
  const API_URL = import.meta.env.VITE_API_URL;

  const theoryQuestions = concept?.theoryQuestions || [];

  const [geminiAnalysis, setGeminiAnalysis] = useState("");

  // ============================================================
  // STATE
  // ============================================================
  const progressLoadedRef = useRef(false);
  const [questionIndex, setQuestionIndex] = useState(0);

  const [selectedAnswer, setSelectedAnswer] = useState(null);

  const [result, setResult] = useState(null);

  const [adaptiveWeakness, setAdaptiveWeakness] =
    useState(null);

  const [analysingWeakness, setAnalysingWeakness] = useState(false);
  const [saving, setSaving] = useState(false);

  const [loadingProgress, setLoadingProgress] =
    useState(true);

  const [answeredIds, setAnsweredIds] = useState(() => new Set());
  const [masteredIds, setMasteredIds] = useState(() => new Set());

  const [questionScores, setQuestionScores] =
    useState({});

  const [questionAttempts, setQuestionAttempts] =
    useState({});

  const [recallScore, setRecallScore] = useState(0);

  const [isRetest, setIsRetest] = useState(false);

  // ============================================================
  // CALCULATE RECALL SCORE
  // ============================================================

  const calculateRecallScore = useCallback(
    (scores = {}) => {
      const totalQuestions = theoryQuestions.length;

      if (!totalQuestions) {
        return 0;
      }

      const masteredQuestions = theoryQuestions.filter(
        (question) =>
          Number(scores[question.id] ?? 0) >= MASTERY_THRESHOLD
      ).length;

      return Math.round(
        (masteredQuestions / totalQuestions) * 100
      );
    },
    [theoryQuestions]
  );

  const mergeQuestionScores = useCallback(
    (localScores = {}, serverScores = {}) => {
      const merged = {};

      const questionIds = new Set([
        ...Object.keys(localScores || {}),
        ...Object.keys(serverScores || {}),
      ]);

      questionIds.forEach((questionId) => {
        const localValue = localScores[questionId];
        const serverValue = serverScores[questionId];

        const localScore =
          localValue !== undefined && localValue !== null
            ? Number(localValue)
            : null;

        const serverScore =
          serverValue !== undefined && serverValue !== null
            ? Number(serverValue)
            : null;

        if (localScore === null && serverScore === null) {
          return;
        }

        if (localScore === null) {
          merged[questionId] = serverScore;
          return;
        }

        if (serverScore === null) {
          merged[questionId] = localScore;
          return;
        }

        merged[questionId] = Math.max(
          localScore,
          serverScore
        );
      });

      return merged;
    },
    []
  );

  // ============================================================
  // KEEP RECALL SCORE IN SYNC
  // ============================================================

  const calculatedRecallScore = useMemo(() => {
    return calculateRecallScore(questionScores);
  }, [
    calculateRecallScore,
    questionScores,
  ]);

  useEffect(() => {
    setRecallScore(calculatedRecallScore);
  }, [calculatedRecallScore]);

  // ============================================================
  // BUILD COMPLETED IDS FROM SCORES
  // ============================================================

  const getCompletedIdsFromScores = useCallback(
    (scores = {}) => {
      return new Set(
        theoryQuestions
          .filter((question) => {
            const score = Number(scores[question.id] ?? 0);
            return score >= MASTERY_THRESHOLD;
          })
          .map((question) => question.id)
      );
    },
    [theoryQuestions]
  );

  const getAnsweredIdsFromScores = useCallback(
    (scores = {}) => {
      return new Set(
        theoryQuestions
          .filter((question) => {
            const value = scores[question.id];

            return (
              value !== undefined &&
              value !== null
            );
          })
          .map((question) => question.id)
      );
    },
    [theoryQuestions]
  );

  // ============================================================
  // BUILD KNOWLEDGE FINGERPRINT
  // ============================================================

  const buildKnowledgeFingerprint = useCallback(
    (newRecallScore, scores) => {
      const existingFingerprint =
        student?.knowledgeFingerprint ||
        student?.knowledge_fingerprint ||
        concept?.knowledgeFingerprint ||
        concept?.knowledge_fingerprint ||
        {};
      const answeredCount = theoryQuestions.filter(
        (question) =>
          scores[question.id] !== undefined &&
          scores[question.id] !== null
      ).length;

      const masteredCount = theoryQuestions.filter(
        (question) =>
          Number(scores[question.id] ?? 0) >= MASTERY_THRESHOLD
      ).length;

      const total = theoryQuestions.length;

      return {
        recall: {
          score: Number(newRecallScore ?? 0),
          correct: masteredCount,
          total: theoryQuestions.length,
          answered_count: answeredCount,
          completed_count: masteredCount,
          mastered_count: masteredCount,
          question_count: total,
        },

        explain: {
          ...(existingFingerprint.explain ?? {
            score: 0,
            correct: 0,
            total: 0,
          }),
        },

        predict: {
          ...(existingFingerprint.predict ?? {
            score: 0,
            correct: 0,
            total: 0,
          }),
        },

        implement: {
          ...(existingFingerprint.implement ?? {
            score: 0,
            correct: 0,
            total: 0,
          }),
        },

        debug: {
          ...(existingFingerprint.debug ?? {
            score: 0,
            correct: 0,
            total: 0,
          }),
        },

        apply: {
          ...(existingFingerprint.apply ?? {
            score: 0,
            correct: 0,
            total: 0,
          }),
        },
      };
    },
    [
      concept,
      student,
      theoryQuestions,
    ]
  );

  // ============================================================
  // GET WEAKNESS
  // ============================================================

  const getWeakness = useCallback(
    (question) => {
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
    },
    []
  );

  // ============================================================
  // FIND FIRST UNMASTERED
  // ============================================================

  const findFirstUnmasteredQuestion =
    useCallback(
      (scores = {}) => {
        return theoryQuestions.findIndex(
          (question) =>
            Number(
              scores[question.id] ?? 0
            ) < MASTERY_THRESHOLD
        );
      },
      [theoryQuestions]
    );

  // ============================================================
  // FIND NEXT UNMASTERED
  // ============================================================

  const findNextUnmasteredQuestion =
    useCallback(
      (scores = {}, currentIndex = -1) => {
        return theoryQuestions.findIndex(
          (question, index) =>
            index > currentIndex &&
            Number(
              scores[question.id] ?? 0
            ) < MASTERY_THRESHOLD
        );
      },
      [theoryQuestions]
    );

  const findNextQuestion = useCallback(
    (scores = {}, currentIndex = -1) => {
      // First look forward
      for (
        let i = currentIndex + 1;
        i < theoryQuestions.length;
        i++
      ) {
        const score = Number(
          scores[theoryQuestions[i].id] ?? 0
        );

        if (score < MASTERY_THRESHOLD) {
          return i;
        }
      }

      // Then wrap around
      for (let i = 0; i <= currentIndex; i++) {
        const score = Number(
          scores[theoryQuestions[i].id] ?? 0
        );

        if (score < MASTERY_THRESHOLD) {
          return i;
        }
      }

      return -1;
    },
    [theoryQuestions]
  );

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

      // ----------------------------------------------------------
      // LEARNING HIERARCHY
      // ----------------------------------------------------------

      topic: concept?.id || "loops",

      concept: concept?.id || "loops",

      dimension: "recall",

      // ----------------------------------------------------------
      // QUESTION
      // ----------------------------------------------------------

      questionId: question?.id,

      questionType: "mcq",

      questionFormat: "multiple_choice",

      question:
        question?.question || "",

      // ----------------------------------------------------------
      // ATTEMPT
      // ----------------------------------------------------------

      score: score ?? 0,

      maxScore: 100,

      attemptNumber,

      // ----------------------------------------------------------
      // STUDENT ANSWER
      // ----------------------------------------------------------

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

      // ----------------------------------------------------------
      // MISTAKE
      // ----------------------------------------------------------

      mistakeType,

      mistake:
        weakness?.title ||
        mistakeType ||
        "Incorrect theory answer",

      // ----------------------------------------------------------
      // WEAKNESS
      // ----------------------------------------------------------

      weakness:
        weakness?.title ||
        weakness?.type ||
        null,

      weaknessType:
        weaknessType ||
        weakness?.type ||
        null,

      // ----------------------------------------------------------
      // ANALYSIS
      // ----------------------------------------------------------

      misconception:
        weakness?.description ||
        null,

      whatHappened:
        "The student selected an incorrect answer.",

      recommendation:
        "Review the concept and retry the question.",

      // ----------------------------------------------------------
      // NOT CODE
      // ----------------------------------------------------------

      code: null,

      errorMessage: null,

      expectedOutput: null,

      actualOutput: null,

      // ----------------------------------------------------------
      // RETEST
      // ----------------------------------------------------------

      retestMode: isRetest,

      isRetest,

      // ----------------------------------------------------------
      // EXTRA
      // ----------------------------------------------------------

      metadata: {
        assessment_stage: "theory",

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
  // FIND WEAKEST QUESTION
  // ============================================================

  const findWeakestQuestion = useCallback(
    (scores = {}) => {
      const weakQuestions =
        theoryQuestions.filter(
          (question) =>
            Number(
              scores[question.id] ?? 0
            ) < MASTERY_THRESHOLD
        );

      if (!weakQuestions.length) {
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
    },
    [theoryQuestions]
  );

  const getMasteryStatus = useCallback(
    (scores = {}) => {
      const total = theoryQuestions.length;

      const masteredQuestions = theoryQuestions.filter(
        (question) =>
          Number(scores[question.id] ?? 0) >= MASTERY_THRESHOLD
      ).length;

      const score =
        total > 0
          ? Math.round((masteredQuestions / total) * 100)
          : 0;

      return {
        masteredQuestions,
        total,
        score,
        mastered:
          total > 0 &&
          masteredQuestions === total,
      };
    },
    [theoryQuestions]
  );

  // ============================================================
  // OPEN QUESTION
  // ============================================================

  const openQuestion = useCallback(
    (index, scores = questionScores) => {
      console.log(
        "========================================"
      );

      console.log(
        "OPEN QUESTION REQUEST"
      );

      console.log(
        "INDEX:",
        index
      );

      console.log(
        "QUESTION:",
        theoryQuestions[index]?.id
      );

      console.log(
        "SCORES:",
        JSON.stringify(
          scores,
          null,
          2
        )
      );

      console.log(
        "========================================"
      );

      if (
        index < 0 ||
        index >= theoryQuestions.length
      ) {
        return;
      }

      const targetQuestion =
        theoryQuestions[index];

      if (!targetQuestion) {
        return;
      }

      const targetScore = Number(
        scores[targetQuestion.id] ?? 0
      );

      if (
        targetScore >= MASTERY_THRESHOLD
      ) {
        console.log(
          "BLOCKED MASTERED QUESTION:",
          targetQuestion.id
        );
        return;
      }

      setQuestionIndex(index);
      setSelectedAnswer(null);
      setResult(null);
    },
    [
      questionScores,
      theoryQuestions,
    ]
  );

  // ============================================================
  // LOAD EXISTING PROGRESS
  // ============================================================
  useEffect(() => {
    if (
      !student?.id ||
      !concept?.id ||
      !theoryQuestions.length
    ) {
      setLoadingProgress(false);
      return;
    }

    // Don't reload/reposition an assessment that is already active.
    if (progressLoadedRef.current) {
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

        console.log("THEORY PROGRESS:", data);

        const loadedScores =
          data?.question_scores &&
            typeof data.question_scores === "object"
            ? data.question_scores
            : {};

        const loadedAttempts =
          data?.question_attempts &&
            typeof data.question_attempts === "object"
            ? data.question_attempts
            : {};

        // IMPORTANT:
        // Never allow server progress to overwrite
        // stronger local progress.
        const mergedScores = mergeQuestionScores(
          questionScores,
          loadedScores
        );

        const loadedAnsweredIds =
          getAnsweredIdsFromScores(mergedScores);

        const loadedMasteredIds =
          getCompletedIdsFromScores(mergedScores);

        const loadedRecallScore =
          calculateRecallScore(mergedScores);

        console.log(
          "SERVER SCORES:",
          loadedScores
        );

        console.log(
          "MERGED SCORES:",
          mergedScores
        );

        setQuestionScores(mergedScores);
        setQuestionAttempts(loadedAttempts);
        setAnsweredIds(loadedAnsweredIds);
        setMasteredIds(loadedMasteredIds);
        setRecallScore(loadedRecallScore);

        // Mark the assessment as loaded BEFORE
        // selecting the first question.
        progressLoadedRef.current = true;

        // Already mastered
        if (
          loadedMasteredIds.size === theoryQuestions.length &&
          loadedRecallScore >= MASTERY_THRESHOLD
        ) {
          onComplete({
            dimension: "recall",
            correct: loadedMasteredIds.size,
            total: theoryQuestions.length,
            score: loadedRecallScore,
            source: "existing_progress",
          });

          return;
        }

        // Only choose the initial question ONCE.
        const firstUnmastered =
          findFirstUnmasteredQuestion(mergedScores);

        if (firstUnmastered !== -1) {
          console.log(
            "INITIAL QUESTION:",
            firstUnmastered
          );

          setQuestionIndex(firstUnmastered);
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
    API_URL,
    student?.id,
    concept?.id,
    theoryQuestions,
    mergeQuestionScores,
    calculateRecallScore,
    getAnsweredIdsFromScores,
    getCompletedIdsFromScores,
    findFirstUnmasteredQuestion,
    onComplete,
  ]);

  // ============================================================
  // SAFETY CHECK
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

  // ============================================================
  // CURRENT QUESTION
  // ============================================================

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
          ← Back to learning
        </button>

        <h1>
          Question not found
        </h1>
      </main>
    );
  }

  // ============================================================
  // CHECK ANSWER
  // ============================================================

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

    // ----------------------------------------------------------
    // PREVIOUS SCORE
    // ----------------------------------------------------------

    const previousScore = Number(
      questionScores[question.id] ?? 0
    );

    // ----------------------------------------------------------
    // NEVER RE-ANSWER MASTERED QUESTION
    // ----------------------------------------------------------

    if (
      previousScore >=
      MASTERY_THRESHOLD
    ) {
      console.log(
        "MASTERED QUESTION - IGNORING:",
        question.id
      );

      setSelectedAnswer(null);
      setResult(null);

      return;
    }

    // ----------------------------------------------------------
    // ATTEMPTS
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

    // ----------------------------------------------------------
    // SCORE
    //
    // IMPORTANT:
    // Correct = 100
    // Incorrect = 0
    //
    // A previous 100 is never overwritten.
    // ----------------------------------------------------------

    const updatedScores = {
      ...questionScores,
      [question.id]: Math.max(
        previousScore,
        score
      ),
    };

    const updatedAnsweredIds = new Set(answeredIds);
    updatedAnsweredIds.add(question.id);

    const updatedMasteredIds =
      getCompletedIdsFromScores(updatedScores);

    const updatedRecallScore =
      calculateRecallScore(
        updatedScores
      );

    // ----------------------------------------------------------
    // UPDATE UI IMMEDIATELY
    // ----------------------------------------------------------

    setQuestionAttempts(updatedAttempts);

    setQuestionScores(updatedScores);

    setAnsweredIds(updatedAnsweredIds);
    setMasteredIds(updatedMasteredIds);

    setRecallScore(updatedRecallScore);

    // ----------------------------------------------------------
    // RESULT
    // ----------------------------------------------------------

    setResult({
      correct: isCorrect,
      message: isCorrect
        ? "Correct!"
        : "Not quite. Review the weakness and try again.",
    });

    // ----------------------------------------------------------
    // WEAKNESS
    // ----------------------------------------------------------

    const weakness =
      getWeakness(question);

    const mistakeType = isCorrect
      ? "none"
      : weakness.type ||
      "incorrect_theory_answer";
    // ----------------------------------------------------------
    // SAVE MISTAKE HISTORY
    // ----------------------------------------------------------
    if (!isCorrect) {
      console.log("MISTAKE TRACKER PAYLOAD:", {
        studentId: student?.id,
        questionId: question?.id,
        question: question?.question,
        selectedAnswer,
        selectedAnswerText:
          selectedAnswer !== null
            ? question?.options?.[Number(selectedAnswer)]
            : null,
        correctAnswer: question?.correctAnswer,
        correctAnswerText:
          question?.options?.[Number(question?.correctAnswer)],
        score,
        attemptNumber,
        mistakeType,
        weakness,
        weaknessType:
          weakness?.type ||
          mistakeType,
        isRetest,
      });

      await trackTheoryMistake({
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
    // ----------------------------------------------------------
    // KNOWLEDGE FINGERPRINT
    // ----------------------------------------------------------

    const knowledgeFingerprint =
      buildKnowledgeFingerprint(
        updatedRecallScore,
        updatedScores
      );

    if (onProgress) {
      const answeredCount = theoryQuestions.filter(
        (question) =>
          updatedScores[question.id] !== undefined &&
          updatedScores[question.id] !== null
      ).length;

      const masteredCount = theoryQuestions.filter(
        (question) =>
          Number(updatedScores[question.id] ?? 0) >=
          MASTERY_THRESHOLD
      ).length;

      onProgress({
        dimension: "recall",
        score: updatedRecallScore,
        correct: masteredCount,
        total: theoryQuestions.length,
        progress: Math.round(
          (masteredCount / theoryQuestions.length) * 100
        ),
        answered_count: answeredCount,
        completed_count: masteredCount,
        mastered_count: masteredCount,
        question_count: theoryQuestions.length,
        knowledgeFingerprint,
        questionScores: updatedScores,
      });
    }

    console.log(
      "QUESTION:",
      question.id
    );

    console.log(
      "CORRECT:",
      isCorrect
    );

    console.log(
      "UPDATED SCORES:",
      updatedScores
    );

    console.log(
      "UPDATED RECALL:",
      updatedRecallScore
    );

    console.log(
      "KNOWLEDGE FINGERPRINT:",
      knowledgeFingerprint
    );

    console.log(
      "THEORY QUESTION COUNT:",
      theoryQuestions.length
    );

    console.log(
      "THEORY QUESTION IDS:",
      theoryQuestions.map(q => q.id)
    );

    // ----------------------------------------------------------
    // SAVE ATTEMPT
    // ----------------------------------------------------------

    try {
      setSaving(true);

      console.log(
        "========================================"
      );

      console.log(
        "SAVING QUESTION:",
        question.id
      );

      console.log(
        "CURRENT QUESTION INDEX:",
        questionIndex
      );

      console.log(
        "CURRENT QUESTION NUMBER:",
        questionIndex + 1
      );

      console.log(
        "UPDATED SCORES BEING SENT:",
        JSON.stringify(
          updatedScores,
          null,
          2
        )
      );

      console.log(
        "========================================"
      );

      const response = await fetch(
        `${API_URL}/attempts`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            // --------------------------------------------------
            // STUDENT
            // --------------------------------------------------

            student_id: String(
              student.id
            ),

            concept: concept.id,

            dimension: "recall",

            // --------------------------------------------------
            // QUESTION
            // --------------------------------------------------

            question_id:
              question.id,

            question:
              question.question,

            // --------------------------------------------------
            // ANSWER
            // --------------------------------------------------

            student_answer:
              question.options[
              selectedIndex
              ],

            correct_answer:
              question.options[
              correctIndex
              ],

            score,

            // --------------------------------------------------
            // ATTEMPT
            // --------------------------------------------------

            attempt_number:
              attemptNumber,

            question_scores: updatedScores,
            question_attempts: updatedAttempts,
            question_count: theoryQuestions.length,

            mistake: isCorrect
              ? "none"
              : "incorrect_theory_answer",

            mistake_type:
              mistakeType,

            // --------------------------------------------------
            // WEAKNESS
            // --------------------------------------------------

            weakness_type:
              weakness.type,

            weakness_title:
              weakness.title,

            weakness_description:
              weakness.description,

            // --------------------------------------------------
            // KNOWLEDGE FINGERPRINT
            // --------------------------------------------------

            knowledge_fingerprint:
              knowledgeFingerprint,

            // --------------------------------------------------
            // EVIDENCE
            // --------------------------------------------------

            evidence: {
              assessment_stage:
                "theory",

              dimension:
                "recall",

              correct:
                isCorrect,

              mastery_threshold:
                MASTERY_THRESHOLD,

              previous_score:
                previousScore,

              new_score:
                score,

              recall_score:
                updatedRecallScore,

              adaptive_recovery_required:
                !isCorrect,
            },
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
      } else {
        console.log(
          "THEORY ATTEMPT SAVED:",
          responseText
        );
      }
    } catch (error) {
      console.error(
        "Theory answer network error:",
        error
      );
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // TRY AGAIN
  // ============================================================

  const tryAgain = async () => {
    if (analysingWeakness) return;

    const weakness = getWeakness(question);

    // Show recovery immediately
    setAdaptiveWeakness(weakness);
    setAnalysingWeakness(true);

    try {
      console.log("Starting weakness analysis:", question.id);
      console.log("WEAKNESS:", weakness);

      // If you have a Gemini API call, do it here
      // const response = await fetch(...);
      // const data = await response.json();
      // setGeminiAnalysis(data.analysis);

    } catch (error) {
      console.error("Weakness analysis failed:", error);
    } finally {
      setAnalysingWeakness(false);
    }
  };

  // ============================================================
  // CONTINUE AFTER CORRECT ANSWER
  // ============================================================

  const continueToNextQuestion = () => {
    if (!result?.correct) {
      return;
    }

    const finalScores = {
      ...questionScores,
      [question.id]: 100,
    };

    const finalRecallScore =
      calculateRecallScore(finalScores);

    const finalMasteredIds =
      getCompletedIdsFromScores(finalScores);

    setQuestionScores(finalScores);
    setMasteredIds(finalMasteredIds);
    setRecallScore(finalRecallScore);
    setSelectedAnswer(null);
    setResult(null);

    const masteredCount = finalMasteredIds.size;
    const total = theoryQuestions.length;

    console.log("================================");
    console.log("CONTINUE");
    console.log("QUESTION:", question.id);
    console.log("MASTERED:", masteredCount, "/", total);
    console.log("SCORES:", finalScores);
    console.log("RECALL:", finalRecallScore);
    console.log("================================");

    // ALL 6 MASTERED
    if (masteredCount === total) {
      onComplete({
        dimension: "recall",
        correct: masteredCount,
        total,
        score: finalRecallScore,
        source: "theory_assessment",
        questionScores: finalScores,
      });

      return;
    }

    // FIND NEXT UNMASTERED
    const nextIndex = findNextQuestion(
      finalScores,
      questionIndex
    );

    if (nextIndex !== -1) {
      setIsRetest(false);
      setQuestionIndex(nextIndex);
    }
  };

  // ============================================================
  // ADAPTIVE RECOVERY COMPLETE
  // ============================================================

  const handleRecoveryComplete = () => {
    const recoveredQuestionId = question.id;

    const updatedScores = {
      ...questionScores,
      [recoveredQuestionId]: 100,
    };

    const updatedRecallScore =
      calculateRecallScore(updatedScores);

    const updatedCompletedIds =
      getCompletedIdsFromScores(updatedScores);

    setQuestionScores(updatedScores);
    setMasteredIds(updatedCompletedIds);
    setRecallScore(updatedRecallScore);

    setAdaptiveWeakness(null);
    setSelectedAnswer(null);
    setResult(null);
    setIsRetest(true);

    const masteredCount =
      theoryQuestions.filter(
        (q) =>
          Number(updatedScores[q.id] ?? 0) >=
          MASTERY_THRESHOLD
      ).length;

    const total = theoryQuestions.length;

    if (
      masteredCount === total &&
      updatedRecallScore >= MASTERY_THRESHOLD
    ) {
      onComplete({
        dimension: "recall",
        correct: masteredCount,
        total,
        score: updatedRecallScore,
        source: "adaptive_recovery",
      });
      return;
    }

    const weakest =
      findWeakestQuestion(updatedScores);

    if (!weakest) {
      return;
    }

    const weakestIndex =
      theoryQuestions.findIndex(
        (q) => q.id === weakest.id
      );

    if (weakestIndex !== -1) {
      setQuestionIndex(weakestIndex);
    }
  };

  // ============================================================
  // NAVIGATOR
  // ============================================================

  const handleQuestionSelect = (index) => {
    if (saving) {
      return;
    }

    const targetQuestion =
      theoryQuestions[index];

    if (!targetQuestion) {
      return;
    }

    const targetScore = Number(
      questionScores[targetQuestion.id] ?? 0
    );

    if (targetScore >= MASTERY_THRESHOLD) {
      return;
    }

    setIsRetest(false);

    openQuestion(
      index,
      questionScores
    );
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <main className="theory-assessment">

      {/* ======================================================
          BACK
      ====================================================== */}

      <button
        type="button"
        className="back-button"
        onClick={onBack}
      >
        ← Back
      </button>

      {/* ======================================================
          HEADER
      ====================================================== */}

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

      {/* ======================================================
          SCORE
      ====================================================== */}

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

      {/* ======================================================
          RETEST BANNER
      ====================================================== */}

      {isRetest && (
        <div className="retest-banner">
          <strong>
            🔄 Recall Retest
          </strong>

          <span>
            Only questions that still need
            mastery will be retested.
          </span>
        </div>
      )}

      {/* ======================================================
          QUESTION NAVIGATOR
      ====================================================== */}

      <AssessmentQuestionNavigator
        questions={theoryQuestions}
        currentIndex={questionIndex}
        answeredIds={answeredIds}
        completedIds={masteredIds}
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
            Let's strengthen this weakness.
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
           NORMAL QUESTION
        ==================================================== */

        <div className="theory-card">

          {/* ==================================================
              QUESTION NUMBER
          ================================================== */}

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

          {/* ==================================================
              QUESTION
          ================================================== */}

          <h2>
            {question.question}
          </h2>

          {/* ==================================================
              CODE
          ================================================== */}

          {question.code && (
            <pre className="theory-code">
              <code>
                {question.code}
              </code>
            </pre>
          )}

          {/* ==================================================
              CORRECT CODE
          ================================================== */}

          {result?.correct &&
            question.correctCode && (
              <div className="correct-code-section">

                <p className="answer-label">
                  CORRECT CODE
                </p>

                <pre className="theory-code">
                  <code>
                    {
                      question.correctCode
                    }
                  </code>
                </pre>

              </div>
            )}

          {/* ==================================================
              OPTIONS
          ================================================== */}

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
                      ${isSelected
                        ? "selected"
                        : ""
                      }
                      ${result &&
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

          {/* ==================================================
              CHECK ANSWER
          ================================================== */}

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

          {/* ==================================================
              RESULT
          ================================================== */}

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

              {/* ----------------------------------------------
                  WRONG ANSWER
              ---------------------------------------------- */}

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

              {/* ----------------------------------------------
                  RECOVERY
              ---------------------------------------------- */}

              {!result.correct && (
                <div>
                  {!adaptiveWeakness && !analysingWeakness && (
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={tryAgain}
                      disabled={saving}
                    >
                      Strengthen This Weakness →
                    </button>
                  )}

                  {analysingWeakness && (
                    <p>Analysing your weakness...</p>
                  )}

                  {adaptiveWeakness && (
                    <div className="gemini-analysis">
                      <h3>💡 Let's strengthen this weakness</h3>

                      <p>{adaptiveWeakness.description}</p>

                      {/* Your recovery component can appear immediately */}
                      <AdaptiveRecovery
                        weakness={adaptiveWeakness}
                        concept={concept}
                        onComplete={handleRecoveryComplete}
                      />
                    </div>
                  )}

                  {geminiAnalysis && (
                    <div className="gemini-analysis">
                      <h3>💡 Analysis</h3>
                      <p>{geminiAnalysis}</p>
                    </div>
                  )}
                </div>
              )}

              {/* ----------------------------------------------
                  CORRECT → CONTINUE
              ---------------------------------------------- */}

              {result.correct && (
                <button
                  type="button"
                  className="primary-button"
                  onClick={
                    continueToNextQuestion
                  }
                  disabled={saving}
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

export default TheoryAssessment;