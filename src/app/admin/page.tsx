
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
  ChevronRight,
  FlaskConical,
  Stethoscope
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
      },
      {
        name: "Sitagliptin M 50/500",
        price: 240,
        saltComposition: "Sitagliptin 50mg + Metformin 500mg",
        manufacturer: "HealthLink Generic",
        categoryId: "cat_diabetes",
        category: "Diabetes",
        description: "Affordable bio-equivalent alternative to Janumet.",
        isGeneric: true,
        isTopDeal: false,
        dosageForm: "Tablet",
        strength: "50mg/500mg",
        availableQuantity: 500,
        imageUrl: "https://picsum.photos/seed/med3/300/300"
      }
    ];

    const initialCats = [
      { id: 'cat_diabetes', name: 'Diabetes', description: 'Blood sugar management' },
      { id: 'cat_heart', name: 'Heart care', description: 'Cardiac health essentials' },
      { id: 'cat_stomach', name: 'Stomach care', description: 'Digestive & gut health' }
    ];

    initialCats.forEach(cat => {
      updateDocumentNonBlocking(doc(db, 'categories', cat.id), cat);
    });

    initialMeds.forEach(med => {
      addDocumentNonBlocking(collection(db, 'medicines'), med);
    });
    
    toast({ title: "Master Data Seeded", description: "Initial products and categories added." });
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
                <Package className="w-4 h-4" /> Product Master
              </Button>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black uppercase text-primary">Verified Admin</span>
              <span className="text-[8px] font-bold text-gray-400 truncate max-w-[120px]">{user.email}</span>
            </div>
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
               <div className="flex items-center gap-2 bg-green-50 text-green-600 px-6 py-2 rounded-full border border-green-100">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Systems Operational</span>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="rounded-[40px] border-none shadow-xl bg-white p-10 flex flex-col items-center text-center group hover:shadow-2xl transition-all">
                <div className="w-20 h-20 bg-primary/10 rounded-[32px] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <UserCheck className="w-10 h-10 text-primary" />
                </div>
                <CardTitle className="text-2xl font-black mb-2">Verified Session</CardTitle>
                <CardDescription className="max-w-xs mx-auto mb-6">
                  Session token is active. Your administrative changes will sync instantly.
                </CardDescription>
                <Button variant="outline" className="rounded-full h-12 px-8 font-bold border-2">Session Log</Button>
              </Card>

              <Card className="rounded-[40px] border-none shadow-xl bg-white p-10 flex flex-col items-center text-center group hover:shadow-2xl transition-all">
                <div className="w-20 h-20 bg-orange-50 rounded-[32px] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Database className="w-10 h-10 text-orange-400" />
                </div>
                <CardTitle className="text-2xl font-black mb-2">Master Tools</CardTitle>
                <CardDescription className="max-w-xs mx-auto mb-6">
                  Quickly initialize categories and verified medicines in Firestore.
                </CardDescription>
                <Button onClick={seedMasterData} className="rounded-full h-12 px-10 font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20">
                  Seed Database
                </Button>
              </Card>

              <Card className="rounded-[40px] border-none shadow-xl bg-white p-10 flex flex-col items-center text-center group hover:shadow-2xl transition-all">
                <div className="w-20 h-20 bg-gray-50 rounded-[32px] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Settings className="w-10 h-10 text-gray-400" />
                </div>
                <CardTitle className="text-2xl font-black mb-2">System Config</CardTitle>
                <CardDescription className="max-w-xs mx-auto mb-6">
                  Manage therapeutic category definitions and labs.
                </CardDescription>
                <Button variant="outline" className="rounded-full h-12 px-10 font-bold uppercase text-[10px] tracking-widest border-2">Global Config</Button>
              </Card>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-4xl font-black font-headline text-gray-900">Product Master</h2>
                <p className="text-gray-400 font-bold mt-1 uppercase tracking-widest text-[10px]">Real-time pharmaceutical inventory</p>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="rounded-full h-14 px-8 font-black gap-3 shadow-xl shadow-primary/20">
                    <Plus className="w-5 h-5" /> Add New Medicine
                  </Button>
                </DialogTrigger>
                <ProductFormDialog onSubmit={(data) => addDocumentNonBlocking(collection(db, 'medicines'), data)} />
              </Dialog>
            </div>

            <Card className="rounded-[40px] border-none shadow-xl overflow-hidden bg-white">
              <div className="p-8 border-b flex items-center gap-4 bg-gray-50/50">
                <div className="relative flex-1">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input placeholder="Search catalog by name or salt..." className="pl-14 h-14 rounded-2xl border-none bg-white font-bold text-sm shadow-inner" />
                </div>
                <Button variant="outline" className="rounded-2xl h-14 border-none bg-white shadow-sm font-bold px-8">
                  Filter
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-[11px] font-black uppercase text-gray-400 tracking-[0.2em]">
                      <th className="px-10 py-6">Product & Lab</th>
                      <th className="px-10 py-6">Salt Composition</th>
                      <th className="px-10 py-6">Price & Inventory</th>
                      <th className="px-10 py-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {isMedsLoading ? (
                      <tr>
                        <td colSpan={4} className="p-32 text-center"><Loader2 className="animate-spin mx-auto text-primary w-10 h-10" /></td>
                      </tr>
                    ) : medicines?.map((med: any) => (
                      <tr key={med.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-10 py-8">
                          <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-gray-50 rounded-2xl overflow-hidden shrink-0 border border-gray-100 p-2">
                              <img src={med.imageUrl} alt={med.name} className="w-full h-full object-contain" />
                            </div>
                            <div>
                              <p className="font-black text-lg text-gray-900 group-hover:text-primary transition-colors">{med.name}</p>
                              <div className="flex items-center gap-3 mt-1.5">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{med.manufacturer}</span>
                                {med.isGeneric && <Badge className="bg-green-100 text-green-700 text-[9px] font-black h-5 px-2 border-none">Generic</Badge>}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-8">
                          <div className="flex items-start gap-2">
                            <FlaskConical className="w-4 h-4 text-primary shrink-0 opacity-40" />
                            <p className="text-xs font-bold text-gray-500 italic max-w-xs leading-relaxed">{med.saltComposition}</p>
                          </div>
                        </td>
                        <td className="px-10 py-8">
                          <div className="flex flex-col gap-1">
                            <span className="font-black text-primary text-lg">₹{med.price}</span>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-black uppercase tracking-widest ${med.availableQuantity < 50 ? 'text-red-500 bg-red-50' : 'text-gray-400 bg-gray-50'} px-2 py-0.5 rounded-md`}>
                                {med.availableQuantity} in stock
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-8 text-right">
                          <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-full w-12 h-12 hover:bg-white shadow-sm border border-gray-100">
                                  <Edit className="w-5 h-5 text-gray-400" />
                                </Button>
                              </DialogTrigger>
                              <ProductFormDialog 
                                initialData={med} 
                                onSubmit={(data) => updateDocumentNonBlocking(doc(db, 'medicines', med.id), data)} 
                              />
                            </Dialog>
                            <Button variant="ghost" size="icon" className="rounded-full w-12 h-12 hover:bg-red-50 hover:text-red-500 shadow-sm border border-gray-100" onClick={() => deleteDocumentNonBlocking(doc(db, 'medicines', med.id))}>
                              <Trash2 className="w-5 h-5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!isMedsLoading && medicines?.length === 0 && (
                   <div className="p-32 text-center text-gray-400 font-bold">
                     <Package className="w-20 h-20 mx-auto mb-6 opacity-20" />
                     <p>Catalog is currently empty. Seed master data to start.</p>
                   </div>
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
    categoryId: 'cat_diabetes',
    category: 'Diabetes',
    dosageForm: 'Tablet',
    strength: ''
  });

  return (
    <DialogContent className="max-w-3xl rounded-[40px] border-none shadow-2xl p-0 overflow-hidden">
      <DialogHeader className="p-10 bg-primary text-white">
        <DialogTitle className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
          <Stethoscope className="w-8 h-8" />
          {initialData ? 'Edit Medication' : 'Register New Medicine'}
        </DialogTitle>
        <CardDescription className="text-white/70 font-bold uppercase tracking-widest text-[10px]">Verify all pharmacological details before saving</CardDescription>
      </DialogHeader>
      <div className="p-10 space-y-8 max-h-[70vh] overflow-y-auto scrollbar-hide">
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Commercial Name</Label>
            <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="h-14 rounded-2xl bg-gray-50 border-none font-black text-lg focus-visible:ring-primary" placeholder="e.g. Janumet" />
          </div>
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Manufacturer / Lab</Label>
            <Input value={formData.manufacturer} onChange={e => setFormData({...formData, manufacturer: e.target.value})} className="h-14 rounded-2xl bg-gray-50 border-none font-bold focus-visible:ring-primary" placeholder="e.g. MSD Pharma" />
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Salt Composition / Bio-equivalent Formula</Label>
          <div className="relative">
            <FlaskConical className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary opacity-40" />
            <Input value={formData.saltComposition} onChange={e => setFormData({...formData, saltComposition: e.target.value})} className="h-14 pl-12 rounded-2xl bg-gray-50 border-none font-bold italic focus-visible:ring-primary" placeholder="e.g. Sitagliptin 50mg + Metformin 500mg" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Dosage Form</Label>
            <Input value={formData.dosageForm} onChange={e => setFormData({...formData, dosageForm: e.target.value})} className="h-14 rounded-2xl bg-gray-50 border-none font-bold" placeholder="Tablet, Syrup, etc." />
          </div>
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Strength</Label>
            <Input value={formData.strength} onChange={e => setFormData({...formData, strength: e.target.value})} className="h-14 rounded-2xl bg-gray-50 border-none font-bold" placeholder="50mg / 10ml" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Price (INR)</Label>
            <Input type="number" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="h-14 rounded-2xl bg-gray-50 border-none font-black text-xl text-primary" />
          </div>
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Current Inventory</Label>
            <Input type="number" value={formData.availableQuantity} onChange={e => setFormData({...formData, availableQuantity: Number(e.target.value)})} className="h-14 rounded-2xl bg-gray-50 border-none font-bold" />
          </div>
        </div>

        <div className="flex items-center justify-between p-8 bg-primary/5 rounded-[32px] border border-primary/10">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${formData.isGeneric ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
              <Database className="w-6 h-6" />
            </div>
            <div>
              <Label className="font-black text-sm uppercase tracking-tight">Bio-equivalent Generic</Label>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Mark if this is an affordable alternative.</p>
            </div>
          </div>
          <Switch checked={formData.isGeneric} onCheckedChange={val => setFormData({...formData, isGeneric: val})} />
        </div>

        <div className="space-y-3">
          <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Description & Usage Notes</Label>
          <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="min-h-[120px] rounded-3xl bg-gray-50 border-none font-bold text-sm p-6 focus-visible:ring-primary" placeholder="Enter clinical description and typical uses..." />
        </div>

        <div className="space-y-3">
          <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Visual Resource (Image URL)</Label>
          <Input value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} className="h-14 rounded-2xl bg-gray-50 border-none font-bold text-xs" />
        </div>
      </div>
      <DialogFooter className="p-10 bg-gray-50 border-t flex justify-end gap-4">
        <Button onClick={() => onSubmit(formData)} className="rounded-full h-16 px-14 font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-primary/30 active:scale-95 transition-all">
          <Check className="w-5 h-5 mr-3" /> Save To Catalog
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
