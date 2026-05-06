
'use client'

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';
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
  const [activeFees, setActiveFees] = useState<Fee[]>([]);
  const [availablePromos, setAvailablePromos] = useState<PromoCode[]>([]);
  
  const db = useFirestore();

  // Fetch dynamic fees and promos with explicit pattern to avoid onSnapshot bugs in Firebase 11
  useEffect(() => {
    const fetchData = async () => {
      if (!db) {
        if (process.env.NODE_ENV === 'development') console.log("CART_CONTEXT: DB not ready yet...");
        return;
      }
      try {
        if (process.env.NODE_ENV === 'development') console.log("CART_CONTEXT: Synchronizing Logistics & Promo Engines...");
        
        // Fetch all and filter in memory to avoid "missing index" errors and SDK query bugs
        const feesSnap = await getDocs(collection(db, 'fees'));
        const allFees = feesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Fee));
        const activeOnes = allFees.filter(f => f.isActive === true);
        if (process.env.NODE_ENV === 'development') console.log(`CART_CONTEXT: Found ${activeOnes.length} active logistics policies.`, activeOnes);
        setActiveFees(activeOnes);

        const promosSnap = await getDocs(collection(db, 'promocodes'));
        const allPromos = promosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PromoCode));
        const activePromosList = allPromos.filter(p => p.isActive === true);
        if (process.env.NODE_ENV === 'development') console.log(`CART_CONTEXT: Found ${activePromosList.length} active promo codes.`);
        setAvailablePromos(activePromosList);
        
      } catch (err) {
        console.error("CART_CONTEXT_FETCH_CRITICAL_ERROR:", err);
      }
    };
    fetchData();
    // Refresh every 30 seconds as a fallback for real-time
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [db]);

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
