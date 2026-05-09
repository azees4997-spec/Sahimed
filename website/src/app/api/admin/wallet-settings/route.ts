import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAuth } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db('sahimed');
    
    const settings = await db.collection('walletSettings').findOne({ id: 'global' });
    
    return NextResponse.json(settings || {
      maxPercentage: 20,
      maxFixedAmount: 500,
      allowGenericOnly: false,
      allowBrandedOnly: false,
      excludedCategories: ['Health Devices'],
      excludedProducts: [],
      excludedCustomers: [],
      minWalletBalance: 0,
      isCashbackEnabled: true,
      cashbackType: 'percentage',
      cashbackValue: 5,
      minOrderAmountForCashback: 0
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // TODO: Verify if user has admin permissions
    
    const body = await request.json();
    const { _id, ...updateData } = body;

    const client = await clientPromise;
    const db = client.db('sahimed');

    await db.collection('walletSettings').updateOne(
      { id: 'global' },
      { $set: { ...updateData, updatedAt: new Date() } },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
