import type { NextApiRequest, NextApiResponse } from 'next';
import { makeChain } from '@/utils/makechain';
import { getErrorMessage } from '@/utils/misc';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { HNSWLib } from 'langchain/vectorstores/hnswlib';
import { Document } from 'langchain/document';
import { AIChatMessage, BaseChatMessage, HumanChatMessage } from 'langchain/schema';
import { getExistingDocs } from '@/utils/drizzle';


interface ReqBody {
  question: string;
  history: Array<Array<string>>;
  nameSpace: string;
}

interface ApiFormDataRequest extends NextApiRequest {
  body: ReqBody;
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
  const chatHistory: BaseChatMessage[] = [];
  history?.forEach((_, idx) => {
    // first message is always human message
    chatHistory.push(new HumanChatMessage(history[idx][0]));
    // second message is always AI response
    chatHistory.push(new AIChatMessage(history[idx][1]));
  });
    
  try {
    const sqlDocs = await getExistingDocs(nameSpace);

    if (!sqlDocs[0].docs.length) {
      return res.status(400).json({ message: 'No documents found in the DB' });
    }

    const documents = sqlDocs[0].docs.map((doc) => new Document({
      metadata:  JSON.parse(doc.metadata as string),
      pageContent: doc.pageContent as string,
    }));

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
