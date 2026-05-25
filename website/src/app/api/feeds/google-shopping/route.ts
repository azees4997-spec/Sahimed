import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

function escapeXml(unsafe: any) {
  if (unsafe === null || unsafe === undefined) return '';
  return unsafe.toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/[^\x09\x0A\x0D\x20-\xFF\x85\xA0-\uD7FF\uE000-\uFDCF\uFDE0-\uFFFD]/g, ''); // Remove illegal XML characters
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('sahimed');
    const products = await db.collection('products')
      .find({ isActive: { $ne: false } })
      .limit(5000)
      .toArray();

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sahimed.com';

    const items: string[] = [];
    
    for (const product of products) {
      try {
        if (!product.name || (!product.price && !product.liveData?.sahimed_price)) continue;
        
        const id = product._id?.toString();
        if (!id) continue;

        const title = escapeXml(product.name || '');
        const description = escapeXml(product.description || `Buy ${product.name} at best prices on SahiMed.`);
        const link = escapeXml(`${baseUrl}/product/${id}`);
        
        // Image Handling
        const rawImages = [
          ...(product.imageUrls || []),
          product.imageUrl,
          product.image,
          ...(product.images || [])
        ].filter(Boolean);

        // Deduplicate URLs using a Set after mapping to absolute URLs
        const absoluteImages = rawImages.map(img => {
          if (typeof img !== 'string') return null;
          if (img.startsWith('http')) return img;
          return `${baseUrl}${img.startsWith('/') ? '' : '/'}${img}`;
        }).filter(Boolean) as string[];

        const uniqueImages = Array.from(new Set(absoluteImages));

        const imageLink = escapeXml(uniqueImages[0] || `${baseUrl}/medical_login_illustration.png`);
        const additionalImages = uniqueImages.slice(1, 11)
          .map(img => `
      <g:additional_image_link>${escapeXml(img)}</g:additional_image_link>`)
          .join('');
        
        // Pricing
        const salePrice = Number(product.liveData?.sahimed_price || product.price || 0);
        const mrp = Number(product.liveData?.mrp || product.mrp || salePrice);
        const priceStr = escapeXml(`${mrp} INR`);
        const salePriceStr = salePrice < mrp ? `<g:sale_price>${escapeXml(`${salePrice} INR`)}</g:sale_price>` : '';

        // Product Identifiers
        const brand = escapeXml(product.manufacturer || product.marketer_name || product.brand || 'SahiMed');
        const mpn = escapeXml(product.sku || product.hsnCode || id);
        const gtin = escapeXml(product.gtin || product.barcode || '');
        const hasIdentifiers = !!(brand && (mpn || gtin));

        const category = escapeXml(product.category || 'Medications');
        const inStock = (product.availableQuantity > 0 || product.stock > 0 || product.inStock !== false);

        items.push(`
    <item>
      <g:id>${escapeXml(id)}</g:id>
      <g:title>${title}</g:title>
      <g:description>${description}</g:description>
      <g:link>${link}</g:link>
      <g:image_link>${imageLink}</g:image_link>${additionalImages}
      <g:condition>new</g:condition>
      <g:availability>${inStock ? 'in stock' : 'out of stock'}</g:availability>
      <g:price>${priceStr}</g:price>
      ${salePriceStr}
      <g:brand>${brand}</g:brand>
      <g:mpn>${mpn}</g:mpn>
      ${gtin ? `<g:gtin>${gtin}</g:gtin>` : ''}
      <g:identifier_exists>${hasIdentifiers ? 'yes' : 'no'}</g:identifier_exists>
      <g:google_product_category>Health &amp; Beauty &gt; Health Care &gt; Medications &amp; Treatments</g:google_product_category>
      <g:product_type>${category}</g:product_type>
      <g:shipping>
        <g:country>IN</g:country>
        <g:service>Standard</g:service>
        <g:price>0 INR</g:price>
      </g:shipping>
    </item>`);
      } catch (err) {
        console.error(`Error processing product ${product._id}:`, err);
        continue;
      }
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>SahiMed | Authentic Medicines &amp; Healthcare</title>
    <link>${baseUrl}</link>
    <description>Get authentic medicines, healthcare products, and wellness essentials delivered to your doorstep. Best prices guaranteed at SahiMed.</description>
    ${items.join('')}
  </channel>
</rss>`;

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800',
      },
    });
  } catch (error: any) {
    console.error('[Google Shopping Feed Error]', error);
    return new NextResponse('Error generating feed', { status: 500 });
  }
}
