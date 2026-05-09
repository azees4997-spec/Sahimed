
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { verifyAdmin } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

/**
 * GET: Fetch users from MongoDB for administrative management.
 * Supports search by name, email, or phone.
 */
export async function GET(req: Request) {
  try {
    await verifyAdmin(req);
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '100');

    const client = await clientPromise;
    const db = client.db('sahimed');
    const collection = db.collection('users');

    let filter: any = {};
    if (query) {
      filter = {
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } },
          { phone: { $regex: query, $options: 'i' } },
          { phoneNumber: { $regex: query, $options: 'i' } },
          { uid: query }
        ]
      };
    }

    const users = await collection
      .find(filter)
      .sort({ updatedAt: -1 })
      .limit(limit)
      .toArray();

    return NextResponse.json(users);
  } catch (err: any) {
    const errorMessage = err.message || "Unknown administrative error";
    const status = errorMessage.includes('Unauthorized') ? 401 : 
                   errorMessage.includes('Forbidden') ? 403 : 500;
    
    return NextResponse.json({ error: errorMessage }, { status });
  }
}
