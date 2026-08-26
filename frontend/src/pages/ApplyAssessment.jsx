import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { concepts } from "../data/concepts";

import ApplyAISection from "../components/ApplyAISection";

import AssessmentQuestionNavigator from "../components/AssessmentQuestionNavigator";

import {
  saveMistakeHistory,
} from "../utils/mistakeTracker";

function ApplyAssessment({
  onComplete,
  onBack,
  student,
}) {
  const questions =
    concepts?.loops?.applyQuestions || [];

  const API_URL = import.meta.env.VITE_API_URL;

  // ============================================================
  // ALL HOOKS
  // ============================================================

  const [currentIndex, setCurrentIndex] =
    useState(0);

  const [code, setCode] = useState("");

  const [loadingProgress, setLoadingProgress] =
    useState(true);

  const [output, setOutput] = useState("");

  const [result, setResult] = useState(null);

  const [loading, setLoading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [analyzing, setAnalyzing] =
    useState(false);

  const [questionScores, setQuestionScores] =
    useState({});
  const [questionAttempts, setQuestionAttempts] =
    useState({});

  const [analysis, setAnalysis] =
    useState(null);

  const [
    showAdaptiveChallenge,
    setShowAdaptiveChallenge,
  ] = useState(false);

  const [retestMode, setRetestMode] =
    useState(false);

  const [retestQuestionId, setRetestQuestionId] =
    useState(null);

  const [retestCompleted, setRetestCompleted] =
    useState(false);

  const MASTERY_THRESHOLD = 80;

  // ============================================================
  // COMPLETED QUESTIONS
  // ============================================================

  const completedIds = useMemo(() => {
    return new Set(
      questions
        .filter(
          (question) =>
            Number(
              questionScores[question.id] ?? 0
            ) >= MASTERY_THRESHOLD
        )
        .map(
          (question) => question.id
        )
    );
  }, [
    questions,
    questionScores,
  ]);

  // ============================================================
  // APPLY SCORE
  // ============================================================

  const calculateApplyScore = useCallback(
    (scores) => {
      if (!questions.length) {
        return 0;
      }

      const allAnswered =
        questions.every(
          (item) =>
            scores[item.id] !== undefined
        );

      if (!allAnswered) {
        return 0;
      }

      const totalScore =
        questions.reduce(
          (sum, item) =>
            sum +
            Number(
              scores[item.id] ?? 0
            ),
          0
        );

      return Math.round(
        totalScore /
        questions.length
      );
    },
    [questions]
  );

  const applyScore = useMemo(
    () =>
      calculateApplyScore(
        questionScores
      ),
    [
      calculateApplyScore,
      questionScores,
    ]
  );

  // ============================================================
  // APPLY DIMENSION RESULT
  // ============================================================

  const calculateDimensionResult =
    useCallback(
      (scores) => {
        const total =
          questions.length;

        if (!total) {
          return {
            correct: 0,
            total: 0,
            score: 0,
            attempted: 0,
          };
        }

        const attempted =
          questions.filter(
            (item) =>
              scores[item.id] !==
              undefined
          );

        const correct =
          questions.filter(
            (item) =>
              Number(
                scores[item.id] ?? 0
              ) >=
              MASTERY_THRESHOLD
          ).length;

        const score = Math.round(
          (correct / total) * 100
        );

        return {
          correct,
          total,
          score,
          attempted:
            attempted.length,
        };
      },
      [questions]
    );

  // ============================================================
  // KNOWLEDGE FINGERPRINT
  // ============================================================

  const buildKnowledgeFingerprint =
    useCallback(
      (dimensionResult) => {
        return {
          apply: {
            score: Number(
              dimensionResult.score ?? 0
            ),

            correct: Number(
              dimensionResult.correct ?? 0
            ),

            total: Number(
              dimensionResult.total ?? 0
            ),
          },

          updated_dimension:
            "apply",

          updated_at:
            new Date().toISOString(),
        };
      },
      []
    );

  // ============================================================
  // UPDATE KNOWLEDGE FINGERPRINT
  // ============================================================

  const updateKnowledgeFingerprint =
    useCallback(
      async (dimensionResult) => {
        const fingerprint =
          buildKnowledgeFingerprint(
            dimensionResult
          );

        try {
          const response =
            await fetch(
              `${API_URL}/knowledge-fingerprint`,
              {
                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body: JSON.stringify({
                  student_id:
                    String(student.id),

                  concept:
                    "loops",

                  dimension:
                    "apply",

                  fingerprint,

                  dimension_score:
                    Number(
                      dimensionResult.score ??
                      0
                    ),

                  dimension_correct:
                    Number(
                      dimensionResult.correct ??
                      0
                    ),

                  dimension_total:
                    Number(
                      dimensionResult.total ??
                      0
                    ),
                }),
              }
            );

          if (!response.ok) {
            console.warn(
              "Apply fingerprint endpoint returned:",
              response.status
            );

            return false;
          }

          return true;
        } catch (error) {
          console.warn(
            "Apply fingerprint update failed:",
            error
          );

          return false;
        }
      },
      [
        API_URL,
        student?.id,
        buildKnowledgeFingerprint,
      ]
    );

  // ============================================================
  // COMPLETE APPLY ASSESSMENT
  // ============================================================

  const completeApplyAssessment =
    useCallback(
      async (scores) => {
        const allMastered =
          questions.length > 0 &&
          questions.every(
            (item) =>
              Number(
                scores[item.id] ?? 0
              ) >=
              MASTERY_THRESHOLD
          );

        if (!allMastered) {
          return;
        }

        const dimensionResult =
          calculateDimensionResult(
            scores
          );

        const fingerprintSaved =
          await updateKnowledgeFingerprint(
            dimensionResult
          );

        if (!fingerprintSaved) {
          console.warn(
            "Apply fingerprint could not be saved."
          );
        }

        onComplete({
          dimension: "apply",

          correct:
            dimensionResult.correct,

          total:
            dimensionResult.total,

          score:
            dimensionResult.score,

          fingerprint:
            buildKnowledgeFingerprint(
              dimensionResult
            ),
        });
      },
      [
        questions,
        calculateDimensionResult,
        updateKnowledgeFingerprint,
        onComplete,
        buildKnowledgeFingerprint,
      ]
    );

  // ============================================================
  // QUESTION SELECT
  // ============================================================

  const handleQuestionSelect = (index) => {
    const selectedQuestion =
      questions[index];

    if (!selectedQuestion) {
      return;
    }

    setCurrentIndex(index);
    setCode(
      selectedQuestion.starterCode || ""
    );
    setOutput("");
    setResult(null);
    setAnalysis(null);
    setShowAdaptiveChallenge(false);

    setRetestMode(false);
    setRetestQuestionId(null);
    setRetestCompleted(false);
  };

  // ============================================================
  // LOAD APPLY PROGRESS
  // ============================================================

  useEffect(() => {
    if (!student?.id) {
      setLoadingProgress(false);
      return;
    }

    if (questions.length === 0) {
      setLoadingProgress(false);
      return;
    }

    let cancelled = false;

    const loadApplyProgress = async () => {
      try {
        setLoadingProgress(true);

        const response = await fetch(
          `${API_URL}/progress/${student.id}/loops/apply`
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load Apply progress"
          );
        }

        const data =
          await response.json();

        if (cancelled) {
          return;
        }

        console.log(
          "APPLY PROGRESS:",
          data
        );

        // --------------------------------------------------------
        // QUESTION SCORES
        // --------------------------------------------------------

        const loadedScores =
          data.question_scores || {};

        setQuestionScores(
          loadedScores
        );

        // --------------------------------------------------------
        // QUESTION SCORES ARE THE SOURCE OF TRUTH
        // --------------------------------------------------------
        //
        // Do NOT trust backend completed_question_ids.
        //
        // A question is mastered only when
        // its saved best score is >= 80.
        //

        const nextIndex =
          questions.findIndex(
            (item) =>
              Number(
                loadedScores[item.id] ?? 0
              ) <
              MASTERY_THRESHOLD
          );

        if (nextIndex !== -1) {
          setCurrentIndex(
            nextIndex
          );

          setCode(
            questions[nextIndex]
              .starterCode || ""
          );

          return;
        }

        // --------------------------------------------------------
        // EVERYTHING MASTERED
        // --------------------------------------------------------

        const allMastered =
          questions.length > 0 &&
          questions.every(
            (item) =>
              Number(
                loadedScores[item.id] ?? 0
              ) >=
              MASTERY_THRESHOLD
          );

        if (allMastered) {
          console.log(
            "ALL APPLY QUESTIONS MASTERED → COMPLETE"
          );

          await completeApplyAssessment(
            loadedScores
          );

          return;
        }
      } catch (error) {
        console.error(
          "Could not load Apply progress:",
          error
        );

        setCurrentIndex(0);

        if (questions[0]) {
          setCode(
            questions[0]
              .starterCode || ""
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingProgress(false);
        }
      }
    };

    loadApplyProgress();

    return () => {
      cancelled = true;
    };
  }, [
    student?.id,
    API_URL,
    questions,
    completeApplyAssessment,
  ]);

  // ============================================================
  // SAFETY CHECKS
  // ============================================================

  if (!student?.id) {
    return (
      <main className="apply-assessment">
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

  if (loadingProgress) {
    return (
      <main className="apply-assessment">
        <p>
          Loading your progress...
        </p>
      </main>
    );
  }

  if (questions.length === 0) {
    return (
      <section className="apply-assessment">
        <button
          type="button"
          className="back-button"
          onClick={onBack}
        >
          ← Back
        </button>

        <h1>
          Apply questions not found
        </h1>

        <p>
          No Apply questions are available
          for this concept.
        </p>
      </section>
    );
  }

  // ============================================================
  // CURRENT QUESTION
  // ============================================================

  const question =
    questions[currentIndex];

  if (!question) {
    return (
      <section className="apply-assessment">
        <p>
          No Apply question is available.
        </p>
      </section>
    );
  }

  // ============================================================
  // NORMALIZE OUTPUT
  // ============================================================

  const normalizeOutput = (value) =>
    String(value ?? "")
      .trim()
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/[ \t]+$/gm, "");

  // ============================================================
  // RESET QUESTION
  // ============================================================

  const resetQuestion = (index) => {
    const nextQuestion =
      questions[index];

    if (!nextQuestion) {
      return;
    }

    setCurrentIndex(index);

    setCode(
      nextQuestion.starterCode || ""
    );

    setOutput("");
    setResult(null);
    setAnalysis(null);
    setShowAdaptiveChallenge(false);
  };

  // ============================================================
  // CREATE LOCAL APPLY / ADAPTIVE ANALYSIS
  // ============================================================

  const createApplyAnalysis = () => {
    const currentCode = code.toLowerCase();
    const adaptive = question.adaptive;

    // ------------------------------------------------------------
    // DEFAULT
    // ------------------------------------------------------------
    if (!adaptive) {
      return {
        weakness: "general_implementation",
        mistakeType: "application_error",
        title: "Application mistake",
        whatHappened:
          "Your solution does not yet produce the required output.",
        misconception:
          "Review the loop structure and output.",
        hint: question.hint,
        recommendedNextStep:
          "Review the hint and try again.",
      };
    }

    // ------------------------------------------------------------
    // PYTHON SYNTAX
    // ------------------------------------------------------------
    const hasForLoop = /\bfor\b/.test(currentCode);
    const hasIf = /\bif\b/.test(currentCode);
    const hasWhile = /\bwhile\b/.test(currentCode);

    const forLineMissingColon = currentCode
      .split("\n")
      .some(
        (line) =>
          /^\s*for\b/.test(line) &&
          !line.trim().endsWith(":")
      );

    if (forLineMissingColon) {
      return {
        weakness: "loop_syntax",
        mistakeType: "syntax_error",
        title: "Loop syntax mistake",
        whatHappened:
          "Your for loop is missing its colon.",
        misconception:
          "Python for loops must end with a colon.",
        hint:
          "Add : at the end of the for statement.",
        recommendedNextStep:
          "Fix the loop syntax and run the code again.",
      };
    }

    if (
      hasIf &&
      !currentCode.includes(":")
    ) {
      return {
        weakness: "python_syntax",
        mistakeType: "syntax_error",
        title: "If statement syntax mistake",
        whatHappened:
          "Your if statement appears to be missing its colon.",
        misconception:
          "Python if statements must end with a colon.",
        hint:
          "Check the end of your if statement and add : if needed.",
        recommendedNextStep:
          "Fix the if statement and run the code again.",
      };
    }

    if (
      hasWhile &&
      !currentCode.includes(":")
    ) {
      return {
        weakness: "loop_syntax",
        mistakeType: "syntax_error",
        title: "While loop syntax mistake",
        whatHappened:
          "Your while loop is missing its colon.",
        misconception:
          "Python while loops must end with a colon.",
        hint:
          "Add : at the end of the while statement.",
        recommendedNextStep:
          "Fix the loop syntax and run the code again.",
      };
    }

    // ------------------------------------------------------------
    // QUESTION-SPECIFIC ADAPTIVE RULES
    // ------------------------------------------------------------
    for (const mistake of adaptive.mistakes || []) {
      let detected = false;

      switch (mistake.check) {
        case "range":
          detected = !currentCode.includes("range");
          break;

        case "range_start":
          detected = !(
            currentCode.includes("range(2") ||
            currentCode.includes("range (2")
          );
          break;

        case "range_stop":
          detected = !(
            currentCode.includes("range(2, 11") ||
            currentCode.includes("range (2, 11")
          );
          break;

        case "range_step":
          detected = !(
            currentCode.includes(", 2)") ||
            currentCode.includes(", 2 ")
          );
          break;

        case "for_loop":
          detected = !hasForLoop;
          break;

        case "list_loop":
          detected = !(
            currentCode.includes("for score in scores") ||
            currentCode.includes("for price in prices")
          );
          break;

        case "print":
          detected = !currentCode.includes("print");
          break;

        case "accumulator":
          detected = !(
            currentCode.includes("total +=") ||
            currentCode.includes("total = total +")
          );
          break;

        case "square_calculation":
          detected = !(
            currentCode.includes("number * number") ||
            currentCode.includes("number ** 2")
          );
          break;

        case "practice_output":
          detected = !currentCode.includes("practice");
          break;

        default:
          detected = false;
      }

      if (detected) {
        return {
          weakness: mistake.id,
          mistakeType: mistake.id,
          title: mistake.note,
          whatHappened: mistake.note,
          misconception: mistake.explanation,
          hint: mistake.hint,
          recommendedNextStep:
            "Fix this part of your solution and run it again.",
        };
      }
    }

    // ------------------------------------------------------------
    // GENERAL FALLBACK
    // ------------------------------------------------------------
    return {
      weakness: "general_implementation",
      mistakeType: "application_error",
      title: "Application mistake",
      whatHappened:
        "Your solution does not yet produce the required output.",
      misconception:
        "Check the loop, calculation, and output.",
      hint: question.hint,
      recommendedNextStep:
        "Compare your solution with the expected output and try again.",
    };
  };

  const trackApplyMistake = async ({
    mistakeType,
    score,
    attemptNumber,
    errorMessage = "",
    misconception = "",
    recommendation = "",
    weakness = "",
    weaknessType = "",
  }) => {

    return saveMistakeHistory({
      API_URL,

      studentId: student?.id,

      // Learning hierarchy
      topic: "loops",
      concept: "loops",
      dimension: "apply",

      // Question
      questionId: question?.id,
      questionType: "code",
      questionFormat: "coding",
      question: question?.description,

      // Attempt
      score: score ?? 0,
      maxScore: 100,
      attemptNumber,

      // Student response
      studentAnswer: code,
      correctAnswer:
        question?.expectedOutput || "",

      // Mistake
      mistakeType,
      mistake:
        errorMessage ||
        mistakeType ||
        "Application mistake",

      weakness:
        weakness ||
        analysis?.weakness ||
        null,

      weaknessType:
        weaknessType ||
        analysis?.weakness ||
        null,

      // Analysis
      misconception:
        misconception ||
        analysis?.misconception ||
        null,

      whatHappened:
        errorMessage ||
        analysis?.whatHappened ||
        null,

      recommendation:
        recommendation ||
        analysis?.recommendedNextStep ||
        null,

      // Code-specific
      code,
      errorMessage,

      expectedOutput:
        question?.expectedOutput || "",

      actualOutput:
        output || "",

      // Retest
      retestMode,
      isRetest: retestMode,

      // Extra information
      metadata: {
        question_title:
          question?.title || null,

        adaptive:
          question?.adaptive || null,
      },
    });
  };

  // ============================================================
  // ANALYZE APPLY MISTAKE
  // LOCAL ONLY — NO GEMINI / NO /analyze-mistake
  // ============================================================

  const analyzeApplyMistake = async ({
    mistakeType,
    score = 40,
    errorMessage = "",
  }) => {
    setAnalyzing(true);
    setAnalysis(null);

    try {
      console.log(
        "🧠 Using local Apply analysis:",
        mistakeType,
        "score:",
        score
      );

      const fallbackAnalysis =
        createApplyAnalysis();

      // Small delay so "Analyzing..." can appear naturally.
      await new Promise((resolve) =>
        setTimeout(resolve, 150)
      );

      setAnalysis({
        mistakeType:
          mistakeType ||
          fallbackAnalysis.mistakeType,

        weakness:
          fallbackAnalysis.weakness,

        title:
          fallbackAnalysis.title,

        whatHappened:
          errorMessage ||
          fallbackAnalysis.whatHappened,

        misconception:
          fallbackAnalysis.misconception,

        hint:
          fallbackAnalysis.hint ||
          question.hint,

        recommendedNextStep:
          fallbackAnalysis.recommendedNextStep,
      });
    } catch (error) {
      console.error(
        "❌ Local Apply analysis failed:",
        error
      );

      // ======================================================
      // FINAL SAFETY FALLBACK
      // ======================================================

      setAnalysis({
        mistakeType:
          mistakeType ||
          "application_error",

        weakness:
          "general_implementation",

        title:
          "Application mistake",

        whatHappened:
          errorMessage ||
          "Your solution does not yet produce the required output.",

        misconception:
          "Review the loop structure and compare your output with the expected output.",

        hint:
          question.hint ||
          "Review your loop structure and try again.",

        recommendedNextStep:
          "Fix the issue and run your solution again.",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  // ============================================================
  // RUN CODE
  // ============================================================

  const runCode = async () => {
    const currentCode =
      code.trim();

    const attemptNumber =
      Number(
        questionAttempts[question.id] ?? 0
      ) + 1;

    const updatedAttempts = {
      ...questionAttempts,
      [question.id]: attemptNumber,
    };

    setQuestionAttempts(updatedAttempts);

    setResult(null);

    setOutput("");
    setAnalysis(null);
    setShowAdaptiveChallenge(false);

    // ========================================================
    // NO CODE
    // ========================================================

    if (!currentCode) {
      const errorMessage =
        "Please write or fix the code before running it.";

      setOutput(
        "No code to run."
      );

      setResult({
        success: false,
        score: 0,
        mistakeType: "no_code",
        message: errorMessage,
      });

      await analyzeApplyMistake({
        mistakeType: "no_code",
        score: 0,
        errorMessage,
      });
      await trackApplyMistake({
        mistakeType: "no_code",
        score: 0,
        attemptNumber,
        errorMessage,
      });

      return;
    }

    setLoading(true);

    try {
      // ======================================================
      // RUN PYTHON CODE
      // ======================================================

      const response = await fetch(
        `${API_URL}/run-code`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            language: "python",
            code: currentCode,
          }),
        }
      );

      let data = {};

      try {
        data =
          await response.json();
      } catch {
        data = {};
      }

      // ======================================================
      // BACKEND ERROR
      // ======================================================

      if (!response.ok) {
        throw new Error(
          data.detail ||
          data.message ||
          data.error ||
          "Failed to execute code."
        );
      }

      // ======================================================
      // PYTHON ERROR
      // ======================================================

      if (data.error) {
        const errorText =
          String(data.error);

        setOutput(errorText);

        const isSyntaxError =
          /syntaxerror|syntax error|indentationerror|indentation error|invalid syntax/i.test(
            errorText
          );

        const mistakeType =
          isSyntaxError
            ? "python_syntax"
            : "execution_error";

        const errorMessage =
          isSyntaxError
            ? "Your program has a Python syntax error. Check your brackets, indentation, quotes, and make sure statements such as for, if, and while end with a colon (:)."
            : "Your program could not run. Check the error shown in the terminal and fix the code.";

        setResult({
          success: false,
          score: 40,
          mistakeType,
          message: errorMessage,
        });

        await analyzeApplyMistake({
          mistakeType,
          score: 40,
          errorMessage,
        });
        await trackApplyMistake({
          mistakeType,
          score: 40,
          attemptNumber,
          errorMessage,
        });

        return;
      }

      // ======================================================
      // OUTPUT
      // ======================================================

      const actualOutput =
        normalizeOutput(
          data.output || ""
        );

      const expectedOutput =
        normalizeOutput(
          question.expectedOutput || ""
        );

      setOutput(
        data.output || ""
      );

      console.log(
        "APPLY QUESTION:",
        question.id
      );

      console.log(
        "APPLY CODE:",
        currentCode
      );

      console.log(
        "ACTUAL OUTPUT:",
        actualOutput
      );

      console.log(
        "EXPECTED OUTPUT:",
        expectedOutput
      );

      // ======================================================
      // CORRECT
      // ======================================================

      if (
        actualOutput ===
        expectedOutput
      ) {
        setResult({
          success: true,
          score: 100,
          mistakeType: "none",
          message:
            "Excellent! Your solution produced the required output.",
        });

        setAnalysis(null);

        return;
      }

      // ======================================================
      // INCORRECT OUTPUT
      // ======================================================

      const localAnalysis =
        createApplyAnalysis();

      const mistakeType =
        data.mistake_type ||
        localAnalysis.mistakeType ||
        "application_error";

      const errorMessage =
        data.message ||
        localAnalysis.whatHappened ||
        "Your program ran, but the output does not match the required result.";

      setResult({
        success: false,
        score:
          data.score ?? 40,
        mistakeType,
        message: errorMessage,
      });

      await analyzeApplyMistake({
        mistakeType,
        score:
          data.score ?? 40,
        errorMessage,
      });
      await trackApplyMistake({
        mistakeType,
        score: data.score ?? 40,
        attemptNumber,
        errorMessage,

        weakness:
          localAnalysis.weakness,

        misconception:
          localAnalysis.misconception,

        recommendation:
          localAnalysis.recommendedNextStep,

        weaknessType:
          localAnalysis.weakness,
      });

    } catch (error) {
      console.error(
        "Run Apply code error:",
        error
      );

      const errorMessage =
        "Could not run the code. Make sure the backend is running.";

      setOutput(
        "Could not run the code.\nPlease check that the backend is running."
      );

      setResult({
        success: false,
        score: 0,
        mistakeType:
          "backend_error",
        message: errorMessage,
      });

      await analyzeApplyMistake({
        mistakeType:
          "backend_error",
        score: 0,
        errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // SUBMIT APPLICATION
  // ============================================================

  const submitApplication = async () => {
    // ----------------------------------------------------------
    // STUDENT CHECK
    // ----------------------------------------------------------

    if (!student?.id) {
      setResult({
        success: false,
        score: 0,
        mistakeType:
          "student_missing",

        message:
          "Student information is missing. Please log in again.",
      });

      return;
    }

    // ----------------------------------------------------------
    // MUST RUN FIRST
    // ----------------------------------------------------------

    if (!result) {
      setResult({
        success: false,
        score: 0,
        mistakeType:
          "no_attempt",

        message:
          "Run your solution before submitting.",
      });

      return;
    }

    // ----------------------------------------------------------
    // MUST BE CORRECT
    // ----------------------------------------------------------

    if (!result.success) {
      setResult({
        ...result,

        message:
          "Improve your solution before submitting the application task.",
      });

      return;
    }

    setSaving(true);

    try {
      // --------------------------------------------------------
      // SAVE CURRENT ATTEMPT
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
            student_id:
              String(student.id),

            topic: "loops",

            concept: "loops",

            dimension:
              "apply",

            question_id:
              question.id,

            score:
              Number(
                result.score ?? 0
              ),

            question:
              question.description,

            student_answer:
              code,

            correct_answer:
              question.expectedOutput ||
              "",

            mistake:
              "none",

            mistake_type:
              "application_success",

            recommendation:
              "Application successfully demonstrated.",

            weakness:
              analysis?.weakness ||
              question.adaptive?.mistakes?.[0]?.id ||
              "general_implementation",

            weakness_type:
              analysis?.weakness ||
              question.adaptive?.mistakes?.[0]?.id ||
              "general_implementation",

            knowledge_fingerprint: {
              apply: {
                score:
                  Number(
                    result.score ?? 0
                  ),
              },
            },

            retest_mode:
              retestMode,

            is_retest:
              retestMode,
          }),
        }
      );

      let responseData = {};

      try {
        responseData =
          await response.json();
      } catch {
        responseData = {};
      }

      console.log(
        "📥 /attempts:",
        response.status,
        responseData
      );

      if (!response.ok) {
        throw new Error(
          responseData.detail ||
          responseData.message ||
          "Failed to save application attempt."
        );
      }

      // --------------------------------------------------------
      // CALCULATE BEST SCORE
      // --------------------------------------------------------

      const previousScore =
        Number(
          questionScores[
          question.id
          ] ?? 0
        );

      const updatedScore =
        Math.max(
          previousScore,
          Number(
            result.score ?? 0
          )
        );

      // --------------------------------------------------------
      // IMPORTANT:
      // Build latest scores synchronously.
      // Do NOT wait for React state.
      // --------------------------------------------------------

      const updatedScores = {
        ...questionScores,

        [question.id]:
          updatedScore,
      };

      setQuestionScores(
        updatedScores
      );

      // --------------------------------------------------------
      // RETEST SUCCESS
      // --------------------------------------------------------

      if (
        retestMode &&
        retestQuestionId ===
        question.id
      ) {
        setRetestCompleted(true);
        setRetestMode(false);
        setRetestQuestionId(null);
      }

      // --------------------------------------------------------
      // FIND NEXT UNMASTERED QUESTION
      // --------------------------------------------------------

      const nextQuestion =
        questions
          .map(
            (item, index) => ({
              item,
              index,
              score: Number(
                updatedScores[
                item.id
                ] ?? 0
              ),
            })
          )
          .filter(
            ({ score }) =>
              score <
              MASTERY_THRESHOLD
          )
          .sort(
            (a, b) =>
              a.score - b.score
          )[0];

      // --------------------------------------------------------
      // CONTINUE TO LOWEST-SCORING UNMASTERED
      // --------------------------------------------------------

      if (nextQuestion) {
        setCurrentIndex(
          nextQuestion.index
        );

        setCode(
          nextQuestion.item
            .starterCode || ""
        );

        setOutput("");
        setResult(null);
        setAnalysis(null);
        setShowAdaptiveChallenge(false);

        return;
      }

      // --------------------------------------------------------
      // ALL QUESTIONS MASTERED
      // --------------------------------------------------------

      const allMastered =
        questions.length > 0 &&
        questions.every(
          (item) =>
            Number(
              updatedScores[
              item.id
              ] ?? 0
            ) >=
            MASTERY_THRESHOLD
        );

      if (allMastered) {
        console.log(
          "ALL APPLY QUESTIONS MASTERED"
        );

        await completeApplyAssessment(
          updatedScores
        );

        return;
      }

      // --------------------------------------------------------
      // FINAL RECOVERY FALLBACK
      // --------------------------------------------------------

      const weakestQuestion =
        questions
          .map(
            (item, index) => ({
              item,
              index,
              score:
                Number(
                  updatedScores[
                  item.id
                  ] ?? 0
                ),
            })
          )
          .filter(
            ({ score }) =>
              score <
              MASTERY_THRESHOLD
          )
          .sort(
            (a, b) =>
              a.score - b.score
          )[0];

      if (weakestQuestion) {
        setCurrentIndex(
          weakestQuestion.index
        );

        setCode(
          weakestQuestion.item
            .starterCode || ""
        );

        setOutput("");
        setResult(null);
        setAnalysis(null);
        setShowAdaptiveChallenge(false);

        setRetestMode(true);

        setRetestQuestionId(
          weakestQuestion.item.id
        );

        setRetestCompleted(false);

        return;
      }
    } catch (error) {
      console.error(
        "❌ Submit Apply failed:",
        error
      );

      setResult({
        success: false,

        score: 0,

        mistakeType:
          "backend_error",

        message:
          error.message ||
          "Could not save the Apply attempt.",
      });
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // CODE CHANGE
  // ============================================================

  const handleCodeChange = (
    event
  ) => {
    setCode(
      event.target.value
    );

    setOutput("");
    setResult(null);
    setAnalysis(null);
    setShowAdaptiveChallenge(false);

    setRetestMode(false);
    setRetestQuestionId(null);
    setRetestCompleted(false);
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <section className="apply-assessment">

      {/* BACK */}

      <button
        type="button"
        className="back-button"
        onClick={onBack}
        disabled={
          loading || saving
        }
      >
        ← Back
      </button>

      {/* HEADER */}

      <div className="apply-header">

        <p className="section-label">
          STEP 6 • APPLY
        </p>

        <p className="question-counter">
          QUESTION{" "}
          {currentIndex + 1} /{" "}
          {questions.length}
        </p>

        <h1>
          Solve a new problem
        </h1>

        <p>
          You know how loops work.
          Now use that understanding
          in a new problem.
        </p>

        <div
          style={{
            marginTop: "12px",
            fontSize: "14px",
            color: "#64748b",
          }}
        >
          Apply Score:{" "}
          <strong>
            {applyScore}%
          </strong>
          {" "}
          / mastery threshold{" "}
          <strong>
            {MASTERY_THRESHOLD}%
          </strong>
        </div>

      </div>

      {/* NAVIGATOR */}

      <AssessmentQuestionNavigator
        questions={questions}
        currentIndex={
          currentIndex
        }
        completedIds={
          completedIds
        }
        questionScores={
          questionScores
        }
        onSelectQuestion={
          handleQuestionSelect
        }
      />

      {/* CARD */}

      <div className="apply-card">

        {/* QUESTION */}

        <div className="apply-task">

          {retestMode && (
            <span
              className="debug-difficulty"
              style={{
                background: "#fef3c7",
                color: "#92400e",
                display: "inline-block",
                marginBottom: "12px",
              }}
            >
              Targeted Retest
            </span>
          )}

          <p className="question-label">
            APPLICATION CHALLENGE
          </p>

          <h2>
            {question.title}
          </h2>

          <p>
            {question.description}
          </p>

          <p>
            Your program should
            produce:
          </p>

          <pre>
            {question.expectedOutput}
          </pre>

          {question.hint && (
            <div className="hint-box">

              <strong>
                💡 Hint:
              </strong>

              <p>
                {question.hint}
              </p>

            </div>
          )}

        </div>

        {/* CODE EDITOR */}

        <label
          className="code-label"
          htmlFor="apply-code"
        >
          YOUR SOLUTION
        </label>

        <textarea
          id="apply-code"
          value={code}
          onChange={
            handleCodeChange
          }
          spellCheck="false"
          className="apply-editor"
          disabled={
            loading || saving
          }
          aria-label="Python solution editor"
        />

        {/* ACTIONS */}

        <div className="apply-actions">

          <button
            type="button"
            className="secondary-button"
            onClick={runCode}
            disabled={
              loading || saving
            }
          >
            {loading
              ? "Running..."
              : "▶ Run Solution"}
          </button>

          <button
            type="button"
            className="primary-button"
            onClick={
              submitApplication
            }
            disabled={
              saving ||
              loading ||
              !result?.success
            }
          >
            {saving
              ? "Saving..."
              : currentIndex ===
                questions.length - 1
                ? "Finish Apply →"
                : "Submit & Next →"}
          </button>

        </div>

        {/* OUTPUT */}

        <div className="apply-output">

          <p className="question-label">
            OUTPUT
          </p>

          <pre>
            {output ||
              "Run your solution to see the output."}
          </pre>

        </div>

        {/* SUCCESS */}

        {result &&
          result.success && (
            <div className="apply-result success">

              <div className="apply-score">
                {result.score}%
              </div>

              <strong>
                Application Successful
              </strong>

              <p>
                {result.message}
              </p>

            </div>
          )}

        {/* FAILURE */}

        {result &&
          !result.success && (
            <div className="apply-result error">

              <strong>
                Application Needs
                Improvement
              </strong>

              <p>
                {result.message}
              </p>

            </div>
          )}

        {/* LOCAL AI / ADAPTIVE SECTION */}

        <ApplyAISection
          analysis={analysis}
          question={question}
          analyzing={analyzing}
          showAdaptiveChallenge={
            showAdaptiveChallenge
          }
          setShowAdaptiveChallenge={
            setShowAdaptiveChallenge
          }
        />

      </div>

    </section>
  );
}

export default ApplyAssessment;