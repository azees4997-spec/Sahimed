import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('sahimed');
    const collection = db.collection('products');

    const [marketerNames, manufacturerNames, dosageForms] = await Promise.all([
      collection.distinct('marketer_name', { marketer_name: { $exists: true, $ne: null, $ne: '' } }),
      collection.distinct('manufacturer', { manufacturer: { $exists: true, $ne: null, $ne: '' } }),
      collection.distinct('dosage_form', { dosage_form: { $exists: true, $ne: null, $ne: '' } }),
    ]);

    const marketers = Array.from(new Set([...marketerNames, ...manufacturerNames])).filter(Boolean).sort();

    return NextResponse.json(
      { marketers, dosageForms },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' } }
    );
  } catch (err: any) {
    console.error('[Filters API]', err);
    return NextResponse.json({ marketers: [], dosageForms: [] }, { status: 500 });
  }
}
