const { MongoClient, ObjectId } = require('mongodb');
const https = require('https');

async function main() {
  const uri = process.env.MONGODB_URI || "mongodb+srv://tarfemon:sahinav2024@cluster0.zoxnd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db('sahimed');
    // From screenshot order ID is SHM-HOITD
    const order = await db.collection('orders').findOne({ orderId: "SHM-HOITD" });
    
    if (!order) {
      console.log("Order not found");
      return;
    }
    
    console.log("Order found:", order.orderId);
    
    const payload = {
        order_id: order.orderId,
        first_name: order.patientName,
        last_name: "",
        email: "test@sahimed.com",
        phone: order.phoneNumber,
        address: `${order.shippingDetails?.houseNumber || ''}, ${order.shippingDetails?.street || ''}`,
        city: order.shippingDetails?.city || '',
        state: order.shippingDetails?.state || '',
        country: "India",
        zipcode: order.shippingDetails?.pincode || '',
        payment_type: order.paymentType === 'Cash on Delivery' ? 'COD' : 'Prepaid',
        amount: Number(order.totalAmount),
        products: (order.items || []).map((it) => ({
            product_id: it.productId || it.name,
            product_name: it.name,
            price: Number(it.unitPrice),
            quantity: it.quantity
        }))
    };

    console.log("Shipway payload test:", JSON.stringify(payload, null, 2));

  } finally {
    await client.close();
  }
}

main();
