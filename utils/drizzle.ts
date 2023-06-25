import { Client } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import * as schema from '../drizzle/schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DB_URL is not set');
}

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

const connect = async () => {
  await client.connect();
};

connect();

export const drizzleDb = drizzle(client, { schema });

// Prisma Schema

// model LangChainDocs {
//   id        String   @id @default(uuid())
//   createdAt DateTime @default(now())
//   name      String
//   nameSpace String
//   docs      Doc[]
// }

// model Doc {
//   id              String        @id @default(uuid())
//   createdAt       DateTime      @default(now())
//   metadata        String // json string
//   pageContent     String
//   name            String
//   docs            LangChainDocs @relation(fields: [langChainDocsId], references: [id])
//   langChainDocsId String
// }

export const checkExistingFileInDB = async (fileName: string) => {
  const file = await drizzleDb.query.docs.findMany({
    where: eq(schema.docs.name, fileName),
  });

  return file;
};
