const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

// Note: This requires a service account or local auth from firebase login
async function checkFirestore() {
  try {
    const db = getFirestore();
    const snapshot = await db.collection('medicines').limit(1).get();
    if (snapshot.empty) {
      console.log('Firestore medicines collection is EMPTY.');
    } else {
      console.log('Firestore medicines found:', snapshot.docs[0].data().name);
    }
  } catch (err) {
    console.error('Firestore check failed:', err.message);
  }
}

// Since I don't have a service account key easily available, 
// I'll try to use the firebase-admin default credentials if they exist.
// If it fails, I'll rely on the user's information.
checkFirestore();
