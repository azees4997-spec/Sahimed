import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAdmin } from '@/lib/auth-utils';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
    
    // Remove _id and id if present
    const { _id, id, ...updateData } = body;

    await db.collection('Category Master').updateOne(
      getQuery(params.id), 
      { 
        $set: { 
          category_id: updateData.category_id,
          category: updateData.category,
          sub_category: updateData.sub_category,
          product_count: updateData.product_count,
          source_catalog: updateData.source_catalog,
          imageUrl: updateData.imageUrl || '',
          showOnHomepage: updateData.showOnHomepage === true,
          updatedAt: new Date() 
        } 
      }
    );
    
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
    await db.collection('Category Master').deleteOne(getQuery(params.id));
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
