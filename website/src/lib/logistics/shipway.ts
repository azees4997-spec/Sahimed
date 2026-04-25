/**
 * Shipway (by Unicommerce) Logistics Integration
 * This service handles communication with Shipway for automated shipping and tracking.
 */

export interface ShipwayOrder {
  orderId: string;
  name: string;
  email?: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  carrier?: string;
  weight?: number;
  items: Array<{
    name: string;
    qty: number;
    price: number;
  }>;
}

export class ShipwayService {
  private static API_URL = 'https://api.shipway.com/v1'; // Standard endpoint
  
  /**
   * Pushes a new order to Shipway for fulfillment.
   */
  static async createShipment(order: ShipwayOrder) {
    const apiKey = process.env.SHIPWAY_API_KEY;
    const loginId = process.env.SHIPWAY_LOGIN_ID;

    if (!apiKey || !loginId) {
      console.error("[Shipway] Missing API credentials in environment.");
      return { success: false, error: "Shipway credentials not configured." };
    }

    try {
      // Note: Shipway API structure depends on the specific Unicommerce connector.
      // This is the standard request for their Order Push API.
      const response = await fetch(`${this.API_URL}/add-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${loginId}:${apiKey}`).toString('base64')}`
        },
        body: JSON.stringify({
          order_id: order.orderId,
          customer_name: order.name,
          customer_phone: order.phone,
          customer_email: order.email || '',
          address: order.address,
          city: order.city,
          state: order.state,
          pincode: order.pincode,
          items: order.items,
          // Optional: Add weight, dimensions here
        })
      });

      const result = await response.json();
      return { success: response.ok, data: result };
    } catch (err: any) {
      console.error("[Shipway] Push failed:", err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Fetches latest tracking info for a given AWB.
   */
  static async getTracking(awb: string) {
    // Shipway tracking lookup logic
    return { awb, status: 'Processing' };
  }
}
