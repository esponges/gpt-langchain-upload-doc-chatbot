// for building chatbots that can retrieve information from a conversation history
import { createHistoryAwareRetriever } from 'langchain/chains/history_aware_retriever';
import { MessagesPlaceholder } from '@langchain/core/prompts';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { cheerioStore } from './vector-stores';

// prompt template for chatbot
const historyAwarePrompt = ChatPromptTemplate.fromMessages([
  new MessagesPlaceholder('chat_history'),
  ['user', '{input}'],
  [
    'user',
    'Given the above conversation, generate a search query to look up in order to get information relevant to the conversation',
  ],
]);

const retriever = cheerioStore.asRetriever();

// chain
const historyAwareRetrieverChain = await createHistoryAwareRetriever({
  llm: chatModel,
  retriever,
  rephrasePrompt: historyAwarePrompt,
});

// simulate a conversation
import { HumanMessage, AIMessage } from '@langchain/core/messages';
import { chatModel } from './common';
import { createStuffDocumentsChain } from 'langchain/chains/combine_documents';
import { createRetrievalChain } from 'langchain/chains/retrieval';

const chatHistory = [
  new HumanMessage('Can LangSmith help test my LLM applications?'),
  new AIMessage('Yes!'),
];

// const searchQuery = await historyAwareRetrieverChain.invoke({
//   chat_history: chatHistory,
//   input: 'Tell me how!',
// });

// console.log({ searchQuery });

// it will return a QUERY with the documents that are most relevant to the conversation
// see output like: https://smith.langchain.com/public/0f4e5ff4-c640-4fe1-ae93-8eb5f32382fc/r

// lets make it actually make a prediction
const historyAwareRetrievalPrompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    'Answer the following question based only on the below context:\n{context}',
  ],
  new MessagesPlaceholder('chat_history'),
  ['user', '{input}'],
]);

// combine for simple LLM chain
const historyAwareCombineDocsChain = await createStuffDocumentsChain({
  llm: chatModel,
  prompt: historyAwareRetrievalPrompt,
});

const conversationalRetrievalChain = await createRetrievalChain({
  // this contains the context
  retriever: historyAwareRetrieverChain,
  combineDocsChain: historyAwareCombineDocsChain,
});

const predition = await conversationalRetrievalChain.invoke({
  chat_history: [
    new HumanMessage('Can LangSmith help test my LLM applications?'),
    new AIMessage('Yes!'),
  ],
  input: 'Tell me how!',
});

console.log({ predition });
