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
  private static API_URL = process.env.VELOCITY_API_URL || 'https://shazam.velocity.in';
  private static SERVICEABILITY_URL = process.env.VELOCITY_SERVICEABILITY_URL || 'https://shazam.velocity.in';
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
      return await this.performAuth(this.API_URL);
    } catch (err) {
      console.warn("[Velocity] Auth on API_URL failed, trying SERVICEABILITY_URL...");
      this.cachedToken = null; // Clear cache on failure
      try {
        return await this.performAuth(this.SERVICEABILITY_URL);
      } catch (err2) {
        this.cachedToken = null;
        throw err; // Throw the original error if both fail
      }
    }
  }

  private static async performAuth(baseUrl: string): Promise<string> {
    console.log(`[Velocity] Authenticating at ${baseUrl}/custom/api/v1/auth-token`);
    const response = await fetch(`${baseUrl}/custom/api/v1/auth-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: this.USERNAME,
        password: this.PASSWORD,
      }),
    });

    const contentType = response.headers.get('content-type');
    let data: any;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      throw new Error(`Authentication failed: Server returned ${response.status}. Expected JSON.`);
    }

    if (!response.ok) {
      throw new Error(`Authentication failed: ${data.message || data.error || response.statusText}`);
    }

    if (!data.token) {
      throw new Error(`Authentication failed: No token received.`);
    }

    this.cachedToken = data.token;
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 23);
    this.tokenExpiry = expiry;

    return this.cachedToken!;
  }

  private static async getHeaders(): Promise<HeadersInit> {
    const token = await this.authenticate();
    return {
      'Content-Type': 'application/json',
      'Authorization': `${token}`
    };
  }

  /**
   * Checks if a pincode is reachable and lists available carriers.
   */
  static async checkServiceability(fromPincode: string, toPincode: string, paymentMode: string = 'cod', shipmentType: string = 'forward') {
    try {
      const headers = await this.getHeaders();
      console.log(`[Velocity] Checking serviceability with headers:`, { ...headers, Authorization: 'REDACTED' });
      
      const response = await fetch(`${this.SERVICEABILITY_URL}/custom/api/v1/serviceability`, {
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
        const errorText = await response.text();
        console.error(`[Velocity] Serviceability failed (${response.status}):`, errorText);
        return { success: false, serviceable: false, error: `Velocity API error (${response.status}): ${errorText}` };
      }

      const data = await response.json();
      console.log(`[Velocity] Serviceability data:`, data);
      
      // Velocity Shazam API specific: result.serviceability_results
      const velocityCarriers = data.serviceability_results || data.result?.serviceability_results || [];

      // Check multiple possible field names for serviceability
      const isServiceable = 
        data.is_serviceable === true || 
        data.serviceable === true || 
        data.success === true ||
        data.status === 'SUCCESS' ||
        data.status === 'success' ||
        data.status === 'ok' ||
        (velocityCarriers && Array.isArray(velocityCarriers) && velocityCarriers.length > 0) ||
        (data.carriers && Array.isArray(data.carriers) && data.carriers.length > 0) ||
        (data.data && data.data.carriers && data.data.carriers.length > 0);

      return { 
        success: true, 
        serviceable: !!isServiceable, 
        carriers: velocityCarriers.length > 0 ? velocityCarriers : (data.carriers || data.data?.carriers || []),
        debug: data 
      };
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
      const payload = {
        order_id: order.orderId,
        order_date: new Date().toISOString().split('T')[0],
        pickup_location: order.warehouseId || 'Primary',
        billing_customer_name: order.billingCustomerName,
        billing_last_name: "",
        billing_address: order.shippingDetails.address,
        billing_city: order.shippingDetails.city,
        billing_pincode: order.shippingDetails.pincode,
        billing_state: order.shippingDetails.state,
        billing_country: "India",
        billing_email: "support@sahimed.com",
        billing_phone: order.shippingDetails.phone,
        shipping_is_billing: true,
        shipping_customer_name: order.billingCustomerName,
        shipping_last_name: "",
        shipping_address: order.shippingDetails.address,
        shipping_city: order.shippingDetails.city,
        shipping_pincode: order.shippingDetails.pincode,
        shipping_country: "India",
        shipping_state: order.shippingDetails.state,
        shipping_email: "support@sahimed.com",
        shipping_phone: order.shippingDetails.phone,
        order_items: order.orderItems.map(item => ({
          name: item.name,
          sku: item.sku || item.name,
          units: item.quantity,
          selling_price: item.price,
          discount: 0,
          tax: 0,
          hsn: ""
        })),
        payment_method: order.paymentMode === 'COD' ? 'COD' : 'Prepaid',
        shipping_charges: 0,
        giftwrap_charges: 0,
        transaction_id: "",
        total_discount: 0,
        sub_total: order.totalAmount,
        length: 10,
        breadth: 10,
        height: 10,
        weight: 0.5
      };
      
      console.log(`[Velocity] Creating forward order:`, JSON.stringify(payload, null, 2));

      const response = await fetch(`${this.API_URL}/custom/api/v1/forward-order-orchestration`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const contentType = response.headers.get('content-type');
      let data: any;

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const errorText = await response.text();
        console.error(`[Velocity] Create order failed. Server returned non-JSON response:`, errorText.substring(0, 200));
        return { success: false, error: `Server returned ${response.status}. Expected JSON, got: ${errorText.substring(0, 50)}...` };
      }

      console.log(`[Velocity] Create order response (${response.status}):`, JSON.stringify(data, null, 2));
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
