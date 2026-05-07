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
  private static ENV = process.env.NODE_ENV === 'production' ? 'PROD' : 'STAGING';
  
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

  // getStringByParams removed as it's in PaytmChecksum

  /**
   * Initiates a transaction and returns the txnToken
   */
  static async initiateTransaction(orderId: string, amount: number, userId: string, channel: 'WEB' | 'WAP' = 'WEB') {
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/paytm/callback`;
    
    const paytmParams: any = {};

    paytmParams["body"] = {
      "requestType": "Payment",
      "mid": this.MID,
      "websiteName": this.WEBSITE,
      "orderId": orderId,
      "callbackUrl": callbackUrl,
      "txnAmount": {
        "value": amount.toFixed(2),
        "currency": "INR",
      },
      "userInfo": {
        "custId": userId,
      },
    };

    const signature = await PaytmChecksum.generateSignature(JSON.stringify(paytmParams.body), this.MKEY);
    paytmParams["head"] = {
      "signature": signature
    };

    const post_data = JSON.stringify(paytmParams);

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': post_data.length.toString(),
      },
    };

    const response = await fetch(`https://${this.HOST}/theia/api/v1/initiateTransaction?mid=${this.MID}&orderId=${orderId}`, {
      ...options,
      body: post_data
    });

    return await response.json();
  }

  // generateSignature removed as it's in PaytmChecksum
}
