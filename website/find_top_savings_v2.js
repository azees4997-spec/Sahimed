const { MongoClient } = require('mongodb');

async function run() {
  // Try the URI from check-search.mjs
  const uri = "mongodb+srv://azees4997_db_user:99XzB5T3H1B0fNj8@sahimed.qwsbgml.mongodb.net/";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('sahimed');
    
    console.log("Fetching products with highest savings...");
    
    const products = await db.collection('products').find({}).toArray();
    console.log(`Found ${products.length} products.`);
    
    const productsWithSavings = products.map(p => {
      const mrp = parseFloat(p.mrp) || 0;
      const price = parseFloat(p.price) || 0;
      const savings = mrp - price;
      const percentageSavings = mrp > 0 ? (savings / mrp) * 100 : 0;
      
      return {
        name: p.name,
        mrp: mrp,
        price: price,
        savings: savings,
        percentageSavings: percentageSavings,
        salt: p.saltComposition || p.salt || 'N/A'
      };
    });
    
    // Sort by absolute savings
    productsWithSavings.sort((a, b) => b.savings - a.savings);
    
    console.log("Top 3 products by absolute savings:");
    console.log(JSON.stringify(productsWithSavings.slice(0, 3), null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}
run();
