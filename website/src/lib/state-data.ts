export interface IndianState {
  id: string;
  name: string;
  description: string;
  regions: string[];
}

export const INDIAN_STATES: IndianState[] = [
  {
    id: "maharashtra",
    name: "Maharashtra",
    description: "Get 100% authentic medicines and health supplements delivered to your doorstep across Maharashtra. SahiMed provides secure delivery via regional logistics partners to all major cities and districts including Mumbai, Pune, Nagpur, and Nashik.",
    regions: ["Mumbai", "Pune", "Nagpur", "Nashik", "Thane", "Aurangabad", "Solapur", "Kolhapur", "Navi Mumbai", "Amravati"]
  },
  {
    id: "karnataka",
    name: "Karnataka",
    description: "Your trusted online e-pharmacy partner in Karnataka. SahiMed ensures professional verification by registered pharmacists and fast courier shipping to Bangalore, Hubli, Mysore, Mangalore, Belgaum, and all pin codes in the state.",
    regions: ["Bangalore", "Mysore", "Hubli-Dharwad", "Mangalore", "Belgaum", "Davanagere", "Bellary", "Shimoga"]
  },
  {
    id: "delhi",
    name: "Delhi NCR",
    description: "Premium healthcare shipping services across Delhi and the national capital region. SahiMed ensures 100% authentic drug verification and prompt delivery to all districts of New Delhi, Noida, Ghaziabad, and Gurgaon.",
    regions: ["New Delhi", "Noida", "Gurgaon", "Ghaziabad", "Faridabad", "Dwarka", "Rohini", "South Delhi"]
  },
  {
    id: "tamil-nadu",
    name: "Tamil Nadu",
    description: "Bringing authentic health products and generic alternatives to Tamil Nadu. SahiMed offers secure doorstep shipping and prescription audits for Chennai, Coimbatore, Madurai, Trichy, Salem, and rural districts.",
    regions: ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tiruppur", "Erode", "Vellore"]
  },
  {
    id: "telangana",
    name: "Telangana",
    description: "Order certified medicines online in Telangana with confidence. SahiMed delivers authentic stocks with pharmacist oversight to Hyderabad, Warangal, Nizamabad, Karimnagar, and all local towns.",
    regions: ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam", "Ramagundam", "Secunderabad"]
  },
  {
    id: "west-bengal",
    name: "West Bengal",
    description: "Authentic medicine delivery services across West Bengal. SahiMed bridges the accessibility gap by shipping genuine pharmaceutical inventory directly to Kolkata, Howrah, Durgapur, Asansol, Siliguri, and beyond.",
    regions: ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri", "Kharagpur", "Bardhaman", "Malda"]
  },
  {
    id: "gujarat",
    name: "Gujarat",
    description: "SahiMed offers trusted e-pharmacy services across Gujarat. Buy genuine prescription medicines online with direct home shipping to Ahmedabad, Surat, Vadodara, Rajkot, Bhavnagar, and Jamnagar.",
    regions: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Gandhinagar", "Anand"]
  },
  {
    id: "uttar-pradesh",
    name: "Uttar Pradesh",
    description: "Delivering authentic, cost-saving medications to Uttar Pradesh. SahiMed ensures prescription verification and secure shipping to Lucknow, Kanpur, Ghaziabad, Agra, Varanasi, Meerut, and all rural zones.",
    regions: ["Lucknow", "Kanpur", "Ghaziabad", "Agra", "Varanasi", "Meerut", "Prayagraj", "Bareilly", "Aligarh", "Gorakhpur"]
  },
  {
    id: "rajasthan",
    name: "Rajasthan",
    description: "Your digital destination for genuine medicine delivery in Rajasthan. SahiMed ships authentic healthcare products to Jaipur, Jodhpur, Kota, Bikaner, Udaipur, Ajmer, and all local pin codes.",
    regions: ["Jaipur", "Jodhpur", "Kota", "Bikaner", "Udaipur", "Ajmer", "Bhilwara", "Alwar"]
  },
  {
    id: "bihar",
    name: "Bihar",
    description: "Access registered, genuine medicines in Bihar. SahiMed guarantees pharmacist-reviewed prescription orders and prompt regional delivery to Patna, Gaya, Bhagalpur, Muzaffarpur, and all rural blocks.",
    regions: ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia", "Darbhanga", "Ara", "Begusarai"]
  },
  {
    id: "madhya-pradesh",
    name: "Madhya Pradesh",
    description: "Safe and verified e-pharmacy shipping across Madhya Pradesh. SahiMed delivers authentic wellness and medicine stock to Bhopal, Indore, Jabalpur, Gwalior, Ujjain, and small municipalities.",
    regions: ["Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain", "Sagar", "Dewas", "Satna"]
  },
  {
    id: "kerala",
    name: "Kerala",
    description: "Bringing high-standard pharmaceutical care and authentic medicine delivery to Kerala. SahiMed ships directly to Kochi, Thiruvananthapuram, Kozhikode, Thrissur, Kollam, and Malappuram.",
    regions: ["Kochi", "Thiruvananthapuram", "Kozhikode", "Thrissur", "Kollam", "Alappuzha", "Palakkad", "Kannur"]
  },
  {
    id: "andhra-pradesh",
    name: "Andhra Pradesh",
    description: "Get 100% genuine chronic care medications and health items in Andhra Pradesh. SahiMed ensures secure delivery to Visakhapatnam, Vijayawada, Guntur, Nellore, Kurnool, and Tirupati.",
    regions: ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Tirupati", "Kakinada", "Rajahmundry"]
  },
  {
    id: "odisha",
    name: "Odisha",
    description: "Trusted online healthcare provider in Odisha. SahiMed offers direct delivery of pharmacist-verified medicines to Bhubaneswar, Cuttack, Rourkela, Berhampur, Sambalpur, and coastal areas.",
    regions: ["Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur", "Puri", "Balasore"]
  },
  {
    id: "punjab",
    name: "Punjab",
    description: "Order verified, authentic medicines online in Punjab. SahiMed provides prompt shipment directly to Ludhiana, Amritsar, Jalandhar, Patiala, Bathinda, and Mohali.",
    regions: ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali", "Pathankot", "Hoshiarpur"]
  },
  {
    id: "haryana",
    name: "Haryana",
    description: "E-pharmacy delivery solutions for Haryana. SahiMed delivers genuine medicines with real-time courier tracking to Gurgaon, Faridabad, Panipat, Ambala, Yamunanagar, and Rohtak.",
    regions: ["Gurgaon", "Faridabad", "Panipat", "Ambala", "Yamunanagar", "Rohtak", "Hisar", "Karnal"]
  }
];
