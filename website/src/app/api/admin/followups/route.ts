import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAdmin } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db('sahimed');
    const col = db.collection('patientFollowups');

    const { searchParams } = new URL(request.url);
    const filterStatus = searchParams.get('status');
    const dueTodayOnly = searchParams.get('dueToday') === 'true';
    const queryStr = searchParams.get('q');

    const filter: any = {};
    if (filterStatus && filterStatus !== 'all') {
      filter.status = filterStatus;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (dueTodayOnly) {
      filter.scheduledDate = { $lte: todayStr };
      filter.status = { $ne: 'Closed' };
    }

    if (queryStr) {
      filter.$or = [
        { customerName: { $regex: queryStr, $options: 'i' } },
        { mobile: { $regex: queryStr, $options: 'i' } },
        { 'enquiredItems.itemName': { $regex: queryStr, $options: 'i' } }
      ];
    }

    const followups = await col
      .find(filter)
      .sort({ scheduledDate: 1, createdAt: -1 })
      .toArray();

    const normalized = followups.map(doc => ({
      ...doc,
      id: doc._id.toString(),
      _id: doc._id.toString()
    }));

    return NextResponse.json(normalized);
  } catch (err: any) {
    console.error('[Followups API Error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await verifyAdmin(request);
    const client = await clientPromise;
    const db = client.db('sahimed');
    const col = db.collection('patientFollowups');

    const body = await request.json();
    if (!body.customerName || !body.mobile || !body.scheduledDate) {
      return NextResponse.json({ error: 'Customer name, mobile, and scheduled date are required' }, { status: 400 });
    }

    // Calculate total value
    const enquiredItems = Array.isArray(body.enquiredItems) ? body.enquiredItems : [];
    const estimatedValue = enquiredItems.reduce((sum: number, item: any) => {
      const price = parseFloat(item.currentPrice || 0);
      const qty = parseInt(item.quantityEnquired || 1, 10);
      return sum + (price * qty);
    }, 0);

    const doc = {
      customerName: body.customerName.trim(),
      mobile: body.mobile.trim(),
      scheduledDate: body.scheduledDate, // YYYY-MM-DD
      enquiredItems: enquiredItems.map((it: any) => ({
        itemName: it.itemName || 'Medicine',
        quantityEnquired: it.quantityEnquired || '1 Strip',
        currentPrice: parseFloat(it.currentPrice || 0),
        totalValue: (parseFloat(it.currentPrice || 0) * parseInt(it.quantityEnquired || 1, 10)) || 0
      })),
      estimatedOrderValue: estimatedValue,
      status: body.status || 'Pending Call',
      lastCallNotes: body.lastCallNotes || '',
      callHistory: body.lastCallNotes ? [{
        timestamp: new Date().toISOString(),
        notes: body.lastCallNotes,
        status: body.status || 'Pending Call'
      }] : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const res = await col.insertOne(doc);
    return NextResponse.json({ success: true, id: res.insertedId.toString() });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
