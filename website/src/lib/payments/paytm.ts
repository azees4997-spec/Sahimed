import clientPromise from '@/lib/mongodb';
import PaytmChecksum from './PaytmChecksum';

/**
 * Paytm Payment Gateway Utility
 * Handles checksum generation, transaction initiation, and verification.
 */
export class PaytmService {
  private static get MID() {
    return (process.env.PAYTM_MID || 'CFehFB20400052473723').trim();
  }

  private static get MKEY() {
    return (process.env.PAYTM_MERCHANT_KEY || 'UcS3iYcSyDs5%RGX').trim();
  }

  private static get ENV(): 'PROD' | 'STAGING' {
    if (process.env.PAYTM_ENV) return process.env.PAYTM_ENV as 'PROD' | 'STAGING';
    if (this.MID.startsWith('CFehFB')) return 'STAGING';
    return process.env.NODE_ENV === 'production' ? 'PROD' : 'STAGING';
  }

  private static get WEBSITE() {
    return (process.env.PAYTM_WEBSITE || (this.ENV === 'STAGING' ? 'WEBSTAGING' : 'DEFAULT')).trim();
  }

  private static get HOST() {
    return this.ENV === 'PROD' ? 'securegw.paytm.in' : 'securegw-stage.paytm.in';
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
  static async initiateTransaction(orderId: string, amount: number, userId: string, host?: string, channel: 'WEB' | 'WAP' = 'WEB') {
    // Dynamic callback URL based on current host if available, fallback to env
    const baseUrl = host ? `https://${host}` : (process.env.NEXT_PUBLIC_APP_URL || 'https://sahimed.com');
    const cleanOrderId = orderId.replace(/[^a-zA-Z0-9_-]/g, '');
    const uniqueOrderId = `${cleanOrderId}T${Date.now()}`; 
    const callbackUrl = `${baseUrl}/api/paytm/callback`;
    
    const cleanCustId = userId.replace(/[^a-zA-Z0-9_-]/g, '');
    
    console.log(`[Paytm] Initiating ${this.ENV} transaction. Original Order: ${cleanOrderId}, Paytm Order: ${uniqueOrderId}`);

    // Helper to ensure deterministic JSON stringification
    const sortObject = (obj: any): any => {
      return Object.keys(obj).sort().reduce((acc: any, key: string) => {
        acc[key] = obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key]) 
          ? sortObject(obj[key]) 
          : obj[key];
        return acc;
      }, {});
    };

    const rawBody = {
      "requestType": "Payment",
      "mid": this.MID,
      "websiteName": this.WEBSITE,
      "orderId": uniqueOrderId,
      "callbackUrl": callbackUrl,
      "industryTypeId": "Retail",
      "channelId": channel, // Crucial field from merchant keys
      "txnAmount": {
        "value": Number(amount).toFixed(2).toString(),
        "currency": "INR",
      },
      "userInfo": {
        "custId": cleanCustId,
      },
    };

    const sortedBody = sortObject(rawBody);

    try {
      const bodyString = JSON.stringify(sortedBody);
      const signature = await PaytmChecksum.generateSignature(bodyString, this.MKEY);
      
      console.log(`[Paytm Payload] Body: ${bodyString}`);
      console.log(`[Paytm Payload] Signature: ${signature}`);

      const paytmParams = {
        "head": {
          "signature": signature
        },
        "body": sortedBody
      };

      const post_data = JSON.stringify(paytmParams);
      const url = `https://${this.HOST}/theia/api/v1/initiateTransaction?mid=${this.MID}&orderId=${uniqueOrderId}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': post_data.length.toString(),
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
        if (result.body) {
          result.body.uniqueOrderId = uniqueOrderId;
        }
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
