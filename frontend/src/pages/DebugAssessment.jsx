import { useEffect, useState } from "react";

import DebugAISection from "../components/DebugAISection";
import AssessmentQuestionNavigator from "../components/AssessmentQuestionNavigator";
import { detectWeakness } from "../services/weaknessDetector";

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

  const [completedIds, setCompletedIds] = useState(new Set());
  const [questionScores, setQuestionScores] = useState({});

  const [showHint, setShowHint] = useState(false);
  const [mistakeAnalysis, setMistakeAnalysis] = useState(null);
  const [showAdaptiveChallenge, setShowAdaptiveChallenge] =
    useState(false);

  const debugQuestions = concept?.debugQuestions || [];
  const API_URL = import.meta.env.VITE_API_URL;

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
  };

  // ============================================================
  // LOAD DEBUG PROGRESS
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
          `${API_URL}/progress/${student.id}/${concept.id}/debug`
        );

        if (!response.ok) {
          throw new Error("Failed to load debug progress");
        }

        const data = await response.json();

        console.log("DEBUG PROGRESS:", data);

        // --------------------------------------------------------
        // Completed question IDs
        // --------------------------------------------------------

        const loadedCompletedIds = new Set(
          data.completed_question_ids || []
        );

        setCompletedIds(loadedCompletedIds);

        // --------------------------------------------------------
        // Question scores
        // --------------------------------------------------------

        const loadedScores = {};

        if (data.question_scores) {
          Object.entries(data.question_scores).forEach(
            ([questionId, score]) => {
              loadedScores[questionId] = score;
            }
          );
        }

        setQuestionScores(loadedScores);

        // --------------------------------------------------------
        // Find first incomplete question
        // --------------------------------------------------------

        const nextIndex = debugQuestions.findIndex(
          (question) => !loadedCompletedIds.has(question.id)
        );

        if (nextIndex !== -1) {
          setQuestionIndex(nextIndex);

          setCode(
            debugQuestions[nextIndex].starterCode || ""
          );
        } else {
          console.log(
            "ALL DEBUG QUESTIONS ALREADY COMPLETED → MOVING ON"
          );

          onComplete();
        }
      } catch (error) {
        console.error(
          "Could not load debug progress:",
          error
        );

        // Allow student to continue even if progress loading fails.
        setQuestionIndex(0);

        if (debugQuestions?.[0]) {
          setCode(
            debugQuestions[0].starterCode || ""
          );
        }
      } finally {
        setLoadingProgress(false);
      }
    };

    loadProgress();
  }, [
    student?.id,
    concept?.id,
    API_URL,
    onComplete,
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
    score = 40,
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
  // RUN CODE
  // ============================================================

  const runCode = async () => {
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
        setOutput("No code to run.");

        setResult({
          success: false,
          score: 0,
          mistakeType: "no_code",
          message:
            "Please write or fix the code before running it.",
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

        setResult({
          success: false,
          score: 40,
          mistakeType,
          message: errorMessage,
        });

        await runMistakeAnalysis({
          mistakeType,
          errorMessage,
          score: 40,
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

      setResult({
        success: false,
        score: 40,
        mistakeType:
          question.bugType ||
          "logic_error",
        message: errorMessage,
      });

      await runMistakeAnalysis({
        mistakeType:
          question.bugType ||
          "logic_error",
        errorMessage,
        score: 40,
      });
    } catch (error) {
      console.error(
        "Run debug code error:",
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
      // Save attempt
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
            dimension: "debug",
            question_id: question.id,
            score: result.score,
            question: question.description,
            student_answer: currentCode,
            correct_answer:
              question.expectedOutput,
            mistake: "none",
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
      // Update completed questions
      // --------------------------------------------------------

      const updatedCompletedIds =
        new Set(completedIds);

      updatedCompletedIds.add(question.id);

      setCompletedIds(
        updatedCompletedIds
      );

      setQuestionScores((previous) => ({
        ...previous,
        [question.id]: result.score,
      }));

      // --------------------------------------------------------
      // Find next incomplete question
      // --------------------------------------------------------

      const nextIndex =
        debugQuestions.findIndex(
          (q) => !updatedCompletedIds.has(q.id)
        );

      if (nextIndex !== -1) {
        setQuestionIndex(nextIndex);

        setCode(
          debugQuestions[nextIndex]
            .starterCode || ""
        );

        setOutput("");
        setResult(null);
        setMistakeAnalysis(null);
        setShowAdaptiveChallenge(false);
        setShowHint(false);

        return;
      }

      // --------------------------------------------------------
      // ALL QUESTIONS COMPLETE
      // --------------------------------------------------------

      console.log(
        "ALL DEBUG QUESTIONS COMPLETE → MOVING ON"
      );

      onComplete();
    } catch (error) {
      console.error(
        "Submit debug error:",
        error
      );

      setResult({
        success: false,
        score: 0,
        mistakeType: "backend_error",
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
  };

  // ============================================================
  // CODE CHANGE
  // ============================================================

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