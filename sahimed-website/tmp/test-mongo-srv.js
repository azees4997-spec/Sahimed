
const { MongoClient } = require('mongodb');
const uri = "mongodb+srv://azees4997_db_user:99XzB5T3H1B0fNj8@sahimed.qwsbgml.mongodb.net/sahimed?retryWrites=true&w=majority";
const client = new MongoClient(uri);

async function run() {
  try {
    console.log("Connecting to MongoDB...");
    await client.connect();
    console.log("Connected successfully!");
    const db = client.db("sahimed");
    const count = await db.collection("products").countDocuments();
    console.log(`Found ${count} products.`);
  } catch (err) {
    console.error("Connection failed:", err);
  } finally {
    await client.close();
  }
}
run();
