import { PineconeClient } from '@pinecone-database/pinecone';
import { NamespaceSummary } from '@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch';

if (!process.env.PINECONE_ENVIRONMENT || !process.env.PINECONE_API_KEY) {
  throw new Error('Pinecone environment or api key vars missing');
}

async function initPinecone() {
  try {
    const pinecone = new PineconeClient();

    await pinecone.init({
      environment: process.env.PINECONE_ENVIRONMENT ?? '', //this is in the dashboard
      apiKey: process.env.PINECONE_API_KEY ?? '',
    });

    return pinecone;
  } catch (error) {
    console.log('error', error);
    throw new Error('Failed to initialize Pinecone Client');
  }
}

export const pinecone = await initPinecone();

export const getPineconeIndex = async (client?: PineconeClient) => {
  // if no client has been initialized, initialize one
  const store = client || pinecone;

  try {
    const collections = await store.listIndexes();
    const pineconeIndex = await store.Index(collections[0]);
    
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

export const getPineconeExistingNamespaces = async (fileName: string, client: PineconeClient) => {
  const pineconeIndex = await getPineconeIndex(client);
  try {
    const idxDetails = await pineconeIndex.describeIndexStats({ describeIndexStatsRequest: { filter: {} }});
    return namespaceExistsInIndex(fileName, idxDetails.namespaces);
  } catch (error) {
    console.log('error', error);
    
    throw new Error('Failed to get Pinecone Index');
  }
}
