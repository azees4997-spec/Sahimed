const { MongoClient } = require('mongodb');
require('dotenv').config();

async function testConnection() {
  // Direct connection string to bypass SRV issues
  const uri = "mongodb://azees4997_db_user:99XzB5T3H1B0fNj8@ac-mymgwbv-shard-00-00.qwsbgml.mongodb.net:27017,ac-mymgwbv-shard-00-01.qwsbgml.mongodb.net:27017,ac-mymgwbv-shard-00-02.qwsbgml.mongodb.net:27017/?ssl=true&replicaSet=atlas-mymgwbv-shard-0&authSource=admin&retryWrites=true&w=majority";

  console.log('Attempting to connect to MongoDB directly...');
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });

  try {
    await client.connect();
    console.log('Successfully connected to MongoDB!');
    const db = client.db('sahimed');
    const products = await db.collection('products').find({}).limit(1).toArray();
    console.log('One product found:', products.length > 0 ? products[0].name : 'No products found');
  } catch (err) {
    console.error('Connection failed:', err.message);
  } finally {
    await client.close();
  }
}

testConnection();
