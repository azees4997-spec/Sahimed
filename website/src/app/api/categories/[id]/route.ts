
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAdmin } from '@/lib/auth-utils';
import { ObjectId } from 'mongodb';
import { revalidatePath } from 'next/cache';

const getQuery = (id: string) => {
  if (/^[0-9a-fA-F]{24}$/.test(id)) {
    return { _id: new ObjectId(id) };
  }
  return { _id: id as any };
};

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    await verifyAdmin(request);
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db('sahimed');
    await db.collection('categories').updateOne(getQuery(params.id), { $set: { ...body, updatedAt: new Date() } });
    
    // Invalidate caches
    revalidatePath('/');
    revalidatePath('/categories');
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await verifyAdmin(request);
    const client = await clientPromise;
    const db = client.db('sahimed');
    await db.collection('categories').deleteOne(getQuery(params.id));
    
    // Invalidate caches
    revalidatePath('/');
    revalidatePath('/categories');
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
