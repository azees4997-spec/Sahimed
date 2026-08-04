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
    
    const { _id, id, ...updateData } = body;

    await db.collection('Supplier Master').updateOne(
      getQuery(params.id), 
      { 
        $set: { 
          supplier_code: updateData.supplier_code,
          supplier_name: updateData.supplier_name,
          compliance_details: {
            gstin: updateData.compliance_details?.gstin || '',
            drug_license_number: updateData.compliance_details?.drug_license_number || ''
          },
          financials: {
            credit_days: Number(updateData.financials?.credit_days || 0),
            is_active: updateData.financials?.is_active ?? true
          },
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
    
    await db.collection('Supplier Master').deleteOne(getQuery(params.id));
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
