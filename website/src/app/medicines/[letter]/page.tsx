import { Metadata } from 'next';
import clientPromise from '@/lib/mongodb';
import MedicinesClient from './MedicinesClient';
import { notFound } from 'next/navigation';

// Cache sitemap and dynamic alphabetical routes for 24 hours on CDN
export const revalidate = 86400;

// Pre-generate A-Z and 0-9 routes for immediate load speeds
export async function generateStaticParams() {
  const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
  return [
    ...letters.map((l) => ({ letter: l })),
    { letter: '0-9' },
  ];
}

interface PageProps {
  params: {
    letter: string;
  };
  searchParams: {
    page?: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const letter = params.letter.toLowerCase();
  const displayLetter = letter === '0-9' ? 'Numbers 0-9' : letter.toUpperCase();

  return {
    title: `Medicines Starting With ${displayLetter} | Buy Online - SahiMed`,
    description: `Browse all healthcare and prescription medicines starting with ${displayLetter} online. Save up to 20% on brand & generic medicines with instant delivery at SahiMed.`,
    alternates: {
      canonical: `https://sahimed.com/medicines/${letter}`,
    },
  };
}

export default async function MedicinesLetterPage({ params, searchParams }: PageProps) {
  const letter = params.letter.toLowerCase();
  
  // Validate route parameter
  const isValidLetter = /^[a-z]$/.test(letter);
  const isValidNumeric = letter === '0-9';

  if (!isValidLetter && !isValidNumeric) {
    notFound();
  }

  const currentPage = Math.max(parseInt(searchParams.page || '1'), 1);
  const limit = 40;
  const skip = (currentPage - 1) * limit;

  let products: any[] = [];
  let totalProducts = 0;

  try {
    const client = await clientPromise;
    const db = client.db('sahimed');
    const productsCollection = db.collection('products');

    // Build case-insensitive query targeting initials
    const queryFilter: any = { isActive: { $ne: false } };
    if (isValidNumeric) {
      queryFilter.name = { $regex: /^[0-9]/ };
    } else {
      queryFilter.name = { $regex: new RegExp(`^${letter}`, 'i') };
    }

    // Execute queries in parallel for efficiency
    const [fetchedProducts, count] = await Promise.all([
      productsCollection.find(queryFilter)
        .project({
          _id: 1,
          name: 1,
          price: 1,
          mrp: 1,
          manufacturer: 1,
          marketer_name: 1,
          imageUrl: 1,
          imageUrls: 1,
          image: 1,
          category: 1,
          packSize: 1,
          availableQuantity: 1,
          stock: 1,
          inStock: 1,
          liveData: 1,
        })
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      productsCollection.countDocuments(queryFilter)
    ]);

    // Map _id properties safely for serialization
    products = fetchedProducts.map((p) => ({
      ...p,
      _id: p._id.toString(),
    }));
    totalProducts = count;

  } catch (error) {
    console.error('Error fetching alphabetical medicines:', error);
  }

  const totalPages = Math.max(Math.ceil(totalProducts / limit), 1);

  return (
    <MedicinesClient
      initialProducts={products}
      letter={letter}
      currentPage={currentPage}
      totalPages={totalPages}
    />
  );
}
