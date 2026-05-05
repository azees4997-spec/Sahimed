import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('MONGODB_URI is not defined');
  process.exit(1);
}

async function run() {
  const client = new MongoClient(uri!);
  try {
    await client.connect();
    const db = client.db('sahimed');
    const products = db.collection('products');

    console.log('Ensuring indexes for "products" collection...');
    
    // Core search indexes
    await products.createIndex({ name: 1 });
    await products.createIndex({ saltComposition: 1 });
    await products.createIndex({ salt: 1 });
    await products.createIndex({ composition: 1 });
    
    // Filter indexes
    await products.createIndex({ category: 1 });
    await products.createIndex({ marketer_name: 1 });
    await products.createIndex({ dosage_form: 1 });
    await products.createIndex({ isGeneric: 1 });
    await products.createIndex({ isBestSeller: 1 });
    await products.createIndex({ moleculeId: 1 });
    await products.createIndex({ price: 1 });

    // Compound indexes for common queries
    await products.createIndex({ category: 1, price: 1 });
    await products.createIndex({ moleculeId: 1, isGeneric: 1 });

    console.log('Successfully ensured all clinical and filter indexes.');
    
    // Molecules collection
    const molecules = db.collection('molecules');
    console.log('Ensuring indexes for "molecules" collection...');
    await molecules.createIndex({ molecule: 1 });
    await molecules.createIndex({ name: 1 });
    
    console.log('Indexing complete.');
  } catch (err) {
    console.error('Indexing failed:', err);
  } finally {
    await client.close();
  }
}

run();
