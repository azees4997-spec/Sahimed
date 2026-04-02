const { MongoClient } = require('mongodb');

async function run() {
  const uri = 'mongodb+srv://azeessahimed:azeessahimed@sahimed.8dx1m.mongodb.net/sahimed?retryWrites=true&w=majority&appName=Sahimed';
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('sahimed');
    
    console.log("Searching Generic Product Sample...");
    const generic = await db.collection('products').findOne({ isGeneric: { $in: [true, 'true'] } });
    console.log("Generic Result:", JSON.stringify(generic, (key, value) => key === '_id' ? value.toString() : value, 2));

    console.log("\nSearching Branded Product Sample...");
    const branded = await db.collection('products').findOne({ isGeneric: { $in: [false, 'false', null] } });
    console.log("Branded Result:", JSON.stringify(branded, (key, value) => key === '_id' ? value.toString() : value, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}
run();
