
"use client"

import { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  LogOut, 
  Loader2, 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  LayoutDashboard, 
  Database, 
  Tags, 
  ShoppingBag, 
  Eye, 
  ShieldAlert,
  UserPlus,
  RefreshCw,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
  useUser, 
  useFirestore, 
  useDoc, 
  useAuth, 
  useMemoFirebase, 
  useCollection,
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking,
  setDocumentNonBlocking
} from '@/firebase';
import { doc, collection, query, orderBy, collectionGroup } from 'firebase/firestore';
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

  // 1. THE GATE: Role Verification
  // We use useDoc to check if the current user's UID exists in the roles_admin collection.
  const adminRoleRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'roles_admin', user.uid);
  }, [db, user]);

  const { data: adminRole, isLoading: isAdminRoleLoading } = useDoc(adminRoleRef);
  
  // This is the critical boolean that prevents premature queries
  const isVerifiedAdmin = !!adminRole;

  // 2. PROTECTED DATA STREAMS: Only initiated if isVerifiedAdmin is true
  const medsQuery = useMemoFirebase(() => {
    if (!db || !isVerifiedAdmin) return null;
    return query(collection(db, 'medicines'), orderBy('name', 'asc'));
  }, [db, isVerifiedAdmin]);
  const { data: medicines, isLoading: isMedsLoading } = useCollection(medsQuery);

  const catsQuery = useMemoFirebase(() => {
    if (!db || !isVerifiedAdmin) return null;
    return query(collection(db, 'categories'), orderBy('name', 'asc'));
  }, [db, isVerifiedAdmin]);
  const { data: categories, isLoading: isCatsLoading } = useCollection(catsQuery);

  const ordersQuery = useMemoFirebase(() => {
    if (!db || !isVerifiedAdmin) return null;
    // Collection Group Query for global order visibility
    return query(collectionGroup(db, 'orders'), orderBy('orderDate', 'desc'));
  }, [db, isVerifiedAdmin]);
  const { data: orders, isLoading: isOrdersLoading } = useCollection(ordersQuery);

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

  const handleLogout = () => signOut(auth);

  const claimAdminRole = () => {
    if (!db || !user) return;
    setDocumentNonBlocking(doc(db, 'roles_admin', user.uid), {
      uid: user.uid,
      role: 'admin',
      activatedAt: new Date().toISOString()
    }, { merge: true });
    toast({ title: 'Authorization Requested', description: 'Registering administrative credentials...' });
  };

  const seedMasterData = () => {
    if (!db || !isVerifiedAdmin) return;
    
    const initialCats = [
      { id: 'cat_chronic', name: 'Chronic Care', description: 'Long-term medication for metabolic and cardiac health.' },
      { id: 'cat_wellness', name: 'Wellness', description: 'Vitamins, supplements, and preventive health.' },
      { id: 'cat_baby', name: 'Baby Care', description: 'Pediatric essentials and nutrition.' }
    ];

    const initialMeds = [
      {
        id: "janumet-50-500",
        name: "Janumet 50/500",
        price: 1250,
        saltComposition: "Sitagliptin + Metformin",
        manufacturer: "MSD",
        categoryId: "cat_chronic",
        category: "Chronic Care",
        description: "Standard branded diabetic management.",
        isGeneric: false,
        dosageForm: "Tablet",
        strength: "50/500mg",
        availableQuantity: 100,
        imageUrl: "https://picsum.photos/seed/j1/300/300",
      },
      {
        id: "ge-sit-50-500",
        name: "Sitagliptin M Generic",
        price: 240,
        saltComposition: "Sitagliptin + Metformin",
        manufacturer: "HealthLink Labs",
        categoryId: "cat_chronic",
        category: "Chronic Care",
        description: "Affordable bio-equivalent alternative.",
        isGeneric: true,
        dosageForm: "Tablet",
        strength: "50/500mg",
        availableQuantity: 500,
        imageUrl: "https://picsum.photos/seed/g1/300/300",
      }
    ];

    initialCats.forEach(cat => setDocumentNonBlocking(doc(db, 'categories', cat.id), cat, { merge: true }));
    initialMeds.forEach(med => setDocumentNonBlocking(doc(db, 'medicines', med.id), med, { merge: true }));
    
    toast({ title: 'Seed Success', description: 'Clinical master data has been initialized.' });
  };

  if (isUserLoading || (user && isAdminRoleLoading)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F7F6] gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Syncing Credentials...</p>
      </div>
    );
  }

  // Not Logged In
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F7F6] p-4">
        <Card className="max-w-md w-full rounded-[48px] shadow-2xl border-none overflow-hidden">
          <CardHeader className="text-center p-12 bg-primary text-white">
            <div className="w-20 h-20 bg-white/20 rounded-[32px] flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
              <ShieldCheck className="w-10 h-10" />
            </div>
            <CardTitle className="text-3xl font-black uppercase tracking-tight">Supervisor Hub</CardTitle>
            <CardDescription className="text-white/70">Secure Operational Command Center</CardDescription>
          </CardHeader>
          <CardContent className="p-10 bg-white">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Operational Email</Label>
                <Input type="email" placeholder="admin@healthlink.com" value={email} onChange={e => setEmail(e.target.value)} required className="h-14 rounded-2xl bg-gray-50 border-none font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Security Key</Label>
                <Input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required className="h-14 rounded-2xl bg-gray-50 border-none font-bold" />
              </div>
              <Button type="submit" disabled={authLoading} className="w-full h-16 rounded-full font-black uppercase tracking-widest shadow-2xl shadow-primary/20 mt-4">
                {authLoading ? <Loader2 className="animate-spin" /> : "Verify & Access"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Logged in but not Authorized as Supervisor
  if (!isVerifiedAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F7F6] p-4">
        <Card className="max-w-md w-full rounded-[48px] shadow-2xl border-none p-12 text-center space-y-8 bg-white">
          <div className="bg-orange-50 w-24 h-24 rounded-[40px] flex items-center justify-center mx-auto">
            <ShieldAlert className="w-12 h-12 text-orange-500" />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight mb-2">Access Restricted</h2>
            <p className="text-gray-400 text-sm leading-relaxed">Your account (<code className="bg-gray-100 px-2 py-0.5 rounded text-xs text-primary">{user.uid}</code>) is not yet verified in the supervisor master.</p>
          </div>
          <div className="space-y-4 pt-8 border-t">
            <p className="text-[10px] text-gray-300 font-black uppercase tracking-widest">Bootstrap Control</p>
            <Button onClick={claimAdminRole} className="w-full gap-3 rounded-full h-16 bg-orange-600 hover:bg-orange-700 shadow-xl shadow-orange-100 uppercase font-black text-xs tracking-widest">
              <UserPlus className="w-6 h-6" /> Claim Supervisor Role
            </Button>
            <Button onClick={handleLogout} variant="ghost" className="w-full text-gray-400 font-bold hover:bg-gray-50">Sign Out</Button>
          </div>
        </Card>
      </div>
    );
  }

  // MAIN DASHBOARD (Authorized)
  return (
    <div className="min-h-screen bg-[#F4F7F6]">
      {/* Top Navigation */}
      <header className="bg-white border-b sticky top-0 z-50 h-24">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-12">
            <div className="flex items-center gap-3">
              <div className="bg-primary p-2.5 rounded-2xl shadow-xl shadow-primary/20"><ShieldCheck className="text-white w-6 h-6" /></div>
              <span className="font-black text-2xl tracking-tighter text-gray-900 uppercase">Supervisor<span className="text-primary">Hub</span></span>
            </div>
            <nav className="hidden lg:flex gap-2">
              {[
                { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
                { id: 'medicines', label: 'Clinical Master', icon: Package },
                { id: 'categories', label: 'Therapeutic Hubs', icon: Tags },
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
            <div className="hidden sm:flex flex-col items-end">
              <p className="text-[10px] font-black uppercase text-gray-400">Authenticated as</p>
              <p className="text-xs font-bold text-gray-900">{user.email}</p>
            </div>
            <Button variant="ghost" onClick={handleLogout} size="icon" className="w-12 h-12 rounded-2xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"><LogOut className="w-6 h-6" /></Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {activeTab === 'dashboard' && (
          <div className="space-y-12 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div>
                <h1 className="text-5xl font-black text-gray-900 tracking-tighter uppercase">Operations</h1>
                <p className="text-gray-400 text-xs font-black uppercase tracking-[0.4em] mt-3">Platform Health & Inventory Monitor</p>
              </div>
              <div className="bg-white p-6 rounded-[32px] shadow-sm border flex items-center gap-5">
                <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center shadow-inner"><RefreshCw className="w-7 h-7 text-green-600" /></div>
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Status</p>
                  <p className="text-sm font-bold text-gray-900">Live Database Synced</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                { label: 'Medicine Master', icon: Package, color: 'text-blue-600', tab: 'medicines', count: medicines?.length || 0 },
                { label: 'Active Orders', icon: ShoppingBag, color: 'text-emerald-600', tab: 'orders', count: orders?.length || 0 },
                { label: 'Therapy Hubs', icon: Tags, color: 'text-orange-500', tab: 'categories', count: categories?.length || 0 },
              ].map(card => (
                <Card 
                  key={card.label} 
                  className="rounded-[56px] p-10 border-none shadow-sm hover:shadow-2xl transition-all cursor-pointer group bg-white" 
                  onClick={() => setActiveTab(card.tab as AdminTab)}
                >
                  <div className={`w-16 h-16 rounded-[28px] bg-gray-50 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                    <card.icon className={`w-8 h-8 ${card.color}`} />
                  </div>
                  <CardTitle className="text-2xl font-black text-gray-900 uppercase tracking-tight">{card.label}</CardTitle>
                  <p className="text-4xl font-black text-primary mt-3">{card.count}</p>
                  <div className="mt-6 flex items-center gap-2 text-[10px] font-black uppercase text-gray-300 group-hover:text-primary transition-colors">
                    Manage Records <ChevronRight className="w-3 h-3" />
                  </div>
                </Card>
              ))}
              
              <Card className="rounded-[56px] p-10 border-none shadow-sm bg-primary text-white flex flex-col justify-between overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                   <Database className="w-32 h-32 rotate-12" />
                </div>
                <div className="relative z-10">
                  <Database className="w-10 h-10 mb-8" />
                  <CardTitle className="text-2xl font-black uppercase mb-2">Master Seed</CardTitle>
                  <p className="text-xs text-white/70 font-bold leading-relaxed">Initialize core pharmacological catalogs and therapeutic hubs instantly.</p>
                </div>
                <Button onClick={seedMasterData} className="relative z-10 w-full rounded-full h-14 bg-white text-primary hover:bg-gray-50 font-black text-xs uppercase tracking-widest mt-8 shadow-2xl">Execute Seed</Button>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'medicines' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-black text-gray-900 uppercase">Clinical Master</h2>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Inventory Control & Pharmacology Management</p>
              </div>
              <Dialog>
                <DialogTrigger asChild><Button className="rounded-full gap-3 px-10 h-16 font-black uppercase text-xs tracking-widest shadow-2xl shadow-primary/30"><Plus className="w-6 h-6" /> New Product</Button></DialogTrigger>
                <MedicineForm categories={categories || []} onSave={data => addDocumentNonBlocking(collection(db, 'medicines'), data)} />
              </Dialog>
            </div>
            
            <Card className="rounded-[48px] overflow-hidden border-none shadow-sm bg-white">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 border-b">
                  <tr>
                    <th className="px-10 py-8 tracking-widest">Clinical Identity</th>
                    <th className="px-10 py-8 tracking-widest">Pricing</th>
                    <th className="px-10 py-8 tracking-widest">Stock Units</th>
                    <th className="px-10 py-8 text-right tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {isMedsLoading ? (
                    <tr><td colSpan={4} className="p-32 text-center"><Loader2 className="animate-spin mx-auto text-primary w-12 h-12" /></td></tr>
                  ) : medicines?.map(med => (
                    <tr key={med.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-10 py-10">
                        <div className="flex items-center gap-6">
                          <div className="w-16 h-16 bg-gray-100 rounded-2xl overflow-hidden shrink-0 shadow-inner">
                            <img src={med.imageUrl} className="w-full h-full object-contain p-3" alt={med.name} />
                          </div>
                          <div>
                            <div className="font-black text-gray-900 text-xl tracking-tight">{med.name}</div>
                            <div className="text-[10px] text-gray-400 font-black uppercase tracking-tight mt-1">{med.saltComposition}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-10">
                        <div className="font-black text-gray-900 text-2xl">₹{med.price}</div>
                        {med.isGeneric && <Badge className="bg-emerald-50 text-emerald-700 text-[8px] font-black uppercase px-3 h-6 mt-2 border-none">Verified Generic</Badge>}
                      </td>
                      <td className="px-10 py-10">
                        <Badge variant={med.availableQuantity < 50 ? 'destructive' : 'secondary'} className="px-5 py-2 rounded-full font-black text-[10px] uppercase">
                          {med.availableQuantity} Units
                        </Badge>
                      </td>
                      <td className="px-10 py-10 text-right">
                        <div className="flex justify-end gap-3">
                          <Dialog>
                            <DialogTrigger asChild><Button variant="ghost" size="icon" className="w-12 h-12 rounded-2xl hover:bg-primary/5 text-gray-400 hover:text-primary transition-all"><Edit className="w-6 h-6" /></Button></DialogTrigger>
                            <MedicineForm initialData={med} categories={categories || []} onSave={data => updateDocumentNonBlocking(doc(db, 'medicines', med.id), data)} />
                          </Dialog>
                          <Button variant="ghost" size="icon" className="w-12 h-12 rounded-2xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all" onClick={() => deleteDocumentNonBlocking(doc(db, 'medicines', med.id))}><Trash2 className="w-6 h-6" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!isMedsLoading && medicines?.length === 0 && (
                    <tr><td colSpan={4} className="p-40 text-center text-gray-400 font-black uppercase tracking-[0.2em]">Catalog Empty. Execute master seed.</td></tr>
                  )}
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6">
            <div>
              <h2 className="text-3xl font-black text-gray-900 uppercase">Fulfillment command</h2>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Global Logistics Lifecycle Monitor</p>
            </div>
            
            <Card className="rounded-[48px] overflow-hidden border-none shadow-sm bg-white">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 border-b">
                  <tr>
                    <th className="px-10 py-8 tracking-widest">Batch Reference</th>
                    <th className="px-10 py-8 tracking-widest">Status</th>
                    <th className="px-10 py-8 tracking-widest">Commercials</th>
                    <th className="px-10 py-8 text-right tracking-widest">Review</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {isOrdersLoading ? (
                    <tr><td colSpan={4} className="p-32 text-center"><Loader2 className="animate-spin mx-auto text-primary w-12 h-12" /></td></tr>
                  ) : orders?.map(order => (
                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-10 py-10">
                        <div className="font-black text-gray-900 text-xl uppercase tracking-tighter">#{order.id.substring(0,8)}</div>
                        <div className="text-[10px] text-gray-400 font-bold mt-1">
                          {order.orderDate?.toDate ? order.orderDate.toDate().toLocaleString() : 'Syncing...'}
                        </div>
                      </td>
                      <td className="px-10 py-10">
                        <Badge className={`px-5 py-2 rounded-full font-black text-[10px] uppercase border-none ${
                          order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-700' : 
                          order.status === 'Processing' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {order.status}
                        </Badge>
                      </td>
                      <td className="px-10 py-10">
                        <div className="font-black text-gray-900 text-2xl">₹{order.totalAmount}</div>
                        <div className="text-[10px] text-gray-400 font-black uppercase mt-1">{order.paymentStatus}</div>
                      </td>
                      <td className="px-10 py-10 text-right">
                        <Dialog>
                          <DialogTrigger asChild><Button variant="ghost" size="icon" className="w-14 h-14 rounded-2xl hover:bg-primary/5 text-primary transition-all"><Eye className="w-7 h-7" /></Button></DialogTrigger>
                          <FulfillmentDetail order={order} db={db} />
                        </Dialog>
                      </td>
                    </tr>
                  ))}
                  {!isOrdersLoading && orders?.length === 0 && (
                    <tr><td colSpan={4} className="p-40 text-center text-gray-400 font-black uppercase tracking-[0.2em]">Waiting for clinical orders...</td></tr>
                  )}
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-black text-gray-900 uppercase">Therapeutic Hubs</h2>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Medical Classification Management</p>
              </div>
              <Dialog>
                <DialogTrigger asChild><Button className="rounded-full gap-3 px-10 h-16 font-black uppercase text-xs tracking-widest shadow-2xl shadow-primary/30"><Plus className="w-6 h-6" /> New Hub</Button></DialogTrigger>
                <CategoryForm onSave={data => addDocumentNonBlocking(collection(db, 'categories'), data)} />
              </Dialog>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {categories?.map(cat => (
                <Card key={cat.id} className="rounded-[48px] p-12 border-none shadow-sm hover:shadow-2xl transition-all bg-white relative group">
                  <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-3">{cat.name}</h3>
                  <p className="text-xs text-gray-400 font-bold leading-relaxed mb-10">{cat.description}</p>
                  <div className="flex gap-3">
                    <Dialog>
                      <DialogTrigger asChild><Button variant="outline" size="sm" className="rounded-full px-8 h-12 font-black text-[10px] uppercase tracking-widest border-2">Edit Hub</Button></DialogTrigger>
                      <CategoryForm initialData={cat} onSave={data => updateDocumentNonBlocking(doc(db, 'categories', cat.id), data)} />
                    </Dialog>
                    <Button variant="ghost" size="sm" className="rounded-full text-red-500 hover:bg-red-50 h-12 px-6 font-black text-[10px] uppercase tracking-widest" onClick={() => deleteDocumentNonBlocking(doc(db, 'categories', cat.id))}>Delete</Button>
                  </div>
                </Card>
              ))}
              {!isCatsLoading && categories?.length === 0 && (
                <div className="col-span-full p-32 text-center text-gray-400 font-black uppercase tracking-[0.2em] border-2 border-dashed rounded-[48px]">Initialize hubs to structure catalog.</div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Sub-components
function MedicineForm({ initialData, categories, onSave }: { initialData?: any, categories: any[], onSave: (data: any) => void }) {
  const [formData, setFormData] = useState(initialData || { name: '', price: 0, saltComposition: '', manufacturer: '', categoryId: '', availableQuantity: 100, isGeneric: false, imageUrl: 'https://picsum.photos/seed/med/300/300', dosageForm: 'Tablet', strength: '500mg', description: '' });
  
  return (
    <DialogContent className="max-w-3xl rounded-[56px] p-0 overflow-hidden border-none shadow-2xl">
      <CardHeader className="bg-primary text-white p-12">
        <CardTitle className="text-3xl font-black uppercase tracking-tight">Medicine Record</CardTitle>
        <CardDescription className="text-white/70">Define pharmacological master details</CardDescription>
      </CardHeader>
      <div className="p-12 bg-white grid grid-cols-2 gap-8">
        <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Brand Identity</Label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="h-14 rounded-2xl bg-gray-50 border-none font-bold" /></div>
        <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Manufacturer</Label><Input value={formData.manufacturer} onChange={e => setFormData({...formData, manufacturer: e.target.value})} className="h-14 rounded-2xl bg-gray-50 border-none font-bold" /></div>
        <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Clinical Valuation (INR)</Label><Input type="number" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="h-14 rounded-2xl bg-gray-50 border-none font-bold" /></div>
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Therapeutic Hub</Label>
          <select value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})} className="w-full h-14 border-none rounded-2xl px-5 text-sm font-bold bg-gray-50 focus:ring-2 focus:ring-primary outline-none">
            <option value="">Select Category</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="col-span-2 space-y-2"><Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Active Salt Composition</Label><Input value={formData.saltComposition} onChange={e => setFormData({...formData, saltComposition: e.target.value})} className="h-14 rounded-2xl bg-gray-50 border-none font-bold" /></div>
        <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Dosage Form</Label><Input value={formData.dosageForm} onChange={e => setFormData({...formData, dosageForm: e.target.value})} className="h-14 rounded-2xl bg-gray-50 border-none font-bold" /></div>
        <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Inventory Units</Label><Input type="number" value={formData.availableQuantity} onChange={e => setFormData({...formData, availableQuantity: Number(e.target.value)})} className="h-14 rounded-2xl bg-gray-50 border-none font-bold" /></div>
        <div className="col-span-2 flex items-center justify-between bg-emerald-50 p-8 rounded-3xl border border-dashed border-emerald-100">
          <div>
            <Label className="text-base font-black text-emerald-900 uppercase">Bio-Equivalent Generic</Label>
            <p className="text-[10px] text-emerald-600/70 font-bold uppercase tracking-tight mt-1">Flag as high-savings alternative</p>
          </div>
          <Switch checked={formData.isGeneric} onCheckedChange={v => setFormData({...formData, isGeneric: v})} />
        </div>
      </div>
      <DialogFooter className="p-12 bg-gray-50 flex gap-4">
        <Button onClick={() => onSave(formData)} className="w-full rounded-full h-16 font-black uppercase text-sm tracking-widest shadow-2xl shadow-primary/20">Authorize & Save Record</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function CategoryForm({ initialData, onSave }: { initialData?: any, onSave: (data: any) => void }) {
  const [formData, setFormData] = useState(initialData || { name: '', description: '' });
  return (
    <DialogContent className="max-w-xl rounded-[56px] p-0 overflow-hidden border-none shadow-2xl">
      <CardHeader className="bg-primary text-white p-12">
        <CardTitle className="text-3xl font-black uppercase tracking-tight">Therapeutic Hub</CardTitle>
        <CardDescription className="text-white/70">Clinical Categorization Management</CardDescription>
      </CardHeader>
      <div className="p-12 bg-white space-y-8">
        <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Hub Identity</Label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="h-14 rounded-2xl bg-gray-50 border-none font-bold" /></div>
        <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Medical Description</Label><Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="rounded-2xl min-h-[160px] bg-gray-50 border-none font-bold p-5" /></div>
      </div>
      <DialogFooter className="p-12 bg-gray-50">
        <Button onClick={() => onSave(formData)} className="w-full rounded-full h-16 font-black uppercase text-sm tracking-widest shadow-2xl shadow-primary/20">Authorize Hub</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function FulfillmentDetail({ order, db }: { order: any, db: any }) {
  const { toast } = useToast();
  const updateStatus = (s: string) => {
    if (order.userId) {
      // Direct path update to ensure customer dashboard reflects change instantly
      const ref = doc(db, 'userProfiles', order.userId, 'orders', order.id);
      updateDocumentNonBlocking(ref, { status: s });
      toast({ title: 'Lifecycle Updated', description: `Order status changed to ${s}.` });
    }
  };
  return (
    <DialogContent className="max-w-3xl rounded-[56px] p-0 overflow-hidden border-none shadow-2xl">
      <CardHeader className="bg-primary text-white p-12">
        <CardTitle className="text-3xl font-black uppercase tracking-tight">Fulfillment Console</CardTitle>
        <CardDescription className="text-white/70">Order Batch Lifecycle Control</CardDescription>
      </CardHeader>
      <div className="p-12 bg-white space-y-10">
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-gray-50 p-8 rounded-[32px]">
             <p className="text-[10px] font-black uppercase text-gray-400 mb-2">Patient ID</p>
             <p className="font-bold text-gray-900 break-all">{order.userId}</p>
          </div>
          <div className="bg-emerald-50 p-8 rounded-[32px]">
             <p className="text-[10px] font-black uppercase text-emerald-600 mb-2">Transaction Value</p>
             <p className="font-black text-3xl text-emerald-600 tracking-tight">₹{order.totalAmount}</p>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Batch Items</p>
          <div className="max-h-60 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
            {order.items?.map((item: any, i: number) => (
              <div key={i} className="flex justify-between items-center p-6 bg-gray-50 rounded-3xl border border-gray-100">
                <div className="flex flex-col">
                   <span className="font-black text-gray-900 text-lg">{item.name}</span>
                   <span className="text-[10px] text-gray-400 font-bold uppercase mt-1">Qty: {item.quantity} • Unit: ₹{item.unitPrice}</span>
                </div>
                <span className="font-black text-gray-900 text-xl">₹{item.unitPrice * item.quantity}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Lifecycle Command</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {['Pending', 'Processing', 'Shipped', 'Delivered'].map(s => (
              <Button 
                key={s} 
                variant={order.status === s ? 'default' : 'outline'} 
                onClick={() => updateStatus(s)} 
                className={`rounded-full h-14 font-black uppercase text-[10px] tracking-widest transition-all ${order.status === s ? 'shadow-xl shadow-primary/20 scale-105' : 'border-2'}`}
              >
                {s}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </DialogContent>
  );
}
