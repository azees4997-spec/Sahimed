import { NextResponse } from 'next/server';
import { ShipwayService } from '@/lib/logistics/shipway';
import { verifyAdmin } from '@/lib/auth-utils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const awb = searchParams.get('awb');
    const orderId = searchParams.get('orderId');

    if (!awb) {
      return NextResponse.json({ error: 'Missing awb parameter' }, { status: 400 });
    }

    // Verify token to ensure security using robust auth-utils
    await verifyAdmin(request);

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
