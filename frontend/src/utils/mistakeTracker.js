/**
 * Common mistake tracking function.
 *
 * Use this from:
 * Theory
 * Explain
 * Predict
 * Implement
 * Debug
 * Apply
 *
 * It does NOT affect scoring, navigation, completion,
 * or any existing assessment logic.
 */

export async function saveMistakeHistory({
  API_URL,
  studentId,

  // Learning information
  topic,
  concept,
  dimension,

  // Question information
  questionId,
  questionType,
  question,
  questionFormat,

  // Attempt information
  attemptNumber,
  score,
  maxScore,

  // Student response
  studentAnswer,
  correctAnswer,

  // Mistake information
  mistakeType,
  mistake,
  weakness,
  weaknessType,

  // Analysis information
  misconception,
  whatHappened,
  recommendation,

  // Code-specific information
  code,
  errorMessage,
  expectedOutput,
  actualOutput,

  // Retest information
  retestMode = false,
  isRetest = false,

  // Optional extra data
  metadata = {},
}) {
  // ------------------------------------------------------------
  // SAFETY
  // ------------------------------------------------------------

  if (!API_URL) {
    console.warn(
      "Mistake tracker: API_URL is missing."
    );

    return {
      success: false,
      skipped: true,
    };
  }

  if (!studentId) {
    console.warn(
      "Mistake tracker: studentId is missing."
    );

    return {
      success: false,
      skipped: true,
    };
  }

  // ------------------------------------------------------------
  // DO NOT STORE SUCCESS AS A MISTAKE
  // ------------------------------------------------------------

  if (
    !mistakeType ||
    mistakeType === "none" ||
    mistakeType === "success"
  ) {
    return {
      success: true,
      skipped: true,
      reason: "No mistake",
    };
  }

  // ------------------------------------------------------------
  // BUILD PAYLOAD
  // ------------------------------------------------------------

  const payload = {
    student_id: String(studentId),

    // Learning hierarchy
    topic: topic || null,
    concept: concept || null,
    dimension: dimension || null,

    // Question
    question_id:
      questionId != null
        ? String(questionId)
        : null,

    question_type:
      questionType || null,

    question_format:
      questionFormat || null,

    question:
      question || null,

    // Attempt
    attempt_number:
      attemptNumber != null
        ? Number(attemptNumber)
        : null,

    score:
      score != null
        ? Number(score)
        : null,

    max_score:
      maxScore != null
        ? Number(maxScore)
        : null,

    // Student response
    student_answer:
      studentAnswer ?? null,

    correct_answer:
      correctAnswer ?? null,

    // Mistake
    mistake_type:
      mistakeType || "unknown",

    mistake:
      mistake ||
      mistakeType ||
      "Unknown mistake",

    weakness:
      weakness || null,

    weakness_type:
      weaknessType ||
      weakness ||
      null,

    // Analysis
    misconception:
      misconception || null,

    what_happened:
      whatHappened || null,

    recommendation:
      recommendation || null,

    // Code information
    code:
      code ?? null,

    error_message:
      errorMessage || null,

    expected_output:
      expectedOutput ?? null,

    actual_output:
      actualOutput ?? null,

    // Retest
    retest_mode:
      Boolean(retestMode),

    is_retest:
      Boolean(isRetest),

    // Additional information
    metadata,
  };

  // ------------------------------------------------------------
  // SEND TO BACKEND
  // ------------------------------------------------------------

  try {
    const response = await fetch(
      `${API_URL}/mistake-history`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const rawResponse = await response.text();

    let data = {};

    try {
      data = rawResponse
        ? JSON.parse(rawResponse)
        : {};
    } catch {
      data = {
        raw: rawResponse,
      };
    }

    if (!response.ok) {
      console.error(
        "❌ MISTAKE HISTORY FAILED"
      );

      console.error(
        "Status:",
        response.status
      );

      console.error(
        "Backend detail:",
        data?.detail
      );
      console.error(
        "Supported question types:",
        data?.detail?.supported_question_types
      );
      console.error(
        "Full response:",
        data
      );

      console.error(
        "Payload:",
        payload
      );

      return {
        success: false,
        status: response.status,
        data,
      };
    }

    console.log(
      "✅ Mistake history saved:",
      data
    );

    return {
      success: true,
      data,
    };
  } catch (error) {
    // IMPORTANT:
    // Mistake tracking must NEVER break the assessment.
    console.warn(
      "Mistake history request failed:",
      error
    );

    return {
      success: false,
      error,
    };
  }

}
