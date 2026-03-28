
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function testConnection() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is missing in .env");
    return;
  }

  const client = new MongoClient(uri);

  try {
    console.log("Connecting to MongoDB...");
    await client.connect();
    console.log("Connected successfully!");

    const db = client.db('sahimed');
    
    const collections = await db.listCollections().toArray();
    console.log("Collections found in 'sahimed' database:");
    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments();
      console.log(` - ${col.name}: ${count} documents`);
    }

    if (collections.length === 0) {
      console.log("No collections found. Checking all databases...");
      const dbs = await client.db().admin().listDatabases();
      console.log("Databases:");
      dbs.databases.forEach(db => console.log(` - ${db.name}`));
    }

  } catch (err) {
    console.error("Connection failed:", err.message);
  } finally {
    await client.close();
  }
}

testConnection();
