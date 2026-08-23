export function getConceptStatus(fingerprint) {
  const scores = Object.values(fingerprint);

  const average =
    scores.reduce(
      (sum, score) => sum + score,
      0
    ) / scores.length;

  const weakestDimension =
    Object.entries(fingerprint).sort(
      ([, scoreA], [, scoreB]) =>
        scoreA - scoreB
    )[0];

  const weakestScore =
    weakestDimension[1];

  if (weakestScore < 50) {
    return {
      status: "reinforcement",
      weakestDimension:
        weakestDimension[0],
      weakestScore,
      average: Math.round(average),
      message:
        "This concept needs reinforcement.",
    };
  }

  if (average >= 70) {
    return {
      status: "ready",
      weakestDimension:
        weakestDimension[0],
      weakestScore,
      average: Math.round(average),
      message:
        "You have demonstrated strong understanding.",
    };
  }

  return {
    status: "practice",
    weakestDimension:
      weakestDimension[0],
    weakestScore,
    average: Math.round(average),
    message:
      "Continue practicing this concept.",
  };
}