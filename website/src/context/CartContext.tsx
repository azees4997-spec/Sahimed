
'use client'

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Product, CartItem, Fee, PromoCode } from '@/types';

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
  attachedPrescriptions: string[];
  setAttachedPrescriptions: (imgs: string[]) => void;
  addPrescription: (img: string) => void;
  removePrescription: (index: number) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [location, setLocation] = useState('Mumbai, MH');
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [attachedPrescriptions, setAttachedPrescriptions] = useState<string[]>([]);
  
  const db = useFirestore();

  // Fetch dynamic fees with real-time sync
  const feesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'fees'), where('isActive', '==', true));
  }, [db]);
  const { data: activeFeesData } = useCollection(feesQuery);
  const activeFees = (activeFeesData as Fee[]) || [];

  // Fetch available promos
  const promosQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'promocodes'), where('isActive', '==', true));
  }, [db]);
  const { data: availablePromosData } = useCollection(promosQuery);
  const availablePromos = (availablePromosData as PromoCode[]) || [];

  useEffect(() => {
    const savedCart = localStorage.getItem('hl_cart');
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed)) {
          // Basic validation: ensure items have an id and price
          const validCart = parsed.filter(item => item.id && typeof item.price === 'number');
          setCart(validCart);
        }
      } catch (e) {
        console.error("STABILIZATION_ERROR: Corrupt cart data in localStorage.", e);
        localStorage.removeItem('hl_cart');
      }
    }
    const savedLoc = localStorage.getItem('sahimed_location');
    if (savedLoc) {
      try {
        const parsed = JSON.parse(savedLoc);
        if (parsed.city) setLocation(parsed.city);
        else setLocation(savedLoc);
      } catch (e) {
        setLocation(savedLoc);
      }
    }

    const savedPrescriptions = localStorage.getItem('hl_prescriptions');
    if (savedPrescriptions) {
      try {
        setAttachedPrescriptions(JSON.parse(savedPrescriptions));
      } catch (e) {
        setAttachedPrescriptions([]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('hl_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    // Only save string representation if not already JSON-like
    if (location.includes('{')) return; 
    localStorage.setItem('hl_location', location); // Legacy support
    localStorage.setItem('sahimed_location', location); 
  }, [location]);

  useEffect(() => {
    localStorage.setItem('hl_prescriptions', JSON.stringify(attachedPrescriptions));
  }, [attachedPrescriptions]);

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
    setAttachedPrescriptions([]);
  };

  const applyPromo = (promo: PromoCode | null) => setAppliedPromo(promo);

  const addPrescription = (img: string) => {
    setAttachedPrescriptions(prev => [...prev, img]);
  };

  const removePrescription = (index: number) => {
    setAttachedPrescriptions(prev => prev.filter((_, i) => i !== index));
  };

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cart, addToCart, removeFromCart, updateQuantity, clearCart, getItemQuantity, totalItems, totalPrice, location, setLocation,
      appliedPromo, applyPromo, activeFees, availablePromos, attachedPrescriptions, setAttachedPrescriptions: setAttachedPrescriptions,
      addPrescription, removePrescription
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
