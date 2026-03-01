
import { Product } from "@/context/CartContext";

export interface ExtendedProduct extends Product {
  uses: string[];
  sideEffects: string[];
  packSize: string;
  mfrDetails: string;
}

export const PRODUCTS: ExtendedProduct[] = [
  {
    id: "br-diab-1",
    name: "Janumet 50mg/500mg",
    price: 1250,
    saltComposition: "Sitagliptin + Metformin",
    manufacturer: "MSD Pharmaceuticals",
    category: "Diabetes",
    imageUrl: "https://picsum.photos/seed/diab1/300/300",
    isGeneric: false,
    packSize: "Strip of 15 tablets",
    mfrDetails: "MSD Pharmaceuticals Pvt Ltd, Mumbai, India",
    uses: ["Type 2 Diabetes Mellitus", "Blood Sugar Control"],
    sideEffects: ["Nausea", "Stomach upset", "Hypoglycemia"],
    description: "Janumet is a combination medicine used with diet and exercise to improve blood sugar control in adults with type 2 diabetes."
  },
  {
    id: "ge-diab-1",
    name: "Sitagliptin M 50/500",
    price: 240,
    saltComposition: "Sitagliptin + Metformin",
    manufacturer: "HealthLink Generic",
    category: "Diabetes",
    imageUrl: "https://picsum.photos/seed/diab2/300/300",
    isGeneric: true,
    packSize: "Strip of 15 tablets",
    mfrDetails: "HealthLink Labs, Hyderabad, India",
    uses: ["Type 2 Diabetes Mellitus", "Affordable Glycemic Control"],
    sideEffects: ["Nausea", "Diarrhea"],
    description: "Generic Sitagliptin + Metformin provides the exact same clinical benefit as branded versions at a significantly lower cost."
  },
  {
    id: "br-heart-1",
    name: "Atorva 20mg",
    price: 450,
    saltComposition: "Atorvastatin",
    manufacturer: "Zydus Cadila",
    category: "Heart care",
    imageUrl: "https://picsum.photos/seed/heart1/300/300",
    isGeneric: false,
    packSize: "Strip of 10 tablets",
    mfrDetails: "Zydus Cadila Healthcare Ltd, Ahmedabad",
    uses: ["High Cholesterol", "Prevention of Heart Attack"],
    sideEffects: ["Muscle pain", "Weakness", "Headache"],
    description: "Atorva 20 Tablet belongs to a group of medicines called statins. It is used to lower cholesterol and reduce the risk of heart disease."
  },
  {
    id: "ge-heart-1",
    name: "Atorvastatin Generic 20mg",
    price: 85,
    saltComposition: "Atorvastatin",
    manufacturer: "PharmaPure",
    category: "Heart care",
    imageUrl: "https://picsum.photos/seed/heart2/300/300",
    isGeneric: true,
    packSize: "Strip of 10 tablets",
    mfrDetails: "PharmaPure Generics, Baddi, HP",
    uses: ["High Cholesterol", "Heart Health"],
    sideEffects: ["Joint pain", "Common cold"],
    description: "Bio-equivalent to Atorva 20mg. High quality generic cholesterol management."
  },
  {
    id: "br-stomach-1",
    name: "Pan 40mg",
    price: 180,
    saltComposition: "Pantoprazole",
    manufacturer: "Alkem Laboratories",
    category: "Stomach care",
    imageUrl: "https://picsum.photos/seed/stomach1/300/300",
    isGeneric: false,
    packSize: "Strip of 15 tablets",
    mfrDetails: "Alkem Laboratories Ltd, Mumbai",
    uses: ["Heartburn", "Acid Reflux", "Peptic Ulcer Disease"],
    sideEffects: ["Dizziness", "Flatulence", "Dry mouth"],
    description: "Pan 40 Tablet is a medicine that reduces the amount of acid produced in your stomach."
  },
  {
    id: "ge-stomach-1",
    name: "Pantoprazole 40mg",
    price: 45,
    saltComposition: "Pantoprazole",
    manufacturer: "Standard Generics",
    category: "Stomach care",
    imageUrl: "https://picsum.photos/seed/stomach2/300/300",
    isGeneric: true,
    packSize: "Strip of 15 tablets",
    mfrDetails: "Standard Generic Pharma, Gujarat",
    uses: ["Acidity", "Gastritis"],
    sideEffects: ["Headache"],
    description: "Economical alternative to Pan 40 with the same acid-blocking effectiveness."
  }
];

export const CATEGORIES = [
  { name: 'Diabetes', icon: 'Activity', description: 'Blood sugar management' },
  { name: 'Heart care', icon: 'HeartPulse', description: 'Cardiac health essentials' },
  { name: 'Stomach care', icon: 'Zap', description: 'Digestive & gut health' },
  { name: 'Liver care', icon: 'ShieldPlus', description: 'Hepatic support' },
  { name: 'Derma care', icon: 'Sparkles', description: 'Skin & dermatological solutions' },
  { name: 'Respicare', icon: 'Wind', description: 'Respiratory & lung health' }
];
