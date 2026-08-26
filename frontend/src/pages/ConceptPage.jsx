function ConceptPage({
  concept,
  onBack,
  onStartLearning,
}) {
  // -----------------------------------------
  // SAFETY CHECK
  // -----------------------------------------

  if (!concept) {
    return (
      <main className="concept-page">

        <button
          type="button"
          className="back-button"
          onClick={onBack}
        >
          ← Back
        </button>

        <h1>
          Concept not found
        </h1>

      </main>
    );
  }

  // -----------------------------------------
  // CONCEPT PAGE
  // -----------------------------------------

  return (
    <main className="concept-page">

      {/* BACK TO DASHBOARD */}

      <button
        type="button"
        className="back-button"
        onClick={onBack}
      >
        ← Back to roadmap
      </button>

      {/* CONCEPT HEADER */}

      <section className="concept-hero">

        <div>

          <p className="eyebrow">
            {concept.level
              ? concept.level.toUpperCase()
              : "CONCEPT"}
          </p>

          <h1>
            {concept.name}
          </h1>

          <p className="concept-description">
            {concept.description}
          </p>

        </div>

        {/* PROGRESS */}

        <div className="concept-progress-card">

          <span>
            Your current progress
          </span>

          <strong>
            {concept.progress ?? 0}%
          </strong>

          <div className="progress-container">

            <div
              className="progress-bar"
              style={{
                width: `${concept.progress ?? 0}%`,
              }}
            />

          </div>

        </div>

      </section>

      {/* LEARNING CARD */}

      <section className="learning-card">

        <div className="learning-card-header">

          <span className="learning-number">
            01
          </span>

          <div>

            <p className="section-label">
              LEARN
            </p>

            <h2>
              Build your understanding
            </h2>

          </div>

        </div>

        <p>
          Learn the core ideas behind{" "}
          {concept.name.toLowerCase()}, then
          demonstrate your understanding through
          theory and coding challenges.
        </p>

        {/* STAGES */}

        <div className="learning-stages">

          <div>
            <span>
              01
            </span>

            <strong>
              Learn
            </strong>

            <small>
              Understand the concept
            </small>
          </div>

          <div>
            <span>
              02
            </span>

            <strong>
              Attempt
            </strong>

            <small>
              Test your understanding
            </small>
          </div>

          <div>
            <span>
              03
            </span>

            <strong>
              Prove
            </strong>

            <small>
              Demonstrate mastery
            </small>
          </div>

        </div>

        {/* START THEORY */}

        <button
          type="button"
          className="primary-button"
          onClick={onStartLearning}
        >
          Start Learning →
        </button>

      </section>

    </main>
  );
}

export default ConceptPage;
