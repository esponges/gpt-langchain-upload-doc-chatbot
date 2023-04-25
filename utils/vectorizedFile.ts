import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { getPineconeIndex, pinecone } from './pinecone-client';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { Document } from 'langchain/document';

export const pineconeUpsert = async (filePath: string) => {
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

    // list collections - we'll use the first one which is the default for this example
    const pineconeIndex = await getPineconeIndex();

    const docs = [
      new Document({
        metadata: { upload: metadata },
        pageContent: content,
      }),
    ];

    // add documents to index
    await PineconeStore.fromDocuments(docs, new OpenAIEmbeddings(), {
      pineconeIndex,
      // namespace: 'test-namespace-1',
    });

    return pdf;
  } catch (e) {
    // handle error
    if (e instanceof Error) {
      console.error(e.message);

      return e.message;
    } else if (typeof e === 'string') {
      console.error(e);

      return e;
    } else {
      console.error('Unknown error');

      return 'Unknown error when vectorizing and storing file in the pinecone index.';
    }
  }
};
