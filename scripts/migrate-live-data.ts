
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.join(__dirname, '../.env') });

const firebaseConfig = {
  "projectId": "studio-9756314138-8403b",
  "appId": "1:503492891847:web:8db8fc212c714cfb5c9ae2",
  "apiKey": "AIzaSyBZjPHZjLz6TgXIAkqQ3uCsaAfO0HUj4qc",
  "authDomain": "studio-9756314138-8403b.firebaseapp.com",
  "storageBucket": "studio-9756314138-8403b.firebasestorage.app",
  "messagingSenderId": "503492891847"
};

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://azees4997_db_user:99XzB5T3H1B0fNj8@sahimed.qwsbgml.mongodb.net/';
const DB_NAME = 'sahimed';

async function migrate() {
  console.log('Starting live data sync...');

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  // Initialize MongoDB
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    const mongoDb = client.db(DB_NAME);
    const productsCollection = mongoDb.collection('products');

    // Fetch Live Data from Firestore
    console.log('Fetching live data from Firestore...');
    const liveDataSnap = await getDocs(collection(db, 'product_live_data'));
    const liveDataItems = liveDataSnap.docs.map(doc => ({
      sku: doc.id,
      data: doc.data()
    }));
    console.log(`Fetched ${liveDataItems.length} live data entries`);

    let updateCount = 0;
    for (const item of liveDataItems) {
      const result = await productsCollection.updateOne(
        { sku: item.sku },
        { 
          $set: { 
            liveData: item.data,
            lastSyncedAt: new Date()
          } 
        }
      );
      if (result.modifiedCount > 0) updateCount++;
    }

    console.log(`Successfully synced live data for ${updateCount} products.`);

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.close();
    process.exit(0);
  }
}

migrate();
