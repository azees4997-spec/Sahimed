
'use client'

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';

export interface Product {
  id: string;
  sku?: string; 
  moleculeId?: string; 
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
  // Clinical Details
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
}

interface CartItem extends Product {
  quantity: number;
}

export interface Fee {
  id: string;
  name: string;
  originalAmount: number;
  discountedAmount: number;
  type: 'fixed' | 'percentage';
  minPurchase: number;
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

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, qty?: number) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  getItemQuantity: (id: string) => number;
  totalItems: number;
  totalPrice: number;
  location: string;
  setLocation: (loc: string) => void;
  appliedPromo: PromoCode | null;
  applyPromo: (promo: PromoCode | null) => void;
  activeFees: Fee[];
  availablePromos: PromoCode[];
  attachedPrescription: string | null;
  setAttachedPrescription: (img: string | null) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [location, setLocation] = useState('Mumbai, MH');
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [attachedPrescription, setAttachedPrescription] = useState<string | null>(null);
  
  const db = useFirestore();

  // Fetch dynamic fees with real-time sync
  const feesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'fees'), where('isActive', '==', true));
  }, [db]);
  const { data: activeFeesData } = useCollection(feesQuery);
  const activeFees: Fee[] = (activeFeesData as any[]) || [];

  // Fetch available promos
  const promosQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'promocodes'), where('isActive', '==', true));
  }, [db]);
  const { data: availablePromosData } = useCollection(promosQuery);
  const availablePromos: PromoCode[] = (availablePromosData as any[]) || [];

  useEffect(() => {
    const savedCart = localStorage.getItem('hl_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to load cart", e);
      }
    }
    const savedLoc = localStorage.getItem('hl_location');
    if (savedLoc) setLocation(savedLoc);

    const savedPrescription = localStorage.getItem('hl_prescription');
    if (savedPrescription) setAttachedPrescription(savedPrescription);
  }, []);

  useEffect(() => {
    localStorage.setItem('hl_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('hl_location', location);
  }, [location]);

  useEffect(() => {
    if (attachedPrescription) {
      localStorage.setItem('hl_prescription', attachedPrescription);
    } else {
      localStorage.removeItem('hl_prescription');
    }
  }, [attachedPrescription]);

  const addToCart = (product: Product, qty: number = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + qty } : item
        );
      }
      return [...prev, { ...product, quantity: qty }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === id);
      if (existing && existing.quantity === 1 && delta === -1) {
        return prev.filter(i => i.id !== id);
      }
      return prev.map(item => {
        if (item.id === id) {
          const newQty = Math.max(0, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  const getItemQuantity = (id: string) => {
    return cart.find(item => item.id === id)?.quantity || 0;
  };

  const clearCart = () => {
    setCart([]);
    setAppliedPromo(null);
    setAttachedPrescription(null);
  };

  const applyPromo = (promo: PromoCode | null) => setAppliedPromo(promo);

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cart, addToCart, removeFromCart, updateQuantity, clearCart, getItemQuantity, totalItems, totalPrice, location, setLocation,
      appliedPromo, applyPromo, activeFees, availablePromos, attachedPrescription, setAttachedPrescription
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
