
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
    console.log(`[API Debug] Fetching product ID: ${id}`);
    const count = await collection.countDocuments();
    console.log(`[API Debug] Total products in collection: ${count}`);

    const product = await collection.findOne({ _id: id as any });
    console.log(`[API Debug] Result found: ${!!product}`);

    if (!product) {
      // Diagnostic check: find one product to see the ID format
      const sample = await collection.findOne({});
      console.log(`[API Debug] Sample product ID format: ${sample?._id} (type: ${typeof sample?._id})`);
      return NextResponse.json({ 
        error: 'Product not found', 
        idSearched: id,
        totalInDb: count,
        sampleId: sample?._id
      }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (e: any) {
    console.error(`[API Debug] Error: ${e.message}`);
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
    
    // Remove _id from body if it exists to avoid MongoDB error on update
    let { _id, ...updateData } = body;

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
      { $set: { ...updateData, updatedAt: new Date() } }
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
