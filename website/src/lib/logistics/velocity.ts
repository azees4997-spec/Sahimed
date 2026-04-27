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
  private static AUTH_URL = process.env.VELOCITY_AUTH_URL || 'https://api.velocity.in';
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
      console.log(`[Velocity] Attempting auth on primary: ${this.AUTH_URL}`);
      return await this.performAuth(this.AUTH_URL);
    } catch (err: any) {
      console.warn(`[Velocity] Primary auth failed: ${err.message}. Trying fallback: ${this.API_URL}`);
      this.cachedToken = null;
      try {
        return await this.performAuth(this.API_URL);
      } catch (err2: any) {
        console.error(`[Velocity] Fallback auth also failed: ${err2.message}`);
        this.cachedToken = null;
        throw err;
      }
    }
  }

  private static async performAuth(baseUrl: string): Promise<string> {
    const url = `${baseUrl}/custom/api/v1/auth-token`;
    console.log(`[Velocity] POST ${url}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: this.USERNAME,
        password: this.PASSWORD,
      }),
    });

    console.log(`[Velocity] Auth status: ${response.status} ${response.statusText}`);
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.error || `HTTP ${response.status}`);
      }
      if (!data.token) throw new Error("No token in response");
      
      this.cachedToken = data.token;
      const expiry = new Date();
      expiry.setHours(expiry.getHours() + 23);
      this.tokenExpiry = expiry;
      return this.cachedToken!;
    } else {
      const text = await response.text();
      console.error(`[Velocity] Expected JSON but got ${contentType}:`, text.substring(0, 300));
      throw new Error(`Non-JSON response (${response.status}): ${text.substring(0, 50)}`);
    }
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
      
      // STEP 1: Create Forward Order
      console.log(`[Velocity] Step 1: Creating forward order...`);
      const orderResponse = await fetch(`${this.API_URL}/custom/api/v1/forward-order`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const orderData = await orderResponse.json();
      console.log(`[Velocity] Step 1 Response:`, JSON.stringify(orderData, null, 2));

      if (!orderResponse.ok || !orderData.shipment_id) {
        return { 
          success: false, 
          error: `Step 1 Failed: ${orderData.message || orderData.error || 'No shipment_id returned'}` 
        };
      }

      const shipmentId = orderData.shipment_id;

      // STEP 2: Assign Courier (Shipment)
      console.log(`[Velocity] Step 2: Assigning courier for shipment ${shipmentId}...`);
      const shipmentResponse = await fetch(`${this.API_URL}/custom/api/v1/forward-order-shipment`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          shipment_id: shipmentId
        }),
      });

      const shipmentData = await shipmentResponse.json();
      console.log(`[Velocity] Step 2 Response:`, JSON.stringify(shipmentData, null, 2));

      if (!shipmentResponse.ok) {
        return { 
          success: false, 
          error: `Step 2 Failed: ${shipmentData.message || shipmentData.error || shipmentResponse.statusText}`,
          data: { shipment_id: shipmentId, ...shipmentData }
        };
      }

      return { success: true, data: shipmentData };
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
