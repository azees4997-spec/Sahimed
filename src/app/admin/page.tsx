
"use client"

import { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  LogOut, 
  Loader2, 
  Package, 
  Database, 
  ShoppingBag, 
  ShieldAlert,
  UserPlus,
  Lock,
  FileText,
  Trash2,
  Search,
  CheckCircle2,
  Clock,
  LayoutGrid,
  Zap,
  RefreshCw,
  Copy,
  Check,
  Plus,
  ArrowRight,
  ExternalLink,
  Home
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
  DialogTrigger,
  DialogFooter
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
import { doc, collection, query, orderBy, collectionGroup, getDoc, serverTimestamp } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import Link from 'next/link';

type AdminTab = 'overview' | 'inventory' | 'enquiries' | 'fulfillment';

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
      if (snap.exists()) {
        setTimeout(() => {
          setIsVerified(true);
          setIsVerifying(false);
          toast({ title: "Identity Verified", description: "Clinical supervisor access active." });
        }, 1500);
      } else {
        setIsVerified(false);
        setIsVerifying(false);
      }
    } catch (err) {
      console.error("Verification failed", err);
      setIsVerified(false);
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
      toast({ title: "UID Copied", description: "Use this to create an Admin Profile in the console." });
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
    setTimeout(performVerification, 6000);
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
                <Input type="email" placeholder="admin@sahimed.com" value={email} onChange={e => setEmail(e.target.value)} required className="h-14 rounded-2xl bg-gray-50 border-none font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Password</Label>
                <Input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required className="h-14 rounded-2xl bg-gray-50 border-none font-bold" />
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
            <button 
              onClick={() => setActiveTab('overview')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity outline-none group"
            >
              <div className="bg-primary p-1.5 rounded-lg group-active:scale-95 transition-transform">
                <ShieldCheck className="text-white w-4 h-4" />
              </div>
              <div className="flex flex-col items-start leading-none">
                <span className="font-black text-lg tracking-tighter text-gray-900 uppercase">Supervisor Terminal</span>
                <span className="text-[8px] font-black text-primary uppercase tracking-[0.3em]">Home Dashboard</span>
              </div>
            </button>
            <nav className="hidden lg:flex gap-1">
              {[
                { id: 'overview', label: 'Dashboard', icon: Home },
                { id: 'inventory', label: 'SKU Master', icon: Package },
                { id: 'enquiries', label: 'Prescriptions', icon: FileText },
                { id: 'fulfillment', label: 'Orders', icon: ShoppingBag }
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
                <ExternalLink className="w-3.5 h-3.5" />
                Live Store
              </Button>
            </Link>
            <SeedDataButton db={db} />
            <Button variant="ghost" onClick={performVerification} size="icon" className="w-10 h-10 rounded-xl text-gray-400"><RefreshCw className="w-4 h-4" /></Button>
            <Button variant="ghost" onClick={handleLogout} size="icon" className="w-10 h-10 rounded-xl text-gray-400 hover:text-red-500"><LogOut className="w-4 h-4" /></Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {activeTab === 'overview' && <OverviewTab db={db} setTab={setActiveTab} isVerified={isVerified} />}
        {activeTab === 'inventory' && <InventoryTab db={db} isVerified={isVerified} />}
        {activeTab === 'enquiries' && <EnquiriesTab db={db} isVerified={isVerified} />}
        {activeTab === 'fulfillment' && <FulfillmentTab db={db} isVerified={isVerified} />}
      </main>
    </div>
  );
}

function SeedDataButton({ db }: { db: any }) {
  const { toast } = useToast();
  const [seeding, setSeeding] = useState(false);

  const seed = async () => {
    setSeeding(true);
    try {
      const categories = [
        { name: 'Diabetes', description: 'Glucose Management' },
        { name: 'Heart care', description: 'Cardiac Wellness' },
        { name: 'Stomach care', description: 'Digestive & gut health' },
        { name: 'Liver care', description: 'Hepatic support' },
        { name: 'Derma care', description: 'Skin & dermatological solutions' },
        { name: 'Respicare', description: 'Respiratory & lung health' }
      ];

      for (const cat of categories) {
        await addDocumentNonBlocking(collection(db, 'categories'), cat);
      }

      const medicines = [
        { 
          name: 'Janumet 50/500', 
          price: 1250, 
          mrp: 1450,
          saltComposition: 'Sitagliptin + Metformin', 
          manufacturer: 'MSD Pharmaceuticals', 
          isGeneric: false, 
          category: 'Diabetes', 
          imageUrl: 'https://picsum.photos/seed/dia1/300/300', 
          availableQuantity: 100, 
          description: 'Janumet is a combination of two anti-diabetic medicines: Sitagliptin and Metformin.',
          uses: ['Management of Type 2 Diabetes'],
          sideEffects: ['Nausea', 'Vomiting'],
          packSize: 'Strip of 15 tablets',
          strength: '50mg/500mg'
        },
        { 
          name: 'Sitagliptin M 50/500', 
          price: 240, 
          mrp: 1200,
          saltComposition: 'Sitagliptin + Metformin', 
          manufacturer: 'HealthLink Generic', 
          isGeneric: true, 
          category: 'Diabetes', 
          imageUrl: 'https://picsum.photos/seed/dia2/300/300', 
          availableQuantity: 500, 
          description: 'Bio-equivalent generic version of Sitagliptin + Metformin.',
          uses: ['Management of Type 2 Diabetes'],
          sideEffects: ['Nausea'],
          packSize: 'Strip of 15 tablets',
          strength: '50mg/500mg'
        }
      ];

      for (const med of medicines) {
        await addDocumentNonBlocking(collection(db, 'medicines'), med);
      }

      toast({ title: "Catalog Seeded", description: "Therapeutic categories and clinical product pairs initialized." });
    } catch (e) {
      toast({ variant: 'destructive', title: "Seeding Failed" });
    } finally {
      setSeeding(false);
    }
  };

  return (
    <Button onClick={seed} disabled={seeding} variant="outline" className="rounded-xl border-2 font-black text-[9px] uppercase gap-1.5 h-10 px-4">
      {seeding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
      Seed Database
    </Button>
  );
}

function OverviewTab({ db, setTab, isVerified }: { db: any, setTab: (t: AdminTab) => void, isVerified: boolean }) {
  const medsQuery = useMemoFirebase(() => query(collection(db, 'medicines')), [db]);
  const presQuery = useMemoFirebase(() => isVerified ? query(collectionGroup(db, 'prescriptions')) : null, [db, isVerified]);
  const ordersQuery = useMemoFirebase(() => isVerified ? query(collectionGroup(db, 'orders')) : null, [db, isVerified]);

  const { data: meds } = useCollection(medsQuery);
  const { data: pres } = useCollection(presQuery);
  const { data: orders } = useCollection(ordersQuery);

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">Clinical Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Active Catalog', icon: Package, count: meds?.length || 0, tab: 'inventory' as AdminTab },
          { label: 'Unchecked Enquiries', icon: FileText, count: pres?.filter(p => p.status === 'Pending Review').length || 0, tab: 'enquiries' as AdminTab },
          { label: 'Open Orders', icon: ShoppingBag, count: orders?.filter(o => o.status !== 'Delivered').length || 0, tab: 'fulfillment' as AdminTab },
        ].map(card => (
          <Card key={card.label} className="rounded-[32px] p-8 border-none shadow-sm hover:shadow-xl transition-all cursor-pointer bg-white group" onClick={() => setTab(card.tab)}>
            <card.icon className="w-10 h-10 text-primary mb-6 group-hover:scale-110 transition-transform" />
            <CardTitle className="text-sm font-black uppercase text-gray-400 tracking-widest mb-1">{card.label}</CardTitle>
            <p className="text-4xl font-black text-primary">{card.count}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

function InventoryTab({ db, isVerified }: { db: any, isVerified: boolean }) {
  const medsQuery = useMemoFirebase(() => query(collection(db, 'medicines'), orderBy('name', 'asc')), [db]);
  const { data: medicines, isLoading } = useCollection(medsQuery);
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);

  const filtered = medicines?.filter(m => 
    m.name?.toLowerCase().includes(search.toLowerCase()) || 
    m.saltComposition?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black uppercase text-gray-900">Inventory Control</h2>
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <Input placeholder="Filter medicines..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10 rounded-full border-none bg-white font-bold text-xs" />
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full h-10 px-6 font-black text-[9px] uppercase tracking-widest gap-2 shadow-lg shadow-primary/20">
                <Plus className="w-3.5 h-3.5" /> Add SKU
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[40px] max-w-2xl border-none">
              <DialogHeader>
                <DialogTitle className="text-xl font-black uppercase tracking-tight">Add New Medicine</DialogTitle>
                <CardDescription className="uppercase text-[8px] font-black tracking-widest">Register clinical product to catalog</CardDescription>
              </DialogHeader>
              <AddMedicineForm db={db} onSuccess={() => setIsAddOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="rounded-[24px] overflow-hidden border-none shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[9px] font-black uppercase text-gray-400 border-b">
              <tr>
                <th className="px-8 py-6">Product & MFR</th>
                <th className="px-8 py-6">Salt Composition</th>
                <th className="px-8 py-6 text-center">Unit Price</th>
                <th className="px-8 py-6 text-center">Stock Level</th>
                <th className="px-8 py-6 text-right">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr><td colSpan={5} className="p-20 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></td></tr>
              ) : filtered?.map(med => (
                <tr key={med.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="font-black text-gray-900 text-xs">{med.name}</span>
                      <span className="text-[8px] text-gray-400 uppercase font-bold tracking-widest">{med.manufacturer}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <Badge variant="outline" className="text-[8px] uppercase font-bold border-primary/20 text-primary">{med.saltComposition}</Badge>
                  </td>
                  <td className="px-8 py-6 font-black text-center text-sm">₹{med.price}</td>
                  <td className="px-8 py-6 text-center">
                    <Badge variant={med.availableQuantity < 50 ? 'destructive' : 'secondary'} className="px-3 py-1 rounded-full font-black text-[8px] uppercase">
                      {med.availableQuantity || 0} Units
                    </Badge>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <Button variant="ghost" size="icon" className="text-gray-300 hover:text-red-500 rounded-full" onClick={() => {
                      deleteDocumentNonBlocking(doc(db, 'medicines', med.id));
                      toast({ title: "SKU Deleted", description: "Product removed from catalog." });
                    }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function AddMedicineForm({ db, onSuccess }: { db: any, onSuccess: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: '',
    manufacturer: '',
    saltComposition: '',
    price: '',
    availableQuantity: '',
    category: 'Diabetes',
    isGeneric: false,
    imageUrl: 'https://picsum.photos/seed/med/300/300'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addDocumentNonBlocking(collection(db, 'medicines'), {
      ...form,
      price: Number(form.price),
      availableQuantity: Number(form.availableQuantity),
      createdAt: serverTimestamp()
    });
    toast({ title: "SKU Added", description: `${form.name} is now live in catalog.` });
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 py-4">
      <div className="space-y-2">
        <Label className="text-[9px] font-black uppercase">Medicine Name</Label>
        <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="rounded-xl h-12 bg-gray-50 border-none font-bold" />
      </div>
      <div className="space-y-2">
        <Label className="text-[9px] font-black uppercase">Manufacturer</Label>
        <Input value={form.manufacturer} onChange={e => setForm({...form, manufacturer: e.target.value})} required className="rounded-xl h-12 bg-gray-50 border-none font-bold" />
      </div>
      <div className="space-y-2 col-span-2">
        <Label className="text-[9px] font-black uppercase">Salt Composition</Label>
        <Input value={form.saltComposition} onChange={e => setForm({...form, saltComposition: e.target.value})} required className="rounded-xl h-12 bg-gray-50 border-none font-bold" />
      </div>
      <div className="space-y-2">
        <Label className="text-[9px] font-black uppercase">Price (₹)</Label>
        <Input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required className="rounded-xl h-12 bg-gray-50 border-none font-bold" />
      </div>
      <div className="space-y-2">
        <Label className="text-[9px] font-black uppercase">Initial Stock</Label>
        <Input type="number" value={form.availableQuantity} onChange={e => setForm({...form, availableQuantity: e.target.value})} required className="rounded-xl h-12 bg-gray-50 border-none font-bold" />
      </div>
      <div className="col-span-2 flex items-center gap-3 pt-4 border-t">
        <Button type="submit" className="flex-1 rounded-full h-14 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20">Create SKU</Button>
        <Button type="button" variant="ghost" onClick={onSuccess} className="rounded-full h-14 font-black uppercase text-[10px] tracking-widest text-gray-400">Cancel</Button>
      </div>
    </form>
  );
}

function EnquiriesTab({ db, isVerified }: { db: any, isVerified: boolean }) {
  const presQuery = useMemoFirebase(() => isVerified ? query(collectionGroup(db, 'prescriptions')) : null, [db, isVerified]);
  const { data: enquiries, isLoading } = useCollection(presQuery);
  const { toast } = useToast();

  const updateStatus = (enquiry: any, status: string) => {
    if (!enquiry.userId) return;
    const ref = doc(db, 'userProfiles', enquiry.userId, 'prescriptions', enquiry.id);
    updateDocumentNonBlocking(ref, { status });
    toast({ title: "Clinical Update", description: `Enquiry for P_${enquiry.userId.substring(0,8)} is now ${status}` });
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2">
      <h2 className="text-2xl font-black uppercase text-gray-900">Patient Enquiries</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {isLoading ? (
          <div className="col-span-full py-20 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : enquiries?.length ? enquiries.map(enq => (
          <Card key={enq.id} className="rounded-[32px] overflow-hidden border-none shadow-sm bg-white hover:shadow-lg transition-all flex flex-col">
             <div className="aspect-[4/5] relative bg-gray-100">
                <img src={enq.imageUrl} alt="Prescription" className="w-full h-full object-cover" />
                <Badge className={`absolute top-3 right-3 text-white text-[8px] font-black uppercase border-none ${enq.status === 'Pending Review' ? 'bg-orange-500' : 'bg-green-600'}`}>
                  {enq.status}
                </Badge>
             </div>
             <CardContent className="p-5 flex-1 flex flex-col">
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Patient Ref</p>
                <p className="text-[10px] font-black text-gray-900 truncate mb-4 uppercase tracking-tighter">P_{enq.userId?.substring(0,8).toUpperCase() || 'ANONYMOUS'}</p>
                <div className="mt-auto flex flex-col gap-2">
                  <Button 
                    onClick={() => updateStatus(enq, 'Acknowledged')} 
                    disabled={enq.status === 'Acknowledged'}
                    size="sm" 
                    className="w-full rounded-full h-8 font-black uppercase text-[8px] tracking-widest gap-2"
                  >
                    <CheckCircle2 className="w-3 h-3" /> Approve Enquiry
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full rounded-full h-8 font-black uppercase text-[8px] tracking-widest">Detail View</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl p-0 overflow-hidden border-none rounded-[40px]">
                      <div className="grid md:grid-cols-2">
                        <div className="bg-black flex items-center justify-center p-4">
                          <img src={enq.imageUrl} alt="Prescription" className="max-h-[80vh] w-auto object-contain" />
                        </div>
                        <div className="p-10 space-y-6 bg-white">
                          <Badge className="bg-primary/5 text-primary border-none text-[10px] uppercase font-black tracking-widest mb-4">Clinical Review</Badge>
                          <h2 className="text-2xl font-black uppercase tracking-tight">Prescription Review</h2>
                          <div className="space-y-4">
                            <div className="bg-gray-50 p-4 rounded-2xl">
                              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Upload Source</p>
                              <p className="font-bold text-gray-900 text-sm">Patient Portal (ID: {enq.userId})</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-2xl">
                              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Clinical Note</p>
                              <p className="font-bold text-gray-900 text-sm">{enq.analysisSummary || 'No clinical analysis available.'}</p>
                            </div>
                          </div>
                          <div className="pt-6 border-t space-y-3">
                            <Button onClick={() => updateStatus(enq, 'Acknowledged')} className="w-full h-14 rounded-full font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20">Verify Prescription</Button>
                            <Button variant="ghost" className="w-full text-red-500 font-black uppercase text-[9px] tracking-widest">Reject Enquiry</Button>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
             </CardContent>
          </Card>
        )) : (
          <div className="col-span-full py-20 text-center bg-white rounded-[32px] border border-dashed">
            <p className="text-gray-400 font-bold uppercase text-[9px] tracking-widest">No prescription enquiries found</p>
          </div>
        )}
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
    toast({ title: "Logistics Updated", description: `Order ${order.id.substring(0,6)} is now ${status}` });
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2">
      <h2 className="text-2xl font-black uppercase text-gray-900">Order Fulfillment</h2>
      <Card className="rounded-[24px] overflow-hidden border-none shadow-sm bg-white">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-[9px] font-black uppercase text-gray-400 border-b">
            <tr>
              <th className="px-8 py-6">Order ID</th>
              <th className="px-8 py-6">Items</th>
              <th className="px-8 py-6">Value</th>
              <th className="px-8 py-6">Status</th>
              <th className="px-8 py-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr><td colSpan={5} className="p-20 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></td></tr>
            ) : orders?.length ? orders.map(order => (
              <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-8 py-6">
                   <div className="flex flex-col">
                      <span className="font-black text-gray-900 text-xs">#{order.id.substring(0,8).toUpperCase()}</span>
                      <span className="text-[8px] text-gray-400 uppercase font-black tracking-widest">P_{order.userId?.substring(0,6)}</span>
                   </div>
                </td>
                <td className="px-8 py-6">
                  <span className="text-[10px] font-bold text-gray-500 uppercase">{order.items?.length || 0} Clinical SKUs</span>
                </td>
                <td className="px-8 py-6 font-black text-primary text-sm">₹{order.totalAmount}</td>
                <td className="px-8 py-6">
                  <Badge variant="outline" className={`text-[8px] uppercase font-black border-none px-3 py-1 rounded-full ${
                    order.status === 'Pending' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'
                  }`}>
                    {order.status}
                  </Badge>
                </td>
                <td className="px-8 py-6 text-right">
                  {order.status !== 'Delivered' && (
                    <div className="flex justify-end gap-2">
                      <Button 
                        onClick={() => updateStatus(order, 'Shipped')} 
                        disabled={order.status === 'Shipped'}
                        size="sm" 
                        className="rounded-full h-9 px-5 font-black uppercase text-[8px] tracking-widest shadow-md shadow-primary/20"
                      >
                        Dispatch
                      </Button>
                      <Button 
                        onClick={() => updateStatus(order, 'Delivered')} 
                        variant="outline"
                        size="sm" 
                        className="rounded-full h-9 px-5 font-black uppercase text-[8px] tracking-widest border-2"
                      >
                        Mark Delivered
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            )) : (
              <tr><td colSpan={5} className="p-10 text-center text-[9px] text-gray-400 font-black uppercase">Fulfillment queue empty</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
