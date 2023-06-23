import { OpenAI } from 'langchain/llms/openai';
import { ConversationalRetrievalQAChain } from 'langchain/chains';
import { VectorStore } from 'langchain/dist/vectorstores/base';

const CONDENSE_PROMPT = `Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question.

Chat History:
{chat_history}
Follow Up Input: {question}
Standalone question:`;

const QA_PROMPT = `You are a helpful AI assistant. Use the following pieces of context to answer the question at the end.
If you don't know the answer, just say you don't know. DO NOT try to make up an answer.
If the question is not related to the context, politely respond that you are tuned to only answer questions that are related to the context.

{context}

Question: {question}
Helpful answer in markdown:`;

export const makeChain = async (vectorStore: VectorStore) => {
  const model = new OpenAI({
    temperature: 0.9, // increase temepreature to get more creative answers
    modelName: 'gpt-3.5-turbo', //change this to gpt-4 if you have access
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  return ConversationalRetrievalQAChain.fromLLM(
    model,
    vectorStore.asRetriever(),
    {
      // todo: deprecated
      qaTemplate: QA_PROMPT,
      // questionGeneratorTemplate: CONDENSE_PROMPT,
      // qaChainOptions: { prompt: QA_PROMPT },
      questionGeneratorChainOptions: { template: CONDENSE_PROMPT },
      returnSourceDocuments: true,
      // todo: this is required as per the docs, works first qn but not second
      // memory: new BufferMemory({
      //   // chatHistory: [],
      //   inputKey: 'question',
      //   memoryKey: 'chat_history',
      // })
    },
  );
};
