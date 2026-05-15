
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAdmin } from '@/lib/auth-utils';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (product.isActive === false) {
      try {
        const admin = await verifyAdmin(request);
        if (!admin) {
          return NextResponse.json({ error: 'Product unavailable' }, { status: 403 });
        }
      } catch (authErr) {
        return NextResponse.json({ error: 'Product unavailable' }, { status: 403 });
      }
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

    // 1. Fetch current product to check old stock
    const currentProduct = await db.collection("products").findOne(query);
    const oldStock = Number(currentProduct?.availableQuantity || 0);
    const newStock = Number(updateData.availableQuantity || 0);

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

    // 2. TRIGGER NOTIFICATIONS: If stock went from 0 to >0
    if (oldStock === 0 && newStock > 0) {
      console.log(`[BackInStock] Product ${id} replenished. Triggering notifications...`);
      
      // Find pending requests for this product
      const requests = await db.collection('inventoryRequests').find({ 
        productId: id, 
        status: 'pending' 
      }).toArray();

      if (requests.length > 0) {
        // Send notifications (async background loop)
        const notifyUsers = async () => {
          for (const req of requests) {
            try {
              // Send FCM or just log for now
              console.log(`[BackInStock] Notifying user: ${req.userPhone || req.userId}`);
              
              // Mark as notified
              await db.collection('inventoryRequests').updateOne(
                { _id: req._id },
                { $set: { status: 'notified', notifiedAt: new Date() } }
              );
            } catch (notifyErr) {
              console.error(`[BackInStock] Failed to notify ${req._id}`, notifyErr);
            }
          }
        };
        // Fire and forget (don't block the API response)
        notifyUsers();
      }
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
