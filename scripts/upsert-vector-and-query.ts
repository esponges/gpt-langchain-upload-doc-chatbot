import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import type { UpsertRequest } from '@pinecone-database/pinecone';
import { getPineconeIndex, pinecone as pineconeClient } from '@/utils/pinecone';
import { getErrorMessage } from '@/utils/misc';
import { cities } from './data/vector';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const PINECONE_NAMESPACE = 'european-cities';

// const configuration = new Configuration({
//   apiKey: OPENAI_API_KEY,
// });
// const openai = new OpenAIApi(configuration);

// upsert into a new or existing namespace in pinecone
// when using one namespace we make sure that the vectors are
// all together and can be queried together in the following method
const upsertVectorGroupInPineconeStore = async () => {
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: OPENAI_API_KEY,
  });

  const vectors = [];
  // create one vector per city
  // can create with map since it's async
  for (const city of cities.toVectorize) {
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
  const index = process.env.PINECONE_INDEX_NAME;

  if (!index) {
    throw new Error('PINECONE_INDEX_NAME is not defined');
  }
  
  const pineconeIndex = await getPineconeIndex(pineconeClient);

  // upsert the vectors in pinecone
  try {
    console.log('upserting vectors in pinecone');
    // could also be done with PineStore.addVectors however I think you cannot add metadata and ids
    // const upsertResponse = await pineconeIndex.upsert({ upsertRequest });
    // console.log('sucessful upsertResponse', { upsertResponse });
    const upsertResponse = await pineconeIndex.namespace('feb-1').upsert(vectors);
    console.log({ upsertResponse });
  } catch (e) {
    const errMessage = getErrorMessage(e);
    console.log('error upserting in pinecone', errMessage);
  }
};

// (async () => {
//   await upsertVectorGroupInPineconeStore();
//   console.log('upserting vectors in pinecone store');
// })();

// const runPineconeSimilarityQuery = async () => {
//   const embeddings = new OpenAIEmbeddings({
//     openAIApiKey: OPENAI_API_KEY,
//     modelName: 'text-embedding-ada-002',
//   });

//   const query = 'Cities that dont have a team that won the champions league';
  
  
//   let vectors;
//   try {
//     const langchainEmbed = await embeddings.embedQuery(query);

//     /* 
//       using the openai api directly instead of the langchain wrapper
//     */
//     // const embeddings = await openai.createEmbedding({
//     //   model: 'text-embedding-ada-002',
//     //   input: [query],
//     // });

//     vectors = langchainEmbed;
//     // console.log('vectors from query embeddings', vectors);
//   } catch (e) {
//     const errMessage = getErrorMessage(e);
//     console.log('error generating query embeddings', errMessage);

//     throw new Error(errMessage);
//   }

//   const pineconeIndex = await getPineconeIndex(pineconeClient);

//   try {
//     // in the PineconeStore declaration there's a similaritySearchVectorWith score
//     // method that should do similar, however I don't think it's exported
//     // const pineconeResult = await pineconeIndex.query({
//     //   queryRequest: {
//     //     namespace: PINECONE_NAMESPACE,
//     //     vector: vectors,
//     //     topK: 5,
//     //     includeMetadata: true,
//     //     includeValues: true,
//     //   },
//     // });

//     // console.log('pineconeResult', pineconeResult);

//   } catch (e) {
//     const errMessage = getErrorMessage(e);
//     console.log('error querying pinecone', errMessage);
//     throw new Error(errMessage);
//   }
// };

// (async () => {
//   await runPineconeSimilarityQuery();
//   console.log('running pinecone similarity query');
// })();
