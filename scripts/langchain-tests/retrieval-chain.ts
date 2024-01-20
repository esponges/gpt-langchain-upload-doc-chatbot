// give context to the model with web content
import { CheerioWebBaseLoader } from 'langchain/document_loaders/web/cheerio';

// parse data from web page using cheerio
const loader = new CheerioWebBaseLoader(
  'https://docs.smith.langchain.com/overview',
);

const docs = await loader.load();

// confirm we are getting some data
console.log(docs.length);
console.log(docs[0].pageContent.length);

// returns 45772

// which could be a lot of data for a model to process
// we must split it up into smaller chunks
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

const splitter = new RecursiveCharacterTextSplitter();
const splitDocs = await splitter.splitDocuments(docs);

// docs should now be split into smaller chunks
console.log(splitDocs.length);
console.log(splitDocs[0].pageContent.length);

// 60
// 441

// Lets make a vector store to store the data
import { OpenAIEmbeddings } from '@langchain/openai';

// use for embedding model to ingest data
const embeddings = new OpenAIEmbeddings();

import { MemoryVectorStore } from 'langchain/vectorstores/memory';

// create a local vector store and ingest the data
const vectorStore = await MemoryVectorStore.fromDocuments(
  splitDocs,
  embeddings,
);

console.log({ vectorStore });

import { createStuffDocumentsChain } from 'langchain/chains/combine_documents';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { chatModel } from './common';

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
