
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), 'website/.env.local') });

const uri = process.env.MONGODB_URI;

async function checkUsers() {
  if (!uri) {
    console.error('MONGODB_URI not found in environment');
    return;
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('sahimed');
    
    // Check 'users' collection
    const usersCount = await db.collection('users').countDocuments();
    console.log(`Total users in MongoDB 'users' collection: ${usersCount}`);

    // Check 'userProfiles' collection
    const profilesCount = await db.collection('userProfiles').countDocuments();
    console.log(`Total users in MongoDB 'userProfiles' collection: ${profilesCount}`);

    if (usersCount > 0) {
      const sample = await db.collection('users').findOne({});
      console.log('Sample User from "users":', sample?.name || sample?.uid);
    }
    
    if (profilesCount > 0) {
      const sample = await db.collection('userProfiles').findOne({});
      console.log('Sample User from "userProfiles":', sample?.name || sample?.uid);
    }

  } catch (err) {
    console.error('Error checking MongoDB:', err);
  } finally {
    await client.close();
  }
}

checkUsers();
