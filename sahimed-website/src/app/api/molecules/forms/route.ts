
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('sahimed');
    const forms = await db.collection('molecules').distinct('form');
    // Filter out empty or null
    const validForms = forms.filter(f => f && f.trim().length > 0).sort();
    return NextResponse.json(validForms);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
