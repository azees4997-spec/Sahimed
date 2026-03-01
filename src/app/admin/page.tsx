
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

  // Global Orders Collection Group (Master Fulfillment View)
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
      setAuthError('Invalid credentials. Access restricted to verified administrators.');
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
        description: "Combination medicine for Type 2 Diabetes control. Effective for blood sugar management.",
        isGeneric: false,
        isTopDeal: true,
        dosageForm: "Tablet",
        strength: "50mg/500mg",
        packSize: "Strip of 15 tablets",
        availableQuantity: 100,
        imageUrl: "https://picsum.photos/seed/med1/300/300",
        uses: ["Type 2 Diabetes Mellitus", "Blood Sugar Control"],
        sideEffects: ["Nausea", "Stomach upset"]
      },
      {
        id: "ge-diab-1",
        name: "Sitagliptin M 50/500",
        price: 240,
        saltComposition: "Sitagliptin 50mg + Metformin 500mg",
        manufacturer: "HealthLink Generic",
        categoryId: "cat_diabetes",
        category: "Diabetes",
        description: "Bio-equivalent to Janumet. Provides exact same glycemic control at 80% lower cost.",
        isGeneric: true,
        isTopDeal: true,
        dosageForm: "Tablet",
        strength: "50mg/500mg",
        packSize: "Strip of 15 tablets",
        availableQuantity: 500,
        imageUrl: "https://picsum.photos/seed/med2/300/300",
        uses: ["Affordable Glycemic Control", "Type 2 Diabetes"],
        sideEffects: ["Mild nausea"]
      }
    ];

    initialCats.forEach(cat => {
      setDocumentNonBlocking(doc(db, 'categories', cat.id), cat, { merge: true });
    });

    initialMeds.forEach(med => {
      setDocumentNonBlocking(doc(db, 'medicines', med.id), med, { merge: true });
    });
    
    toast({ title: "Master Data Seeded", description: "All core collections initialized with clinical data." });
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
            <CardDescription className="text-white/80">
              {user && !isAdmin 
                ? "Unauthorized Access detected." 
                : "Secure supervisor access for pharmacy management"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-10 bg-white">
            {!user ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <Input 
                  type="email" 
                  placeholder="Admin Email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  className="h-14 rounded-2xl bg-gray-50 border-none font-bold" 
                  required 
                />
                <Input 
                  type="password" 
                  placeholder="Password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  className="h-14 rounded-2xl bg-gray-50 border-none font-bold" 
                  required 
                />
                {authError && <p className="text-[10px] text-red-500 font-black uppercase text-center">{authError}</p>}
                <Button type="submit" disabled={localAuthLoading} className="w-full h-16 rounded-full font-black text-lg shadow-lg shadow-primary/20 uppercase tracking-widest">
                  {localAuthLoading ? <Loader2 className="animate-spin w-5 h-5 mx-auto" /> : "Login to Console"}
                </Button>
              </form>
            ) : (
              <div className="text-center space-y-6">
                <div className="p-8 bg-orange-50 text-orange-700 rounded-[32px] border border-orange-100 flex flex-col items-center gap-4">
                  <Lock className="w-10 h-10 mb-2 opacity-50" />
                  <p className="text-xs font-black uppercase tracking-widest text-center">Your UID is not authorized</p>
                  <p className="text-[10px] font-bold leading-relaxed bg-white/50 px-4 py-2 rounded-xl border border-orange-200">{user.uid}</p>
                </div>
                <Button onClick={handleLogout} variant="outline" className="w-full h-14 rounded-full font-black uppercase text-[10px] tracking-widest border-2">Logout</Button>
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
              <Button 
                variant={activeTab === 'dashboard' ? 'secondary' : 'ghost'} 
                onClick={() => setActiveTab('dashboard')}
                className="rounded-full gap-2 font-bold px-6"
              >
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </Button>
              <Button 
                variant={activeTab === 'products' ? 'secondary' : 'ghost'} 
                onClick={() => setActiveTab('products')}
                className="rounded-full gap-2 font-bold px-6"
              >
                <Package className="w-4 h-4" /> Medicines
              </Button>
              <Button 
                variant={activeTab === 'orders' ? 'secondary' : 'ghost'} 
                onClick={() => setActiveTab('orders')}
                className="rounded-full gap-2 font-bold px-6"
              >
                <ShoppingBag className="w-4 h-4" /> Fulfillment
              </Button>
              <Button 
                variant={activeTab === 'categories' ? 'secondary' : 'ghost'} 
                onClick={() => setActiveTab('categories')}
                className="rounded-full gap-2 font-bold px-6"
              >
                <Tags className="w-4 h-4" /> Categories
              </Button>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={handleLogout} size="icon" className="text-red-500 hover:text-red-600 rounded-full">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {activeTab === 'dashboard' ? (
          <div className="space-y-12">
            <div>
              <h1 className="text-4xl font-black font-headline text-gray-900">Operational Dashboard</h1>
              <p className="text-gray-400 font-bold mt-1 uppercase tracking-widest text-[10px]">Pharmacological orchestration center</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <Card className="rounded-[40px] border-none shadow-xl bg-white p-10 flex flex-col items-center text-center group hover:shadow-2xl transition-all">
                <div className="w-20 h-20 bg-primary/10 rounded-[32px] flex items-center justify-center mb-6">
                  <Package className="w-10 h-10 text-primary" />
                </div>
                <CardTitle className="text-2xl font-black mb-2">Medicine Master</CardTitle>
                <CardDescription className="mb-6 text-xs text-muted-foreground">Manage catalog and generic alternatives.</CardDescription>
                <Button onClick={() => setActiveTab('products')} variant="outline" className="rounded-full h-12 px-8 font-bold border-2 w-full">Manage</Button>
              </Card>

              <Card className="rounded-[40px] border-none shadow-xl bg-white p-10 flex flex-col items-center text-center group hover:shadow-2xl transition-all">
                <div className="w-20 h-20 bg-green-50 rounded-[32px] flex items-center justify-center mb-6">
                  <ShoppingBag className="w-10 h-10 text-green-500" />
                </div>
                <CardTitle className="text-2xl font-black mb-2">Orders Master</CardTitle>
                <CardDescription className="mb-6 text-xs text-muted-foreground">Global fulfillment and order tracking.</CardDescription>
                <Button onClick={() => setActiveTab('orders')} variant="outline" className="rounded-full h-12 px-8 font-bold border-2 w-full">Manage</Button>
              </Card>

              <Card className="rounded-[40px] border-none shadow-xl bg-white p-10 flex flex-col items-center text-center group hover:shadow-2xl transition-all">
                <div className="w-20 h-20 bg-orange-50 rounded-[32px] flex items-center justify-center mb-6">
                  <Tags className="w-10 h-10 text-orange-400" />
                </div>
                <CardTitle className="text-2xl font-black mb-2">Category Master</CardTitle>
                <CardDescription className="mb-6 text-xs text-muted-foreground">Define therapeutic hubs and clusters.</CardDescription>
                <Button onClick={() => setActiveTab('categories')} variant="outline" className="rounded-full h-12 px-8 font-bold border-2 w-full">Manage</Button>
              </Card>

              <Card className="rounded-[40px] border-none shadow-xl bg-white p-10 flex flex-col items-center text-center group hover:shadow-2xl transition-all">
                <div className="w-20 h-20 bg-gray-50 rounded-[32px] flex items-center justify-center mb-6">
                  <Database className="w-10 h-10 text-gray-400" />
                </div>
                <CardTitle className="text-2xl font-black mb-2">Master Seed</CardTitle>
                <CardDescription className="mb-6 text-xs text-muted-foreground">Initialize core clinical-grade data.</CardDescription>
                <Button onClick={seedMasterData} className="rounded-full h-12 px-10 font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20 w-full">
                  Seed DB
                </Button>
              </Card>
            </div>
          </div>
        ) : activeTab === 'products' ? (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-4xl font-black font-headline text-gray-900">Medicine Master</h2>
                <p className="text-gray-400 font-bold mt-1 uppercase tracking-widest text-[10px]">Pharmacological catalog management</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Input 
                    placeholder="Search medicines..." 
                    value={searchQuery} 
                    onChange={e => setSearchQuery(e.target.value)} 
                    className="h-12 w-64 pl-10 rounded-full bg-white border-none shadow-sm font-bold"
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="rounded-full h-14 px-8 font-black gap-3 shadow-xl shadow-primary/20">
                      <Plus className="w-5 h-5" /> New Medicine
                    </Button>
                  </DialogTrigger>
                  <ProductFormDialog onSubmit={(data) => addDocumentNonBlocking(collection(db, 'medicines'), data)} categories={categories || []} />
                </Dialog>
              </div>
            </div>

            <Card className="rounded-[40px] border-none shadow-xl overflow-hidden bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-[11px] font-black uppercase text-gray-400 tracking-widest">
                      <th className="px-10 py-6">Medicine & Brand</th>
                      <th className="px-10 py-6">Composition</th>
                      <th className="px-10 py-6">Pricing</th>
                      <th className="px-10 py-6">Inventory</th>
                      <th className="px-10 py-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {isMedsLoading ? (
                      <tr><td colSpan={5} className="p-32 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></td></tr>
                    ) : filteredMeds?.map((med: any) => (
                      <tr key={med.id} className="hover:bg-gray-50/50 group">
                        <td className="px-10 py-8">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-50 rounded-xl p-1 shrink-0 overflow-hidden">
                              <img src={med.imageUrl} className="w-full h-full object-contain" />
                            </div>
                            <div>
                              <p className="font-black text-gray-900">{med.name}</p>
                              <p className="text-[10px] font-bold text-gray-400 uppercase">{med.manufacturer}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-8">
                          <p className="text-xs font-bold text-gray-500 italic mb-1">{med.saltComposition}</p>
                          {med.isGeneric && <Badge className="bg-green-50 text-green-600 border-none text-[8px] font-black px-2 py-0.5">GENERIC</Badge>}
                        </td>
                        <td className="px-10 py-8">
                          <p className="font-black text-gray-900">₹{med.price}</p>
                          <p className="text-[10px] text-gray-400 font-bold">{med.dosageForm} • {med.strength}</p>
                        </td>
                        <td className="px-10 py-8">
                          <div className="flex items-center gap-2">
                             <Badge className={`${med.availableQuantity < 50 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'} border-none font-black`}>
                               {med.availableQuantity} Units
                             </Badge>
                             {med.availableQuantity < 50 && <AlertTriangle className="w-4 h-4 text-red-500" />}
                          </div>
                        </td>
                        <td className="px-10 py-8 text-right">
                          <div className="flex justify-end gap-2">
                            <Dialog>
                              <DialogTrigger asChild><Button variant="ghost" size="icon" className="rounded-full"><Edit className="w-4 h-4" /></Button></DialogTrigger>
                              <ProductFormDialog initialData={med} onSubmit={(data) => updateDocumentNonBlocking(doc(db, 'medicines', med.id), data)} categories={categories || []} />
                            </Dialog>
                            <Button variant="ghost" size="icon" className="rounded-full text-red-500" onClick={() => deleteDocumentNonBlocking(doc(db, 'medicines', med.id))}><Trash2 className="w-4 h-4" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        ) : activeTab === 'orders' ? (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-4xl font-black font-headline text-gray-900">Orders Master</h2>
                <p className="text-gray-400 font-bold mt-1 uppercase tracking-widest text-[10px]">Global fulfillment tracking</p>
              </div>
            </div>

            <Card className="rounded-[40px] border-none shadow-xl overflow-hidden bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-[11px] font-black uppercase text-gray-400 tracking-widest">
                      <th className="px-10 py-6">Order ID & Date</th>
                      <th className="px-10 py-6">Customer Context</th>
                      <th className="px-10 py-6">Total Amount</th>
                      <th className="px-10 py-6">Status</th>
                      <th className="px-10 py-6 text-right">Fulfillment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {isOrdersLoading ? (
                      <tr><td colSpan={5} className="p-32 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></td></tr>
                    ) : allOrders?.map((order: any) => (
                      <tr key={order.id} className="hover:bg-gray-50/50 group">
                        <td className="px-10 py-8">
                          <p className="font-black text-gray-900">{order.id.substring(0, 8).toUpperCase()}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">
                            {order.orderDate?.toDate ? order.orderDate.toDate().toLocaleDateString() : 'Processing...'}
                          </p>
                        </td>
                        <td className="px-10 py-8">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                              <UserIcon className="w-4 h-4 text-gray-400" />
                            </div>
                            <Badge variant="outline" className="text-[9px] font-black uppercase border-gray-200">UID: {order.userId?.substring(0, 8)}</Badge>
                          </div>
                        </td>
                        <td className="px-10 py-8">
                          <p className="font-black text-primary text-lg">₹{order.totalAmount}</p>
                          <p className="text-[10px] text-gray-400 font-bold">{order.items?.length || 0} Line Items</p>
                        </td>
                        <td className="px-10 py-8">
                          <Badge className={`rounded-full px-4 py-1 text-[9px] font-black uppercase border-none ${
                            order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 
                            order.status === 'Processing' ? 'bg-blue-100 text-blue-700' :
                            order.status === 'Shipped' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {order.status}
                          </Badge>
                        </td>
                        <td className="px-10 py-8 text-right">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="rounded-full">
                                <Eye className="w-5 h-5 text-gray-400 hover:text-primary transition-colors" />
                              </Button>
                            </DialogTrigger>
                            <OrderFulfillmentDialog order={order} db={db} />
                          </Dialog>
                        </td>
                      </tr>
                    ))}
                    {!isOrdersLoading && allOrders?.length === 0 && (
                      <tr><td colSpan={5} className="p-32 text-center font-bold text-gray-400 italic">No orders recorded in the system yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        ) : (
          <div className="space-y-8">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-4xl font-black font-headline text-gray-900">Category Master</h2>
                <p className="text-gray-400 font-bold mt-1 uppercase tracking-widest text-[10px]">Therapeutic navigation hub</p>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="rounded-full h-14 px-8 font-black gap-3 shadow-xl shadow-orange-500/20 bg-orange-500 hover:bg-orange-600 border-none">
                    <Plus className="w-5 h-5" /> New Category
                  </Button>
                </DialogTrigger>
                <CategoryFormDialog onSubmit={(data) => addDocumentNonBlocking(collection(db, 'categories'), data)} />
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {isCatsLoading ? (
                 <div className="col-span-full py-24 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></div>
               ) : categories?.map((cat: any) => (
                 <Card key={cat.id} className="rounded-[40px] border-none shadow-sm hover:shadow-xl transition-all group overflow-hidden bg-white">
                    <CardHeader className="p-8 pb-4">
                      <div className="flex items-center justify-between">
                         <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                            <Layers className="w-6 h-6" />
                         </div>
                         <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Dialog>
                              <DialogTrigger asChild><Button variant="ghost" size="icon" className="rounded-full bg-white shadow-sm"><Edit className="w-4 h-4 text-gray-400" /></Button></DialogTrigger>
                              <CategoryFormDialog initialData={cat} onSubmit={(data) => updateDocumentNonBlocking(doc(db, 'categories', cat.id), data)} />
                            </Dialog>
                            <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-sm text-red-500" onClick={() => deleteDocumentNonBlocking(doc(db, 'categories', cat.id))}><Trash2 className="w-4 h-4" /></Button>
                         </div>
                      </div>
                      <CardTitle className="text-2xl font-black mt-4">{cat.name}</CardTitle>
                      <CardDescription className="text-gray-400 font-medium leading-relaxed">{cat.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="px-8 pb-8 pt-4 border-t border-gray-50 mt-4 flex items-center justify-between">
                       <span className="text-[10px] font-black uppercase text-gray-300 tracking-widest">Active Hub</span>
                       <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    </CardContent>
                 </Card>
               ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function OrderFulfillmentDialog({ order, db }: { order: any, db: any }) {
  const updateStatus = (newStatus: string) => {
    if (order.userId) {
      updateDocumentNonBlocking(doc(db, 'userProfiles', order.userId, 'orders', order.id), { status: newStatus });
    }
  };

  return (
    <DialogContent className="max-w-3xl rounded-[40px] border-none shadow-2xl p-0 overflow-hidden">
      <DialogHeader className="p-10 bg-primary text-white">
        <DialogTitle className="text-3xl font-black">Fulfillment Detail</DialogTitle>
        <DialogDescription className="text-white/70">Order ID: {order.id.toUpperCase()}</DialogDescription>
      </DialogHeader>
      <div className="p-10 space-y-8 max-h-[70vh] overflow-y-auto bg-[#F8F8F8]">
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Order Items</h4>
            <div className="space-y-4">
              {order.items?.map((item: any, i: number) => (
                <div key={i} className="bg-white p-5 rounded-3xl border flex justify-between items-center shadow-sm">
                  <div>
                    <p className="font-black text-gray-900 text-sm">{item.name}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Quantity: {item.quantity}</p>
                  </div>
                  <p className="font-black text-primary">₹{item.unitPrice * item.quantity}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-6">
             <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Order Actions</h4>
             <div className="bg-white p-8 rounded-[40px] border space-y-4 shadow-sm">
               <div className="flex items-center gap-3 mb-4">
                 <Clock className="w-5 h-5 text-orange-400" />
                 <p className="text-xs font-bold text-gray-600">Current Status: <span className="font-black text-gray-900 uppercase">{order.status}</span></p>
               </div>
               <div className="grid grid-cols-1 gap-3">
                 <Button onClick={() => updateStatus('Processing')} variant="outline" className="rounded-full h-12 border-2 font-black uppercase text-[10px] tracking-widest">Mark as Processing</Button>
                 <Button onClick={() => updateStatus('Shipped')} variant="outline" className="rounded-full h-12 border-2 font-black uppercase text-[10px] tracking-widest">Mark as Shipped</Button>
                 <Button onClick={() => updateStatus('Delivered')} className="rounded-full h-12 bg-green-600 hover:bg-green-700 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-green-500/20">Mark as Delivered</Button>
               </div>
               <div className="pt-6 border-t mt-4">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Customer Context</p>
                 <div className="flex items-center gap-2">
                   <UserIcon className="w-4 h-4 text-gray-400" />
                   <span className="text-xs font-bold text-gray-700">{order.userId}</span>
                 </div>
               </div>
             </div>
          </div>
        </div>
      </div>
    </DialogContent>
  );
}

function ProductFormDialog({ initialData, onSubmit, categories }: { initialData?: any, onSubmit: (data: any) => void, categories: any[] }) {
  const [formData, setFormData] = useState(initialData || {
    name: '',
    manufacturer: '',
    saltComposition: '',
    price: 0,
    mrp: 0,
    availableQuantity: 100,
    isGeneric: false,
    isTopDeal: false,
    description: '',
    imageUrl: 'https://picsum.photos/seed/med/300/300',
    categoryId: '',
    category: '',
    dosageForm: 'Tablet',
    strength: '',
    packSize: 'Strip of 10 tablets',
    uses: [],
    sideEffects: []
  });

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cat = categories.find(c => c.id === e.target.value);
    setFormData({
      ...formData,
      categoryId: e.target.value,
      category: cat ? cat.name : ''
    });
  };

  return (
    <DialogContent className="max-w-4xl rounded-[40px] border-none shadow-2xl p-0 overflow-hidden">
      <DialogHeader className="p-10 bg-primary text-white">
        <DialogTitle className="text-3xl font-black">{initialData ? 'Update Medication' : 'Register New Medicine'}</DialogTitle>
      </DialogHeader>
      <div className="p-10 space-y-8 max-h-[70vh] overflow-y-auto bg-white">
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Medicine Name</Label>
            <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="h-14 rounded-2xl bg-gray-50 border-none font-black" />
          </div>
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Manufacturer</Label>
            <Input value={formData.manufacturer} onChange={e => setFormData({...formData, manufacturer: e.target.value})} className="h-14 rounded-2xl bg-gray-50 border-none font-bold" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Category Hub</Label>
            <select 
              value={formData.categoryId} 
              onChange={handleCategoryChange}
              className="w-full h-14 rounded-2xl bg-gray-50 border-none font-bold px-4 focus:ring-2 focus:ring-primary outline-none"
            >
              <option value="">Select Category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Salt Composition</Label>
            <Input value={formData.saltComposition} onChange={e => setFormData({...formData, saltComposition: e.target.value})} className="h-14 rounded-2xl bg-gray-50 border-none font-bold italic" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-8">
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Sale Price (INR)</Label>
            <Input type="number" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="h-14 rounded-2xl bg-gray-50 border-none font-black text-xl text-primary" />
          </div>
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">MRP (INR)</Label>
            <Input type="number" value={formData.mrp} onChange={e => setFormData({...formData, mrp: Number(e.target.value)})} className="h-14 rounded-2xl bg-gray-50 border-none font-bold text-gray-400 line-through" />
          </div>
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Stock Units</Label>
            <Input type="number" value={formData.availableQuantity} onChange={e => setFormData({...formData, availableQuantity: Number(e.target.value)})} className="h-14 rounded-2xl bg-gray-50 border-none font-black" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-8">
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Form (Tablet/Syrup)</Label>
            <Input value={formData.dosageForm} onChange={e => setFormData({...formData, dosageForm: e.target.value})} className="h-14 rounded-2xl bg-gray-50 border-none font-bold" />
          </div>
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Strength (e.g. 500mg)</Label>
            <Input value={formData.strength} onChange={e => setFormData({...formData, strength: e.target.value})} className="h-14 rounded-2xl bg-gray-50 border-none font-bold" />
          </div>
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Pack Details</Label>
            <Input value={formData.packSize} onChange={e => setFormData({...formData, packSize: e.target.value})} className="h-14 rounded-2xl bg-gray-50 border-none font-bold" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
            <div className="flex items-center gap-3">
               <FlaskConical className="w-5 h-5 text-green-500" />
               <Label className="font-black text-[10px] uppercase tracking-widest">Bio-Equivalent Generic</Label>
            </div>
            <Switch checked={formData.isGeneric} onCheckedChange={val => setFormData({...formData, isGeneric: val})} />
          </div>
          <div className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
            <div className="flex items-center gap-3">
               <Database className="w-5 h-5 text-primary" />
               <Label className="font-black text-[10px] uppercase tracking-widest">Featured Top Deal</Label>
            </div>
            <Switch checked={formData.isTopDeal} onCheckedChange={val => setFormData({...formData, isTopDeal: val})} />
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Product Image URL</Label>
          <Input value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} className="h-14 rounded-2xl bg-gray-50 border-none text-xs font-mono" />
        </div>

        <div className="space-y-3">
          <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Pharmacological Description</Label>
          <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="min-h-[120px] rounded-3xl bg-gray-50 border-none font-medium p-6" />
        </div>
      </div>
      <DialogFooter className="p-10 bg-gray-50 border-t">
        <Button onClick={() => onSubmit(formData)} className="rounded-full h-16 px-14 font-black uppercase tracking-widest shadow-xl shadow-primary/20">
          <Check className="w-5 h-5 mr-3" /> Save Changes
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function CategoryFormDialog({ initialData, onSubmit }: { initialData?: any, onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState(initialData || {
    name: '',
    description: ''
  });

  return (
    <DialogContent className="max-w-xl rounded-[40px] border-none shadow-2xl p-0 overflow-hidden">
      <DialogHeader className="p-10 bg-orange-500 text-white">
        <DialogTitle className="text-3xl font-black">{initialData ? 'Update Category' : 'New Category Hub'}</DialogTitle>
      </DialogHeader>
      <div className="p-10 space-y-8 bg-white">
        <div className="space-y-3">
          <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Category Name</Label>
          <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="h-14 rounded-2xl bg-gray-50 border-none font-black text-lg" placeholder="e.g. Chronic Care" />
        </div>
        <div className="space-y-3">
          <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Therapeutic Description</Label>
          <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="min-h-[120px] rounded-3xl bg-gray-50 border-none font-medium p-6" placeholder="Describe clinical usage..." />
        </div>
      </div>
      <DialogFooter className="p-10 bg-gray-50 border-t">
        <Button onClick={() => onSubmit(formData)} className="rounded-full h-16 px-14 font-black uppercase tracking-widest shadow-xl shadow-orange-500/20 bg-orange-500 hover:bg-orange-600 border-none">
          <Check className="w-5 h-5 mr-3" /> Save Category
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
