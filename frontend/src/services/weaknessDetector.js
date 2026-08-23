export function detectWeakness({
  code = "",
  question = "",
  questionId = "",
  mistakeType = "",
}) {
  const text = `${code} ${question} ${mistakeType}`.toLowerCase();

  // -----------------------------------------
  // COUNTDOWN
  // -----------------------------------------
  if (
    text.includes("countdown") ||
    text.includes("counting backwards") ||
    text.includes("negative step")
  ) {
    return {
      type: "countdown_range",
      title: "Countdown range",
      description:
        "You may need more practice using negative steps in range().",
      skill: "Countdown loops",
      recommendation:
        "Practice using range(start, stop, -1) for backwards loops.",
      level: "beginner",
    };
  }

  // -----------------------------------------
  // EVEN NUMBERS
  // -----------------------------------------
  if (
    text.includes("even number") ||
    text.includes("even numbers") ||
    text.includes("step 2")
  ) {
    return {
      type: "even_number_range",
      title: "Even-number ranges",
      description:
        "You may need more practice controlling the step value in range().",
      skill: "Range step values",
      recommendation:
        "Practice using range(start, stop, 2) for even numbers.",
      level: "beginner",
    };
  }

  // -----------------------------------------
  // ACCUMULATION
  // -----------------------------------------
  if (
    text.includes("accumulator") ||
    text.includes("running total") ||
    text.includes("sum") ||
    text.includes("total")
  ) {
    return {
      type: "loop_accumulation",
      title: "Accumulator logic",
      description:
        "You may need more practice keeping a running total inside a loop.",
      skill: "Accumulating values in loops",
      recommendation:
        "Practice starting a total at 0 and adding each value to it.",
      level: "beginner",
    };
  }

  // -----------------------------------------
  // CALCULATION
  // -----------------------------------------
  if (
    text.includes("square") ||
    text.includes("calculation") ||
    text.includes("number * 2")
  ) {
    return {
      type: "calculation_logic",
      title: "Calculation logic",
      description:
        "You may need more practice performing calculations inside loops.",
      skill: "Calculations inside loops",
      recommendation:
        "Check the mathematical operation performed on each iteration.",
      level: "beginner",
    };
  }

  // -----------------------------------------
  // RANGE BOUNDARY
  // -----------------------------------------
  if (
    text.includes("range boundary") ||
    text.includes("stops too early") ||
    text.includes("upper bound") ||
    text.includes("stop value")
  ) {
    return {
      type: "range_exclusive_upper_bound",
      title: "Range and loop boundaries",
      description:
        "You may need more practice with range() start and stop values.",
      skill: "Understanding range()",
      recommendation:
        "Remember that range(start, stop) does not include stop.",
      level: "beginner",
    };
  }

  // -----------------------------------------
  // OUTPUT
  // -----------------------------------------
  if (
    text.includes("output") ||
    text.includes("print")
  ) {
    return {
      type: "loop_output",
      title: "Loop output",
      description:
        "You may need more practice printing values from loops.",
      skill: "Loop output",
      recommendation:
        "Check which variable is being printed during each iteration.",
      level: "beginner",
    };
  }

  // -----------------------------------------
  // FALLBACK
  // -----------------------------------------
  return {
    type: "general_implementation",
    title: "Implementation logic",
    description:
      "You need more practice translating requirements into code.",
    skill: "Problem solving",
    recommendation:
      "Break the problem into smaller steps and implement one step at a time.",
    level: "beginner",
  };
}