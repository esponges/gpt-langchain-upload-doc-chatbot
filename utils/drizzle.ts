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
