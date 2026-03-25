
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limitValue = parseInt(searchParams.get('limit') || '10');
  const category = searchParams.get('category');
  const q = searchParams.get('q');

  try {
    const client = await clientPromise;
    const db = client.db('sahimed');
    const collection = db.collection('products');

    const moleculeId = searchParams.get('moleculeId');
    const isGeneric = searchParams.get('isGeneric');

    const query: any = {};
    if (category) {
      query.category = category;
    }
    if (moleculeId) {
      query.moleculeId = moleculeId;
    }
    if (isGeneric !== null) {
      query.isGeneric = isGeneric === 'true';
    }
    if (q) {
      // Build a fuzzy regex to ignore hyphens/spaces (e.g. "dflax" matches "d-flaxane")
      const cleanQ = q.replace(/[^a-zA-Z0-9]/g, '');
      if (cleanQ) {
        const fuzzyRegex = cleanQ.split('').join('[- ]*');
        query.$or = [
          { name: { $regex: fuzzyRegex, $options: 'i' } },
          { saltComposition: { $regex: fuzzyRegex, $options: 'i' } }
        ];
      } else {
        query.$or = [
          { name: { $regex: q, $options: 'i' } },
          { saltComposition: { $regex: q, $options: 'i' } }
        ];
      }
    }

    const products = await collection
      .find(query)
      .limit(limitValue)
      .toArray();

    return NextResponse.json(products);
  } catch (err: any) {
    console.error("[Search API Error]", err);
    const message = err.message || "Unknown database error";
    const status = message.includes("timeout") ? 504 : 500;
    return NextResponse.json({ 
      error: message,
      details: "Ensure MONGODB_URI is correct and Render IPs are whitelisted in MongoDB Atlas.",
      timestamp: new Date().toISOString()
    }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db("sahimed");

    // Ensure the document has an _id that matches Firestore's ID if provided
    const docId = body.id || body._id;
    const productData = { 
      ...body, 
      _id: docId as any,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Remove 'id' if we use _id
    delete (productData as any).id;

    const result = await db.collection("products").insertOne(productData);
    
    return NextResponse.json({ success: true, insertedId: result.insertedId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
