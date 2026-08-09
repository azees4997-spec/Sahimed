import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const options = {
  serverSelectionTimeoutMS: 10000,  // increased — Firebase cold start needs time
  connectTimeoutMS: 15000,
  maxPoolSize: 10,
  minPoolSize: 1,
  socketTimeoutMS: 45000,
  heartbeatFrequencyMS: 10000,
  maxIdleTimeMS: 270000,
  retryWrites: true,
};

let client: MongoClient;

if (!uri) {
  throw new Error('Please add your Mongo URI to .env.local');
}

// Setup helper to establish client connection
function createClient(): Promise<MongoClient> {
  const client = new MongoClient(uri!, options);
  return client.connect()
    .then((c) => {
      console.log("[MongoDB Intelligence] Connected successfully.");
      // Ensure critical performance indexes asynchronously in background without blocking connection return
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
          ]).catch((e) => console.warn("[MongoDB Index Warning]", e.message));
          db.collection('Category Master').createIndexes([
            { key: { showOnHomepage: 1 } },
            { key: { category: 1 } }
          ]).catch((e) => console.warn("[MongoDB Index Warning]", e.message));
        } catch (e) {}
      }, 200);
      return c;
    })
    .catch((err) => {
      console.error("[MongoDB Intelligence] CRITICAL connection error:", err);
      const globalWithMongo = global as any;
      delete globalWithMongo._mongoClientPromise;
      throw err;
    });
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
