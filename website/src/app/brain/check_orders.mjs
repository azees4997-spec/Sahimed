
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function check() {
  try {
    await client.connect();
    const db = client.db('sahimed');
    const collection = db.collection('orders');
    
    const count = await collection.countDocuments();
    console.log(`Total orders: ${count}`);
    
    const indexes = await collection.indexes();
    console.log('Current indexes:', JSON.stringify(indexes, null, 2));
    
    // Check some sample orders to see the structure
    const sample = await collection.findOne({});
    console.log('Sample order keys:', Object.keys(sample || {}));

  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

check();
