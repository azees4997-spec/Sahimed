
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
  console.log('Starting migration...');

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

    // Fetch from Firestore
    console.log('Fetching medicines from Firestore...');
    const medicinesSnap = await getDocs(collection(db, 'medicines'));
    const medicines = medicinesSnap.docs.map(doc => ({
      _id: doc.id,
      ...doc.data()
    }));
    console.log(`Fetched ${medicines.length} medicines`);

    // Fetch Live Data
    console.log('Fetching product live data from Firestore...');
    const liveDataSnap = await getDocs(collection(db, 'product_live_data'));
    const liveData = new Map();
    liveDataSnap.docs.forEach(doc => {
      liveData.set(doc.id, doc.data());
    });
    console.log(`Fetched ${liveData.size} live data entries`);

    // Merge Data
    const mergedProducts = medicines.map(product => {
      const live = liveData.get(product.sku) || {};
      return {
        ...product,
        liveData: live,
        migratedAt: new Date()
      };
    });

    // Clear existing and insert
    if (mergedProducts.length > 0) {
      console.log('Clearing existing products in MongoDB...');
      await productsCollection.deleteMany({});
      
      console.log('Inserting into MongoDB...');
      const result = await productsCollection.insertMany(mergedProducts);
      console.log(`Successfully migrated ${result.insertedCount} products!`);
    } else {
      console.log('No products found to migrate.');
    }

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.close();
    process.exit(0);
  }
}

migrate();
