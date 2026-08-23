const PROGRESS_KEY = "learnlens_progress";

export function getProgress() {
  try {
    const stored = localStorage.getItem(PROGRESS_KEY);

    if (!stored) {
      return {};
    }

    return JSON.parse(stored);
  } catch (error) {
    console.error(
      "Could not read learning progress:",
      error
    );

    return {};
  }
}

export function getConceptProgress(conceptId) {
  const progress = getProgress();

  return (
    progress[conceptId] || {
      theory: false,
      explain: false,
      predict: false,
      implement: false,
      debug: false,
      apply: false,
    }
  );
}

export function markStageComplete(
  conceptId,
  stage
) {
  const progress = getProgress();

  if (!progress[conceptId]) {
    progress[conceptId] = {
      theory: false,
      explain: false,
      predict: false,
      implement: false,
      debug: false,
      apply: false,
    };
  }

  progress[conceptId][stage] = true;

  localStorage.setItem(
    PROGRESS_KEY,
    JSON.stringify(progress)
  );

  return progress[conceptId];
}