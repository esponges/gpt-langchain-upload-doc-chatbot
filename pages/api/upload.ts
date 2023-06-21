import type { NextApiRequest, NextApiResponse } from 'next';
import { Form } from 'multiparty';
import { PrismaClient } from '@prisma/client';

import { langchainPineconeUpsert, langchainPrismaUpload } from '@/utils/langchain';
import { getPineconeExistingNamespaces, pinecone } from '@/utils/pinecone';
import { getErrorMessage } from '@/utils/misc';
import { OpenAI } from 'langchain';
import { PDFLoader } from 'langchain/document_loaders';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { HNSWLib } from 'langchain/vectorstores/hnswlib';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { Document } from 'langchain/document';
import { checkExistingFileInDB } from '@/utils/prisma';

export const config = {
  api: {
    bodyParser: false,
  },
};

const prisma = new PrismaClient();

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

  try {
    const fileExistsInDB = await checkExistingFileInDB(fileName);

    if (!fileExistsInDB) {
      try {
        await langchainPrismaUpload(formData.file.path, pinecone, fileName);
      } catch (error) {
        const errMsg = getErrorMessage(error);
        res.status(500).json({ error: errMsg });
        return;
      }
    }

    const resData: UploadResponse = {
      fileExistsInDB: !!fileExistsInDB,
      nameSpace: fileName,
    };

    res.status(200).json(resData);
  } catch (error) {
    const errMsg = getErrorMessage(error);
    res.status(500).json({ error: errMsg });
    return;
  }
}
