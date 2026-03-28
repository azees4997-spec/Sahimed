import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://azees4997_db_user:99XzB5T3H1B0fNj8@sahimed.qwsbgml.mongodb.net/';

async function check() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db('sahimed');
    
    console.log('Checking D-Veniz...');
    const p = await db.collection('products').findOne({ name: /D-Veniz/i });
    if (!p) {
      console.log('D-Veniz not found');
    } else {
      console.log('Found Product:', p.name);
      console.log('moleculeId:', p.moleculeId);
      console.log('isGeneric:', p.isGeneric, 'Type:', typeof p.isGeneric);
      
      if (p.moleculeId) {
        console.log('Searching for molecule with ID:', p.moleculeId);
        const mol = await db.collection('molecules').findOne({ _id: p.moleculeId as any });
        console.log('Molecule data:', mol ? JSON.stringify(mol) : 'Molecule NOT found in molecules collection');
        
        const count = await db.collection('molecules').countDocuments();
        console.log('Total molecules in MongoDB:', count);

        const siblings = await db.collection('products').find({ moleculeId: p.moleculeId }).toArray();
        console.log('Total siblings with this moleculeId:', siblings.length);
        siblings.forEach(s => {
          console.log(` - ${s.name} | Generic: ${s.isGeneric} | Price: ${s.price}`);
        });
      }
    }

    console.log('\nChecking D-Venlor...');
    const p2 = await db.collection('products').findOne({ name: /D-Venlor/i });
    if (p2) {
      console.log('Found D-Venlor:', p2.name);
      console.log('moleculeId:', p2.moleculeId);
      console.log('isGeneric:', p2.isGeneric);
    } else {
      console.log('D-Venlor NOT found in products collection');
    }

  } catch (err) {
    console.error('Check failed:', err);
  } finally {
    await client.close();
    process.exit(0);
  }
}

check();
