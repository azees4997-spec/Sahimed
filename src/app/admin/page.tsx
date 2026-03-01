
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
  Search
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

export default function RebuiltAdminPanel() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // 1. Strict Role Verification
  const adminRoleRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'roles_admin', user.uid);
  }, [db, user]);

  const { data: adminRole, isLoading: isAdminRoleLoading } = useDoc(adminRoleRef);
  const isVerifiedAdmin = !!adminRole;

  // 2. Data Queries - ONLY initiated if isVerifiedAdmin is true to prevent permission errors
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
    // Collection Group Query for global fulfillment
    return query(collectionGroup(db, 'orders'), orderBy('orderDate', 'desc'));
  }, [db, isVerifiedAdmin]);
  const { data: orders, isLoading: isOrdersLoading } = useCollection(ordersQuery);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Access Denied', description: 'Invalid supervisor credentials.' });
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
    toast({ title: 'Role Requested', description: 'Establishing administrative credentials...' });
  };

  const seedMasterData = () => {
    if (!db || !isVerifiedAdmin) return;
    
    const initialCats = [
      { id: 'cat_chronic', name: 'Chronic Care', description: 'Long-term medication management' },
      { id: 'cat_wellness', name: 'Wellness', description: 'Vitamins and health supplements' },
      { id: 'cat_acute', name: 'Acute Care', description: 'Short-term illness relief' }
    ];

    const initialMeds = [
      {
        id: "janumet-1",
        name: "Janumet 50/500",
        price: 1250,
        saltComposition: "Sitagliptin + Metformin",
        manufacturer: "MSD",
        categoryId: "cat_chronic",
        category: "Chronic Care",
        description: "Premium diabetic control medication.",
        isGeneric: false,
        dosageForm: "Tablet",
        strength: "50/500mg",
        availableQuantity: 100,
        imageUrl: "https://picsum.photos/seed/j1/300/300",
      },
      {
        id: "ge-sit-1",
        name: "Sitagliptin M Generic",
        price: 240,
        saltComposition: "Sitagliptin + Metformin",
        manufacturer: "HealthLink Labs",
        categoryId: "cat_chronic",
        category: "Chronic Care",
        description: "Bio-equivalent generic alternative.",
        isGeneric: true,
        dosageForm: "Tablet",
        strength: "50/500mg",
        availableQuantity: 500,
        imageUrl: "https://picsum.photos/seed/g1/300/300",
      }
    ];

    initialCats.forEach(cat => setDocumentNonBlocking(doc(db, 'categories', cat.id), cat, { merge: true }));
    initialMeds.forEach(med => setDocumentNonBlocking(doc(db, 'medicines', med.id), med, { merge: true }));
    
    toast({ title: 'Initialization Success', description: 'Master clinical data has been seeded.' });
  };

  if (isUserLoading || isAdminRoleLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Verifying Credentials...</p>
      </div>
    );
  }

  // Not Logged In
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <Card className="max-w-md w-full rounded-[40px] shadow-2xl border-none overflow-hidden">
          <CardHeader className="text-center p-12 bg-primary text-white">
            <ShieldCheck className="w-16 h-16 mx-auto mb-6" />
            <CardTitle className="text-3xl font-black uppercase tracking-tight">Supervisor Portal</CardTitle>
            <CardDescription className="text-white/70">Clinical Administration Console</CardDescription>
          </CardHeader>
          <CardContent className="p-10 bg-white">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Professional Email</Label>
                <Input type="email" placeholder="email@pharmacy.com" value={email} onChange={e => setEmail(e.target.value)} required className="h-12 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Access Key</Label>
                <Input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required className="h-12 rounded-xl" />
              </div>
              <Button type="submit" disabled={authLoading} className="w-full h-14 rounded-full font-black uppercase tracking-widest shadow-xl shadow-primary/20">
                {authLoading ? <Loader2 className="animate-spin" /> : "Verify & Access"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Logged in but not Admin
  if (!isVerifiedAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <Card className="max-w-md w-full rounded-[40px] shadow-xl border-none p-12 text-center space-y-8">
          <div className="bg-red-50 w-24 h-24 rounded-[32px] flex items-center justify-center mx-auto">
            <ShieldAlert className="w-12 h-12 text-red-500" />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight mb-2">Unauthorized ID</h2>
            <p className="text-gray-400 text-sm leading-relaxed">Your account UID (<code className="bg-gray-100 p-1 rounded text-xs text-primary">{user.uid}</code>) is not registered in the supervisor database.</p>
          </div>
          <div className="space-y-4 pt-8 border-t">
            <p className="text-[10px] text-gray-300 font-black uppercase tracking-widest">Developer Tools</p>
            <Button onClick={claimAdminRole} className="w-full gap-2 rounded-full h-14 bg-orange-600 hover:bg-orange-700 shadow-xl shadow-orange-100 uppercase font-black text-xs tracking-widest">
              <UserPlus className="w-5 h-5" /> Initialize Admin Role
            </Button>
            <Button onClick={handleLogout} variant="ghost" className="w-full text-gray-400 font-bold">Sign Out</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7F6]">
      {/* Sidebar Nav */}
      <header className="bg-white border-b sticky top-0 z-50 h-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-12">
            <div className="flex items-center gap-3">
              <div className="bg-primary p-2 rounded-xl shadow-lg shadow-primary/20"><ShieldCheck className="text-white w-6 h-6" /></div>
              <span className="font-black text-xl tracking-tighter text-gray-900 uppercase">Supervisor<span className="text-primary">Hub</span></span>
            </div>
            <nav className="hidden md:flex gap-2">
              {[
                { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
                { id: 'medicines', label: 'Medicine Master', icon: Package },
                { id: 'categories', label: 'Therapy Hubs', icon: Tags },
                { id: 'orders', label: 'Fulfillment', icon: ShoppingBag }
              ].map(tab => (
                <Button 
                  key={tab.id} 
                  variant={activeTab === tab.id ? 'secondary' : 'ghost'} 
                  onClick={() => setActiveTab(tab.id as AdminTab)} 
                  className={`rounded-full gap-2 px-6 font-black text-[10px] uppercase tracking-widest h-10 transition-all ${activeTab === tab.id ? 'bg-primary/5 text-primary' : 'text-gray-400'}`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </Button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Badge className="bg-green-100 text-green-700 font-black uppercase text-[10px] border-none px-4 py-1.5 rounded-full">Secure Session</Badge>
            <Button variant="ghost" onClick={handleLogout} size="icon" className="text-gray-400 hover:text-red-500 transition-colors"><LogOut className="w-5 h-5" /></Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {activeTab === 'dashboard' && (
          <div className="space-y-12 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight uppercase">Operational Overview</h1>
                <p className="text-gray-400 text-xs font-black uppercase tracking-[0.3em] mt-2">Real-time Clinical Management</p>
              </div>
              <div className="bg-white p-6 rounded-[32px] shadow-sm border flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center"><RefreshCw className="w-6 h-6 text-primary" /></div>
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Status</p>
                  <p className="text-sm font-bold text-gray-900">Database Synchronized</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                { label: 'Medicine Master', icon: Package, color: 'text-blue-600', tab: 'medicines', count: medicines?.length || 0 },
                { label: 'Active Orders', icon: ShoppingBag, color: 'text-green-600', tab: 'orders', count: orders?.length || 0 },
                { label: 'Therapy Hubs', icon: Tags, color: 'text-orange-500', tab: 'categories', count: categories?.length || 0 },
              ].map(card => (
                <Card 
                  key={card.label} 
                  className="rounded-[48px] p-10 border-none shadow-sm hover:shadow-2xl transition-all cursor-pointer group bg-white" 
                  onClick={() => setActiveTab(card.tab as AdminTab)}
                >
                  <div className={`w-16 h-16 rounded-[24px] bg-gray-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <card.icon className={`w-8 h-8 ${card.color}`} />
                  </div>
                  <CardTitle className="text-2xl font-black text-gray-900 uppercase tracking-tight">{card.label}</CardTitle>
                  <p className="text-3xl font-black text-primary mt-2">{card.count}</p>
                </Card>
              ))}
              
              <Card className="rounded-[48px] p-10 border-none shadow-sm bg-primary/5 flex flex-col justify-between">
                <div>
                  <Database className="w-12 h-12 text-primary mb-6" />
                  <CardTitle className="text-xl font-black text-gray-900 uppercase mb-2">Master Seed</CardTitle>
                  <p className="text-xs text-gray-400 font-bold leading-relaxed">Initialize core pharmacological catalogs and therapeutic hubs.</p>
                </div>
                <Button onClick={seedMasterData} className="w-full rounded-full h-12 font-black text-[10px] uppercase tracking-widest mt-6">Seed Database</Button>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'medicines' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-black text-gray-900 uppercase">Medicine Master</h2>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Manage clinical product inventory</p>
              </div>
              <Dialog>
                <DialogTrigger asChild><Button className="rounded-full gap-2 px-10 h-14 font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20"><Plus className="w-5 h-5" /> New Product</Button></DialogTrigger>
                <MedicineForm categories={categories || []} onSave={data => addDocumentNonBlocking(collection(db, 'medicines'), data)} />
              </Dialog>
            </div>
            
            <Card className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 border-b">
                  <tr>
                    <th className="px-10 py-6 tracking-widest">Clinical Identity</th>
                    <th className="px-10 py-6 tracking-widest">Valuation</th>
                    <th className="px-10 py-6 tracking-widest">Inventory</th>
                    <th className="px-10 py-6 text-right tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {isMedsLoading ? (
                    <tr><td colSpan={4} className="p-32 text-center"><Loader2 className="animate-spin mx-auto text-primary w-12 h-12" /></td></tr>
                  ) : medicines?.map(med => (
                    <tr key={med.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-gray-100 rounded-2xl overflow-hidden shrink-0">
                            <img src={med.imageUrl} className="w-full h-full object-contain p-2" alt={med.name} />
                          </div>
                          <div>
                            <div className="font-black text-gray-900 text-lg">{med.name}</div>
                            <div className="text-[10px] text-gray-400 font-black uppercase tracking-tight">{med.saltComposition}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="font-black text-gray-900 text-lg">₹{med.price}</div>
                        {med.isGeneric && <Badge className="bg-green-50 text-green-700 text-[8px] font-black uppercase px-2 h-5 mt-1 border-none">Generic</Badge>}
                      </td>
                      <td className="px-10 py-8">
                        <Badge variant={med.availableQuantity < 50 ? 'destructive' : 'secondary'} className="px-4 py-1.5 rounded-full font-black text-[10px] uppercase">
                          {med.availableQuantity} Units
                        </Badge>
                      </td>
                      <td className="px-10 py-8 text-right">
                        <div className="flex justify-end gap-2">
                          <Dialog>
                            <DialogTrigger asChild><Button variant="ghost" size="icon" className="rounded-xl hover:bg-primary/5 text-gray-400 hover:text-primary transition-all"><Edit className="w-5 h-5" /></Button></DialogTrigger>
                            <MedicineForm initialData={med} categories={categories || []} onSave={data => updateDocumentNonBlocking(doc(db, 'medicines', med.id), data)} />
                          </Dialog>
                          <Button variant="ghost" size="icon" className="rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all" onClick={() => deleteDocumentNonBlocking(doc(db, 'medicines', med.id))}><Trash2 className="w-5 h-5" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!isMedsLoading && medicines?.length === 0 && (
                    <tr><td colSpan={4} className="p-32 text-center text-gray-400 font-bold uppercase tracking-widest">No products found. Seed the database to start.</td></tr>
                  )}
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div>
              <h2 className="text-3xl font-black text-gray-900 uppercase">Fulfillment Command</h2>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Global order lifecycle management</p>
            </div>
            
            <Card className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 border-b">
                  <tr>
                    <th className="px-10 py-6 tracking-widest">Batch Reference</th>
                    <th className="px-10 py-6 tracking-widest">Status</th>
                    <th className="px-10 py-6 tracking-widest">Commercials</th>
                    <th className="px-10 py-6 text-right tracking-widest">Review</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {isOrdersLoading ? (
                    <tr><td colSpan={4} className="p-32 text-center"><Loader2 className="animate-spin mx-auto text-primary w-12 h-12" /></td></tr>
                  ) : orders?.map(order => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-10 py-8">
                        <div className="font-black text-gray-900 text-lg uppercase tracking-tighter">#{order.id.substring(0,8)}</div>
                        <div className="text-[10px] text-gray-400 font-bold">{order.orderDate?.toDate ? order.orderDate.toDate().toLocaleString() : 'Recent'}</div>
                      </td>
                      <td className="px-10 py-8">
                        <Badge className={`px-4 py-1.5 rounded-full font-black text-[10px] uppercase border-none ${
                          order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 
                          order.status === 'Processing' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {order.status}
                        </Badge>
                      </td>
                      <td className="px-10 py-8">
                        <div className="font-black text-gray-900 text-lg">₹{order.totalAmount}</div>
                        <div className="text-[10px] text-gray-400 font-black uppercase">{order.paymentStatus}</div>
                      </td>
                      <td className="px-10 py-8 text-right">
                        <Dialog>
                          <DialogTrigger asChild><Button variant="ghost" size="icon" className="rounded-xl hover:bg-primary/5 text-primary"><Eye className="w-6 h-6" /></Button></DialogTrigger>
                          <FulfillmentDetail order={order} db={db} />
                        </Dialog>
                      </td>
                    </tr>
                  ))}
                  {!isOrdersLoading && orders?.length === 0 && (
                    <tr><td colSpan={4} className="p-32 text-center text-gray-400 font-bold uppercase tracking-widest">Waiting for customer orders...</td></tr>
                  )}
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-black text-gray-900 uppercase">Therapy Hubs</h2>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Medical categorization master</p>
              </div>
              <Dialog>
                <DialogTrigger asChild><Button className="rounded-full gap-2 px-10 h-14 font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20"><Plus className="w-5 h-5" /> New Hub</Button></DialogTrigger>
                <CategoryForm onSave={data => addDocumentNonBlocking(collection(db, 'categories'), data)} />
              </Dialog>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {categories?.map(cat => (
                <Card key={cat.id} className="rounded-[40px] p-10 border-none shadow-sm hover:shadow-xl transition-all bg-white relative group">
                  <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-2">{cat.name}</h3>
                  <p className="text-xs text-gray-400 font-bold leading-relaxed mb-8">{cat.description}</p>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild><Button variant="outline" size="sm" className="rounded-full px-8 h-10 font-black text-[10px] uppercase tracking-widest">Edit Hub</Button></DialogTrigger>
                      <CategoryForm initialData={cat} onSave={data => updateDocumentNonBlocking(doc(db, 'categories', cat.id), data)} />
                    </Dialog>
                    <Button variant="ghost" size="sm" className="rounded-full text-red-500 hover:bg-red-50 h-10 px-4 font-black text-[10px] uppercase tracking-widest" onClick={() => deleteDocumentNonBlocking(doc(db, 'categories', cat.id))}>Delete</Button>
                  </div>
                </Card>
              ))}
              {!isCatsLoading && categories?.length === 0 && (
                <div className="col-span-full p-24 text-center text-gray-400 font-bold uppercase tracking-widest border border-dashed rounded-[40px]">Initialize categories to structure your catalog.</div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Sub-components for Cleanliness
function MedicineForm({ initialData, categories, onSave }: { initialData?: any, categories: any[], onSave: (data: any) => void }) {
  const [formData, setFormData] = useState(initialData || { name: '', price: 0, saltComposition: '', manufacturer: '', categoryId: '', availableQuantity: 100, isGeneric: false, imageUrl: 'https://picsum.photos/seed/med/300/300', dosageForm: 'Tablet', strength: '500mg', description: '' });
  
  return (
    <DialogContent className="max-w-2xl rounded-[48px] p-0 overflow-hidden border-none shadow-2xl">
      <CardHeader className="bg-primary text-white p-10">
        <CardTitle className="text-3xl font-black uppercase tracking-tight">Medicine Definition</CardTitle>
        <CardDescription className="text-white/70">Configure pharmacological master details</CardDescription>
      </CardHeader>
      <div className="p-10 bg-white grid grid-cols-2 gap-6">
        <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Brand Name</Label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="h-12 rounded-xl" /></div>
        <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Manufacturer</Label><Input value={formData.manufacturer} onChange={e => setFormData({...formData, manufacturer: e.target.value})} className="h-12 rounded-xl" /></div>
        <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Price (INR)</Label><Input type="number" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="h-12 rounded-xl" /></div>
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Therapy Hub</Label>
          <select value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})} className="w-full h-12 border rounded-xl px-4 text-sm font-bold bg-gray-50 focus:ring-2 focus:ring-primary outline-none">
            <option value="">Select Category</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="col-span-2 space-y-2"><Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Salt Composition</Label><Input value={formData.saltComposition} onChange={e => setFormData({...formData, saltComposition: e.target.value})} className="h-12 rounded-xl" /></div>
        <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Dosage Form</Label><Input value={formData.dosageForm} onChange={e => setFormData({...formData, dosageForm: e.target.value})} className="h-12 rounded-xl" /></div>
        <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Stock Units</Label><Input type="number" value={formData.availableQuantity} onChange={e => setFormData({...formData, availableQuantity: Number(e.target.value)})} className="h-12 rounded-xl" /></div>
        <div className="col-span-2 flex items-center justify-between bg-gray-50 p-6 rounded-2xl border border-dashed border-gray-200">
          <div>
            <Label className="text-sm font-black text-gray-900 uppercase">Bio-Equivalent Generic</Label>
            <p className="text-[10px] text-gray-400 font-bold">Flag as an affordable alternative for this salt.</p>
          </div>
          <Switch checked={formData.isGeneric} onCheckedChange={v => setFormData({...formData, isGeneric: v})} />
        </div>
      </div>
      <DialogFooter className="p-10 bg-gray-50 flex gap-4">
        <Button onClick={() => onSave(formData)} className="w-full rounded-full h-14 font-black uppercase text-sm tracking-widest shadow-xl shadow-primary/20">Save Operational Data</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function CategoryForm({ initialData, onSave }: { initialData?: any, onSave: (data: any) => void }) {
  const [formData, setFormData] = useState(initialData || { name: '', description: '' });
  return (
    <DialogContent className="max-w-lg rounded-[48px] p-0 overflow-hidden border-none shadow-2xl">
      <CardHeader className="bg-primary text-white p-10">
        <CardTitle className="text-3xl font-black uppercase tracking-tight">Therapy Hub</CardTitle>
        <CardDescription className="text-white/70">Manage clinical categorization</CardDescription>
      </CardHeader>
      <div className="p-10 bg-white space-y-6">
        <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Hub Name</Label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="h-12 rounded-xl" /></div>
        <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Medical Description</Label><Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="rounded-xl min-h-[120px]" /></div>
      </div>
      <DialogFooter className="p-10 bg-gray-50">
        <Button onClick={() => onSave(formData)} className="w-full rounded-full h-14 font-black uppercase text-sm tracking-widest shadow-xl shadow-primary/20">Authorize Hub</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function FulfillmentDetail({ order, db }: { order: any, db: any }) {
  const updateStatus = (s: string) => {
    if (order.userId) {
      const ref = doc(db, 'userProfiles', order.userId, 'orders', order.id);
      updateDocumentNonBlocking(ref, { status: s });
      toast({ title: 'Status Updated', description: `Order ${order.id.substring(0,8)} is now ${s}.` });
    }
  };
  return (
    <DialogContent className="max-w-2xl rounded-[48px] p-0 overflow-hidden border-none shadow-2xl">
      <CardHeader className="bg-primary text-white p-10">
        <CardTitle className="text-3xl font-black uppercase tracking-tight">Batch Fulfillment</CardTitle>
        <CardDescription className="text-white/70">Verification & Logistics control</CardDescription>
      </CardHeader>
      <div className="p-10 bg-white space-y-8">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-6 rounded-3xl">
             <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Patient Token</p>
             <p className="font-bold text-gray-900">{order.userId?.substring(0,12)}...</p>
          </div>
          <div className="bg-primary/5 p-6 rounded-3xl">
             <p className="text-[10px] font-black uppercase text-primary mb-1">Transaction Value</p>
             <p className="font-black text-2xl text-primary tracking-tight">₹{order.totalAmount}</p>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Clinical Items</p>
          <div className="max-h-40 overflow-y-auto space-y-2 pr-2 scrollbar-hide">
            {order.items?.map((item: any, i: number) => (
              <div key={i} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex flex-col">
                   <span className="font-black text-gray-900 text-sm">{item.name}</span>
                   <span className="text-[10px] text-gray-400 font-bold">Qty: {item.quantity} • Unit Price: ₹{item.unitPrice}</span>
                </div>
                <span className="font-black text-gray-900">₹{item.unitPrice * item.quantity}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Logistics Lifecycle</p>
          <div className="flex gap-2">
            {['Pending', 'Processing', 'Shipped', 'Delivered'].map(s => (
              <Button 
                key={s} 
                variant={order.status === s ? 'default' : 'outline'} 
                onClick={() => updateStatus(s)} 
                className={`flex-1 rounded-full h-12 font-black uppercase text-[10px] tracking-widest transition-all ${order.status === s ? 'shadow-lg shadow-primary/20 scale-105' : ''}`}
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
