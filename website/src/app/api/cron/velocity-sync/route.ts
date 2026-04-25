import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { VelocityService } from '@/lib/logistics/velocity';

// This endpoint can be hit by a cron scheduler (like Vercel Cron) every hour
export async function GET(req: Request) {
  try {
    // Optional: Add a security token check here if requested
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db('sahimed');
    
    // Fetch all active orders that are shipped via Velocity
    const activeOrders = await db.collection('orders').find({
      status: { $in: ['Shipped', 'Packed', 'Returned'] },
      $or: [
        { 'shipping.partner': 'Velocity', 'shipping.awb': { $exists: true } },
        { 'returnShipping.partner': 'Velocity', 'returnShipping.awb': { $exists: true } }
      ]
    }).toArray();

    if (activeOrders.length === 0) {
      return NextResponse.json({ success: true, message: 'No active velocity shipments found.' });
    }

    const awbMap = new Map();
    const allAwbs: string[] = [];

    activeOrders.forEach(order => {
      if (order.shipping?.awb) {
        awbMap.set(order.shipping.awb, { id: order._id, type: 'forward' });
        allAwbs.push(order.shipping.awb);
      }
      if (order.returnShipping?.awb) {
        awbMap.set(order.returnShipping.awb, { id: order._id, type: 'reverse' });
        allAwbs.push(order.returnShipping.awb);
      }
    });

    // Chunk AWBs if Velocity has a limit, assuming 50 per request
    const CHUNK_SIZE = 50;
    let updatedCount = 0;

    for (let i = 0; i < allAwbs.length; i += CHUNK_SIZE) {
      const chunk = allAwbs.slice(i, i + CHUNK_SIZE);
      const trackingRes = await VelocityService.trackOrders(chunk);

      if (trackingRes.success && trackingRes.data) {
        // Assuming trackingRes.data is an array of tracking objects or a map
        // Depending on velocity's response structure, we will save it
        // e.g. [{ awb: '...', status: '...', checkpoints: [] }]
        
        const trackingList = Array.isArray(trackingRes.data) ? trackingRes.data : trackingRes.data.results || [];
        
        for (const trackInfo of trackingList) {
          const awb = trackInfo.awb || trackInfo.awb_number;
          const mapInfo = awbMap.get(awb);
          if (mapInfo && awb) {
            const updateField = mapInfo.type === 'forward' ? 'shipping.trackingData' : 'returnShipping.trackingData';
            
            // Auto update order status if delivered
            const isDelivered = trackInfo.status?.toLowerCase() === 'delivered';
            const statusUpdate = isDelivered ? { status: 'Delivered' } : {};
            
            await db.collection('orders').updateOne(
              { _id: mapInfo.id },
              { 
                $set: { 
                  [updateField]: trackInfo,
                  ...statusUpdate,
                  updatedAt: new Date()
                } 
              }
            );

            // Sync to Firebase if userId exists
            const order = activeOrders.find(o => o._id.toString() === mapInfo.id.toString());
            if (order && order.userId && order.orderId) {
              try {
                const { getDbAdmin } = await import('@/lib/firebase-admin');
                const dbAdmin = getDbAdmin();
                const updateObj: any = {
                  [updateField]: trackInfo,
                  updatedAt: new Date()
                };
                if (isDelivered) updateObj.status = 'Delivered';
                await dbAdmin.doc(`userProfiles/${order.userId}/orders/${order.orderId}`).set(updateObj, { merge: true });
              } catch (fsErr: any) {
                console.error(`Failed to sync tracking to Firebase for ${order.orderId}:`, fsErr.message);
              }
            }
            
            updatedCount++;
          }
        }
      }
    }

    return NextResponse.json({ success: true, updatedCount });
  } catch (error: any) {
    console.error('[Velocity Sync Error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
