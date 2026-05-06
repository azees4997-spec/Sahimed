export interface Product {
  id: string;
  sku?: string;
  moleculeId?: string;
  brand?: string;
  name: string;
  price: number;
  mrp: number;
  availableQuantity: number;
  saltComposition: string;
  manufacturer: string;
  category: string;
  imageUrl: string;
  isGeneric?: boolean;
  prescriptionRequired?: boolean;
  packSize?: string;
  description?: string;
  howToUse?: string;
  treatment?: string;
  safetyAdvice?: string;
  sideEffects?: string;
  alcoholInteraction?: string;
  pregnancyInteraction?: string;
  lactationInteraction?: string;
  drivingInteraction?: string;
  kidneyInteraction?: string;
  liverInteraction?: string;
  liveData?: {
    mrp: number;
    sahimed_price: number;
    stock_quantity: number;
  };
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Fee {
  id: string;
  name: string;
  originalAmount: number;
  discountedAmount: number;
  type: 'fixed' | 'percentage';
  minPurchase: number;
  tiers?: { minOrder: number; charge: number }[];
  isActive: boolean;
}

export interface PromoCode {
  id: string;
  code: string;
  description: string;
  discountType: 'fixed' | 'percentage';
  discountValue: number;
  maxDiscount?: number;
  minOrderValue: number;
  applyTo: 'cart' | 'product' | 'customer' | 'both';
  targetId?: string;
  isActive: boolean;
}

export interface AdminProfile {
  id: string;
  role: 'admin' | 'pharmacist' | 'sub-admin';
  permissions: Record<string, boolean>;
  activatedAt: string;
  email?: string;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  address: any; // To be refined
}
