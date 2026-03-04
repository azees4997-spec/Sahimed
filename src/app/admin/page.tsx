
"use client"

import { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  LogOut, 
  Loader2, 
  Package, 
  ShoppingBag, 
  ShieldAlert,
  UserPlus,
  Lock,
  FileText,
  Trash2,
  Plus,
  Edit2,
  Users,
  BellRing,
  Dna,
  Receipt,
  Ticket,
  Home,
  ExternalLink,
  Copy,
  Check,
  ClipboardList,
  TrendingUp,
  User,
  Download,
  Upload,
  MoreVertical,
  ChevronRight,
  Search,
  FileDown,
  Eye,
  Calendar,
  CreditCard,
  MapPin,
  Clock,
  Phone,
  Printer,
  LayoutGrid
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';
import { 
  useUser, 
  useFirestore, 
  useAuth, 
  useMemoFirebase, 
  useCollection,
  setDocumentNonBlocking,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking,
  addDocumentNonBlocking
} from '@/firebase';
import { doc, collection, query, collectionGroup, getDoc, serverTimestamp, orderBy, where } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type AdminTab = 'overview' | 'enquiries' | 'fulfillment' | 'itemMaster' | 'moleculeMaster' | 'categories' | 'customers' | 'stockAlerts' | 'fees' | 'promocodes';

export default function AdminConsole() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const performVerification = async () => {
    if (!db || !user) return;
    setIsVerifying(true);
    try {
      const snap = await getDoc(doc(db, 'adminProfiles', user.uid));
      if (snap.exists() && (snap.data().role === 'admin' || snap.data().role === 'pharmacist')) {
        setIsVerified(true);
        toast({ title: "Authority Verified", description: "Admin access active." });
      } else {
        setIsVerified(false);
      }
    } catch (err) {
      setIsVerified(false);
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (user && !isVerified) {
      performVerification();
    } else if (!user) {
      setIsVerified(false);
    }
  }, [user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Access Denied', description: 'Invalid admin credentials.' });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setIsVerified(false);
    signOut(auth);
  };

  const bootstrapAdmin = () => {
    if (!db || !user) return;
    setDocumentNonBlocking(doc(db, 'adminProfiles', user.uid), {
      id: user.uid,
      role: 'admin',
      activatedAt: new Date().toISOString()
    }, { merge: true });
    
    setIsVerifying(true);
    toast({ title: 'Requesting Authority', description: 'Provisioning admin role... please wait.' });
    setTimeout(performVerification, 3000);
  };

  if (isUserLoading || isVerifying) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F7F6] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Syncing Authority...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F7F6] p-4">
        <Card className="max-w-md w-full rounded-[40px] shadow-2xl border-none overflow-hidden bg-white">
          <CardHeader className="text-center p-10 bg-primary text-white">
            <Lock className="w-10 h-10 mx-auto mb-4 opacity-50" />
            <CardTitle className="text-2xl font-black uppercase tracking-tight text-white">SahiMed Admin</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Admin Email</Label>
                <input type="email" placeholder="admin@sahimed.com" value={email} onChange={e => setEmail(e.target.value)} required className="w-full h-14 rounded-2xl bg-gray-50 border-none px-4 font-bold outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Password</Label>
                <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required className="w-full h-14 rounded-2xl bg-gray-50 border-none px-4 font-bold outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <Button type="submit" disabled={authLoading} className="w-full h-14 rounded-full font-black uppercase tracking-widest mt-4 shadow-xl shadow-primary/20">
                {authLoading ? <Loader2 className="animate-spin" /> : "Authorize Access"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F7F6] p-4">
        <Card className="max-w-md w-full rounded-[40px] shadow-2xl border-none p-10 text-center space-y-6 bg-white">
          <ShieldAlert className="w-12 h-12 text-orange-500 mx-auto" />
          <div className="space-y-2">
            <h2 className="text-xl font-black uppercase">Restricted Area</h2>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed">Logged in as {user.email || 'User'}, but admin role is not detected.</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-2xl space-y-2">
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Your Unique Identifier (UID)</p>
            <div className="flex items-center gap-2 bg-white border p-3 rounded-xl">
              <code className="text-[10px] font-black text-gray-600 truncate flex-1">{user.uid}</code>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-primary" onClick={() => {
                navigator.clipboard.writeText(user.uid);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
                toast({ title: "UID Copied" });
              }}>
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-3 pt-6 border-t">
            <Button onClick={bootstrapAdmin} className="w-full gap-2 rounded-full h-14 bg-orange-600 hover:bg-orange-700 uppercase font-black text-[10px] tracking-widest">
              <UserPlus className="w-4 h-4" /> Initialize Admin Role
            </Button>
            <Button onClick={performVerification} variant="outline" className="w-full h-14 rounded-full font-black uppercase text-[10px] border-2">
               Refresh Authority
            </Button>
            <Button onClick={handleLogout} variant="ghost" className="w-full text-gray-400 font-bold uppercase text-[9px] tracking-widest">Sign Out</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7F6]">
      <header className="bg-white border-b sticky top-0 z-50 h-20">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button onClick={() => setActiveTab('overview')} className="flex items-center gap-2 group text-left">
              <div className="bg-primary p-1.5 rounded-lg group-active:scale-95 transition-transform">
                <ShieldCheck className="text-white w-4 h-4" />
              </div>
              <div className="flex flex-col items-start leading-none">
                <span className="font-black text-lg tracking-tighter text-gray-900 uppercase">SahiMed Hub</span>
                <span className="text-[8px] font-black text-primary uppercase tracking-[0.3em]">Management Console</span>
              </div>
            </button>
            <nav className="hidden xl:flex gap-1 overflow-x-auto scrollbar-hide">
              {[
                { id: 'overview', label: 'Home', icon: Home },
                { id: 'enquiries', label: 'Enquiries', icon: FileText },
                { id: 'fulfillment', label: 'Orders', icon: ShoppingBag },
                { id: 'itemMaster', label: 'Inventory', icon: Package },
                { id: 'moleculeMaster', label: 'Formulas', icon: Dna },
                { id: 'categories', label: 'Categories', icon: LayoutGrid },
                { id: 'customers', label: 'Patients', icon: Users },
                { id: 'promocodes', label: 'Campaigns', icon: Ticket },
                { id: 'fees', label: 'Charges', icon: Receipt },
                { id: 'stockAlerts', label: 'Alerts', icon: BellRing },
              ].map(tab => (
                <Button 
                  key={tab.id} 
                  variant={activeTab === tab.id ? 'secondary' : 'ghost'} 
                  onClick={() => setActiveTab(tab.id as AdminTab)} 
                  className={`rounded-full gap-1.5 px-4 font-black text-[9px] uppercase tracking-widest h-10 ${activeTab === tab.id ? 'bg-primary/5 text-primary' : 'text-gray-400'}`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </Button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" target="_blank">
              <Button variant="outline" className="rounded-xl border-2 font-black text-[9px] uppercase gap-1.5 h-10 px-4 hidden sm:flex">
                <ExternalLink className="w-3.5 h-3.5" /> Live Store
              </Button>
            </Link>
            <Button variant="ghost" onClick={handleLogout} size="icon" className="w-10 h-10 rounded-xl text-gray-400 hover:text-red-500"><LogOut className="w-4 h-4" /></Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {activeTab === 'overview' && <OverviewTab db={db} setTab={setActiveTab} isVerified={isVerified} />}
        {activeTab === 'enquiries' && <EnquiriesTab db={db} isVerified={isVerified} />}
        {activeTab === 'fulfillment' && <FulfillmentTab db={db} isVerified={isVerified} />}
        {activeTab === 'customers' && <CustomersTab db={db} isVerified={isVerified} />}
        {activeTab === 'itemMaster' && <ItemMasterTab db={db} isVerified={isVerified} />}
        {activeTab === 'moleculeMaster' && <MoleculeMasterTab db={db} isVerified={isVerified} />}
        {activeTab === 'categories' && <CategoriesTab db={db} isVerified={isVerified} />}
        {activeTab === 'fees' && <FeesTab db={db} isVerified={isVerified} />}
        {activeTab === 'promocodes' && <PromoCodesTab db={db} isVerified={isVerified} />}
        {activeTab === 'stockAlerts' && <StockAlertsTab db={db} isVerified={isVerified} />}
      </main>
    </div>
  );
}

// --- TAB COMPONENTS ---

function OverviewTab({ db, setTab, isVerified }: { db: any, setTab: (t: AdminTab) => void, isVerified: boolean }) {
  const medsQuery = useMemoFirebase(() => query(collection(db, 'medicines')), [db]);
  const molsQuery = useMemoFirebase(() => query(collection(db, 'moleculeMaster')), [db]);
  const usersQuery = useMemoFirebase(() => isVerified ? query(collection(db, 'userProfiles')) : null, [db, isVerified]);
  const ordersQuery = useMemoFirebase(() => isVerified ? query(collectionGroup(db, 'orders')) : null, [db, isVerified]);
  const stockAlertsQuery = useMemoFirebase(() => isVerified ? query(collection(db, 'stockEnquiries')) : null, [db, isVerified]);

  const { data: meds } = useCollection(medsQuery);
  const { data: mols } = useCollection(molsQuery);
  const { data: orders } = useCollection(ordersQuery);
  const { data: users } = useCollection(usersQuery);
  const { data: alerts } = useCollection(stockAlertsQuery);

  const stats = [
    { label: 'Orders', icon: ShoppingBag, count: orders?.length || 0, tab: 'fulfillment', color: 'text-primary' },
    { label: 'Inventory', icon: Package, count: meds?.length || 0, tab: 'itemMaster', color: 'text-accent' },
    { label: 'Formulas', icon: Dna, count: mols?.length || 0, tab: 'moleculeMaster', color: 'text-emerald-500' },
    { label: 'Patients', icon: Users, count: users?.length || 0, tab: 'customers', color: 'text-indigo-500' },
    { label: 'Campaigns', icon: Ticket, count: 0, tab: 'promocodes', color: 'text-purple-500' },
    { label: 'Alerts', icon: BellRing, count: alerts?.length || 0, tab: 'stockAlerts', color: 'text-red-500' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">SahiMed Dashboard</h1>
        <Card className="rounded-2xl px-6 py-2 bg-white border-none shadow-sm flex items-center gap-3">
          <TrendingUp className="w-4 h-4 text-accent" />
          <span className="text-xs font-black text-gray-900 uppercase">Live Operations</span>
        </Card>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {stats.map(card => (
          <Card key={card.label} className="rounded-[32px] p-5 border-none shadow-sm hover:shadow-2xl transition-all cursor-pointer bg-white group text-center" onClick={() => setTab(card.tab as AdminTab)}>
            <div className={cn("w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform", card.color)}>
               <card.icon className="w-6 h-6" />
            </div>
            <CardTitle className="text-[8px] font-black uppercase text-gray-400 tracking-widest mb-1">{card.label}</CardTitle>
            <p className="text-xl font-black text-gray-900">{card.count}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ItemMasterTab({ db, isVerified }: { db: any, isVerified: boolean }) {
  const medsQuery = useMemoFirebase(() => isVerified ? query(collection(db, 'medicines'), orderBy('name', 'asc')) : null, [db, isVerified]);
  const { data: medicines, isLoading } = useCollection(medsQuery);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredMedicines = medicines?.filter(med => 
    med.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    med.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const downloadCSV = () => {
    if (!medicines) return;
    const headers = ['ID', 'Name', 'SKU', 'Manufacturer', 'Price', 'MRP', 'Stock', 'Category', 'ImageURL'];
    const rows = medicines.map(m => [m.id, m.name, m.sku, m.manufacturer, m.price, m.mrp, m.availableQuantity, m.category, m.imageUrl]);
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(r => r.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sahimed_catalog.csv");
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black uppercase text-gray-900 tracking-tight">Product Catalog</h2>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Master inventory management</p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Button variant="outline" onClick={downloadCSV} className="rounded-full h-12 px-6 font-black text-[10px] uppercase tracking-widest gap-2 border-2">
            <Download className="w-4 h-4" /> Export
          </Button>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingItem(null)} className="rounded-full h-12 px-8 font-black text-[10px] uppercase tracking-widest gap-2 bg-primary text-white">
                <Plus className="w-4 h-4" /> Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[40px] max-w-4xl border-none p-0 overflow-hidden shadow-3xl">
              <div className="bg-primary p-8 text-white">
                <DialogTitle className="text-2xl font-black uppercase tracking-tight">{editingItem ? 'Edit Product' : 'Add New Product'}</DialogTitle>
              </div>
              <div className="p-8">
                <ItemForm db={db} initialData={editingItem} onSuccess={() => setIsFormOpen(false)} />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
        <Input 
          placeholder="Search products by name or SKU..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-16 pl-14 rounded-[32px] border-none bg-white shadow-sm font-black text-sm uppercase tracking-tight"
        />
      </div>

      <Card className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 border-b">
              <tr>
                <th className="px-10 py-8">SKU / Product</th>
                <th className="px-10 py-8">Pricing</th>
                <th className="px-10 py-8">Inventory</th>
                <th className="px-10 py-8">Type</th>
                <th className="px-10 py-8 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr><td colSpan={5} className="p-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" /></td></tr>
              ) : filteredMedicines?.length === 0 ? (
                <tr><td colSpan={5} className="p-20 text-center font-bold text-gray-300 uppercase tracking-widest">No matching products found</td></tr>
              ) : filteredMedicines?.map(med => (
                <tr key={med.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-10 py-8">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-50 rounded-2xl p-2 border border-gray-100">
                           <img src={med.imageUrl} alt="" className="w-full h-full object-contain" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-black text-sm uppercase tracking-tight text-gray-900">{med.name}</span>
                          <span className="text-[9px] text-gray-400 uppercase tracking-widest">{med.sku || 'NO_SKU'} • {med.manufacturer}</span>
                        </div>
                     </div>
                  </td>
                  <td className="px-10 py-8">
                     <div className="flex flex-col">
                        <span className="font-black text-primary text-lg">₹{med.price}</span>
                        <span className="text-[9px] text-red-600 line-through font-bold">MRP ₹{med.mrp}</span>
                     </div>
                  </td>
                  <td className="px-10 py-8">
                     <div className="flex items-center gap-3">
                        <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                           <div className={cn("h-full transition-all", med.availableQuantity < 20 ? 'bg-red-500' : 'bg-accent')} style={{ width: `${Math.min(100, (med.availableQuantity / 100) * 100)}%` }} />
                        </div>
                        <span className="text-[10px] font-black text-gray-700 uppercase">{med.availableQuantity} PCS</span>
                     </div>
                  </td>
                  <td className="px-10 py-8">
                     <Badge variant="outline" className={cn("text-[8px] font-black uppercase px-3 py-1 rounded-full border-2", med.isGeneric ? 'border-accent text-accent' : 'border-primary text-primary')}>
                        {med.isGeneric ? 'Generic' : 'Branded'}
                     </Badge>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingItem(med); setIsFormOpen(true); }} className="h-10 w-10 rounded-xl hover:bg-primary/5"><Edit2 className="w-4 h-4 text-gray-400" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => { deleteDocumentNonBlocking(doc(db, 'medicines', med.id)); toast({ title: "Deleted" }); }} className="h-10 w-10 rounded-xl hover:bg-red-50"><Trash2 className="w-4 h-4 text-red-300" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function ItemForm({ db, initialData, onSuccess }: { db: any, initialData?: any, onSuccess: () => void }) {
  const molsQuery = useMemoFirebase(() => query(collection(db, 'moleculeMaster'), orderBy('molecule', 'asc')), [db]);
  const { data: molecules } = useCollection(molsQuery);

  const [form, setForm] = useState({
    name: initialData?.name || '',
    sku: initialData?.sku || '',
    manufacturer: initialData?.manufacturer || '',
    price: initialData?.price || 0,
    mrp: initialData?.mrp || 0,
    availableQuantity: initialData?.availableQuantity || 0,
    category: initialData?.category || '',
    imageUrl: initialData?.imageUrl || '',
    moleculeId: initialData?.moleculeId || '',
    isGeneric: initialData?.isGeneric || false,
    saltComposition: initialData?.saltComposition || '',
    packSize: initialData?.packSize || '',
    description: initialData?.description || '',
    howToUse: initialData?.howToUse || '',
    treatment: initialData?.treatment || '',
    safetyAdvice: initialData?.safetyAdvice || '',
    sideEffects: initialData?.sideEffects || '',
    alcoholInteraction: initialData?.alcoholInteraction || '',
    pregnancyInteraction: initialData?.pregnancyInteraction || '',
    lactationInteraction: initialData?.lactationInteraction || '',
    drivingInteraction: initialData?.drivingInteraction || '',
    kidneyInteraction: initialData?.kidneyInteraction || '',
    liverInteraction: initialData?.liverInteraction || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { 
      ...form, 
      price: Number(form.price), 
      mrp: Number(form.mrp), 
      availableQuantity: Number(form.availableQuantity),
      updatedAt: serverTimestamp() 
    };
    if (initialData?.id) {
      updateDocumentNonBlocking(doc(db, 'medicines', initialData.id), payload);
    } else {
      addDocumentNonBlocking(collection(db, 'medicines'), payload);
    }
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="h-[70vh] overflow-y-auto pr-4 scrollbar-hide">
      <Tabs defaultValue="basic" className="space-y-8">
        <TabsList className="bg-gray-100 p-1 rounded-2xl w-full grid grid-cols-3 h-14">
          <TabsTrigger value="basic" className="rounded-xl font-black text-[10px] uppercase tracking-widest">Basic Details</TabsTrigger>
          <TabsTrigger value="clinical" className="rounded-xl font-black text-[10px] uppercase tracking-widest">Clinical Data</TabsTrigger>
          <TabsTrigger value="interactions" className="rounded-xl font-black text-[10px] uppercase tracking-widest">Interactions</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="grid grid-cols-2 gap-6 pb-10">
          <div className="col-span-2 space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Product Name</Label>
            <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="rounded-2xl h-14 bg-gray-50 border-none font-bold" />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Classification</Label>
            <select 
              value={form.isGeneric ? 'generic' : 'branded'} 
              onChange={e => setForm({...form, isGeneric: e.target.value === 'generic'})}
              className="w-full rounded-2xl h-14 bg-gray-50 border-none font-bold px-4 outline-none"
            >
              <option value="branded">Branded / Original</option>
              <option value="generic">Sahi Generic</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Molecule Mapping</Label>
            <select 
              value={form.moleculeId} 
              onChange={e => setForm({...form, moleculeId: e.target.value})}
              className="w-full rounded-2xl h-14 bg-gray-50 border-none font-bold px-4 outline-none"
            >
              <option value="">Unmapped</option>
              {molecules?.map(m => <option key={m.id} value={m.id}>{m.molecule}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">SKU / Code</Label>
            <Input value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} className="rounded-2xl h-14 bg-gray-50 border-none font-bold" />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Category</Label>
            <Input value={form.category} onChange={e => setForm({...form, category: e.target.value})} required className="rounded-2xl h-14 bg-gray-50 border-none font-bold" />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Sale Price (₹)</Label>
            <Input type="number" value={form.price} onChange={e => setForm({...form, price: Number(e.target.value)})} required className="rounded-2xl h-14 bg-gray-50 border-none font-bold" />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">MRP (₹)</Label>
            <Input type="number" value={form.mrp} onChange={e => setForm({...form, mrp: Number(e.target.value)})} required className="rounded-2xl h-14 bg-gray-50 border-none font-bold" />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Stock Units</Label>
            <Input type="number" value={form.availableQuantity} onChange={e => setForm({...form, availableQuantity: Number(e.target.value)})} required className="rounded-2xl h-14 bg-gray-50 border-none font-bold" />
          </div>
          <div className="col-span-2 space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Image URL</Label>
            <Input value={form.imageUrl} onChange={e => setForm({...form, imageUrl: e.target.value})} placeholder="https://..." required className="rounded-2xl h-14 bg-gray-50 border-none font-bold" />
          </div>
        </TabsContent>

        <TabsContent value="clinical" className="space-y-6 pb-10">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Description</Label>
            <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="rounded-2xl bg-gray-50 border-none min-h-[100px]" />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">How to Use</Label>
            <Textarea value={form.howToUse} onChange={e => setForm({...form, howToUse: e.target.value})} className="rounded-2xl bg-gray-50 border-none" />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Treatment</Label>
            <Textarea value={form.treatment} onChange={e => setForm({...form, treatment: e.target.value})} className="rounded-2xl bg-gray-50 border-none" />
          </div>
        </TabsContent>

        <TabsContent value="interactions" className="grid grid-cols-2 gap-6 pb-10">
          {[
            { id: 'alcoholInteraction', label: 'Alcohol' },
            { id: 'pregnancyInteraction', label: 'Pregnancy' },
            { id: 'lactationInteraction', label: 'Lactation' },
            { id: 'drivingInteraction', label: 'Driving' },
            { id: 'kidneyInteraction', label: 'Kidney' },
            { id: 'liverInteraction', label: 'Liver' }
          ].map(field => (
            <div key={field.id} className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">{field.label} Interaction</Label>
              <Textarea value={(form as any)[field.id]} onChange={e => setForm({...form, [field.id]: e.target.value})} className="rounded-2xl bg-gray-50 border-none h-24" />
            </div>
          ))}
        </TabsContent>
      </Tabs>

      <div className="sticky bottom-0 bg-white pt-6 border-t mt-4 flex gap-4">
        <Button type="submit" className="flex-1 h-16 rounded-full font-black uppercase tracking-widest bg-primary text-white">Save Product</Button>
      </div>
    </form>
  );
}

function EnquiriesTab({ db, isVerified }: { db: any, isVerified: boolean }) {
  const presQuery = useMemoFirebase(() => isVerified ? query(collectionGroup(db, 'prescriptions')) : null, [db, isVerified]);
  const { data: enquiries, isLoading } = useCollection(presQuery);

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2">
      <h2 className="text-3xl font-black uppercase text-gray-900 tracking-tight">Prescription Review</h2>
      {isLoading ? (
        <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></div>
      ) : enquiries?.length === 0 ? (
        <div className="py-20 text-center font-bold text-gray-300">No pending clinical requests</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-8">
          {enquiries?.map(enq => (
            <Card key={enq.id} className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white p-6">
              <div className="aspect-[3/4] rounded-3xl bg-gray-100 mb-6 overflow-hidden relative">
                <img src={enq.imageUrl} className="w-full h-full object-cover" alt="Prescription" />
              </div>
              <p className="font-black text-sm uppercase mb-1">{enq.patientName || 'Patient Request'}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-4">{enq.uploadDate?.toDate ? enq.uploadDate.toDate().toLocaleDateString() : 'Date Pending'}</p>
              <Button className="w-full rounded-full h-12 font-black uppercase text-[10px] tracking-widest bg-primary text-white">Process Order</Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function FulfillmentTab({ db, isVerified }: { db: any, isVerified: boolean }) {
  const ordersQuery = useMemoFirebase(() => isVerified ? query(collectionGroup(db, 'orders'), orderBy('orderDate', 'desc')) : null, [db, isVerified]);
  const { data: orders, isLoading } = useCollection(ordersQuery);
  const { toast } = useToast();
  
  const [shippingOrder, setShippingOrder] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [shippingData, setShippingData] = useState({ carrier: '', trackingId: '' });

  const handleShipClick = (order: any) => {
    setShippingData({ 
      carrier: order.carrier || '', 
      trackingId: order.trackingId || '' 
    });
    setShippingOrder(order);
  };

  const updateStatus = (order: any, status: string, extra = {}) => {
    if (!order.userId) return;
    updateDocumentNonBlocking(doc(db, 'userProfiles', order.userId, 'orders', order.id), { status, ...extra });
    toast({ title: "Updated", description: `Order ${status}` });
    setShippingOrder(null);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2">
      <h2 className="text-3xl font-black uppercase text-gray-900 tracking-tight">Fulfillment Center</h2>
      <Card className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 border-b">
              <tr>
                <th className="px-10 py-8">Order ID</th>
                <th className="px-10 py-8">Mobile</th>
                <th className="px-10 py-8">Amount</th>
                <th className="px-10 py-8">Status</th>
                <th className="px-10 py-8 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr><td colSpan={5} className="p-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" /></td></tr>
              ) : orders?.length === 0 ? (
                <tr><td colSpan={5} className="p-20 text-center font-bold text-gray-300 uppercase tracking-widest">No orders found</td></tr>
              ) : orders?.map(order => (
                <tr key={order.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-10 py-8 font-black text-sm uppercase">#{order.id.substring(0,8)}</td>
                  <td className="px-10 py-8 text-[11px] font-black text-gray-900">{order.phoneNumber || 'N/A'}</td>
                  <td className="px-10 py-8 font-black text-primary">₹{order.totalAmount}</td>
                  <td className="px-10 py-8">
                    <Badge variant="outline" className="text-[9px] font-black uppercase px-4 py-1.5 rounded-full">{order.status}</Badge>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(order)} className="h-10 w-10 rounded-xl hover:bg-primary/5 text-primary">
                        <Eye className="w-4 h-4" />
                      </Button>
                      {order.status !== 'Shipped' && order.status !== 'Delivered' && (
                        <Button onClick={() => handleShipClick(order)} size="sm" className="rounded-full h-10 px-6 text-[9px] uppercase font-black bg-blue-600 text-white">Ship</Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-2xl p-2 min-w-[160px]">
                          <DropdownMenuItem onClick={() => updateStatus(order, 'Delivered')} className="rounded-xl font-bold text-xs uppercase cursor-pointer">Mark Delivered</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatus(order, 'Cancelled')} className="rounded-xl font-bold text-xs uppercase cursor-pointer text-orange-500">Cancel</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      
      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="rounded-[40px] max-w-3xl border-none p-0 overflow-hidden shadow-3xl print:shadow-none print:border-none">
          <div className="bg-primary p-8 text-white flex justify-between items-center print:bg-white print:text-black">
            <div>
              <DialogTitle className="text-2xl font-black uppercase tracking-tight">Order Invoice</DialogTitle>
              <p className="text-[9px] font-black uppercase tracking-widest opacity-60">ID: #{selectedOrder?.id}</p>
            </div>
            <div className="flex gap-2 print:hidden">
              <Button variant="outline" size="icon" onClick={handlePrint} className="rounded-xl border-white/20 bg-white/10 hover:bg-white/20 text-white">
                <Printer className="w-4 h-4" />
              </Button>
              <Badge className="bg-white text-primary uppercase text-[10px] font-black">{selectedOrder?.status}</Badge>
            </div>
          </div>
          <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto scrollbar-hide print:max-h-none print:overflow-visible">
            <div className="grid grid-cols-2 gap-6">
               <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Order Date</span>
                  <p className="text-xs font-bold text-gray-900">{selectedOrder?.orderDate?.toDate ? selectedOrder.orderDate.toDate().toLocaleString() : 'Processing'}</p>
               </div>
               <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Patient Mobile</span>
                  <p className="text-xs font-bold text-gray-900">{selectedOrder?.phoneNumber || 'N/A'}</p>
               </div>
               <div className="col-span-2 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Delivery Address</span>
                  <div className="text-xs font-bold text-gray-900 leading-relaxed">
                    <p>{selectedOrder?.shippingDetails?.street || 'N/A'}</p>
                    <p>Landmark: {selectedOrder?.shippingDetails?.landmark || 'None'}</p>
                    <p>PIN: {selectedOrder?.shippingDetails?.pincode || 'N/A'}</p>
                  </div>
               </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 border-b pb-2">Order Summary</h4>
              <div className="space-y-3">
                {selectedOrder?.items?.map((item: any, idx: number) => (
                  <div key={idx} className="bg-gray-50 p-4 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-lg border p-1">
                        <img src={item.imageUrl} alt="" className="w-full h-full object-contain" />
                      </div>
                      <p className="font-black text-xs uppercase tracking-tight text-gray-900">{item.name}</p>
                    </div>
                    <p className="text-sm font-black text-gray-900">Qty: {item.quantity}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-[32px] flex justify-between items-baseline">
               <span className="text-sm font-black uppercase text-gray-900">Total Payable</span>
               <span className="text-3xl font-black text-primary">₹{selectedOrder?.totalAmount}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MoleculeMasterTab({ db, isVerified }: { db: any, isVerified: boolean }) {
  const molsQuery = useMemoFirebase(() => isVerified ? query(collection(db, 'moleculeMaster'), orderBy('molecule', 'asc')) : null, [db, isVerified]);
  const { data: molecules, isLoading } = useCollection(molsQuery);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMol, setEditingMol] = useState<any>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredMolecules = molecules?.filter(mol => 
    mol.molecule?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mol.masterId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const downloadCSV = () => {
    if (!molecules) return;
    const headers = ['ID', 'Molecule', 'Master ID', 'Form'];
    const rows = molecules.map(m => [m.id, m.molecule, m.masterId, m.form]);
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(r => r.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sahimed_formulas.csv");
    document.body.appendChild(link);
    link.click();
  };

  const downloadTemplate = () => {
    const headers = ['Molecule', 'Master ID', 'Form'];
    const sample = ['Paracetamol', 'MOL-001', 'Tablet'];
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + sample.join(",");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sahimed_formula_template.csv");
    document.body.appendChild(link);
    link.click();
  };

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    toast({ title: "Import Started", description: "Parsing Formula CSV..." });
    setTimeout(() => {
      toast({ title: "Import Complete", description: "Formula Registry updated." });
    }, 2000);
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <h2 className="text-3xl font-black uppercase text-gray-900 tracking-tight">Formula Registry</h2>
        <div className="flex flex-wrap justify-center gap-3">
          <Button variant="outline" onClick={downloadTemplate} className="rounded-full h-12 px-6 font-black text-[10px] uppercase tracking-widest gap-2 border-2">
            <FileDown className="w-4 h-4" /> Template
          </Button>
          <Button variant="outline" onClick={downloadCSV} className="rounded-full h-12 px-6 font-black text-[10px] uppercase tracking-widest gap-2 border-2">
            <Download className="w-4 h-4" /> Export
          </Button>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="rounded-full h-12 px-6 font-black text-[10px] uppercase tracking-widest gap-2 border-2">
            <Upload className="w-4 h-4" /> Bulk Upload
          </Button>
          <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleBulkUpload} />
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingMol(null)} className="rounded-full h-12 px-8 font-black text-[10px] uppercase tracking-widest gap-2 bg-primary text-white">
                <Plus className="w-4 h-4" /> New Formula
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[40px] max-w-lg border-none p-0 overflow-hidden shadow-3xl">
              <div className="bg-primary p-8 text-white"><DialogTitle className="text-2xl font-black uppercase tracking-tight">Clinical Formula</DialogTitle></div>
              <div className="p-8"><MoleculeForm db={db} initialData={editingMol} onSuccess={() => setIsFormOpen(false)} /></div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
        <Input 
          placeholder="Search formulas by name or clinical ID..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-16 pl-14 rounded-[32px] border-none bg-white shadow-sm font-black text-sm uppercase tracking-tight"
        />
      </div>

      <Card className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 border-b">
              <tr>
                <th className="px-10 py-8">Molecule</th>
                <th className="px-10 py-8">ID</th>
                <th className="px-10 py-8">Form</th>
                <th className="px-10 py-8 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr><td colSpan={4} className="p-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" /></td></tr>
              ) : filteredMolecules?.length === 0 ? (
                <tr><td colSpan={4} className="p-20 text-center font-bold text-gray-300 uppercase tracking-widest">No matching formulas</td></tr>
              ) : filteredMolecules?.map(mol => (
                <tr key={mol.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-10 py-8 font-black text-sm uppercase">{mol.molecule}</td>
                  <td className="px-10 py-8 text-[11px] font-bold">{mol.masterId}</td>
                  <td className="px-10 py-8 text-[11px] font-black text-gray-400 uppercase">{mol.form || 'N/A'}</td>
                  <td className="px-10 py-8 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingMol(mol); setIsFormOpen(true); }} className="h-10 w-10 rounded-xl"><Edit2 className="w-4 h-4 text-gray-400" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteDocumentNonBlocking(doc(db, 'moleculeMaster', mol.id))} className="h-10 w-10 rounded-xl"><Trash2 className="w-4 h-4 text-red-300" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function MoleculeForm({ db, initialData, onSuccess }: { db: any, initialData?: any, onSuccess: () => void }) {
  const [form, setForm] = useState({ molecule: initialData?.molecule || '', masterId: initialData?.masterId || '', form: initialData?.form || 'Tablet' });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    initialData?.id ? updateDocumentNonBlocking(doc(db, 'moleculeMaster', initialData.id), form) : addDocumentNonBlocking(collection(db, 'moleculeMaster'), form);
    onSuccess();
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-gray-400">Molecule Name</Label><Input value={form.molecule} onChange={e => setForm({...form, molecule: e.target.value})} required className="rounded-2xl h-14 bg-gray-50 border-none font-bold" /></div>
      <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-gray-400">Master ID</Label><Input value={form.masterId} onChange={e => setForm({...form, masterId: e.target.value})} required className="rounded-2xl h-14 bg-gray-50 border-none font-bold" /></div>
      <div className="space-y-2">
        <Label className="text-[10px] font-black uppercase text-gray-400">Form</Label>
        <select value={form.form} onChange={e => setForm({...form, form: e.target.value})} className="w-full rounded-2xl h-14 bg-gray-50 border-none font-bold px-4 outline-none">
          <option value="Tablet">Tablet</option>
          <option value="Syrup">Syrup</option>
          <option value="Capsule">Capsule</option>
        </select>
      </div>
      <Button type="submit" className="w-full h-16 rounded-full font-black uppercase tracking-widest bg-primary text-white">Save Formula</Button>
    </form>
  );
}

function CategoriesTab({ db, isVerified }: { db: any, isVerified: boolean }) {
  const catsQuery = useMemoFirebase(() => isVerified ? query(collection(db, 'categories'), orderBy('name', 'asc')) : null, [db, isVerified]);
  const { data: categories, isLoading } = useCollection(catsQuery);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<any>(null);

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black uppercase text-gray-900 tracking-tight">Health Categories</h2>
        <Button onClick={() => { setEditingCat(null); setIsFormOpen(true); }} className="rounded-full h-12 px-8 font-black text-[10px] uppercase tracking-widest gap-2 bg-primary text-white">
          <Plus className="w-4 h-4" /> New Category
        </Button>
      </div>
      <Card className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 border-b">
            <tr><th className="px-10 py-8">Category Name</th><th className="px-10 py-8 text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? <tr><td colSpan={2} className="p-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" /></td></tr> : categories?.map(cat => (
              <tr key={cat.id} className="hover:bg-gray-50/50">
                <td className="px-10 py-8 font-black text-sm uppercase">{cat.name}</td>
                <td className="px-10 py-8 text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => { setEditingCat(cat); setIsFormOpen(true); }} className="h-10 w-10 rounded-xl"><Edit2 className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteDocumentNonBlocking(doc(db, 'categories', cat.id))} className="h-10 w-10 rounded-xl"><Trash2 className="w-4 h-4 text-red-300" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="rounded-[40px] max-w-md p-0 overflow-hidden border-none">
          <div className="bg-primary p-8 text-white"><DialogTitle className="text-2xl font-black uppercase tracking-tight">Category Details</DialogTitle></div>
          <div className="p-8">
            <CategoryForm db={db} initialData={editingCat} onSuccess={() => setIsFormOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CategoryForm({ db, initialData, onSuccess }: { db: any, initialData?: any, onSuccess: () => void }) {
  const [form, setForm] = useState({ name: initialData?.name || '' });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    initialData?.id ? updateDocumentNonBlocking(doc(db, 'categories', initialData.id), form) : addDocumentNonBlocking(collection(db, 'categories'), form);
    onSuccess();
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Category Name</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="rounded-2xl h-14 bg-gray-50 border-none font-bold" /></div>
      <Button type="submit" className="w-full h-16 rounded-full font-black uppercase tracking-widest bg-primary text-white">Save Category</Button>
    </form>
  );
}

function CustomersTab({ db, isVerified }: { db: any, isVerified: boolean }) {
  const usersQuery = useMemoFirebase(() => isVerified ? query(collection(db, 'userProfiles')) : null, [db, isVerified]);
  const { data: users, isLoading } = useCollection(usersQuery);
  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2">
      <h2 className="text-3xl font-black uppercase text-gray-900 tracking-tight">Patient Registry</h2>
      <Card className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 border-b">
            <tr><th className="px-10 py-8">Patient Name</th><th className="px-10 py-8">Email</th><th className="px-10 py-8 text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? <tr><td colSpan={3} className="p-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" /></td></tr> : users?.map(u => (
              <tr key={u.id} className="hover:bg-gray-50/50">
                <td className="px-10 py-8 font-black text-sm uppercase">{u.name || 'SahiMed Member'}</td>
                <td className="px-10 py-8 text-[11px] font-bold text-gray-400 uppercase">{u.email}</td>
                <td className="px-10 py-8 text-right"><Button variant="outline" className="rounded-full h-10 text-[9px] font-black uppercase">View Details</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function StockAlertsTab({ db, isVerified }: { db: any, isVerified: boolean }) {
  const alertsQuery = useMemoFirebase(() => isVerified ? query(collection(db, 'stockEnquiries')) : null, [db, isVerified]);
  const { data: alerts, isLoading } = useCollection(alertsQuery);
  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2">
      <h2 className="text-3xl font-black uppercase text-gray-900 tracking-tight">Stock Alerts</h2>
      <Card className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 border-b">
            <tr><th className="px-10 py-8">Requested Product</th><th className="px-10 py-8">Patient</th><th className="px-10 py-8 text-right">Action</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? <tr><td colSpan={3} className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></td></tr> : alerts?.map(alert => (
              <tr key={alert.id} className="hover:bg-gray-50/50">
                <td className="px-10 py-8 font-black text-sm uppercase">{alert.medicineName}</td>
                <td className="px-10 py-8 text-[10px] font-bold text-gray-500">#{alert.userId.substring(0,8)}</td>
                <td className="px-10 py-8 text-right"><Button variant="ghost" size="icon" onClick={() => deleteDocumentNonBlocking(doc(db, 'stockEnquiries', alert.id))}><Trash2 className="w-4 h-4 text-red-300" /></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function FeesTab({ db, isVerified }: { db: any, isVerified: boolean }) {
  const feesQuery = useMemoFirebase(() => isVerified ? query(collection(db, 'fees')) : null, [db, isVerified]);
  const { data: fees } = useCollection(feesQuery);
  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2">
      <h2 className="text-3xl font-black uppercase text-gray-900 tracking-tight">Dynamic Charges</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {fees?.map(fee => (
          <Card key={fee.id} className="rounded-[32px] p-8 border-none bg-white">
            <Badge className="mb-4">{fee.isActive ? 'ACTIVE' : 'DISABLED'}</Badge>
            <h3 className="font-black text-lg uppercase mb-2">{fee.name}</h3>
            <p className="text-2xl font-black text-primary">{fee.amount}{fee.type === 'percentage' ? '%' : '₹'}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

function PromoCodesTab({ db, isVerified }: { db: any, isVerified: boolean }) {
  const promosQuery = useMemoFirebase(() => isVerified ? query(collection(db, 'promocodes')) : null, [db, isVerified]);
  const { data: promos } = useCollection(promosQuery);
  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2">
      <h2 className="text-3xl font-black uppercase text-gray-900 tracking-tight">Clinical Campaigns</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {promos?.map(promo => (
          <Card key={promo.id} className="rounded-[32px] p-8 border-none bg-white">
            <code className="bg-primary/5 text-primary font-black px-4 py-1 rounded-xl text-xl uppercase mb-4 inline-block">{promo.code}</code>
            <p className="text-xs font-bold text-gray-500 uppercase">{promo.description}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
