import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import fs from 'fs';
import path from 'path';

const firebaseConfig = {
  projectId: "studio-9756314138-8403b",
  appId: "1:503492891847:web:8db8fc212c714cfb5c9ae2",
  apiKey: "AIzaSyBZjPHZjLz6TgXIAkqQ3uCsaAfO0HUj4qc",
  authDomain: "studio-9756314138-8403b.firebaseapp.com",
  storageBucket: "studio-9756314138-8403b.firebasestorage.app",
  messagingSenderId: "503492891847"
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

const publicImagesDir = path.join(process.cwd(), 'public/images');

async function uploadAll() {
  const files = fs.readdirSync(publicImagesDir);
  console.log(`Found ${files.length} images to upload...`);

  const results = {};

  for (const file of files) {
    const filePath = path.join(publicImagesDir, file);
    if (fs.statSync(filePath).isDirectory()) continue;

    console.log(`Uploading ${file}...`);
    const fileBuffer = fs.readFileSync(filePath);

    // Storage reference: images/filename
    const storageRef = ref(storage, `images/${file}`);
    
    try {
      const snapshot = await uploadBytes(storageRef, fileBuffer, {
        contentType: 'image/jpeg'
      });
      const downloadURL = await getDownloadURL(snapshot.ref);
      results[file] = downloadURL;
      console.log(`✅ Uploaded ${file} ➔ ${downloadURL}`);
    } catch (err) {
      console.error(`❌ Failed to upload ${file}:`, err.message);
    }
  }

  console.log('\n--- UPLOAD SUMMARY ---');
  console.log(JSON.stringify(results, null, 2));

  fs.writeFileSync(path.join(process.cwd(), '../scratch/firebase_storage_urls.json'), JSON.stringify(results, null, 2));
  console.log('\nSaved Firebase Storage URLs to scratch/firebase_storage_urls.json');
}

uploadAll().catch(console.error);
