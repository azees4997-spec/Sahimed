import clientPromise from '@/lib/mongodb';
import PaytmChecksum from './PaytmChecksum';

/**
 * Paytm Payment Gateway Utility
 * Handles checksum generation, transaction initiation, and verification.
 */
export class PaytmService {
  private static get MID() {
    const mid = process.env.PAYTM_MID;
    if (!mid) throw new Error("PAYTM_MID is not defined in environment variables");
    return mid.trim();
  }

  private static get MKEY() {
    const mkey = process.env.PAYTM_MERCHANT_KEY;
    if (!mkey) throw new Error("PAYTM_MERCHANT_KEY is not defined in environment variables");
    return mkey.trim();
  }

  private static get ENV(): 'PROD' | 'STAGING' {
    const env = process.env.PAYTM_ENV;
    if (!env) return 'PROD'; // Default to PROD if not specified for safety
    return env as 'PROD' | 'STAGING';
  }

  private static get WEBSITE() {
    const website = process.env.PAYTM_WEBSITE;
    if (website) return website.trim();
    return this.ENV === 'PROD' ? 'DEFAULT' : 'WEBSTAGING';
  }

  private static get HOST() {
    return this.ENV === 'PROD' ? 'secure.paytmpayments.com' : 'securestage.paytmpayments.com';
  }

  /**
   * Generates Paytm Checksum for objects
   */
  static async generateChecksum(params: any, key: string): Promise<string> {
    return PaytmChecksum.generateSignature(params, key);
  }

  /**
   * Verifies Paytm Checksum for objects
   */
  static async verifyChecksum(params: any, key: string, checksum: string): Promise<boolean> {
    return PaytmChecksum.verifySignature(params, key, checksum);
  }

  /**
   * Initiates a transaction and returns the txnToken
   */
  static async initiateTransaction(
    orderId: string, 
    amount: number, 
    userId: string, 
    host?: string, 
    channel: 'WEB' | 'WAP' = 'WEB',
    userDetails?: { 
      mobile?: string, 
      email?: string, 
      firstName?: string,
      shipping?: {
        address1?: string,
        address2?: string,
        cityName?: string,
        stateName?: string,
        zipCode?: string
      }
    }
  ) {
    // Dynamic callback URL based on current host if available, fallback to env
    const baseUrl = host ? `https://${host}` : (process.env.NEXT_PUBLIC_APP_URL || 'https://sahimed.com');
    const cleanOrderId = orderId.replace(/[^a-zA-Z0-9_-]/g, '');
    const uniqueOrderId = `${cleanOrderId}-${Date.now()}`; 
    const callbackUrl = this.ENV === 'PROD' 
      ? 'https://sahimed.com/api/paytm/callback'
      : `${baseUrl}/api/paytm/callback`;
    
    const cleanCustId = userId.replace(/[^a-zA-Z0-9_-]/g, '');
    
    console.log(`[Paytm] Initiating ${this.ENV} transaction. Original Order: ${cleanOrderId}, Paytm Order: ${uniqueOrderId}`);

    // Define body exactly as per user's production dashboard
    const bodyData: any = {
      "requestType": "Payment",
      "mid": this.MID,
      "websiteName": this.WEBSITE,
      "orderId": uniqueOrderId,
      "callbackUrl": callbackUrl,
      "txnAmount": {
        "value": parseFloat(amount.toString()).toFixed(2).toString(),
        "currency": "INR",
      },
      "userInfo": {
        "custId": cleanCustId,
        ...(userDetails?.mobile && { "mobile": userDetails.mobile.replace(/\D/g, '').slice(-10) }),
        ...(userDetails?.email && { "email": userDetails.email })
      },
      "industryTypeId": "Retail",
      "channelId": channel
    };

    try {
      // Generate checksum from the JSON string of the body only
      const bodyString = JSON.stringify(bodyData);
      const signature = await PaytmChecksum.generateSignature(bodyString, this.MKEY);
      
      console.log(`[Paytm Payload] Body: ${bodyString}`);
      console.log(`[Paytm Payload] Signature: ${signature}`);

      const paytmParams = {
        "head": {
          "signature": signature
        },
        "body": bodyData
      };

      const post_data = JSON.stringify(paytmParams);
      const url = `https://${this.HOST}/theia/api/v1/initiateTransaction?mid=${this.MID}&orderId=${uniqueOrderId}`;
      
      console.log(`[Paytm Request] URL: ${url}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: post_data
      });

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const result = await response.json();
        // Inject environment info for debugging
        if (result.body && result.body.resultInfo) {
          result.body.resultInfo.system_env = this.ENV;
          result.body.resultInfo.system_mid = this.MID;
        }
        console.log(`[Paytm Response]`, JSON.stringify(result));
        // Include the uniqueOrderId used for this attempt
        result.orderId = uniqueOrderId;
        return result;
      } else {
        const text = await response.text();
        console.error(`[Paytm Error] Received non-JSON response:`, text.substring(0, 500));
        return {
          body: {
            resultInfo: {
              resultStatus: 'F',
              resultMsg: `Invalid response from Paytm Gateway.`,
              system_env: this.ENV,
              system_mid: this.MID,
              raw_error: text.substring(0, 100)
            }
          }
        };
      }
    } catch (err: any) {
      console.error(`[Paytm Exception]`, err);
      throw err;
    }
  }

  // generateSignature removed as it's in PaytmChecksum
}
