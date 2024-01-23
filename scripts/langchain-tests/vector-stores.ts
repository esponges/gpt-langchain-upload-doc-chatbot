/* using cheerio to get data from docs */
import { CheerioWebBaseLoader } from 'langchain/document_loaders/web/cheerio';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from '@langchain/openai';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';

export class CheerioStoreInstance {
  public loader: CheerioWebBaseLoader;
  public splitter: RecursiveCharacterTextSplitter;
  public embeddings: OpenAIEmbeddings;
  public url: string;

  constructor(url?: string) {
    this.url = url || 'https://docs.smith.langchain.com/overview';
    this.loader = new CheerioWebBaseLoader(this.url);
    this.splitter = new RecursiveCharacterTextSplitter();
    this.embeddings = new OpenAIEmbeddings();
  }

  getStore = async () => {
    const docs = await this.loader.load();
    const splitDocs = await this.splitter.splitDocuments(docs);
    const embeddings = new OpenAIEmbeddings();

    return await MemoryVectorStore.fromDocuments(splitDocs, embeddings);
  };
}
