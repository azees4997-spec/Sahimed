import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

// Initialize Firebase Admin SDK
if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: "studio-9756314138-8403b",
    storageBucket: "studio-9756314138-8403b.firebasestorage.app"
  });
}

const bucket = admin.storage().bucket();
const publicImagesDir = path.join(process.cwd(), 'public/images');

async function uploadAll() {
  const files = fs.readdirSync(publicImagesDir);
  console.log(`Found ${files.length} images to upload with Admin SDK...`);

  const results = {};

  for (const file of files) {
    const filePath = path.join(publicImagesDir, file);
    if (fs.statSync(filePath).isDirectory()) continue;

    console.log(`Uploading ${file}...`);
    
    try {
      const destination = `images/${file}`;
      const [uploadedFile] = await bucket.upload(filePath, {
        destination,
        public: true,
        metadata: {
          contentType: file.endsWith('.png') ? 'image/png' : 'image/jpeg',
          cacheControl: 'public, max-age=31536000',
        }
      });

      // Generate public media URL
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;
      results[file] = publicUrl;
      console.log(`✅ Uploaded ${file} ➔ ${publicUrl}`);
    } catch (err) {
      console.error(`❌ Admin Upload Error for ${file}:`, err.message);
    }
  }

  console.log('\n--- ADMIN UPLOAD SUMMARY ---');
  console.log(JSON.stringify(results, null, 2));

  fs.writeFileSync(path.join(process.cwd(), '../scratch/firebase_storage_urls.json'), JSON.stringify(results, null, 2));
  console.log('\nSaved Firebase Storage URLs to scratch/firebase_storage_urls.json');
}

uploadAll().catch(console.error);
