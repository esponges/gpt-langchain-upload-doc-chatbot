import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "langchain/schema";

const extractionFunctionSchema = {
  name: "extractor",
  description: "Extracts fields from the input.",
  parameters: {
    type: "object",
    properties: {
      tone: {
        type: "string",
        enum: ["positive", "negative"],
        description: "The overall tone of the input",
      },
      word_count: {
        type: "number",
        description: "The number of words in the input",
      },
      chat_response: {
        type: "string",
        description: "A response to the human's input",
      },
    },
    required: ["tone", "word_count", "chat_response"],
  },
};

const model = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: "gpt-4",
}).bind({
  functions: [extractionFunctionSchema],
  function_call: { name: "extractor" },
});

// const result = await model.invoke([new HumanMessage("What a beautiful day!")]);

// console.log({ result });

const lessonPlannerSchema = {
  name: "lesson_planner",
  description: "Ayuda a educadores a desarrollar lecciones efectivas y atractivas.",
  parameters: {
    type: "object",
    properties: {
      objectives: {
        type: "array",
        items: {
          type: "string",
        },
        description: "Objetivos de aprendizaje: De 2 a 4 objetivos claros para el tema solicitado.",
      },
      previous_knowledge: {
        type: "array",
        items: {
          type: "string",
        },
        description: "Conocimientos previos: Una lista de 2 a 4 conocimientos esenciales que los estudiantes necesitan como base.",
      },
      teaching_tips: {
        type: "array",
        items: {
          type: "string",
        },
        description: "Tips de enseñanza: Consejos para que los educadores impartan el tema de manera efectiva.",
      },
      common_errors: {
        type: "array",
        items: {
          type: "string",
        },
        description: "Errores comunes: Descripción de los errores habituales de los estudiantes en este tema.",
      },
      usage: {
        type: "array",
        items: {
          type: "string",
        },
        description: "Uso y aplicación: Explicación de cómo se aplica lo aprendido en contextos prácticos.",
      },
    },
    required: ["objectives", "previous_knowledge", "teaching_tips", "common_errors", "usage"],
  },
};

const lessonModel = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: "gpt-4",
}).bind({
  functions: [lessonPlannerSchema],
  function_call: { name: "lesson_planner" },
});

const lessonResult = await lessonModel.invoke([
  new HumanMessage("Un plan de lección para enseñar a los estudiantes sobre la Revolución Francesa."),
]);

console.log({ lessonResult });

