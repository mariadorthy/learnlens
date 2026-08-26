import React from "react";

function ProofOfLearn({
  concept,
  sections = [],
}) {
  if (!concept) {
    return null;
  }

  // ============================================================
  // GET SECTION DATA
  // ============================================================

  const getSection = (key) => {
    return (
      sections.find(
        (section) => section.key === key
      ) || {
        questions: [],
      }
    );
  };

  const theory = getSection("theory");
  const explain = getSection("explain");
  const predict = getSection("predict");
  const implement = getSection("implement");
  const debug = getSection("debug");
  const apply = getSection("apply");

  // ============================================================
  // EVIDENCE
  // ============================================================

  const evidence = [
    {
      key: "theory",
      number: "01",
      icon: "",
      title: "Concept Understanding",
      description:
        "Demonstrated understanding of the core ideas through theory assessment.",
      questions: theory.questions,
    },
    {
      key: "explain",
      number: "02",
      icon: "",
      title: "Explanation",
      description:
        "Demonstrated the ability to explain the concept in your own words.",
      questions: explain.questions,
    },
    {
      key: "predict",
      number: "03",
      icon: "",
      title: "Prediction",
      description:
        "Demonstrated the ability to reason about code before execution.",
      questions: predict.questions,
    },
    {
      key: "implement",
      number: "04",
      icon: "",
      title: "Implementation",
      description:
        "Demonstrated the ability to use the concept by writing code.",
      questions: implement.questions,
    },
    {
      key: "debug",
      number: "05",
      icon: "",
      title: "Debugging",
      description:
        "Demonstrated the ability to identify and correct mistakes.",
      questions: debug.questions,
    },
    {
      key: "apply",
      number: "06",
      icon: "",
      title: "Application",
      description:
        "Demonstrated the ability to apply the concept to a practical problem.",
      questions: apply.questions,
    },
  ];

  // ============================================================
  // COMPLETED EVIDENCE
  // ============================================================

  const completedEvidence =
    evidence.filter(
      (item) => item.questions.length > 0
    );

  const evidenceCount =
    completedEvidence.length;

  const hasImplementation =
    implement.questions.length > 0;

  const hasApplication =
    apply.questions.length > 0;

  // ============================================================
  // PROOF STATUS
  // ============================================================

  const hasStrongEvidence =
    evidenceCount >= 4 &&
    hasImplementation &&
    hasApplication;

  // ============================================================
  // GET ANSWER
  // ============================================================

  const getStudentAnswer = (question) => {
    return (
      question.studentAnswer ??
      question.student_answer ??
      question.selectedAnswer ??
      question.selected_answer ??
      question.answer ??
      question.code ??
      question.studentCode ??
      question.student_code ??
      null
    );
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <section className="proof-card">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="proof-header">

        <div className="proof-number">
          03
        </div>

        <div>
          <p className="section-label">
            PROOF-OF-LEARN
          </p>

          <h2>
            Evidence of understanding
          </h2>
        </div>

      </div>

      <p className="proof-intro">
        Completing a theory question alone is
        not enough to demonstrate mastery.
        Your understanding is supported by
        evidence across multiple learning
        dimensions, including implementation
        and application.
      </p>

      {/* ======================================================
          CONCEPT
      ====================================================== */}

      <div className="proof-concept">

        <span className="proof-concept-icon">
          🎓
        </span>

        <div>
          <p className="section-label">
            CONCEPT
          </p>

          <h3>
            {concept.title || concept.name}
          </h3>

          {concept.description && (
            <p>
              {concept.description}
            </p>
          )}
        </div>

      </div>

      {/* ======================================================
          EVIDENCE GRID
      ====================================================== */}

      <div className="proof-evidence-grid">

        {evidence.map((item) => {

          const completed =
            item.questions.length > 0;

          return (
            <div
              key={item.key}
              className={`proof-evidence-item ${completed
                  ? "completed"
                  : "missing"
                }`}
            >

              <div className="proof-evidence-icon">
                {item.icon}
              </div>

              <div className="proof-evidence-content">

                <div className="proof-evidence-top">

                  <span className="proof-evidence-number">
                    {item.number}
                  </span>

                  <strong>
                    {item.title}
                  </strong>

                  <span className="proof-evidence-status">
                    {completed
                      ? "✓ Evidence"
                      : "— No evidence"}
                  </span>

                </div>

                <p>
                  {item.description}
                </p>

                {completed && (
                  <span className="proof-question-count">
                    {item.questions.length}{" "}
                    question
                    {item.questions.length !== 1
                      ? "s"
                      : ""}{" "}
                    recorded
                  </span>
                )}

              </div>

            </div>
          );
        })}

      </div>

      {/* ======================================================
          IMPLEMENTATION + APPLICATION PROOF
      ====================================================== */}

      <div className="proof-practical-evidence">

        <div
          className={`proof-practical-card ${hasImplementation
              ? "verified"
              : ""
            }`}
        >

          <span>

          </span>

          <div>

            <strong>
              Successful Implementation
            </strong>

            <p>
              {hasImplementation
                ? "Code implementation evidence was recorded."
                : "No implementation evidence recorded."}
            </p>

          </div>

          {hasImplementation && (
            <b>
              ✓
            </b>
          )}

        </div>

        <div
          className={`proof-practical-card ${hasApplication
              ? "verified"
              : ""
            }`}
        >

          <span>

          </span>

          <div>

            <strong>
              Successful Application
            </strong>

            <p>
              {hasApplication
                ? "Practical application evidence was recorded."
                : "No application evidence recorded."}
            </p>

          </div>

          {hasApplication && (
            <b>
              ✓
            </b>
          )}

        </div>

      </div>

      {/* ======================================================
          FINAL PROOF
      ====================================================== */}

      <div
        className={`proof-result ${hasStrongEvidence
            ? "proof-verified"
            : "proof-partial"
          }`}
      >

        <div className="proof-result-icon">
          {hasStrongEvidence
            ? "🏆"
            : "📋"}
        </div>

        <div>

          <p className="section-label">
            LEARNING EVIDENCE
          </p>

          <h3>
            {hasStrongEvidence
              ? "Understanding demonstrated"
              : "Learning evidence recorded"}
          </h3>

          <p>
            {hasStrongEvidence
              ? `Your ${concept.title || concept.name} learning journey contains evidence across multiple assessment dimensions, including implementation and application.`
              : "Your assessment responses have been recorded as evidence of your learning."}
          </p>

        </div>

      </div>

    </section>
  );
}

export default ProofOfLearn;
