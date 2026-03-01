
"use client"

import { useState } from 'react';
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
  UserPlus
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

export default function AdminRebuild() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // 1. Admin Role Guard
  const adminRoleRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'roles_admin', user.uid);
  }, [db, user]);

  const { data: adminRole, isLoading: isAdminRoleLoading } = useDoc(adminRoleRef);
  const isAdmin = !!adminRole;

  // 2. Data Queries (Only initiated if isAdmin is true)
  const medsQuery = useMemoFirebase(() => {
    if (!db || !isAdmin) return null;
    return query(collection(db, 'medicines'), orderBy('name', 'asc'));
  }, [db, isAdmin]);
  const { data: medicines, isLoading: isMedsLoading } = useCollection(medsQuery);

  const catsQuery = useMemoFirebase(() => {
    if (!db || !isAdmin) return null;
    return query(collection(db, 'categories'), orderBy('name', 'asc'));
  }, [db, isAdmin]);
  const { data: categories, isLoading: isCatsLoading } = useCollection(catsQuery);

  const ordersQuery = useMemoFirebase(() => {
    if (!db || !isAdmin) return null;
    return query(collectionGroup(db, 'orders'), orderBy('orderDate', 'desc'));
  }, [db, isAdmin]);
  const { data: orders, isLoading: isOrdersLoading } = useCollection(ordersQuery);

  // Handlers
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

  const bootstrapAdminRole = () => {
    if (!db || !user) return;
    setDocumentNonBlocking(doc(db, 'roles_admin', user.uid), {
      uid: user.uid,
      role: 'admin',
      assignedAt: new Date().toISOString()
    }, { merge: true });
    toast({ title: 'Role Claimed', description: 'You now have supervisor privileges.' });
  };

  const seedData = () => {
    if (!db || !isAdmin) return;
    
    const initialCats = [
      { id: 'cat_diabetes', name: 'Diabetes', description: 'Blood sugar management' },
      { id: 'cat_heart', name: 'Heart care', description: 'Cardiac health essentials' },
      { id: 'cat_stomach', name: 'Stomach care', description: 'Digestive & gut health' }
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
        dosageForm: "Tablet",
        strength: "50mg/500mg",
        availableQuantity: 100,
        imageUrl: "https://picsum.photos/seed/med1/300/300",
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
        dosageForm: "Tablet",
        strength: "50mg/500mg",
        availableQuantity: 500,
        imageUrl: "https://picsum.photos/seed/med2/300/300",
      }
    ];

    initialCats.forEach(cat => setDocumentNonBlocking(doc(db, 'categories', cat.id), cat, { merge: true }));
    initialMeds.forEach(med => setDocumentNonBlocking(doc(db, 'medicines', med.id), med, { merge: true }));
    
    toast({ title: 'Data Seeded', description: 'Core catalog initialized.' });
  };

  if (isUserLoading || isAdminRoleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  // Login Required
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <Card className="max-w-md w-full rounded-[40px] shadow-2xl border-none">
          <CardHeader className="text-center p-12 bg-primary text-white">
            <ShieldCheck className="w-12 h-12 mx-auto mb-4" />
            <CardTitle className="text-3xl font-bold">Supervisor Portal</CardTitle>
            <CardDescription className="text-white/80">Secure console for pharmacists</CardDescription>
          </CardHeader>
          <CardContent className="p-10 bg-white">
            <form onSubmit={handleLogin} className="space-y-4">
              <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
              <Input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
              <Button type="submit" disabled={authLoading} className="w-full h-14 rounded-full font-bold">
                {authLoading ? <Loader2 className="animate-spin" /> : "Access Console"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not Admin Gate
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <Card className="max-w-md w-full rounded-[40px] shadow-xl border-none p-10 text-center space-y-8">
          <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert className="w-10 h-10 text-red-500" />
          </div>
          <div>
            <h2 className="text-2xl font-black mb-2">Access Restricted</h2>
            <p className="text-gray-500 text-sm">Your account UID: <code className="bg-gray-100 p-1 rounded text-xs">{user.uid}</code> does not have supervisor privileges.</p>
          </div>
          <div className="space-y-3 pt-4 border-t">
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Development Tools</p>
            <Button onClick={bootstrapAdminRole} className="w-full gap-2 rounded-full h-12 bg-orange-600 hover:bg-orange-700">
              <UserPlus className="w-4 h-4" /> Claim Admin Role
            </Button>
            <Button onClick={handleLogout} variant="ghost" className="w-full text-red-500">Sign Out</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      <header className="bg-white border-b sticky top-0 z-40 h-20">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="bg-primary p-1.5 rounded-lg"><div className="text-white font-bold text-lg">HL</div></div>
              <span className="font-black text-xl text-primary">Supervisor</span>
            </div>
            <nav className="hidden md:flex gap-1">
              {(['dashboard', 'medicines', 'categories', 'orders'] as AdminTab[]).map(tab => (
                <Button key={tab} variant={activeTab === tab ? 'secondary' : 'ghost'} onClick={() => setActiveTab(tab)} className="rounded-full capitalize px-6 font-bold">
                  {tab}
                </Button>
              ))}
            </nav>
          </div>
          <Button variant="ghost" onClick={handleLogout} size="icon" className="text-red-500"><LogOut className="w-5 h-5" /></Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {activeTab === 'dashboard' && (
          <div className="space-y-12">
            <div>
              <h1 className="text-4xl font-black">Control Center</h1>
              <p className="text-gray-400 text-xs font-black uppercase tracking-widest mt-1">Pharmacy Operations Hub</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                { label: 'Products', icon: Package, color: 'text-primary', tab: 'medicines' },
                { label: 'Fulfillment', icon: ShoppingBag, color: 'text-green-500', tab: 'orders' },
                { label: 'Therapy Hubs', icon: Tags, color: 'text-orange-400', tab: 'categories' },
              ].map(card => (
                <Card key={card.label} className="rounded-[40px] p-10 text-center border-none shadow-sm hover:shadow-xl transition-all cursor-pointer" onClick={() => setActiveTab(card.tab as AdminTab)}>
                  <card.icon className={`w-12 h-12 ${card.color} mx-auto mb-4`} />
                  <CardTitle className="text-xl font-black">{card.label}</CardTitle>
                </Card>
              ))}
              <Card className="rounded-[40px] p-10 text-center border-none shadow-sm bg-primary/5">
                <Database className="w-12 h-12 text-primary mx-auto mb-4" />
                <CardTitle className="text-xl font-black mb-4">Seeder</CardTitle>
                <Button onClick={seedData} className="w-full rounded-full">Seed Master</Button>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'medicines' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-black">Medicine Master</h2>
              <Dialog>
                <DialogTrigger asChild><Button className="rounded-full gap-2 px-8"><Plus className="w-4 h-4" /> Add Product</Button></DialogTrigger>
                <ProductDialog categories={categories || []} onSave={data => addDocumentNonBlocking(collection(db, 'medicines'), data)} />
              </Dialog>
            </div>
            <Card className="rounded-[40px] overflow-hidden border-none shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400">
                  <tr><th className="px-8 py-6">Product</th><th className="px-8 py-6">Price</th><th className="px-8 py-6">Stock</th><th className="px-8 py-6 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y">
                  {isMedsLoading ? <tr><td colSpan={4} className="p-20 text-center"><Loader2 className="animate-spin mx-auto" /></td></tr> : medicines?.map(med => (
                    <tr key={med.id} className="hover:bg-gray-50">
                      <td className="px-8 py-6">
                        <div className="font-bold">{med.name}</div>
                        <div className="text-[10px] text-gray-400 font-bold">{med.saltComposition}</div>
                      </td>
                      <td className="px-8 py-6 font-black">₹{med.price}</td>
                      <td className="px-8 py-6"><Badge variant={med.availableQuantity < 50 ? 'destructive' : 'secondary'}>{med.availableQuantity} Units</Badge></td>
                      <td className="px-8 py-6 text-right">
                        <Dialog>
                          <DialogTrigger asChild><Button variant="ghost" size="icon"><Edit className="w-4 h-4" /></Button></DialogTrigger>
                          <ProductDialog initialData={med} categories={categories || []} onSave={data => updateDocumentNonBlocking(doc(db, 'medicines', med.id), data)} />
                        </Dialog>
                        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => deleteDocumentNonBlocking(doc(db, 'medicines', med.id))}><Trash2 className="w-4 h-4" /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-8">
            <h2 className="text-3xl font-black">Global Fulfillment</h2>
            <Card className="rounded-[40px] overflow-hidden border-none shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400">
                  <tr><th className="px-8 py-6">Ref</th><th className="px-8 py-6">Status</th><th className="px-8 py-6">Amount</th><th className="px-8 py-6 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y">
                  {isOrdersLoading ? <tr><td colSpan={4} className="p-20 text-center"><Loader2 className="animate-spin mx-auto" /></td></tr> : orders?.map(order => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-8 py-6"><span className="text-xs font-black uppercase">{order.id.substring(0,8)}</span></td>
                      <td className="px-8 py-6"><Badge>{order.status}</Badge></td>
                      <td className="px-8 py-6 font-black">₹{order.totalAmount}</td>
                      <td className="px-8 py-6 text-right">
                        <Dialog>
                          <DialogTrigger asChild><Button variant="ghost" size="icon"><Eye className="w-5 h-5" /></Button></DialogTrigger>
                          <OrderDialog order={order} db={db} />
                        </Dialog>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-black">Therapy Hubs</h2>
              <Dialog>
                <DialogTrigger asChild><Button className="rounded-full gap-2 px-8"><Plus className="w-4 h-4" /> New Hub</Button></DialogTrigger>
                <CategoryDialog onSave={data => addDocumentNonBlocking(collection(db, 'categories'), data)} />
              </Dialog>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {categories?.map(cat => (
                <Card key={cat.id} className="rounded-[32px] p-8 border-none shadow-sm hover:shadow-lg transition-all">
                  <h3 className="text-xl font-black mb-2">{cat.name}</h3>
                  <p className="text-xs text-gray-400 mb-6">{cat.description}</p>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild><Button variant="outline" size="sm" className="rounded-full px-6">Edit</Button></DialogTrigger>
                      <CategoryDialog initialData={cat} onSave={data => updateDocumentNonBlocking(doc(db, 'categories', cat.id), data)} />
                    </Dialog>
                    <Button variant="ghost" size="sm" className="text-red-500" onClick={() => deleteDocumentNonBlocking(doc(db, 'categories', cat.id))}>Delete</Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Dialog Components
function ProductDialog({ initialData, categories, onSave }: { initialData?: any, categories: any[], onSave: (data: any) => void }) {
  const [formData, setFormData] = useState(initialData || { name: '', price: 0, saltComposition: '', manufacturer: '', categoryId: '', availableQuantity: 100, isGeneric: false, imageUrl: 'https://picsum.photos/seed/med/300/300' });
  return (
    <DialogContent className="max-w-2xl rounded-[40px]">
      <DialogHeader><DialogTitle className="text-2xl font-black">Medicine Details</DialogTitle></DialogHeader>
      <div className="grid grid-cols-2 gap-6 py-6">
        <div className="space-y-2"><Label>Brand Name</Label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
        <div className="space-y-2"><Label>Manufacturer</Label><Input value={formData.manufacturer} onChange={e => setFormData({...formData, manufacturer: e.target.value})} /></div>
        <div className="space-y-2"><Label>Price (₹)</Label><Input type="number" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} /></div>
        <div className="space-y-2">
          <Label>Category Hub</Label>
          <select value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})} className="w-full h-10 border rounded-md px-3 text-sm">
            <option value="">Select Hub</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="col-span-2 space-y-2"><Label>Salt Composition</Label><Input value={formData.saltComposition} onChange={e => setFormData({...formData, saltComposition: e.target.value})} /></div>
        <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl col-span-2">
          <Label className="flex-1">Bio-Equivalent Generic Alternative</Label>
          <Switch checked={formData.isGeneric} onCheckedChange={v => setFormData({...formData, isGeneric: v})} />
        </div>
      </div>
      <DialogFooter><Button onClick={() => onSave(formData)} className="w-full rounded-full h-14">Save Product</Button></DialogFooter>
    </DialogContent>
  );
}

function CategoryDialog({ initialData, onSave }: { initialData?: any, onSave: (data: any) => void }) {
  const [formData, setFormData] = useState(initialData || { name: '', description: '' });
  return (
    <DialogContent className="rounded-[40px]">
      <DialogHeader><DialogTitle className="text-2xl font-black">Therapy Hub</DialogTitle></DialogHeader>
      <div className="space-y-4 py-6">
        <div className="space-y-2"><Label>Hub Name</Label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
        <div className="space-y-2"><Label>Description</Label><Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
      </div>
      <DialogFooter><Button onClick={() => onSave(formData)} className="w-full rounded-full h-14">Save Hub</Button></DialogFooter>
    </DialogContent>
  );
}

function OrderDialog({ order, db }: { order: any, db: any }) {
  const updateStatus = (s: string) => {
    if (order.userId) {
      const ref = doc(db, 'userProfiles', order.userId, 'orders', order.id);
      updateDocumentNonBlocking(ref, { status: s });
    }
  };
  return (
    <DialogContent className="max-w-xl rounded-[40px]">
      <DialogHeader><DialogTitle className="text-2xl font-black">Fulfillment Detail</DialogTitle></DialogHeader>
      <div className="py-6 space-y-6">
        <div className="bg-gray-50 p-6 rounded-3xl">
          <p className="text-[10px] font-black uppercase text-gray-400 mb-2">Patient Reference: {order.userId?.substring(0,8)}</p>
          <p className="font-bold text-lg">Total Amount: ₹{order.totalAmount}</p>
        </div>
        <div className="flex gap-2">
          {['Processing', 'Shipped', 'Delivered'].map(s => (
            <Button key={s} variant={order.status === s ? 'default' : 'outline'} onClick={() => updateStatus(s)} className="flex-1 rounded-full">{s}</Button>
          ))}
        </div>
      </div>
    </DialogContent>
  );
}
