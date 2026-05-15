import clientPromise from '../src/lib/mongodb';

async function createIndexes() {
  console.log('Connecting to MongoDB...');
  const client = await clientPromise;
  const db = client.db('sahimed');

  console.log('Creating indexes for products...');
  await db.collection('products').createIndex({ name: 1 });
  await db.collection('products').createIndex({ saltComposition: 1 });
  await db.collection('products').createIndex({ moleculeId: 1 });
  await db.collection('products').createIndex({ isGeneric: 1 });
  
  console.log('Creating indexes for molecules...');
  await db.collection('molecules').createIndex({ molecule: 1 });
  await db.collection('molecules').createIndex({ masterId: 1 });

  console.log('Indexes created successfully!');
  process.exit(0);
}

createIndexes().catch(err => {
  console.error('Error creating indexes:', err);
  process.exit(1);
});
