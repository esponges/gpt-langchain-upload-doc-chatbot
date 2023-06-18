import { OpenAI } from 'langchain/llms/openai';
import { ConversationalRetrievalQAChain } from 'langchain/chains';
import { HNSWLib } from 'langchain/vectorstores/hnswlib';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { BufferMemory } from 'langchain/memory';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import * as fs from 'fs';

// it useas HNSWLib as a vectorstore and stores the file in memory
export const runConversationWithMemoryDoc = async () => {
  /* Initialize the LLM to use to answer the question */
  const model = new OpenAI({});
  /* Load in the file we want to do question answering over */
  const loader = new PDFLoader('public/lotr-world-wars.pdf');

  const pdf = await loader.load();
  /* Split the text into chunks */
  const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000 });
  const docs = await textSplitter.splitDocuments(pdf);
  console.log('the docs', docs);
  /* Create the vectorstore */
  const vectorStore = await HNSWLib.fromDocuments(docs, new OpenAIEmbeddings());
  /* Create the chain */
  const chain = ConversationalRetrievalQAChain.fromLLM(
    model,
    vectorStore.asRetriever(),
    {
      memory: new BufferMemory({
        memoryKey: 'chat_history', // Must be set to "chat_history"
      }),
    },
  );
  /* Ask it a question */
  const question = 'Which were these wars?';
  const res = await chain.call({ question });
  console.log(res);
  /* Ask it a follow up question */
  const followUpRes = await chain.call({
    question: 'How many?',
  });
  console.log(followUpRes);
};

(async () => {
  await runConversationWithMemoryDoc();
  console.log('chain completed');
})();
