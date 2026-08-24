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

function getStrength(score, total) {
  // Nothing attempted
  if (
    total === 0 ||
    score === null ||
    score === undefined
  ) {
    return "Not attempted";
  }

  // Dimension has been started but 6 questions
  // have NOT been completed yet.
  if (total < 6) {
    return "Not completed";
  }

  // Dimension is complete only at 6/6
  if (score >= 80) {
    return "Strong";
  }

  if (score >= 60) {
    return "Developing";
  }

  return "Weak";
}

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
    setTheory(false);
    setExplain(false);
    setPredict(false);
    setCoding(false);
    setDebug(false);
    setApply(false);
  };

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

  const handleConceptSelect = (roadmapConcept) => {
    console.log(
      "SELECTED CONCEPT:",
      roadmapConcept
    );

    console.log(
      "ADAPTIVE DIMENSION:",
      roadmapConcept.adaptiveDimension
    );

    // Get detailed concept information
    const detailedConcept =
      concepts[roadmapConcept.id];

    const fullConcept = {
      ...roadmapConcept,
      ...detailedConcept,
    };

    setSelectedConcept(fullConcept);

    // If Dashboard supplied an adaptive dimension,
    // we enter adaptive assessment mode.
    setAdaptiveMode(
      Boolean(roadmapConcept.adaptiveDimension)
    );

    resetPages();

    setShowCompletion(false);
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

    setLearning(false);
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
  // NORMAL FULL ASSESSMENT COMPLETE
  // =========================================================

  const handleCodingComplete = () => {
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
      const updatedRoadmap =
        previousRoadmap.map(
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

      return updatedRoadmap;
    });

    // Refresh fingerprint
    setRefreshFingerprint(
      (previous) => previous + 1
    );

    // Close Apply
    setApply(false);

    // Show completion page
    setShowCompletion(true);

    // Do not clear selectedConcept
    // CompletionOverview needs it.
  };


  // =========================================================
  // ADAPTIVE ASSESSMENT COMPLETE
  // =========================================================

  const REQUIRED_QUESTIONS = 6;

const handleAdaptiveComplete = (result) => {
  console.log(
    "ADAPTIVE ASSESSMENT COMPLETE:",
    result
  );

  const {
    dimension,
    correct,
    total,
  } = result;

  // ---------------------------------------------------------
  // SAFETY CHECK
  // A dimension is NOT completed until all 6 questions
  // have been answered.
  // ---------------------------------------------------------
  if (total !== REQUIRED_QUESTIONS) {
    console.warn(
      `Dimension ${dimension} is not complete: ${total}/${REQUIRED_QUESTIONS}`
    );

    // Do NOT move to the next dimension.
    // Do NOT mark the dimension as completed.
    return;
  }

  // ---------------------------------------------------------
  // CALCULATE FINAL SCORE
  // ---------------------------------------------------------
  const score = Math.round(
    (correct / REQUIRED_QUESTIONS) * 100
  );

  const strength = getStrength(
    score,
    total
  );

  console.log("COMPLETED DIMENSION:", {
    dimension,
    correct,
    total,
    score,
    strength,
  });

  // ---------------------------------------------------------
  // SAVE COMPLETED DIMENSION
  // ---------------------------------------------------------
  setKnowledgeFingerprint((previous) => ({
    ...previous,
    [dimension]: {
      score,
      correct,
      total,
      strength,
    },
  }));

  // ---------------------------------------------------------
  // REFRESH DASHBOARD FINGERPRINT
  // ---------------------------------------------------------
  setRefreshFingerprint(
    (previous) => previous + 1
  );

  // ---------------------------------------------------------
  // LEAVE ADAPTIVE ASSESSMENT
  // ---------------------------------------------------------
  setAdaptiveMode(false);
  resetPages();
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
            onClick={
              handleSwitchStudent
            }
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
          1. NORMAL IMPLEMENT
      ----------------------------------------------------- */}

      {coding ? (

        <ImplementAssessment
          concept={selectedConcept}
          student={selectedStudent}

          onBack={() => {
            setCoding(false);
            setPredict(true);
          }}

          onComplete={
            handleStartDebug
          }
        />

      ) :


        /* -----------------------------------------------------
            2. NORMAL THEORY
        ----------------------------------------------------- */

        theory ? (

          <TheoryAssessment
            concept={selectedConcept}
            student={selectedStudent}

            onBack={() => {
              setTheory(false);
              setLearning(true);
            }}

            onComplete={() => {
              setRefreshFingerprint(
                (previous) =>
                  previous + 1
              );

              handleStartExplain();
            }}
          />

        ) :


          /* -----------------------------------------------------
              3. NORMAL DEBUG
          ----------------------------------------------------- */

          debug ? (

            <DebugAssessment
              concept={selectedConcept}
              student={selectedStudent}

              onBack={() => {
                setDebug(false);
                setCoding(true);
              }}

              onComplete={
                handleStartApply
              }
            />

          ) :


            /* -----------------------------------------------------
                4. NORMAL EXPLAIN
            ----------------------------------------------------- */

            explain ? (

              <ExplainAssessment
                concept={selectedConcept}
                student={selectedStudent}

                onBack={() => {
                  setExplain(false);
                  setTheory(true);
                }}

                onComplete={
                  handleStartPredict
                }
              />

            ) :


              /* -----------------------------------------------------
                  5. NORMAL APPLY
              ----------------------------------------------------- */

              apply ? (

                <ApplyAssessment
                  concept={selectedConcept}
                  student={selectedStudent}

                  onBack={() => {
                    setApply(false);
                    setDebug(true);
                  }}

                  onComplete={
                    handleCodingComplete
                  }
                />

              ) :


                /* -----------------------------------------------------
                    6. NORMAL PREDICT
                ----------------------------------------------------- */

                predict ? (

                  <PredictAssessment
                    concept={selectedConcept}
                    student={selectedStudent}

                    onBack={() => {
                      setPredict(false);
                      setExplain(true);
                    }}

                    onComplete={
                      handleStartImplement
                    }
                  />

                ) :


                  /* =====================================================
                     7. ADAPTIVE ASSESSMENT
                     ===================================================== */

                  adaptiveMode &&
                    selectedConcept?.id === "loops" ? (

                    <AdaptiveAssessment
                      concept={selectedConcept}
                      student={selectedStudent}
                      onComplete={
                        handleAdaptiveComplete
                      }
                      onBack={
                        handleAdaptiveBack
                      }
                    />

                  ) :


                    /* -----------------------------------------------------
                        8. LEARNING PAGE
                    ----------------------------------------------------- */

                    learning ? (

                      <LearningPage
                        concept={selectedConcept}

                        onBack={() => {
                          setLearning(false);
                        }}

                        onStartTheory={
                          handleStartTheory
                        }
                      />

                    ) :


                      /* -----------------------------------------------------
                          9. COMPLETION OVERVIEW
                      ----------------------------------------------------- */

                      showCompletion ? (

                        <CompletionOverview
                          concept={selectedConcept}
                          student={selectedStudent}

                          onBackToDashboard={() => {
                            setShowCompletion(false);
                            setSelectedConcept(null);
                          }}
                        />

                      ) :


                        /* -----------------------------------------------------
                            10. CONCEPT PAGE
                        ----------------------------------------------------- */

                        selectedConcept ? (

                          <ConceptPage
                            concept={selectedConcept}

                            onBack={handleBack}

                            onStartLearning={
                              handleStartLearning
                            }
                          />

                        ) :


                          /* -----------------------------------------------------
                              11. DASHBOARD
                          ----------------------------------------------------- */

                          (

                            <Dashboard
                              concepts={roadmapState}
                              student={selectedStudent}

                              onConceptSelect={
                                handleConceptSelect
                              }
                              knowledgeFingerprint={knowledgeFingerprint}


                              refreshFingerprint={
                                refreshFingerprint
                              }
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

        onComplete={
          onComplete
        }

        onBack={
          onBack
        }
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

        onComplete={
          onComplete
        }

        onBack={
          onBack
        }
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

        onComplete={
          onComplete
        }

        onBack={
          onBack
        }
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

        onComplete={
          onComplete
        }

        onBack={
          onBack
        }
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

        onComplete={
          onComplete
        }

        onBack={
          onBack
        }
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

        onComplete={
          onComplete
        }

        onBack={
          onBack
        }
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