import { ChatOpenAI } from "@langchain/openai";

const chatModel = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
});

// should not give a good answer since it doesn't know what LangSmith is
const newModel = await chatModel.invoke("what is LangSmith?");

console.log(newModel);
