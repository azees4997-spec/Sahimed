import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

/**
 * Google Merchant Center XML Feed Generator
 * Generates a real-time product feed for Google Shopping.
 */
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('sahimed');
    
    // Fetch all active products
    const products = await db.collection('products').find({}).toArray();
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://sahimed.com';
    
    // Build XML string
    let xml = `<?xml version="1.0"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
<channel>
  <title>Sahimed Product Feed</title>
  <link>${baseUrl}</link>
  <description>Genuine medicines at honest prices - Sahimed Pharmacy</description>`;

    products.forEach((product: any) => {
      const pPrice = product.liveData?.sahimed_price || product.price || 0;
      const pMrp = product.liveData?.mrp || product.mrp || pPrice;
      const stockStatus = (product.stock > 0 || product.inStock !== false) ? 'in_stock' : 'out_of_stock';
      const cleanId = product._id?.toString() || product.id;
      
      const safeImageUrl = (product.imageUrl && typeof product.imageUrl === 'string' && product.imageUrl.startsWith('http'))
        ? product.imageUrl
        : `${baseUrl}/placeholder-medicine.png`;

      xml += `
  <item>
    <g:id>${cleanId}</g:id>
    <g:title>${escapeXml(product.name)}</g:title>
    <g:description>${escapeXml(product.description || `Buy ${product.name} online at Sahimed. Genuine quality and fastest delivery.`)}</g:description>
    <g:link>${baseUrl}/product/${cleanId}</g:link>
    <g:image_link>${safeImageUrl}</g:image_link>
    <g:condition>new</g:condition>
    <g:availability>${stockStatus}</g:availability>
    <g:price>${pPrice} INR</g:price>
    <g:brand>${escapeXml(product.brand || 'Sahimed')}</g:brand>
    <g:google_product_category>Health &amp; Beauty &gt; Health Care &gt; Medications &amp; Treatments</g:google_product_category>
  </item>`;
    });

    xml += `
</channel>
</rss>`;

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 's-maxage=3600, stale-while-revalidate',
      },
    });
  } catch (err: any) {
    console.error("[Google Feed Error]", err);
    return NextResponse.json({ error: "Failed to generate feed" }, { status: 500 });
  }
}

function escapeXml(unsafe: string) {
  if (!unsafe) return "";
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
    return c;
  });
}
