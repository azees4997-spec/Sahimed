import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAdmin } from '@/lib/auth-utils';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

function getQuery(id: string) {
  try {
    if (id.length === 24) return { _id: new ObjectId(id) };
  } catch (e) {}
  return { _id: id as any };
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await verifyAdmin(request);
    const { id } = await params;
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db('sahimed');

    await db.collection('Marketer Master').updateOne(
      getQuery(id),
      { 
        $set: { 
          'Standardized Marketer Name': body['Standardized Marketer Name'],
          'Marketer ID': body['Marketer ID'],
          'Product Count': body['Product Count'],
          updatedAt: new Date() 
        } 
      }
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await verifyAdmin(request);
    const { id } = await params;
    const client = await clientPromise;
    const db = client.db('sahimed');

    await db.collection('Marketer Master').deleteOne(getQuery(id));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
