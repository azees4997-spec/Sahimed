const admin = require('firebase-admin');

// Initialize with your project config
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require('C:/Sahimed/website/service-account.json')), // Path to your service account
  });
}

const db = admin.firestore();

const standards = [
  { 
    id: 'terms-and-conditions', 
    title: 'Terms & Conditions', 
    content: `
      <h1>Terms and Conditions</h1>
      <p>Welcome to Sahimed. By using our services, you agree to comply with our terms.</p>
      <h3>1. Medical Disclaimer</h3>
      <p>Sahimed is a platform for ordering medicines. All prescription orders are verified by certified pharmacists.</p>
      <h3>2. User Responsibilities</h3>
      <p>You must provide accurate information and a valid prescription where required.</p>
      <p>Contact us at support@sahimed.com for any queries.</p>
    `, 
    placement: 'footer' 
  },
  { 
    id: 'faq', 
    title: 'Frequently Asked Questions', 
    content: `
      <h1>FAQs</h1>
      <h3>How do I order?</h3>
      <p>Search for your medicine, add to cart, upload prescription if needed, and checkout.</p>
      <h3>Is delivery free?</h3>
      <p>We offer free delivery on orders above ₹500.</p>
      <h3>How can I switch to generics?</h3>
      <p>Our platform automatically suggests high-quality generic alternatives (Sahi Recommended) to help you save.</p>
    `, 
    placement: 'footer' 
  },
  { 
    id: 'help', 
    title: 'Help & Support', 
    content: `
      <h1>Help Center</h1>
      <p>Need assistance? We are here for you.</p>
      <p><b>Email:</b> support@sahimed.com</p>
      <p><b>Hours:</b> 9:00 AM - 9:00 PM</p>
      <p>You can also track your orders directly from the 'Orders' section in your profile.</p>
    `, 
    placement: 'footer' 
  },
  { 
    id: 'refund-policy', 
    title: 'Refund Policy', 
    content: `
      <h1>Refund Policy</h1>
      <p>At Sahimed, we strive for customer satisfaction. If you are not happy with your purchase, we are here to help.</p>
      <h3>1. Eligibility for Refunds</h3>
      <p>Refunds are applicable only for damaged or incorrect items received. Medicine returns must be initiated within 48 hours of delivery.</p>
      <h3>2. Process</h3>
      <p>Contact us at support@sahimed.com with your order ID and photos of the product. Once verified, the refund will be processed within 5-7 working days.</p>
    `, 
    placement: 'footer' 
  },
];

async function seed() {
  console.log("Seeding pages...");
  for (const page of standards) {
    await db.collection('pages').doc(page.id).set({
      ...page,
      lastUpdated: new Date().toISOString()
    }, { merge: true });
    console.log(`- Page '${page.title}' seeded.`);
  }
  console.log("Seeding complete.");
  process.exit(0);
}

seed();
