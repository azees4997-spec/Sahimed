import { Metadata } from 'next';
import clientPromise from '@/lib/mongodb';
import MedicinesClient from './[letter]/MedicinesClient';

export const revalidate = 18000;

export const metadata: Metadata = {
  title: 'Medicines A-Z Index | Buy Online - SahiMed',
  description: 'Browse all healthcare and prescription medicines A-Z online. Save up to 61% on brand & generic medicines with instant delivery at SahiMed.',
  alternates: {
    canonical: 'https://sahimed.com/medicines',
  },
};

export default async function MedicinesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const pageNum = parseInt(resolvedSearchParams?.page || '1', 10);
  const limit = 48;
  const skip = (pageNum - 1) * limit;

  let products: any[] = [];
  let totalCount = 0;

  try {
    const client = await clientPromise;
    const db = client.db('sahimed');

    const query = {
      product_name: { $regex: '^a', $options: 'i' },
      salable_status: { $ne: 'N' }
    };

    const [docs, count] = await Promise.all([
      db.collection('Product Master')
        .find(query)
        .project({
          product_name: 1,
          'medical_info.composition': 1,
          'taxonomy.marketer_name': 1,
          'packaging.mrp': 1,
          medicine_type: 1
        })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection('Product Master').countDocuments(query)
    ]);

    totalCount = count;
    products = docs.map(doc => ({
      id: doc._id.toString(),
      name: doc.product_name,
      composition: doc.medical_info?.composition || '',
      marketer: doc.taxonomy?.marketer_name || '',
      price: doc.packaging?.mrp || 0,
      isGeneric: (doc.medicine_type || '').toLowerCase().includes('generic')
    }));
  } catch (err) {
    console.error("Medicines index fetch failed:", err);
  }

  const totalPages = Math.ceil(totalCount / limit) || 1;

  return (
    <MedicinesClient
      letter="a"
      products={products}
      currentPage={pageNum}
      totalPages={totalPages}
      totalCount={totalCount}
    />
  );
}
