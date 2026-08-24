function KnowledgeFingerprint({ fingerprint, topic = "Loops" }) {
  const dimensions = [
    {
      key: "recall",
      label: "Recall",
    },
    {
      key: "explain",
      label: "Explain",
    },
    {
      key: "predict",
      label: "Predict",
    },
    {
      key: "implement",
      label: "Implement",
    },
    {
      key: "debug",
      label: "Debug",
    },
    {
      key: "apply",
      label: "Apply",
    },
  ];

  // Every dimension must contain 6 questions
  const REQUIRED_QUESTIONS = 6;

  const getStatus = (data, score) => {
    const total =
      Number(data?.total) ||
      Number(data?.questions) ||
      Number(data?.attempts) ||
      0;

    // ---------------------------------------------
    // Nothing attempted
    // ---------------------------------------------
    if (total === 0 || score === null || !Number.isFinite(score)) {
      return {
        className: "not-attempted",
        label: "Not attempted",
      };
    }

    // ---------------------------------------------
    // Assessment started but not all 6 completed
    // ---------------------------------------------
    if (total < REQUIRED_QUESTIONS) {
      return {
        className: "not-attempted",
        label: "Not completed",
      };
    }

    // ---------------------------------------------
    // Exactly 6 questions completed
    // Now we can determine mastery
    // ---------------------------------------------
    if (score >= 80) {
      return {
        className: "strong",
        label: "Strong",
      };
    }

    if (score >= 60) {
      return {
        className: "moderate",
        label: "Developing",
      };
    }

    return {
      className: "weak",
      label: "Weak",
    };
  };

  return (
    <section className="fingerprint-section">
      <div className="section-heading">
        <div>
          <p className="section-label">
            KNOWLEDGE FINGERPRINT
          </p>

          <div className="knowledge-fingerprint">
            <h2>
              How well do you understand {topic}?
            </h2>

            <div className="fingerprint-grid">
              {dimensions.map((dimension) => {
                const data =
                  fingerprint?.[dimension.key];

                const score =
                  data?.score !== null &&
                  data?.score !== undefined
                    ? Number(data.score)
                    : null;

                const safeScore =
                  score !== null &&
                  Number.isFinite(score)
                    ? Math.max(
                        0,
                        Math.min(100, score)
                      )
                    : null;

                const questions =
                  Number(data?.total) ||
                  Number(data?.questions) ||
                  Number(data?.attempts) ||
                  0;

                const status = getStatus(
                  data,
                  safeScore
                );

                // ---------------------------------------------
                // IMPORTANT:
                // Score can be displayed while incomplete,
                // but it is NOT mastery until 6 questions.
                // ---------------------------------------------
                const completed =
                  questions >= REQUIRED_QUESTIONS;

                return (
                  <div
                    key={dimension.key}
                    className="fingerprint-card"
                  >
                    <div className="fingerprint-card-top">
                      <span>
                        {dimension.label}
                      </span>

                      <span
                        className={`fingerprint-status ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </div>

                    <div className="fingerprint-score">
                      {safeScore !== null
                        ? `${safeScore}%`
                        : "—"}
                    </div>

                    <div className="fingerprint-bar">
                      <div
                        className="fingerprint-bar-fill"
                        style={{
                          width: `${
                            safeScore ?? 0
                          }%`,
                        }}
                      />
                    </div>

                    <p>
                      {questions} / {REQUIRED_QUESTIONS}{" "}
                      questions
                    </p>

                    {!completed &&
                      questions > 0 && (
                        <small>
                          Complete all 6 to determine
                          mastery
                        </small>
                      )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default KnowledgeFingerprint;