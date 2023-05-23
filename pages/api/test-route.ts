import type { NextApiRequest, NextApiResponse } from 'next';
import { Form } from 'multiparty';

import { langchainPineconeUpsert } from '@/utils/langchain';
import { getPineconeExistingNamespaces, pinecone } from '@/utils/pinecone';
import { getErrorMessage } from '@/utils/misc';

export const config = {
  api: {
    bodyParser: false,
  },
};

interface FData {
  file: {
    fieldName: string;
    originalFilename: string;
    path: string;
    headers: {
      [key: string]: string;
    };
    size: number;
  };
}

interface ApFDataRequest extends NextApiRequest {
  body: FData;
}

export type UploadResponse = {
  fileExistsInDB: boolean;
  nameSpace: string;
};

export default async function handler(
  req: ApFDataRequest,
  res: NextApiResponse,
) {
  //only accept post requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // test route is working in Vercel
  throw new Error('Test route is working in Vercel');
}
