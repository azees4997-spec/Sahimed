
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const options = {
  serverSelectionTimeoutMS: 10000,
  family: 4 as 4 | 6, 
};

// Helper to ensure indexes are present for performance
async function ensureIndexes(client: MongoClient) {
  try {
    const db = client.db('sahimed');
    console.log('[MongoDB Intelligence] Ensuring indexes...');
    
    // Products Performance Indexes
    await db.collection('products').createIndex({ name: 1 });
    await db.collection('products').createIndex({ moleculeId: 1 });
    await db.collection('products').createIndex({ category: 1 });
    await db.collection('products').createIndex({ saltComposition: 1 });
    
    // Molecules Performance Indexes
    await db.collection('molecules').createIndex({ molecule: 1 });
    await db.collection('molecules').createIndex({ name: 1 });
    
    console.log('[MongoDB Intelligence] Indexes synchronized.');
  } catch (err) {
    console.error('[MongoDB Intelligence] Indexing failure:', err);
  }
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (!uri) {
  clientPromise = Promise.reject(new Error('Invalid/Missing environment variable: "MONGODB_URI"'));
} else {
  if (process.env.NODE_ENV === 'development') {
    let globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>;
    };

    if (!globalWithMongo._mongoClientPromise) {
      client = new MongoClient(uri, options);
      globalWithMongo._mongoClientPromise = client.connect().then(async (c: MongoClient) => {
        await ensureIndexes(c);
        return c;
      }).catch((err: any) => {
        console.error('CRITICAL: MongoDB connection failed:', err);
        throw err;
      });
    }
    clientPromise = globalWithMongo._mongoClientPromise;
  } else {
    client = new MongoClient(uri, options);
    clientPromise = client.connect().then(async (c: MongoClient) => {
      await ensureIndexes(c);
      return c;
    }).catch((err: any) => {
      console.error('CRITICAL: MongoDB connection failed:', err);
      throw err;
    });
  }
}

export default clientPromise;
