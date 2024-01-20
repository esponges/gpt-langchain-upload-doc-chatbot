import { Pinecone } from '@pinecone-database/pinecone';
import { NamespaceSummary } from '@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch';

if (!process.env.PINECONE_ENVIRONMENT || !process.env.PINECONE_API_KEY) {
  throw new Error('Pinecone environment or api key vars missing');
}

async function initPinecone() {
  try {
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY ?? '',
      environment: process.env.PINECONE_ENVIRONMENT ?? '',
    });

    return pinecone;
  } catch (error) {
    console.log('error', error);
    throw new Error('Failed to initialize Pinecone Client');
  }
}

export const pinecone = await initPinecone();

export const getVanillaPineconeIndex = async (client?: Pinecone) => {
  // if no client has been initialized, initialize one
  const store = client || pinecone;

  try {
    const collections = await store.listIndexes();
    // our tier will only have one index
    const pineconeIndex = store.Index(collections[0].name);
    
    return pineconeIndex;
  } catch (error) {
    
    console.log('error', error);
    throw new Error('Failed to get Pinecone Index');
  }
}

export const getPineconeIndex = async (client: Pinecone) => {
  try {
    const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME ?? '');
    
    return pineconeIndex;
  } catch (error) {
    
    console.log('error', error);
    throw new Error('Failed to get Pinecone Index');
  }
}

// figure out if object contains a namespace as key in the namespace object
const namespaceExistsInIndex = (key: string, namespaces?: Record<string, NamespaceSummary>) => {
  if (!namespaces) return false;

  return Object.keys(namespaces).includes(key);
}

/* 
  Getting type errors due to outdated pinecone types
*/
// export const getPineconeExistingNamespaces = async (fileName: string, client: Pinecone) => {
//   const pineconeIndex = await getPineconeIndex(client);
//   try {
//     const idxDetails = await pineconeIndex.describeIndexStats({ describeIndexStatsRequest: { filter: {} }});
//     return namespaceExistsInIndex(fileName, idxDetails.namespaces);–
//   } catch (error) {
//     console.log('error', error);
    
//     throw new Error('Failed to get Pinecone Index');
//   }
// }
