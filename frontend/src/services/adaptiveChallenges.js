export const adaptiveChallenges = {
  range_exclusive_upper_bound: {
    id: "adaptive-range-boundary",
    weakness: "range_exclusive_upper_bound",
    dimension: "implement",
    type: "debugging",

    title: "Fix the range boundary",

    instruction:
      "The program should print the numbers 1 to 5. The loop currently stops too early. Find and fix the range() mistake.",

    starterCode: `for i in range(1, 4):
    print(i)`,

    expectedOutput: `1
2
3
4
5`,

    hint:
      "Remember that range(start, stop) does not include stop.",

    check: (code) => {
      return (
        code.includes("range(1, 6)") &&
        code.includes("print(i)")
      );
    },
  },

  even_number_range: {
    id: "adaptive-even-range",
    weakness: "even_number_range",
    dimension: "implement",
    type: "debugging",

    title: "Fix the even-number loop",

    instruction:
      "The program should print the even numbers from 2 to 10.",

    starterCode: `for i in range(2, 10):
    print(i)`,

    expectedOutput: `2
4
6
8
10`,

    hint:
      "Think about the start, stop and step values of range().",

    check: (code) => {
      return (
        code.includes("range(2, 11, 2)") &&
        code.includes("print(i)")
      );
    },
  },

  loop_accumulation: {
    id: "adaptive-loop-total",
    weakness: "loop_accumulation",
    dimension: "implement",
    type: "debugging",

    title: "Fix the running total",

    instruction:
      "The program should calculate the sum of the numbers from 1 to 5.",

    starterCode: `total = 0
for i in range(1, 5):
    total = total + i
print(total)`,

    expectedOutput: `15`,

    hint:
      "Check whether the loop visits every number that should be included.",

    check: (code) => {
      return (
        code.includes("range(1, 6)") &&
        code.includes("total") &&
        code.includes("print(total)")
      );
    },
  },

  python_syntax: {
    id: "adaptive-python-syntax",
    weakness: "python_syntax",
    dimension: "implement",
    type: "debugging",

    title: "Fix the Python syntax",

    instruction:
      "The for loop is missing a required colon. Fix the syntax so the program prints the numbers 1 to 5.",

    starterCode: `for number in range(1, 6)
    print(number)`,

    expectedOutput: `1
2
3
4
5`,

    hint:
      "Python for-loop headers must end with a colon (:).",

    check: (code) => {
      return (
        code.includes("for number in range(1, 6):") &&
        code.includes("print(number)")
      );
    },
  },

  calculation_logic: {
    id: "adaptive-calculation-logic",
    weakness: "calculation_logic",
    dimension: "debug",
    type: "debugging",

    title: "Fix the square calculation",

    instruction:
      "The program should print the square of each number from 1 to 5. The current calculation is incorrect. Find and fix the calculation.",

    starterCode: `for i in range(1, 6):
    square = i * 2
    print(square)`,

    expectedOutput: `1
4
9
16
25`,

    hint:
      "A square is calculated by multiplying the number by itself.",

    check: (code) => {
      return (
        code.includes("range(1, 6)") &&
        code.includes("i * i") &&
        code.includes("print(square)")
      );
    },
  },

  loop_output: {
    id: "adaptive-loop-output",
    weakness: "loop_output",
    dimension: "implement",
    type: "debugging",

    title: "Fix the loop output",

    instruction:
      "The loop visits the correct numbers, but the program is not printing each number correctly.",

    starterCode: `for i in range(1, 6):
    # Fix the output
    pass`,

    expectedOutput: `1
2
3
4
5`,

    hint:
      "Make sure you print the loop variable i inside the loop.",

    check: (code) => {
      return (
        code.includes("range(1, 6)") &&
        code.includes("print(i)")
      );
    },
  },
  countdown_range: {
    id: "adaptive-countdown-range",
    weakness: "countdown_range",
    dimension: "implement",
    type: "debugging",

    title: "Fix the countdown loop",

    instruction:
      "The program should print the numbers 5, 4, 3, 2 and 1 using a for loop. Fix the range so the loop counts backwards correctly.",

    starterCode: `for i in range(5, 0):
    print(i)`,

    expectedOutput: `5
4
3
2
1`,

    hint:
      "When counting backwards, range() needs a negative step.",

    check: (code) => {
      return (
        code.includes("range(5, 0, -1)") &&
        code.includes("print(i)")
      );
    },
  },


  calculation_error: {
    id: "adaptive-calculation-error",

    weakness: "calculation_error",

    dimension: "apply",

    type: "debugging",

    title: "Fix the calculation",

    instruction:
      "The program should print the square of each number from 1 to 5. The current calculation is incorrect.",

    starterCode: `for number in range(1, 6):
    square = number * 2
    print(square)`,

    expectedOutput: `1
4
9
16
25`,

    hint:
      "A square is calculated by multiplying the number by itself.",

    check: (code) => {
      return (
        code.includes("range(1, 6)") &&
        (
          code.includes("number * number") ||
          code.includes("number ** 2")
        ) &&
        code.includes("print(square)")
      );
    },
  },

  application_error: {
    id: "adaptive-application-error",

    weakness: "application_error",

    dimension: "apply",

    type: "debugging",

    title: "Review your application",

    instruction:
      "The solution does not produce the required output. Review the loop, calculation, and output.",

    starterCode: `for number in range(1, 6):
    print(number)`,

    expectedOutput: `2
4
6
8
10`,

    hint:
      "Check the required pattern and make sure your loop generates the correct values.",

    check: (code) => {
      return (
        code.includes("for") &&
        code.includes("print")
      );
    },
  },
  loop_condition: {
    id: "adaptive-loop-condition",
    weakness: "loop_condition",
    dimension: "debug",
    type: "debugging",

    title: "Fix the loop condition",

    instruction:
      "The program should print only the odd numbers from 1 to 9. Fix the loop condition.",

    starterCode: `for i in range(1, 10):
    if i % 2 == 0:
        print(i)`,

    expectedOutput: `1
3
5
7
9`,

    hint:
      "Think about the condition that identifies odd numbers.",

    check: (code) => {
      return (
        code.includes("range(1, 10)") &&
        code.includes("% 2") &&
        (
          code.includes("== 1") ||
          code.includes("!= 0")
        ) &&
        code.includes("print(i)")
      );
    },
  },
  general_debugging: {
    id: "adaptive-general-debugging",
    weakness: "general_debugging",
    dimension: "debug",
    type: "debugging",

    title: "Practice debugging",

    instruction:
      "Find and fix the mistake so the program produces the expected output.",

    starterCode: `for i in range(1, 6):
    print(i * 2)`,

    expectedOutput: `1
2
3
4
5`,

    hint:
      "Compare what the program currently calculates with the required output.",

    check: (code) => {
      return (
        code.includes("range(1, 6)") &&
        code.includes("print(i)")
      );
    },
  },
  loop_calculation: {
    id: "adaptive-loop-calculation",
    weakness: "loop_calculation",
    dimension: "apply",
    type: "debugging",

    title: "Fix the loop calculation",

    instruction:
      "The program should print the square of each number from 1 to 5. Fix the calculation.",

    starterCode: `for number in range(1, 6):
    square = number * 2
    print(square)`,

    expectedOutput: `1
4
9
16
25`,

    hint:
      "A square is a number multiplied by itself.",

    check: (code) => {
      return (
        (
          code.includes("number * number") ||
          code.includes("number ** 2")
        ) &&
        code.includes("range(1, 6)") &&
        code.includes("print")
      );
    },
  },

  general_implementation: {
    id: "adaptive-general-implementation",
    weakness: "general_implementation",
    dimension: "implement",
    type: "debugging",

    title: "Review your implementation",

    instruction:
      "Review your loop structure, syntax, and output carefully. Identify what prevents your program from producing the required result.",

    starterCode: "",

    expectedOutput: "",

    hint:
      "Check your syntax first, then verify the loop range, conditions, and output.",

    check: () => false,
  },
  loop_syntax: {
    id: "adaptive-loop-syntax",
    weakness: "loop_syntax",
    dimension: "apply",
    type: "debugging",
    title: "Fix the loop syntax",
    instruction:
      "The for loop has a syntax mistake. Fix it so the program prints the numbers 1 to 5.",
    starterCode: `for number in range(1, 6)
    print(number)`,
    expectedOutput: `1
2
3
4
5`,
    hint:
      "Python for-loop headers must end with a colon (:).",
    check: (code) => {
      return (
        code.includes("for number in range(1, 6):") &&
        code.includes("print(number)")
      );
    },
  },
};