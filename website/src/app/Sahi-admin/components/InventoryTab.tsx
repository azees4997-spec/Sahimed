"use client"

import { useState, useEffect, useRef } from 'react';
import { 
  Loader2, 
  Search, 
  Save, 
  Package, 
  Check,
  ChevronRight,
  TrendingDown,
  Inbox,
  LayoutGrid,
  Zap,
  ArrowUpDown
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, setDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { SectionHeader } from './SectionHeader';

export function InventoryTab({ db, isVerified, onBack }: { db: any, isVerified: boolean, onBack: () => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const { user } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/products?q=${encodeURIComponent(debouncedSearch)}&limit=50&showDisabled=true`);
        if (res.ok) {
          const data = await res.json();
          setProducts(data);
        }
      } catch (e) {
        console.error("Fetch failed", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, [debouncedSearch]);

  const handleUpdate = async (product: any, updates: any) => {
    const productId = product.id || product._id;
    setIsSaving(productId);
    
    try {
      const token = await user?.getIdToken();
      
      // 1. Sync to MongoDB
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...product, ...updates })
      });
      
      if (!res.ok) throw new Error('MongoDB Sync Failed');

      // 2. Sync to Firestore product_live_data (for real-time stock)
      if (product.sku) {
        await setDocumentNonBlocking(doc(db, 'product_live_data', product.sku), { 
           mrp: Number(updates.mrp ?? product.mrp), 
           sahimed_price: Number(updates.price ?? product.price), 
           stock_quantity: Number(updates.availableQuantity ?? product.availableQuantity),
           updatedAt: serverTimestamp() 
        }, { merge: true });
        
        // Also sync to main medicines doc
        await setDocumentNonBlocking(doc(db, 'medicines', productId), { 
           ...updates,
           updatedAt: serverTimestamp() 
        }, { merge: true });
      }

      toast({ title: "Inventory Updated", description: `${product.name} synchronized.` });
      
      // Update local state
      setProducts(prev => prev.map(p => (p.id === productId || p._id === productId) ? { ...p, ...updates } : p));
    } catch (err: any) {
      toast({ variant: 'destructive', title: "Update Failed", description: err.message });
    } finally {
      setIsSaving(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <SectionHeader 
        title="Inventory Manager" 
        subtitle="Quickly update MRP, Price, and Stock Levels"
        onBack={onBack}
      />

      {/* Search Protocol */}
      <div className="relative group">
        <div className="absolute left-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Search className="w-5 h-5 text-primary" />
        </div>
        <Input 
          placeholder="SEARCH BY NAME OR SKU..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-20 rounded-[32px] bg-white border-none pl-20 pr-10 font-black text-slate-900 shadow-2xl shadow-slate-200/50 focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-slate-300 uppercase text-xs tracking-widest"
        />
        {isLoading && (
          <div className="absolute right-8 top-1/2 -translate-y-1/2">
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode="popLayout">
          {products.map((product) => (
            <InventoryRow 
              key={product.id || product._id} 
              product={product} 
              onSave={(updates) => handleUpdate(product, updates)}
              isSaving={isSaving === (product.id || product._id)}
            />
          ))}
        </AnimatePresence>
        
        {!isLoading && products.length === 0 && (
          <div className="py-20 text-center space-y-6">
            <div className="w-20 h-20 bg-slate-100 rounded-[32px] flex items-center justify-center mx-auto opacity-50">
               <Inbox className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">No products found in matrix</p>
          </div>
        )}
      </div>
    </div>
  );
}

function InventoryRow({ product, onSave, isSaving }: { product: any, onSave: (updates: any) => void, isSaving: boolean }) {
  const [values, setValues] = useState({
    mrp: product.mrp || 0,
    price: product.price || 0,
    availableQuantity: product.availableQuantity || 0
  });

  const isDirty = values.mrp !== product.mrp || values.price !== product.price || values.availableQuantity !== product.availableQuantity;

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[40px] p-6 shadow-xl border border-white hover:shadow-2xl transition-all group overflow-hidden"
    >
      <div className="flex flex-col lg:flex-row items-center gap-8">
        {/* Identity Part */}
        <div className="flex items-center gap-6 flex-1 min-w-0">
          <div className="w-20 h-20 bg-slate-50 rounded-[28px] flex items-center justify-center shrink-0 border border-slate-100 group-hover:scale-105 transition-transform">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt="" className="w-full h-full object-contain p-2" />
            ) : (
              <Package className="w-8 h-8 text-slate-200" />
            )}
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-3">
              <h3 className="font-black text-sm text-slate-900 truncate uppercase tracking-tighter">{product.name}</h3>
              {product.isActive === false && <Badge variant="outline" className="text-[7px] font-black uppercase text-rose-500 border-rose-100 bg-rose-50/50">Inactive</Badge>}
            </div>
            <div className="flex items-center gap-3">
              <p className="text-[9px] font-black text-primary uppercase tracking-widest">{product.sku || 'NO_SKU'}</p>
              <div className="w-1 h-1 rounded-full bg-slate-200" />
              <p className="text-[9px] font-bold text-slate-400 uppercase truncate">{product.manufacturer || 'Unknown Lab'}</p>
            </div>
          </div>
        </div>

        {/* Edit Part */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 shrink-0 bg-slate-50/50 p-4 rounded-[32px] border border-slate-100">
          <div className="space-y-1.5 min-w-[80px]">
            <Label className="text-[8px] font-black uppercase tracking-widest text-slate-400 ml-3">MRP (₹)</Label>
            <Input 
              type="number" 
              value={values.mrp} 
              onChange={e => setValues({...values, mrp: Number(e.target.value)})} 
              className="h-12 rounded-2xl bg-white border-none font-bold text-xs w-24 text-center focus:ring-primary/20"
            />
          </div>
          <div className="space-y-1.5 min-w-[80px]">
            <Label className="text-[8px] font-black uppercase tracking-widest text-primary ml-3">Price (₹)</Label>
            <Input 
              type="number" 
              value={values.price} 
              onChange={e => setValues({...values, price: Number(e.target.value)})} 
              className="h-12 rounded-2xl bg-white border-none font-black text-xs w-24 text-center text-primary focus:ring-primary/20"
            />
          </div>
          <div className="space-y-1.5 min-w-[80px]">
            <Label className="text-[8px] font-black uppercase tracking-widest text-slate-400 ml-3">Stock</Label>
            <Input 
              type="number" 
              value={values.availableQuantity} 
              onChange={e => setValues({...values, availableQuantity: Number(e.target.value)})} 
              className={cn(
                "h-12 rounded-2xl bg-white border-none font-bold text-xs w-24 text-center focus:ring-primary/20",
                values.availableQuantity < 10 ? "text-rose-500" : "text-emerald-600"
              )}
            />
          </div>

          <Button 
            disabled={!isDirty || isSaving}
            onClick={() => onSave(values)}
            className={cn(
              "h-16 w-16 sm:w-auto sm:px-8 rounded-full font-black text-[10px] tracking-[0.2em] uppercase transition-all shadow-xl active:scale-90",
              isDirty ? "bg-primary shadow-primary/20" : "bg-slate-200 text-slate-400"
            )}
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                <Save className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Update Matrix</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
