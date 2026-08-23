import { useEffect, useState } from "react";
import { adaptiveChallenges } from "../services/adaptiveChallenges";

function AdaptiveChallenge({
  weakness,
  question,
  onBack,
  onComplete,
}) {
  console.log("ADAPTIVE WEAKNESS:", weakness);
  console.log(
    "AVAILABLE CHALLENGES:",
    Object.keys(adaptiveChallenges)
  );

  if (!question?.id) {
    return (
      <div className="adaptive-challenge">
        <button
          type="button"
          className="back-button"
          onClick={onBack}
        >
          ← Back
        </button>

        <h2>Adaptive challenge unavailable</h2>
        <p>The current question could not be identified.</p>
      </div>
    );
  }

  const normalizedWeakness =
  typeof weakness === "string"
    ? weakness.toLowerCase().trim()
    : "";

const weaknessAliases = {
  loop_syntax: "python_syntax",
};

const challengeWeakness =
  weaknessAliases[normalizedWeakness] ||
  normalizedWeakness;

  const questionSpecificKey =
    `${question.id}_${normalizedWeakness}`;

 const challenge =
  adaptiveChallenges[questionSpecificKey] ??
  adaptiveChallenges[normalizedWeakness] ??
  adaptiveChallenges[challengeWeakness] ??
  adaptiveChallenges.general_implementation ??
  null;

  console.log("ADAPTIVE CHALLENGE KEY:", questionSpecificKey);
  console.log("SELECTED ADAPTIVE CHALLENGE:", challenge);

  if (!challenge) {
    return (
      <div className="adaptive-challenge">
        <button
          type="button"
          className="back-button"
          onClick={onBack}
        >
          ← Back
        </button>

        <h2>Practice challenge unavailable</h2>

        <p>
          No adaptive challenge exists for:
          <strong> {normalizedWeakness || "unknown weakness"}</strong>
        </p>

        <p>
          Available challenges:
        </p>

        <pre>
          {Object.keys(adaptiveChallenges).join("\n")}
        </pre>
      </div>
    );
  }

  const [code, setCode] = useState(
    challenge.starterCode || ""
  );

  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  useEffect(() => {
    setCode(challenge.starterCode || "");
    setSubmitted(false);
    setIsCorrect(false);
  }, [challenge.id]);

  const checkAnswer = () => {
    const correct = challenge.check(code);

    setIsCorrect(correct);
    setSubmitted(true);

    if (correct) {
      onComplete({
        success: true,
        challengeId: challenge.id,
        weakness: challenge.weakness,
      });
    }
  };

  return (
    <div className="adaptive-challenge">
      <button
        type="button"
        className="back-button"
        onClick={onBack}
      >
        ← Back
      </button>

      <p className="section-label">
        PRACTICE YOUR WEAKNESS
      </p>

      <h2>{challenge.title}</h2>

      <p>{challenge.instruction}</p>

      <p>Your program should produce:</p>

      <pre>{challenge.expectedOutput}</pre>

      <label htmlFor="adaptive-code">
        YOUR CODE
      </label>

      <textarea
        id="adaptive-code"
        value={code}
        onChange={(event) => {
          setCode(event.target.value);
          setSubmitted(false);
          setIsCorrect(false);
        }}
        spellCheck="false"
        className="implementation-editor"
      />

      <button
        type="button"
        className="primary-button"
        onClick={checkAnswer}
      >
        Check Solution
      </button>

      {submitted && !isCorrect && (
        <div className="implement-result error">
          <strong>Not quite</strong>

          <p>
            Your solution does not fix the weakness yet.
          </p>

          <p>
            <strong>Hint:</strong> {challenge.hint}
          </p>
        </div>
      )}
    </div>
  );
}

export default AdaptiveChallenge;