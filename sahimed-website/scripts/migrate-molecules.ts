import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load .env
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const firebaseConfig = {
  "projectId": "studio-9756314138-8403b",
  "appId": "1:503492891847:web:8db8fc212c714cfb5c9ae2",
  "apiKey": "AIzaSyBZjPHZjLz6TgXIAkqQ3uCsaAfO0HUj4qc",
  "authDomain": "studio-9756314138-8403b.firebaseapp.com",
  "storageBucket": "studio-9756314138-8403b.firebasestorage.app",
  "messagingSenderId": "503492891847"
};

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://azees4997_db_user:99XzB5T3H1B0fNj8@sahimed.qwsbgml.mongodb.net/';

async function migrate() {
  console.log('Starting Molecule Migration (using Client SDK)...');
  
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  
  // Initialize MongoDB
  const mongoClient = new MongoClient(MONGODB_URI);

  try {
    await mongoClient.connect();
    console.log('Connected to MongoDB');
    const mongoDb = mongoClient.db('sahimed');
    const moleculesCollection = mongoDb.collection('molecules');

    console.log('Fetching molecules from Firestore (moleculeMaster)...');
    const snapshot = await getDocs(collection(db, 'moleculeMaster'));
    
    if (snapshot.empty) {
      console.log('No molecules found in Firestore collection "moleculeMaster"');
      return;
    }

    const molecules = snapshot.docs.map(doc => ({
      _id: doc.id,
      ...doc.data(),
      migratedAt: new Date()
    }));

    console.log(`Preparing to migrate ${molecules.length} molecules...`);
    
    // Clear existing for a clean sync
    await moleculesCollection.deleteMany({});
    
    // Insert all
    const result = await moleculesCollection.insertMany(molecules);
    
    console.log(`Successfully migrated ${result.insertedCount} molecules!`);

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoClient.close();
    process.exit(0);
  }
}

migrate();
