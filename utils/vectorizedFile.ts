import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { getPineconeIndex } from './pinecone-client';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { PineconeClient, UpsertRequest } from '@pinecone-database/pinecone';
import { OpenAIApi, Configuration } from 'openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

const DOCS_MAX_LENGTH = 150;

export const langchainPineconeUpsert = async (
  filePath: string,
  pineconeClient: PineconeClient,
  fileName: string,
) => {
  // use pdfjs to load pdf
  // https://js.langchain.com/docs/modules/indexes/document_loaders/examples/file_loaders/pdf
  const loader = new PDFLoader(filePath, {
    pdfjs: () => import('pdfjs-dist/legacy/build/pdf.js'),
    splitPages: false,
  });

  const pdf = await loader.load();
  // const content = pdf[0].pageContent;
  // const metadata = pdf[0].metadata;

  // list collections - we'll use the first one which is the default for this example
  const pineconeIndex = await getPineconeIndex(pineconeClient);

  /* Split text into chunks */
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const docs = await textSplitter.splitDocuments(pdf);
  
  // todo: add threshold for big documents
  if (docs.length > DOCS_MAX_LENGTH) {
    throw new Error('Please upload a smaller document');
  }

  // add documents to index
  await PineconeStore.fromDocuments(docs, new OpenAIEmbeddings(), {
    pineconeIndex,
    // todo make the namespace dynamic so we can store one namespace per pdf in pinecone
    namespace: fileName,
  });

  return pdf;
};

const openaiTextToVector = async (text: string) => {
  // as per openai docs, we need to trim and remove newlines
  const normalized = text.trim().replaceAll('\n', ' ');
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const openai = new OpenAIApi(configuration);
  const embeddings = await openai.createEmbedding({
    model: 'text-embedding-ada-002',
    /* to do, figure out error in the open ai api using the normalized text */
    // input: "the sad story of an ugly robot who didn't know how to love",
    input: normalized,
  });

  return embeddings;
};

/* 
  This strategy is not mentioned by the langchain docs, it appears not to work with the chain method.
  While this successfully creates a 1536 dimension vector and stores it can't be used in a conversational way.
  TODO: figure out why this doesn't work - ask in langchain
*/
export const pineconeUpsert = async (
  filePath: string,
  pineconeClient: PineconeClient,
) => {
  try {
    // use pdfjs to load pdf
    // https://js.langchain.com/docs/modules/indexes/document_loaders/examples/file_loaders/pdf
    const loader = new PDFLoader(filePath, {
      pdfjs: () => import('pdfjs-dist/legacy/build/pdf.js'),
      splitPages: false,
    });

    const pdf = await loader.load();
    const content = pdf[0].pageContent;
    const metadata = pdf[0].metadata;

    const vectors = await openaiTextToVector(content);

    // we'll use the only index we have
    const pineconeIndex = await getPineconeIndex(pineconeClient);

    const upsertRequest: UpsertRequest = {
      vectors: [
        {
          // test
          id: '1',
          values: vectors.data.data[0].embedding,
          // todo: figure out metadata error here
          // metadata,
        },
      ],
      // todo make the namespace dynamic so we can store one namespace per pdf in pinecone
      namespace: 'pdf-test',
    };

    const upsertResponse = await pineconeIndex.upsert({ upsertRequest });

    throw new Error('not implemented');

    return pdf;
  } catch (e) {
    // handle error
    if (e instanceof Error) {
      console.error(e.message);

      throw new Error(e.message);
    } else if (typeof e === 'string') {
      console.error(e);

      throw new Error(e);
    } else {
      console.error('Unknown error');

      throw new Error(
        'Unknown error when vectorizing and storing file in the pinecone index.',
      );
    }
  }
};
