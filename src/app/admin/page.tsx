
"use client"

import { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  LogOut, 
  Loader2, 
  Package, 
  ShoppingBag, 
  ShieldAlert,
  UserPlus,
  Lock,
  FileText,
  Trash2,
  Plus,
  Edit2,
  Users,
  BellRing,
  Dna,
  Receipt,
  Ticket,
  Home,
  ExternalLink,
  Copy,
  Check,
  ClipboardList,
  ChevronRight,
  TrendingUp,
  Activity,
  User
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  useUser, 
  useFirestore, 
  useAuth, 
  useMemoFirebase, 
  useCollection,
  setDocumentNonBlocking,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking,
  addDocumentNonBlocking
} from '@/firebase';
import { doc, collection, query, collectionGroup, getDoc, serverTimestamp, where, limit } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type AdminTab = 'overview' | 'itemMaster' | 'moleculeMaster' | 'enquiries' | 'fulfillment' | 'customers' | 'stockAlerts' | 'fees' | 'promocodes';

export default function AdminConsole() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const performVerification = async () => {
    if (!db || !user) return;
    setIsVerifying(true);
    try {
      const snap = await getDoc(doc(db, 'adminProfiles', user.uid));
      if (snap.exists() && (snap.data().role === 'admin' || snap.data().role === 'pharmacist')) {
        setIsVerified(true);
        toast({ title: "Authority Verified", description: "Admin access active." });
      } else {
        setIsVerified(false);
      }
    } catch (err) {
      console.error("Verification failed", err);
      setIsVerified(false);
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (user && !isVerified) {
      performVerification();
    } else if (!user) {
      setIsVerified(false);
    }
  }, [user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Access Denied', description: 'Invalid admin credentials.' });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setIsVerified(false);
    signOut(auth);
  };

  const copyUid = () => {
    if (user) {
      navigator.clipboard.writeText(user.uid);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "UID Copied", description: "Use this to create an Admin Profile." });
    }
  };

  const bootstrapAdmin = () => {
    if (!db || !user) return;
    setDocumentNonBlocking(doc(db, 'adminProfiles', user.uid), {
      id: user.uid,
      role: 'admin',
      activatedAt: new Date().toISOString()
    }, { merge: true });
    
    setIsVerifying(true);
    toast({ title: 'Requesting Authority', description: 'Provisioning admin role... please wait.' });
    setTimeout(performVerification, 3000);
  };

  if (isUserLoading || isVerifying) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F7F6] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Syncing Authority...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F7F6] p-4">
        <Card className="max-w-md w-full rounded-[40px] shadow-2xl border-none overflow-hidden bg-white">
          <CardHeader className="text-center p-10 bg-primary text-white">
            <Lock className="w-10 h-10 mx-auto mb-4 opacity-50" />
            <CardTitle className="text-2xl font-black uppercase tracking-tight text-white">Admin Gateway</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Admin Email</Label>
                <input type="email" placeholder="admin@healthlink.com" value={email} onChange={e => setEmail(e.target.value)} required className="w-full h-14 rounded-2xl bg-gray-50 border-none px-4 font-bold outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Password</Label>
                <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required className="w-full h-14 rounded-2xl bg-gray-50 border-none px-4 font-bold outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <Button type="submit" disabled={authLoading} className="w-full h-14 rounded-full font-black uppercase tracking-widest mt-4 shadow-xl shadow-primary/20">
                {authLoading ? <Loader2 className="animate-spin" /> : "Authorize Access"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F7F6] p-4">
        <Card className="max-w-md w-full rounded-[40px] shadow-2xl border-none p-10 text-center space-y-6 bg-white">
          <ShieldAlert className="w-12 h-12 text-orange-500 mx-auto" />
          <div className="space-y-2">
            <h2 className="text-xl font-black uppercase">Restricted Area</h2>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed">Logged in as {user.email || 'User'}, but admin role is not detected.</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-2xl space-y-2">
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Your Unique Identifier (UID)</p>
            <div className="flex items-center gap-2 bg-white border p-3 rounded-xl">
              <code className="text-[10px] font-black text-gray-600 truncate flex-1">{user.uid}</code>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-primary" onClick={copyUid}>
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-3 pt-6 border-t">
            <Button onClick={bootstrapAdmin} className="w-full gap-2 rounded-full h-14 bg-orange-600 hover:bg-orange-700 uppercase font-black text-[10px] tracking-widest">
              <UserPlus className="w-4 h-4" /> Initialize Admin Role
            </Button>
            <Button onClick={performVerification} variant="outline" className="w-full h-14 rounded-full font-black uppercase text-[10px] border-2">
               Refresh Authority
            </Button>
            <Button onClick={handleLogout} variant="ghost" className="w-full text-gray-400 font-bold uppercase text-[9px] tracking-widest">Sign Out</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7F6]">
      <header className="bg-white border-b sticky top-0 z-50 h-20">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button onClick={() => setActiveTab('overview')} className="flex items-center gap-2 group">
              <div className="bg-primary p-1.5 rounded-lg group-active:scale-95 transition-transform">
                <ShieldCheck className="text-white w-4 h-4" />
              </div>
              <div className="flex flex-col items-start leading-none">
                <span className="font-black text-lg tracking-tighter text-gray-900 uppercase">Admin Center</span>
                <span className="text-[8px] font-black text-primary uppercase tracking-[0.3em]">Management Portal</span>
              </div>
            </button>
            <nav className="hidden xl:flex gap-1 overflow-x-auto scrollbar-hide">
              {[
                { id: 'overview', label: 'Home', icon: Home },
                { id: 'enquiries', label: 'Prescriptions', icon: FileText },
                { id: 'fulfillment', label: 'Orders', icon: ShoppingBag },
                { id: 'promocodes', label: 'Offers', icon: Ticket },
                { id: 'fees', label: 'Service Fees', icon: Receipt },
                { id: 'customers', label: 'Customers', icon: Users },
                { id: 'itemMaster', label: 'Products', icon: Package },
                { id: 'moleculeMaster', label: 'Formulas', icon: Dna },
              ].map(tab => (
                <Button 
                  key={tab.id} 
                  variant={activeTab === tab.id ? 'secondary' : 'ghost'} 
                  onClick={() => setActiveTab(tab.id as AdminTab)} 
                  className={`rounded-full gap-1.5 px-4 font-black text-[9px] uppercase tracking-widest h-10 ${activeTab === tab.id ? 'bg-primary/5 text-primary' : 'text-gray-400'}`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </Button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" target="_blank">
              <Button variant="outline" className="rounded-xl border-2 font-black text-[9px] uppercase gap-1.5 h-10 px-4 hidden sm:flex">
                <ExternalLink className="w-3.5 h-3.5" /> Live Store
              </Button>
            </Link>
            <Button variant="ghost" onClick={handleLogout} size="icon" className="w-10 h-10 rounded-xl text-gray-400 hover:text-red-500"><LogOut className="w-4 h-4" /></Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {activeTab === 'overview' && <OverviewTab db={db} setTab={setActiveTab} isVerified={isVerified} />}
        {activeTab === 'enquiries' && <EnquiriesTab db={db} isVerified={isVerified} />}
        {activeTab === 'fulfillment' && <FulfillmentTab db={db} isVerified={isVerified} />}
        {activeTab === 'customers' && <CustomersTab db={db} isVerified={isVerified} />}
        {activeTab === 'itemMaster' && <ItemMasterTab db={db} isVerified={isVerified} />}
        {activeTab === 'moleculeMaster' && <MoleculeMasterTab db={db} isVerified={isVerified} />}
        {activeTab === 'fees' && <FeesTab db={db} isVerified={isVerified} />}
        {activeTab === 'promocodes' && <PromoCodesTab db={db} isVerified={isVerified} />}
      </main>
    </div>
  );
}

function FeesTab({ db, isVerified }: { db: any, isVerified: boolean }) {
  const feesQuery = useMemoFirebase(() => isVerified ? query(collection(db, 'fees')) : null, [db, isVerified]);
  const { data: fees, isLoading } = useCollection(feesQuery);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFee, setEditingFee] = useState<any>(null);
  const { toast } = useToast();

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-black uppercase text-gray-900 tracking-tight">Service Fees</h2>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Manage checkout-level service and delivery charges</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingFee(null)} className="rounded-full h-12 px-8 font-black text-[10px] uppercase tracking-widest gap-2 bg-primary shadow-xl shadow-primary/20">
              <Plus className="w-4 h-4" /> Add New Fee
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[40px] border-none shadow-2xl p-0 overflow-hidden">
            <div className="bg-primary p-8 text-white">
              <DialogTitle className="text-2xl font-black uppercase tracking-tight">Configure Service Fee</DialogTitle>
              <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mt-1">Global cart-level adjustment</p>
            </div>
            <div className="p-8">
              <FeeForm db={db} initialData={editingFee} onSuccess={() => setIsFormOpen(false)} />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>
        ) : fees?.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-[40px] border-2 border-dashed">
            <Receipt className="w-12 h-12 text-gray-100 mx-auto mb-4" />
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No service fees configured</p>
          </div>
        ) : fees?.map(fee => (
          <Card key={fee.id} className="rounded-[32px] overflow-hidden border-none shadow-sm bg-white hover:shadow-xl transition-all group">
            <CardContent className="p-8 space-y-6">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary">
                  <Receipt className="w-6 h-6" />
                </div>
                <Badge className={fee.isActive ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400"}>
                  {fee.isActive ? "ACTIVE" : "DISABLED"}
                </Badge>
              </div>
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight">{fee.name}</h3>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-black text-primary">{fee.amount}{fee.type === 'percentage' ? '%' : '₹'}</span>
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{fee.type === 'fixed' ? 'FIXED_AMT' : 'PERCENTAGE'}</span>
                </div>
              </div>
              <div className="pt-6 border-t flex justify-end gap-2">
                <Button variant="ghost" size="icon" onClick={() => { setEditingFee(fee); setIsFormOpen(true); }} className="rounded-xl h-10 w-10 hover:bg-primary/5">
                  <Edit2 className="w-4 h-4 text-gray-400" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => { deleteDocumentNonBlocking(doc(db, 'fees', fee.id)); toast({ title: "Fee Removed" }); }} className="rounded-xl h-10 w-10 hover:bg-red-50">
                  <Trash2 className="w-4 h-4 text-red-300" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function FeeForm({ db, initialData, onSuccess }: { db: any, initialData?: any, onSuccess: () => void }) {
  const [form, setForm] = useState({
    name: initialData?.name || '',
    amount: initialData?.amount || 0,
    type: initialData?.type || 'fixed',
    isActive: initialData?.isActive ?? true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, amount: Number(form.amount) };
    if (initialData?.id) {
      updateDocumentNonBlocking(doc(db, 'fees', initialData.id), payload);
    } else {
      addDocumentNonBlocking(collection(db, 'fees'), payload);
    }
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Fee Label (e.g. Service Fee)</Label>
        <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="rounded-2xl h-14 bg-gray-50 border-none font-bold text-sm px-6" />
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Value</Label>
          <Input type="number" value={form.amount} onChange={e => setForm({...form, amount: Number(e.target.value)})} required className="rounded-2xl h-14 bg-gray-50 border-none font-bold text-sm px-6" />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Type</Label>
          <select value={form.type} onChange={e => setForm({...form, type: e.target.value as any})} className="w-full h-14 rounded-2xl bg-gray-50 border-none px-6 font-bold outline-none text-sm appearance-none">
            <option value="fixed">Fixed (₹)</option>
            <option value="percentage">Percentage (%)</option>
          </select>
        </div>
      </div>
      <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl">
         <input type="checkbox" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})} className="w-5 h-5 accent-primary rounded-lg" />
         <Label className="text-[11px] font-black uppercase tracking-tight text-gray-700">Set Fee as Active</Label>
      </div>
      <Button type="submit" className="w-full h-16 rounded-full font-black uppercase text-[11px] tracking-[0.2em] bg-primary shadow-2xl shadow-primary/30 mt-4">
        Save Fee
      </Button>
    </form>
  );
}

function PromoCodesTab({ db, isVerified }: { db: any, isVerified: boolean }) {
  const promosQuery = useMemoFirebase(() => isVerified ? query(collection(db, 'promocodes')) : null, [db, isVerified]);
  const { data: promos, isLoading } = useCollection(promosQuery);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<any>(null);
  const { toast } = useToast();

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-black uppercase text-gray-900 tracking-tight">Offers & Promos</h2>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Create rewards and discounts for customers</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingPromo(null)} className="rounded-full h-12 px-8 font-black text-[10px] uppercase tracking-widest gap-2 bg-primary shadow-xl shadow-primary/20">
              <Plus className="w-4 h-4" /> Create Offer
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[40px] border-none shadow-2xl p-0 overflow-hidden max-w-2xl">
            <div className="bg-primary p-8 text-white">
              <DialogTitle className="text-2xl font-black uppercase tracking-tight">Offer Builder</DialogTitle>
              <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mt-1">Configure targeted customer rewards</p>
            </div>
            <div className="p-8">
              <PromoForm db={db} initialData={editingPromo} onSuccess={() => setIsFormOpen(false)} />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading ? (
          <div className="col-span-full py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>
        ) : promos?.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-[40px] border-2 border-dashed">
            <Ticket className="w-12 h-12 text-gray-100 mx-auto mb-4" />
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No active offers currently</p>
          </div>
        ) : promos?.map(promo => (
          <Card key={promo.id} className="rounded-[32px] overflow-hidden border-none shadow-sm bg-white hover:shadow-2xl transition-all duration-500 relative">
             <div className="absolute top-0 right-0 h-24 w-24 bg-primary/5 rounded-bl-[100px] -mr-8 -mt-8" />
             <CardContent className="p-8 space-y-6 relative z-10">
               <div className="flex justify-between items-start">
                 <div className="flex flex-col gap-1">
                   <code className="bg-primary/10 text-primary font-black px-4 py-1.5 rounded-xl text-lg tracking-widest uppercase">{promo.code}</code>
                   <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">{promo.description}</p>
                 </div>
                 <Badge className={promo.isActive ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400"}>
                   {promo.isActive ? "ACTIVE" : "PAUSED"}
                 </Badge>
               </div>
               
               <div className="grid grid-cols-2 gap-6 pt-4 border-t border-dashed">
                 <div>
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Discount</p>
                    <p className="text-xl font-black text-primary">{promo.discountValue}{promo.discountType === 'percentage' ? '%' : '₹'} Off</p>
                 </div>
                 <div>
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Target</p>
                    <Badge variant="secondary" className="text-[8px] uppercase font-black px-3">{promo.applyTo}</Badge>
                 </div>
                 <div>
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Criteria</p>
                    <p className="text-[11px] font-black text-gray-700">Min. ₹{promo.minOrderValue || 0}</p>
                 </div>
                 <div className="flex justify-end items-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => { setEditingPromo(promo); setIsFormOpen(true); }} className="rounded-xl h-10 w-10 hover:bg-primary/5">
                      <Edit2 className="w-4 h-4 text-gray-400" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => { deleteDocumentNonBlocking(doc(db, 'promocodes', promo.id)); toast({ title: "Promo Removed" }); }} className="rounded-xl h-10 w-10 hover:bg-red-50">
                      <Trash2 className="w-4 h-4 text-red-300" />
                    </Button>
                 </div>
               </div>
             </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function PromoForm({ db, initialData, onSuccess }: { db: any, initialData?: any, onSuccess: () => void }) {
  const [form, setForm] = useState({
    code: initialData?.code || '',
    description: initialData?.description || '',
    discountType: initialData?.discountType || 'fixed',
    discountValue: initialData?.discountValue || 0,
    minOrderValue: initialData?.minOrderValue || 0,
    applyTo: initialData?.applyTo || 'cart',
    targetId: initialData?.targetId || '',
    isActive: initialData?.isActive ?? true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { 
      ...form, 
      discountValue: Number(form.discountValue), 
      minOrderValue: Number(form.minOrderValue),
      updatedAt: serverTimestamp() 
    };
    if (initialData?.id) {
      updateDocumentNonBlocking(doc(db, 'promocodes', initialData.id), payload);
    } else {
      addDocumentNonBlocking(collection(db, 'promocodes'), payload);
    }
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6 py-2 max-h-[70vh] overflow-y-auto pr-4 scrollbar-hide">
      <div className="col-span-2 space-y-2">
        <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Offer Code</Label>
        <Input value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} required className="rounded-2xl h-14 bg-gray-50 border-none font-bold text-lg px-6 tracking-widest" placeholder="SAVE50" />
      </div>
      <div className="col-span-2 space-y-2">
        <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Customer-Facing Description</Label>
        <Input value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="rounded-2xl h-14 bg-gray-50 border-none font-bold text-sm px-6" placeholder="Save 50% on all items" />
      </div>
      <div className="space-y-2">
        <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Discount Type</Label>
        <select value={form.discountType} onChange={e => setForm({...form, discountType: e.target.value as any})} className="w-full h-14 rounded-2xl bg-gray-50 border-none px-6 font-bold outline-none text-sm appearance-none">
          <option value="fixed">Fixed (₹)</option>
          <option value="percentage">Percentage (%)</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Discount Value</Label>
        <Input type="number" value={form.discountValue} onChange={e => setForm({...form, discountValue: Number(e.target.value)})} required className="rounded-2xl h-14 bg-gray-50 border-none font-bold text-sm px-6" />
      </div>
      <div className="space-y-2">
        <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Min. Purchase (₹)</Label>
        <Input type="number" value={form.minOrderValue} onChange={e => setForm({...form, minOrderValue: Number(e.target.value)})} className="rounded-2xl h-14 bg-gray-50 border-none font-bold text-sm px-6" />
      </div>
      <div className="space-y-2">
        <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Target Category</Label>
        <select value={form.applyTo} onChange={e => setForm({...form, applyTo: e.target.value as any})} className="w-full h-14 rounded-2xl bg-gray-50 border-none px-6 font-bold outline-none text-sm appearance-none">
          <option value="cart">Global Cart</option>
          <option value="product">Specific Product</option>
          <option value="customer">Specific Customer (UID)</option>
          <option value="both">Hybrid</option>
        </select>
      </div>
      {form.applyTo !== 'cart' && (
        <div className="col-span-2 space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Target Identifier (SKU ID or Customer UID)</Label>
          <Input value={form.targetId} onChange={e => setForm({...form, targetId: e.target.value})} placeholder="Paste Identifier here..." className="rounded-2xl h-14 bg-gray-50 border-none font-bold text-[10px] px-6" />
        </div>
      )}
      <div className="col-span-2 flex items-center gap-3 bg-gray-50 p-4 rounded-2xl mt-4">
         <input type="checkbox" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})} className="w-5 h-5 accent-primary rounded-lg" />
         <Label className="text-[11px] font-black uppercase tracking-tight text-gray-700">Activate Promotion</Label>
      </div>
      <div className="col-span-2 pt-6">
        <Button type="submit" className="w-full h-16 rounded-full font-black uppercase text-[11px] tracking-[0.2em] bg-primary shadow-2xl shadow-primary/30">
          Save Strategy
        </Button>
      </div>
    </form>
  );
}

function OverviewTab({ db, setTab, isVerified }: { db: any, setTab: (t: AdminTab) => void, isVerified: boolean }) {
  const medsQuery = useMemoFirebase(() => query(collection(db, 'medicines')), [db]);
  const molsQuery = useMemoFirebase(() => query(collection(db, 'moleculeMaster')), [db]);
  const usersQuery = useMemoFirebase(() => isVerified ? query(collection(db, 'userProfiles')) : null, [db, isVerified]);
  const stockAlertsQuery = useMemoFirebase(() => isVerified ? query(collection(db, 'stockEnquiries')) : null, [db, isVerified]);
  const presQuery = useMemoFirebase(() => isVerified ? query(collectionGroup(db, 'prescriptions')) : null, [db, isVerified]);
  const ordersQuery = useMemoFirebase(() => isVerified ? query(collectionGroup(db, 'orders')) : null, [db, isVerified]);

  const { data: meds } = useCollection(medsQuery);
  const { data: mols } = useCollection(molsQuery);
  const { data: pres } = useCollection(presQuery);
  const { data: orders } = useCollection(ordersQuery);
  const { data: users } = useCollection(usersQuery);
  const { data: alerts } = useCollection(stockAlertsQuery);

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">Admin Dashboard</h1>
        <div className="flex gap-4">
           <Card className="rounded-2xl px-6 py-2 bg-white border-none shadow-sm flex items-center gap-3">
              <TrendingUp className="w-4 h-4 text-accent" />
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Revenue Status</span>
                <span className="text-xs font-black text-gray-900">HEALTHY</span>
              </div>
           </Card>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-8 gap-4">
        {[
          { label: 'Prescriptions', icon: FileText, count: pres?.filter(p => p.status === 'Pending Review').length || 0, tab: 'enquiries' as AdminTab, color: 'text-blue-500' },
          { label: 'Orders', icon: ShoppingBag, count: orders?.filter(o => o.status !== 'Delivered').length || 0, tab: 'fulfillment' as AdminTab, color: 'text-primary' },
          { label: 'Offers', icon: Ticket, count: 0, tab: 'promocodes' as AdminTab, color: 'text-purple-500' },
          { label: 'Fees', icon: Receipt, count: 0, tab: 'fees' as AdminTab, color: 'text-orange-500' },
          { label: 'Customers', icon: Users, count: users?.length || 0, tab: 'customers' as AdminTab, color: 'text-indigo-500' },
          { label: 'Alerts', icon: BellRing, count: alerts?.length || 0, tab: 'stockAlerts' as AdminTab, color: 'text-red-500' },
          { label: 'Products', icon: Package, count: meds?.length || 0, tab: 'itemMaster' as AdminTab, color: 'text-accent' },
          { label: 'Formulas', icon: Dna, count: mols?.length || 0, tab: 'moleculeMaster' as AdminTab, color: 'text-emerald-500' },
        ].map(card => (
          <Card key={card.label} className="rounded-[32px] p-5 border-none shadow-sm hover:shadow-2xl transition-all cursor-pointer bg-white group text-center" onClick={() => setTab(card.tab)}>
            <div className={cn("w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform", card.color)}>
               <card.icon className="w-6 h-6" />
            </div>
            <CardTitle className="text-[8px] font-black uppercase text-gray-400 tracking-widest mb-1">{card.label}</CardTitle>
            <p className="text-xl font-black text-gray-900">{card.count}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

function EnquiriesTab({ db, isVerified }: { db: any, isVerified: boolean }) {
  const presQuery = useMemoFirebase(() => isVerified ? query(collectionGroup(db, 'prescriptions')) : null, [db, isVerified]);
  const medsQuery = useMemoFirebase(() => query(collection(db, 'medicines')), [db]);
  const { data: enquiries, isLoading } = useCollection(presQuery);
  const { data: medicines } = useCollection(medsQuery);
  const { toast } = useToast();

  const [filter, setFilter] = useState<'Pending' | 'Open' | 'Completed'>('Pending');
  const [digitizingEnquiry, setDigitizingEnquiry] = useState<any>(null);

  const filteredEnquiries = enquiries?.filter(enq => {
    if (filter === 'Pending') return enq.status === 'Pending Review';
    if (filter === 'Open') return enq.status === 'Acknowledged' || enq.status === 'Processing';
    if (filter === 'Completed') return enq.status === 'Completed' || enq.status === 'Ordered';
    return true;
  });

  const updateStatus = (enquiry: any, status: string) => {
    if (!enquiry.userId) return;
    const ref = doc(db, 'userProfiles', enquiry.userId, 'prescriptions', enquiry.id);
    updateDocumentNonBlocking(ref, { status });
    toast({ title: "Update Saved", description: `Prescription status changed to ${status}` });
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black uppercase text-gray-900 tracking-tight">Prescription Queue</h2>
        <div className="flex bg-white p-1.5 rounded-full border shadow-sm">
          {(['Pending', 'Open', 'Completed'] as const).map(f => (
            <Button 
              key={f} 
              variant={filter === f ? 'secondary' : 'ghost'} 
              size="sm" 
              onClick={() => setFilter(f)}
              className={`rounded-full px-8 font-black text-[10px] uppercase tracking-widest h-10 transition-all ${filter === f ? 'bg-primary text-white hover:bg-primary/90 shadow-lg' : 'text-gray-400'}`}
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {isLoading ? (
          <div className="col-span-full py-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>
        ) : filteredEnquiries?.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-[40px] border-2 border-dashed">
            <Activity className="w-12 h-12 text-gray-100 mx-auto mb-4" />
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No orders in this queue</p>
          </div>
        ) : filteredEnquiries?.map(enq => (
          <Card key={enq.id} className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white hover:shadow-2xl transition-all duration-500 flex flex-col group">
             <div className="aspect-[4/5] relative bg-gray-100 overflow-hidden">
                <img src={enq.imageUrl} alt="Prescription" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <Badge className="absolute top-6 right-6 text-white text-[9px] font-black uppercase bg-primary border-none shadow-xl px-4 py-1.5 rounded-full">{enq.status}</Badge>
             </div>
             <CardContent className="p-8 flex-1 flex flex-col bg-white">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Customer Name</p>
                <p className="text-xl font-black text-gray-900 uppercase tracking-tight mb-6">{enq.patientName || 'Anonymous'}</p>
                
                <div className="mt-auto space-y-3">
                  <Dialog open={digitizingEnquiry?.id === enq.id} onOpenChange={(open) => !open && setDigitizingEnquiry(null)}>
                    <DialogTrigger asChild>
                      <Button onClick={() => setDigitizingEnquiry(enq)} className="w-full rounded-full h-14 font-black uppercase text-[10px] tracking-[0.2em] gap-3 bg-primary shadow-xl shadow-primary/20">
                        <ClipboardList className="w-5 h-5" /> Digitize & Order
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-[40px] max-w-5xl border-none shadow-3xl p-0 overflow-hidden">
                      <div className="bg-primary p-8 text-white">
                        <DialogTitle className="text-2xl font-black uppercase tracking-tight">Digitization Flow</DialogTitle>
                        <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mt-1">Converting prescription to digital order</p>
                      </div>
                      <div className="p-8">
                        {digitizingEnquiry && (
                          <DigitizationWorkflow 
                            db={db} 
                            enquiry={digitizingEnquiry} 
                            medicines={medicines || []} 
                            onSuccess={() => {
                              updateStatus(digitizingEnquiry, 'Completed');
                              setDigitizingEnquiry(null);
                            }} 
                          />
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
             </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function FulfillmentTab({ db, isVerified }: { db: any, isVerified: boolean }) {
  const ordersQuery = useMemoFirebase(() => isVerified ? query(collectionGroup(db, 'orders')) : null, [db, isVerified]);
  const { data: orders, isLoading } = useCollection(ordersQuery);
  const { toast } = useToast();

  const updateStatus = (order: any, status: string) => {
    if (!order.userId) return;
    const ref = doc(db, 'userProfiles', order.userId, 'orders', order.id);
    updateDocumentNonBlocking(ref, { status });
    toast({ title: "Order Updated", description: `Order ${order.id.substring(0,6)} is ${status}` });
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2">
      <h2 className="text-3xl font-black uppercase text-gray-900 tracking-tight">Fulfillment Center</h2>
      <Card className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 border-b">
            <tr>
              <th className="px-10 py-8">Order ID</th>
              <th className="px-10 py-8">Customer ID</th>
              <th className="px-10 py-8">Order Total</th>
              <th className="px-10 py-8">Status</th>
              <th className="px-10 py-8 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr><td colSpan={5} className="p-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" /></td></tr>
            ) : orders?.map(order => (
              <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-10 py-8">
                   <div className="flex flex-col">
                      <span className="font-black text-sm uppercase">#{order.id.substring(0,8)}</span>
                   </div>
                </td>
                <td className="px-10 py-8 font-bold text-[11px] text-gray-500">{order.userId?.substring(0,10)}...</td>
                <td className="px-10 py-8 font-black text-primary text-lg">₹{order.totalAmount}</td>
                <td className="px-10 py-8">
                   <Badge variant="outline" className="text-[9px] font-black uppercase px-4 py-1.5 rounded-full border-2">{order.status}</Badge>
                </td>
                <td className="px-10 py-8 text-right">
                  <div className="flex justify-end gap-3">
                    <Button onClick={() => updateStatus(order, 'Shipped')} size="sm" className="rounded-full h-10 px-6 text-[9px] uppercase font-black bg-blue-600 shadow-lg shadow-blue-200">Ship</Button>
                    <Button onClick={() => updateStatus(order, 'Delivered')} variant="outline" size="sm" className="rounded-full h-10 px-6 text-[9px] uppercase font-black border-2 hover:bg-green-50 hover:text-green-600 hover:border-green-600">Deliver</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function CustomersTab({ db, isVerified }: { db: any, isVerified: boolean }) {
  const usersQuery = useMemoFirebase(() => isVerified ? query(collection(db, 'userProfiles')) : null, [db, isVerified]);
  const { data: users, isLoading } = useCollection(usersQuery);

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-black uppercase text-gray-900 tracking-tight">Customer Management</h2>
      <Card className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 border-b">
            <tr>
              <th className="px-10 py-8">ID</th>
              <th className="px-10 py-8">Customer Name</th>
              <th className="px-10 py-8">Contact</th>
              <th className="px-10 py-8">Primary Hub</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr><td colSpan={4} className="p-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" /></td></tr>
            ) : users?.map(u => (
              <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-10 py-8 text-[11px] font-black text-primary uppercase">{u.id.substring(0,12)}</td>
                <td className="px-10 py-8">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
                         <User className="w-5 h-5" />
                      </div>
                      <span className="font-black text-sm uppercase">{u.name || 'Anonymous User'}</span>
                   </div>
                </td>
                <td className="px-10 py-8 text-[11px] font-bold text-gray-500">{u.phoneNumber || 'N/A'}</td>
                <td className="px-10 py-8"><CustomerAddressCell db={db} userId={u.id} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function ItemMasterTab({ db }: { db: any }) {
  const medsQuery = useMemoFirebase(() => query(collection(db, 'medicines')), [db]);
  const { data: medicines, isLoading } = useCollection(medsQuery);

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-black uppercase text-gray-900 tracking-tight">Product Catalog</h2>
      <Card className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 border-b">
            <tr>
              <th className="px-10 py-8">SKU</th>
              <th className="px-10 py-8">Product Name</th>
              <th className="px-10 py-8">Price</th>
              <th className="px-10 py-8">Stock Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr><td colSpan={4} className="p-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" /></td></tr>
            ) : medicines?.map(med => (
              <tr key={med.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-10 py-8 text-[11px] font-black text-gray-400 tracking-widest uppercase">{med.sku || 'N/A'}</td>
                <td className="px-10 py-8">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-50 rounded-2xl p-2 border border-gray-100">
                         <img src={med.imageUrl} alt={med.name} className="w-full h-full object-contain" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-black text-sm uppercase tracking-tight">{med.name}</span>
                        <span className="text-[9px] text-gray-400 uppercase tracking-[0.2em]">{med.manufacturer}</span>
                      </div>
                   </div>
                </td>
                <td className="px-10 py-8 font-black text-primary text-lg">₹{med.price}</td>
                <td className="px-10 py-8">
                   <div className="flex items-center gap-3">
                      <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                         <div className="h-full bg-accent" style={{ width: `${Math.min(100, (med.availableQuantity / 100) * 100)}%` }} />
                      </div>
                      <span className="text-[10px] font-black text-gray-700 uppercase">{med.availableQuantity} in stock</span>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function MoleculeMasterTab({ db }: { db: any }) {
  const molsQuery = useMemoFirebase(() => query(collection(db, 'moleculeMaster')), [db]);
  const { data: molecules, isLoading } = useCollection(molsQuery);

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-black uppercase text-gray-900 tracking-tight">Formulas & Salts</h2>
      <Card className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 border-b">
            <tr>
              <th className="px-10 py-8">Master ID</th>
              <th className="px-10 py-8">Salt Composition</th>
              <th className="px-10 py-8">Form</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr><td colSpan={3} className="p-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" /></td></tr>
            ) : molecules?.map(mol => (
              <tr key={mol.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-10 py-8 text-[11px] font-black text-orange-600 tracking-widest">{mol.masterId}</td>
                <td className="px-10 py-8 font-black text-sm uppercase tracking-tight">{mol.molecule}</td>
                <td className="px-10 py-8"><Badge variant="secondary" className="text-[9px] uppercase font-black px-4 py-1.5 rounded-full">{mol.form}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function DigitizationWorkflow({ db, enquiry, medicines, onSuccess }: { db: any, enquiry: any, medicines: any[], onSuccess: () => void }) {
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const filteredMeds = medicines.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) || 
    m.sku?.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 5);

  const addItem = (med: any) => {
    setSelectedItems(prev => {
      const existing = prev.find(i => i.id === med.id);
      if (existing) return prev.map(i => i.id === med.id ? {...i, quantity: i.quantity + 1} : i);
      return [...prev, { ...med, quantity: 1 }];
    });
    setSearch('');
  };

  const removeItem = (id: string) => {
    setSelectedItems(prev => prev.filter(i => i.id !== id));
  };

  const calculateTotal = () => selectedItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);

  const handleCreateOrder = async () => {
    if (selectedItems.length === 0) return;
    setIsProcessing(true);
    try {
      const orderData = {
        userId: enquiry.userId,
        orderDate: serverTimestamp(),
        totalAmount: calculateTotal(),
        status: 'Confirmed',
        items: selectedItems.map(i => ({
          medicineId: i.id,
          quantity: i.quantity,
          unitPrice: i.price,
          name: i.name
        }))
      };
      addDocumentNonBlocking(collection(db, 'userProfiles', enquiry.userId, 'orders'), orderData);
      onSuccess();
    } catch (e) {
      toast({ variant: 'destructive', title: "Failed to create order" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-12 py-6 h-[70vh]">
      <div className="rounded-[48px] overflow-hidden border-2 border-gray-100 bg-gray-50 flex items-center justify-center shadow-inner relative">
        <img src={enquiry.imageUrl} alt="Source" className="w-full h-full object-contain p-4" />
        <div className="absolute top-8 right-8 bg-black/80 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-md">Source Scan</div>
      </div>
      <div className="flex flex-col gap-8 overflow-y-auto scrollbar-hide pr-4">
        <div className="space-y-4">
          <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400 ml-1">Search Product SKU</Label>
          <div className="relative">
            <Input placeholder="Type Product Name..." value={search} onChange={e => setSearch(e.target.value)} className="h-16 rounded-[24px] bg-gray-50 border-none font-black text-sm px-8 shadow-inner" />
            {search.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-[32px] shadow-3xl border-none z-50 overflow-hidden animate-in slide-in-from-top-4 duration-300">
                {filteredMeds.map(med => (
                  <button key={med.id} onClick={() => addItem(med)} className="w-full p-6 hover:bg-primary/5 flex items-center justify-between transition-all border-b last:border-none text-left group">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-gray-50 rounded-xl p-1 group-hover:bg-white transition-colors">
                          <img src={med.imageUrl} alt="" className="w-full h-full object-contain" />
                       </div>
                       <div className="flex flex-col">
                          <span className="text-[11px] font-black uppercase tracking-tight text-gray-900">{med.name}</span>
                          <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{med.manufacturer}</span>
                       </div>
                    </div>
                    <span className="text-sm font-black text-primary">₹{med.price}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 space-y-4">
          <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400 ml-1">Order Items</Label>
          {selectedItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-[32px] text-gray-300">
               <Package className="w-12 h-12 mb-3" />
               <p className="text-[10px] font-black uppercase tracking-widest">No items mapped yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedItems.map(item => (
                <div key={item.id} className="bg-white p-5 rounded-[24px] flex items-center justify-between border-2 border-gray-50 shadow-sm hover:border-primary/20 transition-all">
                  <div className="flex items-center gap-4">
                     <Badge variant="secondary" className="h-10 w-10 flex items-center justify-center rounded-xl font-black text-sm">x{item.quantity}</Badge>
                     <div className="flex flex-col">
                        <span className="text-xs font-black uppercase tracking-tight text-gray-900">{item.name}</span>
                        <span className="text-[8px] font-black text-primary uppercase tracking-widest">₹{item.price} UNIT</span>
                     </div>
                  </div>
                  <div className="flex items-center gap-6">
                      <span className="text-lg font-black text-gray-900 tracking-tighter">₹{item.price * item.quantity}</span>
                      <button onClick={() => removeItem(item.id)} className="h-10 w-10 rounded-xl text-red-300 hover:bg-red-50 hover:text-red-500 transition-all flex items-center justify-center"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="pt-8 border-t-2 border-dashed mt-auto">
           <div className="flex justify-between items-baseline mb-6 px-4">
              <span className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em]">Total Value</span>
              <span className="text-4xl font-black text-primary tracking-tighter">₹{calculateTotal()}</span>
           </div>
           <Button onClick={handleCreateOrder} disabled={isProcessing || selectedItems.length === 0} className="w-full h-20 rounded-full font-black uppercase tracking-[0.2em] text-[12px] bg-primary shadow-2xl shadow-primary/30 active:scale-95 transition-all">
             {isProcessing ? <Loader2 className="animate-spin" /> : "Fulfill Digitized Order"}
           </Button>
        </div>
      </div>
    </div>
  );
}

function CustomerAddressCell({ db, userId }: { db: any, userId: string }) {
  const addrQuery = useMemoFirebase(() => query(collection(db, 'userProfiles', userId, 'addresses'), where('isDefault', '==', true), limit(1)), [db, userId]);
  const { data: addresses, isLoading } = useCollection(addrQuery);
  const defaultAddress = addresses?.[0];
  if (isLoading) return <Loader2 className="w-4 h-4 animate-spin text-gray-200" />;
  return (
    <div className="flex flex-col">
       <span className="text-[11px] font-black text-gray-900 uppercase tracking-tight leading-none">{defaultAddress ? `${defaultAddress.city}, ${defaultAddress.state}` : 'N/A'}</span>
       <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1 truncate max-w-[150px]">{defaultAddress ? defaultAddress.street : 'No Address Linked'}</span>
    </div>
  );
}
