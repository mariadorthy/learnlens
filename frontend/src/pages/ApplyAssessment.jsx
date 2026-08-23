import { useEffect, useState } from "react";

import { concepts } from "../data/concepts";

import ApplyAISection from "../components/ApplyAISection";

import AssessmentQuestionNavigator from "../components/AssessmentQuestionNavigator";

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

  const [completedIds, setCompletedIds] =
    useState(new Set());

  const [questionScores, setQuestionScores] =
    useState({});

  const [analysis, setAnalysis] =
    useState(null);

  const [
    showAdaptiveChallenge,
    setShowAdaptiveChallenge,
  ] = useState(false);

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
  };

  // ============================================================
  // LOAD APPLY PROGRESS
  // ============================================================

  useEffect(() => {
    if (!student?.id) {
      setLoadingProgress(false);
      return;
    }

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

        console.log(
          "Resume Apply progress:",
          data
        );

        const loadedCompletedIds =
          new Set(
            data.completed_question_ids || []
          );

        setCompletedIds(
          loadedCompletedIds
        );

        if (data.question_scores) {
          setQuestionScores(
            data.question_scores
          );
        }

        const nextIndex =
          questions.findIndex(
            (question) =>
              !loadedCompletedIds.has(
                question.id
              )
          );

        // ========================================================
        // ALL APPLY QUESTIONS ALREADY COMPLETE
        // ========================================================

        if (nextIndex === -1) {
          console.log(
            "APPLY ALREADY COMPLETE → SKIPPING"
          );

          onComplete({
            success: true,
            score: 100,
            dimension: "apply",
          });

          return;
        }

        setCurrentIndex(nextIndex);

        setCode(
          questions[nextIndex]?.starterCode ||
          ""
        );
      } catch (error) {
        console.error(
          "Could not load Apply progress:",
          error
        );

        setCurrentIndex(0);

        setCode(
          questions[0]?.starterCode || ""
        );
      } finally {
        setLoadingProgress(false);
      }
    };

    loadApplyProgress();
  }, [
    student?.id,
    API_URL,
    onComplete,
    questions,
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
    // ========================================================
    // STUDENT CHECK
    // ========================================================

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

    // ========================================================
    // MUST RUN FIRST
    // ========================================================

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

    // ========================================================
    // MUST BE CORRECT
    // ========================================================

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
            student_id:
              String(student.id),

            topic: "loops",

            concept: "loops",

            dimension: "apply",

            question_id:
              question.id,

            score:
              result.score,

            question:
              question.description,

            student_answer:
              code,

            correct_answer:
              question.expectedOutput,

            mistake: "none",

            mistake_type:
              result.mistakeType,
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

      console.log(
        "✅ Attempt saved"
      );

      // ======================================================
      // UPDATE COMPLETED IDS
      // ======================================================

      const updatedCompletedIds =
        new Set(completedIds);

      updatedCompletedIds.add(
        question.id
      );

      setCompletedIds(
        updatedCompletedIds
      );

      // ======================================================
      // UPDATE QUESTION SCORE
      // ======================================================

      setQuestionScores(
        (previous) => ({
          ...previous,

          [question.id]:
            result.score,
        })
      );

      // ======================================================
      // FIND NEXT INCOMPLETE QUESTION
      // ======================================================

      const nextIndex =
        questions.findIndex(
          (q) =>
            !updatedCompletedIds.has(
              q.id
            )
        );

      if (nextIndex !== -1) {
        resetQuestion(
          nextIndex
        );

        return;
      }

      // ======================================================
      // ALL APPLY QUESTIONS COMPLETE
      // ======================================================

      console.log(
        "APPLY COMPLETE → MOVING TO NEXT DIMENSION"
      );

      onComplete({
        success: true,
        score: 100,
        dimension: "apply",
      });
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