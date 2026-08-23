const STORAGE_KEY = "learnlens_attempts";

export function getAttempts() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return [];
    }

    return JSON.parse(stored);
  } catch (error) {
    console.error("Could not read attempts:", error);
    return [];
  }
}

export function saveAttempt(attempt) {
  const attempts = getAttempts();

  const newAttempt = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    ...attempt,
  };

  attempts.push(newAttempt);

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(attempts)
  );

  return newAttempt;
}

export function getConceptAttempts(conceptId) {
  const attempts = getAttempts();

  return attempts.filter(
    (attempt) => attempt.conceptId === conceptId
  );
}

export function getMistakeCount(conceptId, mistakeType) {
  const attempts = getConceptAttempts(conceptId);

  return attempts.filter(
    (attempt) =>
      attempt.mistakeType === mistakeType &&
      attempt.result === "failed"
  ).length;
}

export function clearAttempts() {
  localStorage.removeItem(STORAGE_KEY);
}