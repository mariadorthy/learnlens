import { useState } from "react";

import Dashboard from "./pages/Dashboard";
import ConceptPage from "./pages/ConceptPage";
import ImplementAssessment from "./pages/ImplementAssessment";
import LearningPage from "./pages/LearningPage";
import TheoryAssessment from "./pages/TheoryAssessment";
import ExplainAssessment from "./pages/ExplainAssessment";
import PredictAssessment from "./pages/PredictAssessment";
import DebugAssessment from "./pages/DebugAssessment";
import ApplyAssessment from "./pages/ApplyAssessment";
import CompletionOverview from "./pages/CompletionOverview";
import AuthPage from "./pages/AuthPage";
import { roadmap as initialRoadmap } from "./data/roadmap";
import { concepts } from "./data/concepts";

function App() {

  const [selectedConcept, setSelectedConcept] = useState(null);
  const [refreshFingerprint, setRefreshFingerprint] =
    useState(0);
  const [roadmapState, setRoadmapState] =
    useState(initialRoadmap);
  const [selectedStudent, setSelectedStudent] =
    useState(null);
  const handleStudentSelect = (student) => {
    console.log("SELECTED STUDENT FROM AUTH:", student);

    setSelectedStudent(student);
  };
  const [learning, setLearning] = useState(false);
  const [explain, setExplain] = useState(false);

  const [theory, setTheory] = useState(false);
  const [predict, setPredict] = useState(false);
  const [coding, setCoding] = useState(false);
  const [debug, setDebug] = useState(false);
  const [apply, setApply] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  // When a roadmap concept is clicked,
  // combine roadmap data + detailed concept data.
  const handleConceptSelect = (roadmapConcept) => {
    const detailedConcept = concepts[roadmapConcept.id];

    const fullConcept = {
      ...roadmapConcept,
      ...detailedConcept,
    };

    setSelectedConcept(fullConcept);

    setLearning(false);
    setTheory(false);
    setExplain(false);
    setPredict(false);
    setCoding(false);
  };

  const handleStartExplain = () => {
    if (!selectedConcept) {
      return;
    }

    setLearning(false);
    setTheory(false);
    setExplain(true);
    setCoding(false);
  };

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
  };

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

  const handleStartDebug = () => {
    if (!selectedConcept) {
      return;
    }

    setCoding(false);
    setDebug(true);
  };

  const handleBack = () => {
    setSelectedConcept(null);
    setLearning(false);
    setTheory(false);
    setExplain(false);
    setPredict(false);
    setCoding(false);
    setDebug(false);
    setApply(false);
  };

  const handleStartLearning = () => {
    if (!selectedConcept) {
      return;
    }

    setLearning(true);
    setTheory(false);
    setCoding(false);
  };

  const handleStartTheory = () => {
    if (!selectedConcept) {
      return;
    }
    setLearning(false);
    setTheory(true);
    setCoding(false);
  };

  const handleStartPredict = () => {
    if (!selectedConcept) {
      return;
    }

    setLearning(false);
    setTheory(false);
    setExplain(false);
    setPredict(true);
    setCoding(false);
  };

  const handleCodingComplete = () => {
  if (!selectedConcept) {
    return;
  }

  const currentIndex = roadmapState.findIndex(
    (concept) => concept.id === selectedConcept.id
  );

  if (currentIndex === -1) {
    return;
  }

  setRoadmapState((previousRoadmap) => {
    const updatedRoadmap = previousRoadmap.map(
      (concept, index) => {

        if (index === currentIndex) {
          return {
            ...concept,
            status: "completed",
            progress: 100,
          };
        }

        if (index === currentIndex + 1) {
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

  // Refresh dashboard / knowledge fingerprint
  setRefreshFingerprint(
    (previous) => previous + 1
  );

  // Close Apply
  setApply(false);

  // Show completion overview
  setShowCompletion(true);

  // Do NOT clear selectedConcept here.
  // The overview page needs it.
};

  console.log("APP STATE:", {
    selectedConcept: selectedConcept?.id,
    learning,
    theory,
    coding,
  });
  if (!selectedStudent) {
    return <AuthPage onSelect={handleStudentSelect} />;
  }

  return (
    <div className="app">

      {/* NAVBAR */}

      <header className="navbar">

        <button
          className="logo"
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
            className="switch-student-button"
            onClick={() => {
              setSelectedStudent(null);
              setSelectedConcept(null);
              setLearning(false);
              setTheory(false);
              setExplain(false);
              setCoding(false);
              setDebug(false);
            }}
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


      {/* CODING PAGE */}

      {coding ? (
        <ImplementAssessment
          concept={selectedConcept}
          student={selectedStudent}
          onBack={() => {
            setCoding(false);
            setPredict(true);
          }}
          onComplete={handleStartDebug}
        />

        /* THEORY PAGE */
      ) : theory ? (
        <TheoryAssessment
          concept={selectedConcept}
          student={selectedStudent}
          onBack={() => {
            setTheory(false);
            setLearning(true);
          }}
          onComplete={() => {
            setRefreshFingerprint((previous) => previous + 1);
            handleStartExplain();
          }}
        />

        /* debug */
      ) : debug ? (
        <DebugAssessment
          concept={selectedConcept}
          student={selectedStudent}
          onBack={() => {
            setDebug(false);
            setCoding(true);
          }}
          onComplete={handleStartApply}
        />

        /*Explain Page*/
      ) : explain ? (
        <ExplainAssessment
          concept={selectedConcept}
          student={selectedStudent}
          onBack={() => {
            setExplain(false);
            setTheory(true);
          }}
          onComplete={handleStartPredict}
        />

        /* Apply */

      ) : apply ? (
        <ApplyAssessment
          concept={selectedConcept}
          student={selectedStudent}
          onBack={() => {
            setApply(false);
            setDebug(true);
          }}
          onComplete={handleCodingComplete}
        />

        /* Predict */

      ) : predict ? (
        <PredictAssessment
          concept={selectedConcept}
          student={selectedStudent}
          onBack={() => {
            setPredict(false);
            setExplain(true);
          }}
          onComplete={handleStartImplement}
        />

        /* LEARN PAGE */
) : learning ? (
  <LearningPage
    concept={selectedConcept}
 onBack={() => {
      setLearning(false);
    }}
    onStartTheory={handleStartTheory}
  />
  
/* COMPLETION OVERVIEW */
) : showCompletion ? (
  <CompletionOverview
    concept={selectedConcept}
    student={selectedStudent}
    onBackToDashboard={() => {
      setShowCompletion(false);
      setSelectedConcept(null);
    }}
  />

/* CONCEPT PAGE */
) : selectedConcept ? (
  <ConceptPage
    concept={selectedConcept}
    onBack={handleBack}
    onStartLearning={handleStartLearning}
  />

/* DASHBOARD */
) : (
  <Dashboard
    concepts={roadmapState}
    student={selectedStudent}
    onConceptSelect={handleConceptSelect}
    refreshFingerprint={refreshFingerprint}
  />
)
      }

    </div>
  );
}

export default App;