"use client"

import { useState, useEffect } from 'react';
import { 
  Wallet, 
  Settings, 
  Percent, 
  IndianRupee, 
  LayoutGrid, 
  Stethoscope, 
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  Trash2,
  Plus,
  ShieldCheck,
  Tag,
  UserX,
  Users,
  ChevronDown,
  Zap
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from '@/hooks/use-toast';
import { SectionHeader } from './SectionHeader';
import { useAuth, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function WalletTab({ db, isVerified, onBack }: { db: any, isVerified: boolean, onBack: () => void }) {
  const [settings, setSettings] = useState<any>({
    maxPercentage: 20,
    maxFixedAmount: 500,
    allowGenericOnly: false,
    allowBrandedOnly: false,
    excludedCategories: [],
    excludedProducts: [],
    excludedCustomers: [], // New: Customer exclusions
    minWalletBalance: 500,
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Data for selections
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [foundProducts, setFoundProducts] = useState<any[]>([]);
  const [searchingProducts, setSearchingProducts] = useState(false);
  
  // Fetch Customers from MongoDB
  const [customers, setCustomers] = useState<any[]>([]);
  const [fetchingUsers, setFetchingUsers] = useState(false);

  const { toast } = useToast();
  const auth = useAuth();

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const authHeader = { 'Authorization': `Bearer ${idToken}` };

      const [settingsRes, categoriesRes] = await Promise.all([
        fetch('/api/admin/wallet-settings', { headers: authHeader }),
        fetch('/api/categories?limit=100', { headers: authHeader })
      ]);
      
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        if (data) setSettings(prev => ({ ...prev, ...data }));
      }
      
      if (categoriesRes.ok) {
        const cats = await categoriesRes.json();
        setAllCategories(cats);
      }

      // Fetch MongoDB Users with token
      setFetchingUsers(true);
      const usersRes = await fetch('/api/admin/users?limit=100', { headers: authHeader });
      if (usersRes.ok) {
        const users = await usersRes.json();
        setCustomers(users);
      }
    } catch (err) {
      console.error("Failed to fetch initial data", err);
    } finally {
      setLoading(false);
      setFetchingUsers(false);
    }
  };

  // Search Products
  useEffect(() => {
    if (productSearch.length < 2) {
      setFoundProducts([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingProducts(true);
      try {
        const res = await fetch(`/api/products?q=${encodeURIComponent(productSearch)}&limit=10`);
        if (res.ok) {
          const data = await res.json();
          setFoundProducts(data);
        }
      } catch (err) {
        console.error("Product search error", err);
      } finally {
        setSearchingProducts(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [productSearch]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/admin/wallet-settings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        toast({ title: "Settings Saved", description: "Wallet usage rules updated globally." });
      } else {
        throw new Error("Failed to save");
      }
    } catch (err) {
      toast({ variant: 'destructive', title: "Save Failed", description: "Could not update wallet matrix." });
    } finally {
      setSaving(false);
    }
  };

  const removeArrayItem = (key: string, index: number) => {
    const updated = [...settings[key]];
    updated.splice(index, 1);
    setSettings({ ...settings, [key]: updated });
  };

  const addArrayItem = (key: string, value: string) => {
    if (!value) return;
    if (settings[key]?.includes(value)) return;
    setSettings({ ...settings, [key]: [...(settings[key] || []), value] });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-40">
        <div className="flex flex-col items-center gap-4">
           <Loader2 className="w-12 h-12 animate-spin text-primary" />
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Loading Governance Matrix</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2 pb-20">
      <SectionHeader 
        title="Wallet Governance" 
        subtitle="Manage usage rules, caps, and entity-level exclusions" 
        onBack={onBack} 
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left: Global Limits */}
        <div className="xl:col-span-1 space-y-8">
          <Card className="rounded-[40px] border-none shadow-xl overflow-hidden bg-white">
            <CardHeader className="p-8 bg-slate-900 text-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                  <Percent className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-xl font-black uppercase font-outfit">Usage Caps</CardTitle>
                  <p className="text-[10px] font-black text-white/40 tracking-widest uppercase">Global Redemption Limits</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="space-y-4">
                <Label className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Max Percentage Per Order</Label>
                <div className="relative">
                  <Percent className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                  <Input 
                    type="number"
                    value={settings.maxPercentage}
                    onChange={(e) => setSettings({...settings, maxPercentage: Number(e.target.value)})}
                    className="h-16 pl-16 rounded-3xl bg-slate-50 border-none font-black text-lg"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Max Fixed Amount (₹)</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                  <Input 
                    type="number"
                    value={settings.maxFixedAmount}
                    onChange={(e) => setSettings({...settings, maxFixedAmount: Number(e.target.value)})}
                    className="h-16 pl-16 rounded-3xl bg-slate-50 border-none font-black text-lg"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Small Balance Threshold (₹)</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                  <Input 
                    type="number"
                    value={settings.minWalletBalance}
                    onChange={(e) => setSettings({...settings, minWalletBalance: Number(e.target.value)})}
                    className="h-16 pl-16 rounded-3xl bg-slate-50 border-none font-black text-lg"
                  />
                </div>
                <p className="text-[9px] font-bold text-slate-400 leading-normal italic">
                  * Users with balance below this can use their full balance for any order.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[40px] border-none shadow-xl overflow-hidden bg-white">
            <CardHeader className="p-8 bg-amber-500 text-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Tag className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-xl font-black uppercase font-outfit">Inventory Logic</CardTitle>
                  <p className="text-[10px] font-black text-white/60 tracking-widest uppercase">Classification Restrictions</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="flex items-center justify-between p-6 rounded-3xl bg-slate-50 border border-slate-100">
                <div className="space-y-1">
                  <p className="text-xs font-black text-slate-900 uppercase">Generic Only</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Restrict wallet to generic items</p>
                </div>
                <Switch 
                  checked={settings.allowGenericOnly}
                  onCheckedChange={(val) => setSettings({...settings, allowGenericOnly: val, allowBrandedOnly: val ? false : settings.allowBrandedOnly})}
                />
              </div>

              <div className="flex items-center justify-between p-6 rounded-3xl bg-slate-50 border border-slate-100">
                <div className="space-y-1">
                  <p className="text-xs font-black text-slate-900 uppercase">Branded Only</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Restrict wallet to branded items</p>
                </div>
                <Switch 
                  checked={settings.allowBrandedOnly}
                  onCheckedChange={(val) => setSettings({...settings, allowBrandedOnly: val, allowGenericOnly: val ? false : settings.allowGenericOnly})}
                />
              </div>
            </CardContent>
          </Card>

          {/* Cashback Engine Section */}
          <Card className="rounded-[40px] border-none shadow-xl overflow-hidden bg-white">
            <CardHeader className="p-8 bg-indigo-600 text-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-xl font-black uppercase font-outfit">Cashback Engine</CardTitle>
                  <p className="text-[10px] font-black text-white/60 tracking-widest uppercase">Loyalty & Rewards</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="flex items-center justify-between p-6 rounded-3xl bg-slate-50 border border-slate-100">
                <div className="space-y-1">
                  <p className="text-xs font-black text-slate-900 uppercase">Enable Cashback</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Reward users on delivery</p>
                </div>
                <Switch 
                  checked={settings.isCashbackEnabled}
                  onCheckedChange={(val) => setSettings({...settings, isCashbackEnabled: val})}
                />
              </div>

              <AnimatePresence>
                {settings.isCashbackEnabled && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-6 overflow-hidden"
                  >
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black text-slate-400 uppercase">Cashback Type</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          variant={settings.cashbackType === 'percentage' ? 'default' : 'outline'}
                          onClick={() => setSettings({...settings, cashbackType: 'percentage'})}
                          className="rounded-xl h-12 font-black text-[9px] uppercase"
                        >
                          Percentage (%)
                        </Button>
                        <Button 
                          variant={settings.cashbackType === 'fixed' ? 'default' : 'outline'}
                          onClick={() => setSettings({...settings, cashbackType: 'fixed'})}
                          className="rounded-xl h-12 font-black text-[9px] uppercase"
                        >
                          Fixed (₹)
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-[10px] font-black text-slate-400 uppercase">Cashback Value</Label>
                      <Input 
                        type="number"
                        value={settings.cashbackValue}
                        onChange={(e) => setSettings({...settings, cashbackValue: Number(e.target.value)})}
                        className="h-14 rounded-2xl bg-slate-50 border-none font-black"
                        placeholder={settings.cashbackType === 'percentage' ? "e.g. 5 for 5%" : "e.g. 50 for ₹50"}
                      />
                    </div>

                    <div className="space-y-4">
                      <Label className="text-[10px] font-black text-slate-400 uppercase">Min Order Amount (₹)</Label>
                      <Input 
                        type="number"
                        value={settings.minOrderAmountForCashback}
                        onChange={(e) => setSettings({...settings, minOrderAmountForCashback: Number(e.target.value)})}
                        className="h-14 rounded-2xl bg-slate-50 border-none font-black"
                        placeholder="e.g. 500"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>

        {/* Right: Entity Exclusions */}
        <div className="xl:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Category Exclusions */}
            <Card className="rounded-[40px] border-none shadow-xl bg-white flex flex-col h-full">
              <CardHeader className="p-8 border-b border-slate-50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                    <LayoutGrid className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-black uppercase font-outfit">Exempt Categories</CardTitle>
                    <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Excluded from Wallet Usage</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 flex flex-col gap-6 flex-1">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-slate-400 uppercase">Select Category</Label>
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <select 
                        onChange={(e) => addArrayItem('excludedCategories', e.target.value)}
                        className="w-full h-14 rounded-2xl bg-slate-50 border-none font-bold px-6 appearance-none cursor-pointer outline-none focus:ring-2 ring-primary/20"
                      >
                        <option value="">Choose a category...</option>
                        {allCategories.map((cat) => (
                          <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  {settings.excludedCategories.map((cat: string, idx: number) => (
                    <div key={idx} className="bg-slate-50 border border-slate-100 px-4 py-2 rounded-full flex items-center gap-3 group">
                      <span className="text-[10px] font-black text-slate-600 uppercase">{cat}</span>
                      <button onClick={() => removeArrayItem('excludedCategories', idx)} className="text-slate-300 hover:text-rose-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {settings.excludedCategories.length === 0 && (
                    <p className="text-[10px] font-bold text-slate-300 italic uppercase">No categories excluded</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Product Exclusions */}
            <Card className="rounded-[40px] border-none shadow-xl bg-white flex flex-col h-full">
              <CardHeader className="p-8 border-b border-slate-50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center">
                    <Stethoscope className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-black uppercase font-outfit">Exempt Products</CardTitle>
                    <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Specific Item Exclusions</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 flex flex-col gap-6 flex-1">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black text-slate-400 uppercase">Search & Add Product</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <div className="relative cursor-pointer">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input 
                          placeholder="Search product..." 
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          className="h-14 pl-14 rounded-2xl bg-slate-50 border-none font-bold outline-none"
                        />
                      </div>
                    </PopoverTrigger>
                    {foundProducts.length > 0 && (
                      <PopoverContent className="w-[300px] p-2 rounded-3xl shadow-3xl border-none bg-white z-[100]" align="start">
                        <div className="max-h-[300px] overflow-y-auto space-y-1">
                          {foundProducts.map((prod) => (
                            <button 
                              key={prod.id} 
                              onClick={() => {
                                addArrayItem('excludedProducts', prod.name);
                                setProductSearch('');
                                setFoundProducts([]);
                              }}
                              className="w-full text-left p-3 rounded-xl hover:bg-slate-50 flex items-center justify-between group transition-colors"
                            >
                              <div>
                                <p className="text-[10px] font-black text-slate-900 uppercase leading-none">{prod.name}</p>
                                <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">{prod.category}</p>
                              </div>
                              <Plus className="w-3.5 h-3.5 text-slate-300 group-hover:text-primary" />
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    )}
                  </Popover>
                </div>

                <div className="flex flex-wrap gap-3">
                  {settings.excludedProducts.map((prod: string, idx: number) => (
                    <div key={idx} className="bg-rose-50 border border-rose-100 px-4 py-2 rounded-full flex items-center gap-3 group">
                      <span className="text-[10px] font-black text-rose-600 uppercase">{prod}</span>
                      <button onClick={() => removeArrayItem('excludedProducts', idx)} className="text-rose-300 hover:text-rose-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {settings.excludedProducts.length === 0 && (
                    <p className="text-[10px] font-bold text-slate-300 italic uppercase">No products excluded</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Customer Exclusions */}
          <Card className="rounded-[40px] border-none shadow-xl bg-white flex flex-col h-full">
            <CardHeader className="p-8 border-b border-slate-50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                  <UserX className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-xl font-black uppercase font-outfit">Exempt Customers</CardTitle>
                  <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Restrict Specific User IDs</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 flex flex-col gap-8 flex-1">
              <div className="space-y-4">
                <Label className="text-[10px] font-black text-slate-400 uppercase">Select Customer to Exclude</Label>
                <div className="relative">
                  <select 
                    onChange={(e) => addArrayItem('excludedCustomers', e.target.value)}
                    className="w-full h-16 rounded-3xl bg-slate-50 border-none font-black px-8 appearance-none cursor-pointer outline-none focus:ring-2 ring-amber-500/20"
                  >
                    <option value="">Choose a customer...</option>
                    {customers?.map((user: any) => (
                      <option key={user.id} value={user.uid || user.id}>
                        {user.name || 'SahiMed member'} ({user.phone || user.email})
                      </option>
                    ))}
                  </select>
                  <Users className="absolute right-8 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 pointer-events-none" />
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                {settings.excludedCustomers?.map((userId: string, idx: number) => {
                  const userData = customers?.find((u: any) => (u.uid === userId || u.id === userId));
                  return (
                    <div key={idx} className="bg-amber-50 border border-amber-100 p-4 rounded-[24px] flex items-center gap-4 group">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <Users className="w-4 h-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-amber-900 uppercase leading-none">{userData?.name || 'Unknown User'}</p>
                        <p className="text-[8px] font-bold text-amber-400 uppercase mt-1">{userId.slice(0, 8)}...</p>
                      </div>
                      <button onClick={() => removeArrayItem('excludedCustomers', idx)} className="ml-2 text-amber-300 hover:text-rose-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
                {(!settings.excludedCustomers || settings.excludedCustomers.length === 0) && (
                  <div className="w-full p-8 rounded-[32px] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center gap-3 text-slate-300">
                     <Users className="w-8 h-8 opacity-30" />
                     <p className="text-[10px] font-black uppercase tracking-widest">No customers restricted</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Footer */}
          <Card className="rounded-[40px] border-none shadow-xl bg-slate-900 text-white p-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-white/10 rounded-[24px] flex items-center justify-center border border-white/10">
                  <ShieldCheck className="w-8 h-8 text-white" />
                </div>
                <div className="space-y-6">
                  {/* USE RULES */}
                  <div className="p-6 bg-slate-50 rounded-3xl space-y-4 border border-slate-100">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Wallet Usage Rules (Spending)</h4>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-xs font-black uppercase">Allow Generic Use</Label>
                        <p className="text-[9px] text-slate-400 uppercase">Enable wallet spending on generics</p>
                      </div>
                      <Switch 
                        checked={settings.enableGenericUse !== false} 
                        onCheckedChange={(val) => setSettings({...settings, enableGenericUse: val})}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-xs font-black uppercase">Allow Branded Use</Label>
                        <p className="text-[9px] text-slate-400 uppercase">Enable wallet spending on branded</p>
                      </div>
                      <Switch 
                        checked={settings.enableBrandedUse !== false} 
                        onCheckedChange={(val) => setSettings({...settings, enableBrandedUse: val})}
                      />
                    </div>
                  </div>

                  {/* CREDIT RULES */}
                  <div className="p-6 bg-primary/5 rounded-3xl space-y-4 border border-primary/10">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-primary/60">Cashback Earning Rules (Credit)</h4>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-xs font-black uppercase">Generic Cashback Credit</Label>
                        <p className="text-[9px] text-slate-400 uppercase">Earn rewards on generic items</p>
                      </div>
                      <Switch 
                        checked={settings.enableGenericCredit !== false} 
                        onCheckedChange={(val) => setSettings({...settings, enableGenericCredit: val})}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-xs font-black uppercase">Branded Cashback Credit</Label>
                        <p className="text-[9px] text-slate-400 uppercase">Earn rewards on branded items</p>
                      </div>
                      <Switch 
                        checked={settings.enableBrandedCredit !== false} 
                        onCheckedChange={(val) => setSettings({...settings, enableBrandedCredit: val})}
                      />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black tracking-tight font-outfit uppercase">Commit Governance</h3>
                    <p className="text-[10px] font-black text-white/40 tracking-widest uppercase mt-1">Rules will be applied to all live sessions instantly</p>
                  </div>
                </div>
              </div>
              <Button 
                onClick={handleSave}
                disabled={saving}
                className="h-16 px-12 rounded-full bg-white text-slate-900 hover:bg-slate-100 font-black text-xs tracking-widest uppercase gap-3 shadow-2xl shadow-white/10 active:scale-95 transition-all"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Sync Matrix
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
