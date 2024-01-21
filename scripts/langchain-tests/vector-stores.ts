/* using cheerio to get data from docs */
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
export const cheerioStore = await MemoryVectorStore.fromDocuments(
  splitDocs,
  embeddings,
);

console.log({ cheerioStore });
