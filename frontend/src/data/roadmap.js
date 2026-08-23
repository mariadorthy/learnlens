export const roadmap = [
  {
    id: "variables",
    name: "Variables & Data Types",
    level: "Basic",
    description:
      "Learn how to store and work with different types of data.",
    prerequisite: null,
    order: 1,
    available: false,
  },

  {
    id: "conditions",
    name: "Conditions",
    level: "Basic",
    description:
      "Learn how programs make decisions using conditions.",
    prerequisite: "variables",
    order: 2,
    available: false,
  },

  {
    id: "loops",
    name: "Loops",
    level: "Intermediate",
    description:
      "Learn how to repeat instructions using loops.",
    prerequisite: "conditions",
    order: 3,
    available: true,
  },

  {
    id: "functions",
    name: "Functions",
    level: "Intermediate",
    description:
      "Learn how to organize reusable blocks of code.",
    prerequisite: "loops",
    order: 4,
    available: false,
  },

  {
    id: "lists",
    name: "Lists & Arrays",
    level: "Advanced",
    description:
      "Learn how to store and process collections of data.",
    prerequisite: "functions",
    order: 5,
    available: false,
  },
];