import type { NextApiRequest, NextApiResponse } from 'next';
import { Form } from 'multiparty';

import { langchainPineconeUpsert } from '@/utils/vectorizedFile';
import { getPineconeExistingNamespaces, pinecone } from '@/utils/pinecone-client';

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
      // investigate this error: 
      // 'PineconeClient: Error calling upsert: ErrorWithoutStackTrace: value must be a string, number, boolean or list of strings, got {} for field pdf.metadata'
      res.status(500).json({ error: 'Something went wrong' });
      return;
    }
  }

  const resData: UploadResponse = {
    fileExistsInDB,
    nameSpace: fileName,
  };

  res.status(200).json(resData);
}
