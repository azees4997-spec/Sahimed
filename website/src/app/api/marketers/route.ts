import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAdmin } from '@/lib/auth-utils';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Collection: "Marketer Master"
// Fields: Marketer ID, Standardized Marketer Name, Product Count

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const qRaw = searchParams.get('q');
    let limitValue = parseInt(searchParams.get('limit') || '500');
    if (isNaN(limitValue) || limitValue < 1) limitValue = 500;

    const client = await clientPromise;
    const db = client.db('sahimed');

    const query: any = {};
    if (qRaw) {
      query['Standardized Marketer Name'] = { $regex: escapeRegExp(qRaw), $options: 'i' };
    }

    const marketers = await db.collection('Marketer Master')
      .find(query)
      .sort({ 'Standardized Marketer Name': 1 })
      .limit(limitValue)
      .toArray();

    return NextResponse.json(marketers);
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

    // Auto-generate Marketer ID
    const count = await db.collection('Marketer Master').countDocuments();
    const marketerId = `MKT${String(count + 1).padStart(5, '0')}`;

    const result = await db.collection('Marketer Master').insertOne({
      'Marketer ID': body['Marketer ID'] || marketerId,
      'Standardized Marketer Name': body['Standardized Marketer Name'],
      'Product Count': body['Product Count'] || '0',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return NextResponse.json({ success: true, id: result.insertedId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
