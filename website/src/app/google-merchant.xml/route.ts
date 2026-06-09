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
    .replace(/[^\x09\x0A\x0D\x20-\xFF\x85\xA0-\uD7FF\uE000-\uFDCF\uFDE0-\uFFFD]/g, '');
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('sahimed');
    const baseUrl = 'https://sahimed.com';

    // Fetch all active products for the merchant feed
    const products = await db.collection('products')
      .find({ isActive: { $ne: false } })
      .toArray();

    const itemsXml = products.map(product => {
      const id = product._id?.toString();
      if (!id || !product.name) return '';

      const title = product.name;
      const link = `${baseUrl}/product/${id}`;
      const description = product.description || `Order ${product.name} online at SahiMed. Genuine quality, transparent pricing, and fast door delivery across India.`;
      
      // Resolve image link
      let rawImage = product.imageUrl || product.image;
      if (product.imageUrls && product.imageUrls.length > 0) {
        rawImage = product.imageUrls[0];
      }
      let imageLink = 'https://sahimed.com/icon.png';
      if (rawImage) {
        imageLink = rawImage.startsWith('http') ? rawImage : `${baseUrl}${rawImage.startsWith('/') ? '' : '/'}${rawImage}`;
      }

      const price = product.liveData?.sahimed_price || product.price || 0;
      const inStock = (product.stock ?? 0) > 0 || product.inStock !== false;
      const availability = inStock ? 'in stock' : 'out of stock';
      
      const brand = product.manufacturer || product.brand || 'SahiMed';
      const mpn = product.sku || product.hsnCode || id;

      return `
    <item>
      <g:id>${escapeXml(id)}</g:id>
      <g:title>${escapeXml(title)}</g:title>
      <g:description>${escapeXml(description)}</g:description>
      <g:link>${escapeXml(link)}</g:link>
      <g:image_link>${escapeXml(imageLink)}</g:image_link>
      <g:condition>new</g:condition>
      <g:availability>${availability}</g:availability>
      <g:price>${price} INR</g:price>
      <g:brand>${escapeXml(brand)}</g:brand>
      <g:mpn>${escapeXml(mpn)}</g:mpn>
      <g:identifier_exists>no</g:identifier_exists>
    </item>`;
    }).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>SahiMed Google Merchant Feed</title>
    <link>${baseUrl}</link>
    <description>SahiMed Product Feed for Google Merchant Center</description>
    ${itemsXml}
  </channel>
</rss>`;

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800',
      },
    });
  } catch (error: any) {
    console.error('[Google Merchant Feed Generation Error]', error);
    return new NextResponse('Error generating merchant feed', { status: 500 });
  }
}
