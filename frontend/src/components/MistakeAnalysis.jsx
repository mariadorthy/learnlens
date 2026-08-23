function MistakeAnalysis({ analysis }) {
  if (!analysis) {
    return null;
  }

  return (
    <section className="mistake-analysis">

      <div className="section-heading">
        <div>
          <p className="section-label">
            AI MISTAKE ANALYSIS
          </p>

          <h2>
            Learn from your mistake
          </h2>
        </div>
      </div>

      <div className="analysis-card">

        <div className="analysis-type">
          <span>Mistake Type</span>

          <strong>
            {analysis.mistake_type}
          </strong>
        </div>

        <div className="analysis-block">
          <span>What happened?</span>

          <p>
            {analysis.explanation}
          </p>
        </div>

        <div className="analysis-block">
          <span>Possible misconception</span>

          <p>
            {analysis.misconception}
          </p>
        </div>

        <div className="analysis-block hint">
          <span>💡 Hint</span>

          <p>
            {analysis.hint}
          </p>
        </div>

        <div className="analysis-next">
          <span>Recommended next step</span>

          <p>
            {analysis.recommended_action}
          </p>
        </div>

      </div>

    </section>
  );
}

export default MistakeAnalysis;