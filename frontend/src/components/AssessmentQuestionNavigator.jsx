function AssessmentQuestionNavigator({
  questions,
  currentIndex,
  completedIds,
  questionScores,
  onSelectQuestion,
}) {
  return (
    <div className="assessment-question-navigator">

      <div className="navigator-header">
        <strong>Your Questions</strong>

        <span>
          {completedIds.size} / {questions.length} completed
        </span>
      </div>

      <div className="navigator-row">
        {questions.map((question, index) => {
          const completed = completedIds.has(question.id);

          const score = questionScores[question.id];

          const needsReview =
            completed &&
            typeof score === "number" &&
            score < 70;

          const isCurrent = index === currentIndex;

          return (
            <div
              key={question.id}
              className={`question-box ${
                isCurrent ? "current" : ""
              } ${completed ? "completed" : ""}`}
              onClick={() => onSelectQuestion(index)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" ||
                  event.key === " "
                ) {
                  onSelectQuestion(index);
                }
              }}
            >
              <div className="question-box-number">
                {index + 1}
              </div>

              <div className="question-box-title">
                Question
              </div>

              <div
                className={`question-box-status ${
                  needsReview ? "needs-review" : ""
                }`}
              >
                {completed
                  ? needsReview
                    ? "Review"
                    : "✓"
                  : "—"}
              </div>

              {typeof score === "number" && (
                <div className="question-box-score">
                  {score}%
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AssessmentQuestionNavigator;