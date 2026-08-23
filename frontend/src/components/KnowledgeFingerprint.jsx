function KnowledgeFingerprint({ fingerprint }) {
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

  return (
    <section className="fingerprint-section">
      <div className="section-heading">
        <div>
          <p className="section-label">
            KNOWLEDGE FINGERPRINT
          </p>

          <h2>
            How well do you understand this concept?
          </h2>
        </div>
      </div>

      <div className="fingerprint-grid">
        {dimensions.map((dimension) => {
          const data = fingerprint?.[dimension.key];

          const score = data?.score ?? null;
          const status = data?.status ?? "not-attempted";
          const attempts = data?.attempts ?? 0;

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
                  className={`fingerprint-status ${status}`}
                >
                  {status === "strong"
                    ? "Strong"
                    : status === "moderate"
                    ? "Moderate"
                    : status === "weak"
                    ? "Weak"
                    : "Not attempted"}
                </span>
              </div>

              <div className="fingerprint-score">
                {score !== null
                  ? `${score}%`
                  : "—"}
              </div>

              <div className="fingerprint-bar">
                <div
                  className="fingerprint-bar-fill"
                  style={{
                    width: `${score ?? 0}%`,
                  }}
                />
              </div>

              <p>
                {attempts} attempt
                {attempts === 1 ? "" : "s"}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default KnowledgeFingerprint;