import { PrismaClient } from "@prisma/client";

// init once for singleton instance
export const prisma = new PrismaClient();

export const checkExistingFileInDB = async (fileName: string) => {
  const file = await prisma.langChainDocs.findFirst({
    where: {
      name: fileName,
    },
  });

  return file;
}
