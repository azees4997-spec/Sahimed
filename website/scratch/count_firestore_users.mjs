
import { getDbAdmin } from './website/src/lib/firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), 'website/.env.local') });

async function countFirestoreUsers() {
  try {
    const firestore = getDbAdmin();
    if (!firestore) {
      console.error("Firebase Admin not configured correctly.");
      return;
    }

    const usersSnap = await firestore.collection('userProfiles').get();
    console.log(`TOTAL USERS IN FIRESTORE: ${usersSnap.docs.length}`);
    
    if (usersSnap.docs.length > 0) {
        console.log("Sample ID:", usersSnap.docs[0].id);
    }
  } catch (err) {
    console.error("Error counting Firestore users:", err);
  }
}

countFirestoreUsers();
