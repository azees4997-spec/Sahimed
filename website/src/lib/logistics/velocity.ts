/**
 * Velocity Shipping Custom API (Version 1) Integration
 * Handles authentication, serviceability, tracking, and order orchestration.
 */

export interface VelocityOrder {
  orderId: string;
  billingCustomerName: string;
  orderItems: Array<{
    name: string;
    quantity: number;
    price: number;
    sku?: string;
  }>;
  warehouseId: string; // The ID from warehouse setup
  shippingDetails: {
    address: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  };
  totalAmount: number;
  paymentMode: 'PREPAID' | 'COD';
}

export class VelocityService {
  private static API_URL = process.env.VELOCITY_API_URL || 'https://api.velocity.in'; // Replace with actual base URL if different
  private static USERNAME = process.env.VELOCITY_USERNAME || '+917349499898';
  private static PASSWORD = process.env.VELOCITY_PASSWORD || 'Azeez@497';
  
  private static cachedToken: string | null = null;
  private static tokenExpiry: Date | null = null;

  /**
   * Generates a token valid for 24 hours to be used in all headers.
   */
  static async authenticate(): Promise<string> {
    if (this.cachedToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.cachedToken;
    }

    try {
      const response = await fetch(`${this.API_URL}/custom/api/v1/auth-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: this.USERNAME,
          password: this.PASSWORD,
        }),
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.statusText}`);
      }

      const data = await response.json();
      this.cachedToken = data.token; // Assuming response has a 'token' field
      // Token is valid for 24 hours, let's cache it for 23 hours to be safe
      const expiry = new Date();
      expiry.setHours(expiry.getHours() + 23);
      this.tokenExpiry = expiry;

      return this.cachedToken!;
    } catch (err: any) {
      console.error("[Velocity] Auth failed:", err.message);
      throw err;
    }
  }

  private static async getHeaders(): Promise<HeadersInit> {
    const token = await this.authenticate();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  /**
   * Checks if a pincode is reachable and lists available carriers.
   */
  static async checkServiceability(fromPincode: string, toPincode: string, paymentMode: string = 'PREPAID', shipmentType: string = 'forward') {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${this.API_URL}/custom/api/v1/serviceability`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          from: fromPincode,
          to: toPincode,
          payment_mode: paymentMode,
          shipment_type: shipmentType
        }),
      });

      if (!response.ok) {
        return { success: false, serviceable: false, carriers: [] };
      }

      const data = await response.json();
      return { success: true, serviceable: data.is_serviceable || data.serviceable || false, carriers: data.carriers || [] };
    } catch (err: any) {
      console.error("[Velocity] Serviceability check failed:", err.message);
      return { success: false, serviceable: false, error: err.message };
    }
  }

  /**
   * Manifests a shipment and assigns a courier in one single step.
   */
  static async createForwardOrder(order: VelocityOrder) {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${this.API_URL}/custom/api/v1/forward-order-orchestration`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          order_id: order.orderId,
          billing_customer_name: order.billingCustomerName,
          order_items: order.orderItems,
          warehouse_id: order.warehouseId,
          // Sending additional fields that might be required
          shipping_address: order.shippingDetails,
          total_amount: order.totalAmount,
          payment_mode: order.paymentMode
        }),
      });

      const data = await response.json();
      return { success: response.ok, data };
    } catch (err: any) {
      console.error("[Velocity] Create forward order failed:", err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Manifests a reverse (return) shipment and assigns a courier.
   */
  static async createReverseOrder(order: VelocityOrder) {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${this.API_URL}/custom/api/v1/reverse-order-orchestration`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          order_id: order.orderId,
          billing_customer_name: order.billingCustomerName,
          order_items: order.orderItems,
          warehouse_id: order.warehouseId,
          shipping_address: order.shippingDetails,
          total_amount: order.totalAmount,
          payment_mode: order.paymentMode
        }),
      });

      const data = await response.json();
      return { success: response.ok, data };
    } catch (err: any) {
      console.error("[Velocity] Create reverse order failed:", err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Cancels a previously created forward or reverse shipment.
   */
  static async cancelOrder(orderId: string) {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${this.API_URL}/custom/api/v1/cancel-order`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          order_id: orderId
        }),
      });

      const data = await response.json();
      return { success: response.ok, data };
    } catch (err: any) {
      console.error("[Velocity] Cancel order failed:", err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Fetches real-time status like in_transit, out_for_delivery, or delivered.
   */
  static async trackOrders(awbs: string[]) {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${this.API_URL}/custom/api/v1/order-tracking`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ awbs }),
      });

      const data = await response.json();
      return { success: response.ok, data };
    } catch (err: any) {
      console.error("[Velocity] Order tracking failed:", err.message);
      return { success: false, error: err.message };
    }
  }
}
