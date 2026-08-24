import { useCallback, useEffect, useMemo, useState } from "react";

import MistakeAnalysis from "../components/MistakeAnalysis";
import AdaptiveChallenge from "../components/AdaptiveChallenge";
import AssessmentQuestionNavigator from "../components/AssessmentQuestionNavigator";
import { detectWeakness } from "../services/weaknessDetector";

function ImplementAssessment({
  concept,
  student,
  onComplete,
  onBack,
}) {
  const API_URL = import.meta.env.VITE_API_URL;

  const implementQuestions = concept?.implementQuestions || [];

  // ============================================================
  // CONSTANTS
  // ============================================================

  const MASTERY_THRESHOLD = 0.8;

  const DEFAULT_MASTERY = 0.5;
  const MASTERY_MIN = 0;
  const MASTERY_MAX = 1;

  const MASTERY_INCREMENT = 0.15;
  const MASTERY_DECREMENT = 0.20;
  const MASTERY_SYNTAX_DECREMENT = 0.15;

  // ============================================================
  // STATE
  // ============================================================

  const [questionIndex, setQuestionIndex] = useState(0);

  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");

  const [result, setResult] = useState(null);

  const [loadingProgress, setLoadingProgress] = useState(true);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const [completedIds, setCompletedIds] = useState(new Set());

  const [questionScores, setQuestionScores] = useState({});
  const [questionAttempts, setQuestionAttempts] = useState({});

  const [showHint, setShowHint] = useState(false);

  const [mistakeAnalysis, setMistakeAnalysis] = useState(null);

  const [showAdaptiveChallenge, setShowAdaptiveChallenge] =
    useState(false);

  // ============================================================
  // EVIDENCE-DRIVEN MASTERY PROFILE
  // ============================================================

  const [mastery, setMastery] = useState({});

  const [currentWeakness, setCurrentWeakness] = useState(null);

  // ============================================================
  // RETEST STATE
  // ============================================================

  const [retestMode, setRetestMode] = useState(false);

  const [retestQuestionId, setRetestQuestionId] = useState(null);

  const [retestCompleted, setRetestCompleted] = useState(false);

  // ============================================================
  // CURRENT QUESTION
  // ============================================================

  const question = implementQuestions[questionIndex];

  const currentCode =
    code || question?.starterCode || "";

  // ============================================================
  // KNOWLEDGE FINGERPRINT
  // ============================================================

  const knowledgeFingerprint = useMemo(
    () => ({
      recall: 0,
      explain: 0,
      predict: 0,
      implement: 1,
      debug: 0,
      apply: 0,
    }),
    []
  );

  // ============================================================
  // NORMALIZE OUTPUT
  // ============================================================

  const normalizeOutput = useCallback((value) => {
    return String(value ?? "")
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .trim();
  }, []);

  // ============================================================
  // NORMALIZE WEAKNESS
  // ============================================================

  const normalizeWeakness = useCallback((weakness) => {
    if (!weakness) {
      return "general_implementation";
    }

    if (typeof weakness === "object") {
      weakness =
        weakness.type ||
        weakness.weakness ||
        weakness.id ||
        weakness.skill ||
        weakness.dimension ||
        weakness.weakness_type ||
        "";
    }

    const value = String(weakness)
      .toLowerCase()
      .trim();

    if (
      value.includes("countdown") ||
      value.includes("counting backwards") ||
      value.includes("negative step")
    ) {
      return "countdown_range";
    }

    if (
      value.includes("even_number_range") ||
      value.includes("even number") ||
      value.includes("even-number")
    ) {
      return "even_number_range";
    }

    if (
      value.includes("accumulator") ||
      value.includes("running total") ||
      value.includes("accumulation") ||
      value.includes("sum")
    ) {
      return "loop_accumulation";
    }

    if (
      value.includes("python_syntax") ||
      value.includes("syntax error") ||
      value.includes("missing colon") ||
      value.includes("indentation")
    ) {
      return "python_syntax";
    }

    if (
      value.includes("calculation_logic") ||
      value.includes("calculation error") ||
      value.includes("incorrect calculation") ||
      value.includes("square calculation") ||
      value.includes("calculation")
    ) {
      return "calculation_logic";
    }

    if (
      value.includes("range_exclusive_upper_bound") ||
      value.includes("range boundary") ||
      value.includes("upper bound") ||
      value.includes("stop value")
    ) {
      return "range_exclusive_upper_bound";
    }

    if (
      value.includes("loop_output") ||
      value.includes("output error") ||
      value.includes("printing")
    ) {
      return "loop_output";
    }

    return "general_implementation";
  }, []);

  // ============================================================
  // WEAKNESS METADATA
  // ============================================================

  const getWeaknessMetadata = useCallback((weakness) => {
    const normalized = String(weakness || "")
      .toLowerCase()
      .trim();

    const metadata = {
      range_exclusive_upper_bound: {
        title: "Range upper-bound logic",
        description:
          "The student needs more practice understanding that Python range() excludes its stop value.",
      },

      even_number_range: {
        title: "Even-number ranges",
        description:
          "The student needs more practice generating even numbers using the correct range step or condition.",
      },

      loop_accumulation: {
        title: "Loop accumulation",
        description:
          "The student needs more practice updating an accumulator without replacing the value from previous iterations.",
      },

      countdown_range: {
        title: "Countdown ranges",
        description:
          "The student needs more practice using the correct starting value, stopping value, and negative step for countdown loops.",
      },

      calculation_logic: {
        title: "Calculation logic",
        description:
          "The student needs more practice translating a mathematical operation into correct Python code.",
      },

      python_syntax: {
        title: "Python syntax",
        description:
          "The student needs more practice writing valid Python syntax, including indentation, colons, brackets, and quotes.",
      },

      loop_output: {
        title: "Loop output",
        description:
          "The student needs more practice producing the required output from a loop.",
      },

      general_implementation: {
        title: "Implementation",
        description:
          "The student needs more practice translating the problem requirements into working code.",
      },
    };

    return (
      metadata[normalized] ||
      metadata.general_implementation
    );
  }, []);

  // ============================================================
  // QUESTION WEAKNESS FALLBACK
  // ============================================================

  const getQuestionWeakness = useCallback(
    (item) => {
      if (!item) {
        return "general_implementation";
      }

      return normalizeWeakness(
        item.weakness ||
          item.skill ||
          item.targetSkill ||
          item.misconception ||
          item.dimension ||
          item.weakness_type ||
          ""
      );
    },
    [normalizeWeakness]
  );

  // ============================================================
  // LEGACY QUESTION FALLBACK
  // ============================================================

  const getLegacyQuestionWeakness = useCallback(
    (questionId) => {
      switch (questionId) {
        case "implement-1":
          return "range_exclusive_upper_bound";

        case "implement-2":
          return "even_number_range";

        case "implement-3":
          return "loop_accumulation";

        case "implement-4":
          return "countdown_range";

        case "implement-5":
          return "loop_accumulation";

        case "implement-6":
          return "calculation_logic";

        default:
          return "general_implementation";
      }
    },
    []
  );

  // ============================================================
  // GET ADAPTIVE WEAKNESS
  //
  // Evidence hierarchy:
  //
  // 1. Explicit syntax evidence
  // 2. AI weakness
  // 3. Question metadata
  // 4. Legacy mapping
  // 5. General implementation
  // ============================================================

  const getAdaptiveWeakness = useCallback(
    ({
      mistakeType,
      questionId,
      aiWeakness,
    }) => {
      if (
        mistakeType === "python_syntax" ||
        mistakeType === "syntax_error"
      ) {
        return "python_syntax";
      }

      const aiDetected =
        normalizeWeakness(aiWeakness);

      if (
        aiDetected !== "general_implementation"
      ) {
        return aiDetected;
      }

      const questionItem =
        implementQuestions.find(
          (item) => item.id === questionId
        );

      const questionDetected =
        getQuestionWeakness(questionItem);

      if (
        questionDetected !==
        "general_implementation"
      ) {
        return questionDetected;
      }

      return getLegacyQuestionWeakness(questionId);
    },
    [
      implementQuestions,
      normalizeWeakness,
      getQuestionWeakness,
      getLegacyQuestionWeakness,
    ]
  );

  // ============================================================
  // MASTERY HELPERS
  // ============================================================

  const clampMastery = useCallback((value) => {
    const numericValue = Number(value);

    return Math.max(
      MASTERY_MIN,
      Math.min(
        MASTERY_MAX,
        Number.isFinite(numericValue)
          ? numericValue
          : 0
      )
    );
  }, []);

  const getMastery = useCallback(
    (weakness) => {
      const normalized =
        normalizeWeakness(weakness);

      const entry = mastery?.[normalized];

      if (typeof entry === "object") {
        return clampMastery(
          entry?.mastery ?? DEFAULT_MASTERY
        );
      }

      if (entry !== undefined) {
        return clampMastery(entry);
      }

      return DEFAULT_MASTERY;
    },
    [mastery, normalizeWeakness, clampMastery]
  );

  // ============================================================
  // OVERALL IMPLEMENT MASTERY
  // ============================================================

  const getQuestionMastery = useCallback(
    (item) => {
      if (!item) {
        return DEFAULT_MASTERY;
      }

      const weakness =
        getQuestionWeakness(item);

      return getMastery(weakness);
    },
    [getQuestionWeakness, getMastery]
  );

  const overallMastery = useMemo(() => {
    if (implementQuestions.length === 0) {
      return 0;
    }

    const values = implementQuestions.map(
      (item) => getQuestionMastery(item)
    );

    return (
      values.reduce(
        (total, value) => total + value,
        0
      ) / values.length
    );
  }, [
    implementQuestions,
    getQuestionMastery,
    mastery,
  ]);

  const overallMasteryPercent = Math.round(
    overallMastery * 100
  );

  // ============================================================
  // UPDATE MASTERY
  // ============================================================

  const updateMastery = useCallback(
    ({
      weakness,
      success,
      score,
      mistakeType,
    }) => {
      const normalizedWeakness =
        normalizeWeakness(weakness);

      if (
        normalizedWeakness ===
        "general_implementation"
      ) {
        return;
      }

      setMastery((previous) => {
        const oldEntry =
          previous?.[normalizedWeakness];

        const oldMastery = Number(
          oldEntry?.mastery ??
            oldEntry ??
            DEFAULT_MASTERY
        );

        let delta = 0;

        if (success) {
          delta =
            MASTERY_INCREMENT *
            (Number(score ?? 100) / 100);
        } else if (
          mistakeType === "python_syntax"
        ) {
          delta = -MASTERY_SYNTAX_DECREMENT;
        } else {
          delta = -MASTERY_DECREMENT;
        }

        const newMastery = clampMastery(
          oldMastery + delta
        );

        return {
          ...previous,

          [normalizedWeakness]: {
            mastery: newMastery,

            attempts:
              Number(oldEntry?.attempts || 0) + 1,

            correct:
              Number(oldEntry?.correct || 0) +
              (success ? 1 : 0),

            incorrect:
              Number(oldEntry?.incorrect || 0) +
              (success ? 0 : 1),

            lastScore: Number(score || 0),

            lastMistake:
              mistakeType || "none",

            updatedAt:
              new Date().toISOString(),
          },
        };
      });
    },
    [clampMastery, normalizeWeakness]
  );

  // ============================================================
  // MASTERY COMPLETION CHECK
  // ============================================================

  const isQuestionMastered = useCallback(
    (item) => {
      if (!item) {
        return false;
      }

      const weakness =
        getQuestionWeakness(item);

      return (
        getMastery(weakness) >=
        MASTERY_THRESHOLD
      );
    },
    [getQuestionWeakness, getMastery]
  );

  const areAllQuestionsMastered = useCallback(
    () => {
      if (implementQuestions.length === 0) {
        return false;
      }

      return implementQuestions.every(
        (item) => isQuestionMastered(item)
      );
    },
    [implementQuestions, isQuestionMastered]
  );

  // ============================================================
  // LOAD PROGRESS + MASTERY
  // ============================================================

  useEffect(() => {
    if (!student?.id || !concept?.id) {
      setLoadingProgress(false);
      return;
    }

    if (implementQuestions.length === 0) {
      setLoadingProgress(false);
      return;
    }

    let cancelled = false;

    const loadProgress = async () => {
      try {
        setLoadingProgress(true);

        const response = await fetch(
          `${API_URL}/progress/${student.id}/${concept.id}/implement`
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load implementation progress"
          );
        }

        const data = await response.json();

        if (cancelled) {
          return;
        }

        // ------------------------------------------------------
        // COMPLETED QUESTIONS
        // ------------------------------------------------------

        const loadedCompletedIds =
          new Set(
            data.completed_question_ids || []
          );

        setCompletedIds(
          loadedCompletedIds
        );

        // ------------------------------------------------------
        // QUESTION SCORES
        // ------------------------------------------------------

        setQuestionScores(
          data.question_scores || {}
        );

        // ------------------------------------------------------
        // QUESTION ATTEMPTS
        // ------------------------------------------------------

        const loadedAttempts = {};

        Object.entries(
          data.question_attempts || {}
        ).forEach(
          ([questionId, value]) => {
            loadedAttempts[questionId] =
              Number(
                value?.attempts ??
                  value ??
                  0
              );
          }
        );

        setQuestionAttempts(
          loadedAttempts
        );

        // ------------------------------------------------------
        // MASTERY
        // ------------------------------------------------------

        const loadedMastery =
          data.mastery ||
          data.mastery_profile ||
          {};

        setMastery(loadedMastery);

        // ------------------------------------------------------
        // FIND FIRST NON-MASTERED QUESTION
        // ------------------------------------------------------

        const nextIndex =
          implementQuestions.findIndex(
            (item) =>
              !isQuestionMasteredFromData(
                item,
                loadedMastery
              )
          );

        if (nextIndex !== -1) {
          setQuestionIndex(nextIndex);

          setCode(
            implementQuestions[nextIndex]
              .starterCode || ""
          );

          return;
        }

        // ------------------------------------------------------
        // FALLBACK: FIND INCOMPLETE QUESTION
        // ------------------------------------------------------

        const incompleteIndex =
          implementQuestions.findIndex(
            (item) =>
              !loadedCompletedIds.has(item.id)
          );

        if (incompleteIndex !== -1) {
          setQuestionIndex(
            incompleteIndex
          );

          setCode(
            implementQuestions[
              incompleteIndex
            ].starterCode || ""
          );

          return;
        }

        // ------------------------------------------------------
        // EVERYTHING MASTERED
        // ------------------------------------------------------

        onComplete();
      } catch (error) {
        console.error(
          "Could not load implementation progress:",
          error
        );

        if (implementQuestions[0]) {
          setQuestionIndex(0);

          setCode(
            implementQuestions[0]
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
    implementQuestions,
    onComplete,
  ]);

  // ============================================================
  // HELPER FOR LOADED MASTERY
  // ============================================================

  function isQuestionMasteredFromData(
    item,
    loadedMastery
  ) {
    if (!item) {
      return false;
    }

    const weakness =
      getQuestionWeakness(item);

    const entry =
      loadedMastery?.[weakness];

    const value =
      typeof entry === "object"
        ? entry?.mastery
        : entry;

    const masteryValue = Number(
      value ?? DEFAULT_MASTERY
    );

    return (
      Number.isFinite(masteryValue) &&
      masteryValue >= MASTERY_THRESHOLD
    );
  }

  // ============================================================
  // QUESTION ERROR MESSAGE
  // ============================================================

  const getImplementationErrorMessage =
    useCallback(() => {
      switch (question?.id) {
        case "implement-1":
          return (
            "The program should print the numbers from 1 to 5. " +
            "Check the range and make sure each number is printed."
          );

        case "implement-2":
          return (
            "The program should print only the even numbers " +
            "from 2 to 10. Check your range, step value, or condition."
          );

        case "implement-3":
          return (
            "The sum is incorrect. Make sure total starts at 0 " +
            "and each number is added to the existing total."
          );

        case "implement-4":
          return (
            "The countdown is incorrect. Check the starting value, " +
            "stopping value, and negative step in range()."
          );

        case "implement-5":
          return (
            "The total price is incorrect. Make sure every price " +
            "is added to the existing total instead of replacing it."
          );

        case "implement-6":
          return (
            "The square values are incorrect. Remember that a square " +
            "is calculated by multiplying a number by itself."
          );

        default:
          return (
            "Your program ran, but the output does not " +
            "match the expected result."
          );
      }
    }, [question]);

  // ============================================================
  // RECORD EXECUTION
  // ============================================================

  const recordExecution = useCallback(
    async ({
      success,
      score,
      mistake,
      executedCode,
      actualOutput,
      weakness,
    }) => {
      if (
        !student?.id ||
        !concept?.id ||
        !question?.id
      ) {
        return;
      }

      try {
        await fetch(
          `${API_URL}/execution-attempts`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              student_id: String(
                student.id
              ),

              concept: concept.id,

              dimension: "implement",

              question_id: question.id,

              code: executedCode,

              output: actualOutput,

              expected_output:
                question.expectedOutput ||
                "",

              success,

              score,

              mistake,

              mistake_type: mistake,

              weakness:
                weakness ||
                "general_implementation",

              weakness_type:
                weakness ||
                "general_implementation",

              weakness_title:
                getWeaknessMetadata(
                  weakness
                ).title,

              weakness_description:
                getWeaknessMetadata(
                  weakness
                ).description,

              knowledge_fingerprint:
                knowledgeFingerprint,
            }),
          }
        );
      } catch (error) {
        console.error(
          "Could not record code execution:",
          error
        );
      }
    },
    [
      API_URL,
      student?.id,
      concept?.id,
      question,
      getWeaknessMetadata,
      knowledgeFingerprint,
    ]
  );

  // ============================================================
  // ANALYZE MISTAKE
  // ============================================================

  const analyzeImplementationMistake =
    useCallback(
      async ({
        mistakeType,
        errorMessage,
        score = 40,
      }) => {
        if (!question) {
          return "general_implementation";
        }

        const fallbackWeakness =
          detectWeakness({
            code: currentCode,
            question:
              question.description,
            questionId: question.id,
            mistakeType,
          });

        try {
          setAiLoading(true);

          const analysisResponse =
            await fetch(
              `${API_URL}/analyze-mistake`,
              {
                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body: JSON.stringify({
                  student_id: String(
                    student.id
                  ),

                  concept: concept.id,

                  dimension: "implement",

                  question_id: question.id,

                  score,

                  question:
                    question.description,

                  student_answer:
                    currentCode,

                  correct_answer:
                    question.correctCode,

                  mistake: mistakeType,

                  mistake_type: mistakeType,

                  recommendation:
                    "Analyze the student's implementation evidence and identify the specific programming misconception or weakness. Do not infer weakness only from the question ID.",
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

          const weakness =
            getAdaptiveWeakness({
              mistakeType,
              questionId: question.id,
              aiWeakness:
                aiAnalysis.weakness ||
                aiAnalysis.skill ||
                aiAnalysis.misconception ||
                aiAnalysis.weakness_type,
            });

          const weaknessMetadata =
            getWeaknessMetadata(
              weakness
            );

          setCurrentWeakness(
            weakness
          );

          setMistakeAnalysis({
            mistake_type:
              aiAnalysis.mistake_type ||
              mistakeType ||
              "Implementation error",

            explanation:
              aiAnalysis.explanation ||
              errorMessage,

            misconception:
              aiAnalysis.misconception ||
              weaknessMetadata.description,

            hint:
              aiAnalysis.hint ||
              question.hint ||
              "Review the loop and try again.",

            recommended_action:
              aiAnalysis.recommended_action ||
              "Review the implementation and try again.",

            weakness,

            weakness_type: weakness,

            weakness_title:
              aiAnalysis.weakness_title ||
              weaknessMetadata.title,

            weakness_description:
              aiAnalysis.weakness_description ||
              weaknessMetadata.description,
          });

          return weakness;
        } catch (error) {
          console.error(
            "Implementation analysis failed:",
            error
          );

          const weakness =
            getAdaptiveWeakness({
              mistakeType,
              questionId: question.id,
              aiWeakness:
                fallbackWeakness,
            });

          const weaknessMetadata =
            getWeaknessMetadata(
              weakness
            );

          setCurrentWeakness(
            weakness
          );

          setMistakeAnalysis({
            mistake_type:
              mistakeType ===
              "python_syntax"
                ? "Python syntax error"
                : "Implementation error",

            explanation: errorMessage,

            misconception:
              mistakeType ===
              "python_syntax"
                ? "There is a Python syntax or execution problem in the submitted code."
                : weaknessMetadata.description,

            hint:
              question.hint ||
              "Check your loop, range, syntax, and output logic.",

            recommended_action:
              "Review the code and try the implementation again.",

            weakness,

            weakness_type: weakness,

            weakness_title:
              weaknessMetadata.title,

            weakness_description:
              weaknessMetadata.description,
          });

          return weakness;
        } finally {
          setAiLoading(false);
        }
      },
      [
        API_URL,
        student?.id,
        concept?.id,
        question,
        currentCode,
        getAdaptiveWeakness,
        getWeaknessMetadata,
      ]
    );

  // ============================================================
  // RUN CODE
  // ============================================================

  const runCode = useCallback(
    async () => {
      if (!question) {
        return;
      }

      setResult(null);
      setMistakeAnalysis(null);
      setOutput("");
      setCurrentWeakness(null);

      if (!currentCode.trim()) {
        setOutput("No code to run.");

        setResult({
          success: false,
          score: 0,
          mistakeType: "no_code",
          message:
            "Please write a Python solution before running the code.",
        });

        return;
      }

      setAiLoading(true);

      try {
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

        // ======================================================
        // EXECUTION ERROR
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
              : "Your program could not run. Check the error shown in the output and fix your code.";

          const score = 0;

          setResult({
            success: false,
            score,
            mistakeType,
            message: errorMessage,
          });

          const weakness =
            getAdaptiveWeakness({
              mistakeType,
              questionId: question.id,
              aiWeakness:
                isSyntaxError
                  ? "python_syntax"
                  : null,
            });

          updateMastery({
            weakness,
            success: false,
            score,
            mistakeType,
          });

          await recordExecution({
            success: false,
            score,
            mistake: mistakeType,
            executedCode: currentCode,
            actualOutput: errorText,
            weakness,
          });

          await analyzeImplementationMistake({
            mistakeType,
            errorMessage,
            score,
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

        setOutput(data.output || "");

        // ======================================================
        // CORRECT
        // ======================================================

        if (
          actualOutput === expectedOutput
        ) {
          const successWeakness =
            getAdaptiveWeakness({
              mistakeType:
                "implementation_success",

              questionId: question.id,

              aiWeakness:
                currentWeakness ||
                question.weakness ||
                question.skill,
            });

          setCurrentWeakness(
            successWeakness
          );

          updateMastery({
            weakness: successWeakness,
            success: true,
            score: 100,
            mistakeType:
              "implementation_success",
          });

          setResult({
            success: true,
            score: 100,
            mistakeType:
              "implementation_success",

            message:
              "Excellent! Your implementation produced the expected output.",
          });

          await recordExecution({
            success: true,
            score: 100,
            mistake: "none",
            executedCode: currentCode,
            actualOutput,
            weakness:
              successWeakness,
          });

          return;
        }

        // ======================================================
        // WRONG OUTPUT
        // ======================================================

        const errorMessage =
          getImplementationErrorMessage();

        const mistakeType =
          "implementation_error";

        const score = 40;

        setResult({
          success: false,
          score,
          mistakeType,
          message: errorMessage,
        });

        const weakness =
          getAdaptiveWeakness({
            mistakeType,
            questionId: question.id,

            aiWeakness:
              question.weakness ||
              question.skill,
          });

        updateMastery({
          weakness,
          success: false,
          score,
          mistakeType,
        });

        await recordExecution({
          success: false,
          score,
          mistake: mistakeType,
          executedCode: currentCode,
          actualOutput,
          weakness,
        });

        await analyzeImplementationMistake({
          mistakeType,
          errorMessage,
          score,
        });
      } catch (error) {
        console.error(
          "Run implementation code error:",
          error
        );

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
      } finally {
        setAiLoading(false);
      }
    },
    [
      API_URL,
      question,
      currentCode,
      currentWeakness,
      normalizeOutput,
      getAdaptiveWeakness,
      updateMastery,
      recordExecution,
      analyzeImplementationMistake,
      getImplementationErrorMessage,
    ]
  );

  // ============================================================
  // QUESTION SELECTION
  // ============================================================

  const handleQuestionSelect =
    useCallback(
      (index) => {
        const selectedQuestion =
          implementQuestions[index];

        if (!selectedQuestion) {
          return;
        }

        setQuestionIndex(index);

        setCode(
          selectedQuestion.starterCode ||
            ""
        );

        setOutput("");
        setResult(null);
        setMistakeAnalysis(null);
        setShowAdaptiveChallenge(false);
        setShowHint(false);
        setCurrentWeakness(null);

        setRetestMode(false);
        setRetestQuestionId(null);
        setRetestCompleted(false);
      },
      [implementQuestions]
    );

  // ============================================================
  // TARGET DIFFICULTY
  // ============================================================

  const getTargetDifficulty =
    useCallback((masteryValue) => {
      const value = Number(
        masteryValue
      );

      if (value < 0.35) {
        return "basic";
      }

      if (value < 0.65) {
        return "medium";
      }

      return "advanced";
    }, []);

  // ============================================================
  // DIFFICULTY RANK
  // ============================================================

  const difficultyRank = useMemo(
    () => ({
      basic: 1,
      easy: 1,

      medium: 2,
      intermediate: 2,

      hard: 3,
      advanced: 3,
    }),
    []
  );

  // ============================================================
  // ADAPTIVE QUESTION SELECTION
  //
  // Priority:
  //
  // 1. Targeted weakness
  // 2. Lowest mastery
  // 3. Appropriate difficulty
  // 4. Not already mastered
  // ============================================================

  const selectAdaptiveQuestion =
    useCallback(
      ({
        excludedIds = new Set(),
        preferredWeakness = null,
        allowMastered = false,
      } = {}) => {
        const remaining =
          implementQuestions
            .map((item, index) => ({
              item,
              index,
            }))
            .filter(
              ({ item }) => {
                if (
                  excludedIds.has(
                    item.id
                  )
                ) {
                  return false;
                }

                if (!allowMastered) {
                  return !isQuestionMastered(
                    item
                  );
                }

                return true;
              }
            );

        if (remaining.length === 0) {
          return null;
        }

        const targetWeakness =
          normalizeWeakness(
            preferredWeakness
          );

        const scored =
          remaining.map(
            ({ item, index }) => {
              const itemWeakness =
                getQuestionWeakness(item);

              const itemMastery =
                getMastery(
                  itemWeakness
                );

              const targetDifficulty =
                getTargetDifficulty(
                  itemMastery
                );

              const itemDifficulty =
                String(
                  item.difficulty ||
                    "medium"
                ).toLowerCase();

              const targetRank =
                difficultyRank[
                  targetDifficulty
                ] || 2;

              const itemRank =
                difficultyRank[
                  itemDifficulty
                ] || 2;

              const weaknessScore =
                targetWeakness !==
                  "general_implementation" &&
                itemWeakness ===
                  targetWeakness
                  ? 0
                  : 1;

              const masteryScore =
                itemMastery;

              const difficultyDistance =
                Math.abs(
                  itemRank -
                    targetRank
                );

              return {
                item,
                index,
                weaknessScore,
                masteryScore,
                difficultyDistance,
              };
            }
          );

        scored.sort((a, b) => {
          if (
            a.weaknessScore !==
            b.weaknessScore
          ) {
            return (
              a.weaknessScore -
              b.weaknessScore
            );
          }

          if (
            a.masteryScore !==
            b.masteryScore
          ) {
            return (
              a.masteryScore -
              b.masteryScore
            );
          }

          if (
            a.difficultyDistance !==
            b.difficultyDistance
          ) {
            return (
              a.difficultyDistance -
              b.difficultyDistance
            );
          }

          return 0;
        });

        return scored[0] || null;
      },
      [
        implementQuestions,
        normalizeWeakness,
        getQuestionWeakness,
        getMastery,
        getTargetDifficulty,
        difficultyRank,
        isQuestionMastered,
      ]
    );

  // ============================================================
  // SAVE ASSESSMENT ATTEMPT
  // ============================================================

  const saveAssessmentAttempt =
    useCallback(
      async ({
        questionToSave,
        score,
        studentAnswer,
        mistake = "none",
        mistakeType = "none",
        weakness,
        retest = false,
      }) => {
        const selectedQuestion =
          questionToSave || question;

        if (
          !selectedQuestion ||
          !student?.id ||
          !concept?.id
        ) {
          return null;
        }

        const weaknessValue =
          normalizeWeakness(
            weakness
          );

        const weaknessMetadata =
          getWeaknessMetadata(
            weaknessValue
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
              student_id: String(
                student.id
              ),

              concept: concept.id,

              dimension: "implement",

              question_id:
                selectedQuestion.id,

              score,

              question:
                selectedQuestion.description,

              student_answer:
                studentAnswer,

              correct_answer:
                selectedQuestion.expectedOutput ||
                selectedQuestion.correctCode ||
                "",

              mistake,

              mistake_type: mistakeType,

              recommendation:
                score >= 80
                  ? "Implementation successfully demonstrated."
                  : "Practice the identified implementation weakness and retry the targeted question.",

              weakness:
                weaknessValue,

              weakness_type:
                weaknessValue,

              weakness_title:
                weaknessMetadata.title,

              weakness_description:
                weaknessMetadata.description,

              knowledge_fingerprint:
                knowledgeFingerprint,

              retest_mode: retest,

              is_retest: retest,
            }),
          }
        );

        if (!response.ok) {
          const errorText =
            await response.text();

          console.error(
            "Failed to save implementation:",
            response.status,
            errorText
          );

          throw new Error(
            "Failed to save implementation attempt."
          );
        }

        return await response.json();
      },
      [
        API_URL,
        question,
        student?.id,
        concept?.id,
        normalizeWeakness,
        getWeaknessMetadata,
        knowledgeFingerprint,
      ]
    );

  // ============================================================
  // MARK QUESTION AS COMPLETED
  // ============================================================

  const markQuestionCompleted =
    useCallback(
      (questionId, score) => {
        setCompletedIds(
          (previous) => {
            const next = new Set(
              previous
            );

            next.add(questionId);

            return next;
          }
        );

        setQuestionScores(
          (previous) => ({
            ...previous,
            [questionId]: score,
          })
        );

        setQuestionAttempts(
          (previous) => ({
            ...previous,
            [questionId]:
              Number(
                previous[
                  questionId
                ] || 0
              ) + 1,
          })
        );
      },
      []
    );

  // ============================================================
  // START TARGETED RETEST
  //
  // Incorrect implementation -> same weak question.
  // ============================================================

  const startTargetedRetest =
    useCallback(
      (weakness) => {
        const normalizedWeakness =
          normalizeWeakness(
            weakness
          );

        const weakQuestion =
          implementQuestions.find(
            (item) =>
              getQuestionWeakness(
                item
              ) ===
              normalizedWeakness
          );

        const fallbackQuestion =
          weakQuestion ||
          question;

        if (!fallbackQuestion) {
          return;
        }

        const index =
          implementQuestions.findIndex(
            (item) =>
              item.id ===
              fallbackQuestion.id
          );

        if (index === -1) {
          return;
        }

        setQuestionIndex(index);

        setCode(
          fallbackQuestion.starterCode ||
            ""
        );

        setOutput("");
        setResult(null);
        setMistakeAnalysis(null);

        setCurrentWeakness(
          normalizedWeakness
        );

        setShowHint(false);
        setShowAdaptiveChallenge(false);

        setRetestMode(true);
        setRetestQuestionId(
          fallbackQuestion.id
        );
        setRetestCompleted(false);
      },
      [
        normalizeWeakness,
        implementQuestions,
        getQuestionWeakness,
        question,
      ]
    );

  // ============================================================
  // SUBMIT
  // ============================================================

  const submitCode = useCallback(
    async () => {
      if (!question) {
        return;
      }

      if (!result) {
        setResult({
          success: false,
          score: 0,
          mistakeType: "no_attempt",
          message:
            "Run your code first and make sure the implementation is correct.",
        });

        return;
      }

      if (!result.success) {
        const selectedWeakness =
          normalizeWeakness(
            currentWeakness ||
              mistakeAnalysis?.weakness ||
              question.weakness ||
              question.skill ||
              getLegacyQuestionWeakness(
                question.id
              )
          );

        startTargetedRetest(
          selectedWeakness
        );

        return;
      }

      setLoading(true);

      try {
        const selectedWeakness =
          normalizeWeakness(
            currentWeakness ||
              mistakeAnalysis?.weakness ||
              question.weakness ||
              question.skill ||
              getLegacyQuestionWeakness(
                question.id
              )
          );

        // ======================================================
        // SAVE ASSESSMENT ATTEMPT
        // ======================================================

        await saveAssessmentAttempt({
          questionToSave: question,
          score: result.score,
          studentAnswer: currentCode,
          mistake: "none",
          mistakeType:
            "implementation_success",
          weakness:
            selectedWeakness,
          retest: retestMode,
        });

        // ======================================================
        // UPDATE QUESTION EVIDENCE
        // ======================================================

        markQuestionCompleted(
          question.id,
          result.score
        );

        // ======================================================
        // RETEST SUCCESS
        // ======================================================

        if (
          retestMode &&
          retestQuestionId ===
            question.id
        ) {
          setRetestCompleted(true);
          setRetestMode(false);
          setRetestQuestionId(null);

          // The mastery update is already
          // performed by runCode().
          //
          // Give React's state update time
          // before deciding whether the stage
          // is complete.
        }

        // ======================================================
        // DETERMINE UPDATED MASTERY
        // ======================================================

        const currentQuestionWeakness =
          selectedWeakness;

        const existingEntry =
          mastery?.[
            currentQuestionWeakness
          ];

        const oldMastery =
          Number(
            existingEntry?.mastery ??
              existingEntry ??
              DEFAULT_MASTERY
          );

        const masteryGain =
          MASTERY_INCREMENT *
          (Number(result.score || 0) /
            100);

        const projectedMastery =
          clampMastery(
            oldMastery +
              masteryGain
          );

        const projectedMasteryMap = {
          ...mastery,

          [currentQuestionWeakness]: {
            ...(typeof existingEntry ===
            "object"
              ? existingEntry
              : {}),

            mastery:
              projectedMastery,
          },
        };

        // ======================================================
        // FIND TARGETED WEAK QUESTION FIRST
        // ======================================================

        const targetedRetest =
          retestMode &&
          retestQuestionId ===
            question.id;

        if (
          targetedRetest &&
          projectedMastery >=
            MASTERY_THRESHOLD
        ) {
          // Targeted weakness has now
          // reached mastery.
        }

        // ======================================================
        // FIND NEXT NON-MASTERED QUESTION
        // ======================================================

        const nextQuestion =
          selectAdaptiveQuestion({
            excludedIds:
              new Set([
                ...completedIds,
                question.id,
              ]),

            preferredWeakness:
              currentQuestionWeakness,

            allowMastered: false,
          });

        if (nextQuestion) {
          setQuestionIndex(
            nextQuestion.index
          );

          setCode(
            nextQuestion.item
              .starterCode || ""
          );

          setOutput("");
          setResult(null);
          setMistakeAnalysis(null);
          setShowAdaptiveChallenge(false);
          setShowHint(false);
          setCurrentWeakness(null);

          setRetestMode(false);
          setRetestQuestionId(null);
          setRetestCompleted(false);

          return;
        }

        // ======================================================
        // CHECK ALL QUESTIONS AGAINST
        // CURRENT + PROJECTED MASTERY
        // ======================================================

        const allMastered =
          implementQuestions.every(
            (item) => {
              const weakness =
                getQuestionWeakness(
                  item
                );

              const entry =
                projectedMasteryMap[
                  weakness
                ];

              const value =
                typeof entry ===
                "object"
                  ? entry?.mastery
                  : entry;

              return (
                Number(
                  value ??
                    DEFAULT_MASTERY
                ) >=
                MASTERY_THRESHOLD
              );
            }
          );

        if (allMastered) {
          console.log(
            "ALL IMPLEMENTATION QUESTIONS MASTERED"
          );

          onComplete();

          return;
        }

        // ======================================================
        // IF A QUESTION WAS COMPLETED BUT IS
        // STILL BELOW MASTERY, RETEST IT.
        // ======================================================

        const lowestMasteryQuestion =
          implementQuestions
            .map(
              (item, index) => ({
                item,
                index,

                mastery:
                  item.id ===
                  question.id
                    ? projectedMastery
                    : getQuestionMastery(
                        item
                      ),
              })
            )
            .filter(
              ({ mastery }) =>
                mastery <
                MASTERY_THRESHOLD
            )
            .sort(
              (a, b) =>
                a.mastery -
                b.mastery
            )[0];

        if (
          lowestMasteryQuestion
        ) {
          setQuestionIndex(
            lowestMasteryQuestion.index
          );

          setCode(
            lowestMasteryQuestion.item
              .starterCode || ""
          );

          setOutput("");
          setResult(null);
          setMistakeAnalysis(null);
          setShowAdaptiveChallenge(false);
          setShowHint(false);

          setCurrentWeakness(
            getQuestionWeakness(
              lowestMasteryQuestion.item
            )
          );

          setRetestMode(true);

          setRetestQuestionId(
            lowestMasteryQuestion.item
              .id
          );

          setRetestCompleted(false);

          return;
        }

        // ======================================================
        // FINAL FALLBACK
        // ======================================================

        onComplete();
      } catch (error) {
        console.error(
          "Submit implementation error:",
          error
        );

        setResult({
          success: false,
          score: 0,
          mistakeType:
            "backend_error",

          message:
            "Could not save the implementation attempt. Make sure the backend is running.",
        });
      } finally {
        setLoading(false);
      }
    },
    [
      question,
      result,
      normalizeWeakness,
      currentWeakness,
      mistakeAnalysis,
      getLegacyQuestionWeakness,
      startTargetedRetest,
      saveAssessmentAttempt,
      currentCode,
      retestMode,
      retestQuestionId,
      markQuestionCompleted,
      mastery,
      clampMastery,
      selectAdaptiveQuestion,
      completedIds,
      implementQuestions,
      getQuestionWeakness,
      getQuestionMastery,
      onComplete,
    ]
  );

  // ============================================================
  // RESET
  // ============================================================

  const resetQuestion =
    useCallback(() => {
      if (!question) {
        return;
      }

      setCode(
        question.starterCode || ""
      );

      setOutput("");
      setResult(null);
      setMistakeAnalysis(null);

      setShowAdaptiveChallenge(false);
      setShowHint(false);

      setCurrentWeakness(null);
    }, [question]);

  // ============================================================
  // CODE CHANGE
  // ============================================================

  const handleCodeChange =
    useCallback((event) => {
      setCode(event.target.value);

      setResult(null);
      setOutput("");
      setMistakeAnalysis(null);

      setShowAdaptiveChallenge(false);
      setCurrentWeakness(null);
    }, []);

  // ============================================================
  // CURRENT MASTERY DISPLAY
  // ============================================================

  const displayedWeakness =
    currentWeakness ||
    mistakeAnalysis?.weakness ||
    getQuestionWeakness(question);

  const displayedMastery =
    getMastery(displayedWeakness);

  const displayedMasteryPercent =
    Math.round(
      displayedMastery * 100
    );

  // ============================================================
  // LOADING
  // ============================================================

  if (loadingProgress) {
    return (
      <main className="implement-assessment">
        <p>
          Loading your progress...
        </p>
      </main>
    );
  }

  // ============================================================
  // STUDENT SAFETY
  // ============================================================

  if (!student?.id) {
    return (
      <main className="implement-assessment">
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

  // ============================================================
  // CONCEPT SAFETY
  // ============================================================

  if (implementQuestions.length === 0) {
    return (
      <main className="implement-assessment">
        <button
          type="button"
          className="back-button"
          onClick={onBack}
        >
          ← Back
        </button>

        <h1>
          Implementation questions
          not found
        </h1>

        <p>
          This concept does not have
          any Implement questions yet.
        </p>
      </main>
    );
  }

  // ============================================================
  // QUESTION SAFETY
  // ============================================================

  if (!question) {
    return (
      <main className="implement-assessment">
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
  // RENDER
  // ============================================================

  return (
    <main className="implement-assessment">
      {/* ======================================================
          BACK BUTTON
      ====================================================== */}

      <button
        type="button"
        className="back-button"
        onClick={onBack}
        disabled={loading}
      >
        ← Back to predict
      </button>

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="implement-header">
        <p className="section-label">
          STEP 5 • IMPLEMENT ASSESSMENT
        </p>

        <h1>
          Write the solution
        </h1>

        <p>
          Demonstrate that you can
          actually implement the
          concept yourself.
        </p>

        <div
          style={{
            marginTop: "12px",
            fontSize: "14px",
            color: "#64748b",
          }}
        >
          Overall implementation
          mastery:{" "}
          <strong>
            {overallMasteryPercent}%
          </strong>
          {" "}
          / mastery threshold{" "}
          <strong>80%</strong>
        </div>
      </div>

      {/* ======================================================
          NAVIGATOR
      ====================================================== */}

      <AssessmentQuestionNavigator
        questions={implementQuestions}
        currentIndex={questionIndex}
        completedIds={completedIds}
        questionScores={questionScores}
        onSelectQuestion={
          handleQuestionSelect
        }
      />

      {/* ======================================================
          MAIN CARD
      ====================================================== */}

      <div className="implement-card">
        {/* ====================================================
            QUESTION HEADER
        ==================================================== */}

        <div className="question-number">
          QUESTION{" "}
          {String(
            questionIndex + 1
          ).padStart(2, "0")}
          {" / "}
          {String(
            implementQuestions.length
          ).padStart(2, "0")}
        </div>

        <div className="implement-meta">
          {question.difficulty && (
            <span className="implement-difficulty">
              {question.difficulty}
            </span>
          )}

          {retestMode && (
            <span
              className="implement-difficulty"
              style={{
                background: "#fef3c7",
                color: "#92400e",
              }}
            >
              Targeted Retest
            </span>
          )}

          <span>
            {questionAttempts[
              question.id
            ] || 0}{" "}
            execution attempts
          </span>

          <span>
            Best score:{" "}
            {questionScores[
              question.id
            ] ?? 0}
            %
          </span>

          <span>
            Skill mastery:{" "}
            {displayedMasteryPercent}%
          </span>
        </div>

        {/* ====================================================
            MASTERY INDICATOR
        ==================================================== */}

        <div
          className="implement-mastery"
          style={{
            marginTop: "12px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              marginBottom: "6px",
            }}
          >
            <span>
              Current skill
            </span>

            <strong>
              {displayedWeakness}
            </strong>
          </div>

          <div
            style={{
              height: "8px",
              background: "#e5e7eb",
              borderRadius: "999px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${displayedMasteryPercent}%`,
                height: "100%",
                background:
                  displayedMasteryPercent <
                  35
                    ? "#ef4444"
                    : displayedMasteryPercent <
                      80
                    ? "#f59e0b"
                    : "#22c55e",

                transition:
                  "width 0.3s ease",
              }}
            />
          </div>

          <div
            style={{
              marginTop: "6px",
              fontSize: "12px",
              color: "#64748b",
            }}
          >
            {displayedMasteryPercent >=
            80
              ? "✓ Skill mastered"
              : `Needs ${Math.max(
                  0,
                  80 -
                    displayedMasteryPercent
                )}% more mastery`}
          </div>
        </div>

        {/* ====================================================
            RETEST MESSAGE
        ==================================================== */}

        {retestMode && (
          <div
            style={{
              padding: "12px 14px",
              marginBottom: "20px",
              borderRadius: "8px",
              background: "#eff6ff",
              border:
                "1px solid #bfdbfe",
              color: "#1e40af",
            }}
          >
            <strong>
              Targeted recovery
            </strong>

            <p
              style={{
                margin:
                  "4px 0 0",
              }}
            >
              This question is being
              retested because it is
              associated with a skill
              that has not yet reached
              80% mastery.
            </p>
          </div>
        )}

        {/* ====================================================
            QUESTION
        ==================================================== */}

        <div className="implementation-question">
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

        {/* ====================================================
            VARIABLES
        ==================================================== */}

        {question.variables?.length >
          0 && (
          <div className="implement-variables">
            <p className="question-label">
              VARIABLES
            </p>

            <div className="variables-list">
              {question.variables.map(
                (variable) => (
                  <div
                    className="variable-item"
                    key={
                      variable.name
                    }
                  >
                    <strong>
                      {variable.name}
                    </strong>

                    <span>
                      {
                        variable.purpose
                      }
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {/* ====================================================
            HINT
        ==================================================== */}

        {question.hint && (
          <div className="implement-hint-section">
            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                setShowHint(
                  (previous) =>
                    !previous
                )
              }
              disabled={aiLoading}
            >
              {showHint
                ? "Hide Hint"
                : "💡 Show Hint"}
            </button>

            {showHint && (
              <div className="implement-hint">
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

        {/* ====================================================
            CODE EDITOR
        ==================================================== */}

        <label
          htmlFor="implement-code-editor"
          className="code-label"
        >
          YOUR CODE
        </label>

        <textarea
          id="implement-code-editor"
          value={currentCode}
          onChange={
            handleCodeChange
          }
          spellCheck="false"
          className="implementation-editor"
          disabled={loading}
          aria-label="Python code editor"
        />

        {/* ====================================================
            ACTIONS
        ==================================================== */}

        <div className="implementation-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={runCode}
            disabled={
              loading ||
              aiLoading
            }
          >
            {aiLoading
              ? "Running..."
              : "▶ Run Code"}
          </button>

          <button
            type="button"
            className="primary-button"
            onClick={submitCode}
            disabled={
              loading ||
              !result?.success
            }
          >
            {loading
              ? "Saving..."
              : retestMode
              ? "Submit Retest →"
              : questionIndex <
                implementQuestions.length -
                  1
              ? "Submit & Continue →"
              : "Submit Solution →"}
          </button>
        </div>

        {/* ====================================================
            OUTPUT
        ==================================================== */}

        <div className="implementation-output">
          <p className="question-label">
            TERMINAL OUTPUT
          </p>

          <pre>
            {output ||
              "Run the code to inspect the result."}
          </pre>
        </div>

        {/* ====================================================
            RESULT
        ==================================================== */}

        {result && (
          <div
            className={
              result.success
                ? "implement-result success"
                : "implement-result error"
            }
          >
            {result.success && (
              <div className="implement-score">
                {result.score}%
              </div>
            )}

            <strong>
              {result.success
                ? "Implementation Successful"
                : "Implementation Needs Improvement"}
            </strong>

            <p>
              {result.message}
            </p>

            {!result.success && (
              <>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={
                    resetQuestion
                  }
                  disabled={loading}
                >
                  Reset Code
                </button>

                {currentWeakness && (
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() =>
                      startTargetedRetest(
                        currentWeakness
                      )
                    }
                    disabled={
                      loading ||
                      aiLoading
                    }
                    style={{
                      marginTop:
                        "10px",
                    }}
                  >
                    Practice This Weakness →
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* ====================================================
            AI LOADING
        ==================================================== */}

        {aiLoading && (
          <div className="ai-loading">
            🤖 Analyzing your
            implementation...
          </div>
        )}

        {/* ====================================================
            MISTAKE ANALYSIS
        ==================================================== */}

        {mistakeAnalysis && (
          <MistakeAnalysis
            analysis={
              mistakeAnalysis
            }
          />
        )}

        {/* ====================================================
            WEAKNESS PRACTICE
        ==================================================== */}

        {mistakeAnalysis &&
          !showAdaptiveChallenge && (
            <button
              type="button"
              className="primary-button"
              onClick={() =>
                setShowAdaptiveChallenge(
                  true
                )
              }
              style={{
                marginTop: "20px",
              }}
            >
              Practice My Weakness →
            </button>
          )}

        {/* ====================================================
            ADAPTIVE CHALLENGE
        ==================================================== */}

        {showAdaptiveChallenge &&
          mistakeAnalysis && (
            <AdaptiveChallenge
              weakness={
                mistakeAnalysis.weakness
              }
              question={question}
              onBack={() =>
                setShowAdaptiveChallenge(
                  false
                )
              }
              onComplete={(
                adaptiveResult
              ) => {
                console.log(
                  "Adaptive challenge completed:",
                  adaptiveResult
                );

                setShowAdaptiveChallenge(
                  false
                );
              }}
            />
          )}
      </div>
    </main>
  );
}

export default ImplementAssessment;