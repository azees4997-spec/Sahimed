
import { Product } from "@/context/CartContext";

export const PRODUCTS: Product[] = [
  {
    id: "med-aspirin-81",
    name: "Ecotrin Aspirin 81mg",
    price: 499,
    saltComposition: "Acetylsalicylic Acid",
    manufacturer: "Bayer Pharmaceuticals",
    category: "Chronic",
    imageUrl: "https://picsum.photos/seed/med1/300/300"
  },
  {
    id: "med-aspirin-generic",
    name: "HealthLink Aspirin (Generic)",
    price: 199,
    saltComposition: "Acetylsalicylic Acid",
    manufacturer: "HealthLink Labs",
    category: "Chronic",
    imageUrl: "https://picsum.photos/seed/med2/300/300"
  },
  {
    id: "med-tylenol-extra",
    name: "Tylenol Extra Strength",
    price: 650,
    saltComposition: "Paracetamol",
    manufacturer: "Johnson & Johnson",
    category: "Wellness",
    imageUrl: "https://picsum.photos/seed/med3/300/300"
  },
  {
    id: "med-para-generic",
    name: "Generic Paracetamol 500mg",
    price: 89,
    saltComposition: "Paracetamol",
    manufacturer: "Generic Pharma",
    category: "Wellness",
    imageUrl: "https://picsum.photos/seed/med4/300/300"
  },
  {
    id: "med-baby-lotion",
    name: "Gentle Baby Moisturizer",
    price: 850,
    saltComposition: "Aloe Vera, Vitamin E",
    manufacturer: "BabySoft Care",
    category: "Baby Care",
    imageUrl: "https://picsum.photos/seed/baby1/300/300"
  },
  {
    id: "med-zinc-complex",
    name: "Zinc Wellness Complex",
    price: 1200,
    saltComposition: "Zinc Gluconate, Vitamin C",
    manufacturer: "Vitality Labs",
    category: "Wellness",
    imageUrl: "https://picsum.photos/seed/wellness1/300/300"
  },
  {
    id: "med-metformin-500",
    name: "Glucophage 500mg",
    price: 350,
    saltComposition: "Metformin Hydrochloride",
    manufacturer: "Merck",
    category: "Chronic",
    imageUrl: "https://picsum.photos/seed/chronic2/300/300"
  },
  {
    id: "med-met-generic",
    name: "Metform-G 500mg",
    price: 120,
    saltComposition: "Metformin Hydrochloride",
    manufacturer: "Sandoz",
    category: "Chronic",
    imageUrl: "https://picsum.photos/seed/chronic3/300/300"
  }
];

export const CATEGORIES = [
  { name: 'Chronic', icon: 'HeartPulse', description: 'Long term care medicines' },
  { name: 'Wellness', icon: 'Activity', description: 'Vitamins and supplements' },
  { name: 'Baby Care', icon: 'Baby', description: 'Essentials for your little ones' }
];
