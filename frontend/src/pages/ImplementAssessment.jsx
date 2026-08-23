import { useEffect, useState } from "react";

import MistakeAnalysis from "../components/MistakeAnalysis";
import AdaptiveChallenge from "../components/AdaptiveChallenge";
import { detectWeakness } from "../services/weaknessDetector";
import AssessmentQuestionNavigator from "../components/AssessmentQuestionNavigator";

function ImplementAssessment({
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
  const [completedIds, setCompletedIds] = useState(new Set());
  const [questionScores, setQuestionScores] = useState({});
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [mistakeAnalysis, setMistakeAnalysis] = useState(null);
  const [showAdaptiveChallenge, setShowAdaptiveChallenge] =
    useState(false);

  const API_URL = import.meta.env.VITE_API_URL;

  const implementQuestions = concept?.implementQuestions || [];

  const handleQuestionSelect = (index) => {
    const selectedQuestion = implementQuestions[index];

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
  // LOAD IMPLEMENT PROGRESS
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
          `${API_URL}/progress/${student.id}/${concept.id}/implement`
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load implementation progress"
          );
        }

        const data = await response.json();

        console.log("IMPLEMENT PROGRESS:", data);

        const loadedCompletedIds = new Set(
          data.completed_question_ids || []
        );

        setCompletedIds(loadedCompletedIds);

        const nextIndex = implementQuestions.findIndex(
          (question) => !loadedCompletedIds.has(question.id)
        );

        if (nextIndex !== -1) {
          setQuestionIndex(nextIndex);

          setCode(
            implementQuestions[nextIndex].starterCode || ""
          );
        } else {
          console.log(
            "ALL IMPLEMENT QUESTIONS ALREADY COMPLETED → MOVING ON"
          );

          onComplete();
          return;
        }
      } catch (error) {
        console.error(
          "Could not load implementation progress:",
          error
        );

        setQuestionIndex(0);

        if (implementQuestions?.[0]) {
          setCode(
            implementQuestions[0].starterCode || ""
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
  ]);

  // ============================================================
  // LOADING
  // ============================================================

  if (loadingProgress) {
    return (
      <main className="implement-assessment">
        <p>Loading your progress...</p>
      </main>
    );
  }

  // ============================================================
  // STUDENT SAFETY CHECK
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

        <h1>Implementation questions not found</h1>

        <p>
          This concept does not have any Implement
          questions yet.
        </p>
      </main>
    );
  }

  // ============================================================
  // CURRENT QUESTION
  // ============================================================

  const question = implementQuestions[questionIndex];

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
      return "general_implementation";
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
      value.includes("accumulation")
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
      value.includes("square calculation")
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
      value.includes("output error")
    ) {
      return "loop_output";
    }

    return "general_implementation";
  };

  const getAdaptiveWeakness = ({
  mistakeType,
  questionId,
  aiWeakness,
}) => {
  // Execution/syntax errors should always map directly
  if (
    mistakeType === "python_syntax" ||
    mistakeType === "syntax_error"
  ) {
    return "python_syntax";
  }

  // Question-specific mappings
  if (questionId === "implement-1") {
    return "range_exclusive_upper_bound";
  }

  if (questionId === "implement-2") {
    return "even_number_range";
  }

  if (questionId === "implement-3") {
    return "loop_accumulation";
  }

  if (questionId === "implement-4") {
    return "countdown_range";
  }

  if (questionId === "implement-6") {
    return "calculation_logic";
  }

  // AI can be used for less obvious mistakes
  return normalizeWeakness(aiWeakness);
};

  // ============================================================
  // QUESTION-SPECIFIC ERROR
  // ============================================================

  const getImplementationErrorMessage = () => {
    switch (question.id) {
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
  };

  // ============================================================
  // ANALYZE IMPLEMENTATION MISTAKE
  // ============================================================

  const analyzeImplementationMistake = async ({
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
      console.log("🤖 Calling /analyze-mistake...");

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
            dimension: "implement",
            question_id: question.id,
            score,
            question: question.description,
            student_answer: currentCode,
            correct_answer: question.correctCode,
            mistake: mistakeType,
            recommendation:
              "Review the loop structure, range boundaries, iteration logic, syntax, and output.",
          }),
        }
      );

      let analysisData = {};

      try {
        analysisData = await analysisResponse.json();
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
        analysisData.ai_analysis || analysisData;

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
          "The implementation does not match the required task.",

        hint:
          aiAnalysis.hint ||
          question.hint ||
          "Review the loop and try again.",

        recommended_action:
          aiAnalysis.recommended_action ||
          "Review the implementation and try again.",

        weakness: getAdaptiveWeakness({
  mistakeType,
  questionId: question.id,
  aiWeakness:
    aiAnalysis.weakness || fallbackWeakness,
}),
      });
    } catch (analysisError) {
      console.error(
        "❌ Implementation analysis failed:",
        analysisError
      );

      setMistakeAnalysis({
        mistake_type:
          mistakeType === "execution_error"
            ? "Python syntax error"
            : "Implementation error",

        explanation: errorMessage,

        misconception:
          mistakeType === "execution_error"
            ? "There is a Python syntax or execution problem in the submitted code."
            : "The implementation does not correctly match the required task.",

        hint:
          question.hint ||
          "Check your loop, range, syntax, and output logic.",

        recommended_action:
          "Review the code and try the implementation again.",

weakness: getAdaptiveWeakness({
  mistakeType,
  questionId: question.id,
  aiWeakness: fallbackWeakness,
}),      });
    }
  };

  // ============================================================
  // RUN CODE
  // ============================================================

  const runCode = async () => {
    setResult(null);
    setMistakeAnalysis(null);
    setOutput("");
    setAiLoading(true);

    try {
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

      // ========================================================
      // PYTHON EXECUTION ERROR
      // ========================================================

      if (data.error) {
        const errorText = String(data.error);

        setOutput(errorText);

        /*
         * Detect syntax errors separately so the UI/AI
         * does not incorrectly describe them as an output
         * or loop-logic mistake.
         */

        const isSyntaxError =
          /syntaxerror|syntax error|indentationerror|indentation error|invalid syntax/i.test(
            errorText
          );

        const mistakeType = isSyntaxError
          ? "python_syntax"
          : "execution_error";

        const errorMessage = isSyntaxError
          ? "Your program has a Python syntax error. Check your brackets, indentation, quotes, and make sure statements such as for, if, and while end with a colon (:)."
          : "Your program could not run. Check the error shown in the output and fix your code.";

        setResult({
          success: false,
          score: 40,
          mistakeType,
          message: errorMessage,
        });

        await analyzeImplementationMistake({
          mistakeType,
          errorMessage,
          score: 40,
        });

        return;
      }

      // ========================================================
      // OUTPUT COMPARISON
      // ========================================================

      const actualOutput = normalizeOutput(
        data.output || ""
      );

      const expectedOutput = normalizeOutput(
        question.expectedOutput || ""
      );

      setOutput(data.output || "");

      console.log(
        "IMPLEMENT QUESTION:",
        question.id
      );

      console.log(
        "IMPLEMENT CODE:",
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

      // ========================================================
      // CORRECT
      // ========================================================

      if (actualOutput === expectedOutput) {
        setResult({
          success: true,
          score: 100,
          mistakeType: "implementation_success",
          message:
            "Excellent! Your implementation produced the expected output.",
        });

        setMistakeAnalysis(null);

        return;
      }

      // ========================================================
      // INCORRECT OUTPUT
      // ========================================================

      const errorMessage =
        getImplementationErrorMessage();

      setResult({
        success: false,
        score: 40,
        mistakeType: "implementation_error",
        message: errorMessage,
      });

      // ========================================================
      // AI ANALYSIS
      // ========================================================

      await analyzeImplementationMistake({
        mistakeType: "implementation_error",
        errorMessage,
        score: 40,
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
  };

  // ============================================================
  // SUBMIT
  // ============================================================

  const submitCode = async () => {
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
      setResult({
        ...result,
        message:
          "Fix the implementation error before submitting.",
      });

      return;
    }

    setLoading(true);

    try {
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
            dimension: "implement",
            question_id: question.id,
            score: result.score,
            question: question.description,
            student_answer: currentCode,
            correct_answer: question.expectedOutput,
            mistake: "none",
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();

        console.error(
          "Failed to save implementation:",
          response.status,
          errorText
        );

        throw new Error(
          "Failed to save implementation attempt."
        );
      }

      await response.json();

      // ========================================================
      // UPDATE COMPLETED QUESTIONS
      // ========================================================

      const updatedCompletedIds = new Set(
        completedIds
      );

      updatedCompletedIds.add(question.id);

      setCompletedIds(updatedCompletedIds);

      setQuestionScores((previous) => ({
        ...previous,
        [question.id]: result.score,
      }));

      // ========================================================
      // FIND NEXT INCOMPLETE QUESTION
      // ========================================================

      const nextIndex = implementQuestions.findIndex(
        (q) => !updatedCompletedIds.has(q.id)
      );

      if (nextIndex !== -1) {
        setQuestionIndex(nextIndex);

        setCode(
          implementQuestions[nextIndex].starterCode || ""
        );

        setOutput("");
        setResult(null);
        setMistakeAnalysis(null);
        setShowAdaptiveChallenge(false);
        setShowHint(false);

        return;
      }

      // ========================================================
      // ALL QUESTIONS COMPLETE
      // ========================================================

      console.log(
        "ALL IMPLEMENT QUESTIONS COMPLETE → MOVING TO DEBUG"
      );

      onComplete();
    } catch (error) {
      console.error(
        "Submit implementation error:",
        error
      );

      setResult({
        success: false,
        score: 0,
        mistakeType: "backend_error",
        message:
          "Could not save the implementation attempt. Make sure the backend is running.",
      });
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // RESET
  // ============================================================

  const resetQuestion = () => {
    setCode(question.starterCode || "");
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
    setResult(null);
    setOutput("");
    setMistakeAnalysis(null);
    setShowAdaptiveChallenge(false);
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <main className="implement-assessment">

      {/* BACK */}

      <button
        type="button"
        className="back-button"
        onClick={onBack}
        disabled={loading}
      >
        ← Back to predict
      </button>

      {/* HEADER */}

      <div className="implement-header">
        <p className="section-label">
          STEP 5 • IMPLEMENT ASSESSMENT
        </p>

        <h1>
          Write the solution
        </h1>

        <p>
          Now demonstrate that you can
          actually implement the concept
          yourself.
        </p>
      </div>

      <AssessmentQuestionNavigator
        questions={implementQuestions}
        currentIndex={questionIndex}
        completedIds={completedIds}
        questionScores={questionScores}
        onSelectQuestion={handleQuestionSelect}
      />

      {/* CARD */}

      <div className="implement-card">

        {/* QUESTION NUMBER */}

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

        {/* DIFFICULTY */}

        <div className="implement-meta">
          {question.difficulty && (
            <span className="implement-difficulty">
              {question.difficulty}
            </span>
          )}
        </div>

        {/* QUESTION */}

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

        {/* VARIABLES */}

        {question.variables?.length > 0 && (
          <div className="implement-variables">
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
                <strong>Hint</strong>

                <p>
                  {question.hint}
                </p>
              </div>
            )}
          </div>
        )}

        {/* CODE */}

        <label
          htmlFor="implement-code-editor"
          className="code-label"
        >
          YOUR CODE
        </label>

        <textarea
          id="implement-code-editor"
          value={currentCode}
          onChange={handleCodeChange}
          spellCheck="false"
          className="implementation-editor"
          disabled={loading}
          aria-label="Python code editor"
        />

        {/* ACTIONS */}

        <div className="implementation-actions">
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
            onClick={submitCode}
            disabled={
              loading ||
              !result?.success
            }
          >
            {loading
              ? "Saving..."
              : questionIndex <
                implementQuestions.length - 1
              ? "Submit & Continue →"
              : "Submit Solution →"}
          </button>
        </div>

        {/* OUTPUT */}

        <div className="implementation-output">
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
              <button
                type="button"
                className="secondary-button"
                onClick={resetQuestion}
                disabled={loading}
              >
                Reset Code
              </button>
            )}
          </div>
        )}

        {/* AI LOADING */}

        {aiLoading && (
          <div className="ai-loading">
            🤖 Analyzing your implementation...
          </div>
        )}

        {/* AI ANALYSIS */}

        {mistakeAnalysis && (
          <MistakeAnalysis
            analysis={mistakeAnalysis}
          />
        )}

        {/* ADAPTIVE CHALLENGE */}

        {mistakeAnalysis &&
          !showAdaptiveChallenge && (
            <button
              type="button"
              className="primary-button"
              onClick={() =>
                setShowAdaptiveChallenge(true)
              }
              style={{
                marginTop: "20px",
              }}
            >
              Practice My Weakness →
            </button>
          )}

        {showAdaptiveChallenge &&
          mistakeAnalysis && (
            <AdaptiveChallenge
              weakness={
                mistakeAnalysis.weakness
              }
              question={question}
              onBack={() => {
                setShowAdaptiveChallenge(
                  false
                );
              }}
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