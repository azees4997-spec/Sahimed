import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAuth } from '@/lib/auth-utils';
import { ObjectId } from 'mongodb';

export async function GET(req: Request) {
  try {
    const user = await verifyAuth(req);
    const client = await clientPromise;
    const db = client.db('sahimed');
    
    const addresses = await db.collection('addresses')
      .find({ userId: user.uid })
      .sort({ timestamp: -1 })
      .toArray();
      
    return NextResponse.json(addresses.map(a => ({ ...a, id: a._id.toString() })));
  } catch (err: any) {
    const status = err.message?.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}

export async function POST(req: Request) {
  try {
    const user = await verifyAuth(req);
    const body = await req.json();
    const { id, ...data } = body;
    
    const client = await clientPromise;
    const db = client.db('sahimed');
    
    const addressData = {
      ...data,
      userId: user.uid,
      updatedAt: new Date(),
      timestamp: data.timestamp || new Date()
    };

    if (id) {
      // Update existing
      let filter: any = { userId: user.uid };
      try {
        filter._id = id.length === 24 ? new ObjectId(id) : id;
      } catch (e) {
        filter._id = id;
      }

      await db.collection('addresses').updateOne(
        filter,
        { $set: addressData }
      );
      return NextResponse.json({ success: true, id });
    } else {
      // Create new
      const result = await db.collection('addresses').insertOne(addressData);
      return NextResponse.json({ success: true, id: result.insertedId });
    }
  } catch (err: any) {
    const status = err.message?.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await verifyAuth(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const client = await clientPromise;
    const db = client.db('sahimed');
    
    let filter: any = { userId: user.uid };
    try {
      filter._id = id.length === 24 ? new ObjectId(id) : id;
    } catch (e) {
      filter._id = id;
    }

    await db.collection('addresses').deleteOne(filter);
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    const status = err.message?.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
