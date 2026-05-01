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

    // Shipment Status to System Status mapping
    const STATUS_MAP: Record<string, string> = {
      'DEL': 'Delivered',
      'INT': 'Shipped',
      'UND': 'Undelivered',
      'RTO': 'RTO',
      'RTD': 'RTO Delivered',
      'CAN': 'Cancelled',
      'SCH': 'Confirmed',
      'ONH': 'On Hold',
      'OOD': 'out_for_delivery'
    };

    let updatedCount = 0;
    const errors: string[] = [];

    for (const order of activeOrders) {
      if (!order.shipping?.awb) continue;

      const trackingResult = await ShipwayService.getOrders({
        awb_number: order.shipping.awb
      });

      if (trackingResult.success && trackingResult.data) {
        // Assume data contains an array of orders or a result object with orders
        // Shipway response for getorders typically returns an array or object containing shipment details
        const shipwayOrders = trackingResult.data.result || trackingResult.data.orders || trackingResult.data;
        const targetOrder = Array.isArray(shipwayOrders) ? shipwayOrders[0] : shipwayOrders;

        if (targetOrder && targetOrder.shipment_status) {
          const newStatus = STATUS_MAP[targetOrder.shipment_status] || targetOrder.shipment_status;
          
          if (newStatus && newStatus !== order.status && STATUS_MAP[targetOrder.shipment_status]) {
             await db.collection('orders').updateOne(
               { _id: order._id }, 
               { $set: { status: newStatus } }
             );
             updatedCount++;
          }
        }
      } else {
        errors.push(`Failed for AWB ${order.shipping.awb}: ${trackingResult.error}`);
      }
    }

    return NextResponse.json({ 
      message: 'Sync completed', 
      ordersChecked: activeOrders.length,
      updatedCount,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error: any) {
    console.error("[Shipway Cron Error]:", error);
    return NextResponse.json({ error: 'Internal server error', message: error.message }, { status: 500 });
  }
}
