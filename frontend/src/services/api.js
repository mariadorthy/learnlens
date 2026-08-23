const API_BASE_URL = import.meta.env.VITE_API_URL;

export async function saveAttempt(attempt) {
  const response = await fetch(
    `${API_BASE_URL}/attempts`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(attempt),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to save learning attempt");
  }

  return response.json();
}

export async function getAttempts() {
  const response = await fetch(
    `${API_BASE_URL}/attempts`
  );

  if (!response.ok) {
    throw new Error("Failed to load attempts");
  }

  return response.json();
}

export async function getFingerprint(
  studentId,
  concept
) {
  const response = await fetch(
    `${API_BASE_URL}/fingerprint/${studentId}/${concept}`
  );

  if (!response.ok) {
    throw new Error(
      "Failed to load fingerprint"
    );
  }

  return response.json();
}