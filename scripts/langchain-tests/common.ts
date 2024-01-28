import { ChatOpenAI } from "@langchain/openai";

export const chatModel = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: "gpt-4"
});
