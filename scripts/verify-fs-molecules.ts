import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const firebaseConfig = {
  "projectId": "studio-9756314138-8403b",
  "appId": "1:503492891847:web:8db8fc212c714cfb5c9ae2",
  "apiKey": "AIzaSyBZjPHZjLz6TgXIAkqQ3uCsaAfO0HUj4qc",
  "authDomain": "studio-9756314138-8403b.firebaseapp.com",
  "storageBucket": "studio-9756314138-8403b.firebasestorage.app",
  "messagingSenderId": "503492891847"
};

async function check() {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  
  const targetId = '4iDhYi8budk6XMJOSAq8';
  console.log(`Checking molecule ${targetId} in Firestore...`);
  
  const docSnap = await getDoc(doc(db, 'moleculeMaster', targetId));
  if (docSnap.exists()) {
    console.log('Molecule exists in Firestore:', JSON.stringify(docSnap.data()));
  } else {
    console.log('Molecule DOES NOT exist in Firestore (moleculeMaster)');
    
    // Check if it's in another collection or under a different ID
    console.log('Checking all molecules in Firestore...');
    const all = await getDocs(collection(db, 'moleculeMaster'));
    console.log('Total molecules:', all.size);
    all.docs.slice(0, 10).forEach(d => console.log(' - ', d.id, d.data().molecule));
  }
  process.exit(0);
}

check();
