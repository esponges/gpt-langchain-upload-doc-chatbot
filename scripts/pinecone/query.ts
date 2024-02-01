import { getErrorMessage } from "@/utils/misc";
import { getPineconeIndex, pinecone as pineconeClient } from "@/utils/pinecone";
// import { OpenAIEmbeddings } from "@langchain/openai";
import OpenAI from "openai";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const runPineconeSimilarityQuery = async () => {
  
    // const embeddings = new OpenAIEmbeddings({
    //   openAIApiKey: OPENAI_API_KEY,
    //   modelName: 'text-embedding-3-small',
    //   // modelName: 'text-embedding-ada-002',
    // });
    // const langchainEmbed = await embeddings.embedQuery(query);
    
    try {
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
    const query = 'Cities in europe';
    const embedding = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });
    const pineconeIndex = await getPineconeIndex(pineconeClient);
    const openaiVector = embedding.data[0].embedding;
    // in the PineconeStore declaration there's a similaritySearchVectorWith score
    // method that should do similar, however I don't think it's exported
    const pineconeResult = await pineconeIndex.namespace('feb-1').query({
      // vector: langchainEmbed,
      vector: openaiVector,
      topK: 5,
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
