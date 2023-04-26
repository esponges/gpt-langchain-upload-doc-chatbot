import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { getPineconeIndex, pinecone } from './pinecone-client';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { Document } from 'langchain/document';
import { PineconeClient, UpsertRequest } from '@pinecone-database/pinecone';
import { OpenAI } from 'langchain';
import { OpenAIApi, Configuration } from 'openai';

const textToVector = async (text: string) => {
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

    const vectors = await textToVector(content);

    // we'll use the only index we have
    const pineconeIndex = await getPineconeIndex(pineconeClient);

    const upsertRequest: UpsertRequest = {
      vectors: [
        {
          // test
          id: '2',
          values: vectors.data.data[0].embedding,
          // todo: figure out metadata error here
          // metadata,
        },
      ],
      namespace: 'test-namespace-wednesday',
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
