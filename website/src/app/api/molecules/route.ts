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
        { Composition: { $regex: escapeRegExp(qRaw), $options: 'i' } },
        { 'Molecule Code': { $regex: escapeRegExp(qRaw), $options: 'i' } }
      ];
    }

    const molecules = await db.collection('Molecule Master')
      .find(query)
      .sort({ Composition: 1 })
      .limit(limitValue)
      .toArray();

    // Map fields for backward compatibility
    return NextResponse.json(molecules.map(m => ({
      ...m,
      id: m._id?.toString(),
      // Legacy UI mapping aliases
      molecule: m.Composition,
      masterId: m['Molecule Code'],
      form: m['Product Form']
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

    const result = await db.collection('Molecule Master').insertOne({
      'Molecule Code': body['Molecule Code'],
      Composition: body.Composition,
      'Product Form': body['Product Form'] || '',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return NextResponse.json({ success: true, id: result.insertedId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
