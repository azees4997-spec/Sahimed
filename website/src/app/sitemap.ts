import { MetadataRoute } from 'next';
import clientPromise from '@/lib/mongodb';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://sahimed.com';

  const client = await clientPromise;
  const db = client.db('sahimed');
  const collection = db.collection('products');

  // Fetch all product IDs
  const products = await collection.find({}, { projection: { _id: 1, updatedAt: 1 } }).toArray();

  const productUrls = products.map((product) => ({
    url: `${baseUrl}/product/${product._id}`,
    lastModified: product.updatedAt || new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  const staticUrls = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/categories`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
  ];

  return [...staticUrls, ...productUrls];
}
