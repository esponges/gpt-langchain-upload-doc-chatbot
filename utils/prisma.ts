import { PrismaClient } from '@prisma/client';

// init once for singleton instance
export const prisma = new PrismaClient();

export const checkExistingFileInDB = async (fileName: string) => {
  const file = await prisma.langChainDocs.findFirst({
    where: {
      name: fileName,
    },
  });

  return file;
};

export const getDocumentsFromDB = async (fileName: string) => {
  const docs = await prisma.langChainDocs.findFirst({
    where: {
      name: fileName,
    },
    include: {
      docs: true,
    },
  });

  return docs;
};
