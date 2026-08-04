import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('sahimed');
    const collection = db.collection('Product Master');

    // Fetch distinct marketer names and dosage forms using the actual nested schema paths
    const [marketerNames, dosageForms] = await Promise.all([
      collection.distinct('taxonomy.marketer_name', { 'taxonomy.marketer_name': { $exists: true, $ne: null, $ne: '' } }),
      collection.distinct('packaging.product_form', { 'packaging.product_form': { $exists: true, $ne: null, $ne: '' } }),
    ]);

    const marketers = Array.from(new Set(marketerNames)).filter(Boolean).sort();

    return NextResponse.json(
      { marketers, dosageForms: dosageForms.filter(Boolean).sort() },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' } }
    );
  } catch (err: any) {
    console.error('[Filters API]', err);
    return NextResponse.json({ marketers: [], dosageForms: [] }, { status: 500 });
  }
}
