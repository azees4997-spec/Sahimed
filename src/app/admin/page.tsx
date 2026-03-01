
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
  Check
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
  deleteDocumentNonBlocking
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
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products'>('dashboard');
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

  // Medicines Collection for Product Master
  const medicinesQuery = useMemoFirebase(() => {
    if (!db || !isAdmin) return null;
    return query(collection(db, 'medicines'), orderBy('name', 'asc'));
  }, [db, isAdmin]);

  const { data: medicines, isLoading: isMedsLoading } = useCollection(medicinesQuery);

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
    if (!db) return;
    const initialMeds = [
      {
        name: "Janumet 50mg/500mg",
        price: 1250,
        saltComposition: "Sitagliptin 50mg + Metformin 500mg",
        manufacturer: "MSD Pharmaceuticals",
        categoryId: "cat_diabetes",
        description: "Combination medicine for Type 2 Diabetes control.",
        isGeneric: false,
        isTopDeal: true,
        dosageForm: "Tablet",
        strength: "50mg/500mg",
        availableQuantity: 100,
        imageUrl: "https://picsum.photos/seed/med1/300/300"
      },
      {
        name: "Atorva 20mg",
        price: 450,
        saltComposition: "Atorvastatin 20mg",
        manufacturer: "Zydus Cadila",
        categoryId: "cat_heart",
        description: "Statin for cholesterol management.",
        isGeneric: false,
        isTopDeal: true,
        dosageForm: "Tablet",
        strength: "20mg",
        availableQuantity: 250,
        imageUrl: "https://picsum.photos/seed/med2/300/300"
      }
    ];

    initialMeds.forEach(med => {
      addDocumentNonBlocking(collection(db, 'medicines'), med);
    });
    toast({ title: "Master Data Seeded", description: "Initial products added successfully." });
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
                  <p className="text-xs font-black uppercase tracking-widest">Role Not Authorized</p>
                  <p className="text-[10px] font-bold leading-relaxed opacity-80">UID: {user.uid}</p>
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
              <div className="bg-primary p-1.5 rounded-lg">
                <div className="text-white font-bold text-xl tracking-tighter">HL</div>
              </div>
              <span className="font-bold text-xl font-headline tracking-tight">Supervisor</span>
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
                <Package className="w-4 h-4" /> Product Master
              </Button>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-block text-[10px] font-black uppercase text-gray-400 bg-gray-50 px-4 py-2 rounded-full border">Verified Admin</span>
            <Button variant="ghost" onClick={handleLogout} className="text-red-500 hover:text-red-600 rounded-full font-bold">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {activeTab === 'dashboard' ? (
          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="rounded-[40px] border-none shadow-xl bg-white p-10 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-primary/10 rounded-[32px] flex items-center justify-center mb-6">
                  <UserCheck className="w-10 h-10 text-primary" />
                </div>
                <CardTitle className="text-2xl font-black mb-2">Verified Session</CardTitle>
                <CardDescription className="max-w-xs mx-auto mb-6">
                  You are currently managing the platform as a verified supervisor.
                </CardDescription>
                <Button variant="outline" className="rounded-full h-12 px-8 font-bold border-2">Session Info</Button>
              </Card>

              <Card className="rounded-[40px] border-none shadow-xl bg-white p-10 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-orange-50 rounded-[32px] flex items-center justify-center mb-6">
                  <Database className="w-10 h-10 text-orange-400" />
                </div>
                <CardTitle className="text-2xl font-black mb-2">Master Tools</CardTitle>
                <CardDescription className="max-w-xs mx-auto mb-6">
                  Quickly initialize or reset core catalog data for the storefront.
                </CardDescription>
                <Button onClick={seedMasterData} className="rounded-full h-12 px-10 font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20">
                  Seed Database
                </Button>
              </Card>

              <Card className="rounded-[40px] border-none shadow-xl bg-white p-10 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-[32px] flex items-center justify-center mb-6">
                  <Settings className="w-10 h-10 text-gray-400" />
                </div>
                <CardTitle className="text-2xl font-black mb-2">System Config</CardTitle>
                <CardDescription className="max-w-xs mx-auto mb-6">
                  Manage global settings, user roles, and pharmaceutical labs.
                </CardDescription>
                <Button variant="outline" className="rounded-full h-12 px-10 font-bold uppercase text-[10px] tracking-widest border-2">Manage Access</Button>
              </Card>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black font-headline text-gray-900">Product Master</h2>
                <p className="text-gray-400 font-bold">Manage your pharmacy catalog and stock levels.</p>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="rounded-full h-14 px-8 font-black gap-2 shadow-xl shadow-primary/20">
                    <Plus className="w-5 h-5" /> Add New Medicine
                  </Button>
                </DialogTrigger>
                <ProductFormDialog onSubmit={(data) => addDocumentNonBlocking(collection(db, 'medicines'), data)} />
              </Dialog>
            </div>

            <Card className="rounded-[32px] border-none shadow-sm overflow-hidden bg-white">
              <div className="p-6 border-b flex items-center gap-4 bg-gray-50/50">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input placeholder="Search catalog..." className="pl-12 h-12 rounded-2xl border-none bg-white font-bold text-sm" />
                </div>
                <Button variant="outline" className="rounded-xl h-12 border-none bg-white shadow-sm font-bold">
                  Filter
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                      <th className="px-8 py-4">Product Info</th>
                      <th className="px-8 py-4">Salt Composition</th>
                      <th className="px-8 py-4">Price / Stock</th>
                      <th className="px-8 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {isMedsLoading ? (
                      <tr>
                        <td colSpan={4} className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></td>
                      </tr>
                    ) : medicines?.map((med: any) => (
                      <tr key={med.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden shrink-0 border border-gray-100">
                              <img src={med.imageUrl} alt={med.name} className="w-full h-full object-contain p-1" />
                            </div>
                            <div>
                              <p className="font-black text-sm text-gray-900">{med.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{med.manufacturer}</span>
                                {med.isGeneric && <Badge className="bg-green-100 text-green-700 text-[8px] font-black h-4 px-1 border-none">Generic</Badge>}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-xs font-bold text-gray-500 line-clamp-1 italic max-w-xs">{med.saltComposition}</p>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col">
                            <span className="font-black text-primary text-sm">₹{med.price}</span>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${med.availableQuantity < 50 ? 'text-red-500' : 'text-gray-400'}`}>
                              {med.availableQuantity} in stock
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-full hover:bg-white shadow-sm border border-gray-100">
                                  <Edit className="w-4 h-4 text-gray-400" />
                                </Button>
                              </DialogTrigger>
                              <ProductFormDialog 
                                initialData={med} 
                                onSubmit={(data) => updateDocumentNonBlocking(doc(db, 'medicines', med.id), data)} 
                              />
                            </Dialog>
                            <Button variant="ghost" size="icon" className="rounded-full hover:bg-red-50 hover:text-red-500 shadow-sm border border-gray-100" onClick={() => deleteDocumentNonBlocking(doc(db, 'medicines', med.id))}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!isMedsLoading && medicines?.length === 0 && (
                   <div className="p-20 text-center text-gray-400 font-bold">No products found. Seed master data to start.</div>
                )}
              </div>
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
    categoryId: 'cat_diabetes'
  });

  return (
    <DialogContent className="max-w-2xl rounded-[40px] border-none shadow-2xl p-0 overflow-hidden">
      <DialogHeader className="p-10 bg-primary text-white">
        <DialogTitle className="text-2xl font-black uppercase tracking-tight">
          {initialData ? 'Edit Product' : 'Add New Medication'}
        </DialogTitle>
      </DialogHeader>
      <div className="p-10 space-y-8 max-h-[70vh] overflow-y-auto scrollbar-hide">
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Product Name</Label>
            <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="h-12 rounded-xl bg-gray-50 border-none font-bold" />
          </div>
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Manufacturer</Label>
            <Input value={formData.manufacturer} onChange={e => setFormData({...formData, manufacturer: e.target.value})} className="h-12 rounded-xl bg-gray-50 border-none font-bold" />
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Salt Composition / Bio-equivalent Formula</Label>
          <Input value={formData.saltComposition} onChange={e => setFormData({...formData, saltComposition: e.target.value})} className="h-12 rounded-xl bg-gray-50 border-none font-bold italic" />
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Price (INR)</Label>
            <Input type="number" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="h-12 rounded-xl bg-gray-50 border-none font-bold" />
          </div>
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Stock Quantity</Label>
            <Input type="number" value={formData.availableQuantity} onChange={e => setFormData({...formData, availableQuantity: Number(e.target.value)})} className="h-12 rounded-xl bg-gray-50 border-none font-bold" />
          </div>
        </div>

        <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl">
          <div>
            <Label className="font-black text-sm">Bio-equivalent Generic</Label>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Mark this if the product is an affordable alternative.</p>
          </div>
          <Switch checked={formData.isGeneric} onCheckedChange={val => setFormData({...formData, isGeneric: val})} />
        </div>

        <div className="space-y-3">
          <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Description</Label>
          <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="min-h-[100px] rounded-2xl bg-gray-50 border-none font-bold text-sm" />
        </div>

        <div className="space-y-3">
          <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Image URL</Label>
          <Input value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} className="h-12 rounded-xl bg-gray-50 border-none font-bold text-xs" />
        </div>
      </div>
      <DialogFooter className="p-8 bg-gray-50 border-t flex justify-end gap-4">
        <Button onClick={() => onSubmit(formData)} className="rounded-full h-14 px-12 font-black uppercase tracking-widest shadow-xl shadow-primary/20">
          <Check className="w-5 h-5 mr-2" /> Save Product
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
