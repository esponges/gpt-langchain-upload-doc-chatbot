import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import type { UpsertRequest } from '@pinecone-database/pinecone';
import { getPineconeIndex } from '@/utils/pinecone';
import { getErrorMessage } from '@/utils/misc';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const PINECONE_NAMESPACE = 'european-cities';

// const configuration = new Configuration({
//   apiKey: OPENAI_API_KEY,
// });
// const openai = new OpenAIApi(configuration);

const EUROPEAN_CITIES = [
  'Paris',
  'Berlin',
  'Prague',
  'Rome',
  'Milan',
  'Naples',
  'Madrid',
  'Barcelona',
  'Sevilla',
  'Lisbon',
  'Porto',
  'London',
  'Manchester',
  'Liverpool',
  'Dublin',
  'Amsterdam',
  'Rotterdam',
  'Brussels',
  'Antwerp',
  'Copenhagen',
  'Stockholm',
  'Oslo',
  'Helsinki',
  'Warsaw',
  'Krakow',
  'Budapest',
  'Vienna',
  'Zurich',
  'Geneva',
  'Munich',
  'Hamburg',
  'Cologne',
  'Frankfurt',
  'Stuttgart',
];

// upsert into a new or existing namespace in pinecone
// when using one namespace we make sure that the vectors are
// all together and can be queried together in the following method
const upsertVectorGroupInPineconeStore = async () => {
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: OPENAI_API_KEY,
  });

  const vectors = [];
  // create one vector per city
  for (const city of EUROPEAN_CITIES) {
    const res = await embeddings.embedQuery(city);
    vectors.push({
      id: city,
      values: res,
      metadata: {
        city,
      },
    });
  }

  console.log('vector group - first two', vectors.slice(0, 1));

  // now get the pinecone index to upsert the vectors
  const pineconeIndex = await getPineconeIndex();

  // create the upsert request
  const upsertRequest: UpsertRequest = {
    vectors,
    namespace: PINECONE_NAMESPACE,
  };

  // upsert the vectors in pinecone
  try {
    console.log('upserting vectors in pinecone');
    const upsertResponse = await pineconeIndex.upsert({ upsertRequest });
    console.log('sucessful upsertResponse', { upsertResponse });
  } catch (e) {
    const errMessage = getErrorMessage(e);
    console.log('error upserting in pinecone', errMessage);
  }
};

// (async () => {
//   await upsertVectorGroupInPineconeStore();
//   console.log('upserting vectors in pinecone store');
// })();

const runPineconeSimilarityQuery = async () => {
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: OPENAI_API_KEY,
    modelName: 'text-embedding-ada-002',
  });

  const query = 'Cities where French is spoken';
  
  
  let vectors;
  try {
    const langchainEmbed = await embeddings.embedQuery(query);

    /* 
      using the openai api directly instead of the langchain wrapper
    */
    // const embeddings = await openai.createEmbedding({
    //   model: 'text-embedding-ada-002',
    //   input: [query],
    // });

    vectors = langchainEmbed;
    // console.log('vectors from query embeddings', vectors);
  } catch (e) {
    const errMessage = getErrorMessage(e);
    console.log('error generating query embeddings', errMessage);

    throw new Error(errMessage);
  }

  const pineconeIndex = await getPineconeIndex();

  try {
    const pineconeResult = await pineconeIndex.query({
      queryRequest: {
        namespace: PINECONE_NAMESPACE,
        vector: vectors,
        topK: 5,
        includeMetadata: true,
        includeValues: true,
      },
    });

    console.log('pineconeResult', pineconeResult);

  } catch (e) {
    const errMessage = getErrorMessage(e);
    console.log('error querying pinecone', errMessage);
    throw new Error(errMessage);
  }
};

(async () => {
  await runPineconeSimilarityQuery();
  console.log('running pinecone similarity query');
})();
