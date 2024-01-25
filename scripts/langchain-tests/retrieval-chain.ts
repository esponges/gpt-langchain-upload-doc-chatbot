import { createStuffDocumentsChain } from 'langchain/chains/combine_documents';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { chatModel } from './common';
import { CheerioStoreInstance } from './vector-stores';

const getStore = async (storeName: string) => {


// pass a propmt now
const prompt =
  ChatPromptTemplate.fromTemplate(`Answer the following question based only on the provided context:

<context>
{context}
</context>

Question: {input}`);

const documentChain = await createStuffDocumentsChain({
  llm: chatModel,
  prompt,
});

console.log({ documentChain });

// use the vector store we've just created
import { createRetrievalChain } from 'langchain/chains/retrieval';

const cheerioStore = new CheerioStoreInstance();
const vectorStore = await cheerioStore.getStore();
const retriever = vectorStore.asRetriever();

const retrievalChain = await createRetrievalChain({
  combineDocsChain: documentChain,
  retriever,
});

// now we can invoke the chain with a question
const prediction = await retrievalChain.invoke({
  input: 'What is LangSmith?',
});

console.log({ prediction });

// it wont hallucinate now! it uses the real data from the web page

// prediction: {
//   input: 'What is LangSmith?',
//   chat_history: [],
//   context: [ [Document], [Document], [Document], [Document] ],
//   answer: 'LangSmith is a tool developed by LangChain that is used for debugging and monitoring language model applications. It helps identify issues such as unexpected outcomes, looping agents, slow chains, and token usage. It also allows for collaborative debugging and collecting examples for evaluation and improvement purposes. Additionally, LangSmith can log traces, visualize latency and token usage statistics, troubleshoot specific issues, and associate feedback with runs.'
// }
