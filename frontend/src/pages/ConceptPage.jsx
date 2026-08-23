function ConceptPage({ concept, onBack, onStartLearning }) {
  if (!concept) {
    return (
      <main className="concept-page">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>

        <h1>Concept not found</h1>
      </main>
    );
  }

  return (
    <main className="concept-page">
      <button className="back-button" onClick={onBack}>
        ← Back to roadmap
      </button>

      <section className="concept-hero">
        <div>
          <p className="eyebrow">
            {concept.level.toUpperCase()}
          </p>

          <h1>{concept.name}</h1>

          <p className="concept-description">
            {concept.description}
          </p>
        </div>

        <div className="concept-progress-card">
          <span>Your current progress</span>

          <strong>{concept.progress}%</strong>

          <div className="progress-container">
            <div
              className="progress-bar"
              style={{
                width: `${concept.progress}%`,
              }}
            />
          </div>
        </div>
      </section>

      <section className="learning-card">
        <div className="learning-card-header">
          <span className="learning-number">01</span>

          <div>
            <p className="section-label">LEARN</p>
            <h2>Build your understanding</h2>
          </div>
        </div>

        <p>
          Learn the core ideas behind{" "}
          {concept.name.toLowerCase()}, then demonstrate your
          understanding through theory and coding challenges.
        </p>

        <div className="learning-stages">
          <div>
            <span>01</span>
            <strong>Learn</strong>
            <small>Understand the concept</small>
          </div>

          <div>
            <span>02</span>
            <strong>Attempt</strong>
            <small>Test your understanding</small>
          </div>

          <div>
            <span>03</span>
            <strong>Prove</strong>
            <small>Demonstrate mastery</small>
          </div>
        </div>

        <button
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