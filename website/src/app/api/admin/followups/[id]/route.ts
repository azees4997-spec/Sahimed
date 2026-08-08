import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAdmin } from '@/lib/auth-utils';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await verifyAdmin(request);
    const { id } = await params;
    const client = await clientPromise;
    const db = client.db('sahimed');
    const col = db.collection('patientFollowups');

    const body = await request.json();
    const updateData: any = { updatedAt: new Date().toISOString() };

    if (body.customerName) updateData.customerName = body.customerName;
    if (body.mobile) updateData.mobile = body.mobile;
    if (body.scheduledDate) updateData.scheduledDate = body.scheduledDate;
    if (body.status) updateData.status = body.status;
    if (body.enquiredItems) {
      updateData.enquiredItems = body.enquiredItems;
      updateData.estimatedOrderValue = body.enquiredItems.reduce((sum: number, item: any) => {
        const price = parseFloat(item.currentPrice || 0);
        const qty = parseInt(item.quantityEnquired || 1, 10);
        return sum + (price * qty);
      }, 0);
    }

    if (body.newCallNote) {
      updateData.lastCallNotes = body.newCallNote;
      updateData.$push = {
        callHistory: {
          timestamp: new Date().toISOString(),
          notes: body.newCallNote,
          status: body.status || 'Updated'
        }
      };
    }

    const res = await col.updateOne(
      { _id: new ObjectId(id) },
      body.newCallNote ? { $set: updateData, $push: updateData.$push } : { $set: updateData }
    );

    return NextResponse.json({ success: true, modifiedCount: res.modifiedCount });
  } catch (err: any) {
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
    const db = client.db('sahimed');
    const col = db.collection('patientFollowups');

    await col.deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
