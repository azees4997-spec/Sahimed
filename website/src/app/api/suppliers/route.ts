import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAdmin } from '@/lib/auth-utils';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const qRaw = searchParams.get('q');
  let limitValue = parseInt(searchParams.get('limit') || '100');
  if (isNaN(limitValue) || limitValue < 1) limitValue = 100;

  try {
    const client = await clientPromise;
    const db = client.db('sahimed');
    
    const query: any = {};
    if (qRaw) {
      query.$or = [
        { supplier_name: { $regex: escapeRegExp(qRaw), $options: 'i' } },
        { supplier_code: { $regex: escapeRegExp(qRaw), $options: 'i' } },
        { 'compliance_details.gstin': { $regex: escapeRegExp(qRaw), $options: 'i' } }
      ];
    }

    const suppliers = await db.collection('Supplier Master')
      .find(query)
      .sort({ supplier_name: 1 })
      .limit(limitValue)
      .toArray();

    return NextResponse.json(suppliers.map(s => ({
      ...s,
      id: s._id?.toString()
    })));
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await verifyAdmin(request);
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db('sahimed');

    const result = await db.collection('Supplier Master').insertOne({
      supplier_code: body.supplier_code,
      supplier_name: body.supplier_name,
      compliance_details: {
        gstin: body.compliance_details?.gstin || '',
        drug_license_number: body.compliance_details?.drug_license_number || ''
      },
      financials: {
        credit_days: Number(body.financials?.credit_days || 0),
        is_active: body.financials?.is_active ?? true
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return NextResponse.json({ success: true, id: result.insertedId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
