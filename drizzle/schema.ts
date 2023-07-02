import { relations } from 'drizzle-orm';
import { pgTable, text, varchar } from 'drizzle-orm/pg-core';

// model LangChainDocs {
//   id        String   @id @default(uuid())
//   createdAt DateTime @default(now())
//   name      String
//   nameSpace String
//   docs      Docs[]
// }

// model Docs {
//   id              String        @id @default(uuid())
//   createdAt       DateTime      @default(now())
//   metadata        String // json string
//   pageContent     String
//   name            String
//   docs            LangChainDocs @relation(fields: [langChainDocsId], references: [id])
//   langChainDocsId String
// }

export const langChainDocs = pgTable('LangChainDocs', {
  id: varchar('id').primaryKey(),
  createdAt: text('createdAt'),
  name: text('name'),
  nameSpace: text('nameSpace'),
});

export const langChainDocRelations = relations(langChainDocs, ({ many }) => ({
  docs: many(docs),
}));

export const docs = pgTable('Docs', {
  id: varchar('id').primaryKey(),
  createdAt: text('createdAt'),
  metadata: text('metadata'),
  pageContent: text('pageContent'),
  name: text('name'),
  langChainDocsId: text('langChainDocsId'),
});

export const docsRelations = relations(docs, ({ one }) => ({
  langChainDocs: one(langChainDocs, {
    fields: [docs.langChainDocsId],
    references: [langChainDocs.id],
  }),
}));
