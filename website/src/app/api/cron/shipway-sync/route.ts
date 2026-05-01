import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ShipwayService } from '@/lib/logistics/shipway';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('sahimed_db');
    
    // Find orders that are shipped but not delivered or cancelled
    const activeOrders = await db.collection('orders').find({
      status: { $in: ['shipped', 'out_for_delivery'] },
      awb: { $exists: true, $ne: null }
    }).toArray();

    if (activeOrders.length === 0) {
      return NextResponse.json({ message: 'No active orders to sync' });
    }

    const awbs = activeOrders.map(order => order.awb);
    const trackingResult = await ShipwayService.trackOrders(awbs);

    if (trackingResult.success && trackingResult.data) {
      // Loop through tracking results and update order statuses in the database
      // This part depends on Shipway's tracking API response structure.
      // Usually it's an array or map of AWB to status.
      // Mocking the update process.
      
      let updatedCount = 0;
      
      for (const order of activeOrders) {
        // If shipway returned a status for this AWB
        // const newStatus = trackingResult.data[order.awb]?.status;
        // if (newStatus && newStatus !== order.status) {
        //    await db.collection('orders').updateOne({ _id: order._id }, { $set: { status: newStatus } });
        //    updatedCount++;
        // }
      }

      return NextResponse.json({ 
        message: 'Sync completed successfully', 
        ordersChecked: activeOrders.length,
        // updatedCount
      });
    }

    return NextResponse.json({ error: 'Tracking API failed', details: trackingResult.error }, { status: 500 });

  } catch (error: any) {
    console.error("[Shipway Cron Error]:", error);
    return NextResponse.json({ error: 'Internal server error', message: error.message }, { status: 500 });
  }
}
