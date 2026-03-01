"use client"

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ShieldCheck, 
  LogOut, 
  Package, 
  Activity, 
  Loader2, 
  Lock, 
  Edit3, 
  Check, 
  Plus,
  ShoppingCart,
  Trash2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useUser, useFirestore, useDoc, useAuth, useMemoFirebase, useCollection, updateDocumentNonBlocking, addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { doc, collection, query, orderBy, collectionGroup, limit } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  
  const [activeTab, setActiveTab] = useState<'orders' | 'products'>('products');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localAuthLoading, setLocalAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Edit/Add Medicine State
  const [isEditing, setIsEditing] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isNew, setIsNew] = useState(false);

  // Check for admin role
  const adminRoleRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'roles_admin', user.uid);
  }, [db, user]);

  const { data: adminRole, isLoading: isAdminRoleLoading } = useDoc(adminRoleRef);
  const isAdmin = !!adminRole;

  // Real-time Medicines - Only fetch if user is confirmed admin to avoid permission errors
  const medicinesQuery = useMemoFirebase(() => {
    if (!db || !isAdmin) return null;
    return query(collection(db, 'medicines'), orderBy('name', 'asc'));
  }, [db, isAdmin]);
  const { data: medicines, isLoading: medsLoading } = useCollection(medicinesQuery);

  // Real-time Orders - Only fetch if user is confirmed admin to avoid permission errors
  const ordersQuery = useMemoFirebase(() => {
    if (!db || !isAdmin) return null;
    return query(collectionGroup(db, 'orders'), orderBy('orderDate', 'desc'), limit(20));
  }, [db, isAdmin]);
  const { data: orders, isLoading: ordersLoading } = useCollection(ordersQuery);

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

  const startEditing = (product: any) => {
    setEditingProduct({ ...product });
    setIsEditing(true);
    setIsNew(false);
  };

  const startNew = () => {
    setEditingProduct({
      name: '',
      saltComposition: '',
      price: 0,
      availableQuantity: 100,
      isGeneric: false,
      manufacturerId: 'mfr-hl-1',
      categoryId: 'cat-chronic-1',
      imageUrl: 'https://picsum.photos/seed/med-new/300/300',
      description: '',
      dosageForm: 'Tablet',
      strength: '500mg',
      isTopDeal: false
    });
    setIsEditing(true);
    setIsNew(true);
  };

  const saveProductChanges = () => {
    if (!editingProduct || !db) return;
    
    const data = {
      ...editingProduct,
      price: Number(editingProduct.price),
      availableQuantity: Number(editingProduct.availableQuantity),
      mrp: Number(editingProduct.mrp || editingProduct.price * 1.2)
    };

    if (isNew) {
      addDocumentNonBlocking(collection(db, 'medicines'), data);
    } else {
      const prodRef = doc(db, 'medicines', editingProduct.id);
      updateDocumentNonBlocking(prodRef, data);
    }
    
    setIsEditing(false);
    setEditingProduct(null);
  };

  const deleteProduct = (id: string) => {
    if (!db || !confirm('Are you sure you want to delete this medicine?')) return;
    deleteDocumentNonBlocking(doc(db, 'medicines', id));
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
                  <p className="text-[9px] font-bold text-gray-500 text-center">
                    Register this UID in the <code className="bg-gray-200 px-1 rounded text-gray-900">roles_admin</code> collection to access.
                  </p>
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
              <span className="font-bold text-xl font-headline tracking-tight">Supervisor Console</span>
            </div>
            
            <nav className="hidden md:flex items-center gap-1 bg-gray-50 p-1 rounded-2xl border">
              <Button 
                variant={activeTab === 'products' ? 'default' : 'ghost'} 
                onClick={() => setActiveTab('products')}
                className="rounded-xl h-10 font-bold text-xs uppercase tracking-widest"
              >
                <Activity className="w-4 h-4 mr-2" /> Catalog
              </Button>
              <Button 
                variant={activeTab === 'orders' ? 'default' : 'ghost'} 
                onClick={() => setActiveTab('orders')}
                className="rounded-xl h-10 font-bold text-xs uppercase tracking-widest"
              >
                <Package className="w-4 h-4 mr-2" /> Orders
              </Button>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={handleLogout} className="text-red-500 hover:text-red-600 rounded-full font-bold">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Active Medicines', val: medicines?.length || '0', icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Low Stock Items', val: medicines?.filter(m => m.availableQuantity < 50).length || '0', icon: Package, color: 'text-orange-600', bg: 'bg-orange-50' },
            { label: 'Total Orders', val: orders?.length || '0', icon: ShoppingCart, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'System Status', val: 'Live', icon: ShieldCheck, color: 'text-purple-600', bg: 'bg-purple-50' }
          ].map((stat, i) => (
            <Card key={i} className="rounded-[32px] border-none shadow-sm">
              <CardContent className="p-6 flex items-center gap-6">
                <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className="text-xl font-black">{stat.val}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {activeTab === 'products' ? (
          <Card className="rounded-[40px] border-none shadow-xl overflow-hidden bg-white">
            <CardHeader className="p-8 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-black">Medicine Catalog</CardTitle>
                <CardDescription>Live database management for your online pharmacy</CardDescription>
              </div>
              <Button onClick={startNew} className="rounded-full h-12 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20">
                <Plus className="w-4 h-4 mr-2" /> Add New Medicine
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow className="border-none">
                    <TableHead className="pl-10 text-[10px] font-black uppercase tracking-widest text-gray-400">Medicine & Salt</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-gray-400">Price</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-gray-400">Stock</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-gray-400">Type</TableHead>
                    <TableHead className="pr-10 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">Manage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {medsLoading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-20"><Loader2 className="animate-spin mx-auto text-primary" /></TableCell></TableRow>
                  ) : medicines?.map((m) => (
                    <TableRow key={m.id} className="hover:bg-gray-50 border-b border-gray-50 group">
                      <TableCell className="pl-10 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gray-50 rounded-xl overflow-hidden p-1 shrink-0 border border-gray-100">
                            <img src={m.imageUrl} alt="" className="w-full h-full object-contain" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-black text-gray-900 group-hover:text-primary transition-colors">{m.name}</span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{m.saltComposition}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-black text-gray-900">₹{m.price}</TableCell>
                      <TableCell>
                        <span className={`font-black ${m.availableQuantity < 50 ? 'text-red-500' : 'text-green-600'}`}>
                          {m.availableQuantity} units
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`rounded-lg px-3 py-1 text-[10px] font-black uppercase ${m.isGeneric ? 'bg-green-50 text-green-700 border-green-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                          {m.isGeneric ? 'Generic' : 'Branded'}
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-10 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => startEditing(m)} className="rounded-full text-primary hover:bg-primary/10">
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteProduct(m.id)} className="rounded-full text-red-500 hover:bg-red-50">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-[40px] border-none shadow-xl overflow-hidden bg-white">
            <CardHeader className="p-8 border-b">
              <CardTitle className="text-2xl font-black">Global Order Stream</CardTitle>
              <CardDescription>Live fulfillment monitoring across all users</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
               <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow className="border-none">
                    <TableHead className="pl-10 text-[10px] font-black uppercase tracking-widest text-gray-400">Order & Date</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-gray-400">Amount</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-gray-400">Status</TableHead>
                    <TableHead className="pr-10 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordersLoading ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-20"><Loader2 className="animate-spin mx-auto text-primary" /></TableCell></TableRow>
                  ) : orders?.map((o) => (
                    <TableRow key={o.id} className="hover:bg-gray-50 border-b border-gray-50">
                      <TableCell className="pl-10 py-6">
                        <div className="flex flex-col">
                          <span className="font-black text-gray-900">ID: {o.id.slice(0, 8)}</span>
                          <span className="text-xs font-bold text-gray-500">{o.orderDate?.toDate()?.toLocaleDateString()}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-black">₹{o.totalAmount}</TableCell>
                      <TableCell>
                        <Badge className="rounded-full bg-orange-100 text-orange-700 border-none font-black text-[10px] uppercase">{o.status}</Badge>
                      </TableCell>
                      <TableCell className="pr-10 text-right">
                        <Button variant="outline" className="rounded-full h-10 font-black text-[10px] uppercase tracking-widest">Details</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {orders?.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-20 font-bold text-gray-400">No orders found yet</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Edit/Add Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="rounded-[40px] max-w-2xl p-10 overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">
              {isNew ? 'Register New Medicine' : 'Update Catalog Entry'}
            </DialogTitle>
            <CardDescription>Live database updates. Affects website instantly.</CardDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-gray-400">Product Name</Label>
                <Input value={editingProduct?.name || ''} onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })} className="h-12 rounded-xl bg-gray-50 border-none font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-gray-400">Salt Composition</Label>
                <Input value={editingProduct?.saltComposition || ''} onChange={e => setEditingProduct({ ...editingProduct, saltComposition: e.target.value })} className="h-12 rounded-xl bg-gray-50 border-none font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-gray-400">Price (₹)</Label>
                  <Input type="number" value={editingProduct?.price || ''} onChange={e => setEditingProduct({ ...editingProduct, price: e.target.value })} className="h-12 rounded-xl bg-gray-50 border-none font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-gray-400">Stock</Label>
                  <Input type="number" value={editingProduct?.availableQuantity || ''} onChange={e => setEditingProduct({ ...editingProduct, availableQuantity: e.target.value })} className="h-12 rounded-xl bg-gray-50 border-none font-bold" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-gray-400">Image URL</Label>
                <div className="flex gap-2">
                  <Input value={editingProduct?.imageUrl || ''} onChange={e => setEditingProduct({ ...editingProduct, imageUrl: e.target.value })} className="h-12 rounded-xl bg-gray-50 border-none font-bold flex-1" />
                  <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden shrink-0 border">
                    <img src={editingProduct?.imageUrl} alt="" className="w-full h-full object-contain" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-gray-400">Description</Label>
                <Input value={editingProduct?.description || ''} onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })} className="h-12 rounded-xl bg-gray-50 border-none font-bold" />
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                 <input type="checkbox" id="isGeneric" checked={editingProduct?.isGeneric || false} onChange={e => setEditingProduct({ ...editingProduct, isGeneric: e.target.checked })} className="w-5 h-5 accent-primary" />
                 <Label htmlFor="isGeneric" className="font-bold text-gray-700 cursor-pointer">Mark as Generic</Label>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-4">
            <Button variant="outline" onClick={() => setIsEditing(false)} className="h-14 rounded-full px-8 font-black uppercase text-[10px] tracking-widest border-2">Cancel</Button>
            <Button onClick={saveProductChanges} className="h-14 rounded-full px-12 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20">
              <Check className="w-4 h-4 mr-2" /> {isNew ? 'Create Product' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}