import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('sahimed');
    const totalCount = await db.collection('Product Master').countDocuments({});
    
    const PRODUCTS_PER_SITEMAP = 10000;
    const totalSitemaps = Math.ceil(totalCount / PRODUCTS_PER_SITEMAP);

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Static pages sitemap
    xml += `  <sitemap>\n`;
    xml += `    <loc>https://sahimed.com/sitemap/pages.xml</loc>\n`;
    xml += `    <lastmod>${new Date().toISOString()}</lastmod>\n`;
    xml += `  </sitemap>\n`;

    // Categories sitemap
    xml += `  <sitemap>\n`;
    xml += `    <loc>https://sahimed.com/sitemap/categories.xml</loc>\n`;
    xml += `    <lastmod>${new Date().toISOString()}</lastmod>\n`;
    xml += `  </sitemap>\n`;

    // Paginated product sitemaps
    for (let i = 1; i <= Math.min(totalSitemaps, 50); i++) {
      xml += `  <sitemap>\n`;
      xml += `    <loc>https://sahimed.com/sitemap/products-${i}.xml</loc>\n`;
      xml += `    <lastmod>${new Date().toISOString()}</lastmod>\n`;
      xml += `  </sitemap>\n`;
    }

    xml += `</sitemapindex>`;

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    });
  } catch (err: any) {
    return new NextResponse(`<error>${err.message}</error>`, { status: 500 });
  }
}
