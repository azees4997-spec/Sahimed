const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function testWhatsApp() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromWhatsApp = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';
  const toWhatsApp = process.env.ADMIN_WHATSAPP_NUMBER || 'whatsapp:+917349499898';

  console.log('--- Twilio WhatsApp Configuration Check ---');
  console.log('Account SID:', accountSid ? 'FOUND' : 'MISSING');
  console.log('Auth Token:', authToken ? 'FOUND' : 'MISSING');
  console.log('From WhatsApp:', fromWhatsApp);
  console.log('To WhatsApp:', toWhatsApp);

  if (!accountSid || !authToken) {
    console.error('Error: TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN is missing in .env');
    process.exit(1);
  }

  // Dummy order data
  const order = {
    orderId: 'SHM-TEST-123',
    totalAmount: '1249.50',
    paymentMethod: 'Prepaid (Online)',
    patientName: 'Test Patient',
    phoneNumber: '+919876543210',
    items: [
      { name: 'Paracetamol 650mg', quantity: 2, unitPrice: 45.00 },
      { name: 'Amoxicillin 500mg', quantity: 1, unitPrice: 159.50 }
    ],
    shippingDetails: {
      houseNumber: 'Flat 402, Block B',
      street: '12th Main Road, HSR Layout',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560102'
    }
  };

  const itemsText = (order.items || [])
    .map((it) => `• ${it.name} (x${it.quantity}) - ₹${(Number(it.unitPrice) * it.quantity).toFixed(2)}`)
    .join('\n');

  const addressParts = [
    order.shippingDetails?.houseNumber,
    order.shippingDetails?.street,
    order.shippingDetails?.city,
    order.shippingDetails?.state,
    order.shippingDetails?.pincode ? `PIN: ${order.shippingDetails.pincode}` : ''
  ];
  const fullAddress = addressParts.filter(Boolean).join(', ');

  const messageBody = `🚨 *New Order Alert - Sahimed (Test)*

*Order ID:* ${order.orderId}
*Amount:* ₹${Number(order.totalAmount).toFixed(2)}
*Payment:* ${order.paymentMethod}
*Patient:* ${order.patientName}
*Phone:* ${order.phoneNumber}

*Items:*
${itemsText}

*Address:*
${fullAddress}

*View in Admin Dashboard:*
https://sahimed.com/Sahi-admin`;

  console.log('\n--- Message Body to Send ---');
  console.log(messageBody);
  console.log('----------------------------\n');

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');

  const params = new URLSearchParams();
  params.append('From', fromWhatsApp);
  params.append('To', toWhatsApp);
  params.append('Body', messageBody);

  console.log('Sending message to Twilio...');
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Error Response from Twilio:', response.status, data);
    } else {
      console.log('Message sent successfully! Response SID:', data.sid);
    }
  } catch (err) {
    console.error('Fetch request failed:', err);
  }
}

testWhatsApp();
