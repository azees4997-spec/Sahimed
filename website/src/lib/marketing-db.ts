import clientPromise from './mongodb';
import { ObjectId } from 'mongodb';

export interface SEOContent {
  _id?: ObjectId;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  keywords: string[];
  trendTopic: string;
  category: string;
  status: 'draft' | 'published';
  views: number;
  featuredProducts: string[];
  createdAt: Date;
  updatedAt: Date;
}

export async function saveSEOContent(content: Omit<SEOContent, '_id' | 'createdAt' | 'updatedAt' | 'views'>) {
  const client = await clientPromise;
  const db = client.db('sahimed');
  const collection = db.collection('seo_content');

  const now = new Date();
  const result = await collection.insertOne({
    ...content,
    views: 0,
    createdAt: now,
    updatedAt: now,
  });

  return result;
}

export async function getSEOContent(limit = 10, skip = 0) {
  const client = await clientPromise;
  const db = client.db('sahimed');
  const collection = db.collection('seo_content');

  return collection.find({}).sort({ createdAt: -1 }).limit(limit).skip(skip).toArray();
}

export async function deleteSEOContent(id: string) {
  const client = await clientPromise;
  const db = client.db('sahimed');
  const collection = db.collection('seo_content');

  return collection.deleteOne({ _id: new ObjectId(id) });
}
