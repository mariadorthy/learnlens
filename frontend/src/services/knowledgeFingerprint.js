import {
  getConceptAttempts,
} from "./mistakeTracker";

/*
  LearnLens Knowledge Fingerprint

  Six dimensions:

  Recall
  Explain
  Predict
  Implement
  Debug
  Apply

  For the first MVP we calculate these
  from available evidence.

  Later AI will make this much smarter.
*/

export function calculateFingerprint(
  conceptId
) {
  const attempts =
    getConceptAttempts(conceptId);

  const passedAttempts =
    attempts.filter(
      (attempt) =>
        attempt.result === "passed"
    );

  const failedAttempts =
    attempts.filter(
      (attempt) =>
        attempt.result === "failed"
    );

  const totalAttempts =
    attempts.length;

  /*
    IMPLEMENT

    Based primarily on successful coding.
  */

  let implement = 20;

  if (passedAttempts.length > 0) {
    implement = 80;
  }

  if (passedAttempts.length >= 2) {
    implement = 90;
  }

  /*
    DEBUG

    If the student repeatedly makes mistakes,
    debugging ability is currently weak.

    Successful correction increases it.
  */

  let debug = 40;

  if (failedAttempts.length >= 1) {
    debug = 35;
  }

  if (
    failedAttempts.length >= 2
  ) {
    debug = 25;
  }

  if (
    passedAttempts.length >= 1 &&
    failedAttempts.length >= 1
  ) {
    debug = 60;
  }

  /*
    RECALL

    Temporary MVP assumption:
    completing theory gives evidence of recall.
  */

  let recall = 30;

  if (totalAttempts > 0) {
    recall = 60;
  }

  if (passedAttempts.length > 0) {
    recall = 80;
  }

  /*
    EXPLAIN

    We don't have explanation evidence yet.

    So keep this intentionally low.
  */

  const explain = 30;

  /*
    PREDICT

    We will add prediction questions later.
  */

  const predict = 35;

  /*
    APPLY

    Applying a concept to an unfamiliar
    problem will be implemented later.
  */

  let apply = 25;

  if (passedAttempts.length >= 2) {
    apply = 50;
  }

  return {
    recall,
    explain,
    predict,
    implement,
    debug,
    apply,
  };
}


/*
  Find the weakest dimension.
*/

export function getWeakestDimension(
  fingerprint
) {
  const entries = Object.entries(
    fingerprint
  );

  entries.sort(
    (a, b) => a[1] - b[1]
  );

  return {
    dimension: entries[0][0],
    score: entries[0][1],
  };
}


/*
  Convert dimension name into
  human-readable text.
*/

export function formatDimension(
  dimension
) {
  const names = {
    recall: "Recall",
    explain: "Explain",
    predict: "Predict",
    implement: "Implement",
    debug: "Debug",
    apply: "Apply",
  };

  return names[dimension] || dimension;
}