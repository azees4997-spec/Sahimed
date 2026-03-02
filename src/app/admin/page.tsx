
"use client"

import { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  LogOut, 
  Loader2, 
  Package, 
  Database, 
  Tags, 
  ShoppingBag, 
  ShieldAlert,
  UserPlus,
  AlertTriangle,
  Lock,
  Plus,
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { 
  useUser, 
  useFirestore, 
  useDoc, 
  useAuth, 
  useMemoFirebase, 
  useCollection,
  setDocumentNonBlocking
} from '@/firebase';
import { doc, collection, query, orderBy, collectionGroup, getDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';

type AdminTab = 'dashboard' | 'medicines' | 'categories' | 'orders';

export default function SupervisorConsole() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isServerConfirmed, setIsServerConfirmed] = useState(false);

  // 1. Role Check: Watch the roles_admin collection for the current UID
  const adminRoleRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'roles_admin', user.uid);
  }, [db, user]);

  const { data: adminRole, isLoading: isAdminRoleLoading } = useDoc(adminRoleRef);

  // 2. Explicit Verification: Ensure the role is synchronized with the server before unlocking
  useEffect(() => {
    if (adminRole && !isServerConfirmed) {
      setIsVerifying(true);
      getDoc(doc(db, 'roles_admin', user!.uid)).then((snap) => {
        if (snap.exists()) {
          setIsServerConfirmed(true);
        }
      }).catch(() => {
        setIsServerConfirmed(false);
      }).finally(() => setIsVerifying(false));
    }
  }, [adminRole, db, user, isServerConfirmed]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Login Failed', description: 'Invalid supervisor credentials.' });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setIsServerConfirmed(false);
    signOut(auth);
  };

  const claimAdminRole = () => {
    if (!db || !user) return;
    setDocumentNonBlocking(doc(db, 'roles_admin', user.uid), {
      uid: user.uid,
      role: 'admin',
      activatedAt: new Date().toISOString()
    }, { merge: true });
    toast({ title: 'Authorization Requested', description: 'Granting supervisor access to your account...' });
  };

  if (isUserLoading || (user && isAdminRoleLoading) || isVerifying) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F7F6] gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Verifying Security Context...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F7F6] p-4">
        <Card className="max-w-md w-full rounded-[48px] shadow-2xl border-none overflow-hidden">
          <CardHeader className="text-center p-12 bg-primary text-white">
            <div className="w-20 h-20 bg-white/20 rounded-[32px] flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
              <Lock className="w-10 h-10" />
            </div>
            <CardTitle className="text-3xl font-black uppercase tracking-tight">Supervisor Hub</CardTitle>
            <CardDescription className="text-white/70">Secure Operational Command Center</CardDescription>
          </CardHeader>
          <CardContent className="p-10 bg-white">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Admin Email</Label>
                <Input type="email" placeholder="admin@healthlink.com" value={email} onChange={e => setEmail(e.target.value)} required className="h-14 rounded-2xl bg-gray-50 border-none font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Security Key</Label>
                <Input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required className="h-14 rounded-2xl bg-gray-50 border-none font-bold" />
              </div>
              <Button type="submit" disabled={authLoading} className="w-full h-16 rounded-full font-black uppercase tracking-widest shadow-2xl shadow-primary/20 mt-4">
                Verify & Access
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isServerConfirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F7F6] p-4">
        <Card className="max-w-md w-full rounded-[48px] shadow-2xl border-none p-12 text-center space-y-8 bg-white">
          <div className="bg-orange-50 w-24 h-24 rounded-[40px] flex items-center justify-center mx-auto">
            <ShieldAlert className="w-12 h-12 text-orange-500" />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight mb-2">Access Restricted</h2>
            <p className="text-gray-400 text-sm leading-relaxed">Account <code>{user.uid.substring(0,8)}...</code> is not yet a verified supervisor.</p>
          </div>
          <div className="space-y-4 pt-8 border-t">
            <Button onClick={claimAdminRole} className="w-full gap-3 rounded-full h-16 bg-orange-600 hover:bg-orange-700 shadow-xl shadow-orange-100 uppercase font-black text-xs tracking-widest">
              <UserPlus className="w-6 h-6" /> Initialize Admin Role
            </Button>
            <Button onClick={handleLogout} variant="ghost" className="w-full text-gray-400 font-bold hover:bg-gray-50">Sign Out</Button>
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
              <div className="bg-primary p-2.5 rounded-2xl shadow-xl shadow-primary/20"><ShieldCheck className="text-white w-6 h-6" /></div>
              <span className="font-black text-2xl tracking-tighter text-gray-900 uppercase">Supervisor Hub</span>
            </div>
            <nav className="hidden lg:flex gap-2">
              {[
                { id: 'dashboard', label: 'Overview', icon: ShieldCheck },
                { id: 'medicines', label: 'Inventory', icon: Package },
                { id: 'categories', label: 'Categories', icon: Tags },
                { id: 'orders', label: 'Fulfillment', icon: ShoppingBag }
              ].map(tab => (
                <Button 
                  key={tab.id} 
                  variant={activeTab === tab.id ? 'secondary' : 'ghost'} 
                  onClick={() => setActiveTab(tab.id as AdminTab)} 
                  className={`rounded-full gap-2 px-6 font-black text-[10px] uppercase tracking-widest h-12 transition-all ${activeTab === tab.id ? 'bg-primary/5 text-primary' : 'text-gray-400'}`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </Button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={handleLogout} size="icon" className="w-12 h-12 rounded-2xl text-gray-400 hover:text-red-500"><LogOut className="w-6 h-6" /></Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* CRITICAL: We pass isServerConfirmed to children to gate their internal queries */}
        {activeTab === 'dashboard' && <DashboardOverview onSwitchTab={setActiveTab} db={db} isVerified={isServerConfirmed} />}
        {activeTab === 'medicines' && <MedicinesMaster db={db} isVerified={isServerConfirmed} />}
        {activeTab === 'categories' && <CategoriesMaster db={db} isVerified={isServerConfirmed} />}
        {activeTab === 'orders' && <OrdersFulfillment db={db} isVerified={isServerConfirmed} />}
      </main>
    </div>
  );
}

function DashboardOverview({ onSwitchTab, db, isVerified }: { onSwitchTab: (t: AdminTab) => void, db: any, isVerified: boolean }) {
  // Public collections are safe to query even before verification, but we wait for consistency
  const medsQuery = useMemoFirebase(() => {
    if (!isVerified) return null;
    return query(collection(db, 'medicines'), orderBy('name', 'asc'));
  }, [db, isVerified]);

  const catsQuery = useMemoFirebase(() => {
    if (!isVerified) return null;
    return query(collection(db, 'categories'), orderBy('name', 'asc'));
  }, [db, isVerified]);

  const { data: medicines } = useCollection(medsQuery);
  const { data: categories } = useCollection(catsQuery);

  const seedData = () => {
    const initialCats = [
      { id: 'cat_diabetes', name: 'Diabetes', description: 'Blood sugar management.' },
      { id: 'cat_heart', name: 'Heart Care', description: 'Cardiovascular support.' },
      { id: 'cat_stomach', name: 'Stomach Care', description: 'Digestive health.' }
    ];
    initialCats.forEach(cat => setDocumentNonBlocking(doc(db, 'categories', cat.id), cat, { merge: true }));

    const initialMeds = [
      { 
        id: 'med_j_1', 
        name: 'Janumet 50/500', 
        price: 1250, 
        saltComposition: 'Sitagliptin 50mg + Metformin 500mg', 
        manufacturerId: 'msd', 
        categoryId: 'cat_diabetes', 
        isGeneric: false, 
        isTopDeal: true, 
        imageUrl: 'https://picsum.photos/seed/med1/300/300', 
        dosageForm: 'Tablet', 
        strength: '50/500mg', 
        availableQuantity: 100,
        description: 'Advanced glycemic control.'
      },
      { 
        id: 'med_sg_1', 
        name: 'Sitagliptin Generic', 
        price: 240, 
        saltComposition: 'Sitagliptin 50mg + Metformin 500mg', 
        manufacturerId: 'hl_labs', 
        categoryId: 'cat_diabetes', 
        isGeneric: true, 
        isTopDeal: false, 
        imageUrl: 'https://picsum.photos/seed/med2/300/300', 
        dosageForm: 'Tablet', 
        strength: '50/500mg', 
        availableQuantity: 500,
        description: 'Bio-equivalent alternative.'
      }
    ];
    initialMeds.forEach(med => setDocumentNonBlocking(doc(db, 'medicines', med.id), med, { merge: true }));
    
    toast({ title: 'Master Catalog Seeded', description: 'Inventory updated with clinical records.' });
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <h1 className="text-5xl font-black text-gray-900 tracking-tighter uppercase">Operations</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {[
          { label: 'Inventory', icon: Package, count: medicines?.length || 0, tab: 'medicines' },
          { label: 'Therapy Hubs', icon: Tags, count: categories?.length || 0, tab: 'categories' },
        ].map(card => (
          <Card key={card.label} className="rounded-[56px] p-10 border-none shadow-sm hover:shadow-2xl transition-all cursor-pointer bg-white" onClick={() => onSwitchTab(card.tab as AdminTab)}>
            <card.icon className="w-10 h-10 text-primary mb-8" />
            <CardTitle className="text-2xl font-black uppercase">{card.label}</CardTitle>
            <p className="text-4xl font-black text-primary mt-3">{card.count}</p>
          </Card>
        ))}
        <Card className="rounded-[56px] p-10 border-none shadow-sm bg-primary text-white flex flex-col justify-between">
          <Database className="w-10 h-10 mb-8" />
          <h3 className="text-2xl font-black uppercase">Master Seed</h3>
          <Button onClick={seedData} className="w-full rounded-full h-14 bg-white text-primary font-black uppercase mt-8 shadow-xl">Execute Seed</Button>
        </Card>
      </div>
    </div>
  );
}

function MedicinesMaster({ db, isVerified }: { db: any, isVerified: boolean }) {
  const medsQuery = useMemoFirebase(() => {
    if (!isVerified) return null;
    return query(collection(db, 'medicines'), orderBy('name', 'asc'));
  }, [db, isVerified]);

  const { data: medicines, isLoading } = useCollection(medsQuery);

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-black uppercase text-gray-900">Medicine Master</h2>
      <Card className="rounded-[48px] overflow-hidden border-none shadow-sm bg-white">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 border-b">
            <tr>
              <th className="px-10 py-8">Clinical Identity</th>
              <th className="px-10 py-8">Composition</th>
              <th className="px-10 py-8">Price</th>
              <th className="px-10 py-8">Stock</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr><td colSpan={4} className="p-32 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></td></tr>
            ) : medicines?.map(med => (
              <tr key={med.id} className="hover:bg-gray-50/50">
                <td className="px-10 py-10">
                  <div className="flex flex-col">
                    <span className="font-black text-gray-900">{med.name}</span>
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{med.dosageForm}</span>
                  </div>
                </td>
                <td className="px-10 py-10 text-xs font-bold text-gray-400 italic">{med.saltComposition}</td>
                <td className="px-10 py-10 font-black">₹{med.price}</td>
                <td className="px-10 py-10">
                  <Badge variant={med.availableQuantity < 50 ? 'destructive' : 'secondary'} className="px-4 py-1.5 rounded-full">
                    {med.availableQuantity} Units
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function CategoriesMaster({ db, isVerified }: { db: any, isVerified: boolean }) {
  const catsQuery = useMemoFirebase(() => {
    if (!isVerified) return null;
    return query(collection(db, 'categories'), orderBy('name', 'asc'));
  }, [db, isVerified]);

  const { data: categories, isLoading } = useCollection(catsQuery);

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-black uppercase text-gray-900">Therapeutic Hubs</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {categories?.map(cat => (
          <Card key={cat.id} className="rounded-[48px] p-12 border-none shadow-sm bg-white hover:shadow-xl transition-all">
            <h3 className="text-2xl font-black uppercase tracking-tight mb-3 text-primary">{cat.name}</h3>
            <p className="text-xs text-gray-400 font-bold leading-relaxed">{cat.description}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

function OrdersFulfillment({ db, isVerified }: { db: any, isVerified: boolean }) {
  // CRITICAL: This global Collection Group query is ONLY initiated after isVerified is true.
  const ordersQuery = useMemoFirebase(() => {
    if (!isVerified) return null;
    return query(collectionGroup(db, 'orders'), orderBy('orderDate', 'desc'));
  }, [db, isVerified]);

  const { data: orders, isLoading, error } = useCollection(ordersQuery);

  if (error) {
    return (
      <Alert variant="destructive" className="rounded-[32px] p-8">
        <AlertTriangle className="h-6 w-6" />
        <AlertTitle className="text-xl font-black uppercase">Security Sync Error</AlertTitle>
        <AlertDescription className="mt-4 font-bold leading-relaxed">
          The global fulfillment stream is waiting for final server confirmation. 
          If you just claimed your role, please wait 15 seconds and refresh the page to allow the security rules to synchronize.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-black uppercase text-gray-900">Fulfillment Command</h2>
      <Card className="rounded-[48px] overflow-hidden border-none shadow-sm bg-white">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 border-b">
            <tr>
              <th className="px-10 py-8">Order ID</th>
              <th className="px-10 py-8">Status</th>
              <th className="px-10 py-8">Items</th>
              <th className="px-10 py-8">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr><td colSpan={4} className="p-32 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></td></tr>
            ) : orders?.map(order => (
              <tr key={order.id} className="hover:bg-gray-50/50">
                <td className="px-10 py-10 font-black">#{order.id.substring(0,8).toUpperCase()}</td>
                <td className="px-10 py-10">
                  <Badge className="rounded-full px-4">{order.status}</Badge>
                </td>
                <td className="px-10 py-10 text-xs font-bold text-gray-400">
                  {order.items?.length || 0} Clinical SKUs
                </td>
                <td className="px-10 py-10 font-black text-primary text-lg">₹{order.totalAmount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
