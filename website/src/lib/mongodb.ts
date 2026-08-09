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
      // Automatically ensure critical performance indexes on Product Master & Category Master
      const db = c.db('sahimed');
      db.collection('Product Master').createIndexes([
        { key: { 'seo.url_slug': 1 } },
        { key: { product_id: 1 } },
        { key: { molecule_code: 1 } },
        { key: { is_generic: 1 } },
        { key: { isGeneric: 1 } },
        { key: { product_name: 1 } },
        { key: { 'taxonomy.category_name': 1 } }
      ]).catch((e) => console.warn("[MongoDB Index Warning]", e.message));
      db.collection('Category Master').createIndexes([
        { key: { showOnHomepage: 1 } },
        { key: { category: 1 } }
      ]).catch((e) => console.warn("[MongoDB Index Warning]", e.message));
      return c;
    })
    .catch((err) => {
      console.error("[MongoDB Intelligence] CRITICAL connection error:", err);
      // Clean up global promise if connection fails
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
  // If no client promise exists at all, create a new one
  if (!globalWithMongo._mongoClientPromise) {
    globalWithMongo._mongoClientPromise = createClient();
  }

  try {
    const clientInstance = await globalWithMongo._mongoClientPromise;
    
    // Check if the connection has died/closed due to days of inactivity
    // topology.isConnected() checks the actual socket state
    if (!clientInstance.topology || !clientInstance.topology.isConnected()) {
      console.warn("[MongoDB Intelligence] Cached connection was dead/inactive. Reconnecting...");
      // Discard the old, dead client and start a fresh connection
      delete globalWithMongo._mongoClientPromise;
      globalWithMongo._mongoClientPromise = createClient();
      return await globalWithMongo._mongoClientPromise;
    }

    return clientInstance;
  } catch (err) {
    // If the promise rejected, clear it so next request retries fresh
    delete globalWithMongo._mongoClientPromise;
    throw err;
  }
}

// Export a custom Promise wrapper that behaves like the original clientPromise
// but runs the dynamic liveness check on every await/then call.
// Wrapping getConnectedClient() inside a standard Promise structure ensures full TypeScript compliance.
const clientPromise = new Promise<MongoClient>((resolve, reject) => {
  // We resolve immediately to a proxy-like thenable so standard await/then chains trigger the liveness check
  resolve(getConnectedClient());
}) as unknown as Promise<MongoClient>;

export default clientPromise;
