import clientPromise from '@/lib/mongodb';
import PaytmChecksum from './PaytmChecksum';

/**
 * Paytm Payment Gateway Utility
 * Handles checksum generation, transaction initiation, and verification.
 */
export class PaytmService {
  private static MID = process.env.PAYTM_MID || 'CFehFB20400052473723';
  private static MKEY = process.env.PAYTM_MERCHANT_KEY || 'UcS3iYcSyDs5%RGX';
  private static WEBSITE = process.env.PAYTM_WEBSITE || 'WEBSTAGING';
  private static INDUSTRY_TYPE = 'Retail';
  private static ENV = (process.env.PAYTM_ENV || (process.env.NODE_ENV === 'production' ? 'PROD' : 'STAGING')) as 'PROD' | 'STAGING';
  
  // Paytm API Endpoints
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
    const callbackUrl = `${baseUrl}/api/paytm/callback`;
    
    console.log(`[Paytm] Initiating ${this.ENV} transaction. Order: ${orderId}, Host: ${baseUrl}`);

    const paytmParams: any = {};

    paytmParams["body"] = {
      "requestType": "Payment",
      "mid": this.MID,
      "websiteName": this.WEBSITE,
      "orderId": orderId,
      "callbackUrl": callbackUrl,
      "txnAmount": {
        "value": Number(amount).toFixed(2),
        "currency": "INR",
      },
      "userInfo": {
        "custId": userId,
      },
    };

    try {
      const signature = await PaytmChecksum.generateSignature(JSON.stringify(paytmParams.body), this.MKEY);
      paytmParams["head"] = {
        "signature": signature
      };

      const post_data = JSON.stringify(paytmParams);
      const url = `https://${this.HOST}/theia/api/v1/initiateTransaction?mid=${this.MID}&orderId=${orderId}`;

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
