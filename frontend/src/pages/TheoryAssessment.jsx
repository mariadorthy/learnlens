import { useCallback, useEffect, useMemo, useState } from "react";

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

  // ============================================================
  // STATE
  // ============================================================

  const [questionIndex, setQuestionIndex] = useState(0);

  const [selectedAnswer, setSelectedAnswer] = useState(null);

  const [result, setResult] = useState(null);

  const [adaptiveWeakness, setAdaptiveWeakness] =
    useState(null);

  const [saving, setSaving] = useState(false);

  const [loadingProgress, setLoadingProgress] =
    useState(true);

  const [completedIds, setCompletedIds] =
    useState(() => new Set());

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
      if (!theoryQuestions.length) {
        return 0;
      }

      const total = theoryQuestions.reduce(
        (sum, question) => {
          return (
            sum +
            Number(scores[question.id] ?? 0)
          );
        },
        0
      );

      return Math.round(
        total / theoryQuestions.length
      );
    },
    [theoryQuestions]
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
          .filter(
            (question) =>
              Number(
                scores[question.id] ?? 0
              ) >= MASTERY_THRESHOLD
          )
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

      const correct =
        theoryQuestions.filter(
          (question) =>
            Number(
              scores[question.id] ?? 0
            ) >= MASTERY_THRESHOLD
        ).length;

      const total = theoryQuestions.length;

      return {
        recall: {
          score: Number(newRecallScore ?? 0),
          correct,
          total,
        },

        explain:
          existingFingerprint.explain ?? {
            score: 0,
            correct: 0,
            total: 0,
          },

        predict:
          existingFingerprint.predict ?? {
            score: 0,
            correct: 0,
            total: 0,
          },

        implement:
          existingFingerprint.implement ?? {
            score: 0,
            correct: 0,
            total: 0,
          },

        debug:
          existingFingerprint.debug ?? {
            score: 0,
            correct: 0,
            total: 0,
          },

        apply:
          existingFingerprint.apply ?? {
            score: 0,
            correct: 0,
            total: 0,
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

    const completed = theoryQuestions.filter(
      (question) =>
        Number(scores[question.id] ?? 0) >=
        MASTERY_THRESHOLD
    ).length;

    const score = calculateRecallScore(scores);

    return {
      completed,
      total,
      score,
      mastered:
        total > 0 &&
        completed === total &&
        score >= MASTERY_THRESHOLD,
    };
  },
  [
    theoryQuestions,
    calculateRecallScore,
  ]
);
  // ============================================================
  // OPEN QUESTION
  // ============================================================

  const openQuestion = useCallback(
    (index, scores = questionScores) => {
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

      // Never open a mastered question.
      if (
        targetScore >= MASTERY_THRESHOLD
      ) {
        console.log(
          "BLOCKED MASTERED QUESTION:",
          targetQuestion.id
        );
        return;
      }

      console.log(
        "OPENING QUESTION:",
        targetQuestion.id
      );

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

        // --------------------------------------------------------
        // NORMALIZE API DATA
        // --------------------------------------------------------

        const loadedScores =
          data?.question_scores &&
            typeof data.question_scores ===
            "object"
            ? data.question_scores
            : {};

        const loadedAttempts =
          data?.question_attempts &&
            typeof data.question_attempts ===
            "object"
            ? data.question_attempts
            : {};

        // --------------------------------------------------------
        // COMPLETED IDS
        // --------------------------------------------------------

        const loadedCompletedIds =
          getCompletedIdsFromScores(
            loadedScores
          );

        // --------------------------------------------------------
        // CALCULATE RECALL
        // --------------------------------------------------------

        const loadedRecallScore =
          calculateRecallScore(
            loadedScores
          );

        console.log(
          "LOADED SCORES:",
          loadedScores
        );

        console.log(
          "LOADED RECALL:",
          loadedRecallScore
        );

        setQuestionScores(
          loadedScores
        );

        setQuestionAttempts(
          loadedAttempts
        );

        setCompletedIds(
          loadedCompletedIds
        );

        setRecallScore(
          loadedRecallScore
        );

        // --------------------------------------------------------
        // ALREADY MASTERED
        // --------------------------------------------------------

        const loadedCompletedCount =
  loadedCompletedIds.size;

if (
  loadedCompletedCount === theoryQuestions.length &&
  loadedRecallScore >= MASTERY_THRESHOLD
) {
  console.log(
    "RECALL ALREADY MASTERED"
  );

  onComplete({
    dimension: "recall",
    correct: loadedCompletedCount,
    total: theoryQuestions.length,
    score: loadedRecallScore,
    source: "existing_progress",
  });

  return;
}

        // --------------------------------------------------------
        // FIND FIRST UNMASTERED
        // --------------------------------------------------------

        const firstUnmastered =
          findFirstUnmasteredQuestion(
            loadedScores
          );

        if (firstUnmastered !== -1) {
          console.log(
            "FIRST UNMASTERED:",
            firstUnmastered
          );

          setQuestionIndex(
            firstUnmastered
          );

          return;
        }

        // --------------------------------------------------------
        // FALLBACK
        // --------------------------------------------------------

        const weakest =
          findWeakestQuestion(
            loadedScores
          );

        if (weakest) {
          setAdaptiveWeakness(
            getWeakness(weakest)
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
    API_URL,
    calculateRecallScore,
    concept?.id,
    findFirstUnmasteredQuestion,
    findWeakestQuestion,
    getCompletedIdsFromScores,
    getWeakness,
    onComplete,
    student?.id,
    theoryQuestions,
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

    const updatedRecallScore =
      calculateRecallScore(
        updatedScores
      );

    // ----------------------------------------------------------
    // UPDATE UI IMMEDIATELY
    // ----------------------------------------------------------

    setQuestionAttempts(
      updatedAttempts
    );

    setQuestionScores(
      updatedScores
    );

    setRecallScore(
      updatedRecallScore
    );

    if (
      updatedScores[question.id] >=
      MASTERY_THRESHOLD
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
    // KNOWLEDGE FINGERPRINT
    // ----------------------------------------------------------

    const knowledgeFingerprint =
      buildKnowledgeFingerprint(
        updatedRecallScore,
        updatedScores
      );

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

    // ----------------------------------------------------------
    // SAVE ATTEMPT
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

  const tryAgain = () => {
    const weakness =
      getWeakness(question);

    console.log(
      "STARTING ADAPTIVE RECOVERY:",
      question.id
    );

    console.log(
      "WEAKNESS:",
      weakness
    );

    setAdaptiveWeakness(
      weakness
    );
  };

  // ============================================================
  // CONTINUE AFTER CORRECT ANSWER
  // ============================================================

  const continueToNextQuestion =
    () => {
      if (!result?.correct) {
        return;
      }

      console.log(
        "================================="
      );

      console.log(
        "CONTINUING AFTER CORRECT ANSWER"
      );

      // --------------------------------------------------------
      // ALWAYS USE LATEST SCORES
      // --------------------------------------------------------

      const finalScores = {
        ...questionScores,
        [question.id]: 100,
      };

      const finalRecallScore =
        calculateRecallScore(
          finalScores
        );

      const finalCompletedIds =
        getCompletedIdsFromScores(
          finalScores
        );

      // --------------------------------------------------------
      // UPDATE STATE
      // --------------------------------------------------------

      setQuestionScores(
        finalScores
      );

      setCompletedIds(
        finalCompletedIds
      );

      setRecallScore(
        finalRecallScore
      );

      setSelectedAnswer(null);
      setResult(null);

      console.log(
        "FINAL SCORES:",
        finalScores
      );

      console.log(
        "FINAL RECALL:",
        finalRecallScore
      );

      // --------------------------------------------------------
      // MASTERY CHECK
      // --------------------------------------------------------

      const completedCount =
        Object.values(finalScores).filter(
          (score) => Number(score) >= MASTERY_THRESHOLD
        ).length;

      const total = theoryQuestions.length;
      const correct = completedCount;

      if (
        completedCount === total &&
        finalRecallScore >= MASTERY_THRESHOLD
      ) {
        console.log(
          "RECALL MASTERED → EXPLAIN"
        );

        onComplete({
          dimension: "recall",
          correct,
          total,
          score: finalRecallScore,
          source: "theory_assessment",
        });

        return;
      }

      // --------------------------------------------------------
      // FIND NEXT UNMASTERED
      // --------------------------------------------------------

      let nextIndex =
        findNextUnmasteredQuestion(
          finalScores,
          questionIndex
        );

      // --------------------------------------------------------
      // IF NONE AFTER CURRENT, WRAP AROUND
      // --------------------------------------------------------

      if (nextIndex === -1) {
        nextIndex =
          findFirstUnmasteredQuestion(
            finalScores
          );
      }

      // --------------------------------------------------------
      // OPEN NEXT QUESTION
      // --------------------------------------------------------

      if (nextIndex !== -1) {
        console.log(
          "NEXT QUESTION:",
          nextIndex
        );

        setIsRetest(false);

        openQuestion(
          nextIndex,
          finalScores
        );

        return;
      }

      // --------------------------------------------------------
      // FALLBACK: FIND WEAKEST
      // --------------------------------------------------------

      const weakest =
        findWeakestQuestion(
          finalScores
        );

      if (weakest) {
        console.log(
          "STARTING RECOVERY:",
          weakest.id
        );

        setAdaptiveWeakness(
          getWeakness(weakest)
        );
      }
    };

  // ============================================================
  // ADAPTIVE RECOVERY COMPLETE
  // ============================================================

  const handleRecoveryComplete =
    () => {
      console.log(
        "================================="
      );

      console.log(
        "ADAPTIVE RECOVERY COMPLETE"
      );

      // --------------------------------------------------------
      // CLOSE RECOVERY
      // --------------------------------------------------------

      setAdaptiveWeakness(null);

      setSelectedAnswer(null);

      setResult(null);

      setIsRetest(true);

      // --------------------------------------------------------
      // USE CURRENT SCORES
      // --------------------------------------------------------

      const currentScore =
        calculateRecallScore(
          questionScores
        );

      setRecallScore(
        currentScore
      );

      console.log(
        "RECALL AFTER RECOVERY:",
        currentScore
      );

      // --------------------------------------------------------
      // IF ALREADY MASTERED
      // --------------------------------------------------------

      const completedCount =
  Object.values(questionScores).filter(
    (score) => Number(score) >= MASTERY_THRESHOLD
  ).length;

const total = theoryQuestions.length;
const correct = completedCount;

if (
  completedCount === total &&
  currentScore >= MASTERY_THRESHOLD
) {
  console.log(
    "RECOVERY CAUSED MASTERY → EXPLAIN"
  );

  onComplete({
    dimension: "recall",
    correct,
    total,
    score: currentScore,
    source: "adaptive_recovery",
  });

  return;
}
      // --------------------------------------------------------
      // FIND WEAKEST UNMASTERED QUESTION
      // --------------------------------------------------------

      const weakest =
        findWeakestQuestion(
          questionScores
        );

      if (!weakest) {
        console.log(
          "NO UNMASTERED QUESTION"
        );

        return;
      }

      const weakestIndex =
        theoryQuestions.findIndex(
          (q) =>
            q.id === weakest.id
        );

      if (
        weakestIndex === -1
      ) {
        return;
      }

      console.log(
        "TARGETED RETEST:",
        weakest.id
      );

      // --------------------------------------------------------
      // OPEN TARGETED QUESTION
      // --------------------------------------------------------

      setQuestionIndex(
        weakestIndex
      );

      setSelectedAnswer(null);

      setResult(null);
    };

  // ============================================================
  // NAVIGATOR
  // ============================================================

  const handleQuestionSelect =
    (index) => {
      if (saving) {
        return;
      }

      const targetQuestion =
        theoryQuestions[index];

      if (!targetQuestion) {
        return;
      }

      const targetScore =
        Number(
          questionScores[
          targetQuestion.id
          ] ?? 0
        );

      if (
        targetScore >=
        MASTERY_THRESHOLD
      ) {
        console.log(
          "NAVIGATION BLOCKED:",
          targetQuestion.id
        );

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
        ← Back to learning
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
                <button
                  type="button"
                  className="secondary-button"
                  onClick={tryAgain}
                  disabled={saving}
                >
                  Strengthen This Weakness →
                </button>
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