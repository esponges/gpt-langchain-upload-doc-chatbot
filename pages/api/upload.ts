import type { NextApiRequest, NextApiResponse } from 'next';
// import { Form } from 'multiparty';

import { langchainUploadDocs } from '@/utils/langchain';
import { getErrorMessage } from '@/utils/misc';
import { getExistingDocs } from '@/utils/drizzle';

// export const config = {
//   api: {
//     bodyParser: false,
//   },
// };

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
  // res.status(200).json({ message: 'ok' });
  // if (req.method !== 'POST') {
  //   res.status(405).json({ error: 'Method not allowed' });
  //   return;
  // }
  // const form = new Form();
  // const formData = await new Promise<FData>((resolve, reject) => {
  //   form.parse(req, (err, fields, files) => {
  //     if (err) {
  //       reject(err);
  //       return;
  //     }

  //     const file = files.file[0];
  //     resolve({ file });
  //   });
  // });

  // const fileName = formData.file.originalFilename;
  const fileName = 'robot copy 5.pdf';
  
  try {
    const DBDocs = await getExistingDocs(fileName);
    const fileExistsInDB = DBDocs.length > 0;

    if (!fileExistsInDB) {
      try {
        // todo: create with Drizzle instead of prisma
        // await langchainUploadDocs(formData.file.path, fileName);
        await langchainUploadDocs('some-path', fileName);
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
