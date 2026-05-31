import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { revalidatePath } from 'next/cache';
import { ObjectId } from 'mongodb';
import { getDbAdmin } from '@/lib/firebase-admin';
import { CATEGORIES } from '@/lib/data';

export const dynamic = 'force-dynamic';

// GET all categories
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let limitValue = parseInt(searchParams.get('limit') || '50');
  if (isNaN(limitValue) || limitValue < 1) limitValue = 50;
  if (limitValue > 100) limitValue = 100;

  try {
    const client = await clientPromise;
    const db = client.db('sahimed');
    
    const categories = await db.collection('categories')
      .find({})
      .sort({ name: 1 })
      .limit(limitValue)
      .toArray();

    return NextResponse.json(categories.map(c => ({ ...c, id: c._id.toString() })));
  } catch (err: any) {
    console.error("[Categories API Error] MongoDB failed, falling back to static CATEGORIES", err);
    const fallbackCategories = CATEGORIES.map((cat, idx) => ({
      _id: `fallback-cat-${idx}`,
      id: `fallback-cat-${idx}`,
      name: cat.name,
      imageUrl: cat.imageUrl,
      description: cat.description,
      isFallback: true
    }));
    return NextResponse.json(fallbackCategories);
  }
}

// POST new category
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db('sahimed');
    const result = await db.collection('categories').insertOne({
      ...body,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Invalidate caches
    revalidatePath('/');
    revalidatePath('/categories');
    
    return NextResponse.json({ success: true, id: result.insertedId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
