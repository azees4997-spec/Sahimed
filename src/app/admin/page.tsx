"use client"

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ShieldCheck, 
  LogOut, 
  Loader2, 
  Lock,
  Settings,
  UserCheck,
  Package,
  Plus,
  Edit,
  Trash2,
  LayoutDashboard,
  Database,
  Search,
  Check,
  FlaskConical,
  Stethoscope,
  ClipboardList,
  Tags,
  Layers
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
import { doc, collection, query, orderBy } from 'firebase/firestore';
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
        description: "Combination medicine for Type 2 Diabetes control.",
        isGeneric: false,
        isTopDeal: true,
        dosageForm: "Tablet",
        strength: "50mg/500mg",
        availableQuantity: 100,
        imageUrl: "https://picsum.photos/seed/med1/300/300"
      },
      {
        id: "atorva-1",
        name: "Atorva 20mg",
        price: 450,
        saltComposition: "Atorvastatin 20mg",
        manufacturer: "Zydus Cadila",
        categoryId: "cat_heart",
        category: "Heart care",
        description: "Statin for cholesterol management.",
        isGeneric: false,
        isTopDeal: true,
        dosageForm: "Tablet",
        strength: "20mg",
        availableQuantity: 250,
        imageUrl: "https://picsum.photos/seed/med2/300/300"
      }
    ];

    initialCats.forEach(cat => {
      setDocumentNonBlocking(doc(db, 'categories', cat.id), cat, { merge: true });
    });

    initialMeds.forEach(med => {
      setDocumentNonBlocking(doc(db, 'medicines', med.id), med, { merge: true });
    });
    
    toast({ title: "Master Data Seeded", description: "All core collections initialized." });
  };

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
        <Card className="max-w-md w-full rounded-[40px] shadow-2xl border-none">
          <CardHeader className="text-center p-12 bg-primary text-white rounded-t-[40px]">
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
          <CardContent className="p-10">
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
                  <p className="text-[9px] font-medium text-orange-600/70 max-w-[200px] text-center">Please add this UID to the roles_admin collection in the Firebase Console.</p>
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
                variant={activeTab === 'categories' ? 'secondary' : 'ghost'} 
                onClick={() => setActiveTab('categories')}
                className="rounded-full gap-2 font-bold px-6"
              >
                <Tags className="w-4 h-4" /> Categories
              </Button>
              <Button 
                variant={activeTab === 'orders' ? 'secondary' : 'ghost'} 
                onClick={() => setActiveTab('orders')}
                className="rounded-full gap-2 font-bold px-6"
              >
                <ClipboardList className="w-4 h-4" /> Orders
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
            <div className="flex items-center justify-between">
               <div>
                 <h1 className="text-4xl font-black font-headline text-gray-900">Control Center</h1>
                 <p className="text-gray-400 font-bold mt-1 uppercase tracking-widest text-[10px]">Real-time pharmacy orchestration</p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="rounded-[40px] border-none shadow-xl bg-white p-10 flex flex-col items-center text-center group hover:shadow-2xl transition-all">
                <div className="w-20 h-20 bg-primary/10 rounded-[32px] flex items-center justify-center mb-6">
                  <Package className="w-10 h-10 text-primary" />
                </div>
                <CardTitle className="text-2xl font-black mb-2">Medicine Master</CardTitle>
                <CardDescription className="mb-6">Manage all pharmaceutical inventory and bio-equivalent flags.</CardDescription>
                <Button onClick={() => setActiveTab('products')} variant="outline" className="rounded-full h-12 px-8 font-bold border-2">Manage Medicines</Button>
              </Card>

              <Card className="rounded-[40px] border-none shadow-xl bg-white p-10 flex flex-col items-center text-center group hover:shadow-2xl transition-all">
                <div className="w-20 h-20 bg-orange-50 rounded-[32px] flex items-center justify-center mb-6">
                  <Tags className="w-10 h-10 text-orange-400" />
                </div>
                <CardTitle className="text-2xl font-black mb-2">Category Master</CardTitle>
                <CardDescription className="mb-6">Define therapeutic categories and disease-specific browsing hubs.</CardDescription>
                <Button onClick={() => setActiveTab('categories')} variant="outline" className="rounded-full h-12 px-8 font-bold border-2">Manage Categories</Button>
              </Card>

              <Card className="rounded-[40px] border-none shadow-xl bg-white p-10 flex flex-col items-center text-center group hover:shadow-2xl transition-all">
                <div className="w-20 h-20 bg-gray-50 rounded-[32px] flex items-center justify-center mb-6">
                  <Database className="w-10 h-10 text-gray-400" />
                </div>
                <CardTitle className="text-2xl font-black mb-2">Quick Seed</CardTitle>
                <CardDescription className="mb-6">Initialize core collections with clinical-grade master data.</CardDescription>
                <Button onClick={seedMasterData} className="rounded-full h-12 px-10 font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20">
                  Seed Database
                </Button>
              </Card>
            </div>
          </div>
        ) : activeTab === 'products' ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-4xl font-black font-headline text-gray-900">Product Master</h2>
                <p className="text-gray-400 font-bold mt-1 uppercase tracking-widest text-[10px]">Pharmacological inventory</p>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="rounded-full h-14 px-8 font-black gap-3 shadow-xl shadow-primary/20">
                    <Plus className="w-5 h-5" /> Register Medicine
                  </Button>
                </DialogTrigger>
                <ProductFormDialog onSubmit={(data) => addDocumentNonBlocking(collection(db, 'medicines'), data)} />
              </Dialog>
            </div>

            <Card className="rounded-[40px] border-none shadow-xl overflow-hidden bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-[11px] font-black uppercase text-gray-400 tracking-widest">
                      <th className="px-10 py-6">Medicine & Lab</th>
                      <th className="px-10 py-6">Salt</th>
                      <th className="px-10 py-6">Stock</th>
                      <th className="px-10 py-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {isMedsLoading ? (
                      <tr><td colSpan={4} className="p-32 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></td></tr>
                    ) : medicines?.map((med: any) => (
                      <tr key={med.id} className="hover:bg-gray-50/50 group">
                        <td className="px-10 py-8">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-50 rounded-xl p-1 shrink-0"><img src={med.imageUrl} className="w-full h-full object-contain" /></div>
                            <div>
                              <p className="font-black text-gray-900">{med.name}</p>
                              <p className="text-[10px] font-bold text-gray-400 uppercase">{med.manufacturer}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-8">
                          <p className="text-xs font-bold text-gray-500 italic truncate max-w-[200px]">{med.saltComposition}</p>
                        </td>
                        <td className="px-10 py-8">
                          <Badge className={`${med.availableQuantity < 50 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'} border-none font-black`}>
                            {med.availableQuantity} Units
                          </Badge>
                        </td>
                        <td className="px-10 py-8 text-right">
                          <div className="flex justify-end gap-2">
                            <Dialog>
                              <DialogTrigger asChild><Button variant="ghost" size="icon" className="rounded-full"><Edit className="w-4 h-4" /></Button></DialogTrigger>
                              <ProductFormDialog initialData={med} onSubmit={(data) => updateDocumentNonBlocking(doc(db, 'medicines', med.id), data)} />
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
        ) : activeTab === 'categories' ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-4xl font-black font-headline text-gray-900">Category Master</h2>
                <p className="text-gray-400 font-bold mt-1 uppercase tracking-widest text-[10px]">Therapeutic navigation hub</p>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="rounded-full h-14 px-8 font-black gap-3 shadow-xl shadow-primary/20 bg-orange-500 hover:bg-orange-600">
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
                 <Card key={cat.id} className="rounded-[40px] border-none shadow-sm hover:shadow-xl transition-all group overflow-hidden">
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
                    <CardContent className="px-8 pb-8">
                       <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase text-gray-300 tracking-widest">Live in Store</span>
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                       </div>
                    </CardContent>
                 </Card>
               ))}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
             <h2 className="text-4xl font-black font-headline text-gray-900">Order Management</h2>
             <Card className="rounded-[40px] p-20 text-center text-gray-400 font-bold bg-white border-none shadow-xl">
                <ClipboardList className="w-20 h-20 mx-auto mb-6 opacity-20" />
                <p>Global order monitoring will appear here shortly.</p>
             </Card>
          </div>
        )}
      </main>
    </div>
  );
}

function ProductFormDialog({ initialData, onSubmit }: { initialData?: any, onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState(initialData || {
    name: '',
    manufacturer: '',
    saltComposition: '',
    price: 0,
    availableQuantity: 100,
    isGeneric: false,
    description: '',
    imageUrl: 'https://picsum.photos/seed/med/300/300',
    categoryId: 'cat_diabetes',
    category: 'Diabetes',
    dosageForm: 'Tablet',
    strength: ''
  });

  return (
    <DialogContent className="max-w-3xl rounded-[40px] border-none shadow-2xl p-0 overflow-hidden">
      <DialogHeader className="p-10 bg-primary text-white">
        <DialogTitle className="text-3xl font-black">{initialData ? 'Edit Medication' : 'Register Medicine'}</DialogTitle>
      </DialogHeader>
      <div className="p-10 space-y-8 max-h-[70vh] overflow-y-auto">
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
        <div className="space-y-3">
          <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Salt Composition</Label>
          <Input value={formData.saltComposition} onChange={e => setFormData({...formData, saltComposition: e.target.value})} className="h-14 rounded-2xl bg-gray-50 border-none font-bold italic" />
        </div>
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Price (INR)</Label>
            <Input type="number" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="h-14 rounded-2xl bg-gray-50 border-none font-black text-xl" />
          </div>
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Stock Count</Label>
            <Input type="number" value={formData.availableQuantity} onChange={e => setFormData({...formData, availableQuantity: Number(e.target.value)})} className="h-14 rounded-2xl bg-gray-50 border-none font-bold" />
          </div>
        </div>
        <div className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl">
          <div className="flex items-center gap-3">
             <FlaskConical className="w-5 h-5 text-primary" />
             <Label className="font-black text-sm uppercase">Bio-equivalent Generic</Label>
          </div>
          <Switch checked={formData.isGeneric} onCheckedChange={val => setFormData({...formData, isGeneric: val})} />
        </div>
        <div className="space-y-3">
          <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Image Resource</Label>
          <Input value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} className="h-14 rounded-2xl bg-gray-50 border-none text-xs" />
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
        <DialogTitle className="text-3xl font-black">{initialData ? 'Edit Category' : 'New Category'}</DialogTitle>
      </DialogHeader>
      <div className="p-10 space-y-8">
        <div className="space-y-3">
          <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Category Name</Label>
          <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="h-14 rounded-2xl bg-gray-50 border-none font-black text-lg" placeholder="e.g. Chronic Care" />
        </div>
        <div className="space-y-3">
          <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Store Description</Label>
          <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="min-h-[120px] rounded-3xl bg-gray-50 border-none font-medium p-6" placeholder="Describe clinical usage..." />
        </div>
      </div>
      <DialogFooter className="p-10 bg-gray-50 border-t">
        <Button onClick={() => onSubmit(formData)} className="rounded-full h-16 px-14 font-black uppercase tracking-widest shadow-xl shadow-orange-500/20 bg-orange-500 hover:bg-orange-600">
          <Check className="w-5 h-5 mr-3" /> Save Category
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
