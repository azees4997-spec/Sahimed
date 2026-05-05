import { NextRequest, NextResponse } from 'next/server';
import { ShipwayService } from '@/lib/logistics/shipway';

export async function POST(req: NextRequest) {
  try {
    const { toPincode } = await req.json();

    if (!toPincode) {
      return NextResponse.json(
        { error: 'Destination pincode is required' },
        { status: 400 }
      );
    }

    // Defaulting origin to the Bengaluru warehouse pincode.
    const fromPincode = process.env.WAREHOUSE_PINCODE || '560068'; 
    // BUG-15 FIX: Only log in development to avoid noisy production logs
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Shipway] Checking serviceability from ${fromPincode} to ${toPincode}`);
    }


    const result = await ShipwayService.checkServiceability(fromPincode, toPincode);

    if (result.success) {
      return NextResponse.json({
        serviceable: result.serviceable,
        carriers: result.carriers,
        edd: result.edd,
        debug: result.debug
      });

    } else {
      return NextResponse.json(
        { 
          error: 'Failed to check serviceability', 
          details: result.error,
          debug: result.debug 
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("[Shipway API Error]:", error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
      },
      { status: 500 }
    );
  }
}
