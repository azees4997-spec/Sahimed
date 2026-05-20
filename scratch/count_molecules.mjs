import clientPromise from '../website/src/lib/mongodb';

async function countMolecules() {
  try {
    const client = await clientPromise;
    const db = client.db('sahimed');
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));

    // Try counting products first as it's the most likely place
    if (collections.find(c => c.name === 'products')) {
      const productCount = await db.collection('products').countDocuments();
      console.log('Total Products:', productCount);
    }

    // Check if there's a specific 'molecules' collection
    if (collections.find(c => c.name === 'molecules')) {
      const moleculeCount = await db.collection('molecules').countDocuments();
      console.log('Total Molecules:', moleculeCount);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

countMolecules();
