import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import DebugAISection from "../components/DebugAISection";
import AssessmentQuestionNavigator from "../components/AssessmentQuestionNavigator";
import { detectWeakness } from "../services/weaknessDetector";

import {
  saveMistakeHistory,
} from "../utils/mistakeTracker";

function DebugAssessment({
  concept,
  student,
  onComplete,
  onBack,
}) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [result, setResult] = useState(null);

  const [loadingProgress, setLoadingProgress] = useState(true);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const [questionScores, setQuestionScores] = useState({});
  const [questionAttempts, setQuestionAttempts] = useState({});

  const [retestMode, setRetestMode] = useState(false);
  const [retestQuestionId, setRetestQuestionId] =
    useState(null);
  const [retestCompleted, setRetestCompleted] =
    useState(false);


  const [showHint, setShowHint] = useState(false);
  const [mistakeAnalysis, setMistakeAnalysis] = useState(null);
  const [showAdaptiveChallenge, setShowAdaptiveChallenge] =
    useState(false);

  const MASTERY_THRESHOLD = 80;

  const debugQuestions = concept?.debugQuestions || [];
  const API_URL = import.meta.env.VITE_API_URL;

  const completedIds = useMemo(() => {
    return new Set(
      debugQuestions
        .filter(
          (question) =>
            Number(
              questionScores[question.id] ?? 0
            ) >= MASTERY_THRESHOLD
        )
        .map((question) => question.id)
    );
  }, [debugQuestions, questionScores]);

  // ============================================================
  // DEBUG SCORE
  // ============================================================

  const calculateDebugScore = useCallback(
    (scores) => {
      if (!debugQuestions.length) {
        return 0;
      }

      const allAnswered =
        debugQuestions.every(
          (item) =>
            scores[item.id] !== undefined
        );

      if (!allAnswered) {
        return 0;
      }

      const totalScore =
        debugQuestions.reduce(
          (sum, item) =>
            sum +
            Number(
              scores[item.id] ?? 0
            ),
          0
        );

      return Math.round(
        totalScore /
        debugQuestions.length
      );
    },
    [debugQuestions]
  );

  const debugScore = useMemo(
    () =>
      calculateDebugScore(
        questionScores
      ),
    [
      calculateDebugScore,
      questionScores,
    ]
  );

  // ============================================================
  // DEBUG DIMENSION RESULT
  // ============================================================

  const calculateDimensionResult =
    useCallback(
      (scores) => {
        const total =
          debugQuestions.length;

        if (!total) {
          return {
            correct: 0,
            total: 0,
            score: 0,
            attempted: 0,
          };
        }

        const attempted =
          debugQuestions.filter(
            (item) =>
              scores[item.id] !==
              undefined
          );

        const correct =
          debugQuestions.filter(
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
      [debugQuestions]
    );

  // ============================================================
  // KNOWLEDGE FINGERPRINT
  // ============================================================

  const buildKnowledgeFingerprint =
    useCallback(
      (dimensionResult) => {
        return {
          debug: {
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
            "debug",

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
                    concept.id,

                  dimension:
                    "debug",

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
              "Debug fingerprint endpoint returned:",
              response.status
            );

            return false;
          }

          return true;
        } catch (error) {
          console.warn(
            "Debug fingerprint update failed:",
            error
          );

          return false;
        }
      },
      [
        API_URL,
        student?.id,
        concept?.id,
        buildKnowledgeFingerprint,
      ]
    );

  // ============================================================
  // COMPLETE DEBUG ASSESSMENT
  // ============================================================

  const completeDebugAssessment =
    useCallback(
      async (scores) => {
        const allMastered =
          debugQuestions.length > 0 &&
          debugQuestions.every(
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
            "Debug fingerprint could not be saved."
          );
        }

        onComplete({
          dimension: "debug",

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
        debugQuestions,
        calculateDimensionResult,
        updateKnowledgeFingerprint,
        onComplete,
        buildKnowledgeFingerprint,
      ]
    );

  // ============================================================
  // UPDATE QUESTION SCORE
  // ============================================================

  const updateQuestionScore = useCallback(
    (questionId, score) => {
      setQuestionScores(
        (previous) => {
          const previousScore =
            Number(
              previous[questionId] ?? 0
            );

          const bestScore =
            Math.max(
              previousScore,
              Number(score ?? 0)
            );

          return {
            ...previous,
            [questionId]:
              bestScore,
          };
        }
      );
    },
    []
  );

  // ============================================================
  // QUESTION SELECT
  // ============================================================

  const handleQuestionSelect = (index) => {
    const selectedQuestion = debugQuestions[index];

    if (!selectedQuestion) {
      return;
    }

    setQuestionIndex(index);
    setCode(selectedQuestion.starterCode || "");
    setOutput("");
    setResult(null);
    setMistakeAnalysis(null);
    setShowAdaptiveChallenge(false);
    setShowHint(false);
    setRetestMode(false);
    setRetestQuestionId(null);
    setRetestCompleted(false);
  };

  // ============================================================
  // LOAD DEBUG PROGRESS
  // ============================================================

  useEffect(() => {
    if (!student?.id || !concept?.id) {
      setLoadingProgress(false);
      return;
    }

    if (debugQuestions.length === 0) {
      setLoadingProgress(false);
      return;
    }

    let cancelled = false;

    const loadProgress = async () => {
      try {
        setLoadingProgress(true);

        const response = await fetch(
          `${API_URL}/progress/${student.id}/${concept.id}/debug`
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load debug progress"
          );
        }

        const data = await response.json();

        if (cancelled) {
          return;
        }

        console.log(
          "DEBUG PROGRESS:",
          data
        );

        // --------------------------------------------------------
        // QUESTION SCORES
        // --------------------------------------------------------

        const loadedScores =
          data.question_scores || {};

        setQuestionScores(loadedScores);

        // --------------------------------------------------------
        // QUESTION SCORES ARE THE SOURCE OF TRUTH
        // --------------------------------------------------------
        //
        // Do NOT trust backend
        // completed_question_ids.
        //
        // A question is mastered only when
        // its saved best score is >= 80.
        //

        const nextIndex =
          debugQuestions.findIndex(
            (item) =>
              Number(
                loadedScores[item.id] ?? 0
              ) <
              MASTERY_THRESHOLD
          );

        if (nextIndex !== -1) {
          setQuestionIndex(
            nextIndex
          );

          setCode(
            debugQuestions[nextIndex]
              .starterCode || ""
          );

          return;
        }

        // --------------------------------------------------------
        // EVERYTHING MASTERED
        // --------------------------------------------------------

        const allMastered =
          debugQuestions.length > 0 &&
          debugQuestions.every(
            (item) =>
              Number(
                loadedScores[item.id] ?? 0
              ) >=
              MASTERY_THRESHOLD
          );

        if (allMastered) {
          console.log(
            "ALL DEBUG QUESTIONS MASTERED → COMPLETE"
          );

          await completeDebugAssessment(
            loadedScores
          );

          return;
        }
      } catch (error) {
        console.error(
          "Could not load debug progress:",
          error
        );

        setQuestionIndex(0);

        if (debugQuestions[0]) {
          setCode(
            debugQuestions[0]
              .starterCode || ""
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
    debugQuestions,
  ]);

  // ============================================================
  // LOADING
  // ============================================================

  if (loadingProgress) {
    return (
      <main className="debug-assessment">
        <p>Loading your progress...</p>
      </main>
    );
  }

  // ============================================================
  // STUDENT SAFETY CHECK
  // ============================================================

  if (!student?.id) {
    return (
      <main className="debug-assessment">
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

  // ============================================================
  // CONCEPT SAFETY CHECK
  // ============================================================

  if (debugQuestions.length === 0) {
    return (
      <main className="debug-assessment">
        <button
          type="button"
          className="back-button"
          onClick={onBack}
        >
          ← Back
        </button>

        <h1>Debug questions not found</h1>

        <p>
          This concept does not have any Debug
          questions yet.
        </p>
      </main>
    );
  }

  // ============================================================
  // CURRENT QUESTION
  // ============================================================

  const question = debugQuestions[questionIndex];

  if (!question) {
    return (
      <main className="debug-assessment">
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

  const currentCode =
    code || question.starterCode || "";

  // ============================================================
  // NORMALIZE OUTPUT
  // ============================================================

  const normalizeOutput = (value) => {
    return String(value ?? "")
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .trim();
  };

  // ============================================================
  // NORMALIZE WEAKNESS
  // ============================================================

  const normalizeWeakness = (weakness) => {
    if (!weakness) {
      return "general_debugging";
    }

    if (typeof weakness === "object") {
      weakness =
        weakness.type ||
        weakness.weakness ||
        weakness.id ||
        "";
    }

    const value = String(weakness)
      .toLowerCase()
      .trim();

    if (
      value.includes("odd") ||
      value.includes("even") ||
      value.includes("condition") ||
      value.includes("modulo") ||
      value.includes("loop condition")
    ) {
      return "loop_condition";
    }

    if (
      value.includes("accumulator") ||
      value.includes("running total") ||
      value.includes("sum") ||
      value.includes("total") ||
      value.includes("accumulation")
    ) {
      return "loop_accumulation";
    }

    if (
      value.includes("operator") ||
      value.includes("multiplication") ||
      value.includes("calculation") ||
      value.includes("square")
    ) {
      return "calculation_logic";
    }

    if (
      value.includes("countdown") ||
      value.includes("count down") ||
      value.includes("negative step")
    ) {
      return "countdown_range";
    }

    if (
      value.includes("range") ||
      value.includes("boundary") ||
      value.includes("step") ||
      value.includes("upper bound")
    ) {
      return "range_exclusive_upper_bound";
    }

    if (
      value.includes("syntax") ||
      value.includes("python syntax") ||
      value.includes("indentation")
    ) {
      return "python_syntax";
    }

    return "general_debugging";
  };

  // ============================================================
  // ADAPTIVE WEAKNESS
  // ============================================================

  const getAdaptiveWeakness = ({
    mistakeType,
    questionId,
    aiWeakness,
  }) => {
    // Syntax/execution errors map directly.
    if (
      mistakeType === "python_syntax" ||
      mistakeType === "syntax_error"
    ) {
      return "python_syntax";
    }

    // Question-specific mappings.
    if (questionId === "debug-1") {
      return "loop_condition";
    }

    if (questionId === "debug-2") {
      return "loop_accumulation";
    }

    if (questionId === "debug-3") {
      return "calculation_logic";
    }

    if (questionId === "debug-4") {
      return "countdown_range";
    }

    if (questionId === "debug-5") {
      return "loop_accumulation";
    }

    if (questionId === "debug-6") {
      return "calculation_logic";
    }

    return normalizeWeakness(aiWeakness);
  };

  // ============================================================
  // QUESTION-SPECIFIC ERROR
  // ============================================================

  const getDebugErrorMessage = () => {
    switch (question.id) {
      case "debug-1":
        return (
          "Your program ran, but it is not printing only the odd numbers from 1 to 9. Check the condition used to identify odd numbers."
        );

      case "debug-2":
        return (
          "The sum is incorrect. Check that the range includes 10 and that each number is added to the existing total."
        );

      case "debug-3":
        return (
          "The multiplication table is incorrect. Check the operator used to calculate the result."
        );

      case "debug-4":
        return (
          "The countdown is incorrect. Check the starting value, stopping value, and negative step in range()."
        );

      case "debug-5":
        return (
          "The total is incorrect. Check whether each price is being added to the existing total instead of replacing it."
        );

      case "debug-6":
        return (
          "The square values are incorrect. Remember that a square is calculated by multiplying a number by itself."
        );

      default:
        return (
          "Your program ran, but the output does not match the expected result."
        );
    }
  };

  // ============================================================
  // ANALYZE DEBUG MISTAKE
  // ============================================================

  const runMistakeAnalysis = async ({
    mistakeType,
    errorMessage,
    score = 0,
  }) => {

    const fallbackWeakness = detectWeakness({
      code: currentCode,
      question: question.description,
      questionId: question.id,
      mistakeType,
    });

    try {
      console.log(
        "🤖 Calling /analyze-mistake..."
      );

      const analysisResponse = await fetch(
        `${API_URL}/analyze-mistake`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            student_id: String(student.id),
            concept: concept.id,
            dimension: "debug",
            question_id: question.id,
            score,
            question: question.description,
            student_answer: currentCode,
            correct_answer: question.expectedOutput,
            mistake: mistakeType,
            recommendation:
              "Review the bug type, loop conditions, range boundaries, operators, variable updates, and output logic.",
          }),
        }
      );

      let analysisData = {};

      try {
        analysisData =
          await analysisResponse.json();
      } catch {
        analysisData = {};
      }

      console.log(
        "🤖 /analyze-mistake response:",
        analysisData
      );

      if (!analysisResponse.ok) {
        throw new Error(
          analysisData.detail ||
          analysisData.message ||
          "AI analysis request failed."
        );
      }

      const aiAnalysis =
        analysisData.ai_analysis ||
        analysisData;

      setMistakeAnalysis({
        mistake_type:
          aiAnalysis.mistake_type ||
          question.bugType ||
          mistakeType ||
          "Debugging error",

        explanation:
          aiAnalysis.explanation ||
          errorMessage,

        misconception:
          aiAnalysis.misconception ||
          "The code still contains a mistake that prevents it from producing the required output.",

        hint:
          aiAnalysis.hint ||
          question.hint ||
          "Compare your condition, range, operator, and variable updates with the required behavior.",

        recommended_action:
          aiAnalysis.recommended_action ||
          "Review the debugging mistake and run the corrected code again.",

        weakness: getAdaptiveWeakness({
          mistakeType,
          questionId: question.id,
          aiWeakness:
            aiAnalysis.weakness ||
            fallbackWeakness,
        }),
      });
    } catch (analysisError) {
      console.error(
        "❌ Debug analysis failed:",
        analysisError
      );

      setMistakeAnalysis({
        mistake_type:
          question.bugType ||
          mistakeType ||
          "Debugging error",

        explanation: errorMessage,

        misconception:
          mistakeType === "python_syntax"
            ? "There is a Python syntax or execution problem in the submitted code."
            : "The code does not correctly match the required debugging task.",

        hint:
          question.hint ||
          "Check the condition, range, operator, variable updates, and output.",

        recommended_action:
          "Review the mistake and run the corrected code again.",

        weakness: getAdaptiveWeakness({
          mistakeType,
          questionId: question.id,
          aiWeakness: fallbackWeakness,
        }),
      });
    }
  };

  // ============================================================
  // TRACK DEBUG MISTAKE
  // ============================================================

  const trackDebugMistake = async ({
    mistakeType,
    score,
    attemptNumber,
    errorMessage = "",
    misconception = "",
    recommendation = "",
    weakness = "",
    weaknessType = "",
    actualOutput = "",
    studentAnswer = "",
  }) => {
    return saveMistakeHistory({
      API_URL,

      studentId: student?.id,

      topic: concept?.id,
      concept: concept?.id,
      dimension: "debug",

      questionId: question?.id,
      questionType: "code",
      questionFormat: "coding",
      question:
        question?.description ||
        question?.question ||
        question?.title ||
        "",

      score: score ?? 0,
      maxScore: 100,
      attemptNumber,

      studentAnswer:
        studentAnswer ||
        currentCode ||
        "",

      correctAnswer:
        question?.expectedOutput ||
        question?.correctAnswer ||
        question?.correctCode ||
        "",

      mistakeType,

      mistake:
        errorMessage ||
        mistakeType ||
        "Debugging mistake",

      weakness:
        weakness ||
        mistakeAnalysis?.weakness ||
        null,

      weaknessType:
        weaknessType ||
        mistakeAnalysis?.weakness ||
        null,

      misconception:
        misconception ||
        mistakeAnalysis?.misconception ||
        null,

      whatHappened:
        errorMessage ||
        mistakeAnalysis?.explanation ||
        null,

      recommendation:
        recommendation ||
        mistakeAnalysis?.recommended_action ||
        null,

      code: currentCode || "",
      errorMessage,

      expectedOutput:
        question?.expectedOutput ||
        "",

      actualOutput:
        actualOutput ||
        output ||
        "",

      retestMode: Boolean(retestMode),
      isRetest: Boolean(retestMode),

      metadata: {
        question_title:
          question?.title || null,

        adaptive:
          question?.adaptive || null,
      },
    });
  };

  // ============================================================
  // RUN CODE
  // ============================================================

  const runCode = async () => {
    const attemptNumber =
      Number(
        questionAttempts[question.id] ?? 0
      ) + 1;

    setQuestionAttempts((previous) => ({
      ...previous,
      [question.id]: attemptNumber,
    }));

    setResult(null);
    setMistakeAnalysis(null);
    setOutput("");
    setShowAdaptiveChallenge(false);
    setAiLoading(true);

    try {
      // --------------------------------------------------------
      // Empty code
      // --------------------------------------------------------

      if (!currentCode.trim()) {
        const errorMessage =
          "Please write or fix the code before running it.";

        setOutput("No code to run.");

        setResult({
          success: false,
          score: 0,
          mistakeType: "no_code",
          message: errorMessage,
        });

        await trackDebugMistake({
          mistakeType: "no_code",
          score: 0,
          attemptNumber,
          errorMessage,
        });

        return;
      }

      // --------------------------------------------------------
      // Execute Python
      // --------------------------------------------------------

      const response = await fetch(
        `${API_URL}/run-code`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            language: "python",
            code: currentCode,
          }),
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
          data.error ||
          "Failed to run the code."
        );
      }

      // --------------------------------------------------------
      // PYTHON EXECUTION ERROR
      // --------------------------------------------------------

      if (data.error) {
        const errorText = String(data.error);

        setOutput(errorText);

        const isSyntaxError =
          /syntaxerror|syntax error|indentationerror|indentation error|invalid syntax/i.test(
            errorText
          );

        const mistakeType = isSyntaxError
          ? "python_syntax"
          : "execution_error";

        const errorMessage = isSyntaxError
          ? "Your program has a Python syntax error. Check your brackets, indentation, quotes, and make sure statements such as for, if, and while end with a colon (:)."
          : "Your program could not run. Check the error shown in the terminal and fix the code.";

        const score = 0;

        setResult({
          success: false,
          score,
          mistakeType,
          message: errorMessage,
        });

        await runMistakeAnalysis({
          mistakeType,
          errorMessage,
          score,
        });

        await trackDebugMistake({
          mistakeType,
          score: 40,
          attemptNumber,
          errorMessage,
        });

        return;
      }


      // --------------------------------------------------------
      // OUTPUT COMPARISON
      // --------------------------------------------------------

      const actualOutput = normalizeOutput(
        data.output || ""
      );

      const expectedOutput = normalizeOutput(
        question.expectedOutput || ""
      );

      setOutput(data.output || "");

      console.log(
        "DEBUG QUESTION:",
        question.id
      );

      console.log(
        "DEBUG CODE:",
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

      // --------------------------------------------------------
      // CORRECT
      // --------------------------------------------------------

      if (actualOutput === expectedOutput) {
        setResult({
          success: true,
          score: 100,
          mistakeType:
            "debugging_error_fixed",
          message:
            "Excellent! You identified the mistake and your program produced the expected output.",
        });

        setMistakeAnalysis(null);

        return;
      }

      // --------------------------------------------------------
      // INCORRECT OUTPUT
      // --------------------------------------------------------

      const errorMessage =
        getDebugErrorMessage();

      const score = 0;

      const mistakeType =
        question.bugType ||
        "logic_error";

      setResult({
        success: false,
        score,
        mistakeType,
        message: errorMessage,
      });

      await runMistakeAnalysis({
        mistakeType,
        errorMessage,
        score,
      });

      await trackDebugMistake({
        mistakeType,
        score: 40,
        attemptNumber,
        errorMessage,
        weakness: getAdaptiveWeakness({
          mistakeType,
          questionId: question.id,
          aiWeakness: question.bugType,
        }),
        weaknessType: getAdaptiveWeakness({
          mistakeType,
          questionId: question.id,
          aiWeakness: question.bugType,
        }),
        actualOutput,
      });

    } catch (error) {
      console.error(
        "Run debug code error:",
        error
      );

      const errorMessage =
        "Could not process the attempt. Please try again.";

      setOutput(
        "Could not run the code.\nPlease check that the backend is running."
      );

      setResult({
        success: false,
        score: 0,
        mistakeType: "backend_error",
        message:
          "Could not run the code. Make sure the backend is running and the /run-code endpoint is available.",
      });

      await trackDebugMistake({
        mistakeType: "backend_error",
        score: 0,
        attemptNumber,
        errorMessage,
      });
    } finally {

      setAiLoading(false);
    }
  };

  // ============================================================
  // SUBMIT
  // ============================================================

  const submitDebug = async () => {
    // ----------------------------------------------------------
    // No run result
    // ----------------------------------------------------------

    if (!result) {
      setResult({
        success: false,
        score: 0,
        mistakeType: "no_attempt",
        message:
          "Run your code first and make sure the debugging task is correct.",
      });

      return;
    }

    // ----------------------------------------------------------
    // Incorrect result
    // ----------------------------------------------------------

    if (!result.success) {
      setResult({
        ...result,
        message:
          "Fix the debugging error before submitting.",
      });

      return;
    }

    setLoading(true);

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

            concept:
              concept.id,

            dimension:
              "debug",

            question_id:
              question.id,

            score:
              Number(result.score ?? 0),

            question:
              question.description,

            student_answer:
              currentCode,

            correct_answer:
              question.expectedOutput ||
              "",

            mistake:
              "none",

            mistake_type:
              "debugging_success",

            recommendation:
              "Debugging successfully demonstrated.",

            weakness:
              normalizeWeakness(
                mistakeAnalysis?.weakness ||
                question.bugType ||
                "general_debugging"
              ),

            weakness_type:
              normalizeWeakness(
                mistakeAnalysis?.weakness ||
                question.bugType ||
                "general_debugging"
              ),

            knowledge_fingerprint: {
              debug: {
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

      if (!response.ok) {
        const errorText =
          await response.text();

        console.error(
          "Failed to save debug attempt:",
          response.status,
          errorText
        );

        throw new Error(
          "Failed to save debug attempt."
        );
      }

      await response.json();

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
      // Build the latest score object synchronously.
      //
      // Do NOT wait for React state to update.
      // --------------------------------------------------------

      const updatedScores = {
        ...questionScores,

        [question.id]:
          updatedScore,
      };

      // --------------------------------------------------------
      // UPDATE SCORES
      // --------------------------------------------------------

      setQuestionScores(updatedScores);

      // --------------------------------------------------------
      // RETEST SUCCESS
      // --------------------------------------------------------

      if (
        retestMode &&
        retestQuestionId === question.id
      ) {
        setRetestCompleted(true);
        setRetestMode(false);
        setRetestQuestionId(null);
      }

      // --------------------------------------------------------
      // FIND NEXT UNMASTERED QUESTION
      // --------------------------------------------------------

      const nextQuestion = debugQuestions
        .map((item, index) => ({
          item,
          index,
          score: Number(
            updatedScores[item.id] ?? 0
          ),
        }))
        .filter(
          ({ score }) =>
            score < MASTERY_THRESHOLD
        )
        .sort(
          (a, b) => a.score - b.score
        )[0];

      // --------------------------------------------------------
      // CONTINUE TO NEXT UNMASTERED
      // --------------------------------------------------------

      if (nextQuestion) {
        setQuestionIndex(nextQuestion.index);

        setCode(
          nextQuestion.item.starterCode || ""
        );

        setOutput("");
        setResult(null);
        setMistakeAnalysis(null);
        setShowAdaptiveChallenge(false);
        setShowHint(false);

        return;
      }

      // --------------------------------------------------------
      // ALL QUESTIONS MASTERED
      // --------------------------------------------------------

      const allMastered =
        debugQuestions.length > 0 &&
        debugQuestions.every(
          (item) =>
            Number(
              updatedScores[item.id] ?? 0
            ) >= MASTERY_THRESHOLD
        );

      if (allMastered) {
        console.log(
          "ALL DEBUG QUESTIONS MASTERED"
        );

        await completeDebugAssessment(
          updatedScores
        );

        return;
      }

      // --------------------------------------------------------
      // FINAL RECOVERY FALLBACK
      // --------------------------------------------------------

      const weakestQuestion =
        debugQuestions
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
              a.score -
              b.score
          )[0];

      if (weakestQuestion) {
        setQuestionIndex(
          weakestQuestion.index
        );

        setCode(
          weakestQuestion.item
            .starterCode || ""
        );

        setOutput("");
        setResult(null);
        setMistakeAnalysis(null);
        setShowAdaptiveChallenge(false);
        setShowHint(false);

        setRetestMode(true);

        setRetestQuestionId(
          weakestQuestion.item.id
        );

        setRetestCompleted(false);

        return;
      }
    } catch (error) {
      console.error(
        "Submit debug error:",
        error
      );

      setResult({
        success: false,
        score: 0,
        mistakeType:
          "backend_error",

        message:
          "Could not save the debugging attempt. Make sure the backend is running.",
      });
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // RESET
  // ============================================================

  const resetQuestion = () => {
    setCode(
      question.starterCode || ""
    );

    setOutput("");
    setResult(null);

    setMistakeAnalysis(null);
    setShowAdaptiveChallenge(false);
    setShowHint(false);

    setRetestMode(false);
    setRetestQuestionId(null);
    setRetestCompleted(false);
  };

  // ============================================================
  // CODE CHANGE


  const handleCodeChange = (event) => {
    setCode(event.target.value);

    // Previous run is no longer valid.
    setResult(null);
    setOutput("");

    // Clear previous AI feedback.
    setMistakeAnalysis(null);
    setShowAdaptiveChallenge(false);
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <main className="debug-assessment">

      {/* BACK */}

      <button
        type="button"
        className="back-button"
        onClick={onBack}
        disabled={loading || aiLoading}
      >
        ← Back
      </button>

      {/* HEADER */}

      <div className="debug-header">
        <p className="section-label">
          STEP 6 • DEBUG ASSESSMENT
        </p>

        <h1>
          Find and fix the mistake
        </h1>

        <p>
          The code below contains one or
          more mistakes. Identify the
          problem, fix the code, and run it
          to check your result.
        </p>

        <div
          style={{
            marginTop: "12px",
            fontSize: "14px",
            color: "#64748b",
          }}
        >
          Debug Score:{" "}
          <strong>
            {debugScore}%
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
        questions={debugQuestions}
        currentIndex={questionIndex}
        completedIds={completedIds}
        questionScores={questionScores}
        onSelectQuestion={
          handleQuestionSelect
        }
      />

      {/* CARD */}

      <div className="debug-card">

        {/* QUESTION NUMBER */}

        <div className="question-number">
          QUESTION{" "}
          {String(
            questionIndex + 1
          ).padStart(2, "0")}
          {" / "}
          {String(
            debugQuestions.length
          ).padStart(2, "0")}
        </div>

        {/* DIFFICULTY / BUG TYPE */}

        <div className="debug-meta">

          {question.difficulty && (
            <span className="debug-difficulty">
              {question.difficulty}
            </span>
          )}

          {retestMode && (
            <span
              className="debug-difficulty"
              style={{
                background: "#fef3c7",
                color: "#92400e",
              }}
            >
              Targeted Retest
            </span>
          )}

          {question.bugType && (
            <span className="debug-bug-type">
              Bug:{" "}
              {question.bugType.replace(
                /_/g,
                " "
              )}
            </span>
          )}

        </div>

        {/* QUESTION */}

        <div className="debug-task">

          <p className="question-label">
            CODING CHALLENGE
          </p>

          <h2>
            {question.title}
          </h2>

          <p>
            {question.description}
          </p>

          <p>
            Your program should produce:
          </p>

          <pre>
            {question.expectedOutput}
          </pre>

        </div>

        {/* VARIABLES */}

        {question.variables?.length > 0 && (
          <div className="debug-variables">

            <p className="question-label">
              VARIABLES
            </p>

            <div className="variables-list">

              {question.variables.map(
                (variable) => (
                  <div
                    className="variable-item"
                    key={variable.name}
                  >
                    <strong>
                      {variable.name}
                    </strong>

                    <span>
                      {variable.purpose}
                    </span>
                  </div>
                )
              )}

            </div>
          </div>
        )}

        {/* HINT */}

        {question.hint && (
          <div className="debug-hint-section">

            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                setShowHint(
                  (previous) =>
                    !previous
                )
              }
              disabled={
                loading || aiLoading
              }
            >
              {showHint
                ? "Hide Hint"
                : "💡 Show Hint"}
            </button>

            {showHint && (
              <div className="debug-hint">

                <strong>
                  Hint
                </strong>

                <p>
                  {question.hint}
                </p>

              </div>
            )}

          </div>
        )}

        {/* CODE */}

        <label
          htmlFor="debug-code-editor"
          className="code-label"
        >
          YOUR CODE
        </label>

        <textarea
          id="debug-code-editor"
          value={currentCode}
          onChange={
            handleCodeChange
          }
          spellCheck="false"
          className="debug-editor"
          disabled={
            loading || aiLoading
          }
          aria-label="Python code editor"
        />

        {/* ACTIONS */}

        <div className="debug-actions">

          <button
            type="button"
            className="secondary-button"
            onClick={runCode}
            disabled={
              loading || aiLoading
            }
          >
            {aiLoading
              ? "Running..."
              : "▶ Run Code"}
          </button>

          <button
            type="button"
            className="primary-button"
            onClick={submitDebug}
            disabled={
              loading ||
              !result?.success
            }
          >
            {loading
              ? "Saving..."
              : questionIndex <
                debugQuestions.length - 1
                ? "Submit & Continue →"
                : "Submit Debug →"}
          </button>

        </div>

        {/* OUTPUT */}

        <div className="debug-output">

          <p className="question-label">
            TERMINAL OUTPUT
          </p>

          <pre>
            {output ||
              "Run the code to inspect the result."}
          </pre>

        </div>

        {/* RESULT */}

        {result && (
          <div
            className={
              result.success
                ? "debug-result success"
                : "debug-result error"
            }
          >

            {result.success && (
              <div className="debug-score">
                {result.score}%
              </div>
            )}

            <strong>
              {result.success
                ? "Debugging Successful"
                : "Debugging Needs Improvement"}
            </strong>

            <p>
              {result.message}
            </p>

            {!result.success && (
              <button
                type="button"
                className="secondary-button"
                onClick={
                  resetQuestion
                }
                disabled={
                  loading || aiLoading
                }
              >
                Try Again
              </button>
            )}

          </div>
        )}

        {/* AI LOADING */}

        {aiLoading && (
          <div className="ai-loading">
            🤖 Analyzing your debugging
            mistake...
          </div>
        )}

        {/* AI / ADAPTIVE SECTION */}

        <DebugAISection
          analysis={mistakeAnalysis}
          question={question}
          showAdaptiveChallenge={
            showAdaptiveChallenge
          }
          setShowAdaptiveChallenge={
            setShowAdaptiveChallenge
          }
        />

      </div>
    </main>
  );
}

export default DebugAssessment;