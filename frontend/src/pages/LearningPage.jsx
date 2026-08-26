function LearningPage({
  concept,
  onBack,
  onStartConcept,
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

        <h1>Concept not found</h1>
      </main>
    );
  }

  // -----------------------------------------
  // LEARNING PAGE
  // -----------------------------------------

  return (
    <main className="concept-page">

      {/* BACK */}

      <button
        type="button"
        className="back-button"
        onClick={onBack}
      >
        ← Back
      </button>

      {/* STEP */}

      <p className="eyebrow">
        STEP 1 • LEARN
      </p>

      {/* TITLE */}

      <h1>
        {concept.title || concept.name}
      </h1>

      {/* DESCRIPTION */}

      <p className="concept-description">
        {concept.description}
      </p>

      {/* LEARNING CONTENT */}

      <section className="learning-card">

        <h2>
          Understand the concept
        </h2>

        <p>
          {concept.explanation}
        </p>

        {/* EXAMPLES */}

        <h3>
          Example
        </h3>

        {/* FOR LOOP */}

        {concept.examples?.forLoop && (
          <>
            <h4>
              For Loop Example
            </h4>

            <pre>
              <code>
                {concept.examples.forLoop}
              </code>
            </pre>
          </>
        )}

        {/* WHILE LOOP */}

        {concept.examples?.whileLoop && (
          <>
            <h4>
              While Loop Example
            </h4>

            <pre>
              <code>
                {concept.examples.whileLoop}
              </code>
            </pre>
          </>
        )}

        {/* GO TO CONCEPT PAGE */}

        <button
          type="button"
          className="primary-button"
          onClick={onStartConcept}
        >
          I understand — Continue →
        </button>

      </section>
    </main>
  );
}

export default LearningPage;
