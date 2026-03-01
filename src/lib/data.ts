
import { Product } from "@/context/CartContext";

export const PRODUCTS: Product[] = [
  {
    id: "br-diab-1",
    name: "Janumet 50mg/500mg",
    price: 1250,
    saltComposition: "Sitagliptin + Metformin",
    manufacturer: "MSD Pharmaceuticals",
    category: "Diabetes",
    imageUrl: "https://picsum.photos/seed/diab1/300/300",
    isGeneric: false
  },
  {
    id: "ge-diab-1",
    name: "Sitagliptin M 50/500",
    price: 240,
    saltComposition: "Sitagliptin + Metformin",
    manufacturer: "HealthLink Generic",
    category: "Diabetes",
    imageUrl: "https://picsum.photos/seed/diab2/300/300",
    isGeneric: true
  },
  {
    id: "br-heart-1",
    name: "Atorva 20mg",
    price: 450,
    saltComposition: "Atorvastatin",
    manufacturer: "Zydus Cadila",
    category: "Heart care",
    imageUrl: "https://picsum.photos/seed/heart1/300/300",
    isGeneric: false
  },
  {
    id: "ge-heart-1",
    name: "Atorvastatin Generic 20mg",
    price: 85,
    saltComposition: "Atorvastatin",
    manufacturer: "PharmaPure",
    category: "Heart care",
    imageUrl: "https://picsum.photos/seed/heart2/300/300",
    isGeneric: true
  },
  {
    id: "br-stomach-1",
    name: "Pan 40mg",
    price: 180,
    saltComposition: "Pantoprazole",
    manufacturer: "Alkem Laboratories",
    category: "Stomach care",
    imageUrl: "https://picsum.photos/seed/stomach1/300/300",
    isGeneric: false
  },
  {
    id: "ge-stomach-1",
    name: "Pantoprazole 40mg",
    price: 45,
    saltComposition: "Pantoprazole",
    manufacturer: "Standard Generics",
    category: "Stomach care",
    imageUrl: "https://picsum.photos/seed/stomach2/300/300",
    isGeneric: true
  },
  {
    id: "br-derma-1",
    name: "Betadine Ointment",
    price: 220,
    saltComposition: "Povidone-Iodine",
    manufacturer: "Win-Medicare",
    category: "Derma care",
    imageUrl: "https://picsum.photos/seed/derma1/300/300",
    isGeneric: false
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
