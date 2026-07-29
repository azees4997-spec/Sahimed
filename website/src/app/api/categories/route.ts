import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAdmin } from '@/lib/auth-utils';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Helper to escape regex search query
function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const qRaw = searchParams.get('q');
  let limitValue = parseInt(searchParams.get('limit') || '500');
  if (isNaN(limitValue) || limitValue < 1) limitValue = 500;

  try {
    const client = await clientPromise;
    const db = client.db('sahimed');
    
    const query: any = {};
    if (qRaw) {
      query.$or = [
        { category: { $regex: escapeRegExp(qRaw), $options: 'i' } },
        { sub_category: { $regex: escapeRegExp(qRaw), $options: 'i' } },
        { category_id: { $regex: escapeRegExp(qRaw), $options: 'i' } }
      ];
    }

    const categories = await db.collection('Category Master')
      .find(query)
      .sort({ category: 1 })
      .limit(limitValue)
      .toArray();

    // Map `_id` to `id` for compatibility
    return NextResponse.json(categories.map(c => ({
      ...c,
      id: c._id?.toString(),
      // Backward compatibility aliases
      name: c.category
    })));
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await verifyAdmin(request);
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db('sahimed');

    const result = await db.collection('Category Master').insertOne({
      category_id: body.category_id,
      category: body.category,
      sub_category: body.sub_category,
      product_count: body.product_count,
      source_catalog: body.source_catalog,
      imageUrl: body.imageUrl || '',
      showOnHomepage: body.showOnHomepage === true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return NextResponse.json({ success: true, id: result.insertedId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
