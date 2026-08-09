const { MongoClient } = require('mongodb');

const uri = "mongodb://azees4997_db_user:99XzB5T3H1B0fNj8@ac-mymgwbv-shard-00-00.qwsbgml.mongodb.net:27017,ac-mymgwbv-shard-00-01.qwsbgml.mongodb.net:27017,ac-mymgwbv-shard-00-02.qwsbgml.mongodb.net:27017/sahimed?ssl=true&authSource=admin";

async function addSellingPriceField() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log("Connected to MongoDB Atlas!");
    const db = client.db('sahimed');
    const col = db.collection('Product Master');

    // Update all products in Product Master to include selling_price = packaging.mrp if not set
    const result = await col.updateMany(
      { selling_price: { $exists: false } },
      [
        {
          $set: {
            selling_price: "$packaging.mrp"
          }
        }
      ]
    );

    console.log(`Successfully updated ${result.modifiedCount} products in 'Product Master' with 'selling_price' field!`);

    // Print a sample product to verify
    const sample = await col.findOne({ product_name: /D-VENIZ/i });
    console.log("Sample Updated Product Document:", JSON.stringify({
      product_name: sample.product_name,
      mrp: sample.packaging?.mrp,
      selling_price: sample.selling_price
    }, null, 2));

  } catch (err) {
    console.error("Error updating MongoDB:", err);
  } finally {
    await client.close();
  }
}

addSellingPriceField();
