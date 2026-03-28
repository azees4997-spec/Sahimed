import { Product } from "@/context/CartContext";

export interface ExtendedProduct extends Product {
  uses: string[];
  sideEffects: string[];
  packSize: string;
  mfrDetails: string;
  description: string;
}

export const PRODUCTS: ExtendedProduct[] = [
  {
    id: "atorfit-cv-10",
    name: "Atorfit CV 10",
    price: 58,
    mrp: 145,
    availableQuantity: 100,
    saltComposition: "Atorvastatin (10mg) + Clopidogrel (75mg)",
    manufacturer: "Micro Labs Ltd",
    category: "Cardiac",
    imageUrl: "https://picsum.photos/seed/med1/300/300",
    isGeneric: false,
    packSize: "10 Capsules",
    mfrDetails: "Micro Labs Ltd, Bangalore",
    uses: ["Prevention of Heart attack", "High cholesterol"],
    sideEffects: ["Nausea", "Stomach pain"],
    description: "Atorfit CV 10 Capsule is a combination of two medicines used to prevent heart attack and stroke."
  },
  {
    id: "telma-40",
    name: "Telma 40mg",
    price: 73,
    mrp: 210,
    availableQuantity: 150,
    saltComposition: "Telmisartan (40mg)",
    manufacturer: "Glenmark Pharmaceuticals",
    category: "Cardiac",
    imageUrl: "https://picsum.photos/seed/med2/300/300",
    isGeneric: false,
    packSize: "15 Tablets",
    mfrDetails: "Glenmark Pharmaceuticals Ltd",
    uses: ["Hypertension (high blood pressure)", "Prevention of heart attack"],
    sideEffects: ["Dizziness", "Tiredness"],
    description: "Telma 40 Tablet is a medicine used to treat high blood pressure and heart failure."
  },
  {
    id: "pan-40",
    name: "Pan 40mg",
    price: 45,
    mrp: 180,
    availableQuantity: 200,
    saltComposition: "Pantoprazole (40mg)",
    manufacturer: "Alkem Laboratories",
    category: "Digestive",
    imageUrl: "https://picsum.photos/seed/med3/300/300",
    isGeneric: false,
    packSize: "15 Tablets",
    mfrDetails: "Alkem Laboratories Ltd",
    uses: ["Acid reflux", "Peptic ulcer disease"],
    sideEffects: ["Headache", "Diarrhea"],
    description: "Pan 40 Tablet is a medicine that reduces the amount of acid produced in your stomach."
  },
  {
    id: "dolo-650",
    name: "Dolo 650mg",
    price: 25,
    mrp: 32,
    availableQuantity: 500,
    saltComposition: "Paracetamol (650mg)",
    manufacturer: "Micro Labs Ltd",
    category: "Fever",
    imageUrl: "https://picsum.photos/seed/med4/300/300",
    isGeneric: false,
    packSize: "15 Tablets",
    mfrDetails: "Micro Labs Ltd",
    uses: ["Pain relief", "Fever"],
    sideEffects: ["Nausea", "Stomach pain"],
    description: "Dolo 650 Tablet helps relieve pain and fever by blocking the release of certain chemical messengers."
  }
];

export const CATEGORIES = [
  { name: 'Fever', imageUrl: 'https://picsum.photos/seed/fever-cat/200/200', description: 'Fever & cold' },
  { name: 'Pain Relief', imageUrl: 'https://picsum.photos/seed/pain-cat/200/200', description: 'Body & muscle pain' },
  { name: 'Digestive', imageUrl: 'https://picsum.photos/seed/stomach-cat/200/200', description: 'Stomach & gut health' },
  { name: 'Cardiac', imageUrl: 'https://picsum.photos/seed/heart-cat/200/200', description: 'Heart & vascular' },
  { name: 'Diabetes', imageUrl: 'https://picsum.photos/seed/diab-cat/200/200', description: 'Sugar management' }
];
