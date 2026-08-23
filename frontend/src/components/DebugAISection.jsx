import MistakeAnalysis from "./MistakeAnalysis";
import AdaptiveChallenge from "./AdaptiveChallenge";

function DebugAISection({
  analysis,
    question,
  showAdaptiveChallenge,
  setShowAdaptiveChallenge,
}) {
  if (!analysis) {
    return null;
  }

  return (
    <section className="debug-ai-section">

      <MistakeAnalysis analysis={analysis} />

      {!showAdaptiveChallenge && (
        <button
          type="button"
          className="primary-button"
          onClick={() => setShowAdaptiveChallenge(true)}
          style={{ marginTop: "20px" }}
        >
          Practice My Weakness →
        </button>
      )}

      {showAdaptiveChallenge && (
        <AdaptiveChallenge
          weakness={analysis?.weakness}
            question={question}
          onBack={() => setShowAdaptiveChallenge(false)}
          onComplete={(adaptiveResult) => {
            console.log(
              "Adaptive debug challenge completed:",
              adaptiveResult
            );

            setShowAdaptiveChallenge(false);
          }}
        />
      )}

    </section>
  );
}

export default DebugAISection;