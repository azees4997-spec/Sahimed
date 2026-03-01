
"use client"

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ShieldCheck, 
  LogOut, 
  Loader2, 
  Lock,
  Package,
  Plus,
  Edit,
  Trash2,
  LayoutDashboard,
  Database,
  Check,
  FlaskConical,
  Tags,
  Layers,
  Search,
  AlertTriangle,
  ShoppingBag,
  Truck,
  CheckCircle2,
  Clock,
  Eye,
  User as UserIcon
} from 'lucide-react';
import { Input } from '@/components/ui/input';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'categories' | 'orders'>('dashboard');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localAuthLoading, setLocalAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Check for admin role
  const adminRoleRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'roles_admin', user.uid);
  }, [db, user]);

  const { data: adminRole, isLoading: isAdminRoleLoading } = useDoc(adminRoleRef);
  const isAdmin = !!adminRole;

  // Medicines Collection
  const medicinesQuery = useMemoFirebase(() => {
    if (!db || !isAdmin) return null;
    return query(collection(db, 'medicines'), orderBy('name', 'asc'));
  }, [db, isAdmin]);
  const { data: medicines, isLoading: isMedsLoading } = useCollection(medicinesQuery);

  // Categories Collection
  const categoriesQuery = useMemoFirebase(() => {
    if (!db || !isAdmin) return null;
    return query(collection(db, 'categories'), orderBy('name', 'asc'));
  }, [db, isAdmin]);
  const { data: categories, isLoading: isCatsLoading } = useCollection(categoriesQuery);

  // GLOBAL ORDERS: Admins can see every order in the system
  const allOrdersQuery = useMemoFirebase(() => {
    if (!db || !isAdmin) return null;
    return query(collectionGroup(db, 'orders'), orderBy('orderDate', 'desc'));
  }, [db, isAdmin]);
  const { data: allOrders, isLoading: isOrdersLoading } = useCollection(allOrdersQuery);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setLocalAuthLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setAuthError('Invalid credentials. Admin access required.');
    } finally {
      setLocalAuthLoading(false);
    }
  };

  const handleLogout = () => signOut(auth);

  const seedMasterData = () => {
    if (!db || !isAdmin) return;
    
    const initialCats = [
      { id: 'cat_diabetes', name: 'Diabetes', description: 'Blood sugar management' },
      { id: 'cat_heart', name: 'Heart care', description: 'Cardiac health essentials' },
      { id: 'cat_stomach', name: 'Stomach care', description: 'Digestive & gut health' },
      { id: 'cat_liver', name: 'Liver care', description: 'Hepatic support' },
      { id: 'cat_derma', name: 'Derma care', description: 'Skin & dermatological solutions' },
      { id: 'cat_resp', name: 'Respicare', description: 'Respiratory & lung health' }
    ];

    const initialMeds = [
      {
        id: "janumet-1",
        name: "Janumet 50mg/500mg",
        price: 1250,
        saltComposition: "Sitagliptin 50mg + Metformin 500mg",
        manufacturer: "MSD Pharmaceuticals",
        categoryId: "cat_diabetes",
        category: "Diabetes",
        description: "Combination medicine for Type 2 Diabetes control.",
        isGeneric: false,
        isTopDeal: true,
        dosageForm: "Tablet",
        strength: "50mg/500mg",
        packSize: "Strip of 15 tablets",
        availableQuantity: 100,
        imageUrl: "https://picsum.photos/seed/med1/300/300",
        uses: ["Type 2 Diabetes Mellitus", "Blood Sugar Control"],
      },
      {
        id: "ge-diab-1",
        name: "Sitagliptin M 50/500",
        price: 240,
        saltComposition: "Sitagliptin 50mg + Metformin 500mg",
        manufacturer: "HealthLink Generic",
        categoryId: "cat_diabetes",
        category: "Diabetes",
        description: "Bio-equivalent to Janumet at 80% lower cost.",
        isGeneric: true,
        isTopDeal: true,
        dosageForm: "Tablet",
        strength: "50mg/500mg",
        packSize: "Strip of 15 tablets",
        availableQuantity: 500,
        imageUrl: "https://picsum.photos/seed/med2/300/300",
        uses: ["Affordable Glycemic Control"],
      }
    ];

    initialCats.forEach(cat => {
      setDocumentNonBlocking(doc(db, 'categories', cat.id), cat, { merge: true });
    });

    initialMeds.forEach(med => {
      setDocumentNonBlocking(doc(db, 'medicines', med.id), med, { merge: true });
    });
    
    toast({ title: "Master Data Initialized", description: "Core catalog has been seeded." });
  };

  const filteredMeds = medicines?.filter(med => 
    med.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    med.saltComposition.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isUserLoading || isAdminRoleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F8F8]">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F8F8] p-4">
        <Card className="max-w-md w-full rounded-[40px] shadow-2xl border-none overflow-hidden">
          <CardHeader className="text-center p-12 bg-primary text-white">
            <div className="w-20 h-20 bg-white/10 rounded-[32px] flex items-center justify-center mx-auto mb-6 backdrop-blur">
              <ShieldCheck className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold font-headline">Pharmacist Portal</CardTitle>
            <CardDescription className="text-white/80">Secure supervisor access</CardDescription>
          </CardHeader>
          <CardContent className="p-10 bg-white">
            {!user ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="h-14 rounded-2xl bg-gray-50 border-none font-bold" required />
                <Input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="h-14 rounded-2xl bg-gray-50 border-none font-bold" required />
                {authError && <p className="text-[10px] text-red-500 font-black uppercase text-center">{authError}</p>}
                <Button type="submit" disabled={localAuthLoading} className="w-full h-16 rounded-full font-black text-lg shadow-lg shadow-primary/20">
                  {localAuthLoading ? <Loader2 className="animate-spin" /> : "Login to Console"}
                </Button>
              </form>
            ) : (
              <div className="text-center space-y-6">
                <div className="p-8 bg-orange-50 text-orange-700 rounded-[32px] border border-orange-100">
                  <Lock className="w-10 h-10 mx-auto mb-4 opacity-50" />
                  <p className="text-xs font-black uppercase tracking-widest mb-2">Unauthorized Access</p>
                  <p className="text-[10px] font-bold">UID: {user.uid}</p>
                </div>
                <Button onClick={handleLogout} variant="outline" className="w-full h-14 rounded-full font-black uppercase text-[10px] border-2">Logout</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="bg-primary p-1.5 rounded-lg shadow-lg shadow-primary/20">
                <div className="text-white font-bold text-xl tracking-tighter">HL</div>
              </div>
              <span className="font-bold text-xl font-headline tracking-tight text-primary">Supervisor</span>
            </div>
            <nav className="hidden md:flex items-center gap-2">
              <Button variant={activeTab === 'dashboard' ? 'secondary' : 'ghost'} onClick={() => setActiveTab('dashboard')} className="rounded-full gap-2 font-bold px-6">
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </Button>
              <Button variant={activeTab === 'products' ? 'secondary' : 'ghost'} onClick={() => setActiveTab('products')} className="rounded-full gap-2 font-bold px-6">
                <Package className="w-4 h-4" /> Medicines
              </Button>
              <Button variant={activeTab === 'orders' ? 'secondary' : 'ghost'} onClick={() => setActiveTab('orders')} className="rounded-full gap-2 font-bold px-6">
                <ShoppingBag className="w-4 h-4" /> Fulfillment
              </Button>
              <Button variant={activeTab === 'categories' ? 'secondary' : 'ghost'} onClick={() => setActiveTab('categories')} className="rounded-full gap-2 font-bold px-6">
                <Tags className="w-4 h-4" /> Categories
              </Button>
            </nav>
          </div>
          <Button variant="ghost" onClick={handleLogout} size="icon" className="text-red-500 rounded-full">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {activeTab === 'dashboard' && (
          <div className="space-y-12">
            <div>
              <h1 className="text-4xl font-black font-headline text-gray-900">Control Center</h1>
              <p className="text-gray-400 font-bold mt-1 uppercase tracking-widest text-[10px]">Operations & Management</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <Card className="rounded-[40px] border-none shadow-xl bg-white p-10 text-center">
                <Package className="w-12 h-12 text-primary mx-auto mb-6" />
                <CardTitle className="text-xl font-black mb-4">Catalog</CardTitle>
                <Button onClick={() => setActiveTab('products')} variant="outline" className="rounded-full w-full">Manage</Button>
              </Card>
              <Card className="rounded-[40px] border-none shadow-xl bg-white p-10 text-center">
                <ShoppingBag className="w-12 h-12 text-green-500 mx-auto mb-6" />
                <CardTitle className="text-xl font-black mb-4">Orders</CardTitle>
                <Button onClick={() => setActiveTab('orders')} variant="outline" className="rounded-full w-full">Fulfill</Button>
              </Card>
              <Card className="rounded-[40px] border-none shadow-xl bg-white p-10 text-center">
                <Tags className="w-12 h-12 text-orange-400 mx-auto mb-6" />
                <CardTitle className="text-xl font-black mb-4">Therapy</CardTitle>
                <Button onClick={() => setActiveTab('categories')} variant="outline" className="rounded-full w-full">Edit Hubs</Button>
              </Card>
              <Card className="rounded-[40px] border-none shadow-xl bg-white p-10 text-center">
                <Database className="w-12 h-12 text-gray-400 mx-auto mb-6" />
                <CardTitle className="text-xl font-black mb-4">Data Seed</CardTitle>
                <Button onClick={seedMasterData} className="rounded-full w-full bg-primary text-white hover:bg-primary/90">Initialize</Button>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-black">Medicine Master</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="rounded-full px-8 h-12 gap-2"><Plus className="w-5 h-5" /> New Product</Button>
                </DialogTrigger>
                <ProductFormDialog onSubmit={(data) => addDocumentNonBlocking(collection(db, 'medicines'), data)} categories={categories || []} />
              </Dialog>
            </div>
            <Card className="rounded-[40px] overflow-hidden border-none shadow-xl">
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                   <thead className="bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400">
                     <tr>
                       <th className="px-8 py-6">Product</th>
                       <th className="px-8 py-6">Price</th>
                       <th className="px-8 py-6">Stock</th>
                       <th className="px-8 py-6 text-right">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                     {isMedsLoading ? <tr><td colSpan={4} className="p-20 text-center"><Loader2 className="animate-spin mx-auto" /></td></tr> : filteredMeds?.map(med => (
                       <tr key={med.id} className="hover:bg-gray-50">
                         <td className="px-8 py-6">
                           <div className="font-bold">{med.name}</div>
                           <div className="text-[10px] text-gray-400">{med.saltComposition}</div>
                         </td>
                         <td className="px-8 py-6 font-black">₹{med.price}</td>
                         <td className="px-8 py-6">
                           <Badge variant={med.availableQuantity < 50 ? 'destructive' : 'secondary'}>{med.availableQuantity} Units</Badge>
                         </td>
                         <td className="px-8 py-6 text-right">
                           <div className="flex justify-end gap-2">
                             <Dialog>
                               <DialogTrigger asChild><Button variant="ghost" size="icon"><Edit className="w-4 h-4" /></Button></DialogTrigger>
                               <ProductFormDialog initialData={med} onSubmit={(data) => updateDocumentNonBlocking(doc(db, 'medicines', med.id), data)} categories={categories || []} />
                             </Dialog>
                             <Button variant="ghost" size="icon" className="text-red-500" onClick={() => deleteDocumentNonBlocking(doc(db, 'medicines', med.id))}><Trash2 className="w-4 h-4" /></Button>
                           </div>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </Card>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-8">
            <h2 className="text-3xl font-black">Global Fulfillment</h2>
            <Card className="rounded-[40px] overflow-hidden border-none shadow-xl">
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                   <thead className="bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400">
                     <tr>
                       <th className="px-8 py-6">Order Context</th>
                       <th className="px-8 py-6">Customer</th>
                       <th className="px-8 py-6">Status</th>
                       <th className="px-8 py-6 text-right">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                     {isOrdersLoading ? <tr><td colSpan={4} className="p-20 text-center"><Loader2 className="animate-spin mx-auto" /></td></tr> : allOrders?.map(order => (
                       <tr key={order.id} className="hover:bg-gray-50">
                         <td className="px-8 py-6">
                            <div className="font-bold">₹{order.totalAmount}</div>
                            <div className="text-[10px] text-gray-400 uppercase tracking-widest">{order.id.substring(0,8)}</div>
                         </td>
                         <td className="px-8 py-6">
                            <div className="text-xs font-bold text-gray-600">UID: {order.userId?.substring(0,8)}</div>
                         </td>
                         <td className="px-8 py-6">
                            <Badge className="font-black">{order.status}</Badge>
                         </td>
                         <td className="px-8 py-6 text-right">
                            <Dialog>
                              <DialogTrigger asChild><Button variant="ghost" size="icon"><Eye className="w-5 h-5" /></Button></DialogTrigger>
                              <OrderFulfillmentDialog order={order} db={db} />
                            </Dialog>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </Card>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-black">Therapeutic Hubs</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="rounded-full px-8 h-12 gap-2 bg-orange-500 hover:bg-orange-600 border-none">
                    <Plus className="w-5 h-5" /> New Hub
                  </Button>
                </DialogTrigger>
                <CategoryFormDialog onSubmit={(data) => addDocumentNonBlocking(collection(db, 'categories'), data)} />
              </Dialog>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {categories?.map(cat => (
                <Card key={cat.id} className="rounded-[32px] p-8 bg-white border-none shadow-sm hover:shadow-lg transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <Layers className="w-8 h-8 text-orange-400" />
                    <div className="flex gap-2">
                       <Dialog>
                         <DialogTrigger asChild><Button variant="ghost" size="icon"><Edit className="w-4 h-4" /></Button></DialogTrigger>
                         <CategoryFormDialog initialData={cat} onSubmit={(data) => updateDocumentNonBlocking(doc(db, 'categories', cat.id), data)} />
                       </Dialog>
                       <Button variant="ghost" size="icon" className="text-red-500" onClick={() => deleteDocumentNonBlocking(doc(db, 'categories', cat.id))}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                  <h3 className="text-xl font-black">{cat.name}</h3>
                  <p className="text-sm text-gray-400 mt-2">{cat.description}</p>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Dialog Components (OrderFulfillmentDialog, ProductFormDialog, CategoryFormDialog)
// These remain consistent with previous turns but updated to ensure userId usage for orders

function OrderFulfillmentDialog({ order, db }: { order: any, db: any }) {
  const updateStatus = (newStatus: string) => {
    if (order.userId) {
      // Direct path update for consistency
      const orderRef = doc(db, 'userProfiles', order.userId, 'orders', order.id);
      updateDocumentNonBlocking(orderRef, { status: newStatus });
    }
  };

  return (
    <DialogContent className="max-w-2xl rounded-[40px] p-10">
      <DialogHeader>
        <DialogTitle className="text-3xl font-black">Order Fulfillment</DialogTitle>
        <DialogDescription>ID: {order.id}</DialogDescription>
      </DialogHeader>
      <div className="space-y-8 py-6">
        <div className="bg-gray-50 p-6 rounded-3xl">
          <h4 className="text-xs font-black uppercase text-gray-400 mb-4">Current Status: {order.status}</h4>
          <div className="flex gap-3">
             <Button onClick={() => updateStatus('Processing')} variant="outline" className="flex-1 rounded-full">Processing</Button>
             <Button onClick={() => updateStatus('Shipped')} variant="outline" className="flex-1 rounded-full">Shipped</Button>
             <Button onClick={() => updateStatus('Delivered')} className="flex-1 rounded-full bg-green-600 hover:bg-green-700">Delivered</Button>
          </div>
        </div>
        <div>
          <h4 className="text-xs font-black uppercase text-gray-400 mb-4">Patient Order Items</h4>
          {order.items?.map((item: any, i: number) => (
            <div key={i} className="flex justify-between p-4 border-b last:border-none">
              <span className="font-bold">{item.name} x {item.quantity}</span>
              <span className="font-black text-primary">₹{item.unitPrice * item.quantity}</span>
            </div>
          ))}
        </div>
      </div>
    </DialogContent>
  );
}

function ProductFormDialog({ initialData, onSubmit, categories }: { initialData?: any, onSubmit: (data: any) => void, categories: any[] }) {
  const [formData, setFormData] = useState(initialData || { name: '', manufacturer: '', saltComposition: '', price: 0, availableQuantity: 100, isGeneric: false, categoryId: '', dosageForm: 'Tablet', strength: '', imageUrl: 'https://picsum.photos/seed/med/300/300' });

  return (
    <DialogContent className="max-w-3xl rounded-[40px] p-10 max-h-[90vh] overflow-y-auto">
      <DialogHeader><DialogTitle className="text-2xl font-black">Medication Data</DialogTitle></DialogHeader>
      <div className="grid grid-cols-2 gap-6 py-6">
        <div className="space-y-2"><Label>Brand Name</Label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
        <div className="space-y-2"><Label>Manufacturer</Label><Input value={formData.manufacturer} onChange={e => setFormData({...formData, manufacturer: e.target.value})} /></div>
        <div className="space-y-2"><Label>Salt Composition</Label><Input value={formData.saltComposition} onChange={e => setFormData({...formData, saltComposition: e.target.value})} /></div>
        <div className="space-y-2"><Label>Price (₹)</Label><Input type="number" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} /></div>
        <div className="space-y-2"><Label>Stock</Label><Input type="number" value={formData.availableQuantity} onChange={e => setFormData({...formData, availableQuantity: Number(e.target.value)})} /></div>
        <div className="space-y-2">
          <Label>Category Hub</Label>
          <select value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})} className="w-full h-10 border rounded-md px-3 text-sm">
            <option value="">Select Category</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl col-span-2">
           <Label className="flex-1">Bio-Equivalent Generic Alternative</Label>
           <Switch checked={formData.isGeneric} onCheckedChange={v => setFormData({...formData, isGeneric: v})} />
        </div>
      </div>
      <DialogFooter><Button onClick={() => onSubmit(formData)} className="rounded-full px-12 h-14 font-black">Save Medicine</Button></DialogFooter>
    </DialogContent>
  );
}

function CategoryFormDialog({ initialData, onSubmit }: { initialData?: any, onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState(initialData || { name: '', description: '' });
  return (
    <DialogContent className="rounded-[40px] p-10">
      <DialogHeader><DialogTitle className="text-2xl font-black">Therapy Hub</DialogTitle></DialogHeader>
      <div className="space-y-6 py-6">
        <div className="space-y-2"><Label>Hub Name</Label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
        <div className="space-y-2"><Label>Description</Label><Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
      </div>
      <DialogFooter><Button onClick={() => onSubmit(formData)} className="rounded-full w-full h-14 font-black">Save Hub</Button></DialogFooter>
    </DialogContent>
  );
}
