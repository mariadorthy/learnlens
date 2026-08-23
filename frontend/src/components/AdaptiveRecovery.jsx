import { useState } from "react";

function AdaptiveRecovery({
  weakness,
  concept,
  onComplete,
}) {
  const [stage, setStage] = useState("learn");
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [challengeResult, setChallengeResult] = useState(null);

  const challenge = weakness?.challenge;

  const checkChallenge = () => {
    if (selectedAnswer === null || !challenge) return;

    const correct =
      Number(selectedAnswer) === Number(challenge.correctAnswer);

    setChallengeResult(correct);

    if (correct) {
      setTimeout(() => {
        onComplete();
      }, 700);
    }
  };

  return (
    <div className="adaptive-recovery">

      {stage === "learn" && (
        <>
          <p className="section-label">
            ADAPTIVE LEARNING
          </p>

          <h2>
            Let's strengthen this idea
          </h2>

          {weakness?.explanation ? (
            <p>{weakness.explanation}</p>
          ) : (
            <p>
              Review the idea behind this question and
              try the challenge below.
            </p>
          )}

          {weakness?.example && (
            <pre className="theory-code">
              <code>{weakness.example}</code>
            </pre>
          )}

          <button
            type="button"
            className="primary-button"
            onClick={() => setStage("challenge")}
          >
            I understand — Try a challenge →
          </button>
        </>
      )}

      {stage === "challenge" && (
        <>
          <p className="section-label">
            ADAPTIVE CHALLENGE
          </p>

          <h2>
            {challenge?.question || "Try this challenge"}
          </h2>

          {challenge?.options?.map((option, index) => {
            const selected = selectedAnswer === index;

            return (
              <button
                key={index}
                type="button"
                className={
                  selected
                    ? "theory-option selected"
                    : "theory-option"
                }
                onClick={() => {
                  setSelectedAnswer(index);
                  setChallengeResult(null);
                }}
                disabled={challengeResult === true}
              >
                <span className="option-letter">
                  {String.fromCharCode(65 + index)}
                </span>

                <span className="option-text">
                  {option}
                </span>
              </button>
            );
          })}

          {challengeResult === false && (
            <p className="theory-result incorrect">
              ✕ Not quite. Try again.
            </p>
          )}

          {challengeResult === true && (
            <p className="theory-result correct">
              ✓ Excellent! Weakness strengthened.
            </p>
          )}

          <button
            type="button"
            className="primary-button"
            disabled={
              selectedAnswer === null ||
              challengeResult === true
            }
            onClick={checkChallenge}
          >
            Check Challenge →
          </button>
        </>
      )}
    </div>
  );
}

export default AdaptiveRecovery;