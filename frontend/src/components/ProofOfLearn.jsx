import { useState } from "react";

function ProofOfLearn({
  concept,
  onComplete,
}) {
  const [explanation, setExplanation] = useState("");
  const [prediction, setPrediction] = useState("");

  const [submitted, setSubmitted] =
    useState(false);

  const handleSubmit = () => {
    if (
      explanation.trim().length < 20 ||
      prediction.trim().length < 5
    ) {
      return;
    }

    setSubmitted(true);

    if (onComplete) {
      onComplete({
        explanation,
        prediction,
      });
    }
  };

  if (submitted) {
    return (
      <section className="proof-card">

        <div className="proof-success-icon">
          ✓
        </div>

        <p className="section-label">
          PROOF-OF-LEARN
        </p>

        <h2>
          Understanding evidence recorded
        </h2>

        <p>
          Your explanation and prediction have
          been captured as evidence of your
          understanding.
        </p>

        <div className="proof-evidence">

          <div>
            <span>✓</span>
            Explanation submitted
          </div>

          <div>
            <span>✓</span>
            Prediction submitted
          </div>

          <div>
            <span>✓</span>
            Learning evidence recorded
          </div>

        </div>

      </section>
    );
  }

  return (
    <section className="proof-card">

      <div className="proof-header">

        <div className="proof-number">
          04
        </div>

        <div>
          <p className="section-label">
            PROOF-OF-LEARN
          </p>

          <h2>
            Prove that you understand
            {concept
              ? ` ${concept.name}`
              : " the concept"}
          </h2>
        </div>

      </div>

      <p className="proof-intro">
        Getting the answer right is only one
        signal. Explain the idea and predict
        what happens in a new situation.
      </p>

      {/* =========================
          EXPLAIN
      ========================= */}

      <div className="proof-question">

        <div className="question-label">
          <span>01</span>

          <div>
            <strong>
              Explain
            </strong>

            <small>
              Can you explain the concept
              in your own words?
            </small>
          </div>
        </div>

        <textarea
          value={explanation}
          onChange={(event) =>
            setExplanation(
              event.target.value
            )
          }
          placeholder={
            "Explain how loops work and why " +
            "we use them..."
          }
        />

        <div className="character-count">
          {explanation.length} characters
        </div>

      </div>

      {/* =========================
          PREDICT
      ========================= */}

      <div className="proof-question">

        <div className="question-label">
          <span>02</span>

          <div>
            <strong>
              Predict
            </strong>

            <small>
              What will this code print?
            </small>
          </div>
        </div>

        <pre className="prediction-code">
{`for i in range(2, 5):
    print(i)`}
        </pre>

        <input
          value={prediction}
          onChange={(event) =>
            setPrediction(
              event.target.value
            )
          }
          placeholder="Write the expected output..."
        />

      </div>

      {/* =========================
          SUBMIT
      ========================= */}

      <button
        className="primary-button"
        onClick={handleSubmit}
        disabled={
          explanation.trim().length < 20 ||
          prediction.trim().length < 5
        }
      >
        Submit Proof of Understanding →
      </button>

      <p className="proof-note">
        Your response becomes evidence for
        your Knowledge Fingerprint.
      </p>

    </section>
  );
}

export default ProofOfLearn;