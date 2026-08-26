export const theoryWeaknesses = {
  "loop-type": {
    explanation:
      "A for loop is generally used when iterating through a sequence or when the number of iterations is known.",

    example: `for i in range(5):
    print(i)`,

    challenge: {
      question:
        "Which loop is generally used when the number of iterations is known?",

      options: [
        "while",
        "for",
        "if",
        "switch",
      ],

      correctAnswer: 1,
    },
  },

  "while-loop": {
    explanation:
      "A while loop repeats a block of code while its condition remains True.",

    example: `x = 0
while x < 5:
    print(x)
    x += 1`,

    challenge: {
      question:
        "Which loop repeats while a condition remains True?",

      options: [
        "for",
        "while",
        "if",
        "switch",
      ],

      correctAnswer: 1,
    },
  },

  break: {
    explanation:
      "The break statement immediately terminates the loop.",

    example: `for i in range(5):
    if i == 3:
        break
    print(i)`,

    challenge: {
      question: "What does break do inside a loop?",

      options: [
        "Skips the current iteration",
        "Restarts the loop",
        "Terminates the loop",
        "Pauses the loop",
      ],

      correctAnswer: 2,
    },
  },

  continue: {
    explanation:
      "The continue statement skips the current iteration and moves to the next iteration.",

    example: `for i in range(5):
    if i == 2:
        continue
    print(i)`,

    challenge: {
      question: "What does continue do inside a loop?",

      options: [
        "Stops the loop completely",
        "Skips the current iteration",
        "Restarts the program",
        "Exits the function",
      ],

      correctAnswer: 1,
    },
  },

  range: {
    explanation:
      "range(2, 8, 2) starts at 2, stops before 8, and increases by 2.",

    example: `for i in range(2, 8, 2):
    print(i)`,

    challenge: {
      question: "What does range(2, 8, 2) produce?",

      options: [
        "2, 4, 6",
        "2, 4, 6, 8",
        "0, 2, 4, 6",
        "2, 3, 4, 5, 6, 7",
      ],

      correctAnswer: 0,
    },
  },

  "loop-update": {
    explanation:
      "A while loop needs its condition to eventually become False. Updating the loop variable helps prevent an infinite loop.",

    example: `x = 0
while x < 5:
    print(x)
    x += 1`,

    challenge: {
      question:
        "Why should you update a variable used in a while loop condition?",

      options: [
        "To make the program run faster",
        "To prevent the loop from becoming infinite",
        "To skip every iteration",
        "To restart the loop",
      ],

      correctAnswer: 1,
    },
  },
};

// ========================================================
// EXPLAIN WEAKNESSES
// ========================================================

export const explainWeaknesses = {
  "explain-loop": {
    explanation:
      "A loop is used to repeat a block of code. A for loop is commonly used to iterate over a sequence or a known number of values, while a while loop continues running as long as a condition is True.",

    example: `for i in range(5):
    print(i)

x = 0
while x < 5:
    print(x)
    x += 1`,

    challenge: {
      question:
        "Which statement correctly describes the difference between a for loop and a while loop?",

      options: [
        "A for loop runs only once, while a while loop always runs forever.",
        "A for loop commonly iterates over a sequence, while a while loop continues while a condition is True.",
        "A for loop only works with numbers, while a while loop only works with strings.",
        "There is no difference between them."
      ],

      correctAnswer: 1,
    },
  },

  "explain-for-loop": {
    explanation:
      "A for loop repeats a block of code for each item in a sequence. The range() function is commonly used when you want to iterate over a sequence of numbers. Remember that the stop value in range() is excluded.",

    example: `for number in range(1, 6):
    print(number)`,

    challenge: {
      question:
        "What numbers are printed by this loop?",

      options: [
        "0, 1, 2, 3, 4",
        "1, 2, 3, 4",
        "1, 2, 3, 4, 5",
        "1, 2, 3, 4, 5, 6"
      ],

      correctAnswer: 2,
    },
  },

  "explain-while-loop": {
    explanation:
      "A while loop checks its condition before each iteration. If the condition is True, the loop body runs. Something inside the loop should normally update the relevant value so that the condition eventually becomes False. Otherwise, the loop can continue forever.",

    example: `x = 0

while x < 5:
    print(x)
    x += 1`,

    challenge: {
      question:
        "Why does x += 1 matter in this while loop?",

      options: [
        "It makes the loop run faster.",
        "It changes x so that x < 5 can eventually become False.",
        "It makes the condition permanently True.",
        "It stops Python from checking the condition."
      ],

      correctAnswer: 1,
    },
  },

  "explain-break-continue": {
    explanation:
      "break and continue both change the normal flow of a loop. break terminates the entire loop immediately. continue skips the rest of the current iteration and moves to the next iteration.",

    example: `for i in range(1, 6):
    if i == 3:
        break
    print(i)

for i in range(1, 6):
    if i == 3:
        continue
    print(i)`,

    challenge: {
      question:
        "What happens when Python executes a continue statement inside a loop?",

      options: [
        "The entire loop stops immediately.",
        "The program crashes.",
        "The current iteration is skipped and the loop moves to the next iteration.",
        "The loop starts again from the beginning."
      ],

      correctAnswer: 2,
    },
  },

  "explain-range": {
    explanation:
      "range(start, stop, step) generates a sequence of numbers. The start value is included, but the stop value is excluded. The step determines how much the value changes each time.",

    example: `for number in range(2, 8, 2):
    print(number)`,

    challenge: {
      question:
        "What numbers does range(2, 8, 2) produce?",

      options: [
        "2, 4, 6",
        "2, 4, 6, 8",
        "0, 2, 4, 6",
        "2, 3, 4, 5, 6, 7"
      ],

      correctAnswer: 0,
    },
  },

  "explain-nested-loop": {
    explanation:
      "A nested loop is a loop placed inside another loop. The outer loop controls the larger repetition, and the inner loop runs completely for each iteration of the outer loop.",

    example: `for i in range(2):
    for j in range(3):
        print(i, j)`,

    challenge: {
      question:
        "How many times does the inner loop execute in total?",

      options: [
        "2 times",
        "3 times",
        "5 times",
        "6 times"
      ],

      correctAnswer: 3,
    },
  },
};
// ========================================================
// PREDICT WEAKNESSES
// ========================================================

export const predictWeaknesses = {
  // --------------------------------------------------------
  // PREDICT QUESTION 1
  // --------------------------------------------------------
  "predict-loop-addition": {
    explanation:
      "A for loop is commonly used when iterating over a sequence or when the number of iterations is known. The loop executes once for each value produced by range().",

    example: `x = 2

for i in range(3):
    x = x + i

print(x)`,

    challenge: {
      question:
        "What value will the program print?",

      options: [
        "2",
        "4",
        "5",
        "6",
      ],

      correctAnswer: 2,
    },
  },

  // --------------------------------------------------------
  // PREDICT QUESTION 2
  // --------------------------------------------------------
  "predict-loop-sum": {
    explanation:
      "A while loop continues executing as long as its condition remains True. The condition is checked before every iteration.",

    example: `x = 0

while x < 3:
    print(x)
    x += 1`,

    challenge: {
      question:
        "What values will be printed?",

      options: [
        "0, 1, 2",
        "1, 2, 3",
        "0, 1, 2, 3",
        "The loop runs forever",
      ],

      correctAnswer: 0,
    },
  },

  // --------------------------------------------------------
  // PREDICT QUESTION 3
  // --------------------------------------------------------
  "predict-loop-subtraction": {
    explanation:
      "When a for loop uses range(), the loop runs once for each value produced by range(). The stop value is excluded.",

    example: `for i in range(2, 6):
    print(i)`,

    challenge: {
      question:
        "What will this code print?",

      options: [
        "2, 3, 4, 5",
        "2, 3, 4, 5, 6",
        "0, 1, 2, 3, 4, 5",
        "3, 4, 5, 6",
      ],

      correctAnswer: 0,
    },
  },

  // --------------------------------------------------------
  // PREDICT QUESTION 4
  // --------------------------------------------------------
  "predict-loop-sub": {
    explanation:
      "The third argument of range() is the step. It determines how much the value changes after each iteration. The stop value is still excluded.",

    example: `for i in range(2, 10, 2):
    print(i)`,

    challenge: {
      question:
        "What values will be printed?",

      options: [
        "2, 4, 6, 8",
        "2, 4, 6, 8, 10",
        "0, 2, 4, 6, 8",
        "2, 3, 4, 5, 6, 7, 8, 9",
      ],

      correctAnswer: 0,
    },
  },

  // --------------------------------------------------------
  // PREDICT QUESTION 5
  // --------------------------------------------------------
  "predict-break": {
    explanation:
      "The break statement immediately terminates the loop. Once Python reaches break, no further iterations of that loop are executed.",

    example: `for i in range(5):
    if i == 3:
        break
    print(i)`,

    challenge: {
      question:
        "What will this code print?",

      options: [
        "0, 1, 2",
        "0, 1, 2, 3",
        "0, 1, 2, 3, 4",
        "1, 2, 3",
      ],

      correctAnswer: 0,
    },
  },

  // --------------------------------------------------------
  // PREDICT QUESTION 6
  // --------------------------------------------------------
  "predict-continue": {
    explanation:
      "The continue statement skips the rest of the current iteration and moves to the next iteration. It does not terminate the loop.",

    example: `for i in range(5):
    if i == 2:
        continue
    print(i)`,

    challenge: {
      question:
        "What will this code print?",

      options: [
        "0, 1, 2, 3, 4",
        "0, 1, 3, 4",
        "2, 3, 4",
        "0, 1",
      ],

      correctAnswer: 1,
    },
  },

  // --------------------------------------------------------
  // PREDICT QUESTION 7
  // --------------------------------------------------------
  "predict-7": {
    explanation:
      "A while loop must eventually reach a state where its condition becomes False. Updating the loop variable changes the condition over time and prevents an infinite loop.",

    example: `x = 1

while x < 4:
    print(x)
    x += 1`,

    challenge: {
      question:
        "What will this code print?",

      options: [
        "1, 2, 3",
        "1, 2, 3, 4",
        "0, 1, 2, 3",
        "The loop runs forever",
      ],

      correctAnswer: 0,
    },
  },

  // --------------------------------------------------------
  // PREDICT QUESTION 8
  // --------------------------------------------------------
  "predict-8": {
    explanation:
      "A while loop can become infinite if its condition never becomes False. If the variable controlling the condition is never updated appropriately, the loop may continue forever.",

    example: `x = 0

while x < 3:
    print(x)`,

    challenge: {
      question:
        "What happens when this code runs?",

      options: [
        "It prints 0 once.",
        "It prints 0, 1, 2.",
        "It runs forever.",
        "It produces a syntax error.",
      ],

      correctAnswer: 2,
    },
  },

  // --------------------------------------------------------
  // PREDICT QUESTION 9
  // --------------------------------------------------------
  "predict-9": {
    explanation:
      "A nested loop is a loop inside another loop. For every iteration of the outer loop, the inner loop completes all of its iterations.",

    example: `for i in range(2):
    for j in range(3):
        print(i, j)`,

    challenge: {
      question:
        "How many times will print() execute?",

      options: [
        "2 times",
        "3 times",
        "5 times",
        "6 times",
      ],

      correctAnswer: 3,
    },
  },
};

export const concepts = {
  loops: {
    id: "loops",

    title: "Loops",

    description:
      "Loops allow a program to repeatedly execute a block of code.",

    explanation: `
FOR LOOP

Use a for loop when iterating through a sequence
or when you know the number of iterations.

for i in range(5):
    print(i)

Remember:
range(5) → 0, 1, 2, 3, 4


WHILE LOOP

A while loop repeats while a condition is True.

x = 0

while x < 5:
    print(x)
    x += 1


LOOP CONTROLS

break    → stops the loop
continue → skips the current iteration
pass     → does nothing
`,

    examples: {
      forLoop: `for i in range(5):
    print(i)`,

      whileLoop: `x = 0
while x < 5:
    print(x)
    x += 1`,
    },

    // ========================================================
    // THEORY QUESTIONS
    // ========================================================

    theoryQuestions: [
      {
        id: "loop-type",
        question:
          "Which loop is generally used when the number of iterations is known?",

        options: [
          "while",
          "for",
          "if",
          "switch",
        ],

        correctAnswer: 1,

        correctCode: `for i in range(5):
    print(i)`,
      },

      {
        id: "while-loop",
        question:
          "Which loop is generally used when a block of code should repeat while a condition is True?",

        options: [
          "for",
          "while",
          "if",
          "switch",
        ],

        correctAnswer: 1,

        correctCode: `x = 0

while x < 5:
    print(x)
    x += 1`,
      },

      {
        id: "break",
        question:
          "What is the purpose of the break statement in a loop?",

        options: [
          "Skips the current iteration",
          "Restarts the loop",
          "Terminates the loop",
          "Pauses the loop",
        ],

        correctAnswer: 2,

        correctCode: `for i in range(5):
    if i == 3:
        break
    print(i)`,
      },

      {
        id: "continue",
        question:
          "What does the continue statement do in Python?",

        options: [
          "Stops the loop completely",
          "Skips the current iteration and moves to the next",
          "Restarts the program",
          "Exits the function",
        ],

        correctAnswer: 1,

        correctCode: `for i in range(5):
    if i == 2:
        continue
    print(i)`,
      },

      {
        id: "range",
        question:
          "What does range(2, 8, 2) produce?",

        options: [
          "2, 4, 6",
          "2, 4, 6, 8",
          "0, 2, 4, 6",
          "2, 3, 4, 5, 6, 7",
        ],

        correctAnswer: 0,

        correctCode: `for i in range(2, 8, 2):
    print(i)`,
      },

      {
        id: "loop-update",
        question:
          "Why is it important to update the variable used in a while loop condition?",

        options: [
          "To make the program run faster",
          "To prevent the loop from becoming infinite",
          "To skip every iteration",
          "To restart the loop",
        ],

        correctAnswer: 1,

        correctCode: `x = 0

while x < 5:
    print(x)
    x += 1`,
      },
    ],

    // ========================================================
    // EXPLAIN QUESTIONS
    // ========================================================

    explainQuestions: [
      {
        id: "explain-loop",
        question:
          "What is a loop in Python, and what is the difference between a for loop and a while loop?",

        keywords: [
          "loop",
          "repeat",
          "repeated",
          "for",
          "while",
        ],

        expectedPoints: [
          "A loop repeats a block of code",
          "A for loop iterates over a sequence or a known number of iterations",
          "A while loop continues while a condition is True",
        ],

        correctCode: `for i in range(5):
    print(i)

x = 0
while x < 5:
    print(x)
    x += 1`,
      },

      {
        id: "explain-for-loop",
        question:
          "Explain how a for loop works in Python. Give an example using range() to print numbers from 1 to 5.",

        keywords: [
          "for",
          "loop",
          "range",
          "iterate",
          "sequence",
          "1",
          "5",
        ],

        expectedPoints: [
          "A for loop repeats code for each item in a sequence",
          "range() can generate a sequence of numbers",
          "range(1, 6) produces numbers from 1 through 5",
          "The stop value 6 is excluded",
        ],

        correctCode: `for number in range(1, 6):
    print(number)`,
      },

      {
        id: "explain-while-loop",
        question:
          "Explain how a while loop works in Python. Why must the condition eventually become False?",

        keywords: [
          "while",
          "condition",
          "True",
          "False",
          "repeat",
          "infinite",
          "update",
        ],

        expectedPoints: [
          "A while loop repeats while its condition is True",
          "The condition is checked before each iteration",
          "The loop should update a value so the condition can become False",
          "If the condition never becomes False, the loop can become infinite",
        ],

        correctCode: `x = 0

while x < 5:
    print(x)
    x += 1`,
      },

      {
        id: "explain-break-continue",
        question:
          "What do break and continue do inside a loop? Give a simple example of each.",

        keywords: [
          "break",
          "continue",
          "stop",
          "terminate",
          "skip",
          "iteration",
        ],

        expectedPoints: [
          "break terminates the loop completely",
          "continue skips the current iteration",
          "After continue, the loop moves to the next iteration",
          "The student gives an example of break",
          "The student gives an example of continue",
        ],

        correctCode: `for i in range(1, 6):
    if i == 3:
        break
    print(i)

for i in range(1, 6):
    if i == 3:
        continue
    print(i)`,
      },

      {
        id: "explain-range",
        question:
          "What does range() do in a for loop? Explain what range(2, 8, 2) produces.",

        keywords: [
          "range",
          "sequence",
          "start",
          "stop",
          "step",
          "2",
          "4",
          "6",
          "exclusive",
        ],

        expectedPoints: [
          "range() generates a sequence of numbers",
          "2 is the starting value",
          "8 is the stopping value and is excluded",
          "2 is the step value",
          "The result is 2, 4, 6",
        ],

        correctCode: `for number in range(2, 8, 2):
    print(number)`,
      },

      {
        id: "explain-nested-loop",
        question:
          "What is a nested loop in Python? Explain how one loop can run inside another loop.",

        keywords: [
          "nested",
          "loop",
          "inside",
          "outer",
          "inner",
          "repeat",
        ],

        expectedPoints: [
          "A nested loop is a loop inside another loop",
          "The outer loop controls the larger repetition",
          "The inner loop runs for each iteration of the outer loop",
          "Nested loops can be used for repeated combinations or patterns",
        ],

        correctCode: `for i in range(2):
    for j in range(3):
        print(i, j)`,
      },
    ],

    // ========================================================
    // PREDICT
    // ========================================================

    predictQuestions: [
      {
        id: "predict-loop-addition",
        code: `x = 2

for i in range(3):
    x = x + i

print(x)`,

        question:
          "What will this program print?",

        options: [
          "2",
          "3",
          "5",
          "6",
        ],

        correctAnswer: 2,

        correctCode: `x = 2

for i in range(3):
    x = x + i

print(x)`,
      },

      {
        id: "predict-loop-sum",
        code: `total = 0

for i in range(1, 5):
    total = total + i

print(total)`,

        question:
          "What will this program print?",

        options: [
          "5",
          "10",
          "15",
          "20",
        ],

        correctAnswer: 1,

        correctCode: `total = 0

for i in range(1, 5):
    total = total + i

print(total)`,
      },

      {
        id: "predict-loop-subtraction",
        code: `x = 10

for i in range(3):
    x = x - 2

print(x)`,

        question:
          "What will this program print?",

        options: [
          "4",
          "6",
          "8",
          "10",
        ],

        correctAnswer: 0,

        correctCode: `x = 10

for i in range(3):
    x = x - 2

print(x)`,
      },

      {
        id: "predict-loop-sub",
        code: `for i in range(1, 6, 2):
    print(i)`,

        question:
          "What will this program print?",

        options: [
          "1, 2, 3, 4, 5",
          "1, 3, 5",
          "2, 4, 6",
          "1, 3, 5, 7",
        ],

        correctAnswer: 1,

        correctCode: `for i in range(1, 6, 2):
    print(i)`,
      },

      {
        id: "predict-break",
        code: `for i in range(5):
    if i == 3:
        break
    print(i)`,

        question:
          "What will this program print?",

        options: [
          "0, 1, 2",
          "0, 1, 2, 3",
          "1, 2, 3",
          "0, 1, 2, 3, 4",
        ],

        correctAnswer: 0,

        correctCode: `for i in range(5):
    if i == 3:
        break
    print(i)`,
      },

      {
        id: "predict-continue",
        code: `for i in range(1, 6):
    if i == 3:
        continue
    print(i)`,

        question:
          "What will this program print?",

        options: [
          "1, 2, 3, 4, 5",
          "1, 2, 4, 5",
          "1, 3, 5",
          "2, 4",
        ],

        correctAnswer: 1,

        correctCode: `for i in range(1, 6):
    if i == 3:
        continue
    print(i)`,
      },
    ],

    // ========================================================
    // IMPLEMENT
    // ========================================================

    implementQuestions: [
      {
        id: "print-numbers-1-to-5",
        title: "Print numbers from 1 to 5",
        description:
          "Write a Python program that prints the numbers 1, 2, 3, 4 and 5 using a for loop.",
        difficulty: "Easy",

        variables: [
          {
            name: "number",
            purpose: "Stores the current number being processed by the loop.",
          },
        ],

        hint:
          "Use a for loop with range(). Remember that the stop value in range() is excluded.",

        starterCode: `for number in range(1, 6):
    # Write your code here
    pass`,

        correctCode: `for number in range(1, 6):
    print(number)`,

        expectedOutput: `1
2
3
4
5`,
      },

      {
        id: "print-first-5-even-numbers",
        title: "Print even numbers from 2 to 10",
        description:
          "Write a Python program that prints only the even numbers from 2 to 10 using a loop.",

        difficulty: "Easy",

        variables: [
          {
            name: "number",
            purpose: "Stores the current number being checked.",
          },
        ],

        hint:
          "You can use range() with a step of 2 to visit only the even numbers.",

        starterCode: `# Write your code here
pass`,

        correctCode: `for number in range(2, 11, 2):
    print(number)`,

        expectedOutput: `2
4
6
8
10`,
      },

      {
        id: "calculate-sum-1-to-5",
        title: "Calculate the sum from 1 to 5",
        description:
          "Write a Python program that calculates and prints the sum of the numbers from 1 to 5 using a loop.",

        difficulty: "Easy",

        variables: [
          {
            name: "total",
            purpose: "Stores the running sum of the numbers.",
          },
          {
            name: "number",
            purpose: "Stores the current number in the loop.",
          },
        ],

        hint:
          "Start total at 0. During each iteration, add the current number to total.",

        starterCode: `total = 0

# Write your loop here

print(total)`,

        correctCode: `total = 0

for number in range(1, 6):
    total = total + number

print(total)`,

        expectedOutput: `15`,
      },

      {
        id: "countdown-5-to-1",
        title: "Print a countdown from 5 to 1",
        description:
          "Write a Python program that prints the numbers 5, 4, 3, 2 and 1 using a for loop.",

        difficulty: "Medium",

        variables: [
          {
            name: "number",
            purpose: "Stores the current countdown number.",
          },
        ],

        hint:
          "When counting backwards, range() needs a negative step.",

        starterCode: `# Write your countdown loop here
pass`,

        correctCode: `for number in range(5, 0, -1):
    print(number)`,

        expectedOutput: `5
4
3
2
1`,
      },

      {
        id: "calculate-total-price",
        title: "Calculate the total price",
        description:
          "A shop has three prices: 10, 20 and 30. Write a Python program that uses a loop to calculate and print the total price.",

        difficulty: "Medium",

        variables: [
          {
            name: "total",
            purpose: "Stores the accumulated total price.",
          },
          {
            name: "price",
            purpose: "Stores the current price being processed.",
          },
        ],

        hint:
          "Start total at 0 and add each price to the existing total.",

        starterCode: `prices = [10, 20, 30]
total = 0

# Write your loop here

print(total)`,

        correctCode: `prices = [10, 20, 30]
total = 0

for price in prices:
    total = total + price

print(total)`,

        expectedOutput: `60`,
      },

      {
        id: "calculate-squares-1-to-5",
        title: "Print the squares from 1 to 5",
        description:
          "Write a Python program that prints the square of each number from 1 to 5 using a loop.",

        difficulty: "Medium",

        variables: [
          {
            name: "number",
            purpose: "Stores the current number.",
          },
          {
            name: "square",
            purpose: "Stores the square of the current number.",
          },
        ],

        hint:
          "A number's square is calculated by multiplying the number by itself or using the ** operator.",

        starterCode: `for number in range(1, 6):
    # Calculate and print the square
    pass`,

        correctCode: `for number in range(1, 6):
    square = number ** 2
    print(square)`,

        expectedOutput: `1
4
9
16
25`,
      },
    ],

    // ========================================================
    // DEBUG
    // ========================================================

    debugQuestions: [
      {
        id: "print-odd-numbers-1-to-9",

        title: "Print odd numbers from 1 to 9",

        description:
          "The program should print only the odd numbers from 1 to 9. The current program prints every number. Find and fix the mistake.",

        bugType: "incorrect_condition",

        difficulty: "Easy",

        variables: [
          {
            name: "number",
            purpose: "Stores the current number being processed by the loop.",
          },
        ],

        hint:
          "Odd numbers are numbers that are not divisible by 2. Think about using the % operator.",

        starterCode: `for number in range(1, 10):
    print(number)`,

        expectedOutput: `1
3
5
7
9`,
      },

      {
        id: "calculate-sum-1-to-10",

        title: "Calculate the sum from 1 to 10",

        description:
          "The program should calculate and print the sum of all numbers from 1 to 10. There are two mistakes in the code. Find and fix both.",

        bugType: "range_and_assignment",

        difficulty: "Easy",

        variables: [
          {
            name: "total",
            purpose: "Stores the running total of the numbers.",
          },

          {
            name: "number",
            purpose: "Stores the current number in the loop.",
          },
        ],

        hint:
          "Check whether 10 is included in the range. Then check whether total is being added to or replaced by the current number.",

        starterCode: `total = 0

for number in range(1, 10):
    total = number

print(total)`,

        expectedOutput: `55`,
      },

      {
        id: "multiplication-table-of-5",

        title: "Print the multiplication table of 5",

        description:
          "The program should print the multiplication table of 5 from 1 to 10. The calculation uses the wrong operator.",

        bugType: "wrong_operator",

        difficulty: "Easy",

        variables: [
          {
            name: "multiplier",
            purpose: "Stores the number that 5 is multiplied by.",
          },

          {
            name: "result",
            purpose: "Stores the result of the multiplication.",
          },
        ],

        hint:
          "A multiplication table uses multiplication, not addition.",

        starterCode: `for multiplier in range(1, 11):
    result = 5 + multiplier
    print(result)`,

        expectedOutput: `5
10
15
20
25
30
35
40
45
50`,
      },

      {
        id: "countdown-5-to-1",

        title: "Print a countdown",

        description:
          "The program should print the numbers 5 down to 1. The loop currently does not move in the correct direction.",

        bugType: "incorrect_range_step",

        difficulty: "Medium",

        variables: [
          {
            name: "number",
            purpose: "Stores the current countdown number.",
          },
        ],

        hint:
          "When counting backwards, the step in range() needs to be negative.",

        starterCode: `for number in range(5, 0):
    print(number)`,

        expectedOutput: `5
4
3
2
1`,
      },

      {
        id: "calculate-total-price",

        title: "Calculate the total price",

        description:
          "A shop has three prices: 10, 20 and 30. The program should calculate the total price. The current program keeps replacing the total instead of adding each price.",

        bugType: "accumulator_error",

        difficulty: "Medium",

        variables: [
          {
            name: "total",
            purpose: "Stores the accumulated price.",
          },

          {
            name: "price",
            purpose: "Stores the current price being processed.",
          },
        ],

        hint:
          "The total should keep its previous value and add the new price to it.",

        starterCode: `total = 0

for price in [10, 20, 30]:
    total = price

print(total)`,

        expectedOutput: `60`,
      },

      {
        id: "calculate-squares-1-to-5",

        title: "Print the squares from 1 to 5",

        description:
          "The program should print the square of each number from 1 to 5. The current calculation does not calculate a square.",

        bugType: "calculation_error",

        difficulty: "Medium",

        variables: [
          {
            name: "number",
            purpose: "Stores the current number.",
          },

          {
            name: "square",
            purpose: "Stores the square of the current number.",
          },
        ],

        hint:
          "To calculate a square, multiply the number by itself.",

        starterCode: `for number in range(1, 6):
    square = number * 2
    print(square)`,

        expectedOutput: `1
4
9
16
25`,
      },
    ],

    // ========================================================
    // APPLY
    // ========================================================
    applyQuestions: [
      {
        id: "print-practice-1-to-5",
        title: "Print Practice 1 to 5",
        description:
          "A teacher wants to print Practice 1 through Practice 5. Write a Python program using a loop.",
        difficulty: "Easy",
        variables: [
          {
            name: "number",
            purpose: "Stores the current practice number.",
          },
        ],
        hint:
          "Use a for loop with range(1, 6), then print the current number.",
        starterCode: `for number in range(1, 6):

    # Write your code here

    pass`,
        correctCode: `for number in range(1, 6):

    print("Practice", number)`,
        expectedOutput: `Practice 1
Practice 2
Practice 3
Practice 4
Practice 5`,
        adaptive: {
          skills: [
            "for_loop",
            "range",
            "loop_variable",
            "print_output",
          ],
          mistakes: [
            {
              id: "missing_range",
              check: "range",
              note:
                "The loop should visit numbers 1 through 5.",
              explanation:
                "Remember that the stop value in range() is excluded.",
              hint:
                "Use range(1, 6).",
            },
            {
              id: "wrong_range",
              check: "range",
              note:
                "Your range does not produce exactly 1, 2, 3, 4, 5.",
              explanation:
                "range() stops before its second value.",
              hint:
                "To include 5, use range(1, 6).",
            },
            {
              id: "missing_loop",
              check: "for_loop",
              note:
                "The task requires a loop.",
              explanation:
                "Use a for loop to repeat the printing operation.",
              hint:
                "Try: for number in range(1, 6):",
            },
            {
              id: "missing_print",
              check: "print",
              note:
                "Your loop does not print anything.",
              explanation:
                "The current number needs to be printed during every iteration.",
              hint:
                "Put print(...) inside the loop.",
            },
            {
              id: "wrong_output",
              check: "practice_output",
              note:
                "The numbers are being processed, but the required 'Practice' text is missing or incorrect.",
              explanation:
                "Each line should contain the word Practice followed by the current number.",
              hint:
                'Use print("Practice", number).',
            },
            {
              id: "indentation",
              check: "indentation",
              note:
                "The statement inside the loop needs to be indented.",
              explanation:
                "Python uses indentation to determine which statements belong to the loop.",
              hint:
                "Indent the print statement under the for loop.",
            },
          ],
        },
      },

      {
        id: "print-first-5-even-numbers",
        title: "Print the first 5 even numbers",
        description:
          "Write a Python program that prints the first five even numbers.",
        difficulty: "Easy",
        variables: [
          {
            name: "number",
            purpose: "Stores the current even number.",
          },
        ],
        hint:
          "Think about using range() with a step of 2.",
        starterCode: `# Write your solution here

pass`,
        correctCode: `for number in range(2, 11, 2):

    print(number)`,
        expectedOutput: `2
4
6
8
10`,
        adaptive: {
          skills: [
            "for_loop",
            "range",
            "range_step",
            "even_numbers",
            "print_output",
          ],
          mistakes: [
            {
              id: "wrong_start",
              check: "range_start",
              note:
                "The loop should start at the first even number: 2.",
              explanation:
                "The first five even numbers start at 2.",
              hint:
                "Start the range at 2.",
            },
            {
              id: "wrong_step",
              check: "range_step",
              note:
                "Your range is not moving through even numbers correctly.",
              explanation:
                "A step of 2 moves from one even number to the next.",
              hint:
                "Try range(2, 11, 2).",
            },
            {
              id: "wrong_stop",
              check: "range_stop",
              note:
                "Your range does not include all five even numbers.",
              explanation:
                "The stop value is excluded.",
              hint:
                "Use range(2, 11, 2).",
            },
            {
              id: "missing_print",
              check: "print",
              note:
                "The loop generates numbers but does not print them.",
              explanation:
                "The current number needs to be printed.",
              hint:
                "Put print(number) inside the loop.",
            },
            {
              id: "hardcoded_output",
              check: "hardcoded_output",
              note:
                "The solution appears to print the values manually instead of using the loop.",
              explanation:
                "The purpose of this task is to use a loop.",
              hint:
                "Use the loop variable to produce the output.",
            },
          ],
        },
      },

      {
        id: "calculate-total-score",
        title: "Calculate the total",
        description:
          "A student receives scores of 10, 20, 30, and 40. Use a loop to calculate and print the total score.",
        difficulty: "Medium",
        variables: [
          {
            name: "total",
            purpose: "Stores the running total.",
          },
          {
            name: "score",
            purpose: "Stores the current score.",
          },
        ],
        hint:
          "Start total at 0 and add each score to total.",
        starterCode: `scores = [10, 20, 30, 40]

total = 0

# Write your loop here

print(total)`,
        correctCode: `scores = [10, 20, 30, 40]

total = 0

for score in scores:

    total = total + score

print(total)`,
        expectedOutput: `100`,
        adaptive: {
          skills: [
            "for_loop",
            "list_iteration",
            "accumulator",
            "addition",
            "print_output",
          ],
          mistakes: [
            {
              id: "missing_loop",
              check: "list_loop",
              note:
                "The scores need to be processed using a loop.",
              explanation:
                "Each score in the list should be visited.",
              hint:
                "Use: for score in scores:",
            },
            {
              id: "wrong_initial_total",
              check: "total_initialization",
              note:
                "The running total should start at 0.",
              explanation:
                "An accumulator needs an initial value before the loop.",
              hint:
                "Use total = 0.",
            },
            {
              id: "replacement_instead_of_addition",
              check: "accumulator",
              note:
                "Your total is being replaced instead of accumulated.",
              explanation:
                "Each new score should be added to the existing total.",
              hint:
                "Use total = total + score or total += score.",
            },
            {
              id: "wrong_variable",
              check: "score_variable",
              note:
                "The loop should process each score from the scores list.",
              explanation:
                "The loop variable should represent the current score.",
              hint:
                "Use for score in scores:",
            },
            {
              id: "missing_print",
              check: "print",
              note:
                "The final total is not being printed.",
              explanation:
                "After the loop finishes, print the accumulated total.",
              hint:
                "Use print(total).",
            },
          ],
        },
      },

      {
        id: "create-countdown-5-to-1",
        title: "Create a countdown",
        description:
          "A game needs a countdown from 5 to 1. Write a loop that prints the countdown.",
        difficulty: "Medium",
        variables: [
          {
            name: "number",
            purpose: "Stores the current countdown number.",
          },
        ],
        hint:
          "Use range() with a negative step to count backwards.",
        starterCode: `# Write your countdown loop here

pass`,
        correctCode: `for number in range(5, 0, -1):

    print(number)`,
        expectedOutput: `5
4
3
2
1`,
        adaptive: {
          skills: [
            "for_loop",
            "range",
            "negative_step",
            "countdown",
            "print_output",
          ],
          mistakes: [
            {
              id: "wrong_start",
              check: "range_start",
              note:
                "The countdown should begin at 5.",
              explanation:
                "The first value in range() should be 5.",
              hint:
                "Start with range(5, ...).",
            },
            {
              id: "wrong_stop",
              check: "range_stop",
              note:
                "The range should continue down to 1.",
              explanation:
                "The stop value is excluded, so 0 is needed to include 1.",
              hint:
                "Use range(5, 0, -1).",
            },
            {
              id: "missing_negative_step",
              check: "range_step",
              note:
                "The loop is not moving backwards.",
              explanation:
                "A negative step makes range() count down.",
              hint:
                "Use a step of -1.",
            },
            {
              id: "missing_print",
              check: "print",
              note:
                "The countdown values are not being printed.",
              explanation:
                "Print the current number during each iteration.",
              hint:
                "Use print(number) inside the loop.",
            },
          ],
        },
      },

      {
        id: "calculate-squares-1-to-5",
        title: "Calculate squares",
        description:
          "A math program needs to print the squares of the numbers from 1 to 5.",
        difficulty: "Medium",
        variables: [
          {
            name: "number",
            purpose: "Stores the current number.",
          },
          {
            name: "square",
            purpose: "Stores the calculated square.",
          },
        ],
        hint:
          "A square is calculated by multiplying a number by itself.",
        starterCode: `for number in range(1, 6):

    # Calculate the square

    pass`,
        correctCode: `for number in range(1, 6):

    square = number * number

    print(square)`,
        expectedOutput: `1
4
9
16
25`,
        adaptive: {
          skills: [
            "for_loop",
            "range",
            "calculation",
            "square",
            "print_output",
          ],
          mistakes: [
            {
              id: "wrong_range",
              check: "range",
              note:
                "The loop should process numbers 1 through 5.",
              explanation:
                "The task requires five iterations.",
              hint:
                "Use range(1, 6).",
            },
            {
              id: "wrong_square",
              check: "square_calculation",
              note:
                "The calculation does not produce the square.",
              explanation:
                "A square is a number multiplied by itself.",
              hint:
                "Use number * number or number ** 2.",
            },
            {
              id: "missing_square_variable",
              check: "square_variable",
              note:
                "The calculated square is not stored as expected.",
              explanation:
                "The square variable should contain the calculated value.",
              hint:
                "Try square = number * number.",
            },
            {
              id: "missing_print",
              check: "print",
              note:
                "The calculated squares are not being printed.",
              explanation:
                "Each calculated square should be printed.",
              hint:
                "Use print(square).",
            },
          ],
        },
      },

      {
        id: "calculate-total-price",
        title: "Find the total price",
        description:
          "A shop has products costing 15, 25, 35, and 45. Use a loop to calculate and print the total price.",
        difficulty: "Medium",
        variables: [
          {
            name: "price",
            purpose: "Stores the current product price.",
          },
          {
            name: "total",
            purpose: "Stores the accumulated price.",
          },
        ],
        hint:
          "Use an accumulator: start total at 0 and add every price to it.",
        starterCode: `prices = [15, 25, 35, 45]

total = 0

# Write your loop here

print(total)`,
        correctCode: `prices = [15, 25, 35, 45]

total = 0

for price in prices:

    total = total + price

print(total)`,
        expectedOutput: `120`,
        adaptive: {
          skills: [
            "for_loop",
            "list_iteration",
            "accumulator",
            "addition",
            "print_output",
          ],
          mistakes: [
            {
              id: "missing_list_loop",
              check: "list_loop",
              note:
                "The program needs to process every price in the prices list.",
              explanation:
                "A loop should visit each price one at a time.",
              hint:
                "Use: for price in prices:",
            },
            {
              id: "wrong_initial_total",
              check: "total_initialization",
              note:
                "The total should start at 0.",
              explanation:
                "The accumulator needs an initial value.",
              hint:
                "Use total = 0.",
            },
            {
              id: "replacement_instead_of_addition",
              check: "accumulator",
              note:
                "Your total is being replaced instead of increased.",
              explanation:
                "Each price must be added to the existing total.",
              hint:
                "Use total = total + price.",
            },
            {
              id: "wrong_loop_variable",
              check: "price_variable",
              note:
                "The loop should process one price at a time.",
              explanation:
                "The current price should come from the prices list.",
              hint:
                "Use for price in prices:",
            },
            {
              id: "missing_print",
              check: "print",
              note:
                "The final total is not being printed.",
              explanation:
                "Print the accumulated total after the loop.",
              hint:
                "Use print(total).",
            },
          ],
        },
      },
    ],

  },
};
