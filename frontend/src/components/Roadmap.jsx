import ConceptCard from "./ConceptCard";

function Roadmap({
  concepts,
  onConceptSelect,
}) {
  const masteredCount =
    concepts.filter(
      (concept) =>
        concept.status === "completed"
    ).length;

  return (
    <section className="roadmap-section">

      <div className="section-heading">
        <div>
          <p className="section-label">
            YOUR LEARNING PATH
          </p>

          <h2>
            Python Fundamentals
          </h2>
        </div>

        <span className="roadmap-progress">
          {masteredCount} / {concepts.length}
          {" "}concepts mastered
        </span>
      </div>

      <div className="roadmap">

        {concepts.map(
          (concept, index) => (
            <div
              className="roadmap-item"
              key={concept.id}
            >
              <ConceptCard
                concept={concept}
                onClick={onConceptSelect}
              />

              {index <
                concepts.length - 1 && (
                <div className="roadmap-connector">
                  ↓
                </div>
              )}

            </div>
          )
        )}

      </div>
    </section>
  );
}

export default Roadmap;