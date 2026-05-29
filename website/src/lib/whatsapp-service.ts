/**
 * Service to handle Twilio WhatsApp notifications for Sahimed.
 */

export async function sendAdminWhatsAppNotification(order: any): Promise<boolean> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromWhatsApp = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';
  const toWhatsApp = process.env.ADMIN_WHATSAPP_NUMBER || 'whatsapp:+917349499898';

  if (!accountSid || !authToken) {
    console.warn('[WhatsApp Service] Skipped: TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN not defined in .env');
    return false;
  }

  try {
    // 1. Prepare order details
    const itemsText = (order.items || [])
      .map((it: any) => `• ${it.name} (x${it.quantity}) - ₹${(Number(it.unitPrice) * it.quantity).toFixed(2)}`)
      .join('\n');

    const addressParts = [
      order.shippingDetails?.houseNumber,
      order.shippingDetails?.street,
      order.shippingDetails?.city,
      order.shippingDetails?.state,
      order.shippingDetails?.pincode ? `PIN: ${order.shippingDetails.pincode}` : ''
    ];
    const fullAddress = addressParts.filter(Boolean).join(', ');

    const paymentMode = order.paymentMethod || order.paymentType || 'Cash on Delivery';

    // 2. Construct the message body (utilizing WhatsApp markdown for formatting)
    const messageBody = `🚨 *New Order Alert - Sahimed*

*Order ID:* ${order.orderId}
*Amount:* ₹${Number(order.totalAmount).toFixed(2)}
*Payment:* ${paymentMode}
*Patient:* ${order.patientName}
*Phone:* ${order.phoneNumber}

*Items:*
${itemsText || 'No items'}

*Address:*
${fullAddress || 'No address provided'}

*View in Admin Dashboard:*
${process.env.NEXT_PUBLIC_APP_URL || 'https://sahimed.com'}/Sahi-admin`;

    // 3. Send via Twilio REST API
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const authHeader = `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`;

    const params = new URLSearchParams();
    params.append('From', fromWhatsApp);
    params.append('To', toWhatsApp);
    params.append('Body', messageBody);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[WhatsApp Service Error] Twilio responded with status:', response.status, data);
      return false;
    }

    console.log('[WhatsApp Service] Alert sent successfully. Twilio SID:', data.sid);
    return true;
  } catch (err: any) {
    console.error('[WhatsApp Service Error] Failed to send WhatsApp message:', err.message);
    return false;
  }
}
