import { useEffect, useState } from "react";

import Roadmap from "../components/Roadmap";
import KnowledgeFingerprint from "../components/KnowledgeFingerprint";

function Dashboard({
  concepts,
  student,
  knowledgeFingerprint,
  onConceptSelect,
  refreshFingerprint,
}) {
  const [fingerprint, setFingerprint] = useState(
    knowledgeFingerprint ?? null
  );
  useEffect(() => {
    if (knowledgeFingerprint) {
      console.log(
        "KNOWLEDGE FINGERPRINT RECEIVED:",
        knowledgeFingerprint
      );

      setFingerprint(knowledgeFingerprint);
    }
  }, [knowledgeFingerprint]);
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
          "================================="
        );
        console.log(
          "RAW FINGERPRINT FROM BACKEND:",
          JSON.stringify(
            data.fingerprint,
            null,
            2
          )
        );
        console.log(
          "RECALL FROM BACKEND:",
          data.fingerprint?.recall
        );
        console.log(
          "================================="
        );

        console.log(
          "Student fingerprint:",
          data.fingerprint
        );

        setFingerprint(
          data.fingerprint ?? knowledgeFingerprint ?? null
        );
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

      let totalQuestions =
        Number(data.question_count ?? data.total) || 0;

      if (key === "recall") {
        totalQuestions = 6;
      }

      const answered =
        Number(data.answered_count ?? 0) || 0;

      const mastered =
        Number(
          data.mastered_count ??
          data.correct ??
          0
        ) || 0;

      let score =
        data.score !== null &&
          data.score !== undefined
          ? Number(data.score)
          : null;

      // For Recall, score is progress toward mastering
      // all 6 questions.
      if (key === "recall" && totalQuestions > 0) {
        score = Math.round(
          (mastered / totalQuestions) * 100
        );
      }

      const progress =
        totalQuestions > 0
          ? Math.min(
            Math.round(
              (mastered / totalQuestions) * 100
            ),
            100
          )
          : 0;

      const completed =
        totalQuestions > 0 &&
        mastered >= totalQuestions;

      let strength = "Not attempted";

      if (answered > 0 && !completed) {
        strength = "Not completed";
      }

      if (completed) {
        if (score >= MASTERY_THRESHOLD) {
          strength = "Strong";
        } else if (score >= 60) {
          strength = "Developing";
        } else {
          strength = "Weak";
        }
      }

      return {
        dimension: key,
        total: totalQuestions,
        correct: mastered,
        progress,
        score,
        strength,
        completed,
      };
    });

    const nextIncomplete = scores.find(
      item => !item.completed
    );

    if (!nextIncomplete) {
      return {
        status: "completed",
        progress: 100,
        weakDimension: null,
        nextDimension: null,
        completedDimensions: dimensions.length,
        scores,
      };
    }

    const completedDimensions =
      scores.filter(
        item => item.completed
      ).length;

    const isPartial =
      nextIncomplete.answered > 0;

    return {
      status: isPartial
        ? "reinforcement"
        : "current",

      progress: nextIncomplete.progress,

      weakDimension: null,

      nextDimension:
        nextIncomplete.dimension,

      completedDimensions,

      scores,
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

    const selectedConcept = {
      ...currentConcept,
      adaptiveDimension: null,
      nextDimension: null,
    };

    console.log(
      "CONTINUE LEARNING → LEARN PAGE:",
      selectedConcept
    );

    onConceptSelect(
      selectedConcept,
      { startAt: "learning" }
    );
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
        student={student}
        topic="Loops"
      />

      {/* ADAPTIVE ROADMAP */}

      <Roadmap
        concepts={adaptiveConcepts}
        onConceptSelect={(concept) => {
          onConceptSelect({
            ...concept,
            adaptiveDimension: null,
            nextDimension: null,
          });
        }}
      />
    </main>
  );
}

export default Dashboard;