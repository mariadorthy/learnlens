import { useEffect, useState } from "react";

import Roadmap from "../components/Roadmap";
import KnowledgeFingerprint from "../components/KnowledgeFingerprint";

function Dashboard({
  concepts,
  student,
  onConceptSelect,
  refreshFingerprint,
}) {
  const [fingerprint, setFingerprint] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL;

  // -----------------------------------------
  // DIMENSIONS
  // -----------------------------------------

  const dimensions = [
    {
      key: "recall",
      label: "Recall",
    },
    {
      key: "explain",
      label: "Explain",
    },
    {
      key: "predict",
      label: "Predict",
    },
    {
      key: "implement",
      label: "Implement",
    },
    {
      key: "debug",
      label: "Debug",
    },
    {
      key: "apply",
      label: "Apply",
    },
  ];

  const MASTERY_THRESHOLD = 80;
  const MASTERY_QUESTIONS = 6;

  // -----------------------------------------
  // LOAD KNOWLEDGE FINGERPRINT
  // -----------------------------------------

  useEffect(() => {
    if (!student?.id) {
      setFingerprint(null);
      return;
    }

    const loadFingerprint = async () => {
      try {
        const response = await fetch(
          `${API_URL}/fingerprint/${student.id}/loops`
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load knowledge fingerprint"
          );
        }

        const data = await response.json();

        console.log(
          "Student fingerprint:",
          data.fingerprint
        );

        setFingerprint(data.fingerprint ?? null);
      } catch (error) {
        console.error(
          "Fingerprint error:",
          error
        );

        setFingerprint(null);
      }
    };

    loadFingerprint();
  }, [student?.id, API_URL, refreshFingerprint]);

  // -----------------------------------------
  // GET ADAPTIVE STATUS
  // -----------------------------------------

  const getAdaptiveStatus = ({ fingerprint }) => {
    // =========================================================
    // NO FINGERPRINT
    // =========================================================
    if (!fingerprint) {
      return {
        status: "current",
        progress: 0,
        weakDimension: null,
        nextDimension: "recall",
        completedDimensions: 0,
      };
    }

    // =========================================================
    // BUILD DIMENSION STATE
    // =========================================================
    const scores = dimensions.map((dimension) => {
      const data = fingerprint?.[dimension.key];

      const rawScore = data?.score;
      const rawCorrect = data?.correct;
      const rawTotal = data?.total;

      const score =
        rawScore === null ||
          rawScore === undefined ||
          rawScore === ""
          ? null
          : Number(rawScore);

      const correct =
        rawCorrect === null ||
          rawCorrect === undefined
          ? 0
          : Number(rawCorrect);

      const total =
        rawTotal === null ||
          rawTotal === undefined
          ? 0
          : Number(rawTotal);

      const completed =
        total === MASTERY_QUESTIONS;

      return {
        dimension: dimension.key,
        score: Number.isFinite(score)
          ? score
          : null,
        correct: Number.isFinite(correct)
          ? correct
          : 0,
        total: Number.isFinite(total)
          ? total
          : 0,
        completed,
      };
    });

    console.log(
      "DIMENSION STATES:",
      scores
    );

    // =========================================================
    // COMPLETED DIMENSIONS
    // =========================================================
    const completedDimensions = scores.filter(
      (item) => item.completed
    );

    // =========================================================
    // IMPORTANT:
    //
    // Find the FIRST dimension that is NOT completed.
    //
    // This guarantees:
    //
    // Recall 2/6
    //   -> Recall remains next
    //
    // Recall 6/6
    //   -> Explain becomes next
    //
    // Recall 6/6
    // Explain 4/6
    //   -> Explain remains next
    // =========================================================
    const nextIncomplete = scores.find(
      (item) => !item.completed
    );

    // =========================================================
    // ALL SIX DIMENSIONS COMPLETE
    // =========================================================
    if (
      completedDimensions.length ===
      dimensions.length
    ) {
      return {
        status: "completed",
        progress: 100,
        weakDimension: null,
        nextDimension: null,
        completedDimensions:
          completedDimensions.length,
      };
    }

    // =========================================================
    // CURRENT DIMENSION
    // =========================================================
    if (nextIncomplete) {
      const isPartial =
        nextIncomplete.total > 0 &&
        nextIncomplete.total < MASTERY_QUESTIONS;

      return {
        status: isPartial
          ? "reinforcement"
          : "current",

        // Progress should represent question completion,
        // NOT score percentage.
        progress: Math.round(
          (nextIncomplete.total /
            MASTERY_QUESTIONS) *
          100
        ),

        weakDimension: isPartial
          ? nextIncomplete.dimension
          : null,

        nextDimension:
          nextIncomplete.dimension,

        completedDimensions:
          completedDimensions.length,
      };
    }

    // =========================================================
    // FALLBACK
    // =========================================================
    return {
      status: "current",
      progress: 0,
      weakDimension: null,
      nextDimension: "recall",
      completedDimensions:
        completedDimensions.length,
    };
  };

  // -----------------------------------------
  // LOOP STATUS
  // -----------------------------------------

  const loopStatus = getAdaptiveStatus({
    fingerprint,
  });

  console.log(
    "ADAPTIVE LOOP STATUS:",
    loopStatus
  );

  // -----------------------------------------
  // BUILD ADAPTIVE ROADMAP
  // -----------------------------------------

  const adaptiveConcepts = concepts.map(
    (concept) => {
      // =====================================
      // LOOPS
      // =====================================

      if (concept.id === "loops") {
        return {
          ...concept,
          status: loopStatus.status,
          progress: loopStatus.progress,
          weakDimension:
            loopStatus.weakDimension,
          nextDimension:
            loopStatus.nextDimension,
        };
      }

      // =====================================
      // LOCKED CONCEPTS
      // =====================================

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
          prerequisite:
            "assessment content",
        };
      }

      return concept;
    }
  );

  // -----------------------------------------
  // CURRENT CONCEPT
  // -----------------------------------------

  const currentConcept =
    adaptiveConcepts.find(
      (concept) =>
        concept.status === "current" ||
        concept.status === "reinforcement"
    );

  // -----------------------------------------
  // MASTERED COUNT
  // -----------------------------------------

  const masteredCount =
    adaptiveConcepts.filter(
      (concept) =>
        concept.status === "completed"
    ).length;

  // -----------------------------------------
  // CONTINUE HANDLER
  // -----------------------------------------

  const handleContinueLearning = () => {
    if (!currentConcept) {
      return;
    }

    const adaptiveDimension =
      currentConcept.nextDimension || "recall";

    console.log(
      "CONTINUE LEARNING:",
      {
        concept: currentConcept.id,
        status: currentConcept.status,
        weakDimension:
          currentConcept.weakDimension,
        nextDimension: adaptiveDimension,
      }
    );

    onConceptSelect({
      ...currentConcept,
      adaptiveDimension,
    });
  };

  // -----------------------------------------
  // DEBUG
  // -----------------------------------------

  console.log(
    "FINAL ROADMAP STATUS:",
    adaptiveConcepts.map(
      (concept) => ({
        id: concept.id,
        name: concept.name,
        status: concept.status,
        progress: concept.progress,
        weakDimension:
          concept.weakDimension,
        nextDimension:
          concept.nextDimension,
      })
    )
  );

  // -----------------------------------------
  // RENDER
  // -----------------------------------------

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
            <span>
              Prove what you know.
            </span>
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
    ? "CONTINUE THIS ASSESSMENT"
    : "CONTINUE LEARNING"}
</p>

            <h2>
              {currentConcept.name}
            </h2>

            <p>
              {currentConcept.description}
            </p>

            {currentConcept.nextDimension && (
              <p className="adaptive-next-step">
                Next{" "}
                <strong>
                  {currentConcept.nextDimension
                    .charAt(0)
                    .toUpperCase() +
                    currentConcept.nextDimension.slice(
                      1
                    )}
                </strong>

                {currentConcept.status ===
                  "reinforcement" && (
                    <>
                      {" "}
                      — this is currently your
                      weakest area.
                    </>
                  )}
              </p>
            )}
          </div>

          <button
            type="button"
            className="primary-button"
            onClick={
              handleContinueLearning
            }
          >
            {currentConcept.status ===
              "reinforcement"
              ? "Continue →"
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
        onConceptSelect={(concept) => {
          onConceptSelect({
            ...concept,
            adaptiveDimension:
              concept.nextDimension ||
              "recall",
          });
        }}
      />
    </main>
  );
}

export default Dashboard;