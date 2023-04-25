import { OpenAI } from 'langchain/llms/openai';
import { ConversationalRetrievalQAChain } from 'langchain/chains';

import { HNSWLib } from 'langchain/vectorstores/hnswlib';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import * as fs from 'fs';
import path from 'path';
import * as pdfjs from 'pdfjs-dist';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { PineconeClient } from '@pinecone-database/pinecone';
import { getPineconeIndex, pinecone } from './pinecone-client';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { Document } from 'langchain/document';

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



export const makeChain = async (file: string) => {
  const pineconeIndex = await getPineconeIndex();

  const vectorStore = await PineconeStore.fromExistingIndex(
    new OpenAIEmbeddings(),
    { pineconeIndex },
  );

  console.log('vectorStore', vectorStore);

  const results = await vectorStore.similaritySearch("robot", 5);

  console.log('results', results);

  // const model = new OpenAI({
  //   temperature: 0, // increase temepreature to get more creative answers
  //   modelName: 'gpt-3.5-turbo', //change this to gpt-4 if you have access
  //   openAIApiKey: process.env.OPENAI_API_KEY,
  // });

  // // Load in the file we want to do question answering over
  // const filePath = path.join(process.cwd(), 'public', 'magic-lotr.txt');

  // let text: string;

  // // Split the text into chunks
  // const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000 });
  // let docs;

  // let pdfData;
  // if (file) {
  //   const loader = new PDFLoader(file);
  //   pdfData = await loader.load();
  // }

  // // if the file is a pdf, convert it to text with pdf-parse
  // if (file && file.endsWith('.pdf')) {
  //   const file = fs.readFileSync(filePath);
  //   // const pdfData = await pdf(file);

  //   pdfjs.getDocument(file).promise.then(async function (pdf) {
  //     const numPages = pdf.numPages;
  //     text = ''; // <-- Assign value to outer `text` variable

  //     for (let i = 1; i <= numPages; i++) {
  //       pdf.getPage(i).then(function (page) {
  //         page.getTextContent().then(function (content) {
  //           const pageText = content.items
  //             .map((item) => {
  //               if (item instanceof Object && 'str' in item) {
  //                 // `item` is an instance of `TextItem`
  //                 return item.str;
  //               }
  //               return '';
  //             })
  //             .join('');
  //           text += pageText;
  //         });
  //       });
  //     }

  //     // text will not be an array of strings, but a single string is required
  //     // turn into a single string
  //     docs = await textSplitter.createDocuments([text]);
  //   });
  // } else {
  //   text = fs.readFileSync(filePath, 'utf8');
  //   docs = await textSplitter.createDocuments([text]);
  // }

  // // Create the vectorstore
  // const vectorStore = await HNSWLib.fromDocuments(docs, new OpenAIEmbeddings());

  // console.log('make chain again');

  // const chain = ConversationalRetrievalQAChain.fromLLM(
  //   model,
  //   vectorStore.asRetriever(),
  //   {
  //     qaTemplate: QA_PROMPT,
  //     questionGeneratorTemplate: CONDENSE_PROMPT,
  //     returnSourceDocuments: true, //The number of source documents returned is 4 by default
  //   },
  // );
  // return chain;
};
