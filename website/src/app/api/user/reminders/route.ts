import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAuth } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const client = await clientPromise;
    const db = client.db('sahimed');
    
    const reminders = await db.collection('medicationReminders')
      .find({ userId: user.uid })
      .toArray();

    return NextResponse.json(reminders);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { reminders } = await request.json(); // Array of reminder objects

    const client = await clientPromise;
    const db = client.db('sahimed');

    // Replace all reminders for this user with the new list (sync)
    await db.collection('medicationReminders').deleteMany({ userId: user.uid });
    
    if (reminders && reminders.length > 0) {
      const docs = reminders.map((r: any) => ({
        ...r,
        userId: user.uid,
        lastSynced: new Date()
      }));
      await db.collection('medicationReminders').insertMany(docs);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
