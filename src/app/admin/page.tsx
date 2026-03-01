
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
  ClipboardList, 
  Activity, 
  Eye, 
  Search, 
  MapPin, 
  Phone, 
  Loader2, 
  Lock, 
  Edit3, 
  Check, 
  X,
  Plus,
  ShoppingCart,
  LayoutDashboard
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useUser, useFirestore, useDoc, useAuth, useMemoFirebase, useCollection, updateDocumentNonBlocking } from '@/firebase';
import { doc, collection, query, orderBy, limit } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  
  const [activeTab, setActiveTab] = useState<'orders' | 'products'>('orders');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localAuthLoading, setLocalAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Edit Medicine State
  const [isEditing, setIsEditing] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  // Check for admin role
  const adminRoleRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'roles_admin', user.uid);
  }, [db, user]);

  const { data: adminRole, isLoading: isAdminRoleLoading } = useDoc(adminRoleRef);
  const isAdmin = !!adminRole;

  // Real-time Medicines
  const medicinesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'medicines'), orderBy('name', 'asc'));
  }, [db]);
  const { data: medicines, isLoading: medsLoading } = useCollection(medicinesQuery);

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
  };

  const saveProductChanges = () => {
    if (!editingProduct || !db) return;
    const prodRef = doc(db, 'medicines', editingProduct.id);
    updateDocumentNonBlocking(prodRef, {
      price: Number(editingProduct.price),
      availableQuantity: Number(editingProduct.availableQuantity),
      name: editingProduct.name,
      isGeneric: editingProduct.isGeneric,
      mrp: Number(editingProduct.mrp || editingProduct.price)
    });
    setIsEditing(false);
    setEditingProduct(null);
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
                variant={activeTab === 'orders' ? 'default' : 'ghost'} 
                onClick={() => setActiveTab('orders')}
                className="rounded-xl h-10 font-bold text-xs uppercase tracking-widest"
              >
                <Package className="w-4 h-4 mr-2" /> Orders
              </Button>
              <Button 
                variant={activeTab === 'products' ? 'default' : 'ghost'} 
                onClick={() => setActiveTab('products')}
                className="rounded-xl h-10 font-bold text-xs uppercase tracking-widest"
              >
                <Activity className="w-4 h-4 mr-2" /> Medicines
              </Button>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Administrator</p>
              <p className="text-sm font-bold text-gray-900">{user.email}</p>
            </div>
            <Button variant="ghost" onClick={handleLogout} className="text-red-500 hover:text-red-600 rounded-full font-bold">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Active Medicines', val: medicines?.length || '0', icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Low Stock Items', val: medicines?.filter(m => m.availableQuantity < 50).length || '0', icon: Package, color: 'text-orange-600', bg: 'bg-orange-50' },
            { label: 'Total Orders', val: '1,240', icon: ShoppingCart, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'System Status', val: 'Online', icon: ShieldCheck, color: 'text-purple-600', bg: 'bg-purple-50' }
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

        {activeTab === 'orders' ? (
          <Card className="rounded-[40px] border-none shadow-xl overflow-hidden bg-white">
            <CardHeader className="p-8 border-b">
              <CardTitle className="text-2xl font-black">Order Fulfillment Stream</CardTitle>
              <CardDescription>Monitor and process incoming prescriptions and medicine orders</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
               <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow className="border-none">
                    <TableHead className="pl-10 text-[10px] font-black uppercase tracking-widest text-gray-400">Order & Customer</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-gray-400">Location</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-gray-400">Amount</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-gray-400">Status</TableHead>
                    <TableHead className="pr-10 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { id: 'ORD-101', user: 'Rahul Khanna', loc: 'Worli, Mumbai', amt: '₹1,250', status: 'Pending Review' },
                    { id: 'ORD-102', user: 'Priya Sharma', loc: 'Bangalore, KA', amt: '₹4,500', status: 'Processing' }
                  ].map((o) => (
                    <TableRow key={o.id} className="hover:bg-gray-50 border-b border-gray-50">
                      <TableCell className="pl-10 py-6">
                        <div className="flex flex-col">
                          <span className="font-black text-gray-900">{o.id}</span>
                          <span className="text-xs font-bold text-gray-500">{o.user}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-bold text-gray-600">{o.loc}</TableCell>
                      <TableCell className="font-black">{o.amt}</TableCell>
                      <TableCell>
                        <Badge className="rounded-full bg-orange-100 text-orange-700 border-none font-black text-[10px] uppercase">{o.status}</Badge>
                      </TableCell>
                      <TableCell className="pr-10 text-right">
                        <Button variant="outline" className="rounded-full h-10 font-black text-[10px] uppercase tracking-widest">Verify</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-[40px] border-none shadow-xl overflow-hidden bg-white">
            <CardHeader className="p-8 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-black">Medicine Catalog Management</CardTitle>
                <CardDescription>Update prices, stock levels, and generic equivalents in real-time</CardDescription>
              </div>
              <Button className="rounded-full h-12 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20">
                <Plus className="w-4 h-4 mr-2" /> Add New Medicine
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow className="border-none">
                    <TableHead className="pl-10 text-[10px] font-black uppercase tracking-widest text-gray-400">Medicine & Manufacturer</TableHead>
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
                        <Button variant="ghost" size="icon" onClick={() => startEditing(m)} className="rounded-full text-primary hover:bg-primary/10">
                          <Edit3 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="rounded-[40px] max-w-lg p-10">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">Edit Medicine Details</DialogTitle>
            <CardDescription>Changes will reflect instantly on the website for all users.</CardDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Unit Price (₹)</Label>
                <Input 
                  type="number" 
                  value={editingProduct?.price || ''} 
                  onChange={e => setEditingProduct({ ...editingProduct, price: e.target.value })}
                  className="h-14 rounded-2xl bg-gray-50 border-none font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Stock Count</Label>
                <Input 
                  type="number" 
                  value={editingProduct?.availableQuantity || ''} 
                  onChange={e => setEditingProduct({ ...editingProduct, availableQuantity: e.target.value })}
                  className="h-14 rounded-2xl bg-gray-50 border-none font-bold"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Display Name</Label>
              <Input 
                value={editingProduct?.name || ''} 
                onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                className="h-14 rounded-2xl bg-gray-50 border-none font-bold"
              />
            </div>

            <div className="flex items-center gap-3 p-6 bg-gray-50 rounded-[28px] border border-gray-100">
               <input 
                 type="checkbox" 
                 id="isGeneric"
                 checked={editingProduct?.isGeneric || false}
                 onChange={e => setEditingProduct({ ...editingProduct, isGeneric: e.target.checked })}
                 className="w-5 h-5 rounded accent-primary"
               />
               <Label htmlFor="isGeneric" className="font-bold text-gray-700 cursor-pointer">Mark as Bio-Equivalent Generic</Label>
            </div>
          </div>

          <DialogFooter className="gap-4">
            <Button variant="outline" onClick={() => setIsEditing(false)} className="h-14 rounded-full px-8 font-black uppercase text-[10px] tracking-widest border-2 flex-1">Discard</Button>
            <Button onClick={saveProductChanges} className="h-14 rounded-full px-12 font-black uppercase text-[10px] tracking-widest flex-1 shadow-xl shadow-primary/20">
              <Check className="w-4 h-4 mr-2" /> Commit Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
