import { useEffect, useMemo, useState } from "react";

import AssessmentQuestionNavigator from "../components/AssessmentQuestionNavigator";
import AdaptiveRecovery from "../components/AdaptiveRecovery";
import { explainWeaknesses } from "../data/concepts.js";

const MASTERY_THRESHOLD = 80;

const DEFAULT_WEAKNESS = {
  type: "general_explain",
  title: "Strengthen your explanation",
  description:
    "Review the concept and explain it again in your own words.",
};

function ExplainAssessment({
  concept,
  student,
  onComplete,
  onBack,
}) {
  const API_URL = import.meta.env.VITE_API_URL;

  const explainQuestions = concept?.explainQuestions || [];

  // ============================================================
  // STATE
  // ============================================================

  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState(null);
  const [adaptiveWeakness, setAdaptiveWeakness] =
    useState(null);

  const [saving, setSaving] = useState(false);
  const [loadingProgress, setLoadingProgress] =
    useState(true);

  const [completedIds, setCompletedIds] = useState(
    new Set()
  );

  const [questionScores, setQuestionScores] = useState({});
  const [explainScore, setExplainScore] = useState(0);

  // True when we are retesting previously weak questions.
  const [isRetest, setIsRetest] = useState(false);

  // ============================================================
  // CURRENT QUESTION
  // ============================================================

  const question = explainQuestions[questionIndex];

  // ============================================================
  // MASTERED QUESTION
  // ============================================================

  const isQuestionMastered = (questionId) => {
    return (
      Number(questionScores[questionId] ?? 0) >=
      MASTERY_THRESHOLD
    );
  };

  // ============================================================
  // EXPLAIN SCORE
  // ============================================================

  const calculateExplainScore = (scores) => {
    if (!explainQuestions.length) {
      return 0;
    }

    const attemptedQuestions = explainQuestions.filter(
      (q) => scores[q.id] !== undefined
    );

    if (!attemptedQuestions.length) {
      return 0;
    }

    const totalScore = attemptedQuestions.reduce(
      (sum, q) => sum + Number(scores[q.id] ?? 0),
      0
    );

    return Math.round(
      totalScore / attemptedQuestions.length
    );
  };

  // ============================================================
  // KNOWLEDGE FINGERPRINT DIMENSION RESULT
  // ============================================================
  //
  // IMPORTANT:
  //
  // Fingerprint count is based on MASTERED questions.
  //
  // Example:
  //
  // 5 Explain questions
  // 3 mastered
  //
  // fingerprint:
  // {
  //   score: overall explain score,
  //   correct: 3,
  //   total: 5
  // }
  //
  // The backend can merge this Explain dimension with
  // Recall / Predict / Implement / Debug / Apply.
  //
  // ============================================================

  const calculateDimensionResult = (scores) => {
    const total = explainQuestions.length;

    if (!total) {
      return {
        correct: 0,
        total: 0,
        score: 0,
        attempted: 0,
      };
    }

    const attemptedQuestions = explainQuestions.filter(
      (q) => scores[q.id] !== undefined
    );

    const correct = attemptedQuestions.filter(
      (q) =>
        Number(scores[q.id] ?? 0) >=
        MASTERY_THRESHOLD
    ).length;

    const score = Math.round(
      (correct / total) * 100
    );

    return {
      correct,
      total,
      score,
      attempted: attemptedQuestions.length,
    };
  };

  // ============================================================
  // DISPLAYED SCORE
  // ============================================================

  const calculatedExplainScore = useMemo(
    () => calculateExplainScore(questionScores),
    [questionScores, explainQuestions]
  );

  useEffect(() => {
    setExplainScore(calculatedExplainScore);
  }, [calculatedExplainScore]);

  // ============================================================
  // FIND WEAKEST QUESTION
  // ============================================================

  const findWeakestQuestion = (scores) => {
    const weakQuestions = explainQuestions.filter(
      (q) =>
        Number(scores[q.id] ?? 0) <
        MASTERY_THRESHOLD
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
  };

  // ============================================================
  // FIND NEXT WEAK QUESTION
  // ============================================================

  const findNextWeakQuestion = (
    scores,
    currentIndex = -1
  ) => {
    return explainQuestions.findIndex(
      (q, index) =>
        index > currentIndex &&
        Number(scores[q.id] ?? 0) <
          MASTERY_THRESHOLD
    );
  };

  // ============================================================
  // FIND FIRST UNMASTERED QUESTION
  // ============================================================

  const findFirstUnmasteredQuestion = (scores) => {
    return explainQuestions.findIndex(
      (q) =>
        Number(scores[q.id] ?? 0) <
        MASTERY_THRESHOLD
    );
  };

  // ============================================================
  // GET WEAKNESS
  // ============================================================

  const getWeakness = (questionToUse) => {
    if (!questionToUse) {
      return DEFAULT_WEAKNESS;
    }

    return (
      explainWeaknesses?.[questionToUse.id] ||
      DEFAULT_WEAKNESS
    );
  };

  // ============================================================
  // OPEN QUESTION
  // ============================================================

  const openQuestion = (index) => {
    if (
      index < 0 ||
      index >= explainQuestions.length
    ) {
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
    if (saving) {
      return;
    }

    openQuestion(index);
  };

  // ============================================================
  // BUILD KNOWLEDGE FINGERPRINT
  // ============================================================
  //
  // IMPORTANT:
  //
  // Only Explain is updated here.
  //
  // The other dimensions are null because this component
  // must NOT overwrite them.
  //
  // Backend responsibility:
  //
  // existing fingerprint
  //        +
  // updated explain dimension
  //
  // ============================================================

  const buildKnowledgeFingerprint = ({
    correct,
    total,
    score,
  }) => {
    return {
      recall: null,

      explain: {
        score: Number(score ?? 0),
        correct: Number(correct ?? 0),
        total: Number(total ?? 0),
      },

      predict: null,
      implement: null,
      debug: null,
      apply: null,

      updated_dimension: "explain",
      updated_at: new Date().toISOString(),
    };
  };

  // ============================================================
  // UPDATE KNOWLEDGE FINGERPRINT
  // ============================================================

  const updateKnowledgeFingerprint = async (
    dimensionResult
  ) => {
    const fingerprint =
      buildKnowledgeFingerprint(
        dimensionResult
      );

    try {
      const response = await fetch(
        `${API_URL}/knowledge-fingerprint`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            student_id: String(student.id),
            concept: concept.id,

            dimension: "explain",

            fingerprint,

            // Explicit dimension values.
            // These make it easier for the backend
            // to merge only the Explain dimension.
            dimension_score:
              Number(dimensionResult.score ?? 0),

            dimension_correct:
              Number(dimensionResult.correct ?? 0),

            dimension_total:
              Number(dimensionResult.total ?? 0),
          }),
        }
      );

      if (!response.ok) {
        console.warn(
          "Knowledge fingerprint endpoint returned:",
          response.status
        );

        return false;
      }

      return true;
    } catch (error) {
      console.warn(
        "Knowledge fingerprint update failed:",
        error
      );

      return false;
    }
  };

  // ============================================================
  // COMPLETE EXPLAIN ASSESSMENT
  // ============================================================

  const completeExplainAssessment = async (
    scores = questionScores
  ) => {
    const dimensionResult =
      calculateDimensionResult(scores);

    console.log(
      "EXPLAIN DIMENSION COMPLETE:",
      dimensionResult
    );

    // Update fingerprint before moving to next dimension.
    await updateKnowledgeFingerprint(
      dimensionResult
    );

    onComplete({
      dimension: "explain",
      correct: dimensionResult.correct,
      total: dimensionResult.total,
      score: dimensionResult.score,

      // Useful if parent component also keeps
      // the fingerprint.
      fingerprint: buildKnowledgeFingerprint(
        dimensionResult
      ),
    });
  };

  // ============================================================
  // MISTAKE TYPE
  // ============================================================

  const getMistakeType = (score) => {
    if (score >= MASTERY_THRESHOLD) {
      return "none";
    }

    if (score >= 50) {
      return "partial_explanation";
    }

    return "weak_explanation";
  };

  // ============================================================
  // LOAD EXISTING PROGRESS
  // ============================================================

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
          `${API_URL}/progress/${student.id}/${concept.id}/explain`
        );

        if (!response.ok) {
          throw new Error(
            `Failed to load explain progress: ${response.status}`
          );
        }

        const data = await response.json();

        if (cancelled) {
          return;
        }

        console.log(
          "EXPLAIN PROGRESS:",
          data
        );

        const loadedScores =
          data.question_scores || {};

        // ======================================================
        // QUESTIONS MASTERED
        // ======================================================

        const loadedCompletedIds =
          new Set(
            explainQuestions
              .filter(
                (q) =>
                  Number(
                    loadedScores[q.id] ?? 0
                  ) >= MASTERY_THRESHOLD
              )
              .map((q) => q.id)
          );

        setCompletedIds(
          loadedCompletedIds
        );

        setQuestionScores(
          loadedScores
        );

        const loadedExplainScore =
          calculateExplainScore(
            loadedScores
          );

        setExplainScore(
          loadedExplainScore
        );

        console.log(
          "LOADED EXPLAIN SCORE:",
          loadedExplainScore
        );

        // ======================================================
        // ALL QUESTIONS MASTERED
        // ======================================================

        const allMastered =
          explainQuestions.length > 0 &&
          explainQuestions.every(
            (q) =>
              Number(
                loadedScores[q.id] ?? 0
              ) >= MASTERY_THRESHOLD
          );

        if (allMastered) {
          console.log(
            "ALL EXPLAIN QUESTIONS MASTERED → MOVING TO NEXT"
          );

          await completeExplainAssessment(
            loadedScores
          );

          return;
        }

        // ======================================================
        // FIRST UNMASTERED QUESTION
        // ======================================================

        const nextIncompleteIndex =
          findFirstUnmasteredQuestion(
            loadedScores
          );

        if (nextIncompleteIndex !== -1) {
          console.log(
            "OPENING FIRST UNMASTERED EXPLAIN QUESTION:",
            nextIncompleteIndex
          );

          setQuestionIndex(
            nextIncompleteIndex
          );

          return;
        }

        // ======================================================
        // FALLBACK
        // ======================================================

        const weakestQuestion =
          findWeakestQuestion(
            loadedScores
          );

        if (weakestQuestion) {
          setAdaptiveWeakness(
            getWeakness(
              weakestQuestion
            )
          );
        }
      } catch (error) {
        console.error(
          "Could not load explain progress:",
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
          Please log in again before starting
          the assessment.
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

        <h1>
          Explain questions not found
        </h1>

        <p>
          This concept does not have any
          Explain questions yet.
        </p>
      </main>
    );
  }

  if (loadingProgress) {
    return (
      <main className="explain-assessment">
        <p>
          Loading your progress...
        </p>
      </main>
    );
  }

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
  // QUESTION MASTERED
  // ============================================================

  const questionIsMastered =
    isQuestionMastered(question.id);

  // ============================================================
  // EVALUATE ANSWER
  // ============================================================

  const evaluateAnswer = (text) => {
    const lower = text.toLowerCase().trim();

    if (!lower) {
      return 0;
    }

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

    const keywords =
      question.keywords || [];

    if (keywords.length === 0) {
      return 0;
    }

    let matched = 0;

    keywords.forEach((keyword) => {
      const key =
        keyword.toLowerCase();

      if (lower.includes(key)) {
        matched++;
        return;
      }

      const group =
        conceptGroups[key];

      if (
        group &&
        group.some((phrase) =>
          lower.includes(phrase)
        )
      ) {
        matched++;
      }
    });

    const keywordScore =
      (matched / keywords.length) * 100;

    let detailBonus = 0;

    if (lower.length >= 40) {
      detailBonus += 5;
    }

    if (lower.length >= 70) {
      detailBonus += 5;
    }

    return Math.min(
      100,
      Math.round(
        keywordScore * 0.9 +
        detailBonus
      )
    );
  };

  // ============================================================
  // FEEDBACK
  // ============================================================

  const getFeedback = (score) => {
    if (score >= MASTERY_THRESHOLD) {
      return {
        title: "Strong explanation",
        message:
          "Your explanation demonstrates a strong understanding of the concept.",
      };
    }

    if (score >= 50) {
      return {
        title: "Partial understanding",
        message:
          "You demonstrated part of the idea, but some important reasoning is still missing.",
      };
    }

    return {
      title: "Needs more explanation",
      message:
        "Your answer shows limited evidence of understanding. Review the targeted weakness and try again.",
    };
  };

  // ============================================================
  // SUBMIT EXPLANATION
  // ============================================================

  const submitExplanation = async () => {
    if (
      saving ||
      questionIsMastered
    ) {
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

      // ======================================================
      // SCORE
      // ======================================================

      const score =
        evaluateAnswer(answer);

      const feedback =
        getFeedback(score);

      const mistakeType =
        getMistakeType(score);

      // ======================================================
      // UPDATED QUESTION SCORES
      // ======================================================

      const updatedScores = {
        ...questionScores,
        [question.id]: score,
      };

      // ======================================================
      // UPDATED DIMENSION RESULT
      // ======================================================

      const updatedExplainScore =
        calculateExplainScore(
          updatedScores
        );

      const dimensionResult =
        calculateDimensionResult(
          updatedScores
        );

      // ======================================================
      // UPDATED FINGERPRINT
      // ======================================================

      const knowledgeFingerprint =
        buildKnowledgeFingerprint(
          dimensionResult
        );

      // ======================================================
      // KEYWORD ANALYSIS
      // ======================================================

      const lowerAnswer =
        answer.toLowerCase();

      const keywords =
        question.keywords || [];

      const matchedKeywords =
        keywords.filter((keyword) =>
          lowerAnswer.includes(
            keyword.toLowerCase()
          )
        );

      const missingKeywords =
        keywords.filter(
          (keyword) =>
            !lowerAnswer.includes(
              keyword.toLowerCase()
            )
        );

      // ======================================================
      // ADAPTIVE WEAKNESS
      // ======================================================

      const weakness =
        score < MASTERY_THRESHOLD
          ? getWeakness(question)
          : null;

      // ======================================================
      // SAVE ATTEMPT
      // ======================================================

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

            question:
              question.question,

            student_answer:
              answer,

            correct_answer:
              question.expectedPoints?.join(
                " | "
              ) || "",

            correct_code:
              question.correctCode || "",

            // ==================================================
            // MISTAKE TRACKING
            // ==================================================

            mistake:
              mistakeType,

            mistake_type:
              mistakeType,

            weakness_type:
              weakness?.type ||
              "none",

            weakness_title:
              weakness?.title ||
              "",

            weakness_description:
              weakness?.description ||
              "",

            matched_keywords:
              matchedKeywords,

            missing_keywords:
              missingKeywords,

            recommendation:
              score < MASTERY_THRESHOLD
                ? weakness?.description ||
                  "Review the concept and explain it again."
                : "Continue to the next learning dimension.",

            // ==================================================
            // KNOWLEDGE FINGERPRINT
            // ==================================================

            knowledge_fingerprint:
              knowledgeFingerprint,

            fingerprint_dimension:
              "explain",

            fingerprint_score:
              dimensionResult.score,

            fingerprint_correct:
              dimensionResult.correct,

            fingerprint_total:
              dimensionResult.total,

            // ==================================================
            // FINGERPRINT MASTERED COUNT
            // ==================================================
            //
            // This is explicitly the number of Explain
            // questions currently mastered.
            //
            fingerprint_mastered_count:
              dimensionResult.correct,

            fingerprint_question_count:
              dimensionResult.total,

            // ==================================================
            // ATTEMPT METADATA
            // ==================================================

            is_mastered:
              score >=
              MASTERY_THRESHOLD,

            is_retest:
              isRetest,

            attempted_at:
              new Date().toISOString(),
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

      console.log(
        "EXPLAIN ATTEMPT SAVED:",
        responseText
      );

      // ======================================================
      // UPDATE LOCAL STATE
      // ======================================================

      setQuestionScores(
        updatedScores
      );

      setExplainScore(
        updatedExplainScore
      );

      // ======================================================
      // MASTERY
      // ======================================================

      if (
        score >=
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

      // ======================================================
      // UPDATE FINGERPRINT
      // ======================================================
      //
      // Do not block normal progress unnecessarily.
      //
      // The attempt already contains the same fingerprint
      // snapshot, so this is an additional dimension update.
      //
      // ======================================================

      updateKnowledgeFingerprint(
        dimensionResult
      );

      // ======================================================
      // RESULT
      // ======================================================

      setResult({
        success: true,

        score,

        title:
          feedback.title,

        message:
          feedback.message,

        mistakeType,

        missingKeywords,

        weakness,
      });
    } catch (error) {
      console.error(
        "Explain submission error:",
        error
      );

      setResult({
        success: false,

        message:
          "Could not save your explanation. Check that the backend is running and try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // ADAPTIVE RECOVERY
  // ============================================================

  const tryAgain = () => {
    const weakness =
      getWeakness(question);

    console.log(
      "EXPLAIN WEAKNESS:",
      weakness
    );

    setAdaptiveWeakness(
      weakness
    );
  };

  // ============================================================
  // CONTINUE TO NEXT QUESTION
  // ============================================================

  const continueToNextQuestion = () => {
    const latestScores =
      questionScores;

    // ========================================================
    // RETEST MODE
    // ========================================================

    if (isRetest) {
      const nextWeakIndex =
        findNextWeakQuestion(
          latestScores,
          questionIndex
        );

      if (nextWeakIndex !== -1) {
        openQuestion(
          nextWeakIndex
        );

        return;
      }

      // Search from beginning.
      const firstWeakIndex =
        findNextWeakQuestion(
          latestScores,
          -1
        );

      if (firstWeakIndex !== -1) {
        openQuestion(
          firstWeakIndex
        );

        return;
      }

      // ======================================================
      // EVERYTHING MASTERED
      // ======================================================

      const allMastered =
        explainQuestions.every(
          (q) =>
            Number(
              latestScores[q.id] ?? 0
            ) >= MASTERY_THRESHOLD
        );

      if (allMastered) {
        console.log(
          "EXPLAIN RETEST COMPLETE → NEXT DIMENSION"
        );

        completeExplainAssessment(
          latestScores
        );

        return;
      }

      // ======================================================
      // STILL WEAK
      // ======================================================

      const weakestQuestion =
        findWeakestQuestion(
          latestScores
        );

      if (weakestQuestion) {
        setAdaptiveWeakness(
          getWeakness(
            weakestQuestion
          )
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
          Number(
            latestScores[q.id] ?? 0
          ) < MASTERY_THRESHOLD
      );

    if (nextIndex !== -1) {
      openQuestion(
        nextIndex
      );

      return;
    }

    // ========================================================
    // SEARCH FROM BEGINNING
    // ========================================================

    const firstUnmasteredIndex =
      findFirstUnmasteredQuestion(
        latestScores
      );

    if (
      firstUnmasteredIndex !== -1
    ) {
      openQuestion(
        firstUnmasteredIndex
      );

      return;
    }

    // ========================================================
    // ALL QUESTIONS MASTERED
    // ========================================================

    const allMastered =
      explainQuestions.every(
        (q) =>
          Number(
            latestScores[q.id] ?? 0
          ) >= MASTERY_THRESHOLD
      );

    if (allMastered) {
      console.log(
        "EXPLAIN MASTERED → MOVING TO NEXT DIMENSION"
      );

      completeExplainAssessment(
        latestScores
      );

      return;
    }

    // ========================================================
    // FALLBACK
    // ========================================================

    const weakestQuestion =
      findWeakestQuestion(
        latestScores
      );

    if (weakestQuestion) {
      setAdaptiveWeakness(
        getWeakness(
          weakestQuestion
        )
      );
    }
  };

  // ============================================================
  // RECOVERY COMPLETE
  // ============================================================

  const handleRecoveryComplete = () => {
    console.log(
      "ADAPTIVE EXPLAIN RECOVERY COMPLETE"
    );

    setAdaptiveWeakness(null);
    setAnswer("");
    setResult(null);
    setIsRetest(true);

    const weakestQuestion =
      findWeakestQuestion(
        questionScores
      );

    if (!weakestQuestion) {
      const dimensionResult =
        calculateDimensionResult(
          questionScores
        );

      if (
        dimensionResult.correct ===
        dimensionResult.total
      ) {
        completeExplainAssessment(
          questionScores
        );
      }

      return;
    }

    const weakestIndex =
      explainQuestions.findIndex(
        (q) =>
          q.id ===
          weakestQuestion.id
      );

    if (weakestIndex !== -1) {
      console.log(
        "STARTING EXPLAIN RETEST AT:",
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
    <main className="explain-assessment">

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

      {/* ======================================================
          SCORE
      ====================================================== */}

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

      {/* ======================================================
          RETEST
      ====================================================== */}

      {isRetest && (
        <div className="retest-banner">
          <strong>
            🔄 Explain Retest
          </strong>

          <span>
            Only your weak explanations
            need more practice.
          </span>
        </div>
      )}

      {/* ======================================================
          NAVIGATOR
      ====================================================== */}

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
            Let's strengthen this
            weakness.
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
        <div className="explain-card">

          {/* ==================================================
              QUESTION NUMBER
          ================================================== */}

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

          {/* ==================================================
              MASTERED REVIEW
          ================================================== */}

          {questionIsMastered ? (
            <div className="mastered-review">

              <div className="question-box">
                <p className="question-label">
                  ✓ MASTERED
                </p>

                <h2>
                  {question.question}
                </h2>
              </div>

              <div className="mastered-review-score">
                <strong>
                  {
                    questionScores[
                      question.id
                    ]
                  }%
                </strong>

                <span>
                  This question has
                  already been mastered.
                  You do not need to
                  answer it again.
                </span>
              </div>

              {question.expectedPoints
                ?.length > 0 && (
                <div className="review-points">

                  <p className="answer-label">
                    WHAT YOU SHOULD
                    UNDERSTAND
                  </p>

                  <ul>
                    {question.expectedPoints.map(
                      (
                        point,
                        index
                      ) => (
                        <li
                          key={`${question.id}-point-${index}`}
                        >
                          {point}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}

              <button
                type="button"
                className="primary-button"
                onClick={
                  continueToNextQuestion
                }
                disabled={saving}
              >
                Continue →
              </button>
            </div>
          ) : (
            <>
              {/* ==============================================
                  QUESTION
              ============================================== */}

              <div className="question-box">
                <p className="question-label">
                  EXPLAIN
                </p>

                <h2>
                  {question.question}
                </h2>
              </div>

              {/* ==============================================
                  TEXT INPUT
              ============================================== */}

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
                  saving ||
                  !!result
                }
              />

              {/* ==============================================
                  SUBMIT
              ============================================== */}

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

              {/* ==============================================
                  RESULT
              ============================================== */}

              {result && (
                <div
                  className={
                    result.success
                      ? "explain-result success"
                      : "explain-result error"
                  }
                >

                  {result.success && (
                    <div className="explain-score">
                      {result.score}%
                    </div>
                  )}

                  <strong>
                    {result.success
                      ? result.title
                      : "Needs More Explanation"}
                  </strong>

                  <p>
                    {result.message}
                  </p>

                  {/* ========================================
                      MISSING KNOWLEDGE
                  ======================================== */}

                  {result.success &&
                    result.score <
                      MASTERY_THRESHOLD &&
                    result.missingKeywords
                      ?.length > 0 && (
                      <div className="mistake-analysis">

                        <p className="answer-label">
                          KNOWLEDGE TO
                          STRENGTHEN
                        </p>

                        <div className="mistake-tags">
                          {result.missingKeywords.map(
                            (keyword) => (
                              <span
                                key={
                                  keyword
                                }
                                className="mistake-tag"
                              >
                                {keyword}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    )}

                  {/* ========================================
                      SAVE ERROR
                  ======================================== */}

                  {!result.success && (
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() =>
                        setResult(null)
                      }
                    >
                      Try Again
                    </button>
                  )}

                  {/* ========================================
                      LOW SCORE
                  ======================================== */}

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
                          Improve This
                          Explanation
                        </button>
                      </>
                    )}

                  {/* ========================================
                      MASTERED
                  ======================================== */}

                  {result.success &&
                    result.score >=
                      MASTERY_THRESHOLD && (
                      <div className="mastered-result">

                        <p>
                          ✓ This explanation
                          is now mastered.
                          It will be skipped
                          in future sessions
                          unless you choose it
                          from the navigator
                          for review.
                        </p>

                        <button
                          type="button"
                          className="primary-button"
                          onClick={
                            continueToNextQuestion
                          }
                        >
                          {isRetest
                            ? "Continue Retest →"
                            : "Continue →"}
                        </button>

                      </div>
                    )}

                </div>
              )}
            </>
          )}
        </div>
      )}
    </main>
  );
}

export default ExplainAssessment;