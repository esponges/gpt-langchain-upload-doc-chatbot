import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "@langchain/openai";
import { similarity } from "ml-distance";

// {
//   "title": "Full Stack Developer Assessment (Golang & React)",
//   "questions": [
//       {
//           "question_text": "What is one of the fundamental concepts in React?",
//           "question_type": "MULTIPLE_CHOICE",
//           "choices": [
//               "Inheritance",
//               "Component-based Architecture",
//               "Stored Procedures",
//               "Web Server Compilation"
//           ],
//           "correct_answer": "Component-based Architecture"
//       },
//       {
//           "question_text": "What is 'JSX' in the context of React?",
//           "question_type": "MULTIPLE_CHOICE",
//           "choices": [
//               "A new programming language",
//               "A styling library for React",
//               "A syntax extension for JavaScript",
//               "A package manager for React"
//           ],
//           "correct_answer": "A syntax extension for JavaScript"
//       },
//       {
//           "question_text": "How is the 'state' of a component in React defined?",
//           "question_type": "FREE_RESPONSE",
//           "choices": [],
//           "correct_answer": "The state of a component is defined as an object that holds some information that may change over the lifecycle of the component."
//       },
//       {
//           "question_text": "How do you typically ensure that your components only update when necessary?",
//           "question_type": "FREE_RESPONSE",
//           "choices": [],
//           "correct_answer": "By using shouldComponentUpdate() or PureComponent."
//       },
//       {
//           "question_text": "What is Goroutines in Golang?",
//           "question_type": "MULTIPLE_CHOICE",
//           "choices": [
//               "A testing library for Golang",
//               "A Golang task handler function",
//               "Golang function that can run concurrently with others",
//               "A concurrency model in Golang"
//           ],
//           "correct_answer": "Golang function that can run concurrently with others"
//       },
//       {
//           "question_text": "Which keyword is used for exception handling in Golang?",
//           "question_type": "MULTIPLE_CHOICE",
//           "choices": [
//               "try...catch",
//               "defer",
//               "finally",
//               "throws"
//           ],
//           "correct_answer": "defer"
//       },
//       {
//           "question_text": "How do you define a struct in Golang?",
//           "question_type": "FREE_RESPONSE",
//           "choices": [],
//           "correct_answer": "A struct is defined using the type keyword, followed by a name and the struct keyword. The fields of the struct are declared within curly braces. Each field has a name and a type."
//       },
//       {
//           "question_text": "How can you implement inheritance in Golang?",
//           "question_type": "FREE_RESPONSE",
//           "choices": [],
//           "correct_answer": "Inheritance in Golang can be implemented using embedded fields in structs."
//       },
//       {
//           "question_text": "How do you typically handle errors in a Go program?",
//           "question_type": "FREE_RESPONSE",
//           "choices": [],
//           "correct_answer": "Typically, errors in a Go program are handled by returning an error as an additional return value from a function that can fail, and checking it in the calling code."
//       },
//       {
//           "question_text": "What is the significance of the init function in a Go program?",
//           "question_type": "MULTIPLE_CHOICE",
//           "choices": [
//               "It runs automatically when the program starts, before main()",
//               "It initializes all global variables",
//               "It is used to initialize structures",
//               "It is a standard Go cleanup function"
//           ],
//           "correct_answer": "It runs automatically when the program starts, before main()"
//       }
//   ]
// }

const vectorStore = await MemoryVectorStore.fromTexts(
  // ["Hello world", "Bye bye", "hello nice world"],
  [
    "What is one of the fundamental concepts in React?\n1. Inheritance\n2. Component-based Architecture\n3. Stored Procedures\n4. Web Server Compilation\nCorrect answer: Component-based Architecture",
    "What is 'JSX' in the context of React?\n1. A new programming language\n2. A styling library for React\n3. A syntax extension for JavaScript\n4. A package manager for React\nCorrect answer: A syntax extension for JavaScript",
    "How is the 'state' of a component in React defined?\nThe state of a component is defined as an object that holds some information that may change over the lifecycle of the component.",
    "How do you typically ensure that your components only update when necessary?\nBy using shouldComponentUpdate() or PureComponent.",
    "What is Goroutines in Golang?\n1. A testing library for Golang\n2. A Golang task handler function\n3. Golang function that can run concurrently with others\n4. A concurrency model in Golang\nCorrect answer: Golang function that can run concurrently with others",
    "Which keyword is used for exception handling in Golang?\n1. try...catch\n2. defer\n3. finally\n4. throws\nCorrect answer: defer",
    "How do you define a struct in Golang?\nA struct is defined using the type keyword, followed by a name and the struct keyword. The fields of the struct are declared within curly braces. Each field has a name and a type.",
    "How can you implement inheritance in Golang?\nInheritance in Golang can be implemented using embedded fields in structs.",
    "How do you typically handle errors in a Go program?\nTypically, errors in a Go program are handled by returning an error as an additional return value from a function that can fail, and checking it in the calling code.",
    "What is the significance of the init function in a Go program?\n1. It runs automatically when the program starts, before main()\n2. It initializes all global variables\n3. It is used to initialize structures\n4. It is a standard Go cleanup function\nCorrect answer: It runs automatically when the program starts, before main()",
  ],
  [
    { id: 1, type: "React", level: "easy" },
    { id: 2, type: "React", level: "easy" },
    { id: 3, type: "React", level: "medium" },
    { id: 4, type: "React", level: "easy" },
    { id: 5, type: "Golang", level: "easy" },
    { id: 6, type: "Golang", level: "hard" },
    { id: 7, type: "Golang", level: "easy" },
    { id: 8, type: "Golang", level: "medium" },
    { id: 9, type: "Golang", level: "easy" },
    { id: 10, type: "Golang", level: "easy" },
  ],
  // [{ id: 2 }, { id: 1 }, { id: 3 }],
  new OpenAIEmbeddings(),
  { similarity: similarity.pearson }
);

const resultOne = await vectorStore.similaritySearch("level:easy type:react documents");
console.log(resultOne);
