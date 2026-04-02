
import { MongoClient, ObjectId } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from the website root
dotenv.config({ path: path.join(__dirname, '../.env') });

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('Error: MONGODB_URI not found in .env');
  process.exit(1);
}

async function setup() {
  const client = new MongoClient(uri!);
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    const db = client.db('sahimed');

    // 1. Create Indexes
    console.log('Creating indexes...');
    
    // Products indexes
    await db.collection('products').createIndex({ name: 1 });
    await db.collection('products').createIndex({ moleculeId: 1 });
    await db.collection('products').createIndex({ saltComposition: 1 });
    await db.collection('products').createIndex({ category: 1 });
    
    // Molecules indexes
    await db.collection('molecules').createIndex({ molecule: 1 });
    await db.collection('molecules').createIndex({ name: 1 });
    
    console.log('Indexes created successfully.');

    // 2. Auto-linking Logic
    console.log('Starting Auto-link procedure...');
    const molecules = await db.collection('molecules').find({}).toArray();
    
    let linkCount = 0;
    for (const mol of molecules) {
      const saltName = mol.molecule || mol.name;
      if (!saltName) continue;

      // Find products with matching salt composition but NO moleculeId
      const result = await db.collection('products').updateMany(
        { 
          $or: [
            { saltComposition: { $regex: saltName, $options: 'i' } },
            { salt: { $regex: saltName, $options: 'i' } }
          ],
          moleculeId: { $exists: false } 
        },
        { $set: { moleculeId: mol._id.toString() } }
      );
      
      linkCount += result.modifiedCount;
    }
    
    console.log(`Auto-link complete. Linked ${linkCount} products to their molecules.`);

  } catch (err) {
    console.error('Setup failed:', err);
  } finally {
    await client.close();
  }
}

setup();
