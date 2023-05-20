import * as fs from 'fs';
import { readFile } from 'fs/promises';

import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';

import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { getPineconeIndex } from './pinecone';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Document } from 'langchain/document';
import { BaseDocumentLoader } from 'langchain/document_loaders';

import { PineconeClient } from '@pinecone-database/pinecone';

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
                // todo: add proper metadata
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
  // use pdfjs to load pdf
  // https://js.langchain.com/docs/modules/indexes/document_loaders/examples/file_loaders/pdf
  const loader = new PDFLoader(filePath, {
    pdfjs: () => import('pdfjs-dist/legacy/build/pdf.js'),
  });

  const pdf = await loader.load();

  // const pdfDistText = await extractTextFromPDF(filePath);

  // const docs = [
  //   new Document({
  //     // todo: figure out metadata
  //     metadata: { test: 'foo' },
  //     pageContent: pdfDistText,
  //   }),
  // ];

  // list collections - we'll use the first one which is the default for this example
  const pineconeIndex = await getPineconeIndex(pineconeClient);

  // split into chunks
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const docs = await textSplitter.splitDocuments(pdf);
  const verifiedDocs = verifyDocumentPdfMetadata(docs);

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

/*
 * This is alternative to using pdfjs-dist, pdfjs-dist is the way that is mentioned
 * by the langchain docs but (it adds the line breaks \n\n\ correctly) but I'm not sure
 * if it's the best way to do it. I'm leaving this here for now in case I need to use it
 */
const extractTextFromPDF = async (filePath: string): Promise<string> => {
  const data = await fs.promises.readFile(filePath);
  const loadingTask = pdfjsLib.getDocument({ data });

  const pdf = await loadingTask.promise;

  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    // had to add this since this type since I'd get a type error
    // despite filtering out the items that don't have the str property
    type StringItem = (typeof content.items)[0] & { str: string };

    const textItems = content.items.filter((item) =>
      item.hasOwnProperty('str'),
    ) as StringItem[];

    const pageText = textItems.map((item) => item.str).join('');

    text += pageText;
  }

  return text;
};



export abstract class BufferLoader extends BaseDocumentLoader {
  constructor(public filePathOrBlob: string | Blob) {
    super();
  }

  protected abstract parse(
    raw: Buffer,
    metadata: Document['metadata'],
  ): Promise<Document[]>;

  public async load(): Promise<Document[]> {
    let buffer: Buffer;
    let metadata: Record<string, string>;
    if (typeof this.filePathOrBlob === 'string') {
      buffer = await readFile(this.filePathOrBlob);
      metadata = { source: this.filePathOrBlob };
    } else {
      buffer = await this.filePathOrBlob
        .arrayBuffer()
        .then((ab) => Buffer.from(ab));
      metadata = { source: 'blob', blobType: this.filePathOrBlob.type };
    }
    return this.parse(buffer, metadata);
  }
}

export class CustomPDFLoader extends BufferLoader {
  public async parse(
    raw: Buffer,
    metadata: Document['metadata'],
  ): Promise<Document[]> {
    const { pdf } = await PDFLoaderImports();
    const parsed = await pdf(raw);
    return [
      new Document({
        pageContent: parsed.text,
        metadata: {
          ...metadata,
          pdf_numpages: parsed.numpages,
        },
      }),
    ];
  }
}

async function PDFLoaderImports() {
  try {
    // the main entrypoint has some debug code that we don't want to import
    const { default: pdf } = await import('pdf-parse/lib/pdf-parse.js');
    return { pdf };
  } catch (e) {
    console.error(e);
    throw new Error(
      'Failed to load pdf-parse. Please install it with eg. `npm install pdf-parse`.',
    );
  }
}
