import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const options = {
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000,
  maxPoolSize: 10,
  socketTimeoutMS: 30000,
  heartbeatFrequencyMS: 10000,
  retryWrites: true,
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (!uri) {
  throw new Error('Please add your Mongo URI to .env.local');
}

// In Next.js/Vercel, we use a global variable to reuse the connection 
// and prevent creating too many connections during hot reloads or container re-use.
const globalWithMongo = global as typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
};

if (!globalWithMongo._mongoClientPromise) {
  client = new MongoClient(uri, options);
  globalWithMongo._mongoClientPromise = client.connect()
    .then((c) => {
      console.log("[MongoDB Intelligence] Connected successfully.");
      return c;
    })
    .catch((err) => {
      console.error("[MongoDB Intelligence] CRITICAL connection error:", err);
      if (err instanceof Error) {
        console.error("Error Stack:", err.stack);
      }
      // Delete the promise from global if it fails so the next request can retry
      delete (global as any)._mongoClientPromise;
      throw err;
    });
}

clientPromise = globalWithMongo._mongoClientPromise;

export default clientPromise;
