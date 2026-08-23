function AssessmentReview({
  questions,
  questionScores,
  onRedo,
  onClose,
}) {
  return (
    <div className="assessment-review">
      <div className="assessment-review-header">
        <div>
          <h2>Review your answers</h2>
          <p>
            Revisit questions where you want to improve
            your score.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
        >
          Close
        </button>
      </div>

      <div className="assessment-review-list">
        {questions.map((question, index) => {
          const score = questionScores[question.id];

          const needsRedo =
            typeof score === "number" &&
            score < 70;

          return (
            <div
              key={question.id}
              className="assessment-review-item"
            >
              <div>
                <strong>
                  Question {index + 1}
                </strong>

                <span>
                  {question.title}
                </span>
              </div>

              <div>
                <strong>
                  {score ?? 0}%
                </strong>

                {needsRedo ? (
                  <button
                    type="button"
                    onClick={() => onRedo(index)}
                  >
                    Redo
                  </button>
                ) : (
                  <span>
                    ✓ Completed
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}