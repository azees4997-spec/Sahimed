import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache for 1 hour

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
    <title>Sahimed Product Feed</title>
    <link>${baseUrl}</link>
    <description>Quality medicines delivered across India</description>
    ${products.map(product => {
      // Basic data cleaning
      const id = product._id.toString();
      const title = (product.name || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const description = (product.description || `Buy ${product.name} at best prices on Sahimed. Quality medicines and healthcare products.`).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const link = `${baseUrl}/product/${id}`;
      const imageLink = product.images && product.images.length > 0 ? product.images[0] : (product.image || `${baseUrl}/placeholder-medicine.png`);
      const price = `${product.price || 0} INR`;
      const brand = (product.marketer_name || product.manufacturer || 'Sahimed').replace(/&/g, '&amp;');
      const category = product.category || 'Medications';

      return `
    <item>
      <g:id>${id}</g:id>
      <g:title>${title}</g:title>
      <g:description>${description}</g:description>
      <g:link>${link}</g:link>
      <g:image_link>${imageLink}</g:image_link>
      <g:condition>new</g:condition>
      <g:availability>in stock</g:availability>
      <g:price>${price}</g:price>
      <g:brand>${brand}</g:brand>
      <g:google_product_category>Health &amp; Beauty &gt; Health Care &gt; Medications &amp; Treatments</g:google_product_category>
      <g:product_type>${category}</g:product_type>
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
