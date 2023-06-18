import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import type { UpsertRequest } from '@pinecone-database/pinecone';
import { getPineconeIndex } from '@/utils/pinecone';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { OpenAI } from 'langchain';
import { VectorDBQAChain } from 'langchain/chains';
import { Document } from 'langchain/document';
import { Configuration, OpenAIApi } from 'openai';
import { getErrorMessage } from '@/utils/misc';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

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
    namespace: 'european-cities',
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

(async () => {
  await upsertVectorGroupInPineconeStore();
  console.log('upserting vectors in pinecone store');
})();
