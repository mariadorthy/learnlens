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
          const score = Number(
            questionScores?.[question.id] ?? 0
          );

          // IMPORTANT:
          // A question is completed ONLY when it has
          // reached mastery.
          const completed =
            completedIds?.has(question.id) &&
            score >= 80;

          const isCurrent =
            index === currentIndex;

          return (
            <div
              key={question.id}
              className={`
                question-box
                ${isCurrent ? "current" : ""}
                ${completed ? "completed" : ""}
              `}
              onClick={() => {
                // Never navigate into a mastered question.
                if (!completed) {
                  onSelectQuestion(index);
                }
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" ||
                  event.key === " "
                ) {
                  event.preventDefault();

                  if (!completed) {
                    onSelectQuestion(index);
                  }
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
                className={`
                  question-box-status
                  ${completed
                    ? ""
                    : score > 0
                      ? "needs-review"
                      : ""
                  }
                `}
              >
                {completed
                  ? "✓"
                  : score > 0
                    ? "Review"
                    : "—"}
              </div>

              {score > 0 && (
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