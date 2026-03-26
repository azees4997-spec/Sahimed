
import { MongoClient } from 'mongodb';

const uri = "mongodb+srv://azees4997_db_user:99XzB5T3H1B0fNj8@sahimed.qwsbgml.mongodb.net/";

async function check() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('sahimed');
    const collection = db.collection('products');
    
    const count = await collection.countDocuments();
    console.log(`Total products in DB: ${count}`);

    const met = await collection.find({ 
      $or: [
        { name: { $regex: 'metformin', $options: 'i' } },
        { saltComposition: { $regex: 'metformin', $options: 'i' } },
        { salt: { $regex: 'metformin', $options: 'i' } }
      ] 
    }).limit(5).toArray();
    
    console.log(`\nSearching for "metformin": Found ${met.length} items`);
    met.forEach(p => console.log(`- ${p.name} (Salt: ${p.saltComposition || p.salt || 'N/A'})`));

    const ami = await collection.find({ 
      $or: [
        { name: { $regex: 'Amitriptyline', $options: 'i' } },
        { saltComposition: { $regex: 'Amitriptyline', $options: 'i' } }
      ] 
    }).limit(5).toArray();

    console.log(`\nSearching for "Amitriptyline": Found ${ami.length} items`);
    ami.forEach(p => console.log(`- ${p.name} (Salt: ${p.saltComposition || p.salt || 'N/A'})`));

  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
    process.exit(0);
  }
}

check();
