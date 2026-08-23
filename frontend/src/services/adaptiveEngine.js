export function getAdaptiveRecommendation(
  fingerprint
) {
  const assessedDimensions =
    Object.entries(fingerprint)
      .filter(
        ([, score]) =>
          score !== null &&
          score !== undefined
      );

  if (assessedDimensions.length === 0) {
    return {
      type: "initial",
      dimension: null,
      message:
        "Complete an assessment to discover your learning needs.",
    };
  }

  const weakest =
    assessedDimensions.sort(
      ([, scoreA], [, scoreB]) =>
        scoreA - scoreB
    )[0];

  const dimension = weakest[0];
  const score = weakest[1];

  if (score < 40) {
    return {
      type: "reinforce",
      dimension,
      score,
      message:
        `Your ${dimension} skill needs reinforcement.`,
    };
  }

  if (score < 70) {
    return {
      type: "practice",
      dimension,
      score,
      message:
        `You should practice ${dimension} before advancing.`,
    };
  }

  return {
    type: "advance",
    dimension,
    score,
    message:
      "Your current understanding is strong enough to advance.",
  };
}

export function getWeakestSkill(
  weaknesses
) {
  const entries =
    Object.entries(weaknesses);

  if (entries.length === 0) {
    return null;
  }

  return entries.sort(
    ([, a], [, b]) =>
      a.mastery - b.mastery
  )[0][0];
}