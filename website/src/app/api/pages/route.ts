import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const snapshot = await db.collection('pages').orderBy('lastUpdated', 'desc').get();
    const pages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return NextResponse.json(pages, {
      headers: {
        'Cache-Control': 'public, s-maxage=18000, stale-while-revalidate=9000'
      }
    });
  } catch (error) {
    console.error('[PAGES_API_ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch pages' }, { status: 500 });
  }
}
