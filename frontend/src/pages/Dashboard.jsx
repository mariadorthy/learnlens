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

  const getAdaptiveStatus = (fingerprint) => {
    const scores = dimensions.map(({ key }) => {
      const data = fingerprint?.[key] ?? {};

      const total = Number(data.total) || 0;

      const score =
        data.score === null || data.score === undefined
          ? null
          : Number(data.score);

      return {
        dimension: key,
        total,
        score: Number.isFinite(score) ? score : null,

        // A dimension is complete only after 6 questions
        completed: total >= MASTERY_QUESTIONS,
      };
    });

    // First dimension that has not completed 6 questions
    const nextIncomplete = scores.find(
      (item) => !item.completed
    );

    // All six dimensions completed
    if (!nextIncomplete) {
      return {
        status: "completed",
        progress: 100,
        weakDimension: null,
        nextDimension: null,
        completedDimensions: dimensions.length,
      };
    }

    const completedDimensions = scores.filter(
      (item) => item.completed
    ).length;

    // Dimension has been started but has fewer than 6 questions
    const isPartial =
      nextIncomplete.total > 0 &&
      nextIncomplete.total < MASTERY_QUESTIONS;

    return {
      status: isPartial ? "reinforcement" : "current",
      progress: Math.round(
        (nextIncomplete.total / MASTERY_QUESTIONS) * 100
      ),

      // IMPORTANT:
      // An incomplete dimension is NOT weak yet.
      weakDimension: null,

      nextDimension: nextIncomplete.dimension,
      completedDimensions,
    };
  };

  // -----------------------------------------
  // LOOP STATUS
  // -----------------------------------------

  const loopStatus = getAdaptiveStatus(fingerprint);

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
    if (!currentConcept) return;

    const adaptiveDimension =
      currentConcept.nextDimension || "recall";

    const selectedConcept = {
      ...currentConcept,
      adaptiveDimension,
    };

    console.log("CONTINUE LEARNING:", selectedConcept);

    onConceptSelect(selectedConcept);
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

                {currentConcept.status === "reinforcement" && (
                  <>
                    {" "}
                    — complete the remaining questions.
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