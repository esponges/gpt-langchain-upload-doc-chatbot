import type { NextApiRequest, NextApiResponse } from 'next';
import { makeChain } from '@/utils/makechain';
import { getErrorMessage } from '@/utils/misc';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { HNSWLib } from 'langchain/vectorstores/hnswlib';
import { Document } from 'langchain/document';
import { getDocumentsFromDB } from '@/utils/prisma';
import { AIChatMessage, BaseChatMessage, HumanChatMessage } from 'langchain/schema';


interface IFormData {
  question: string;
  history: Array<Array<string>>;
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

  // fix TypeError: chatMessage._getType is not a function
  // solution found here https://github.com/hwchase17/langchainjs/issues/1573#issuecomment-1582636486
  let chatHistory: BaseChatMessage[] = [];
  history?.forEach((_, idx) => {
    chatHistory.push(new HumanChatMessage(history[idx][0]));
    chatHistory.push(new AIChatMessage(history[idx][1]));
  });
    
  try {
    /* Load in the file we want to do question answering over */
    // const loader = new PDFLoader('public/lotr-world-wars.pdf');
  
    // const pdf = await loader.load();
    // /* Split the text into chunks */
    // const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000 });
    // const docs = await textSplitter.splitDocuments(pdf);
    const sqlDocs = await getDocumentsFromDB(nameSpace);
    const documents: Document<Record<string, any>>[] | null = sqlDocs?.docs.map((doc) => {
      const { id, createdAt, metadata, pageContent, name, langChainDocsId } = doc;
      const document = new Document({
        pageContent,
        metadata: JSON.parse(metadata),
      });
      return document;
    }) ?? null;

    if (!documents) {
      return res.status(400).json({ message: 'No documents found in the DB' });
    }

    // create a local store for the vectors embeddings
    const HNSWStore = await HNSWLib.fromDocuments(documents, new OpenAIEmbeddings());
    
    //create chain for conversational AI
    const chain = await makeChain(HNSWStore);
    
    //Ask a question using chat history
    // OpenAI recommends replacing newlines with spaces for best results
    const sanitizedQuestion = question.trim().replaceAll('\n', ' ');
    const response = await chain.call({
      question: sanitizedQuestion,
      chat_history: chatHistory || [],
    });

    res.status(200).json({ ...response, vectorStore: HNSWStore });
  } catch (error: unknown) {
    console.log('error creating chain', error);
    res.status(500).json({ error: getErrorMessage(error) });
  }
}
