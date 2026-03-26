
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
  console.log('Starting categories migration...');

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  // Initialize MongoDB
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    const mongoDb = client.db(DB_NAME);
    const categoryCollection = mongoDb.collection('categories');

    // Fetch from Firestore
    console.log('Fetching categories from Firestore...');
    const catSnap = await getDocs(collection(db, 'categories'));
    const categories = catSnap.docs.map(doc => ({
      _id: doc.id,
      ...doc.data(),
      migratedAt: new Date()
    }));
    console.log(`Fetched ${categories.length} categories`);

    if (categories.length > 0) {
      console.log('Clearing existing categories in MongoDB...');
      await categoryCollection.deleteMany({});
      
      console.log('Inserting into MongoDB...');
      const result = await categoryCollection.insertMany(categories);
      console.log(`Successfully migrated ${result.insertedCount} categories!`);
    } else {
      console.log('No categories found to migrate.');
    }

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.close();
    process.exit(0);
  }
}

migrate();
