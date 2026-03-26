
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://azees4997_db_user:99XzB5T3H1B0fNj8@sahimed.qwsbgml.mongodb.net/';
const DB_NAME = 'sahimed';

async function verify() {
  console.log('Verifying migration...');

  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const mongoDb = client.db(DB_NAME);
    const productsCollection = mongoDb.collection('products');

    const count = await productsCollection.countDocuments();
    console.log(`Total products in MongoDB: ${count}`);

    const sample = await productsCollection.findOne({});
    console.log('Sample product:', JSON.stringify(sample, null, 2));

  } catch (error) {
    console.error('Verification failed:', error);
  } finally {
    await client.close();
    process.exit(0);
  }
}

verify();
