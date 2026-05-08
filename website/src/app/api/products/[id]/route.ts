
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAdmin } from '@/lib/auth-utils';
import { ObjectId } from 'mongodb';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const client = await clientPromise;
    const db = client.db('sahimed');
    const collection = db.collection('products');

    const query: any = {
      $or: [
        { _id: id as any },
      ]
    };
    if (id.length === 24) {
      try {
        query.$or.push({ _id: new ObjectId(id) });
      } catch (e) {}
    }

    const product = await collection.findOne(query);

    if (!product || product.isActive === false) {
      return NextResponse.json({ error: 'Product not found or unavailable' }, { status: 404 });
    }

    return NextResponse.json({ ...product, id: product._id.toString() });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAdmin(request);
    const { id } = await params;
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db("sahimed");
    
    // Remove _id and id from body if it exists to avoid MongoDB error on update
    let { _id, id: _bodyId, liveData, ...updateData } = body;

    // Build the query to handle both string and ObjectId
    const query: any = {
      $or: [
        { _id: id as any },
      ]
    };
    if (id.length === 24) {
      try {
        query.$or.push({ _id: new ObjectId(id) });
      } catch (e) { /* silent fail if not a valid ObjectId */ }
    }

    // INTELLIGENT MAPPING: Auto-link to molecule if missing
    if (!updateData.moleculeId && updateData.saltComposition) {
      const moleculesCol = db.collection('molecules');
      const allMolecules = await moleculesCol.find({}).toArray();
      const match = allMolecules.find(m => 
        updateData.saltComposition.toLowerCase().includes((m.molecule || m.name || "").toLowerCase()) ||
        (m.molecule || m.name || "").toLowerCase().includes(updateData.saltComposition.toLowerCase())
      );
      if (match) {
        updateData.moleculeId = match._id || match.id;
      }
    }

    const result = await db.collection("products").updateOne(
      query,
      { 
        $set: { ...updateData, updatedAt: new Date() },
        $unset: { liveData: "", id: "", imageUrl2: "", imageUrl3: "" }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (err: any) {
    console.error('[API PUT Error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAdmin(request);
    const { id } = await params;
    const client = await clientPromise;
    const db = client.db("sahimed");

    const query: any = {
      $or: [
        { _id: id as any },
      ]
    };
    if (id.length === 24) {
      try {
        query.$or.push({ _id: new ObjectId(id) });
      } catch (e) { /* silent fail */ }
    }

    const result = await db.collection("products").deleteOne(query);

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[API DELETE Error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
