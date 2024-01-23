// for building chatbots that can retrieve information from a conversation history
import { createHistoryAwareRetriever } from 'langchain/chains/history_aware_retriever';
import { MessagesPlaceholder } from '@langchain/core/prompts';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { CheerioStoreInstance } from './vector-stores';

// prompt template for chatbot
const historyAwarePrompt = ChatPromptTemplate.fromMessages([
  new MessagesPlaceholder('chat_history'),
  ['user', '{input}'],
  [
    'user',
    'Given the above conversation, generate a search query to look up in order to get information relevant to the conversation',
  ],
]);

const cheerioStore = new CheerioStoreInstance();
const vectorStore = await cheerioStore.getStore();
const retriever = vectorStore.asRetriever();

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
    new HumanMessage('Tell me how!'),
    new AIMessage('LangSmith can help test your LLM applications in several ways:\n' +
    '\n' +
    '1. Edit Examples: You can quickly edit examples and add them to datasets using LangSmith. This allows you to expand the surface area of your evaluation sets and fine-tune your model for improved quality or reduced costs.\n' +
    '\n' +
    '2. Monitor Application: LangSmith can be used to monitor your LLM application in a similar way as debugging. You can log traces, visualize latency and token usage statistics, and troubleshoot specific issues as they arise. You can also assign tags or metadata to each run, such as correlation IDs or AB test variants, and filter runs accordingly.\n' +
    '\n' +
    '3. Associate Feedback with Runs: You can programmatically associate feedback with runs in your application. If your application has a thumbs up/down button, for example, you can use it to log feedback back to LangSmith. This helps track performance over time and identify underperforming data points, which can then be added to a dataset for future testing.\n' +
    '\n' +
    '4. Debugging Support: LangSmith provides tools for debugging LLMs, chains, and agents. You can use it to identify issues such as unexpected end results, looping agents, slower chains, or token usage. LangSmith offers a visualization of the exact inputs and outputs of LLM calls, making it easier to understand and debug them.\n' +
    '\n' +
    '5. Playground for Prompt Editing: LangSmith includes a playground feature where you can modify prompts of LLM calls and observe the resulting changes to the output. This allows you to experiment and test different input variations without the hassle of copying prompts to external playgrounds.\n' +
    '\n' +
    'Overall, LangSmith simplifies the testing and debugging process for LLM applications, providing various tools and features to improve the quality and performance of your models.')
  ],
  input: 'What was you first response to my question?',
});

console.log({ predition });
