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
      // Pass the ENTIRE raw MongoDB document plus normalised shorthand keys
      return {
        // ── spread everything from MongoDB ──────────────────────────────
        ...product,

        // ── normalised convenience keys used by legacy helpers ──────────
        id: product._id.toString(),
        name: product.product_name,

        // medical_info sub-document
        description:          product.medical_info?.introduction,
        introduction:         product.medical_info?.introduction,
        treatment:            product.medical_info?.uses,
        uses:                 product.medical_info?.uses,
        primaryUse:           product.medical_info?.primary_use,
        benefits:             product.medical_info?.benefits,
        howToUse:             product.medical_info?.how_to_use,
        howItWorks:           product.medical_info?.how_it_works,
        factBox:              product.medical_info?.fact_box,
        qaList:               Array.isArray(product.medical_info?.q_a) ? product.medical_info.q_a : [],
        // side_effects can be string or array — normalise to both
        sideEffects: Array.isArray(product.medical_info?.side_effects)
          ? product.medical_info.side_effects.join('\n')
          : (product.medical_info?.side_effects || ''),
        sideEffectsArray: Array.isArray(product.medical_info?.side_effects)
          ? product.medical_info.side_effects
          : (product.medical_info?.side_effects
              ? product.medical_info.side_effects.split(/\n|\|/).filter(Boolean)
              : []),
        composition:          product.medical_info?.composition,
        ifMiss:               product.medical_info?.if_miss,
        ifOverdose:           product.medical_info?.if_overdose,
        stopAdvice:           product.medical_info?.stop_advice,
        storageInstructions:  product.medical_info?.storage_instructions,

        // packaging sub-document
        price:                    product.packaging?.mrp,
        mrp:                      product.packaging?.mrp,
        productForm:              product.packaging?.product_form,
        packageType:              product.packaging?.package_type,
        packageQuantity:          product.packaging?.package_quantity,
        packagingDetail:          product.packaging?.packaging_detail,
        // storage: prefer medical_info.storage_instructions, fall back to packaging.storage
        storage_instructions:     product.medical_info?.storage_instructions || product.packaging?.storage,

        // taxonomy sub-document
        manufacturer:       product.taxonomy?.marketer_name,
        marketerName:       product.taxonomy?.marketer_name,
        marketerId:         product.taxonomy?.marketer_id,
        marketerAddress:    product.taxonomy?.marketer_address,
        categoryName:       product.taxonomy?.category_name,
        categoryId:         product.taxonomy?.category_id,
        subCategory:        product.taxonomy?.sub_category,

        // molecule
        moleculeId:         product.molecule_id || product.molecule_code,

        // safety_warnings sub-document (kept as nested object AND as flat keys)
        // ⚠️  Interactions are stored under safety_warnings.interactions.* (not top-level)
        safety_warnings:          product.safety_warnings,
        prescriptionRequired:     product.safety_warnings?.is_rx_required,
        isControlledSubstance:    product.safety_warnings?.is_controlled_substance,
        pregnancyInteraction:     product.safety_warnings?.interactions?.pregnancy,
        lactationInteraction:     product.safety_warnings?.interactions?.lactation,
        drivingInteraction:       product.safety_warnings?.interactions?.driving,
        kidneyInteraction:        product.safety_warnings?.interactions?.kidney,
        liverInteraction:         product.safety_warnings?.interactions?.liver,
        alcoholInteraction:       product.safety_warnings?.interactions?.alcohol,
        safetyAdvise:             product.safety_warnings?.interactions?.safety_advise,

        // images
        imageUrl:   product.images?.[0] || '',
        imageUrls:  product.images || [],

        // identifiers
        sku:            product.product_id,
        moleculeCode:   product.molecule_code,
        medicineType:   product.medicine_type,
        salableStatus:  product.salable_status,
        countryOfOrigin: product.country_of_origin,

        // SEO
        seoUrlSlug:         product.seo?.url_slug,
        seoTitle:           product.seo?.title,
        seoDescription:     product.seo?.description,

        // cross-sell IDs (fetched below)
        crossSellIds:       product.cross_sell_recommendations || [],
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

  // ── Fetch cross-sell products server-side ───────────────────────────────
  let crossSellProducts: any[] = [];
  const crossSellIds: string[] = (product as any).crossSellIds || [];
  if (crossSellIds.length > 0) {
    try {
      const client = await clientPromise;
      const db = client.db('sahimed');
      const docs = await db.collection('Product Master').find(
        { product_id: { $in: crossSellIds } },
        { projection: { product_name: 1, images: 1, packaging: 1, taxonomy: 1, seo: 1, product_id: 1 } }
      ).limit(10).toArray();
      crossSellProducts = docs.map(p => ({
        id: p._id.toString(),
        name: p.product_name,
        imageUrl: p.images?.[0] || '',
        price: p.packaging?.mrp || 0,
        mrp: p.packaging?.mrp || 0,
        marketerName: p.taxonomy?.marketer_name || '',
        seoUrlSlug: p.seo?.url_slug || p.product_id || p._id.toString(),
      }));
    } catch (e) {
      crossSellProducts = [];
    }
  }

  const price = product.price || 0;
  const inStock = true;

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
      <ProductDetailClient initialProduct={product} id={product.id} crossSellProducts={crossSellProducts} />
    </>
  );
}

