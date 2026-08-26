import AdaptiveChallenge from "./AdaptiveChallenge";

function ApplyAISection({
  analysis,
  question,
  analyzing,
  showAdaptiveChallenge,
  setShowAdaptiveChallenge,
}) {
  // ============================================================
  // ANALYZING
  // ============================================================

  if (analyzing) {
    return (
      <section className="mistake-analysis">
        <div className="analysis-card">
          <div className="ai-loading">
            🤖 Analyzing your implementation...
          </div>
        </div>
      </section>
    );
  }

  // ============================================================
  // NO ANALYSIS
  // ============================================================

  if (!analysis || typeof analysis !== "object") {
    return null;
  }

  // ============================================================
  // ADAPTIVE CHALLENGE
  // ============================================================

  if (showAdaptiveChallenge) {
    return (
      <AdaptiveChallenge
        weakness={
          analysis?.weakness || "general_implementation"
        }
        question={question}
        onBack={() => setShowAdaptiveChallenge(false)}
        onComplete={(challengeResult) => {
          console.log(
            "Adaptive challenge completed:",
            challengeResult
          );

          setShowAdaptiveChallenge(false);
        }}
      />
    );
  }
  // ============================================================
  // AI MISTAKE ANALYSIS
  // ============================================================

  return (
    <section className="mistake-analysis">
      <div className="section-heading">
        <div>
          <p className="section-label">
            AI MISTAKE ANALYSIS
          </p>

          <h2>Learn from your mistake</h2>
        </div>
      </div>

      <div className="analysis-card">
        {/* MISTAKE TYPE */}

        <div className="analysis-type">
          <span>Mistake Type</span>

          <strong>
            {analysis.mistakeType ||
              "Application mistake"}
          </strong>
        </div>

        {/* WHAT HAPPENED */}

        <div className="analysis-block">
          <span>What happened?</span>

          <p>
            {analysis.whatHappened ||
              "Your solution does not produce the required output yet."}
          </p>
        </div>

        {/* MISCONCEPTION */}

        <div className="analysis-block">
          <span>Possible misconception</span>

          <p>
            {analysis.misconception ||
              "Review the loop structure and output."}
          </p>
        </div>

        {/* HINT */}

        <div className="analysis-block hint">
          <span>💡 Hint</span>

          <p>
            {analysis.hint ||
              question?.hint ||
              "Review the problem requirements and try again."}
          </p>
        </div>

        {/* NEXT STEP */}

        <div className="analysis-next">
          <span>Recommended next step</span>

          <p>
            {analysis.recommendedNextStep ||
              "Fix this part of your solution and run it again."}
          </p>
        </div>

        {/* DETECTED WEAKNESS */}

        <div className="analysis-block">
          <span>Detected weakness</span>

          <p>
            {analysis.weakness ||
              "general_implementation"}
          </p>
        </div>
      </div>

      {/* PRACTICE BUTTON */}

      <button
        type="button"
        className="primary-button"
        onClick={() =>
          setShowAdaptiveChallenge(true)
        }
      >
        Practice Your Weakness
      </button>
    </section>
  );
}

export default ApplyAISection;