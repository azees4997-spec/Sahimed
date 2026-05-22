import { NextResponse } from 'next/server';
import { ShipwayService } from '@/lib/logistics/shipway';
import { verifyAdmin, verifyAuth } from '@/lib/auth-utils';
import clientPromise from '@/lib/mongodb';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const awb = searchParams.get('awb');
    const orderId = searchParams.get('orderId');

    if (!awb) {
      return NextResponse.json({ error: 'Missing awb parameter' }, { status: 400 });
    }

    // 1. Identification
    let user;
    let isAdmin = false;
    try {
      user = await verifyAdmin(request);
      isAdmin = true;
    } catch (err) {
      user = await verifyAuth(request);
    }

    // 2. Security Check (If not admin, verify order ownership)
    if (!isAdmin) {
      const client = await clientPromise;
      const db = client.db('sahimed');
      
      // Find order by ID or AWB to check ownership
      const order = await db.collection('orders').findOne({
        $or: [
          { orderId: orderId },
          { _id: orderId as any },
          { 'shipping.awb': awb }
        ]
      });

      if (order) {
        const isOwner = order.userId === user.uid || order.customer_id === user.uid;
        // Also check by phone for safety
        const userPhone = user.phoneNumber?.replace(/\D/g, '').slice(-10);
        const orderPhone = String(order.phoneNumber || order.phone || '').replace(/\D/g, '').slice(-10);
        
        if (!isOwner && (!userPhone || userPhone !== orderPhone)) {
          return NextResponse.json({ error: 'Forbidden: Access to this order tracking is restricted' }, { status: 403 });
        }
      }
    }

    const trackingResult = await ShipwayService.trackShipment(awb, orderId || undefined);

    if (!trackingResult.success) {
      return NextResponse.json({ error: trackingResult.error }, { status: 500 });
    }

    return NextResponse.json(trackingResult.data);
  } catch (error: any) {
    console.error('[API] Tracking fetch failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
