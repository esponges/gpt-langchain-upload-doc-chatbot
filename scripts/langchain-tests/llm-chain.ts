import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";

const chatModel = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
});

// should not give a good answer since it doesn't know what LangSmith is
// const newModel = await chatModel.invoke("what is LangSmith?");

// AIMessage {
//   lc_serializable: true,
//   lc_kwargs: {
//     content: `There is no specific term or widely known definition for "LangSmith." It could potentially be a reference to a person's name or a unique term used within a specific context or industry. Without more information or context, it is difficult to provide a specific answer.`,
//     additional_kwargs: { function_call: undefined, tool_calls: undefined }
//   },
//   lc_namespace: [ 'langchain_core', 'messages' ],
//   content: `There is no specific term or widely known definition for "LangSmith." It could potentially be a reference to a person's name or a unique term used within a specific context or industry. Without more information or context, it is difficult to provide a specific answer.`,
//   name: undefined,
//   additional_kwargs: { function_call: undefined, tool_calls: undefined }
// }

// lets add a prompt template
const prompt = ChatPromptTemplate.fromMessages([
  ["system", "You are a world class technical documentation writer."],
  ["user", "{anyInputNameYouWantToPassIn}"],
]);

// combine for simple LLM chain
const chain = prompt.pipe(chatModel);

export const invocation = await chain.invoke({
  anyInputNameYouWantToPassIn: "what is LangSmith?",
});

// might now hallucinate (depending its training data) a good answer in a technical documentation context
/* AIMessage {
  lc_serializable: true,
  lc_kwargs: {
    content: 'LangSmith is a software development company specializing in language translation and localization services. They provide innovative technologies and solutions to help businesses adapt their products and services for global markets. With a team of skilled linguists and developers, LangSmith offers a range of services including translation, localization, cultural adaptation, and quality assurance. Their expertise helps companies effectively communicate with customers in different languages and cultures, enabling them to expand their reach and enhance user experiences.',
    additional_kwargs: { function_call: undefined, tool_calls: undefined }
  },
  lc_namespace: [ 'langchain_core', 'messages' ],
  content: 'LangSmith is a software development company specializing in language translation and localization services. They provide innovative technologies and solutions to help businesses adapt their products and services for global markets. With a team of skilled linguists and developers, LangSmith offers a range of services including translation, localization, cultural adaptation, and quality assurance. Their expertise helps companies effectively communicate with customers in different languages and cultures, enabling them to expand their reach and enhance user experiences.',
  name: undefined,
  additional_kwargs: { function_call: undefined, tool_calls: undefined }
} */

