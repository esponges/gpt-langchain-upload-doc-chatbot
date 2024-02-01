import { getErrorMessage } from '@/utils/misc';
import { getPineconeIndex, pinecone as pineconeClient } from '@/utils/pinecone';
// import { OpenAIEmbeddings } from "@langchain/openai";
import OpenAI from 'openai';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const runPineconeSimilarityQuery = async () => {
  /* 
    Generate the embeddings for the query
    using the langchain wrapper
  */
  // const embeddings = new OpenAIEmbeddings({
  //   openAIApiKey: OPENAI_API_KEY,
  //   modelName: 'text-embedding-3-small',
  //   // modelName: 'text-embedding-ada-002',
  // });
  // const langchainEmbed = await embeddings.embedQuery(query);

  try {
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
    const query = 'WebDev Questions';
    const embedding = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });
    const openaiVector = embedding.data[0].embedding;

    const pineconeIndex = await getPineconeIndex(pineconeClient);
    const pineconeResult = await pineconeIndex.namespace('feb-1').query({
      // vector: langchainEmbed,
      vector: openaiVector,
      topK: 5,
      filter: {
        // this works quite well - won't return anything that doesn't have the topic
        topic: { $eq: 'React' },
      },
      includeMetadata: true,
      includeValues: true,
    });

    console.log({ pineconeResult });
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
