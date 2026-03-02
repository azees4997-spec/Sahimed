
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
  Zap
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
  useDoc,
  setDocumentNonBlocking,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking,
  addDocumentNonBlocking
} from '@/firebase';
import { doc, collection, query, orderBy, collectionGroup, getDoc, writeBatch } from 'firebase/firestore';
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
  
  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Strictly gate permission check to prevent crash on load
  const performVerification = async () => {
    if (!db || !user) return;
    setIsVerifying(true);
    try {
      const snap = await getDoc(doc(db, 'roles_admin', user.uid));
      if (snap.exists()) {
        // Add a small buffer for security rules propagation to prevent race conditions
        setTimeout(() => {
          setIsVerified(true);
          setIsVerifying(false);
          toast({ title: "Identity Verified", description: "Operational console unlocked." });
        }, 1500);
      } else {
        setIsVerified(false);
        setIsVerifying(false);
      }
    } catch (err) {
      console.error("Verification error:", err);
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
      toast({ variant: 'destructive', title: 'Login Failed', description: 'Invalid clinical credentials.' });
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
    toast({ title: 'Elevating Account', description: 'Registering supervisor role... please wait 3 seconds.' });
    setTimeout(performVerification, 3000);
  };

  if (isUserLoading || isVerifying) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F7F6] gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Synchronizing Clinical Permissions...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F7F6] p-4">
        <Card className="max-w-md w-full rounded-[40px] shadow-2xl border-none overflow-hidden bg-white">
          <CardHeader className="text-center p-12 bg-primary text-white">
            <div className="w-20 h-20 bg-white/20 rounded-[32px] flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
              <Lock className="w-10 h-10" />
            </div>
            <CardTitle className="text-3xl font-black uppercase tracking-tight text-white">Clinical Gateway</CardTitle>
            <CardDescription className="text-white/70 font-bold uppercase text-[10px] tracking-widest mt-2">Verified Personnel Only</CardDescription>
          </CardHeader>
          <CardContent className="p-10">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Username</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="h-14 rounded-2xl bg-gray-50 border-none font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Access Key</Label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="h-14 rounded-2xl bg-gray-50 border-none font-bold" />
              </div>
              <Button type="submit" disabled={authLoading} className="w-full h-16 rounded-full font-black uppercase tracking-widest shadow-2xl shadow-primary/20 mt-4">
                {authLoading ? <Loader2 className="animate-spin" /> : "Initiate Verification"}
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
        <Card className="max-w-md w-full rounded-[40px] shadow-2xl border-none p-12 text-center space-y-8 bg-white">
          <div className="bg-orange-50 w-24 h-24 rounded-[40px] flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert className="w-12 h-12 text-orange-500" />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight mb-2 text-gray-900">Access Restricted</h2>
            <p className="text-gray-400 text-sm font-bold uppercase tracking-widest leading-relaxed">This terminal requires Supervisor Privileges. Would you like to initialize this account as an Administrator?</p>
          </div>
          <div className="space-y-4 pt-8 border-t">
            <Button onClick={bootstrapAdmin} className="w-full gap-3 rounded-full h-16 bg-orange-600 hover:bg-orange-700 shadow-xl shadow-orange-100 uppercase font-black text-xs tracking-widest">
              <UserPlus className="w-6 h-6 text-white" /> Initialize Admin Role
            </Button>
            <Button onClick={handleLogout} variant="ghost" className="w-full text-gray-400 font-bold hover:bg-gray-50 uppercase text-[10px] tracking-widest">Sign Out</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7F6]">
      <header className="bg-white border-b sticky top-0 z-50 h-24">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-12">
            <div className="flex items-center gap-3">
              <div className="bg-primary p-2.5 rounded-xl shadow-xl shadow-primary/20"><ShieldCheck className="text-white w-6 h-6" /></div>
              <span className="font-black text-2xl tracking-tighter text-gray-900 uppercase">Supervisor Hub</span>
            </div>
            <nav className="hidden lg:flex gap-2">
              {[
                { id: 'overview', label: 'Overview', icon: LayoutGrid },
                { id: 'inventory', label: 'Inventory', icon: Package },
                { id: 'enquiries', label: 'Enquiries', icon: FileText },
                { id: 'fulfillment', label: 'Fulfillment', icon: ShoppingBag }
              ].map(tab => (
                <Button 
                  key={tab.id} 
                  variant={activeTab === tab.id ? 'secondary' : 'ghost'} 
                  onClick={() => setActiveTab(tab.id as AdminTab)} 
                  className={`rounded-full gap-2 px-6 font-black text-[10px] uppercase tracking-widest h-12 transition-all ${activeTab === tab.id ? 'bg-primary/5 text-primary' : 'text-gray-400 hover:text-primary'}`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </Button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <SeedDataButton db={db} />
            <Button variant="ghost" onClick={handleLogout} size="icon" className="w-12 h-12 rounded-2xl text-gray-400 hover:text-red-500 hover:bg-red-50"><LogOut className="w-6 h-6" /></Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
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
        { name: 'Diabetes', description: 'Blood sugar management' },
        { name: 'Heart Care', description: 'Cardiac health essentials' },
        { name: 'Stomach Care', description: 'Digestive & gut health' },
        { name: 'Liver Care', description: 'Hepatic support' },
        { name: 'Derma Care', description: 'Skin solutions' },
        { name: 'Respicare', description: 'Lung health' }
      ];

      for (const cat of categories) {
        await addDocumentNonBlocking(collection(db, 'categories'), cat);
      }

      const medicines = [
        { name: 'Janumet 50/500', price: 1250, saltComposition: 'Sitagliptin + Metformin', manufacturer: 'MSD', isGeneric: false, category: 'Diabetes', imageUrl: 'https://picsum.photos/seed/dia1/300/300', availableQuantity: 100, description: 'Premium glycemic control used for T2 Diabetes.' },
        { name: 'Sitagliptin Generic', price: 240, saltComposition: 'Sitagliptin + Metformin', manufacturer: 'HealthLink', isGeneric: true, category: 'Diabetes', imageUrl: 'https://picsum.photos/seed/dia2/300/300', availableQuantity: 500, description: 'Affordable bio-equivalent for blood sugar control.' },
        { name: 'Atorva 20mg', price: 450, saltComposition: 'Atorvastatin', manufacturer: 'Zydus', isGeneric: false, category: 'Heart Care', imageUrl: 'https://picsum.photos/seed/hrt1/300/300', availableQuantity: 80, description: 'High-quality lipid regulator.' },
        { name: 'Atorvastatin Generic', price: 85, saltComposition: 'Atorvastatin', manufacturer: 'PureLabs', isGeneric: true, category: 'Heart Care', imageUrl: 'https://picsum.photos/seed/hrt2/300/300', availableQuantity: 1000, description: 'Verified generic cholesterol management.' }
      ];

      for (const med of medicines) {
        await addDocumentNonBlocking(collection(db, 'medicines'), med);
      }

      toast({ title: "Database Seeded", description: "Clinical catalog and categories initialized." });
    } catch (e) {
      toast({ variant: 'destructive', title: "Seeding Failed" });
    } finally {
      setSeeding(false);
    }
  };

  return (
    <Button onClick={seed} disabled={seeding} variant="outline" className="rounded-xl border-2 font-black text-[10px] uppercase gap-2 h-12 px-6">
      {seeding ? <Loader2 className="animate-spin" /> : <Database className="w-4 h-4" />}
      Master Seed
    </Button>
  );
}

function OverviewTab({ db, setTab, isVerified }: { db: any, setTab: (t: AdminTab) => void, isVerified: boolean }) {
  const medsQuery = useMemoFirebase(() => query(collection(db, 'medicines')), [db]);
  // Gated queries
  const presQuery = useMemoFirebase(() => isVerified ? query(collectionGroup(db, 'prescriptions')) : null, [db, isVerified]);
  const ordersQuery = useMemoFirebase(() => isVerified ? query(collectionGroup(db, 'orders')) : null, [db, isVerified]);

  const { data: meds } = useCollection(medsQuery);
  const { data: pres } = useCollection(presQuery);
  const { data: orders } = useCollection(ordersQuery);

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <h1 className="text-5xl font-black text-gray-900 tracking-tighter uppercase">Clinical Status</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: 'Medicine SKUs', icon: Package, count: meds?.length || 0, tab: 'inventory' as AdminTab },
          { label: 'User Enquiries', icon: FileText, count: pres?.length || 0, tab: 'enquiries' as AdminTab },
          { label: 'Active Orders', icon: ShoppingBag, count: orders?.filter(o => o.status !== 'Delivered').length || 0, tab: 'fulfillment' as AdminTab },
        ].map(card => (
          <Card key={card.label} className="rounded-[40px] p-10 border-none shadow-sm hover:shadow-2xl transition-all cursor-pointer bg-white group" onClick={() => setTab(card.tab)}>
            <card.icon className="w-12 h-12 text-primary mb-8 group-hover:scale-110 transition-transform" />
            <CardTitle className="text-xl font-black uppercase text-gray-400 tracking-widest mb-2">{card.label}</CardTitle>
            <p className="text-5xl font-black text-primary">{card.count}</p>
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
    <div className="space-y-8 animate-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black uppercase text-gray-900">Medical Inventory</h2>
        <div className="relative w-72">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Filter medicines..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-12 rounded-full border-none shadow-inner bg-white font-bold" />
        </div>
      </div>

      <Card className="rounded-[32px] overflow-hidden border-none shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 border-b">
              <tr>
                <th className="px-10 py-8">Product Identity</th>
                <th className="px-10 py-8">Composition</th>
                <th className="px-10 py-8 text-center">Unit Price</th>
                <th className="px-10 py-8 text-center">Stock</th>
                <th className="px-10 py-8 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr><td colSpan={5} className="p-32 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></td></tr>
              ) : filtered?.map(med => (
                <tr key={med.id} className="hover:bg-gray-50/50 group transition-colors">
                  <td className="px-10 py-10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gray-50 p-2 flex items-center justify-center shrink-0 overflow-hidden">
                        <img src={med.imageUrl} alt="" className="max-w-full max-h-full object-contain" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-black text-gray-900">{med.name}</span>
                        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{med.manufacturer} {med.isGeneric ? '(Generic)' : '(Branded)'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-10">
                    <Badge variant="outline" className="text-[10px] uppercase font-bold border-primary/20 text-primary bg-primary/5">{med.saltComposition}</Badge>
                  </td>
                  <td className="px-10 py-10 font-black text-center text-lg">₹{med.price}</td>
                  <td className="px-10 py-10 text-center">
                    <Badge variant={med.availableQuantity < 50 ? 'destructive' : 'secondary'} className="px-4 py-1.5 rounded-full font-black text-[10px] uppercase">
                      {med.availableQuantity} units
                    </Badge>
                  </td>
                  <td className="px-10 py-10 text-right">
                    <Button variant="ghost" size="icon" className="text-gray-300 hover:text-red-500 rounded-full" onClick={() => {
                      deleteDocumentNonBlocking(doc(db, 'medicines', med.id));
                      toast({ title: "Product Removed", description: "SKU purged from database." });
                    }}>
                      <Trash2 className="w-5 h-5" />
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
    toast({ title: "Enquiry Updated", description: `Marked as ${status}.` });
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4">
      <h2 className="text-3xl font-black uppercase text-gray-900">User Prescription Enquiries</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {isLoading ? (
          <div className="col-span-full py-24 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
        ) : enquiries?.length ? enquiries.map(enq => (
          <Card key={enq.id} className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white hover:shadow-2xl transition-all group flex flex-col">
             <div className="aspect-[3/4] relative bg-gray-50 overflow-hidden">
                <img src={enq.imageUrl} alt="Prescription" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute top-4 right-4">
                   <Badge className={`${enq.status === 'Pending Review' ? 'bg-orange-500' : 'bg-green-600'} text-white rounded-full px-4 py-1.5 uppercase font-black text-[10px]`}>{enq.status}</Badge>
                </div>
             </div>
             <CardContent className="p-8 flex-1 flex flex-col justify-between">
                <div className="mb-6">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">User Reference</p>
                  <p className="text-sm font-black text-gray-900 truncate">PATIENT_{enq.userId.substring(0,8).toUpperCase()}</p>
                  <p className="text-[10px] text-gray-400 mt-1 font-bold">{enq.uploadDate?.toDate ? enq.uploadDate.toDate().toLocaleString() : 'Just now'}</p>
                </div>
                <div className="flex gap-3">
                  {enq.status === 'Pending Review' ? (
                    <Button onClick={() => updateStatus(enq, 'Acknowledged')} className="flex-1 rounded-full h-12 font-black uppercase text-[10px] tracking-widest">Acknowledge</Button>
                  ) : (
                    <Button disabled className="flex-1 rounded-full h-12 font-black uppercase text-[10px] tracking-widest opacity-50">Processed</Button>
                  )}
                  <Button variant="outline" className="flex-1 rounded-full h-12 font-black uppercase text-[10px] tracking-widest border-2">Detail View</Button>
                </div>
             </CardContent>
          </Card>
        )) : (
          <div className="col-span-full py-24 text-center bg-white rounded-[40px] border border-dashed">
            <FileText className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Queue Clear</p>
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
    toast({ title: "Order Synchronized", description: `Logistics status: ${status}.` });
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4">
      <h2 className="text-3xl font-black uppercase text-gray-900">Fulfillment Pipeline</h2>
      <Card className="rounded-[32px] overflow-hidden border-none shadow-sm bg-white">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 border-b">
            <tr>
              <th className="px-10 py-8">Order ID</th>
              <th className="px-10 py-8">Content Summary</th>
              <th className="px-10 py-8 text-center">Total</th>
              <th className="px-10 py-8 text-right">Logistics</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr><td colSpan={4} className="p-32 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></td></tr>
            ) : orders?.length ? orders.map(order => (
              <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-10 py-10 font-black text-gray-900 tracking-tighter">#{order.id.substring(0,8).toUpperCase()}</td>
                <td className="px-10 py-10">
                  <div className="flex flex-col gap-1">
                    <Badge variant="outline" className="rounded-full px-4 border-primary/20 text-primary w-fit font-bold text-[10px]">
                      {order.items?.length || 0} Medicine Items
                    </Badge>
                    <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest">{order.status}</span>
                  </div>
                </td>
                <td className="px-10 py-10 font-black text-primary text-center text-lg">₹{order.totalAmount}</td>
                <td className="px-10 py-10 text-right">
                  <div className="flex justify-end gap-2">
                    {order.status === 'Pending' && (
                      <Button onClick={() => updateStatus(order, 'Processing')} size="sm" className="rounded-full font-black text-[8px] uppercase px-4 h-8 bg-orange-600 shadow-lg shadow-orange-100 text-white">Process</Button>
                    )}
                    {order.status === 'Processing' && (
                      <Button onClick={() => updateStatus(order, 'Shipped')} size="sm" className="rounded-full font-black text-[8px] uppercase px-4 h-8 bg-blue-600 shadow-lg shadow-blue-100 text-white">Dispatch</Button>
                    )}
                    {order.status === 'Shipped' && (
                      <Button onClick={() => updateStatus(order, 'Delivered')} size="sm" className="rounded-full font-black text-[8px] uppercase px-4 h-8 bg-green-600 shadow-lg shadow-green-100 text-white">Complete</Button>
                    )}
                    {order.status === 'Delivered' && (
                      <div className="text-green-600 font-black uppercase text-[10px] px-4 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> Fulfilled
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={4} className="p-24 text-center text-gray-400 font-bold uppercase text-[10px] tracking-widest">Pipeline Empty</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
