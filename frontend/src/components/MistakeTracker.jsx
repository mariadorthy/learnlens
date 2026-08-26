import { useEffect, useMemo, useState } from "react";

function MistakeTracker({
  student,
  concept,
}) {
  const [mistakes, setMistakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const API_URL = import.meta.env.VITE_API_URL;

  // ============================================================
  // LOAD MISTAKES
  // ============================================================

  useEffect(() => {
    if (!student?.id || !API_URL) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadMistakes = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/mistakes/${student.id}`
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load mistake history."
          );
        }

        const data = await response.json();

        if (cancelled) {
          return;
        }

        setMistakes(
          Array.isArray(data?.mistakes)
            ? data.mistakes
            : []
        );
      } catch (err) {
        console.error(
          "Failed to load mistake history:",
          err
        );

        if (!cancelled) {
          setError(
            "Could not load your mistake history."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadMistakes();

    return () => {
      cancelled = true;
    };
  }, [API_URL, student?.id]);

  // ============================================================
  // CURRENT CONCEPT
  // ============================================================

  const conceptMistakes = useMemo(() => {
    if (!concept?.id) {
      return mistakes;
    }

    const currentConcept = String(
      concept.id
    )
      .trim()
      .toLowerCase();

    return mistakes.filter((mistake) => {
      return (
        String(mistake.concept ?? "")
          .trim()
          .toLowerCase() === currentConcept
      );
    });
  }, [mistakes, concept?.id]);

  // ============================================================
  // SUMMARY
  // ============================================================

  const summary = useMemo(() => {
    const totalRecords =
      conceptMistakes.length;

    const totalAttempts =
      conceptMistakes.reduce(
        (total, mistake) =>
          total +
          Number(mistake.count ?? 0),
        0
      );

    const mostFrequent =
      [...conceptMistakes].sort(
        (a, b) =>
          Number(b.count ?? 0) -
          Number(a.count ?? 0)
      )[0] || null;

    return {
      totalRecords,
      totalAttempts,
      mostFrequent,
    };
  }, [conceptMistakes]);

  // ============================================================
  // DIMENSION BREAKDOWN
  // ============================================================

  const dimensionBreakdown = useMemo(() => {
    const dimensions = {};

    conceptMistakes.forEach((mistake) => {
      const dimension =
        mistake.dimension || "unknown";

      dimensions[dimension] =
        (dimensions[dimension] || 0) +
        Number(mistake.count ?? 0);
    });

    return Object.entries(dimensions)
      .sort(([, a], [, b]) => b - a);
  }, [conceptMistakes]);

  // ============================================================
  // FORMATTERS
  // ============================================================

  const formatLabel = (value) => {
    if (!value) {
      return "Unknown";
    }

    return String(value)
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) =>
        char.toUpperCase()
      );
  };

  const formatQuestionId = (value) => {
    if (!value) {
      return "—";
    }

    return String(value)
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (char) =>
        char.toUpperCase()
      );
  };

  const formatDate = (value) => {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleDateString(
      undefined,
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <section className="mistake-tracker">
        <div className="mistake-tracker-header">
          <span className="mistake-tracker-eyebrow">
            LEARNING ANALYSIS
          </span>

          <h2>
            Mistake Tracker
          </h2>

          <p>
            Loading your learning history...
          </p>
        </div>
      </section>
    );
  }

  // ============================================================
  // ERROR
  // ============================================================

  if (error) {
    return (
      <section className="mistake-tracker">
        <div className="mistake-tracker-header">
          <span className="mistake-tracker-eyebrow">
            LEARNING ANALYSIS
          </span>

          <h2>
            Mistake Tracker
          </h2>

          <div className="mistake-tracker-error">
            {error}
          </div>
        </div>
      </section>
    );
  }

  // ============================================================
  // EMPTY
  // ============================================================

  if (conceptMistakes.length === 0) {
    return (
      <section className="mistake-tracker">

        <div className="mistake-tracker-header">
          <span className="mistake-tracker-eyebrow">
            LEARNING ANALYSIS
          </span>

          <h2>
            Mistake Tracker
          </h2>

          <p>
            Your mistakes are recorded here to
            help you understand where to improve.
          </p>
        </div>

        <div className="mistake-empty">
          <div className="mistake-empty-icon">
            ✓
          </div>

          <h3>
            No mistakes recorded
          </h3>

          <p>
            Excellent work! You completed{" "}
            {concept?.title || "this concept"}{" "}
            without any recorded mistakes.
          </p>
        </div>

      </section>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <section className="mistake-tracker">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="mistake-tracker-header">

        <span className="mistake-tracker-eyebrow">
          LEARNING ANALYSIS
        </span>

        <h2>
          Mistake Tracker
        </h2>

        <p>
          A summary of the mistakes you made
          while learning{" "}
          <strong>
            {concept?.title || "this concept"}
          </strong>
          .
        </p>

      </div>

      {/* ======================================================
          SUMMARY
      ====================================================== */}

      <div className="mistake-summary-grid">

        <div className="mistake-summary-card">
          <div className="mistake-summary-top">
            <span className="mistake-summary-icon">
              ↻
            </span>
          </div>

          <strong>
            {summary.totalAttempts}
          </strong>

          <span>
            Total Attempts
          </span>
        </div>

        <div className="mistake-summary-card">
          <div className="mistake-summary-top">
            <span className="mistake-summary-icon">
              #
            </span>
          </div>

          <strong>
            {summary.totalRecords}
          </strong>

          <span>
            Mistake Records
          </span>
        </div>

        <div className="mistake-summary-card">
          <div className="mistake-summary-top">
            <span className="mistake-summary-icon">
              !
            </span>
          </div>

          <strong>
            {summary.mostFrequent?.count || 0}
          </strong>

          <span>
            Most Repeated
          </span>
        </div>

      </div>

      {/* ======================================================
          STAGE BREAKDOWN
      ====================================================== */}

      {dimensionBreakdown.length > 0 && (
        <div className="mistake-panel">

          <div className="mistake-panel-header">
            <div>
              <span className="mistake-panel-label">
                LEARNING JOURNEY
              </span>

              <h3>
                Mistakes by Stage
              </h3>
            </div>

            <p>
              Where corrections were needed most
            </p>
          </div>

          <div className="mistake-stage-list">

            {dimensionBreakdown.map(
              ([dimension, count]) => (
                <div
                  className="mistake-stage-row"
                  key={dimension}
                >

                  <div className="mistake-stage-name">
                    <span className="mistake-stage-dot" />

                    <strong>
                      {formatLabel(
                        dimension
                      )}
                    </strong>
                  </div>

                  <div className="mistake-stage-bar">
                    <span
                      style={{
                        width: `${Math.max(
                          8,
                          (count /
                            Math.max(
                              ...dimensionBreakdown.map(
                                ([, value]) =>
                                  value
                              )
                            )) *
                          100
                        )
                          }%`,
                      }}
                    />
                  </div>

                  <strong className="mistake-stage-count">
                    {count}
                  </strong>

                </div>
              )
            )}

          </div>

        </div>
      )}

      {/* ======================================================
          MOST FREQUENT
      ====================================================== */}

      {summary.mostFrequent && (
        <div className="mistake-highlight">

          <div className="mistake-highlight-icon">
            !
          </div>

          <div className="mistake-highlight-content">

            <span>
              MOST REPEATED MISTAKE
            </span>

            <h3>
              {formatLabel(
                summary.mostFrequent.mistake_type
              )}
            </h3>

            <p>
              Recorded{" "}
              <strong>
                {summary.mostFrequent.count}
              </strong>{" "}
              {summary.mostFrequent.count === 1
                ? "time"
                : "times"}.
            </p>

          </div>

        </div>
      )}

      {/* ======================================================
          HISTORY
      ====================================================== */}

      <div className="mistake-history">

        <div className="mistake-panel-header">
          <div>
            <span className="mistake-panel-label">
              HISTORY
            </span>

            <h3>
              Mistake History
            </h3>
          </div>

          <p>
            Your recorded mistakes for this
            concept
          </p>
        </div>

        <div className="mistake-table-wrapper">

          <table className="mistake-table">

            <thead>
              <tr>
                <th>Stage</th>
                <th>Question</th>
                <th>Mistake</th>
                <th>Attempts</th>
                <th>Last Seen</th>
              </tr>
            </thead>

            <tbody>

              {conceptMistakes.map(
                (mistake) => (
                  <tr key={mistake.id}>

                    <td>
                      <span
                        className={`mistake-stage-badge mistake-stage-${String(
                          mistake.dimension || "unknown"
                        ).toLowerCase()}`}
                      >
                        {formatLabel(
                          mistake.dimension
                        )}
                      </span>
                    </td>

                    <td>
                      <span className="mistake-question">
                        {formatQuestionId(
                          mistake.question_id
                        )}
                      </span>
                    </td>

                    <td>
                      <div className="mistake-type">

                        <strong>
                          {formatLabel(
                            mistake.mistake_type
                          )}
                        </strong>

                        {mistake.mistake_detail &&
                          mistake.mistake_detail !==
                          mistake.mistake_type && (
                            <span>
                              {mistake.mistake_detail}
                            </span>
                          )}

                      </div>
                    </td>

                    <td>
                      <span className="mistake-attempt-count">
                        {Number(
                          mistake.count ?? 0
                        )}
                      </span>
                    </td>

                    <td>
                      <span className="mistake-date">
                        {formatDate(
                          mistake.updated_at
                        )}
                      </span>
                    </td>

                  </tr>
                )
              )}

            </tbody>

          </table>

        </div>

      </div>

    </section>
  );
}

export default MistakeTracker;
