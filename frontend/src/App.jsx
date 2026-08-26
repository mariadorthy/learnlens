import { useState } from "react";

import Dashboard from "./pages/Dashboard";
import ConceptPage from "./pages/ConceptPage";
import LearningPage from "./pages/LearningPage";
import TheoryAssessment from "./pages/TheoryAssessment";
import ExplainAssessment from "./pages/ExplainAssessment";
import PredictAssessment from "./pages/PredictAssessment";
import ImplementAssessment from "./pages/ImplementAssessment";
import DebugAssessment from "./pages/DebugAssessment";
import ApplyAssessment from "./pages/ApplyAssessment";
import CompletionOverview from "./pages/CompletionOverview";
import AuthPage from "./pages/AuthPage";

import { roadmap as initialRoadmap } from "./data/roadmap";
import { concepts } from "./data/concepts";

// =============================================================
// STRENGTH CALCULATOR
// =============================================================

function getStrength(score, total) {
  // Nothing attempted
  if (total === 0) {
    return "Not attempted";
  }

  // Assessment has started but 6 questions are not completed
  if (total < 6) {
    return "Not completed";
  }

  // All 6 questions completed
  if (score >= 80) {
    return "Strong";
  }

  if (score >= 60) {
    return "Developing";
  }

  return "Weak";
}

// =============================================================
// MAIN APP
// =============================================================

function App() {
  // =========================================================
  // MAIN STATE
  // =========================================================

  const [selectedConcept, setSelectedConcept] = useState(null);

  const [refreshFingerprint, setRefreshFingerprint] =
    useState(0);

  const [roadmapState, setRoadmapState] =
    useState(initialRoadmap);

  const [selectedStudent, setSelectedStudent] =
    useState(null);

  // =========================================================
  // PAGE / ASSESSMENT STATES
  // =========================================================

  const [learning, setLearning] = useState(false);
  const [conceptPage, setConceptPage] = useState(false);
  const [explain, setExplain] = useState(false);
  const [theory, setTheory] = useState(false);
  const [predict, setPredict] = useState(false);
  const [coding, setCoding] = useState(false);
  const [debug, setDebug] = useState(false);
  const [apply, setApply] = useState(false);

  const [adaptiveMode, setAdaptiveMode] =
    useState(false);

  const [showCompletion, setShowCompletion] =
    useState(false);

  const [knowledgeFingerprint, setKnowledgeFingerprint] =
    useState({
      recall: {
        score: null,
        correct: 0,
        total: 0,
        strength: "Not attempted",
      },
      explain: {
        score: null,
        correct: 0,
        total: 0,
        strength: "Not attempted",
      },
      predict: {
        score: null,
        correct: 0,
        total: 0,
        strength: "Not attempted",
      },
      implement: {
        score: null,
        correct: 0,
        total: 0,
        strength: "Not attempted",
      },
      debug: {
        score: null,
        correct: 0,
        total: 0,
        strength: "Not attempted",
      },
      apply: {
        score: null,
        correct: 0,
        total: 0,
        strength: "Not attempted",
      },
    });

  // =========================================================
  // STUDENT SELECT
  // =========================================================

  const handleStudentSelect = (student) => {
    console.log(
      "SELECTED STUDENT FROM AUTH:",
      student
    );

    setSelectedStudent(student);
  };

  // =========================================================
  // RESET ALL PAGES
  // =========================================================

  const resetPages = () => {
    setLearning(false);
    setConceptPage(false);
    setTheory(false);
    setExplain(false);
    setPredict(false);
    setCoding(false);
    setDebug(false);
    setApply(false);
  };

  // =========================================================
  // ASSESSMENT COMPLETE
  // =========================================================

  const handleAssessmentComplete = (result) => {
    console.log("ASSESSMENT RESULT:", result);

    const {
      dimension,
      correct,
      total,
    } = result;

    const score =
      total > 0
        ? Math.round((correct / total) * 100)
        : 0;

    const strength = getStrength(score, total);

    setKnowledgeFingerprint((previous) => ({
      ...previous,
      [dimension]: {
        score,
        correct,
        total,
        strength,
      },
    }));

    setRefreshFingerprint(
      (previous) => previous + 1
    );
  };

  // =========================================================
  // SELECT CONCEPT
  // =========================================================

  const handleConceptSelect = (
    roadmapConcept,
    options = {}
  ) => {
    console.log(
      "SELECTED CONCEPT:",
      roadmapConcept
    );

    const detailedConcept =
      concepts[roadmapConcept.id];

    const adaptiveDimension =
      roadmapConcept.adaptiveDimension ||
      roadmapConcept.nextDimension ||
      "recall";

    const fullConcept = {
      ...detailedConcept,
      ...roadmapConcept,
      adaptiveDimension,
    };

    console.log(
      "FULL SELECTED CONCEPT:",
      fullConcept
    );

    setSelectedConcept(fullConcept);

    // -----------------------------------------
    // ADAPTIVE MODE
    // -----------------------------------------

    setAdaptiveMode(
      Boolean(
        roadmapConcept.adaptiveDimension ||
        roadmapConcept.nextDimension
      )
    );

    // -----------------------------------------
    // RESET PAGES
    // -----------------------------------------

    resetPages();
    setShowCompletion(false);

    // -----------------------------------------
    // CONTINUE → LEARN PAGE
    // -----------------------------------------

    if (options.startAt === "learning") {
      setAdaptiveMode(false);
      setLearning(true);
      setConceptPage(false);
    }
  };

  // =========================================================
  // START LEARNING
  // =========================================================

  const handleStartLearning = () => {
    if (!selectedConcept) {
      return;
    }

    setAdaptiveMode(false);

    setLearning(true);
    setConceptPage(false);
    setTheory(false);
    setExplain(false);
    setPredict(false);
    setCoding(false);
    setDebug(false);
    setApply(false);
  };

  const handleStartConcept = () => {
    if (!selectedConcept) {
      return;
    }

    setAdaptiveMode(false);

    setLearning(false);
    setConceptPage(true);
    setTheory(false);
    setExplain(false);
    setPredict(false);
    setCoding(false);
    setDebug(false);
    setApply(false);
  };

  // =========================================================
  // START THEORY
  // =========================================================

  const handleStartTheory = () => {
    if (!selectedConcept) {
      return;
    }

    setAdaptiveMode(false);

    setLearning(false);
    setConceptPage(false);
    setTheory(true);
    setExplain(false);
    setPredict(false);
    setCoding(false);
    setDebug(false);
    setApply(false);
  };

  // =========================================================
  // THEORY COMPLETE → EXPLAIN
  // =========================================================

  const handleStartExplain = () => {
    if (!selectedConcept) {
      return;
    }

    setLearning(false);
    setTheory(false);
    setExplain(true);
    setPredict(false);
    setCoding(false);
    setDebug(false);
    setApply(false);
  };

  // =========================================================
  // EXPLAIN COMPLETE → PREDICT
  // =========================================================

  const handleStartPredict = () => {
    if (!selectedConcept) {
      return;
    }

    setLearning(false);
    setTheory(false);
    setExplain(false);
    setPredict(true);
    setCoding(false);
    setDebug(false);
    setApply(false);
  };

  // =========================================================
  // PREDICT COMPLETE → IMPLEMENT
  // =========================================================

  const handleStartImplement = () => {
    if (!selectedConcept) {
      return;
    }

    setLearning(false);
    setTheory(false);
    setExplain(false);
    setPredict(false);
    setCoding(true);
    setDebug(false);
    setApply(false);
  };

  // =========================================================
  // IMPLEMENT COMPLETE → DEBUG
  // =========================================================

  const handleStartDebug = () => {
    if (!selectedConcept) {
      return;
    }

    setCoding(false);
    setDebug(true);
    setApply(false);
  };

  // =========================================================
  // DEBUG COMPLETE → APPLY
  // =========================================================

  const handleStartApply = () => {
    if (!selectedConcept) {
      return;
    }

    setLearning(false);
    setTheory(false);
    setExplain(false);
    setPredict(false);
    setCoding(false);
    setDebug(false);
    setApply(true);
  };

  // =========================================================
  // APPLY COMPLETE → COMPLETION OVERVIEW
  // =========================================================

  const handleApplyComplete = () => {
    if (!selectedConcept) {
      return;
    }

    const currentIndex =
      roadmapState.findIndex(
        (concept) =>
          concept.id === selectedConcept.id
      );

    if (currentIndex === -1) {
      return;
    }

    setRoadmapState((previousRoadmap) => {
      return previousRoadmap.map(
        (concept, index) => {
          // Current concept completed
          if (index === currentIndex) {
            return {
              ...concept,
              status: "completed",
              progress: 100,
            };
          }

          // Unlock next concept
          if (
            index === currentIndex + 1
          ) {
            return {
              ...concept,
              status: "current",
              progress: 0,
            };
          }

          return concept;
        }
      );
    });

    // Refresh dashboard
    setRefreshFingerprint(
      (previous) => previous + 1
    );

    // Close Apply
    setApply(false);

    // Open Completion Overview
    setShowCompletion(true);

    // IMPORTANT:
    // Do NOT clear selectedConcept.
    // CompletionOverview needs it.
  };

  // =========================================================
  // ADAPTIVE ASSESSMENT COMPLETE
  // =========================================================

  const REQUIRED_QUESTIONS = 6;

  const handleAdaptiveComplete = (result = {}) => {
    console.log(
      "ADAPTIVE ASSESSMENT COMPLETE:",
      result
    );

    const {
      dimension,
      correct,
      total,
    } = result;

    // -----------------------------------------
    // VALIDATION
    // -----------------------------------------

    if (
      !dimension ||
      typeof correct !== "number" ||
      typeof total !== "number"
    ) {
      console.warn(
        "Invalid adaptive assessment result:",
        result
      );
      return;
    }

    // -----------------------------------------
    // PROGRESS
    // -----------------------------------------

    const progress = Math.min(
      Math.round(
        (total / REQUIRED_QUESTIONS) * 100
      ),
      100
    );

    // -----------------------------------------
    // SCORE
    // -----------------------------------------

    const score =
      total > 0
        ? Math.round((correct / total) * 100)
        : null;

    // -----------------------------------------
    // STRENGTH
    // -----------------------------------------

    const strength =
      total >= REQUIRED_QUESTIONS
        ? getStrength(score, total)
        : "Not completed";

    const dimensionResult = {
      score,
      correct,
      total,
      progress,
      strength,
    };

    console.log(
      "DIMENSION RESULT:",
      {
        dimension,
        ...dimensionResult,
      }
    );

    // -----------------------------------------
    // UPDATE FINGERPRINT
    // -----------------------------------------

    const updatedFingerprint = {
      ...knowledgeFingerprint,
      [dimension]: dimensionResult,
    };

    setKnowledgeFingerprint(
      updatedFingerprint
    );

    setRefreshFingerprint(
      (previous) => previous + 1
    );

    // -----------------------------------------
    // NOT FINISHED YET
    // -----------------------------------------

    if (total < REQUIRED_QUESTIONS) {
      return;
    }

    // -----------------------------------------
    // CHECK ENTIRE CONCEPT
    // -----------------------------------------

    const dimensions = [
      "recall",
      "explain",
      "predict",
      "implement",
      "debug",
      "apply",
    ];

    const allDimensionsComplete =
      dimensions.every((key) => {
        const data =
          updatedFingerprint[key];

        return (
          data &&
          Number(data.total) >=
          REQUIRED_QUESTIONS
        );
      });

    console.log(
      "ALL DIMENSIONS COMPLETE:",
      allDimensionsComplete
    );

    // -----------------------------------------
    // ENTIRE CONCEPT COMPLETE
    // -----------------------------------------

    if (allDimensionsComplete) {
      console.log(
        "🎉 ENTIRE CONCEPT COMPLETED"
      );

      // Mark roadmap concept complete
      if (selectedConcept) {
        const currentIndex =
          roadmapState.findIndex(
            (concept) =>
              concept.id ===
              selectedConcept.id
          );

        if (currentIndex !== -1) {
          setRoadmapState(
            (previousRoadmap) =>
              previousRoadmap.map(
                (concept, index) => {

                  if (
                    index === currentIndex
                  ) {
                    return {
                      ...concept,
                      status:
                        "completed",
                      progress: 100,
                    };
                  }

                  if (
                    index ===
                    currentIndex + 1
                  ) {
                    return {
                      ...concept,
                      status: "current",
                      progress: 0,
                    };
                  }

                  return concept;
                }
              )
          );
        }
      }

      // Refresh dashboard data
      setRefreshFingerprint(
        (previous) => previous + 1
      );

      // Stop assessment
      setAdaptiveMode(false);
      resetPages();

      // IMPORTANT:
      // Keep selectedConcept!
      setShowCompletion(true);

      return;
    }

    // -----------------------------------------
    // CONCEPT NOT COMPLETE
    // -----------------------------------------

    setAdaptiveMode(false);
    resetPages();

    // Go back to dashboard so the next
    // adaptive dimension can be selected.
    setSelectedConcept(null);
  };

  // =========================================================
  // ADAPTIVE ASSESSMENT BACK
  // =========================================================

  const handleAdaptiveBack = () => {
    console.log(
      "BACK FROM ADAPTIVE ASSESSMENT"
    );

    setAdaptiveMode(false);
    resetPages();
    setSelectedConcept(null);
  };

  // =========================================================
  // BACK TO DASHBOARD
  // =========================================================

  const handleBack = () => {
    setSelectedConcept(null);
    setAdaptiveMode(false);
    resetPages();
    setShowCompletion(false);
  };

  const handleAdaptiveProgress = (progress = {}) => {
    console.log("ADAPTIVE PROGRESS RECEIVED:", progress);

    if (!progress.dimension) {
      return;
    }

    setKnowledgeFingerprint((previous) => ({
      ...previous,
      [progress.dimension]: {
        ...(previous[progress.dimension] || {}),
        score: progress.score ?? null,
        correct: progress.correct ?? 0,
        total: progress.total ?? 0,
        progress: progress.progress ?? 0,
        strength:
          progress.total >= 6
            ? getStrength(
              progress.score ?? 0,
              progress.total
            )
            : "Not completed",
      },
    }));

    setRefreshFingerprint(
      (previous) => previous + 1
    );
  };

  // =========================================================
  // SWITCH STUDENT
  // =========================================================

  const handleSwitchStudent = () => {
    setSelectedStudent(null);
    setSelectedConcept(null);
    setAdaptiveMode(false);
    resetPages();
    setShowCompletion(false);
  };

  // =========================================================
  // DEBUG APP STATE
  // =========================================================

  console.log("APP STATE:", {
    selectedStudent:
      selectedStudent?.id,

    selectedConcept:
      selectedConcept?.id,

    adaptiveMode,

    adaptiveDimension:
      selectedConcept?.adaptiveDimension,

    learning,
    theory,
    explain,
    predict,
    coding,
    debug,
    apply,
    showCompletion,

    knowledgeFingerprint,
  });

  // =========================================================
  // AUTH
  // =========================================================

  if (!selectedStudent) {
    return (
      <AuthPage
        onSelect={handleStudentSelect}
      />
    );
  }

  // =========================================================
  // MAIN APP
  // =========================================================

  return (
    <div className="app">
      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <header className="navbar">
        <button
          className="logo"
          type="button"
          onClick={handleBack}
        >
          <span className="logo-mark">
            L
          </span>

          <span>
            LearnLens
          </span>
        </button>

        <div className="navbar-right">
          <button
            type="button"
            className="switch-student-button"
            onClick={handleSwitchStudent}
          >
            Switch learner
          </button>

          <span className="student-label">
            {selectedStudent.name}
          </span>

          <div className="avatar">
            {selectedStudent.avatar}
          </div>
        </div>
      </header>
      {/* =====================================================
    PAGE ROUTING
===================================================== */}

      {/* -----------------------------------------------------
    1. ADAPTIVE ASSESSMENT
    Dashboard "Continue Learning" → directly to assessment
----------------------------------------------------- */}

      {adaptiveMode &&
        selectedConcept?.adaptiveDimension ? (

        <AdaptiveAssessment
          concept={selectedConcept}
          student={selectedStudent}
          onComplete={handleAdaptiveComplete}
          onProgress={handleAdaptiveProgress}
          onBack={handleAdaptiveBack}
        />

      ) : theory ? (

        /* -----------------------------------------------------
            2. THEORY
        ----------------------------------------------------- */

        <TheoryAssessment
          concept={selectedConcept}
          student={selectedStudent}
          onBack={() => {
            setTheory(false);
            setLearning(true);
          }}
          onComplete={(result = {}) => {
            console.log("THEORY COMPLETE:", result);

            setRefreshFingerprint(
              (previous) => previous + 1
            );

            handleStartExplain();
          }}
        />

      ) : explain ? (

        /* -----------------------------------------------------
            3. EXPLAIN
        ----------------------------------------------------- */

        <ExplainAssessment
          concept={selectedConcept}
          student={selectedStudent}
          onBack={() => {
            setExplain(false);
            setTheory(true);
          }}
          onComplete={handleStartPredict}
        />

      ) : predict ? (

        /* -----------------------------------------------------
            4. PREDICT
        ----------------------------------------------------- */

        <PredictAssessment
          concept={selectedConcept}
          student={selectedStudent}
          onBack={() => {
            setPredict(false);
            setExplain(true);
          }}
          onComplete={handleStartImplement}
        />

      ) : coding ? (

        /* -----------------------------------------------------
            5. IMPLEMENT
        ----------------------------------------------------- */

        <ImplementAssessment
          concept={selectedConcept}
          student={selectedStudent}
          onBack={() => {
            setCoding(false);
            setPredict(true);
          }}
          onComplete={handleStartDebug}
        />

      ) : debug ? (

        /* -----------------------------------------------------
            6. DEBUG
        ----------------------------------------------------- */

        <DebugAssessment
          concept={selectedConcept}
          student={selectedStudent}
          onBack={() => {
            setDebug(false);
            setCoding(true);
          }}
          onComplete={handleStartApply}
        />

      ) : apply ? (

        /* -----------------------------------------------------
            7. APPLY
        ----------------------------------------------------- */

        <ApplyAssessment
          concept={selectedConcept}
          student={selectedStudent}
          onBack={() => {
            setApply(false);
            setDebug(true);
          }}
          onComplete={handleApplyComplete}
        />

      ) : learning ? (

        <LearningPage
          concept={selectedConcept}
          onBack={() => {
            setLearning(false);
            setSelectedConcept(null);
          }}
          onStartConcept={handleStartConcept}
        />

      ) : conceptPage ? (

        <ConceptPage
          concept={selectedConcept}
          onBack={() => {
            setConceptPage(false);
            setSelectedConcept(null);
          }}
          onStartLearning={handleStartTheory}
        />

      ) : showCompletion ? (

        /* -----------------------------------------------------
            9. COMPLETION
        ----------------------------------------------------- */

        <CompletionOverview
          concept={selectedConcept}
          student={selectedStudent}
          onBackToDashboard={() => {
            setShowCompletion(false);
            setSelectedConcept(null);
          }}
        />

      ) : (

        /* -----------------------------------------------------
            11. DASHBOARD
        ----------------------------------------------------- */

        <Dashboard
          concepts={roadmapState}
          student={selectedStudent}
          knowledgeFingerprint={knowledgeFingerprint}
          onConceptSelect={handleConceptSelect}
          refreshFingerprint={refreshFingerprint}
        />
      )}
    </div>
  );
}

// =============================================================
// ADAPTIVE ASSESSMENT ROUTER
// =============================================================

function AdaptiveAssessment({
  concept,
  student,
  onComplete,
  onProgress,
  onBack,
}) {
  const dimension =
    concept?.adaptiveDimension;

  console.log(
    "ADAPTIVE ASSESSMENT:",
    dimension
  );

  // ===========================================================
  // RECALL
  // ===========================================================

  if (dimension === "recall") {
    return (
      <TheoryAssessment
        concept={concept}
        student={student}
        onComplete={onComplete}
        onProgress={onProgress}
        onBack={onBack}
      />
    );
  }

  // ===========================================================
  // EXPLAIN
  // ===========================================================

  if (dimension === "explain") {
    return (
      <ExplainAssessment
        concept={concept}
        student={student}
        onComplete={onComplete}
        onBack={onBack}
      />
    );
  }

  // ===========================================================
  // PREDICT
  // ===========================================================

  if (dimension === "predict") {
    return (
      <PredictAssessment
        concept={concept}
        student={student}
        onComplete={onComplete}
        onBack={onBack}
      />
    );
  }

  // ===========================================================
  // IMPLEMENT
  // ===========================================================

  if (dimension === "implement") {
    return (
      <ImplementAssessment
        concept={concept}
        student={student}
        onComplete={onComplete}
        onBack={onBack}
      />
    );
  }

  // ===========================================================
  // DEBUG
  // ===========================================================

  if (dimension === "debug") {
    return (
      <DebugAssessment
        concept={concept}
        student={student}
        onComplete={onComplete}
        onBack={onBack}
      />
    );
  }

  // ===========================================================
  // APPLY
  // ===========================================================

  if (dimension === "apply") {
    return (
      <ApplyAssessment
        concept={concept}
        student={student}
        onComplete={onComplete}
        onBack={onBack}
      />
    );
  }

  // ===========================================================
  // NO ASSESSMENT
  // ===========================================================

  return (
    <div className="adaptive-error">
      <h2>
        No assessment available
      </h2>

      <p>
        There is currently no assessment
        configured for this learning step.
      </p>

      <button
        type="button"
        onClick={onBack}
      >
        ← Back to Dashboard
      </button>
    </div>
  );
}

export default App;