const { MongoClient } = require('mongodb');
const uri = "mongodb://azees4997_db_user:99XzB5T3H1B0fNj8@ac-mymgwbv-shard-00-00.qwsbgml.mongodb.net:27017,ac-mymgwbv-shard-00-01.qwsbgml.mongodb.net:27017,ac-mymgwbv-shard-00-02.qwsbgml.mongodb.net:27017/sahimed?ssl=true&replicaSet=atlas-mymgwbv-shard-0&authSource=admin&retryWrites=true&w=majority";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const db = client.db('sahimed');
    
    const uids = [
      "BM9HheYflheT0Wyj6olaEnyCAHl1",
      "RzB6nqlQumg1VEniFcZrgbcDdRA2"
    ];

    console.log("--- PROMOTING MASTER ADMINS ---");
    
    for (const uid of uids) {
      const result = await db.collection('adminProfiles').updateOne(
        { $or: [{ uid: uid }, { id: uid }] },
        { 
          $set: { 
            role: "admin", 
            uid: uid, 
            id: uid, 
            updatedAt: new Date().toISOString() 
          },
          $setOnInsert: { 
            activatedAt: new Date().toISOString(),
            notes: "Manually promoted by Antigravity"
          }
        },
        { upsert: true }
      );
      console.log(`UID: ${uid} | Result: ${JSON.stringify(result)}`);
    }

  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}
run();
run();
