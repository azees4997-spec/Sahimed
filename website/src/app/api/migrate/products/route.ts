import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db('sahimed');
    const productsCol = db.collection('products');

    const products = await productsCol.find({}).toArray();
    console.log(`[Migration] Starting migration for ${products.length} products...`);

    const ops = products.map((p: any) => {
      const { id, _id, liveData, ...rest } = p;
      
      // Pull composition from ANY existing legacy field
      const fallbackComposition = rest.saltComposition || rest.composition || rest.salt || rest.molecule || '';

      const updatePayload: any = {
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

      // Explicitly remove legacy root fields if they exist in the payload
      delete updatePayload.imageUrl2;
      delete updatePayload.imageUrl3;
      delete updatePayload.id;
      delete updatePayload.liveData;

      return {
        replaceOne: {
          filter: { _id: _id },
          replacement: { ...updatePayload, _id: _id },
          upsert: false
        }
      };
    });

    // Chunk size 1000 for safety
    const chunkSize = 1000;
    let modifiedCount = 0;
    for (let i = 0; i < ops.length; i += chunkSize) {
      const chunk = ops.slice(i, i + chunkSize);
      const result = await productsCol.bulkWrite(chunk);
      modifiedCount += result.modifiedCount || 0;
      console.log(`[Migration] Processed ${i + chunk.length}/${products.length} products...`);
    }

    return NextResponse.json({ 
      success: true, 
      total: products.length, 
      migrated: modifiedCount 
    });

  } catch (err: any) {
    console.error("[Migration Error]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
