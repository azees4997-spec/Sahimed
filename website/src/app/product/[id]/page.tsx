import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import clientPromise from '@/lib/mongodb';
import ProductDetailClient from '@/app/product/[id]/ProductDetailClient';
import { ObjectId } from 'mongodb';
import { PRODUCTS } from '@/lib/data';

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
  imageUrls?: string[];
  hsnCode?: string;
  sku?: string;
}

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const client = await clientPromise;
    const db = client.db('sahimed');
    const collection = db.collection('Product Master');

    // Decode url slug component
    const decodedSlug = decodeURIComponent(slug);
    const slugQuery = decodedSlug.startsWith('/') ? decodedSlug : `/${decodedSlug}`;

    // Try finding by url_slug first
    let product = await collection.findOne({
      $or: [
        { 'seo.url_slug': slugQuery },
        { 'seo.url_slug': decodedSlug }
      ]
    });

    // Fallback: If not found, try matching by direct ID or product_id/sku
    if (!product) {
      let idQuery: any = { _id: decodedSlug as any };
      product = await collection.findOne(idQuery);

      if (!product && decodedSlug.length === 24) {
        try {
          product = await collection.findOne({ _id: new ObjectId(decodedSlug) });
        } catch (e) {}
      }

      if (!product) {
        product = await collection.findOne({ product_id: decodedSlug });
      }
    }

    if (product) {
      // Normalize to legacy structure expected by ProductDetailClient
      return {
        ...product,
        id: product._id.toString(),
        name: product.product_name,
        description: product.medical_info?.introduction,
        imageUrl: product.images?.[0] || '',
        imageUrls: product.images || [],
        manufacturer: product.taxonomy?.marketer_name,
        price: product.packaging?.mrp,
        mrp: product.packaging?.mrp,
        sku: product.product_id,
        prescriptionRequired: product.safety_warnings?.is_rx_required
      } as unknown as Product;
    }
    return null;
  } catch (error) {
    console.error('[SSR Product Fetch Error] MongoDB query failed', error);
    return null;
  }
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductBySlug(id);

  if (!product) {
    return { title: 'Product Not Found | SahiMed' };
  }

  const price = product.price || 0;
  const description = product.description || `Buy ${product.name} at affordable prices on SahiMed. Fast delivery across India.`;

  let ogImage = product.imageUrl || 'https://sahimed.com/og-image.png';
  if (ogImage.startsWith('/')) {
    ogImage = `https://sahimed.com${ogImage}`;
  }

  return {
    title: `Buy ${product.name} Online at ₹${price} | SahiMed - Authentic Medicines`,
    description: description,
    alternates: {
      canonical: `https://sahimed.com/product/${id}`,
    },
    openGraph: {
      title: `${product.name} | SahiMed`,
      description: description,
      url: `https://sahimed.com/product/${id}`,
      siteName: 'SahiMed',
      type: 'website',
      images: [
        {
          url: ogImage,
          width: 800,
          height: 600,
          alt: product.name,
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Buy ${product.name} Online at ₹${price} | SahiMed`,
      description: description,
      images: [ogImage],
    }
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await getProductBySlug(id);

  if (!product) notFound();

  const price = product.price || 0;
  const inStock = true; // Salable items from Product Master are in stock

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: (product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[0] : (product.imageUrl || 'https://sahimed.com/medical_login_illustration.png')),
    description: product.description || `Buy ${product.name} online at SahiMed. Genuine quality, lowest prices.`,
    sku: product.sku || id,
    mpn: product.sku || id,
    brand: {
      '@type': 'Brand',
      name: product.manufacturer || 'SahiMed',
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
      <ProductDetailClient initialProduct={product} id={product.id} />
    </>
  );
}
