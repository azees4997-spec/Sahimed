import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('sahimed');

    // 1. Fetch top unique manufacturers (brands)
    const topBrands = await db.collection('products').aggregate([
      { $match: { manufacturer: { $ne: null, $exists: true } } },
      { $group: { _id: "$manufacturer", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { name: "$_id", count: 1, _id: 0 } }
    ]).toArray();

    // 2. Fetch top unique molecules (salts)
    const topSalts = await db.collection('molecules').aggregate([
      { $match: { molecule: { $ne: null, $exists: true } } },
      { $sort: { searchCount: -1, name: 1 } },
      { $limit: 10 },
      { $project: { name: { $ifNull: ["$molecule", "$name"] }, _id: 0 } }
    ]).toArray();

    // Fallback if molecules collection is empty or lacks searchCount
    let finalSalts = topSalts;
    if (finalSalts.length === 0) {
      finalSalts = await db.collection('products').aggregate([
        { $match: { saltComposition: { $ne: null, $exists: true } } },
        { $group: { _id: "$saltComposition", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { name: "$_id", _id: 0 } }
      ]).toArray();
    }

    return NextResponse.json({
      brands: topBrands,
      salts: finalSalts
    });
  } catch (err: any) {
    console.error("Trending API Error", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
