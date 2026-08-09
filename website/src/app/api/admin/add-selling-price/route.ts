import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('sahimed');
    const col = db.collection('Product Master');

    // Add selling_price field equal to packaging.mrp for all products where selling_price is not set
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

    const sample = await col.findOne({ product_name: /D-VENIZ/i });

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${result.modifiedCount} products in 'Product Master' with 'selling_price' field!`,
      modifiedCount: result.modifiedCount,
      sampleProduct: sample ? {
        name: sample.product_name,
        mrp: sample.packaging?.mrp,
        selling_price: sample.selling_price
      } : null
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
