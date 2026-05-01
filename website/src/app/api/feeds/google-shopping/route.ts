import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('sahimed');
    const productsCollection = db.collection('products');
    
    // Fetch all active products
    const products = await productsCollection.find({ 
      $or: [
        { is_active: true },
        { active: true },
        { active: { $exists: false } }
      ]
    }).toArray();

    const baseUrl = 'https://sahimed.com';

    let xml = `<?xml version="1.0"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>SahiMed - Online Pharmacy Feed</title>
    <link>${baseUrl}</link>
    <description>Authentic medicines and healthcare products at honest prices.</description>
    `;

    for (const product of products) {
      const id = product._id.toString();
      const title = (product.name || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const description = (product.description || product.treatment || `Buy ${product.name} online at SahiMed. Genuine quality, fast delivery.`).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const link = `${baseUrl}/product/${id}`;
      const imageLink = product.imageUrl || product.imageUrls?.[0] || `${baseUrl}/icon.png`;
      const price = product.liveData?.mrp || product.mrp || product.price || 0;
      const salePrice = product.liveData?.sahimed_price || product.price || 0;
      const availability = ((product.stock ?? 0) > 0 || product.inStock !== false) ? 'in stock' : 'out of stock';
      const brand = (product.manufacturer || product.brand || 'SahiMed').replace(/&/g, '&amp;');

      xml += `
    <item>
      <g:id>${id}</g:id>
      <g:title>${title}</g:title>
      <g:description>${description}</g:description>
      <g:link>${link}</g:link>
      <g:image_link>${imageLink}</g:image_link>
      <g:condition>new</g:condition>
      <g:availability>${availability}</g:availability>
      <g:price>${price.toFixed(2)} INR</g:price>
      ${salePrice < price ? `<g:sale_price>${salePrice.toFixed(2)} INR</g:sale_price>` : ''}
      <g:brand>${brand}</g:brand>
      <g:google_product_category>Health &amp; Beauty &gt; Health Care &gt; Medications &amp; Treatments</g:google_product_category>
      <g:shipping>
        <g:country>IN</g:country>
        <g:service>Standard</g:service>
        <g:price>0.00 INR</g:price>
      </g:shipping>
    </item>`;
    }

    xml += `
  </channel>
</rss>`;

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 's-maxage=3600, stale-while-revalidate',
      },
    });
  } catch (error: any) {
    console.error('[Google Shopping Feed Error]:', error);
    return NextResponse.json({ error: 'Failed to generate feed' }, { status: 500 });
  }
}
