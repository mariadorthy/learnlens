function KnowledgeFingerprint({
  fingerprint,
  topic = "Loops",
}) {
  const dimensions = [
    { key: "recall", label: "Recall" },
    { key: "explain", label: "Explain" },
    { key: "predict", label: "Predict" },
    { key: "implement", label: "Implement" },
    { key: "debug", label: "Debug" },
    { key: "apply", label: "Apply" },
  ];

  // Loops has exactly 6 recall questions.
  const REQUIRED_QUESTIONS = 6;

  const getStatus = (
    completedQuestions,
    totalQuestions,
    score
  ) => {
    if (
      completedQuestions === 0 ||
      score === null ||
      !Number.isFinite(score)
    ) {
      return {
        className: "not-attempted",
        label: "Not attempted",
      };
    }

    if (completedQuestions < totalQuestions) {
      return {
        className: "not-attempted",
        label: "Not completed",
      };
    }

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
                  fingerprint?.[dimension.key] ?? {};

                const rawScore =
                  data.score !== null &&
                    data.score !== undefined
                    ? Number(data.score)
                    : null;

                // completed_count = MASTERED questions
                const completedQuestions = Math.max(
                  0,
                  Number(
                    data.mastered_count ??
                    data.completed_count ??
                    0
                  )
                );

                // Total questions
                let totalQuestions = Number(
                  data.question_count ??
                  data.progress?.total ??
                  REQUIRED_QUESTIONS
                );

                // Recall for Loops always has 6 questions
                if (
                  dimension.key === "recall" &&
                  topic === "Loops"
                ) {
                  totalQuestions = Math.max(
                    REQUIRED_QUESTIONS,
                    totalQuestions
                  );
                }

                if (totalQuestions <= 0) {
                  totalQuestions = REQUIRED_QUESTIONS;
                }

                const safeCompleted = Math.min(
                  completedQuestions,
                  totalQuestions
                );

                // Prefer backend score.
                // Fallback to completed/total.
                const safeScore =
                  rawScore !== null &&
                    Number.isFinite(rawScore)
                    ? Math.min(100, Math.max(0, rawScore))
                    : Math.round(
                      (safeCompleted / totalQuestions) * 100
                    );

                const status = getStatus(
                  safeCompleted,
                  totalQuestions,
                  safeScore
                );

                const completed =
                  safeCompleted >= totalQuestions;

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
                          width: `${safeScore ?? 0}%`,
                        }}
                      />
                    </div>

                    <p>
                      {safeCompleted} /{" "}
                      {totalQuestions} questions
                    </p>

                    {!completed &&
                      completedQuestions > 0 && (
                        <small>
                          Complete all{" "}
                          {totalQuestions} to determine
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