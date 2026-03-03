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
  Tag,
  Home,
  ExternalLink,
  Copy,
  Check,
  ClipboardList
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

type AdminTab = 'overview' | 'itemMaster' | 'moleculeMaster' | 'enquiries' | 'fulfillment' | 'customers' | 'stockAlerts' | 'fees' | 'promocodes';

export default function SupervisorConsole() {
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
        toast({ title: "Identity Verified", description: "Clinical supervisor access active." });
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
      toast({ variant: 'destructive', title: 'Access Denied', description: 'Invalid clinical credentials.' });
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
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Syncing clinical authority...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F7F6] p-4">
        <Card className="max-w-md w-full rounded-[40px] shadow-2xl border-none overflow-hidden bg-white">
          <CardHeader className="text-center p-10 bg-primary text-white">
            <Lock className="w-10 h-10 mx-auto mb-4 opacity-50" />
            <CardTitle className="text-2xl font-black uppercase tracking-tight text-white">Supervisor Gateway</CardTitle>
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
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed">Logged in as {user.email || 'Phone User'}, but clinical supervisor role is not detected.</p>
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
                <span className="font-black text-lg tracking-tighter text-gray-900 uppercase">Supervisor Terminal</span>
                <span className="text-[8px] font-black text-primary uppercase tracking-[0.3em]">Clinical Hub</span>
              </div>
            </button>
            <nav className="hidden xl:flex gap-1 overflow-x-auto scrollbar-hide">
              {[
                { id: 'overview', label: 'Home', icon: Home },
                { id: 'enquiries', label: 'Enquiries', icon: FileText },
                { id: 'fulfillment', label: 'Orders', icon: ShoppingBag },
                { id: 'promocodes', label: 'Promos', icon: Tag },
                { id: 'fees', label: 'Fees', icon: Receipt },
                { id: 'customers', label: 'Customers', icon: Users },
                { id: 'itemMaster', label: 'Items', icon: Package },
                { id: 'moleculeMaster', label: 'Molecules', icon: Dna },
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
    <div className="space-y-6 animate-in slide-in-from-bottom-2">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black uppercase text-gray-900">Clinical Fees (Cart Level)</h2>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingFee(null)} className="rounded-full h-10 px-6 font-black text-[9px] uppercase tracking-widest gap-2 bg-primary">
              <Plus className="w-4 h-4" /> Add Fee
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[40px] border-none">
            <DialogHeader>
              <DialogTitle className="text-xl font-black uppercase">Configure Fee</DialogTitle>
              <CardDescription className="text-[8px] font-black uppercase tracking-widest">Apply fixed or percentage charges to cart</CardDescription>
            </DialogHeader>
            <FeeForm db={db} initialData={editingFee} onSuccess={() => setIsFormOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Card className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-[9px] font-black uppercase text-gray-400 border-b">
            <tr>
              <th className="px-8 py-6">Fee Name</th>
              <th className="px-8 py-6">Value</th>
              <th className="px-8 py-6">Type</th>
              <th className="px-8 py-6">Status</th>
              <th className="px-8 py-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr><td colSpan={5} className="p-20 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></td></tr>
            ) : fees?.map(fee => (
              <tr key={fee.id}>
                <td className="px-8 py-6 font-black text-xs uppercase">{fee.name}</td>
                <td className="px-8 py-6 font-black text-gray-900">{fee.amount}{fee.type === 'percentage' ? '%' : '₹'}</td>
                <td className="px-8 py-6"><Badge variant="outline" className="text-[8px] uppercase font-black">{fee.type}</Badge></td>
                <td className="px-8 py-6">
                   <Badge className={fee.isActive ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400"}>
                     {fee.isActive ? "ACTIVE" : "DISABLED"}
                   </Badge>
                </td>
                <td className="px-8 py-6 text-right">
                   <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingFee(fee); setIsFormOpen(true); }}><Edit2 className="w-4 h-4 text-gray-400" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => { deleteDocumentNonBlocking(doc(db, 'fees', fee.id)); toast({ title: "Fee Removed" }); }}><Trash2 className="w-4 h-4 text-red-300" /></Button>
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
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="space-y-2">
        <Label className="text-[9px] font-black uppercase">Fee Label</Label>
        <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="rounded-xl h-12 bg-gray-50 border-none font-bold" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-[9px] font-black uppercase">Amount/Value</Label>
          <Input type="number" value={form.amount} onChange={e => setForm({...form, amount: Number(e.target.value)})} required className="rounded-xl h-12 bg-gray-50 border-none font-bold" />
        </div>
        <div className="space-y-2">
          <Label className="text-[9px] font-black uppercase">Type</Label>
          <select value={form.type} onChange={e => setForm({...form, type: e.target.value as any})} className="w-full h-12 rounded-xl bg-gray-50 border-none px-4 font-bold outline-none">
            <option value="fixed">Fixed (₹)</option>
            <option value="percentage">Percentage (%)</option>
          </select>
        </div>
      </div>
      <div className="flex items-center gap-2 py-2">
         <input type="checkbox" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})} className="w-5 h-5 accent-primary" />
         <Label className="text-[10px] font-black uppercase">Is Active</Label>
      </div>
      <Button type="submit" className="w-full h-14 rounded-full font-black uppercase text-[10px] tracking-widest bg-primary shadow-xl shadow-primary/20">Save Clinical Fee</Button>
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
    <div className="space-y-6 animate-in slide-in-from-bottom-2">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black uppercase text-gray-900">Clinical Promotions</h2>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingPromo(null)} className="rounded-full h-10 px-6 font-black text-[9px] uppercase tracking-widest gap-2 bg-primary">
              <Plus className="w-4 h-4" /> Create Promo
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[40px] border-none max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-black uppercase">Clinical Promo Builder</DialogTitle>
              <CardDescription className="text-[8px] font-black uppercase tracking-widest">Configure targeted discounts for items, patients or carts</CardDescription>
            </DialogHeader>
            <PromoForm db={db} initialData={editingPromo} onSuccess={() => setIsFormOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Card className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-[9px] font-black uppercase text-gray-400 border-b">
            <tr>
              <th className="px-8 py-6">Code</th>
              <th className="px-8 py-6">Reward</th>
              <th className="px-8 py-6">Targeting</th>
              <th className="px-8 py-6">Min. Value</th>
              <th className="px-8 py-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr><td colSpan={5} className="p-20 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></td></tr>
            ) : promos?.map(promo => (
              <tr key={promo.id}>
                <td className="px-8 py-6"><code className="bg-primary/5 text-primary font-black px-3 py-1 rounded text-xs">{promo.code}</code></td>
                <td className="px-8 py-6 font-black text-xs">
                   {promo.discountValue}{promo.discountType === 'percentage' ? '%' : '₹'} {promo.discountType}
                </td>
                <td className="px-8 py-6">
                   <Badge variant="secondary" className="text-[8px] uppercase font-black">{promo.applyTo}</Badge>
                   {promo.targetId && <span className="ml-2 text-[8px] text-gray-400 font-bold truncate">ID: {promo.targetId.substring(0,8)}</span>}
                </td>
                <td className="px-8 py-6 font-black text-xs text-gray-500">₹{promo.minOrderValue || 0}</td>
                <td className="px-8 py-6 text-right">
                   <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingPromo(promo); setIsFormOpen(true); }}><Edit2 className="w-4 h-4 text-gray-400" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => { deleteDocumentNonBlocking(doc(db, 'promocodes', promo.id)); toast({ title: "Promo Removed" }); }}><Trash2 className="w-4 h-4 text-red-300" /></Button>
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
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2 scrollbar-hide">
      <div className="col-span-2 space-y-2">
        <Label className="text-[9px] font-black uppercase">Promo Code (All Caps)</Label>
        <Input value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} required className="rounded-xl h-12 bg-gray-50 border-none font-bold" />
      </div>
      <div className="col-span-2 space-y-2">
        <Label className="text-[9px] font-black uppercase">Description (Patient Visible)</Label>
        <Input value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="rounded-xl h-12 bg-gray-50 border-none font-bold" />
      </div>
      <div className="space-y-2">
        <Label className="text-[9px] font-black uppercase">Discount Type</Label>
        <select value={form.discountType} onChange={e => setForm({...form, discountType: e.target.value as any})} className="w-full h-12 rounded-xl bg-gray-50 border-none px-4 font-bold outline-none">
          <option value="fixed">Fixed Amount (₹)</option>
          <option value="percentage">Percentage (%)</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label className="text-[9px] font-black uppercase">Discount Value</Label>
        <Input type="number" value={form.discountValue} onChange={e => setForm({...form, discountValue: Number(e.target.value)})} required className="rounded-xl h-12 bg-gray-50 border-none font-bold" />
      </div>
      <div className="space-y-2">
        <Label className="text-[9px] font-black uppercase">Min. Order Value (₹)</Label>
        <Input type="number" value={form.minOrderValue} onChange={e => setForm({...form, minOrderValue: Number(e.target.value)})} className="rounded-xl h-12 bg-gray-50 border-none font-bold" />
      </div>
      <div className="space-y-2">
        <Label className="text-[9px] font-black uppercase">Clinical Target</Label>
        <select value={form.applyTo} onChange={e => setForm({...form, applyTo: e.target.value as any})} className="w-full h-12 rounded-xl bg-gray-50 border-none px-4 font-bold outline-none">
          <option value="cart">Global Cart</option>
          <option value="product">Specific SKU</option>
          <option value="customer">Specific Patient (UID)</option>
          <option value="both">Both (SKU + Cart)</option>
        </select>
      </div>
      {form.applyTo !== 'cart' && (
        <div className="col-span-2 space-y-2">
          <Label className="text-[9px] font-black uppercase">Target Identifier (SKU or Patient UID)</Label>
          <Input value={form.targetId} onChange={e => setForm({...form, targetId: e.target.value})} placeholder="Paste UID or SKU ID..." className="rounded-xl h-12 bg-gray-50 border-none font-bold text-[10px]" />
        </div>
      )}
      <div className="col-span-2 flex items-center gap-2 py-2">
         <input type="checkbox" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})} className="w-5 h-5 accent-primary" />
         <Label className="text-[10px] font-black uppercase">Activate Promotion</Label>
      </div>
      <div className="col-span-2 pt-6">
        <Button type="submit" className="w-full h-14 rounded-full font-black uppercase text-[10px] tracking-widest bg-primary shadow-xl shadow-primary/20">Commit Promotion</Button>
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
      <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">Clinical Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-8 gap-4">
        {[
          { label: 'Enquiries', icon: FileText, count: pres?.filter(p => p.status === 'Pending Review').length || 0, tab: 'enquiries' as AdminTab },
          { label: 'Orders', icon: ShoppingBag, count: orders?.filter(o => o.status !== 'Delivered').length || 0, tab: 'fulfillment' as AdminTab },
          { label: 'Promos', icon: Tag, count: 0, tab: 'promocodes' as AdminTab },
          { label: 'Fees', icon: Receipt, count: 0, tab: 'fees' as AdminTab },
          { label: 'Patients', icon: Users, count: users?.length || 0, tab: 'customers' as AdminTab },
          { label: 'Alerts', icon: BellRing, count: alerts?.length || 0, tab: 'stockAlerts' as AdminTab },
          { label: 'SKUs', icon: Package, count: meds?.length || 0, tab: 'itemMaster' as AdminTab },
          { label: 'Molecules', icon: Dna, count: mols?.length || 0, tab: 'moleculeMaster' as AdminTab },
        ].map(card => (
          <Card key={card.label} className="rounded-[32px] p-5 border-none shadow-sm hover:shadow-xl transition-all cursor-pointer bg-white group text-center" onClick={() => setTab(card.tab)}>
            <card.icon className="w-6 h-6 text-primary mx-auto mb-3 group-hover:scale-110 transition-transform" />
            <CardTitle className="text-[8px] font-black uppercase text-gray-400 tracking-widest mb-1">{card.label}</CardTitle>
            <p className="text-xl font-black text-primary">{card.count}</p>
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
    toast({ title: "Clinical Update", description: `Enquiry status changed to ${status}` });
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black uppercase text-gray-900">Clinical Enquiries</h2>
        <div className="flex bg-white p-1 rounded-full border">
          {(['Pending', 'Open', 'Completed'] as const).map(f => (
            <Button 
              key={f} 
              variant={filter === f ? 'secondary' : 'ghost'} 
              size="sm" 
              onClick={() => setFilter(f)}
              className={`rounded-full px-6 font-black text-[9px] uppercase tracking-widest ${filter === f ? 'bg-primary text-white hover:bg-primary/90' : 'text-gray-400'}`}
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          <div className="col-span-full py-20 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : filteredEnquiries?.map(enq => (
          <Card key={enq.id} className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white hover:shadow-xl transition-all flex flex-col group">
             <div className="aspect-[4/5] relative bg-gray-100 overflow-hidden">
                <img src={enq.imageUrl} alt="Prescription" className="w-full h-full object-cover" />
                <Badge className="absolute top-4 right-4 text-white text-[8px] font-black uppercase bg-primary border-none">{enq.status}</Badge>
             </div>
             <CardContent className="p-6 flex-1 flex flex-col">
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Patient Name</p>
                <p className="text-[12px] font-black text-gray-900 uppercase mb-4">{enq.patientName || 'Self'}</p>
                
                <div className="mt-auto flex flex-col gap-2">
                  <Dialog open={digitizingEnquiry?.id === enq.id} onOpenChange={(open) => !open && setDigitizingEnquiry(null)}>
                    <DialogTrigger asChild>
                      <Button onClick={() => setDigitizingEnquiry(enq)} size="sm" className="w-full rounded-full h-10 font-black uppercase text-[9px] tracking-widest gap-2 bg-primary">
                        <ClipboardList className="w-3.5 h-3.5" /> Digitize & Order
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-[40px] max-w-4xl border-none">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-black uppercase">Digitization Flow</DialogTitle>
                      </DialogHeader>
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
    <div className="space-y-6 animate-in slide-in-from-bottom-2">
      <h2 className="text-2xl font-black uppercase text-gray-900">Fulfillment Center</h2>
      <Card className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-[9px] font-black uppercase text-gray-400 border-b">
            <tr>
              <th className="px-8 py-6">Order Ref</th>
              <th className="px-8 py-6">Patient</th>
              <th className="px-8 py-6">Value</th>
              <th className="px-8 py-6">Status</th>
              <th className="px-8 py-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr><td colSpan={5} className="p-20 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></td></tr>
            ) : orders?.map(order => (
              <tr key={order.id}>
                <td className="px-8 py-6 font-black text-xs uppercase">#{order.id.substring(0,8)}</td>
                <td className="px-8 py-6 font-bold text-[10px] text-gray-500">{order.userId?.substring(0,10)}</td>
                <td className="px-8 py-6 font-black text-primary">₹{order.totalAmount}</td>
                <td className="px-8 py-6"><Badge variant="outline" className="text-[8px] font-black uppercase">{order.status}</Badge></td>
                <td className="px-8 py-6 text-right">
                  <div className="flex justify-end gap-2">
                    <Button onClick={() => updateStatus(order, 'Shipped')} size="sm" className="rounded-full h-8 text-[8px] uppercase font-black">Dispatch</Button>
                    <Button onClick={() => updateStatus(order, 'Delivered')} variant="outline" size="sm" className="rounded-full h-8 text-[8px] uppercase font-black">Complete</Button>
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
    <div className="space-y-6">
      <h2 className="text-2xl font-black uppercase text-gray-900">Customer Master</h2>
      <Card className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-[9px] font-black uppercase text-gray-400 border-b">
            <tr>
              <th className="px-8 py-6">ID</th>
              <th className="px-8 py-6">Patient Name</th>
              <th className="px-8 py-6">Phone</th>
              <th className="px-8 py-6">Hub</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr><td colSpan={4} className="p-20 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></td></tr>
            ) : users?.map(u => (
              <tr key={u.id}>
                <td className="px-8 py-6 text-[10px] font-black text-primary">{u.id.substring(0,10)}</td>
                <td className="px-8 py-6 font-black text-xs uppercase">{u.name || 'No Name'}</td>
                <td className="px-8 py-6 text-[10px] font-bold text-gray-400">{u.phoneNumber || 'N/A'}</td>
                <td className="px-8 py-6"><CustomerAddressCell db={db} userId={u.id} /></td>
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
    <div className="space-y-6">
      <h2 className="text-2xl font-black uppercase text-gray-900">Item SKU Master</h2>
      <Card className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-[9px] font-black uppercase text-gray-400 border-b">
            <tr>
              <th className="px-8 py-6">SKU</th>
              <th className="px-8 py-6">Product</th>
              <th className="px-8 py-6">Price</th>
              <th className="px-8 py-6">Stock</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr><td colSpan={4} className="p-20 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></td></tr>
            ) : medicines?.map(med => (
              <tr key={med.id}>
                <td className="px-8 py-6 text-[10px] font-black">{med.sku || 'N/A'}</td>
                <td className="px-8 py-6">
                   <div className="flex flex-col">
                      <span className="font-black text-xs uppercase">{med.name}</span>
                      <span className="text-[8px] text-gray-400 uppercase">{med.manufacturer}</span>
                   </div>
                </td>
                <td className="px-8 py-6 font-black text-primary">₹{med.price}</td>
                <td className="px-8 py-6"><Badge variant="secondary" className="text-[8px] uppercase font-black">{med.availableQuantity} units</Badge></td>
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
    <div className="space-y-6">
      <h2 className="text-2xl font-black uppercase text-gray-900">Molecule Salt Master</h2>
      <Card className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-[9px] font-black uppercase text-gray-400 border-b">
            <tr>
              <th className="px-8 py-6">Master ID</th>
              <th className="px-8 py-6">Molecule / Salt</th>
              <th className="px-8 py-6">Form</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr><td colSpan={3} className="p-20 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></td></tr>
            ) : molecules?.map(mol => (
              <tr key={mol.id}>
                <td className="px-8 py-6 text-[10px] font-black text-orange-600">{mol.masterId}</td>
                <td className="px-8 py-6 font-black text-xs uppercase">{mol.molecule}</td>
                <td className="px-8 py-6"><Badge variant="secondary" className="text-[8px] uppercase font-black">{mol.form}</Badge></td>
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
      toast({ variant: 'destructive', title: "Order Failed" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-8 py-6 h-[70vh]">
      <div className="rounded-[32px] overflow-hidden border bg-gray-50 flex items-center justify-center">
        <img src={enquiry.imageUrl} alt="Source" className="w-full h-full object-contain" />
      </div>
      <div className="flex flex-col gap-6 overflow-y-auto scrollbar-hide">
        <div className="space-y-4">
          <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Search Clinical SKU</Label>
          <div className="relative">
            <Input placeholder="Type SKU or Name..." value={search} onChange={e => setSearch(e.target.value)} className="h-12 rounded-xl bg-gray-50 border-none font-bold" />
            {search.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border z-10 overflow-hidden">
                {filteredMeds.map(med => (
                  <button key={med.id} onClick={() => addItem(med)} className="w-full p-4 hover:bg-gray-50 flex items-center justify-between transition-colors border-b last:border-none text-left">
                    <span className="text-[10px] font-black uppercase">{med.name}</span>
                    <span className="text-[10px] font-black text-primary">₹{med.price}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 space-y-3">
          <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Order Items</Label>
          {selectedItems.map(item => (
            <div key={item.id} className="bg-gray-50 p-3 rounded-2xl flex items-center justify-between border">
               <span className="text-[10px] font-black uppercase">{item.name} x{item.quantity}</span>
               <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-gray-900">₹{item.price * item.quantity}</span>
                  <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="h-6 w-6 text-red-300"><Trash2 className="w-3.5 h-3.5" /></Button>
               </div>
            </div>
          ))}
        </div>
        <div className="pt-6 border-t mt-auto">
           <Button onClick={handleCreateOrder} disabled={isProcessing || selectedItems.length === 0} className="w-full h-14 rounded-full font-black uppercase tracking-widest text-[11px] bg-primary">
             {isProcessing ? <Loader2 className="animate-spin" /> : "Confirm Digitized Order"}
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
  if (isLoading) return <Loader2 className="w-3 h-3 animate-spin text-gray-200" />;
  return <div className="text-[9px] font-bold text-gray-500 uppercase truncate max-w-[150px]">{defaultAddress ? `${defaultAddress.city}, ${defaultAddress.state}` : 'No hub linked'}</div>;
}