import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import type { UpsertRequest } from '@pinecone-database/pinecone';
import { getPineconeIndex } from '@/utils/pinecone';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { OpenAI } from 'langchain';
import { VectorDBQAChain } from 'langchain/chains';
import { Document } from 'langchain/document';
import { Configuration, OpenAIApi } from 'openai';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export const runLangChain = async () => {
  const embeddings = new OpenAIEmbeddings({
    timeout: 1000, // 1s timeout
    openAIApiKey: OPENAI_API_KEY,
  });
  /* Embed queries */
  const res = await embeddings.embedQuery(
    'fercho is a nice guy who lives in guadalajara',
  );
  console.log(res);
  /* Embed documents */
  // const documentRes = await embeddings.embedDocuments([
  //   'Hello world',
  //   'Bye bye',
  // ]);
  // console.log({ documentRes });

  const pineconeIndex = await getPineconeIndex();

  const upsertRequest: UpsertRequest = {
    vectors: [
      {
        // test
        id: '2',
        values: res,
        // todo: figure out metadata error here
        // metadata,
        metadata: {
          baz: 'baz',
        },
      },
    ],
    namespace: 'fercho-test-1',
  };

  const upsertResponse = await pineconeIndex.upsert({ upsertRequest });
  console.log({ upsertResponse });
};


const configuration = new Configuration({
  apiKey: OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const runContextualChatWithEmbeddings = async () => {
  try {
    const embeddings = await openai.createEmbedding({
      model: 'text-embedding-ada-002',
      input: 'There was a robot named R2D2 and he was a good robot',
    });

    const vectors = embeddings.data.data[0].embedding;
    const context = vectors.join('\n');

    // now use these vectors to give context to openai
    const prompt = `With this context ${context} Answer this question: what's the name of this robot?`;

    // todo: this doesn't work
    // figure out how to combine vectors and natural language
    const response = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt,
      temperature: 0.6
    });

    console.log('THE RESPONSE', response.data);

  } catch (error) {
    console.log('THE ERROR', error);
  }
};

(async () => {
  await runContextualChatWithEmbeddings();
  console.log('ingestion complete');
})();


export const chat = async () => {
  const pineconeIndex = await getPineconeIndex();

  console.log('pineconeIndex', pineconeIndex);

  const vectorStore = await PineconeStore.fromExistingIndex(
    new OpenAIEmbeddings(),
    { pineconeIndex },
  );

  console.log('vectorStore', vectorStore);

  /* Search the vector DB independently with meta filters */
  const results = await vectorStore.similaritySearch('fercho');
  console.log('results here', results);

  const model = new OpenAI();
  const chain = VectorDBQAChain.fromLLM(model, vectorStore, {
    k: 1,
    returnSourceDocuments: true,
  });
  const response = await chain.call({ query: 'where does paco lives?' });
  console.log(response);
};



export const langchainEmbed = async () => {
  // const embeddings = new OpenAIEmbeddings({
  //   timeout: 1000, // 1s timeout
  //   openAIApiKey: ,
  // });
  // /* Embed queries */
  // const res = await embeddings.embedQuery(
  //   'fercho is a nice guy who lives in guadalajara',
  // );
  // console.log(res);

  const pineconeIndex = await getPineconeIndex();

  const docs = [
    new Document({
      metadata: { foo: "bar" },
      pageContent: "paco is a nice guy who lives in leon",
    }),
  ];
  
  await PineconeStore.fromDocuments(docs, new OpenAIEmbeddings(), {
    pineconeIndex,
  });
};

// (async () => {
//   await run();
//   console.log('embed completed');
// })();

(async () => {
  await chat();
  console.log('chat completed');
}
)();


// (async () => {
//   await langchainEmbed();
//   console.log('embed completed');
// })();
