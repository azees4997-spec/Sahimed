import { MongoClient } from 'mongodb';

async function run() {
  const uri = "mongodb+srv://admin:Ld2Z8fXjB7zK4qP9@cluster0.p83h7.mongodb.net/sahimed?retryWrites=true&w=majority";
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('sahimed');
  const molecules = await db.collection('molecules').find({ molecule: { $regex: /enoxaparin/i } }).toArray();
  console.log("Molecules:", molecules.map(m => ({ id: m._id, molecule: m.molecule })));

  const products = await db.collection('products').find({ 
    $or: [
      { saltComposition: { $regex: /enoxaparin/i } },
      { name: { $regex: /enoxaparin/i } }
    ]
  }).limit(5).toArray();
  console.log("Products moleculeIds:", products.map(p => ({name: p.name, moleculeId: p.moleculeId})));
  process.exit(0);
}
run();
