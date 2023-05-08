import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
// import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { getPineconeIndex } from './pinecone-client';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { PineconeClient } from '@pinecone-database/pinecone';
// import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import * as fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import { Document } from 'langchain/document';

const DOCS_MAX_LENGTH = 150;

// parse pdf into text
async function extractTextFromPDF(filePath: string): Promise<string> {
  const data = await fs.promises.readFile(filePath);
  const loadingTask = pdfjsLib.getDocument({ data });

  const pdf = await loadingTask.promise;

  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    // had to add this since this type since I'd get a type error
    // despite filtering out the items that don't have the str property
    type StringItem = typeof content.items[0] & { str: string };

    const textItems = content.items.filter((item) =>
      item.hasOwnProperty('str'),
    ) as StringItem[];

    const pageText = textItems.map((item) => item.str).join('');

    text += pageText;
  }

  return text;
}

export const langchainPineconeUpsert = async (
  filePath: string,
  pineconeClient: PineconeClient,
  fileName: string,
) => {
  // use pdfjs to load pdf
  // https://js.langchain.com/docs/modules/indexes/document_loaders/examples/file_loaders/pdf
  // const loader = new PDFLoader(filePath, {
  //   pdfjs: () => import('pdfjs-dist/legacy/build/pdf.js'),
  //   splitPages: false,
  // });

  const pdfDistText = await extractTextFromPDF(filePath);

  // const pdf = await loader.load();

  // list collections - we'll use the first one which is the default for this example
  const pineconeIndex = await getPineconeIndex(pineconeClient);

  /* Split text into chunks */
  // const textSplitter = new RecursiveCharacterTextSplitter({
  //   chunkSize: 1000,
  //   chunkOverlap: 200,
  // });

  // const docs = await textSplitter.splitDocuments(pdf);
  const docs = [
    new Document({
      metadata: { test: 'foo' },
      pageContent: pdfDistText,
    }),
  ];

  // todo: add threshold for big documents
  if (docs.length > DOCS_MAX_LENGTH) {
    throw new Error('Please upload a smaller document');
  }

  // add documents to index
  await PineconeStore.fromDocuments(docs, new OpenAIEmbeddings(), {
    pineconeIndex,
    namespace: fileName,
  });
};
