import { generateSlug } from '../slug';

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
   * Includes manual EDD calculation based on Zones and Pincode Overrides.
   */
  static async checkServiceability(fromPincode: string, toPincode: string, paymentMode: string = 'cod', shipmentType: string = 'forward') {
    // MANUAL PINCODE OVERRIDES (Optional: can be moved to DB later)
    const PINCODE_OVERRIDES: Record<string, { days: number, zone?: string }> = {
      // '560001': { days: 1, zone: 'Bengaluru Central' },
    };

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
      
      // --- MANUAL EDD LOGIC ---
      // As per user request: Bengaluru (1), South India (3), Rest of India (5)
      // Cutoff: 2 PM (14:00 IST)
      
      const now = new Date();
      const istHour = parseInt(new Intl.DateTimeFormat('en-GB', {
        hour: 'numeric',
        hour12: false,
        timeZone: 'Asia/Kolkata'
      }).format(now));
      
      const isBefore2PM = istHour < 14;
      
      let zone = 'Rest of India';
      let daysToAdd = 5; // Default fallback for Rest of India
      
      // 1. PINCODE OVERRIDE CHECK (Priority 1)
      if (PINCODE_OVERRIDES[toPincode]) {
        const override = PINCODE_OVERRIDES[toPincode];
        daysToAdd = override.days;
        zone = override.zone || `Pincode ${toPincode}`;
      } else {
        // 2. ZONE-BASED DETECTION (Priority 2)
        const p2 = toPincode.substring(0, 2);
        const p3 = toPincode.substring(0, 3);

        // Bengaluru (560xxx)
        if (p3 === '560') {
          zone = 'Bengaluru';
          daysToAdd = 1;
        }
        // South India (TN: 60-64, KL: 67-69, AP/TS: 50-53, KA: 56-59)
        else if (['60','61','62','63','64','67','68','69','50','51','52','53','56','57','58','59'].includes(p2)) {
          zone = 'South India';
          daysToAdd = 3;
        }
      }

      // If after 2 PM, add an extra day for dispatch
      if (!isBefore2PM) {
        daysToAdd += 1;
      }

      const date = new Date();
      // Adjust to IST date for calculation if needed, but for simple days-to-add Date() is fine
      date.setDate(date.getDate() + daysToAdd);
      const edd = date.toISOString().split('T')[0];

      return { 
        success: true, 
        serviceable: !!isServiceable, 
        carriers: data.carriers || [{ name: "Shipway Courier", id: "auto" }],
        edd: edd,
        zone: zone,
        debug: {
          ...data,
          manualCalculation: {
            istHour,
            isBefore2PM,
            daysToAdd,
            appliedZone: zone
          }
        }
      };

    } catch (err: any) {
      console.error("[Shipway] Serviceability check failed:", err.message);
      return { success: false, serviceable: false, error: err.message };
    }
  }

  /**
   * Manifests a shipment using the v2orders API.
   * Automatically assigns tracking and generates label.
   */
  static async createForwardOrder(order: ShipwayOrder) {
    try {
      const headers = this.getHeaders();
      const [firstName, ...lastNames] = order.billingCustomerName.split(' ');
      const lastName = lastNames.join(' ');

      const payload = {
        order_id: order.orderId,
        products: order.orderItems.map(item => ({
          product_id: item.sku || generateSlug(item.name),
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        payment_type: order.paymentMode === 'COD' ? 'C' : 'P',
        email: order.shippingDetails.email || "support@sahimed.com",
        order_total: String(order.totalAmount),
        shipping_address: order.shippingDetails.address,
        shipping_city: order.shippingDetails.city,
        shipping_state: order.shippingDetails.state,
        shipping_country: "India",
        shipping_fname: firstName || "Customer",
        shipping_lname: lastName || "",
        first_name: firstName || "Customer",
        last_name: lastName || "",
        shipping_firstname: firstName || "Customer",
        shipping_lastname: lastName || "",
        shipping_first_name: firstName || "Customer",
        shipping_last_name: lastName || "",
        shipping_phone: String(order.shippingDetails.phone),
        shipping_zipcode: String(order.shippingDetails.pincode),
        billing_address: order.shippingDetails.address,
        billing_city: order.shippingDetails.city,
        billing_state: order.shippingDetails.state,
        billing_country: "India",
        billing_fname: firstName || "Customer",
        billing_lname: lastName || "",
        billing_firstname: firstName || "Customer",
        billing_lastname: lastName || "",
        billing_first_name: firstName || "Customer",
        billing_last_name: lastName || "",
        billing_phone: String(order.shippingDetails.phone),
        billing_zipcode: String(order.shippingDetails.pincode),
        warehouse_id: 93743,
        return_warehouse_id: 93743,
        carrier_id: 0
      };
      
      console.log(`[Shipway] Pushing forward order to v2orders...`);
      const response = await fetch(`${this.API_URL}/v2orders`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      console.log(`[Shipway] v2orders Response:`, responseText);

      try {
        const orderData = JSON.parse(responseText);
        if (!response.ok || orderData.status === 'error' || orderData.status === 'Failed' || orderData.success === false) {
          console.error(`[Shipway] v2orders Error Detail:`, JSON.stringify(orderData, null, 2));
          return { 
            success: false, 
            error: `v2orders Failed: ${orderData.message || orderData.error || orderData.remark || response.statusText}` 
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
      console.error("[Shipway] v2orders failed:", err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Manifests a reverse (return) shipment using the Createreturns API.
   */
  static async createReverseOrder(order: ShipwayOrder, options?: any) {
    try {
      const headers = this.getHeaders();
      const [firstName, ...lastNames] = order.billingCustomerName.split(' ');
      const lastName = lastNames.join(' ');

      const payload = {
        order_id: order.orderId,
        return_order_status: options?.return_order_status || 'R', // Refund by default
        return_reason_id: options?.return_reason_id || 1, 
        refund_payment_id: options?.refund_payment_id || 4, // Gift Card or Store credits as safe fallback
        transfer_details: options?.transfer_details || { "mode": "Store Credits" },
        return_warehouse_id: options?.return_warehouse_id || 1,
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
        products: order.orderItems.map(item => ({
          product_id: item.sku || generateSlug(item.name),
          name: item.name,
          quantity: item.quantity,
          price: item.price
        }))
      };

      console.log(`[Shipway] Pushing reverse order to Createreturns...`);
      const response = await fetch(`${this.API_URL}/Createreturns`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      try {
        const orderData = JSON.parse(responseText);
        if (!response.ok || orderData.status === 'error' || orderData.status === 'Failed') {
          return { success: false, error: `Createreturns Failed: ${orderData.message || orderData.error || response.statusText}` };
        }
        return { success: true, data: orderData };
      } catch (e) {
        if (!response.ok) return { success: false, error: `HTTP ${response.status}: ${responseText}` };
        return { success: true, data: { raw: responseText } };
      }
    } catch (err: any) {
      console.error("[Shipway] Create reverse order failed:", err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Cancels a previously created forward or reverse shipment.
   * Based on the user docs, there's Cancelorders for order IDs and Cancel for AWB.
   * If an AWB is provided, we use /Cancel, otherwise /Cancelorders
   */
  static async cancelOrder(orderId: string, awbNumber?: string) {
    try {
      const headers = this.getHeaders();
      const endpoint = awbNumber ? `${this.API_URL}/Cancel` : `${this.API_URL}/Cancelorders`;
      const payload = awbNumber 
        ? { awb_number: awbNumber }
        : { order_ids: JSON.stringify([orderId]) };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));
      return { success: response.ok, data };
    } catch (err: any) {
      console.error("[Shipway] Cancel order failed:", err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Generates manifest for given order IDs
   */
  static async createManifest(orderIds: string[]) {
    try {
      const headers = this.getHeaders();
      const response = await fetch(`${this.API_URL}/Createmanifest`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ order_ids: JSON.stringify(orderIds) }),
      });
      const data = await response.json().catch(() => ({}));
      return { success: response.ok, data };
    } catch (err: any) {
      console.error("[Shipway] Create manifest failed:", err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Marks orders as On Hold
   */
  static async onHoldOrders(orderIds: string[]) {
    try {
      const headers = this.getHeaders();
      const response = await fetch(`${this.API_URL}/Onholdorders`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ order_ids: JSON.stringify(orderIds) }),
      });
      const data = await response.json().catch(() => ({}));
      return { success: response.ok, data };
    } catch (err: any) {
      console.error("[Shipway] On hold orders failed:", err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Schedules a pickup for the given orders
   */
  static async createPickup(params: {
    pickup_date: string; // yyyy-mm-dd
    pickup_time: string; // hh:mm
    carrier_id: number;
    office_close_time: string; // hh:mm
    warehouse_id: number;
    return_warehouse_id?: number;
    payment_type: 'P' | 'C';
    order_ids: string[];
  }) {
    try {
      const headers = this.getHeaders();
      const payload = {
        ...params,
        order_ids: JSON.stringify(params.order_ids)
      };
      
      const response = await fetch(`${this.API_URL}/createpickup`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      return { success: response.ok, data };
    } catch (err: any) {
      console.error("[Shipway] Create pickup failed:", err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Fetches orders by various filters using the getorders API.
   * Can be used for tracking order status updates based on shipment_status.
   */
  static async getOrders(params: {
    orderid?: string;
    awb_number?: string;
    tags?: string;
    date_from?: string;
    date_to?: string;
    status?: string;
    page?: number;
    shipment_status?: string;
    new_shipment_status?: string;
  }) {
    try {
      const headers = this.getHeaders();
      const payload = { ...params };
      
      const response = await fetch(`${this.API_URL}/getorders`, {
        method: 'POST', // Most Shipway APIs default to POST with JSON payload for data retrieval, but if it expects GET we can append query string
        headers,
        body: JSON.stringify(payload),
      });

      // Let's also support GET if POST fails gracefully or as fallback, but typically Shipway uses JSON POST for their endpoints like pushOrderData
      const data = await response.json().catch(() => ({}));
      return { success: response.ok, data };
    } catch (err: any) {
      console.error("[Shipway] getorders failed:", err.message);
      return { success: false, error: err.message };
    }
  }
}
