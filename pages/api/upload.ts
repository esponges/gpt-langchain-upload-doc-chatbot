import type { NextApiRequest, NextApiResponse } from 'next';
import { Form } from 'multiparty';
import { langchainPineconeUpsert } from '@/utils/vectorizedFile';
import { getPineconeExistingNamespaces, pinecone } from '@/utils/pinecone-client';

export const config = {
  api: {
    bodyParser: false,
  },
};

interface IFormData {
  // question: string;
  // history: string;
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

interface ApiFormDataRequest extends NextApiRequest {
  body: IFormData;
}

export type UploadResponse = {
  fileExistsInDB: boolean;
  nameSpace: string;
};

export default async function handler(
  req: ApiFormDataRequest,
  res: NextApiResponse,
) {
  const form = new Form();
  const formData = await new Promise<IFormData>((resolve, reject) => {
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
    await langchainPineconeUpsert(formData.file.path, pinecone, fileName);
  }

  const resData: UploadResponse = {
    fileExistsInDB,
    nameSpace: fileName,
  };

  res.status(200).json(resData);
}
