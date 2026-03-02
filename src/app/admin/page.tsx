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
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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
import { doc, collection, query, orderBy, collectionGroup, getDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';

type AdminTab = 'overview' | 'inventory' | 'enquiries' | 'fulfillment';

export default function SupervisorConsole() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const performVerification = async () => {
    if (!db || !user) return;
    setIsVerifying(true);
    try {
      const snap = await getDoc(doc(db, 'roles_admin', user.uid));
      if (snap.exists()) {
        setTimeout(() => {
          setIsVerified(true);
          setIsVerifying(false);
          toast({ title: "Clinical Clear", description: "Operational paths synchronized." });
        }, 1500);
      } else {
        setIsVerified(false);
        setIsVerifying(false);
      }
    } catch (err) {
      setIsVerified(false);
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (user && !isVerified) {
      performVerification();
    }
  }, [user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Invalid Credentials', description: 'Access key rejected.' });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setIsVerified(false);
    signOut(auth);
  };

  const bootstrapAdmin = () => {
    if (!db || !user) return;
    setDocumentNonBlocking(doc(db, 'roles_admin', user.uid), {
      uid: user.uid,
      role: 'admin',
      activatedAt: new Date().toISOString()
    }, { merge: true });
    toast({ title: 'Requesting Authority', description: 'Synchronizing... please wait 5 seconds.' });
    setTimeout(performVerification, 5000);
  };

  if (isUserLoading || isVerifying) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F7F6] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Verifying security context...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F7F6] p-4">
        <Card className="max-w-md w-full rounded-[40px] shadow-2xl border-none overflow-hidden bg-white">
          <CardHeader className="text-center p-10 bg-primary text-white">
            <Lock className="w-10 h-10 mx-auto mb-4 opacity-50" />
            <CardTitle className="text-2xl font-black uppercase tracking-tight">Supervisor Gateway</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Email ID</Label>
                <Input type="email" placeholder="admin@healthlink.com" value={email} onChange={e => setEmail(e.target.value)} required className="h-14 rounded-2xl bg-gray-50 border-none font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Password</Label>
                <Input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required className="h-14 rounded-2xl bg-gray-50 border-none font-bold" />
              </div>
              <Button type="submit" disabled={authLoading} className="w-full h-14 rounded-full font-black uppercase tracking-widest mt-4">
                {authLoading ? <Loader2 className="animate-spin" /> : "Access Terminal"}
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
          <div>
            <h2 className="text-xl font-black uppercase mb-2">Access Restricted</h2>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed">Identity confirmed, but clinical supervisor role is not yet activated.</p>
          </div>
          <div className="space-y-3 pt-6 border-t">
            <Button onClick={bootstrapAdmin} className="w-full gap-2 rounded-full h-14 bg-orange-600 hover:bg-orange-700 uppercase font-black text-[10px] tracking-widest">
              <UserPlus className="w-4 h-4" /> Initialize Admin Role
            </Button>
            <Button onClick={handleLogout} variant="ghost" className="w-full text-gray-400 font-bold uppercase text-[9px] tracking-widest">Exit Terminal</Button>
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
            <div className="flex items-center gap-2">
              <div className="bg-primary p-1.5 rounded-lg"><ShieldCheck className="text-white w-4 h-4" /></div>
              <span className="font-black text-lg tracking-tighter text-gray-900 uppercase">Supervisor</span>
            </div>
            <nav className="hidden lg:flex gap-1">
              {[
                { id: 'overview', label: 'Dashboard', icon: LayoutGrid },
                { id: 'inventory', label: 'Inventory', icon: Package },
                { id: 'enquiries', label: 'Enquiries', icon: FileText },
                { id: 'fulfillment', label: 'Fulfillment', icon: ShoppingBag }
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
        { name: 'Heart Care', description: 'Cardiac Wellness' },
        { name: 'Gastro', description: 'Acid Control' }
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
          description: 'Janumet is a combination of two anti-diabetic medicines: Sitagliptin and Metformin. It is used to lower high blood sugar levels in patients with Type 2 Diabetes.',
          uses: ['Management of Type 2 Diabetes', 'Improving Glycemic control'],
          sideEffects: ['Nausea', 'Vomiting', 'Stomach upset', 'Headache'],
          howItWorks: 'Sitagliptin works by increasing insulin release from the pancreas and reducing hormones that raise blood sugar. Metformin decreases sugar production in the liver and improves body response to insulin.',
          packSize: 'Strip of 15 tablets',
          strength: '50mg/500mg',
          safetyAdvice: {
            alcohol: "Unsafe. May cause lactic acidosis.",
            pregnancy: "Consult doctor. Generally considered safe if prescribed.",
            breastfeeding: "Consult doctor. Safe if clinical benefits outweigh risks.",
            driving: "Safe. Does not affect alertness.",
            kidney: "Caution required. Adjust dose if creatinine levels are high.",
            liver: "Consult doctor. Not recommended in severe liver disease."
          }
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
          description: 'Bio-equivalent generic version of Sitagliptin + Metformin. Clinically identical to branded alternatives but more affordable.',
          uses: ['Management of Type 2 Diabetes', 'Affordable glucose control'],
          sideEffects: ['Nausea', 'Mild digestive upset'],
          howItWorks: 'Same clinical pathway as Janumet. Sourced from WHO-GMP certified facilities.',
          packSize: 'Strip of 15 tablets',
          strength: '50mg/500mg',
          safetyAdvice: {
            alcohol: "Unsafe. Risk of metabolic complications.",
            pregnancy: "Consult doctor.",
            breastfeeding: "Consult doctor.",
            driving: "Safe.",
            kidney: "Dose adjustment needed.",
            liver: "Consult doctor."
          }
        }
      ];

      for (const med of medicines) {
        await addDocumentNonBlocking(collection(db, 'medicines'), med);
      }

      toast({ title: "Master Catalog Seeded", description: "Therapeutic categories and clinical product pairs initialized." });
    } catch (e) {
      toast({ variant: 'destructive', title: "Seeding Aborted" });
    } finally {
      setSeeding(false);
    }
  };

  return (
    <Button onClick={seed} disabled={seeding} variant="outline" className="rounded-xl border-2 font-black text-[9px] uppercase gap-1.5 h-10 px-4">
      {seeding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
      Seed Catalog
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
      <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Active SKUs', icon: Package, count: meds?.length || 0, tab: 'inventory' as AdminTab },
          { label: 'Enquiries', icon: FileText, count: pres?.length || 0, tab: 'enquiries' as AdminTab },
          { label: 'Fulfillment', icon: ShoppingBag, count: orders?.filter(o => o.status !== 'Delivered').length || 0, tab: 'fulfillment' as AdminTab },
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

  const filtered = medicines?.filter(m => 
    m.name?.toLowerCase().includes(search.toLowerCase()) || 
    m.saltComposition?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black uppercase text-gray-900">SKU Master</h2>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10 rounded-full border-none bg-white font-bold text-xs" />
        </div>
      </div>

      <Card className="rounded-[24px] overflow-hidden border-none shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[9px] font-black uppercase text-gray-400 border-b">
              <tr>
                <th className="px-8 py-6">Product</th>
                <th className="px-8 py-6">Composition</th>
                <th className="px-8 py-6 text-center">Price</th>
                <th className="px-8 py-6 text-center">Stock</th>
                <th className="px-8 py-6 text-right">Action</th>
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
                      {med.availableQuantity}
                    </Badge>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <Button variant="ghost" size="icon" className="text-gray-300 hover:text-red-500 rounded-full" onClick={() => {
                      deleteDocumentNonBlocking(doc(db, 'medicines', med.id));
                      toast({ title: "SKU Purged", description: "Removed from database." });
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

function EnquiriesTab({ db, isVerified }: { db: any, isVerified: boolean }) {
  const presQuery = useMemoFirebase(() => isVerified ? query(collectionGroup(db, 'prescriptions'), orderBy('uploadDate', 'desc')) : null, [db, isVerified]);
  const { data: enquiries, isLoading } = useCollection(presQuery);
  const { toast } = useToast();

  const updateStatus = (enquiry: any, status: string) => {
    const ref = doc(db, 'userProfiles', enquiry.userId, 'prescriptions', enquiry.id);
    updateDocumentNonBlocking(ref, { status });
    toast({ title: "Clinical Update", description: `Status: ${status}` });
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2">
      <h2 className="text-2xl font-black uppercase text-gray-900">Enquiries</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {isLoading ? (
          <div className="col-span-full py-20 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : enquiries?.length ? enquiries.map(enq => (
          <Card key={enq.id} className="rounded-[32px] overflow-hidden border-none shadow-sm bg-white hover:shadow-lg transition-all flex flex-col">
             <div className="aspect-[4/5] relative bg-gray-100">
                <img src={enq.imageUrl} alt="Prescription" className="w-full h-full object-cover" />
                <Badge className="absolute top-3 right-3 bg-primary text-white text-[8px] font-black uppercase">{enq.status}</Badge>
             </div>
             <CardContent className="p-5 flex-1 flex flex-col">
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Patient Ref</p>
                <p className="text-[10px] font-black text-gray-900 truncate mb-4">ID_{enq.userId.substring(0,8).toUpperCase()}</p>
                <div className="mt-auto flex gap-2">
                  <Button onClick={() => updateStatus(enq, 'Acknowledged')} size="sm" className="flex-1 rounded-full h-8 font-black uppercase text-[8px] tracking-widest">OK</Button>
                  <Button variant="outline" size="sm" className="flex-1 rounded-full h-8 font-black uppercase text-[8px] tracking-widest">Detail</Button>
                </div>
             </CardContent>
          </Card>
        )) : (
          <div className="col-span-full py-20 text-center bg-white rounded-[32px] border border-dashed">
            <p className="text-gray-400 font-bold uppercase text-[9px] tracking-widest">No enquiries found</p>
          </div>
        )}
      </div>
    </div>
  );
}

function FulfillmentTab({ db, isVerified }: { db: any, isVerified: boolean }) {
  const ordersQuery = useMemoFirebase(() => isVerified ? query(collectionGroup(db, 'orders'), orderBy('orderDate', 'desc')) : null, [db, isVerified]);
  const { data: orders, isLoading } = useCollection(ordersQuery);
  const { toast } = useToast();

  const updateStatus = (order: any, status: string) => {
    const ref = doc(db, 'userProfiles', order.userId, 'orders', order.id);
    updateDocumentNonBlocking(ref, { status });
    toast({ title: "Fulfillment Update", description: `Order: ${status}` });
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2">
      <h2 className="text-2xl font-black uppercase text-gray-900">Logistics</h2>
      <Card className="rounded-[24px] overflow-hidden border-none shadow-sm bg-white">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-[9px] font-black uppercase text-gray-400 border-b">
            <tr>
              <th className="px-8 py-6">Order ID</th>
              <th className="px-8 py-6">Value</th>
              <th className="px-8 py-6">Status</th>
              <th className="px-8 py-6 text-right">Dispatch</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr><td colSpan={4} className="p-20 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></td></tr>
            ) : orders?.length ? orders.map(order => (
              <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-8 py-6 font-black text-gray-900 text-xs">#{order.id.substring(0,8).toUpperCase()}</td>
                <td className="px-8 py-6 font-black text-primary text-sm">₹{order.totalAmount}</td>
                <td className="px-8 py-6">
                  <Badge variant="outline" className="text-[8px] uppercase font-bold">{order.status}</Badge>
                </td>
                <td className="px-8 py-6 text-right">
                  {order.status !== 'Delivered' && (
                    <Button onClick={() => updateStatus(order, 'Shipped')} size="sm" className="rounded-full h-8 px-4 font-black uppercase text-[8px] tracking-widest">Ship</Button>
                  )}
                </td>
              </tr>
            )) : (
              <tr><td colSpan={4} className="p-10 text-center text-[9px] text-gray-400 font-black uppercase">Queue Empty</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
