import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import clientPromise from '@/lib/mongodb';
import ProductDetailClient from './ProductDetailClient';
import { ObjectId } from 'mongodb';

interface Product {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  manufacturer?: string;
  price?: number;
  mrp?: number;
  liveData?: {
    sahimed_price?: number;
    mrp?: number;
  };
  prescriptionRequired?: boolean;
  rxRequired?: boolean;
  moleculeId?: string;
  saltComposition?: string;
  composition?: string;
  salt?: string;
  molecule?: string;
}

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

async function getProduct(id: string): Promise<Product | null> {
  try {
    const client = await clientPromise;
    const db = client.db('sahimed');
    const collection = db.collection('products');

    // Handle both direct string IDs and ObjectIds
    let query: any = { _id: id as any };
    const product = await collection.findOne(query);
    
    if (product) {
      return { ...product, id: product._id.toString() } as unknown as Product;
    }

    // Try as ObjectId if format matches
    if (id.length === 24) {
      try {
        const obId = new ObjectId(id);
        const obProduct = await collection.findOne({ _id: obId });
        if (obProduct) {
          return { ...obProduct, id: obProduct._id.toString() } as unknown as Product;
        }
      } catch (e) {
        // Not a valid ObjectId
      }
    }

    return null;
  } catch (error) {
    console.error('[SSR Product Fetch Error]', error);
    return null;
  }
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return {
      title: 'Product Not Found | SahiMed',
      description: 'The requested medicine could not be found in our catalog.'
    };
  }

  const price = product.liveData?.sahimed_price || product.price || 0;
  const description = product.description || `Buy ${product.name} at affordable prices on SahiMed. Fast delivery across India.`;

  return {
    title: `${product.name} - Buy at ₹${price} | SahiMed`,
    description: description,
    openGraph: {
      title: `${product.name} | SahiMed`,
      description: description,
      images: [product.imageUrl || 'https://sahimed.com/og-image.png'],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  const price = product.liveData?.sahimed_price || product.price || 0;
  const mrp = product.liveData?.mrp || product.mrp || (Number(price) + 20);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.imageUrl || 'https://sahimed.com/logo.png',
    description: product.description || `Buy ${product.name} online.`,
    brand: {
      '@type': 'Brand',
      name: product.manufacturer || 'SahiMed',
    },
    offers: {
      '@type': 'Offer',
      url: `https://sahimed.com/product/${id}`,
      priceCurrency: 'INR',
      price: price,
      itemCondition: 'https://schema.org/NewCondition',
      availability: 'https://schema.org/InStock',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailClient initialProduct={product} id={id} />
    </>
  );
}
