function LearningPage({
  concept,
  onBack,
  onStartTheory,
}) {

  if (!concept) {
    return (
      <main className="concept-page">
        <button
          className="back-button"
          onClick={onBack}
        >
          ← Back
        </button>

        <h1>Concept not found</h1>
      </main>
    );
  }

  return (
    <main className="concept-page">
      <button
        className="back-button"
        onClick={onBack}
      >
        ← Back
      </button>

      <p className="eyebrow">
        STEP 1 • LEARN
      </p>

      <h1>
        {concept.title || concept.name}
      </h1>

      <p className="concept-description">
        {concept.description}
      </p>

      <section className="learning-card">
        <h2>Understand the concept</h2>

        <p>
          {concept.explanation}
        </p>

        <h3>Example</h3>

        <h4>For Loop Example</h4>

        <pre>
          <code>
            {concept.examples?.forLoop}
          </code>
        </pre>

        <h4>While Loop Example</h4>

        <pre>
          <code>
            {concept.examples?.whileLoop}
          </code>
        </pre>

        <button
          type="button"
          className="primary-button"
          onClick={onStartTheory}
        >
          I understand — Test me →
        </button>
      </section>
    </main>
  );
}

export default LearningPage;