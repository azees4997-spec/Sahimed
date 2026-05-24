import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache for 1 hour

function escapeXml(unsafe: string) {
  return (unsafe || '').toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
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

    // Build the XML string
    let xml = `<?xml version="1.0"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>SahiMed | Authentic Medicines &amp; Healthcare</title>
    <link>${baseUrl}</link>
    <description>Get authentic medicines, healthcare products, and wellness essentials delivered to your doorstep. Best prices guaranteed at SahiMed.</description>
    ${products.map(product => {
      const id = escapeXml(product._id.toString());
      const title = escapeXml(product.name || '');
      const description = escapeXml(product.description || `Buy ${product.name} at best prices on SahiMed. Quality medicines and healthcare products. Fast delivery across India.`);
      const link = escapeXml(`${baseUrl}/product/${id}`);
      
      // Image Handling
      const allImages = [
        ...(product.imageUrls || []),
        product.imageUrl,
        product.image,
        ...(product.images || [])
      ].filter(Boolean).map(img => {
        if (typeof img !== 'string') return null;
        if (img.startsWith('http')) return img;
        return `${baseUrl}${img.startsWith('/') ? '' : '/'}${img}`;
      }).filter(Boolean) as string[];

      const imageLink = escapeXml(allImages[0] || `${baseUrl}/medical_login_illustration.png`);
      const additionalImageLinks = allImages.slice(1, 11).map(img => `<g:additional_image_link>${escapeXml(img)}</g:additional_image_link>`).join('\n      ');
      
      // Pricing
      const salePrice = product.liveData?.sahimed_price || product.price || 0;
      const mrp = product.liveData?.mrp || product.mrp || salePrice;
      const priceStr = escapeXml(`${mrp} INR`);
      const salePriceStr = salePrice < mrp ? `<g:sale_price>${escapeXml(`${salePrice} INR`)}</g:sale_price>` : '';

      // Product Identifiers
      const brand = escapeXml(product.manufacturer || product.marketer_name || product.brand || 'SahiMed');
      const mpn = escapeXml(product.sku || product.hsnCode || id);
      const category = escapeXml(product.category || 'Medications');

      return `
    <item>
      <g:id>${id}</g:id>
      <g:title>${title}</g:title>
      <g:description>${description}</g:description>
      <g:link>${link}</g:link>
      <g:image_link>${imageLink}</g:image_link>${additionalImageLinks ? '\n      ' + additionalImageLinks : ''}
      <g:condition>new</g:condition>
      <g:availability>${(product.stock > 0 || product.inStock !== false) ? 'in stock' : 'out of stock'}</g:availability>
      <g:price>${priceStr}</g:price>
      ${salePriceStr}
      <g:brand>${brand}</g:brand>
      <g:mpn>${mpn}</g:mpn>
      <g:google_product_category>Health &amp; Beauty &gt; Health Care &gt; Medications &amp; Treatments</g:google_product_category>
      <g:product_type>${category}</g:product_type>
      <g:shipping>
        <g:country>IN</g:country>
        <g:service>Standard</g:service>
        <g:price>0 INR</g:price>
      </g:shipping>
    </item>`;
    }).join('')}
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
