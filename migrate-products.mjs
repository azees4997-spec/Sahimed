import { MongoClient } from 'mongodb';

const uri = "mongodb+srv://azees4997_db_user:99XzB5T3H1B0fNj8@sahimed.qwsbgml.mongodb.net/sahimed?retryWrites=true&w=majority";

async function migrate() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('sahimed');
    const productsCol = db.collection('products');

    const products = await productsCol.find({}).toArray();
    console.log(`[Migration] Scanning ${products.length} products...`);

    const ops = products.map((p) => {
      const { id, _id, liveData, imageUrl2, imageUrl3, ...rest } = p;
      
      // Pull composition from ANY existing legacy field
      const fallbackComposition = rest.saltComposition || rest.composition || rest.salt || rest.molecule || '';

      const updatePayload = {
        ...rest,
        clinicalTabLabel: rest.clinicalTabLabel || 'Intelligence',
        safetyTabLabel: rest.safetyTabLabel || 'Protocol',
        matrixTabLabel: rest.matrixTabLabel || 'Matrix',
        saltComposition: fallbackComposition,
        updatedAt: new Date()
      };

      // Flatten liveData root fields if present
      if (liveData) {
        updatePayload.price = Number(liveData.sahimed_price || liveData.price || rest.price || 0);
        updatePayload.mrp = Number(liveData.mrp || rest.mrp || 0);
        updatePayload.availableQuantity = Number(liveData.stock_quantity || liveData.availableQuantity || rest.availableQuantity || 0);
      }

      // Cleanup more fields
      delete updatePayload.id;
      delete updatePayload.liveData;
      delete updatePayload.imageUrl2;
      delete updatePayload.imageUrl3;

      return {
        replaceOne: {
          filter: { _id: _id },
          replacement: { ...updatePayload, _id: _id },
          upsert: false
        }
      };
    });

    if (ops.length === 0) {
      console.log("[Migration] No products found.");
      return;
    }

    const chunkSize = 500;
    let modifiedCount = 0;
    for (let i = 0; i < ops.length; i += chunkSize) {
      const chunk = ops.slice(i, i + chunkSize);
      const result = await productsCol.bulkWrite(chunk);
      modifiedCount += result.modifiedCount || 0;
      console.log(`[Migration] Progress: ${Math.min(i + chunkSize, ops.length)}/${ops.length}`);
    }

    console.log(`[Migration] SUCCESS! Migrated ${modifiedCount} products.`);
  } catch (err) {
    console.error("[Migration FAILED]", err);
  } finally {
    await client.close();
  }
}

migrate();
