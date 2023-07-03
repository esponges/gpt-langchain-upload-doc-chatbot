// import * as fs from 'fs';
// import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';

import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Document } from 'langchain/document';

import { PineconeClient } from '@pinecone-database/pinecone';

import { getPineconeIndex } from '@/utils/pinecone';
// import { prisma } from '@/utils/prisma';
import { drizzleDb } from '@/utils/drizzle';
import { langChainDocs, docs } from '@/drizzle/schema';
import { randomUUID } from 'crypto';

const DOCS_MAX_LENGTH = 150;

/*
 * When parsing with pdfjsLib, the metadata.pdf.metadata object is sometimes empty.
 * this empty object causes an error when trying to ingest the data into pinecone.
 * This function checks whether the metadata.pdf.metadata object is empty and if so,
 * adds some dummy data to it.
 */
const verifyDocumentPdfMetadata = (docs: Document[]): Document[] => {
  const verifiedDocs: Document[] = [];

  docs.forEach((doc) => {
    if (doc.metadata.pdf.metadata) {
      // check whether the pdf metadata is falsy or an empty object
      if (Object.keys(doc.metadata.pdf.metadata).length > 0) {
        verifiedDocs.push(doc);
      } else {
        // otherwise add a foo: bar object to the metadata.pdf.metadata
        const docWithPdfMetadata: Document = {
          ...doc,
          metadata: {
            ...doc.metadata,
            pdf: {
              ...doc.metadata.pdf,
              metadata: {
                // todo: add proper metadata, probably making the model to extract the metadata from each
                // doc and then adding it here - consider it could be expensive -and slow- to do this
                foo: 'bar',
              },
            },
          },
        };

        verifiedDocs.push(docWithPdfMetadata);
      }
    }
  });

  return verifiedDocs;
};

export const langchainPineconeUpsert = async (
  filePath: string,
  pineconeClient: PineconeClient,
  fileName: string,
) => {
  const docs = await getPdfText(filePath);
  const verifiedDocs = verifyDocumentPdfMetadata(docs);

  // list collections - we'll use the first one which is the default for this example
  const pineconeIndex = await getPineconeIndex(pineconeClient);

  console.log(docs);
  // todo: add threshold for big documents
  if (docs.length > DOCS_MAX_LENGTH) {
    throw new Error('Please upload a smaller document');
  }

  // add documents to index
  await PineconeStore.fromDocuments(verifiedDocs, new OpenAIEmbeddings(), {
    pineconeIndex,
    namespace: fileName,
    textKey: 'text',
  });
};

export const langchainUploadDocs = async (
  filePath: string,
  fileName: string,
) => {
  const docs = await getPdfText(filePath);

  await drizzleInsertDocs(docs, fileName);
};

// const prismaInsertDocs = async (docsToUpload: Document[], fileName: string) => {
//   await prisma.langChainDocs.create({
//     data: {
//       name: fileName,
//       nameSpace: fileName,
//       docs: {
//         create: docsToUpload.map((doc) => ({
//           name: fileName,
//           metadata: JSON.stringify(doc.metadata),
//           pageContent: doc.pageContent,
//         })),
//       },
//     },
//   });
// };

const drizzleInsertDocs = async (docsToUpload: Document[], fileName: string) => {
  await drizzleDb.transaction(async () => {
    const newDocId = randomUUID();

    await drizzleDb.insert(langChainDocs).values({
      id: newDocId,
      name: fileName,
      nameSpace: fileName,
    }).returning();

    await drizzleDb.insert(docs).values(
      docsToUpload.map((doc) => ({
        id: randomUUID(),
        name: fileName,
        metadata: JSON.stringify(doc.metadata),
        pageContent: doc.pageContent,
        langChainDocsId: newDocId,
      })),
    );
  });
};

const getPdfText = async (
  filePath: string,
): Promise<Document<Record<string, any>>[]> => {
  // use pdfjs to load pdf
  // https://js.langchain.com/docs/modules/indexes/document_loaders/examples/file_loaders/pdf
  const loader = new PDFLoader(filePath, {
    // pdfjs: () => import('pdfjs-dist/legacy/build/pdf.js'),
  });

  const pdf = await loader.load();

  // split into chunks
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  // this outputs an array of Document objects
  const docs = await textSplitter.splitDocuments(pdf);

  if (process.env.MAX_DOC_LENGTH && docs.length > parseInt(process.env.MAX_DOC_LENGTH)) {
    throw new Error('Please upload a smaller document');
  }

  return docs;
};

// /*
//  * This is alternative to using pdfjs-dist, pdfjs-dist is the way that is mentioned
//  * by the langchain docs but (it adds the line breaks \n\n\ correctly) but I'm not sure
//  * if it's the best way to do it. I'm leaving this here for now in case I need to use it
//  */
// const extractTextFromPDF = async (filePath: string): Promise<string> => {
//   const data = await fs.promises.readFile(filePath);
//   const loadingTask = pdfjsLib.getDocument({ data });

//   const pdf = await loadingTask.promise;

//   let text = '';
//   for (let i = 1; i <= pdf.numPages; i++) {
//     const page = await pdf.getPage(i);
//     const content = await page.getTextContent();

//     // had to add this since this type since I'd get a type error
//     // despite filtering out the items that don't have the str property
//     type StringItem = (typeof content.items)[0] & { str: string };

//     const textItems = content.items.filter((item) =>
//       item.hasOwnProperty('str'),
//     ) as StringItem[];

//     const pageText = textItems.map((item) => item.str).join('');

//     text += pageText;
//   }

//   return text;
// };
