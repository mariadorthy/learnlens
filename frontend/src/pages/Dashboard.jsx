import { useEffect, useState } from "react";

import Roadmap from "../components/Roadmap";
import KnowledgeFingerprint from "../components/KnowledgeFingerprint";

function Dashboard({ concepts, student, onConceptSelect, refreshFingerprint }) {
  const [fingerprint, setFingerprint] = useState(null);
  const API_URL = import.meta.env.VITE_API_URL;

  // -----------------------------------------
  // LOAD KNOWLEDGE FINGERPRINT
  // -----------------------------------------

  useEffect(() => {
    if (!student?.id) {
      return;
    }

    fetch(
      `${API_URL}/fingerprint/${student.id}/loops`
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            "Failed to load knowledge fingerprint"
          );
        }

        return response.json();
      })
      .then((data) => {
        console.log(
          "Student fingerprint:",
          data.fingerprint
        );

        setFingerprint(data.fingerprint);
      })
      .catch((error) => {
        console.error(
          "Fingerprint error:",
          error
        );
      });
  }, [student, refreshFingerprint]);

  // -----------------------------------------
  // CALCULATE LOOP MASTERY
  // -----------------------------------------

  const MASTERY_THRESHOLD = 80;

const getLoopStatus = () => {
  if (!fingerprint) {
    return {
      status: "current",
      progress: 0,
    };
  }

  const dimensions = [
    "recall",
    "explain",
    "predict",
    "implement",
    "debug",
    "apply",
  ];

  const scores = dimensions.map((dimension) =>
    Number(fingerprint?.[dimension]?.score)
  );

  const attemptedScores = scores.filter((score) =>
    Number.isFinite(score)
  );

  if (attemptedScores.length === 0) {
    return {
      status: "current",
      progress: 0,
    };
  }

  const average =
    attemptedScores.reduce(
      (sum, score) => sum + score,
      0
    ) / attemptedScores.length;

  const allDimensionsAttempted =
    attemptedScores.length === dimensions.length;

  const mastered =
    allDimensionsAttempted &&
    attemptedScores.every(
      (score) => score >= MASTERY_THRESHOLD
    );

  console.log("LOOP MASTERY:", {
    scores,
    average,
    attempted: attemptedScores.length,
    required: dimensions.length,
    mastered,
  });

  return {
    status: mastered ? "completed" : "current",
    progress: Math.round(average),
  };
};

  const loopStatus = getLoopStatus();

  // -----------------------------------------
  // BUILD ADAPTIVE ROADMAP
  // -----------------------------------------

  const adaptiveConcepts = concepts.map((concept) => {
  // =========================================
  // AVAILABLE / WORKING CONCEPT
  // =========================================
  if (concept.id === "loops") {
    return {
      ...concept,
      status: loopStatus.status,
      progress: loopStatus.progress,
    };
  }

  // =========================================
  // CONCEPTS NOT IMPLEMENTED YET
  // =========================================
  if (
    concept.id === "variables" ||
    concept.id === "conditions" ||
    concept.id === "functions" ||
    concept.id === "lists"
  ) {
    return {
      ...concept,
      status: "locked",
      progress: 0,
      prerequisite: "assessment content",
    };
  }

  return concept;
});

  const currentConcept =
    adaptiveConcepts.find(
      (concept) =>
        concept.status === "current" ||
        concept.status === "reinforcement"
    );

  const masteredCount =
  adaptiveConcepts.filter(
    (concept) => concept.status === "completed"
  ).length;

  console.log(
  "FINAL ROADMAP STATUS:",
  adaptiveConcepts.map((concept) => ({
    id: concept.id,
    name: concept.name,
    status: concept.status,
    progress: concept.progress,
  }))
);

  return (
    <main className="dashboard">

      {/* HERO */}

      <section className="hero">
        <div>
          <p className="eyebrow">
            LEARNLENS • PERSONALIZED LEARNING
          </p>

          <h1>
            Learn what you need.
            <br />
            <span>Prove what you know.</span>
          </h1>

          <p className="hero-description">
            Your learning path adapts to your
            demonstrated understanding, not simply
            your lesson completion.
          </p>
        </div>

        <div className="learning-summary">
          <div className="summary-value">
            {masteredCount}
          </div>

          <div className="summary-label">
            Concepts mastered
          </div>
        </div>
      </section>

      {/* CONTINUE LEARNING */}

      {currentConcept && (
        <section className="current-learning">
          <div>
            <p className="section-label">
              {currentConcept.status ===
                "reinforcement"
                ? "REINFORCE THIS CONCEPT"
                : "CONTINUE LEARNING"}
            </p>

            <h2>
              {currentConcept.name}
            </h2>

            <p>
              {currentConcept.description}
            </p>
          </div>

          <button
            className="primary-button"
            onClick={() =>
              onConceptSelect(currentConcept)
            }
          >
            {currentConcept.status ===
              "reinforcement"
              ? "Practice →"
              : "Continue →"}
          </button>
        </section>
      )}

      {/* KNOWLEDGE FINGERPRINT */}


      <KnowledgeFingerprint
        fingerprint={fingerprint}
        topic="Loops"
      />

      {/* ADAPTIVE ROADMAP */}

      <Roadmap
        concepts={adaptiveConcepts}
        onConceptSelect={onConceptSelect}
      />

    </main>
  );
}

export default Dashboard;