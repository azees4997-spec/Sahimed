import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

// Debug endpoint: returns first 3 documents from Product Master to inspect schema
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('sahimed');
    
    const sample = await db.collection('Product Master')
      .find({})
      .limit(3)
      .toArray();

    // Get all unique field names
    const fields = new Set<string>();
    sample.forEach(doc => Object.keys(doc).forEach(k => fields.add(k)));

    return NextResponse.json({ 
      count: sample.length,
      fields: Array.from(fields),
      sample 
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
