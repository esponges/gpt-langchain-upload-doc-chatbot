import type { NextApiRequest, NextApiResponse } from 'next';
// import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
// import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { makeChain } from '@/utils/makechain';
// import { pinecone } from '@/utils/pinecone-client';
// import { PINECONE_INDEX_NAME, PINECONE_NAME_SPACE } from '@/config/pinecone';
import formidable from 'formidable';

export const config = {
  api: {
    bodyParser: false
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // will receive a FormData object
  const formData = await new Promise((resolve, reject) => {
    const form = new formidable.IncomingForm();
    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err);
        return;
      }
      resolve({ fields, files });
    });
  });

  const { question, history } = formData.fields;

  console.log('question', question);

  //only accept post requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!question || typeof question !== 'string') {
    return res.status(400).json({ message: 'No question in the request' });
  }
  // OpenAI recommends replacing newlines with spaces for best results
  const sanitizedQuestion = question.trim().replaceAll('\n', ' ');

  try {
    console.log('sanitizedQuestion', sanitizedQuestion, 'formData', formData);
    // const index = pinecone.Index(PINECONE_INDEX_NAME);

    // /* create vectorstore*/
    // const vectorStore = await PineconeStore.fromExistingIndex(
    //   new OpenAIEmbeddings({}),
    //   {
    //     pineconeIndex: index,
    //     textKey: 'text',
    //     namespace: PINECONE_NAME_SPACE, //namespace comes from your config folder
    //   },
    // );

    //create chain
    // const chain = await makeChain();
    // //Ask a question using chat history
    // const response = await chain.call({
    //   question: sanitizedQuestion,
    //   chat_history: history || [],
    // });

    // console.log('response', response);
    // res.status(200).json(response);
  } catch (error: any) {
    console.log('error', error);
    res.status(500).json({ error: error.message || 'Something went wrong' });
  }
}
