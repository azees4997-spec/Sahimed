import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('sahimed');

    // 1. Fetch top terms from search analytics
    const topSearches = await db.collection('searchAnalytics').aggregate([
      { $match: { keyword: { $ne: null, $exists: true } } },
      { $group: { _id: { $toLower: "$keyword" }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]).toArray();

    // 2. Categorize terms into Brands and Salts
    const keywords = topSearches.map(s => s._id);
    
    // Check which keywords match molecules (Salts)
    const molecules = await db.collection('molecules').find({
      molecule: { $in: keywords.map(k => new RegExp(`^${k}$`, 'i')) }
    }).toArray();
    const moleculeNames = new Set(molecules.map(m => (m.molecule || m.name).toLowerCase()));

    const trendingSalts = topSearches
      .filter(s => moleculeNames.has(s._id))
      .map(s => ({ name: s._id, count: s.count }))
      .slice(0, 10);

    const trendingBrands = topSearches
      .filter(s => !moleculeNames.has(s._id))
      .map(s => ({ name: s._id, count: s.count }))
      .slice(0, 10);

    // 3. Fallback to static top manufacturers if analytics are sparse
    if (trendingBrands.length < 3) {
      const dbBrands = await db.collection('products').aggregate([
        { $match: { manufacturer: { $ne: null, $exists: true } } },
        { $group: { _id: "$manufacturer", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]).toArray();
      dbBrands.forEach(b => {
        if (!trendingBrands.find(t => t.name.toLowerCase() === b._id.toLowerCase())) {
          trendingBrands.push({ name: b._id, count: b.count });
        }
      });
    }

    if (trendingSalts.length < 3) {
      const dbSalts = await db.collection('molecules').find({})
        .sort({ searchCount: -1 })
        .limit(10)
        .toArray();
      dbSalts.forEach(s => {
        const name = s.molecule || s.name;
        if (name && !trendingSalts.find(t => t.name.toLowerCase() === name.toLowerCase())) {
          trendingSalts.push({ name: name, count: s.searchCount || 0 });
        }
      });
    }

    return NextResponse.json({
      brands: trendingBrands.slice(0, 10),
      salts: trendingSalts.slice(0, 10)
    });
  } catch (err: any) {
    console.error("[Trending API Error]", err);
    return NextResponse.json({ 
      error: "Trending Insights Inaccessible",
      details: err.message,
      status: "Database Syncing" 
    }, { status: 500 });
  }
}
