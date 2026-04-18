import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAuth } from '@/lib/auth-utils';

export async function GET(req: Request) {
  try {
    const user = await verifyAuth(req);
    const client = await clientPromise;
    const db = client.db('sahimed');
    
    const prescriptions = await db.collection('prescriptions')
      .find({ userId: user.uid })
      .sort({ uploadDate: -1 })
      .toArray();
      
    return NextResponse.json(prescriptions.map(p => ({ ...p, id: p._id.toString() })));
  } catch (err: any) {
    const status = err.message?.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}

export async function POST(req: Request) {
  try {
    const user = await verifyAuth(req);
    const body = await req.json();
    
    const client = await clientPromise;
    const db = client.db('sahimed');
    
    const prescriptionRecord = {
      userId: user.uid,
      phoneNumber: body.phoneNumber || user.phoneNumber || '',
      patientName: body.patientName || 'Self',
      notes: body.notes || '',
      imageUrls: body.imageUrls || [],
      imageUrl: body.imageUrls?.[0] || '', // Primary image
      status: 'Pending Review',
      platform: body.platform || 'web',
      uploadDate: new Date(),
      createdAt: new Date()
    };

    const result = await db.collection('prescriptions').insertOne(prescriptionRecord);
    
    return NextResponse.json({ success: true, id: result.insertedId });
  } catch (err: any) {
    const status = err.message?.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
