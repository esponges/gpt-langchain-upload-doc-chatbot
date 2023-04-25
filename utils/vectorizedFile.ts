import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import path from 'path';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { pinecone } from './pinecone-client';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { Document } from 'langchain/document';

export const pineConeUpsert = async (filePath: string) => {
  const text = path.join(process.cwd(), 'public', 'robot.pdf');
  const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000 });
  // const split = await textSplitter.createDocuments([text]);

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

    // get embeddings
    // const embeddings = new OpenAIEmbeddings({
    //   openAIApiKey: process.env.OPENAI_API_KEY,
    //   modelName: 'gpt-3.5-turbo',
    // });

    // test if pinecone is working by fetching existing index
    // list collections
    const collections = await pinecone.listIndexes();
    const pineconeIndex = await pinecone.Index(collections[0]);

    const docs = [
      new Document({
        metadata: { upload: metadata },
        pageContent: content,
      }),
    ];

    // // add documents to index
    await PineconeStore.fromDocuments(docs, new OpenAIEmbeddings(), {
      pineconeIndex,
      namespace: 'test-namespace-1',
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
