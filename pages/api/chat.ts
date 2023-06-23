import type { NextApiRequest, NextApiResponse } from 'next';
import { makeChain } from '@/utils/makechain';
import {
  pinecone,
} from '@/utils/pinecone';
import { getErrorMessage } from '@/utils/misc';
import { OpenAI } from 'langchain';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { HNSWLib } from 'langchain/vectorstores/hnswlib';
import { Document } from 'langchain/document';


interface IFormData {
  question: string;
  history: string;
  nameSpace: string;
}

interface ApiFormDataRequest extends NextApiRequest {
  body: IFormData;
}

export default async function handler(
  req: ApiFormDataRequest,
  res: NextApiResponse,
) {
  const { body } = req;
  const { nameSpace, question, history } = body;

  //only accept post requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!question || typeof question !== 'string') {
    return res.status(400).json({ message: 'No question in the request' });
  }

  
  try {
    const model = new OpenAI({});
    /* Load in the file we want to do question answering over */
    // const loader = new PDFLoader('public/lotr-world-wars.pdf');
  
    // const pdf = await loader.load();
    // /* Split the text into chunks */
    // const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000 });
    // const docs = await textSplitter.splitDocuments(pdf);
    const fakeDoc: Document = {
      metadata: {
        title: 'fake doc',
      },
      pageContent: 'Some fake content from a fake doc',
    };

    // console.log('the docs', docs);
    /* Create the vectorstore */
    const vectorStore = await HNSWLib.fromDocuments([fakeDoc], new OpenAIEmbeddings());
    
    const pineconeClient = pinecone;
    
    //create chain for conversational AI
    const chain = await makeChain(pineconeClient, nameSpace);
    
    //Ask a question using chat history
    // OpenAI recommends replacing newlines with spaces for best results
    const sanitizedQuestion = question.trim().replaceAll('\n', ' ');
    const response = await chain.call({
      question: sanitizedQuestion,
      chat_history: history || [],
    });

    res.status(200).json({ ...response, vectorStore });
  } catch (error: unknown) {
    console.log('error creating chain', error);
    res.status(500).json({ error: getErrorMessage(error) });
  }
}
