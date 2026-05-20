import { MetadataRoute } from 'next';
import clientPromise from '@/lib/mongodb';
import { getFirestore, collection as fireCollection, getDocs } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';

// Initialize Firebase for sitemap generation
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const firestore = getFirestore(app);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://sahimed.com';

  // 1. Fetch products from MongoDB
  let productUrls: MetadataRoute.Sitemap = [];
  try {
    const client = await clientPromise;
    const db = client.db('sahimed');
    const productsCollection = db.collection('products');
    const products = await productsCollection.find({}, { projection: { _id: 1, updatedAt: 1 } }).limit(1000).toArray();

    productUrls = products.map((product) => ({
      url: `${baseUrl}/product/${product._id}`,
      lastModified: product.updatedAt || new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch (error) {
    console.error('Error fetching products for sitemap:', error);
  }

  // 2. Fetch SEO Articles from MongoDB
  let articleUrls: MetadataRoute.Sitemap = [];
  try {
    const client = await clientPromise;
    const db = client.db('sahimed');
    const articles = await db.collection('seo_content').find({}, { projection: { slug: 1, updatedAt: 1 } }).toArray();

    articleUrls = articles.map((article) => ({
      url: `${baseUrl}/article/${article.slug}`,
      lastModified: article.updatedAt || new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch (error) {
    console.error('Error fetching articles for sitemap:', error);
  }

  // 3. Fetch dynamic pages from Firestore
  let pageUrls: MetadataRoute.Sitemap = [];
  try {
    const pagesSnap = await getDocs(fireCollection(firestore, 'pages'));
    pageUrls = pagesSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        url: `${baseUrl}/p/${doc.id}`,
        lastModified: data.updatedAt?.toDate() || data.lastUpdated || new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.5,
      };
    });
  } catch (error) {
    console.error('Error fetching pages for sitemap:', error);
  }

  // 4. Static routes
  const staticUrls = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/categories`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/prescription`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
  ];

  return [...staticUrls, ...pageUrls, ...productUrls, ...articleUrls];
}
