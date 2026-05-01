/**
 * Shipway Shipping API Integration
 * Handles authentication, serviceability, tracking, and order orchestration.
 */

export interface ShipwayOrder {
  orderId: string;
  billingCustomerName: string;
  orderItems: Array<{
    name: string;
    quantity: number;
    price: number;
    sku?: string;
  }>;
  warehouseId: string; // Not typically used directly in Shipway unless mapped
  shippingDetails: {
    address: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
    email?: string;
  };
  totalAmount: number;
  paymentMode: 'PREPAID' | 'COD';
}

export class ShipwayService {
  private static API_URL = process.env.SHIPWAY_API_URL || 'https://app.shipway.com/api';
  private static EMAIL = process.env.SHIPWAY_EMAIL || 'Support@sahimed.com';
  private static LICENSE_KEY = process.env.SHIPWAY_LICENSE_KEY || '0E0UJ0Xqy7uor2V9WomPI850w9876m02';

  private static getAuthHeader(): string {
    return 'Basic ' + Buffer.from(`${this.EMAIL}:${this.LICENSE_KEY}`).toString('base64');
  }

  private static getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'Authorization': this.getAuthHeader()
    };
  }

  /**
   * Checks if a pincode is reachable and lists available carriers.
   */
  static async checkServiceability(fromPincode: string, toPincode: string, paymentMode: string = 'cod', shipmentType: string = 'forward') {
    try {
      const headers = this.getHeaders();
      const url = `${this.API_URL}/pincodeserviceable?pincode=${toPincode}`;
      console.log(`[Shipway] Checking serviceability for ${toPincode}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers
      });

      const data = await response.json().catch(() => ({}));

      // Shipway response typically contains status success or error and details.
      const isServiceable = data.status === 'Success' || data.success || data.is_serviceable;
      
      return { 
        success: true, 
        serviceable: !!isServiceable, 
        carriers: data.carriers || [{ name: "Shipway Courier", id: "auto" }],
        debug: data 
      };
    } catch (err: any) {
      console.error("[Shipway] Serviceability check failed:", err.message);
      return { success: false, serviceable: false, error: err.message };
    }
  }

  /**
   * Manifests a shipment and pushes order to Shipway.
   */
  static async createForwardOrder(order: ShipwayOrder) {
    try {
      const headers = this.getHeaders();
      const [firstName, ...lastNames] = order.billingCustomerName.split(' ');
      const lastName = lastNames.join(' ');

      const payload = {
        order_id: order.orderId,
        payment_type: order.paymentMode === 'COD' ? 'C' : 'P',
        email: order.shippingDetails.email || "support@sahimed.com",
        order_total: String(order.totalAmount),
        shipping_address: order.shippingDetails.address,
        shipping_city: order.shippingDetails.city,
        shipping_state: order.shippingDetails.state,
        shipping_zipcode: order.shippingDetails.pincode,
        shipping_country: "India",
        shipping_firstname: firstName || "Customer",
        shipping_lastname: lastName || "",
        shipping_phone: order.shippingDetails.phone,
        order_date: new Date().toISOString().replace('T', ' ').split('.')[0],
        products: order.orderItems.map(item => ({
          product_id: item.sku || item.name.replace(/\s+/g, '-').toLowerCase(),
          name: item.name,
          quantity: item.quantity,
          price: item.price
        }))
      };
      
      console.log(`[Shipway] Pushing forward order to v2orders...`);
      const response = await fetch(`${this.API_URL}/v2orders`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      console.log(`[Shipway] Response:`, responseText);

      try {
        const orderData = JSON.parse(responseText);
        if (!response.ok || orderData.status === 'error' || orderData.status === 'Failed') {
          return { 
            success: false, 
            error: `v2orders Failed: ${orderData.message || orderData.error || response.statusText}` 
          };
        }
        return { success: true, data: orderData };
      } catch (e) {
        if (!response.ok) {
           return { success: false, error: `HTTP ${response.status}: ${responseText}` };
        }
        return { success: true, data: { raw: responseText } };
      }
    } catch (err: any) {
      console.error("[Shipway] Create forward order failed:", err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Manifests a reverse (return) shipment.
   */
  static async createReverseOrder(order: ShipwayOrder) {
    try {
      // Basic reverse logic - update endpoint as per Shipway's reverse specific API
      console.warn("[Shipway] Reverse order requires specific Shipway endpoint, mapping to pushOrderData for now with return flag if supported");
      return { success: false, error: "Reverse order API endpoint not strictly mapped for Shipway yet." };
    } catch (err: any) {
      console.error("[Shipway] Create reverse order failed:", err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Cancels a previously created forward or reverse shipment.
   */
  static async cancelOrder(orderId: string) {
    try {
      const headers = this.getHeaders();
      const response = await fetch(`${this.API_URL}/cancelOrder`, { // Assuming generic cancel endpoint
        method: 'POST',
        headers,
        body: JSON.stringify({
          order_id: orderId
        }),
      });

      const data = await response.json().catch(() => ({}));
      return { success: response.ok, data };
    } catch (err: any) {
      console.error("[Shipway] Cancel order failed:", err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Fetches real-time status like in_transit, out_for_delivery, or delivered.
   */
  static async trackOrders(awbs: string[]) {
    try {
      const headers = this.getHeaders();
      const response = await fetch(`${this.API_URL}/tracking`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ awbs }),
      });

      const data = await response.json().catch(() => ({}));
      return { success: response.ok, data };
    } catch (err: any) {
      console.error("[Shipway] Order tracking failed:", err.message);
      return { success: false, error: err.message };
    }
  }
}
