import nodemailer from 'nodemailer';

// Create a generic transporter configured for Gmail
// Requires process.env.SMTP_USER and process.env.SMTP_PASS
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Pending Pharmacist': return '#f97316'; // orange-500
    case 'Confirmed': return '#2563eb'; // blue-600
    case 'Packed': return '#ea580c'; // orange-600
    case 'In Transit': return '#9333ea'; // purple-600
    case 'Out for Delivery': return '#4f46e5'; // indigo-600
    case 'Delivered': return '#16a34a'; // green-600
    case 'Cancelled': return '#dc2626'; // red-600
    default: return '#4b5563'; // gray-600
  }
};

export const sendOrderNotification = async (order: any, action: 'NEW_ORDER' | 'STATUS_UPDATE') => {
  // If SMTP is not configured, silently skip sending (prevents breaking the app)
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("Email service skipped: SMTP_USER or SMTP_PASS not defined in .env");
    return false;
  }

  const isNew = action === 'NEW_ORDER';
  const subject = isNew 
    ? `🚨 NEW ORDER Alert - ${order.orderId} - ₹${order.totalAmount}`
    : `🔄 Order Update - ${order.orderId} is now ${order.status}`;

  const itemsHtml = (order.items || []).map((it: any) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${it.name}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">x${it.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${(it.unitPrice * it.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  const fullAddress = `
    ${order.shippingDetails?.houseNumber ? order.shippingDetails.houseNumber + ', ' : ''}
    ${order.shippingDetails?.street || ''}<br/>
    ${order.shippingDetails?.city || ''}, ${order.shippingDetails?.state || ''} - ${order.shippingDetails?.pincode || ''}
  `;

  const html = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      <div style="background-color: ${isNew ? '#4f46e5' : getStatusColor(order.status)}; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">${isNew ? 'New Order Received' : 'Order Status Updated'}</h1>
        <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">Order #${order.orderId}</p>
      </div>
      
      <div style="padding: 30px;">
        <div style="margin-bottom: 30px; display: flex; justify-content: space-between;">
          <div>
            <h3 style="margin: 0 0 8px; color: #374151; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Customer Details</h3>
            <p style="margin: 0 0 4px; font-weight: bold; font-size: 16px;">${order.patientName}</p>
            <p style="margin: 0; color: #6b7280; font-size: 14px;">${order.phoneNumber}</p>
          </div>
          <div style="text-align: right;">
            <h3 style="margin: 0 0 8px; color: #374151; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Order Status</h3>
            <span style="display: inline-block; background: ${getStatusColor(order.status)}20; color: ${getStatusColor(order.status)}; padding: 6px 12px; border-radius: 9999px; font-weight: bold; font-size: 14px;">
              ${order.status}
            </span>
          </div>
        </div>

        <div style="margin-bottom: 30px;">
          <h3 style="margin: 0 0 8px; color: #374151; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Delivery Address</h3>
          <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.5;">${fullAddress}</p>
        </div>

        <div style="margin-bottom: 30px;">
          <h3 style="margin: 0 0 12px; color: #374151; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Order Items</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="background-color: #f9fafb;">
                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Item</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
                <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding: 16px 12px; text-align: right; font-weight: bold; border-top: 2px solid #e5e7eb;">Net Paid (${order.paymentMethod || 'COD'}):</td>
                <td style="padding: 16px 12px; text-align: right; font-weight: bold; font-size: 18px; color: #111; border-top: 2px solid #e5e7eb;">₹${Number(order.totalAmount).toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        <div style="text-align: center; margin-top: 40px;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://sahimed.com'}/Sahi-admin" style="display: inline-block; background-color: #111; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; font-size: 14px;">View in Dashboard</a>
        </div>
      </div>
      
      <div style="background-color: #f9fafb; padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
        This is an automated notification from the Sahimed Fulfillment System.
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Sahimed Fulfillment" <${process.env.SMTP_USER}>`,
      to: 'Support@sahimed.com',
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error("Failed to send order notification email:", error);
    return false;
  }
};
