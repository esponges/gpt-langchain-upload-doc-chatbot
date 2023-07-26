import { OpenAI } from 'langchain/llms/openai';
import { ConversationalRetrievalQAChain } from 'langchain/chains';
import { HNSWLib } from 'langchain/vectorstores/hnswlib';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { BufferMemory } from 'langchain/memory';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { ChatOpenAI } from 'langchain/chat_models/openai';

// it useas HNSWLib as a vectorstore and stores the file in memory
export const runConversationWithMemoryDoc = async () => {
  const CUSTOM_QUESTION_GENERATOR_CHAIN_PROMPT = `Given the following conversation and a follow up question, return the conversation history excerpt that includes any relevant context to the question if it exists and rephrase the follow up question to be a standalone question.
  Chat History:
  {chat_history}
  Follow Up Input: {question}
  Your answer should follow the following format:
  \`\`\`
  Use the following pieces of context to answer the users question.
  If you don't know the answer, just say that you don't know, don't try to make up an answer.
  ----------------
  <Relevant chat history excerpt as context here>
  Standalone question: <Rephrased question here>
  \`\`\`
  Your answer:`;

  /* Load in the file we want to do question answering over */
  const loader = new PDFLoader('public/lotr-world-wars.pdf');
  const pdf = await loader.load();
  /* Split the text into chunks */
  const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000 });
  const docs = await textSplitter.splitDocuments(pdf);
  // console.log('the docs', docs);
  
  /* Create the vectorstore */
  const model = new OpenAI({
    modelName: 'gpt-3.5-turbo',
    temperature: 0,
  });
  
  const vectorStore = await HNSWLib.fromDocuments(docs, new OpenAIEmbeddings());
  /* Create the chain */
  const chain = ConversationalRetrievalQAChain.fromLLM(
    model,
    vectorStore.asRetriever(),
    {
      returnSourceDocuments: false,
      memory: new BufferMemory({
        memoryKey: 'chat_history', // Must be set to "chat_history"
        returnMessages: true,
      }),
      questionGeneratorChainOptions: {
        template: CUSTOM_QUESTION_GENERATOR_CHAIN_PROMPT,
      },
    },
  );

  /* Ask it a question */
  const res = await chain.call({
    question:
      'I have a friend Called Fer that has this question: Which were these wars?',
  });
  console.log(res);
  /* Ask it a follow up question */
  const followUpRes = await chain.call({
    question: 'What the name of my friend?',
  });
  console.log(followUpRes);

  /* Confirm that the bot doesnt answer anything not related to the context */
  const nonRelatedQn = await chain.call({
    question: 'Whats the capital of Mexico?',
  });
  console.log('fer', nonRelatedQn);
};

(async () => {
  await runConversationWithMemoryDoc();
  console.log('chain completed');
})();

/* from the docs */
export const runConversationWithMemoryDoc2 = async () => {
  const CUSTOM_QUESTION_GENERATOR_CHAIN_PROMPT = `Given the following conversation and a follow up question, return the conversation history excerpt that includes any relevant context to the question if it exists and rephrase the follow up question to be a standalone question.
Chat History:
{chat_history}
Follow Up Input: {question}
Your answer should follow the following format:
\`\`\`
Use the following pieces of context to answer the users question.
If you don't know the answer, just say that you don't know, don't try to make up an answer.
----------------
<Relevant chat history excerpt as context here>
Standalone question: <Rephrased question here>
\`\`\`
Your answer:`;

  const model = new ChatOpenAI({
    modelName: 'gpt-3.5-turbo',
    temperature: 0,
  });

  const vectorStore = await HNSWLib.fromTexts(
    [
      'Mitochondria are the powerhouse of the cell',
      'Foo is red',
      'Bar is red',
      'Buildings are made out of brick',
      'Mitochondria are made of lipids',
    ],
    [{ id: 2 }, { id: 1 }, { id: 3 }, { id: 4 }, { id: 5 }],
    new OpenAIEmbeddings(),
  );

  const chain = ConversationalRetrievalQAChain.fromLLM(
    model,
    vectorStore.asRetriever(),
    {
      memory: new BufferMemory({
        memoryKey: 'chat_history',
        returnMessages: true,
      }),
      questionGeneratorChainOptions: {
        template: CUSTOM_QUESTION_GENERATOR_CHAIN_PROMPT,
      },
    },
  );

  const res = await chain.call({
    question:
      "I have a friend called Bob. He's 28 years old. He'd like to know what the powerhouse of the cell is?",
  });

  console.log(res);
  /*
  {
    text: "The powerhouse of the cell is the mitochondria."
  }
*/

  const res2 = await chain.call({
    question: 'How old is Bob?',
  });

  console.log(res2); // Bob is 28 years old.

  /*
  {
    text: "Bob is 28 years old."
  }
*/

  const unrelatedRes = await chain.call({
    question: 'What is the capital of Mexico?',
  });

  console.log(unrelatedRes); // I don't know or similar
};

(async () => {
  await runConversationWithMemoryDoc2();
  console.log('chain completed');
})();
