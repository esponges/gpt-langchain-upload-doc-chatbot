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
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const form = new Form();
  const formData = await new Promise<FData>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err);
        return;
      }

      const file = files.file[0];
      resolve({ file });
    });
  }); 

  const fileName = formData.file.originalFilename;

  const fileExistsInDB = await getPineconeExistingNamespaces(
    fileName,
    pinecone,
  );
  
  if (!fileExistsInDB) {
    try {
      await langchainPineconeUpsert(formData.file.path, pinecone, fileName);
    } catch (error) {
      const errMsg = getErrorMessage(error);
      res.status(500).json({ error: errMsg });
      return;
    }
  }

  const resData: UploadResponse = {
    fileExistsInDB,
    nameSpace: fileName,
  };

  res.status(200).json(resData);
}
