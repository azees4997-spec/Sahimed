import { verifyAdmin } from '@/lib/auth-utils';

export async function GET(request: Request) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const client = await clientPromise;
    const db = client.db('sahimed');

    const profile = await db.collection('userProfiles').findOne({ uid: userId });
    return NextResponse.json({ balance: profile?.walletBalance || 0 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {

  try {
    const admin = await verifyAdmin(request);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { userId, amount, description } = await request.json();

    const client = await clientPromise;
    const db = client.db('sahimed');

    // Update balance
    await db.collection('userProfiles').updateOne(
      { uid: userId },
      { $inc: { walletBalance: amount } },
      { upsert: true }
    );

    // Record transaction
    await db.collection('walletTransactions').insertOne({
      userId,
      type: amount >= 0 ? 'credit' : 'debit',
      amount: Math.abs(amount),
      description: description || 'Admin Adjustment',
      timestamp: new Date(),
      adminId: admin.uid
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
