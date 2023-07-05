import { Client } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { langChainDocs, docs } from '@/drizzle/schema';

import type { Document } from 'langchain/document';

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

// todo: add assertion for existing docs - return bool or docs
export const getExistingDocs = async (fileName: string) => {
  const document = await drizzleDb.query.langChainDocs.findMany({
    where: eq(schema.langChainDocs.name, fileName),
    with: {
      docs: true,
    },
  });

  return document;
};

export const insertDocs = async (
  docsToUpload: Document[],
  fileName: string,
) => {
  await drizzleDb.transaction(async () => {
    const newDocId = randomUUID();

    await drizzleDb
      .insert(langChainDocs)
      .values({
        id: newDocId,
        name: fileName,
        nameSpace: fileName,
      })
      .returning();

    await drizzleDb.insert(docs).values(
      docsToUpload.map((doc) => ({
        id: randomUUID(),
        name: fileName,
        metadata: JSON.stringify(doc.metadata),
        pageContent: doc.pageContent,
        langChainDocsId: newDocId,
      })),
    );
  });
};
