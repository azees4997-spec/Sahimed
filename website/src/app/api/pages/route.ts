import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

const DEFAULT_PAGES = [
  { id: 'about-us', title: 'About Us', placement: 'footer' },
  { id: 'privacy-policy', title: 'Privacy Policy', placement: 'footer' },
  { id: 'terms-conditions', title: 'Terms & Conditions', placement: 'footer' },
  { id: 'shipping-policy', title: 'Shipping Policy', placement: 'footer' },
  { id: 'refund-policy', title: 'Return & Refund Policy', placement: 'footer' },
  { id: 'prescription-policy', title: 'Prescription Policy', placement: 'footer' },
  { id: 'editorial-policy', title: 'Editorial Policy', placement: 'footer' },
  { id: 'contact-us', title: 'Contact Us', placement: 'footer' },
];

export async function GET() {
  try {
    if (!db) return NextResponse.json(DEFAULT_PAGES);
    const snapshot = await db.collection('pages').orderBy('lastUpdated', 'desc').get();
    const pages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return NextResponse.json(pages.length > 0 ? pages : DEFAULT_PAGES, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800'
      }
    });
  } catch (error) {
    console.error('[PAGES_API_ERROR]', error);
    return NextResponse.json(DEFAULT_PAGES);
  }
}
