import type { NextApiRequest, NextApiResponse } from 'next';

export type UploadResponse = {
  fileExistsInDB: boolean;
  nameSpace: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {

  // test route is working in Vercel
  throw new Error('Test route is working in Vercel');
}
