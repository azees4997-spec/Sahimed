import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = await clientPromise;
    const db = client.db('sahimed');
    
    const molecule = await db.collection('molecules').findOne({ _id: id as any });
    
    if (!molecule) {
      return NextResponse.json({ error: 'Molecule not found' }, { status: 404 });
    }

    return NextResponse.json(molecule);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
