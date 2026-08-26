import React from "react";
import ProofOfLearn from "../components/ProofOfLearn";
import MistakeTracker from "../components/MistakeTracker";

function CompletionOverview({
  concept,
  student,
  onBackToDashboard,
}) {
  if (!concept) {
    return null;
  }

  // ============================================================
  // GET ALL QUESTIONS
  // ============================================================

  const sections = [
    {
      key: "learn",
      number: 1,
      title: "Learn",
      icon: "",
      description:
        "Understand the concept and its fundamentals.",
      questions:
        concept.learnQuestions ||
        concept.learn_questions ||
        [],
    },
    {
      key: "theory",
      number: 2,
      title: "Theory",
      icon: "",
      description:
        "Test your understanding of the core ideas.",
      questions:
        concept.theoryQuestions ||
        concept.theory_questions ||
        [],
    },
    {
      key: "explain",
      number: 3,
      title: "Explain",
      icon: "",
      description:
        "Explain the concept in your own words.",
      questions:
        concept.explainQuestions ||
        concept.explain_questions ||
        [],
    },
    {
      key: "predict",
      number: 4,
      title: "Predict",
      icon: "",
      description:
        "Predict what code will do before running it.",
      questions:
        concept.predictQuestions ||
        concept.predict_questions ||
        [],
    },
    {
      key: "implement",
      number: 5,
      title: "Implement",
      icon: "",
      description:
        "Write programs using the concept.",
      questions:
        concept.implementQuestions ||
        concept.implement_questions ||
        [],
    },
    {
      key: "debug",
      number: 6,
      title: "Debug",
      icon: "",
      description:
        "Find and fix mistakes in programs.",
      questions:
        concept.debugQuestions ||
        concept.debug_questions ||
        [],
    },
    {
      key: "apply",
      number: 7,
      title: "Apply",
      icon: "",
      description:
        "Use the concept to solve practical problems.",
      questions:
        concept.applyQuestions ||
        concept.apply_questions ||
        [],
    },
  ];

  // ============================================================
  // GET QUESTION TEXT
  // ============================================================

  const getQuestionText = (question) => {
    return (
      question.question ||
      question.title ||
      question.description ||
      question.prompt ||
      "Question"
    );
  };

  // ============================================================
  // GET STUDENT ANSWER
  // ============================================================

  const getStudentAnswer = (question) => {
    return (
      question.studentAnswer ??
      question.student_answer ??
      question.answer ??
      question.selectedAnswer ??
      question.selected_answer ??
      question.code ??
      question.studentCode ??
      question.student_code ??
      null
    );
  };

  // ============================================================
  // GET CORRECT ANSWER
  // ============================================================

  const getCorrectAnswer = (question) => {
    return (
      question.correctAnswer ??
      question.correct_answer ??
      question.correctOption ??
      question.correct_option ??
      question.correctCode ??
      question.correct_code ??
      question.expectedOutput ??
      question.expected_output ??
      question.answer ??
      null
    );
  };

  // ============================================================
  // GET EXPECTED OUTPUT
  // ============================================================

  const getExpectedOutput = (question) => {
    return (
      question.expectedOutput ??
      question.expected_output ??
      question.expected ??
      null
    );
  };

  // ============================================================
  // FORMAT ANSWER
  // ============================================================

  const renderAnswer = (answer) => {
    if (answer === null || answer === undefined) {
      return (
        <p className="no-answer">
          No answer recorded.
        </p>
      );
    }

    if (typeof answer === "object") {
      return (
        <pre>
          {JSON.stringify(answer, null, 2)}
        </pre>
      );
    }

    return <pre>{String(answer)}</pre>;
  };

  // ============================================================
  // FORMAT EXAMPLE NAME
  // ============================================================

  const formatExampleName = (name) => {
    return name
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (char) => char.toUpperCase());
  };

  // ============================================================
  // TOTAL QUESTIONS
  // ============================================================

  const totalQuestions = sections.reduce(
    (total, section) =>
      total + section.questions.length,
    0
  );

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="completion-page">

      {/* ======================================================
          HERO
      ====================================================== */}

      <section className="completion-hero">

        <div className="completion-icon">
          🎉
        </div>

        <p className="section-label">
          LEARNING JOURNEY COMPLETE
        </p>

        <h1>
          Concept Completed!
        </h1>

        <p>
          Great work,{" "}
          {student?.name || "Learner"}!
          You completed the complete learning
          journey for
        </p>

        <h2>
          {concept.title}
        </h2>

        {concept.description && (
          <p className="completion-description">
            {concept.description}
          </p>
        )}

      </section>


      {/* ======================================================
          LEARNING JOURNEY
      ====================================================== */}

      <section className="journey-section">

        <h2>
          Your Learning Journey
        </h2>

        <div className="journey-grid">

          {sections.map((section) => (

            <div
              className="journey-card completed"
              key={section.key}
            >

              <div className="journey-number">
                {section.number}
              </div>

              <div>

                <span>
                  {section.icon}
                </span>

                <h3>
                  {section.title}
                </h3>

                <p>
                  {section.description}
                </p>

              </div>

              <strong>
                ✓ Completed
              </strong>

            </div>

          ))}

        </div>

      </section>


      {/* ======================================================
          OVERALL SUMMARY
      ====================================================== */}

      <section className="completion-stats">

        <h2>
          Assessment Summary
        </h2>

        <div className="completion-stats-grid">

          <div className="completion-stat-card">
            <strong>
              7
            </strong>

            <span>
              Learning Stages
            </span>
          </div>

          <div className="completion-stat-card">
            <strong>
              {totalQuestions}
            </strong>

            <span>
              Questions Completed
            </span>
          </div>

          <div className="completion-stat-card">
            <strong>
              ✓
            </strong>

            <span>
              Journey Completed
            </span>
          </div>

        </div>

      </section>


      {/* ======================================================
          CONCEPT SUMMARY
      ====================================================== */}

      <section className="concept-summary">

        <h2>
          What You Learned
        </h2>

        <div className="summary-card">

          <h3>
            {concept.title}
          </h3>

          {concept.description && (
            <p>
              {concept.description}
            </p>
          )}

          {concept.explanation && (
            <div className="explanation-box">

              <h4>
                Concept Explanation
              </h4>

              <pre>
                {concept.explanation}
              </pre>

            </div>
          )}

        </div>

      </section>

      {/* ======================================================
    PROOF OF LEARN
====================================================== */}

      <ProofOfLearn
        concept={concept}
        sections={sections}
      />
      {/* ======================================================
    MISTAKE TRACKER
====================================================== */}

      <MistakeTracker
        student={student}
        concept={concept}
      />

      {/* ======================================================
          EVERY QUESTION + ANSWER
      ====================================================== */}

      <section className="all-questions-section">

        <div className="section-heading">

          <p className="section-label">
            COMPLETE ASSESSMENT REVIEW
          </p>
          <br />
          <h2>
            Questions & Answers
          </h2>
          <br />
          <p>
            Review every question from your
            learning journey along with the
            recorded answer and expected answer.
          </p>

        </div>


        {sections.map((section) => (

          <section
            className="assessment-review-section"
            key={section.key}
          >

            {/* SECTION HEADER */}

            <div className="assessment-section-header">

              <div className="assessment-section-icon">
                {section.icon}
              </div>

              <div>

                <p className="section-label">
                  STEP {section.number}
                </p>

                <h3>
                  {section.title}
                </h3>

                <p>
                  {section.description}
                </p>

              </div>

              <div className="assessment-count">
                {section.questions.length}{" "}
                question
                {section.questions.length !== 1
                  ? "s"
                  : ""}
              </div>

            </div>


            {/* QUESTIONS */}

            {section.questions.length === 0 ? (

              <div className="no-questions">
                <p>
                  No question details available
                  for this section.
                </p>
              </div>

            ) : (

              <div className="questions-list">

                {section.questions.map(
                  (question, index) => {

                    const studentAnswer =
                      getStudentAnswer(question);

                    const correctAnswer =
                      getCorrectAnswer(question);

                    const expectedOutput =
                      getExpectedOutput(question);

                    return (

                      <article
                        className="review-question-card"
                        key={
                          question.id ||
                          `${section.key}-${index}`
                        }
                      >

                        {/* QUESTION NUMBER */}

                        <div className="review-question-header">

                          <span className="review-question-number">
                            QUESTION{" "}
                            {String(index + 1).padStart(
                              2,
                              "0"
                            )}
                          </span>

                          {question.difficulty && (
                            <span className="review-difficulty">
                              {question.difficulty}
                            </span>
                          )}

                        </div>


                        {/* QUESTION */}

                        <div className="review-question">

                          <h4>
                            {getQuestionText(
                              question
                            )}
                          </h4>

                          {question.instructions && (
                            <p>
                              {question.instructions}
                            </p>
                          )}

                        </div>


                        {/* OPTIONS */}

                        {Array.isArray(
                          question.options
                        ) && (
                            <div className="review-options">

                              <p className="question-label">
                                OPTIONS
                              </p>

                              {question.options.map(
                                (option, optionIndex) => {

                                  const optionValue =
                                    typeof option ===
                                      "object"
                                      ? option.text ||
                                      option.label ||
                                      option.value
                                      : option;

                                  return (

                                    <div
                                      className="review-option"
                                      key={optionIndex}
                                    >

                                      <span>
                                        {String.fromCharCode(
                                          65 +
                                          optionIndex
                                        )}
                                      </span>

                                      <p>
                                        {optionValue}
                                      </p>

                                    </div>

                                  );
                                }
                              )}

                            </div>
                          )}


                        {/* STUDENT ANSWER */}

                        <div className="answer-block student-answer">

                          <div className="answer-heading">

                            <span>
                              👤
                            </span>

                            <strong>
                              Your Answer
                            </strong>

                          </div>

                          {renderAnswer(
                            studentAnswer
                          )}

                        </div>


                        {/* CORRECT ANSWER */}

                        {correctAnswer !==
                          null && (
                            <div className="answer-block correct-answer">

                              <div className="answer-heading">

                                <span>
                                  ✓
                                </span>

                                <strong>
                                  Correct Answer
                                </strong>

                              </div>

                              {renderAnswer(
                                correctAnswer
                              )}

                            </div>
                          )}


                        {/* EXPECTED OUTPUT */}

                        {expectedOutput !==
                          null && (
                            <div className="answer-block expected-output">

                              <div className="answer-heading">

                                <span>

                                </span>

                                <strong>
                                  Expected Output
                                </strong>

                              </div>

                              <pre>
                                {String(
                                  expectedOutput
                                )}
                              </pre>

                            </div>
                          )}


                        {/* IMPLEMENTATION CODE */}

                        {section.key ===
                          "implement" && (
                            <div className="answer-block code-review">

                              <div className="answer-heading">

                                <span>

                                </span>

                                <strong>
                                  Implementation
                                </strong>

                              </div>

                              <pre>
                                {String(
                                  studentAnswer ||
                                  question.code ||
                                  question.studentCode ||
                                  "No code recorded."
                                )}
                              </pre>

                            </div>
                          )}


                        {/* EXPLANATION */}

                        {question.explanation && (
                          <div className="answer-block explanation-review">

                            <div className="answer-heading">

                              <span>

                              </span>

                              <strong>
                                Explanation
                              </strong>

                            </div>

                            <p>
                              {question.explanation}
                            </p>

                          </div>
                        )}


                        {/* HINT */}

                        {question.hint && (
                          <details className="review-hint">

                            <summary>
                              View Hint
                            </summary>

                            <p>
                              {question.hint}
                            </p>

                          </details>
                        )}

                      </article>
                    );
                  }
                )}

              </div>
            )}

          </section>

        ))}

      </section>


      {/* ======================================================
          EXAMPLES
      ====================================================== */}

      {concept.examples &&
        Object.keys(concept.examples).length >
        0 && (

          <section className="examples-section">

            <div className="section-heading">

              <p className="section-label">
                REFERENCE MATERIAL
              </p>

              <h2>
                💡 Examples
              </h2>

              <p>
                Examples used while learning this
                concept.
              </p>

            </div>

            <div className="examples-grid">

              {Object.entries(
                concept.examples
              ).map(([name, code]) => (

                <div
                  className="example-card"
                  key={name}
                >

                  <h3>
                    {formatExampleName(name)}
                  </h3>

                  <pre>
                    <code>
                      {typeof code === "object"
                        ? JSON.stringify(
                          code,
                          null,
                          2
                        )
                        : code}
                    </code>
                  </pre>

                </div>

              ))}

            </div>

          </section>
        )}


      {/* ======================================================
          QUICK RECAP
      ====================================================== */}

      <section className="recap-section">

        <h2>
          Quick Recap
        </h2>

        <div className="recap-card">

          {sections.map((section) => (

            <div key={section.key}>

              <span>
                {section.icon}
              </span>

              <p>
                <strong>
                  {section.title}
                </strong>{" "}
                {section.description
                  .replace(".", "")
                  .toLowerCase()}
              </p>

            </div>

          ))}

        </div>

      </section>


      {/* ======================================================
          FOOTER
      ====================================================== */}

      <section className="completion-footer">

        <div className="success-message">

          <span>
            🏆
          </span>

          <div>

            <h3>
              You've mastered{" "}
              {concept.title}!
            </h3>

            <p>
              You completed all stages of the
              learning journey.
            </p>

          </div>

        </div>

        <button
          type="button"
          className="dashboard-button"
          onClick={onBackToDashboard}
        >
          ← Back to Dashboard
        </button>

      </section>

    </div>
  );
}

function formatExampleName(name) {
  return name
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) =>
      char.toUpperCase()
    );
}

export default CompletionOverview;