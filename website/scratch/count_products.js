const { MongoClient } = require('mongodb');

async function countProducts() {
  const uri = "mongodb+srv://sahiadmin:SahiMed2025@cluster0.mongodb.net/sahimed?retryWrites=true&w=majority";
  // Note: Using the URI from other scripts in the codebase if available, or I'll check .env
  
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db('sahimed');
    const count = await db.collection('products').countDocuments({});
    console.log(`Total products: ${count}`);
    const activeCount = await db.collection('products').countDocuments({ isActive: { $ne: false } });
    console.log(`Active products: ${activeCount}`);
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

countProducts();
