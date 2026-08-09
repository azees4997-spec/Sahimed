import { MongoClient } from 'mongodb';

const DEFAULT_PRIMARY_URI = process.env.MONGODB_URI || "mongodb://azees4997_db_user:99XzB5T3H1B0fNj8@ac-mymgwbv-shard-00-00.qwsbgml.mongodb.net:27017,ac-mymgwbv-shard-00-01.qwsbgml.mongodb.net:27017,ac-mymgwbv-shard-00-02.qwsbgml.mongodb.net:27017/sahimed?ssl=true&authSource=admin";
const FALLBACK_SEEDLIST_URI = "mongodb://azees4997_db_user:99XzB5T3H1B0fNj8@ac-mymgwbv-shard-00-00.qwsbgml.mongodb.net:27017,ac-mymgwbv-shard-00-01.qwsbgml.mongodb.net:27017,ac-mymgwbv-shard-00-02.qwsbgml.mongodb.net:27017/sahimed?ssl=true&authSource=admin";

const options = {
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 15000,
  maxPoolSize: 10,
  minPoolSize: 1,
  socketTimeoutMS: 45000,
  heartbeatFrequencyMS: 10000,
  maxIdleTimeMS: 270000,
  retryWrites: true,
};

// Helper to attempt connection with primary URI, falling back to direct seedlist if DNS SRV fails
async function createClientWithFallback(): Promise<MongoClient> {
  const targetUri = DEFAULT_PRIMARY_URI;
  try {
    const client = new MongoClient(targetUri, options);
    const c = await client.connect();
    console.log("[MongoDB Intelligence] Primary connection established successfully.");
    scheduleIndexes(c);
    return c;
  } catch (err: any) {
    console.warn("[MongoDB Intelligence] Primary URI connection failed:", err.message, "Retrying with direct seedlist fallback...");
    try {
      const fallbackClient = new MongoClient(FALLBACK_SEEDLIST_URI, options);
      const c = await fallbackClient.connect();
      console.log("[MongoDB Intelligence] Fallback seedlist connection established successfully!");
      scheduleIndexes(c);
      return c;
    } catch (fallbackErr: any) {
      console.error("[MongoDB Intelligence] CRITICAL: Both primary and fallback connections failed:", fallbackErr.message);
      throw fallbackErr;
    }
  }
}

function scheduleIndexes(c: MongoClient) {
  setTimeout(() => {
    try {
      const db = c.db('sahimed');
      db.collection('Product Master').createIndexes([
        { key: { 'seo.url_slug': 1 } },
        { key: { product_id: 1 } },
        { key: { molecule_code: 1 } },
        { key: { is_generic: 1 } },
        { key: { isGeneric: 1 } },
        { key: { product_name: 1 } },
        { key: { 'taxonomy.category_name': 1 } },
        { key: { salable_status: 1, 'taxonomy.category_name': 1 } },
        { key: { salable_status: 1, molecule_code: 1 } },
        { key: { salable_status: 1, medicine_type: 1 } },
        { key: { salable_status: 1, product_name: 1 } },
        { key: { 'packaging.mrp': 1 } },
        { key: { selling_price: 1 } },
        { key: { salable_status: 1, selling_price: 1 } }
      ]).catch(() => {});
      db.collection('Category Master').createIndexes([
        { key: { showOnHomepage: 1 } },
        { key: { category: 1 } }
      ]).catch(() => {});
    } catch (e) {}
  }, 300);
}

function createClient(): Promise<MongoClient> {
  return createClientWithFallback();
}

const globalWithMongo = global as typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
  _mongoClient?: MongoClient;
};

// Main function to retrieve healthy client
async function getConnectedClient(): Promise<MongoClient> {
  if (!globalWithMongo._mongoClientPromise) {
    globalWithMongo._mongoClientPromise = createClient();
  }

  try {
    const clientInstance = await globalWithMongo._mongoClientPromise;
    
    // Check if topology exists and is connected
    if (!clientInstance.topology || typeof (clientInstance.topology as any).isConnected !== 'function' || !(clientInstance.topology as any).isConnected()) {
      console.warn("[MongoDB Intelligence] Cached connection dead/inactive. Reconnecting...");
      delete globalWithMongo._mongoClientPromise;
      globalWithMongo._mongoClientPromise = createClient();
      return await globalWithMongo._mongoClientPromise;
    }

    return clientInstance;
  } catch (err) {
    delete globalWithMongo._mongoClientPromise;
    throw err;
  }
}

// Export a dynamic Thenable Object so every `await clientPromise` triggers liveness check & auto-reconnect
const clientPromise = {
  then<TResult1 = MongoClient, TResult2 = never>(
    onfulfilled?: ((value: MongoClient) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return getConnectedClient().then(onfulfilled, onrejected);
  },
  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null
  ): Promise<MongoClient | TResult> {
    return getConnectedClient().catch(onrejected);
  }
} as unknown as Promise<MongoClient>;

export default clientPromise;
