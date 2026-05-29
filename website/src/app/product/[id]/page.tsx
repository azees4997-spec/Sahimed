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
  brand?: string;
  price?: number;
  mrp?: number;
  liveData?: {
    sahimed_price?: number;
    mrp?: number;
  };
  stock?: number;
  inStock?: boolean;
  prescriptionRequired?: boolean;
}

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

async function getProduct(id: string): Promise<Product | null> {
  try {
    const client = await clientPromise;
    const db = client.db('sahimed');
    const collection = db.collection('products');

    let query: any = { _id: id as any };
    const product = await collection.findOne(query);
    
    if (product) {
      return { ...product, id: product._id.toString() } as unknown as Product;
    }

    if (id.length === 24) {
      try {
        const obId = new ObjectId(id);
        const obProduct = await collection.findOne({ _id: obId });
        if (obProduct) {
          return { ...obProduct, id: obProduct._id.toString() } as unknown as Product;
        }
      } catch (e) {}
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
    return { title: 'Product Not Found | SahiMed' };
  }

  const price = product.liveData?.sahimed_price || product.price || 0;
  const description = product.description || `Buy ${product.name} at affordable prices on SahiMed. Fast delivery across India.`;

  return {
    title: `Buy ${product.name} Online at ₹${price} | SahiMed - Authentic Medicines`,
    description: description,
    alternates: {
      canonical: `https://sahimed.com/product/${id}`,
    },
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

  if (!product) notFound();

  const price = product.liveData?.sahimed_price || product.price || 0;
  const inStock = (product.stock ?? 0) > 0 || product.inStock !== false;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: (product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[0] : (product.imageUrl || 'https://sahimed.com/medical_login_illustration.png')),
    description: product.description || `Buy ${product.name} online at SahiMed. Genuine quality, lowest prices.`,
    sku: product.sku || id,
    mpn: product.hsnCode || product.sku || id,
    brand: {
      '@type': 'Brand',
      name: product.manufacturer || product.brand || 'SahiMed',
    },
    offers: {
      '@type': 'Offer',
      url: `https://sahimed.com/product/${id}`,
      priceCurrency: 'INR',
      price: price,
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      itemCondition: 'https://schema.org/NewCondition',
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'IN',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 7,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/FreeReturn'
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: { '@type': 'MonetaryAmount', value: 0, currency: 'INR' },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 1, unitCode: 'd' },
          transitTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 3, unitCode: 'd' },
        }
      }
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
