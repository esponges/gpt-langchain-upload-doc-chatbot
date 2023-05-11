import type { NextApiRequest, NextApiResponse } from 'next';
import { Form } from 'multiparty';
import { langchainPineconeUpsert } from '@/utils/vectorizedFile';
import { pinecone } from '@/utils/pinecone-client';

interface IFormData {
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

  await langchainPineconeUpsert('foo', pinecone, 'bar');

  res.status(200).json({ message: 'ok' });
}
