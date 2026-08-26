function ConceptCard({ concept, onClick }) {
  const isLocked = concept.status === "locked";

  const statusText = {
    completed: "Mastered",
    current: "Continue Learning",
    locked: concept.available === false
      ? "Coming Soon"
      : `Complete ${concept.prerequisite || "previous topics"} first`,
    reinforcement: "Needs Reinforcement",
  };

  const statusIcon = {
    completed: "✓",
    current: "→",
    locked: "🔒",
    reinforcement: "↻",
  };

  return (
    <button
      className={`concept-card ${concept.status}`}
      onClick={() => !isLocked && onClick(concept)}
      disabled={isLocked}
    >
      <div className="concept-card-top">
        <span className="concept-icon">
          {statusIcon[concept.status]}
        </span>

        <span className="concept-level">
          {concept.level}
        </span>
      </div>

      <h3>{concept.name}</h3>

      <p>{concept.description}</p>

      <div className="concept-card-bottom">
        <span>{statusText[concept.status]}</span>

        {concept.status !== "locked" && (
          <span className="concept-arrow">→</span>
        )}
      </div>

      {concept.status !== "locked" && (
        <div className="progress-container">
          <div
            className="progress-bar"
            style={{ width: `${concept.progress}%` }}
          />
        </div>
      )}
    </button>
  );
}

export default ConceptCard;