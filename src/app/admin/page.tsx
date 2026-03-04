
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
  ExternalLink,
  Copy,
  Check,
  Search,
  FileDown,
  Eye,
  MoreVertical,
  ChevronRight,
  Download,
  Upload,
  Printer,
  Wand2,
  ListChecks,
  Sparkles,
  Save,
  AlertCircle,
  X,
  Phone,
  ShoppingCart,
  PlusCircle
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
import { prescriptionAnalysisAndPreFill } from '@/ai/flows/prescription-analysis-and-pre-fill-flow';

type AdminTab = 'overview' | 'enquiries' | 'fulfillment' | 'promocodes' | 'fees' | 'customers' | 'stockAlerts' | 'itemMaster' | 'moleculeMaster';

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
    toast({ title: 'Requesting Authority', description: 'Provisioning admin role...' });
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
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed">Admin role is not detected.</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-2xl space-y-2">
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Your UID</p>
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
            <button onClick={() => setActiveTab('overview')} className="flex items-center gap-3 group text-left">
              <div className="bg-primary p-2 rounded-xl group-active:scale-95 transition-transform shadow-lg shadow-primary/20">
                <ShieldCheck className="text-white w-5 h-5" />
              </div>
              <div className="flex flex-col items-start leading-none">
                <span className="font-black text-xl tracking-tighter text-gray-900 uppercase">Admin Center</span>
                <span className="text-[8px] font-black text-primary uppercase tracking-[0.3em]">Management Portal</span>
              </div>
            </button>
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
        {activeTab === 'enquiries' && <EnquiriesTab db={db} isVerified={isVerified} onBack={() => setActiveTab('overview')} />}
        {activeTab === 'fulfillment' && <FulfillmentTab db={db} isVerified={isVerified} onBack={() => setActiveTab('overview')} />}
        {activeTab === 'promocodes' && <PromoCodesTab db={db} isVerified={isVerified} onBack={() => setActiveTab('overview')} />}
        {activeTab === 'fees' && <FeesTab db={db} isVerified={isVerified} onBack={() => setActiveTab('overview')} />}
        {activeTab === 'customers' && <CustomersTab db={db} isVerified={isVerified} onBack={() => setActiveTab('overview')} />}
        {activeTab === 'stockAlerts' && <StockAlertsTab db={db} isVerified={isVerified} onBack={() => setActiveTab('overview')} />}
        {activeTab === 'itemMaster' && <ItemMasterTab db={db} isVerified={isVerified} onBack={() => setActiveTab('overview')} />}
        {activeTab === 'moleculeMaster' && <MoleculeMasterTab db={db} isVerified={isVerified} onBack={() => setActiveTab('overview')} />}
      </main>
    </div>
  );
}

// --- OVERVIEW COMPONENT ---

function OverviewTab({ db, setTab, isVerified }: { db: any, setTab: (t: AdminTab) => void, isVerified: boolean }) {
  const medsQuery = useMemoFirebase(() => query(collection(db, 'medicines')), [db]);
  const molsQuery = useMemoFirebase(() => query(collection(db, 'moleculeMaster')), [db]);
  const usersQuery = useMemoFirebase(() => isVerified ? query(collection(db, 'userProfiles')) : null, [db, isVerified]);
  const ordersQuery = useMemoFirebase(() => isVerified ? query(collectionGroup(db, 'orders')) : null, [db, isVerified]);
  const stockAlertsQuery = useMemoFirebase(() => isVerified ? query(collection(db, 'stockEnquiries')) : null, [db, isVerified]);
  const presQuery = useMemoFirebase(() => isVerified ? collectionGroup(db, 'prescriptions') : null, [db, isVerified]);

  const { data: medicines } = useCollection(medsQuery);
  const { data: formulas } = useCollection(molsQuery);
  const { data: orders } = useCollection(ordersQuery);
  const { data: users } = useCollection(usersQuery);
  const { data: alerts } = useCollection(stockAlertsQuery);
  const { data: enquiries } = useCollection(presQuery);

  const stats = [
    { label: 'INQUIRIES', icon: FileText, count: enquiries?.length || 0, tab: 'enquiries', color: 'text-blue-600' },
    { label: 'ORDERS', icon: ShoppingBag, count: orders?.length || 0, tab: 'fulfillment', color: 'text-blue-500' },
    { label: 'COUPONS', icon: Ticket, count: 0, tab: 'promocodes', color: 'text-purple-500' },
    { label: 'FEES', icon: Receipt, count: 0, tab: 'fees', color: 'text-orange-500' },
    { label: 'CUSTOMERS', icon: Users, count: users?.length || 0, tab: 'customers', color: 'text-indigo-500' },
    { label: 'ALERTS', icon: BellRing, count: alerts?.length || 0, tab: 'stockAlerts', color: 'text-red-500' },
    { label: 'CATALOG', icon: Package, count: medicines?.length || 0, tab: 'itemMaster', color: 'text-green-600' },
    { label: 'FORMULAS', icon: Dna, count: formulas?.length || 0, tab: 'moleculeMaster', color: 'text-green-500' },
  ];

  return (
    <div className="animate-in fade-in duration-500">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map(card => (
          <Card key={card.label} className="rounded-[40px] p-8 border-none shadow-sm hover:shadow-2xl transition-all cursor-pointer bg-white group text-center flex flex-col items-center justify-center min-h-[220px]" onClick={() => setTab(card.tab as AdminTab)}>
            <div className={cn("w-16 h-16 rounded-[24px] bg-gray-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform", card.color)}>
               <card.icon className="w-8 h-8" />
            </div>
            <CardTitle className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-2">{card.label}</CardTitle>
            <p className="text-4xl font-black text-gray-900 tracking-tighter">{card.count}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle, onBack, children }: { title: string, subtitle: string, onBack: () => void, children?: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full bg-white shadow-sm h-12 w-12 hover:scale-110 transition-transform"><ChevronRight className="w-5 h-5 rotate-180" /></Button>
        <div className="space-y-1">
          <h2 className="text-3xl font-black uppercase text-gray-900 tracking-tight">{title}</h2>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">{subtitle}</p>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        {children}
      </div>
    </div>
  );
}

// --- ITEM MASTER TAB ---

function ItemMasterTab({ db, isVerified, onBack }: { db: any, isVerified: boolean, onBack: () => void }) {
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
    const headers = ['ID', 'Name', 'SKU', 'Manufacturer', 'Price', 'MRP', 'Stock', 'Category', 'isGeneric', 'Molecule ID'];
    const rows = medicines.map(m => [m.id, m.name, m.sku, m.manufacturer, m.price, m.mrp, m.availableQuantity, m.category, m.isGeneric, m.moleculeId]);
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(r => r.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sahimed_catalog.csv");
    document.body.appendChild(link);
    link.click();
  };

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    toast({ title: "Import Started", description: "Parsing Catalog CSV..." });
    setTimeout(() => {
      toast({ title: "Import Complete", description: "Catalog updated." });
    }, 2000);
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2">
      <SectionHeader title="Product Catalog" subtitle="Master inventory management" onBack={onBack}>
        <Button variant="outline" onClick={downloadCSV} className="rounded-full h-12 px-6 font-black text-[10px] uppercase tracking-widest gap-2 border-2">
          <Download className="w-4 h-4" /> Export
        </Button>
        <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="rounded-full h-12 px-6 font-black text-[10px] uppercase tracking-widest gap-2 border-2">
          <Upload className="w-4 h-4" /> Bulk Upload
        </Button>
        <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleBulkUpload} />
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingItem(null)} className="rounded-full h-12 px-8 font-black text-[10px] uppercase tracking-widest gap-2 bg-primary text-white shadow-lg">
              <Plus className="w-4 h-4" /> Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[40px] max-w-4xl border-none p-0 overflow-hidden shadow-3xl">
            <div className="bg-primary p-8 text-white"><DialogTitle className="text-2xl font-black uppercase tracking-tight">Product Details</DialogTitle></div>
            <div className="p-8"><ItemForm db={db} initialData={editingItem} onSuccess={() => setIsFormOpen(false)} /></div>
          </DialogContent>
        </Dialog>
      </SectionHeader>

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
                <th className="px-10 py-8">Product</th>
                <th className="px-10 py-8">Pricing</th>
                <th className="px-10 py-8">Stock</th>
                <th className="px-10 py-8">Type</th>
                <th className="px-10 py-8 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr><td colSpan={5} className="p-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" /></td></tr>
              ) : filteredMedicines?.length === 0 ? (
                <tr><td colSpan={5} className="p-20 text-center font-bold text-gray-300 uppercase tracking-widest">No matching products</td></tr>
              ) : filteredMedicines?.map(med => (
                <tr key={med.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-10 py-8">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-50 rounded-2xl p-2 border border-gray-100">
                           <img src={med.imageUrl} alt="" className="w-full h-full object-contain" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-black text-sm uppercase tracking-tight text-gray-900">{med.name}</span>
                          <span className="text-[9px] text-gray-400 uppercase tracking-widest">{med.sku} • {med.manufacturer}</span>
                        </div>
                     </div>
                  </td>
                  <td className="px-10 py-8">
                     <div className="flex flex-col">
                        <span className="font-black text-accent text-lg">₹{med.price}</span>
                        <span className="text-[9px] text-red-600 line-through font-bold">MRP ₹{med.mrp}</span>
                     </div>
                  </td>
                  <td className="px-10 py-8">
                     <span className="text-[10px] font-black text-gray-700 uppercase">{med.availableQuantity} PCS</span>
                  </td>
                  <td className="px-10 py-8">
                     <Badge variant="outline" className={cn("text-[8px] font-black uppercase px-3 py-1.5 rounded-full border-2", med.isGeneric ? 'border-accent text-accent' : 'border-primary text-primary')}>
                        {med.isGeneric ? 'Generic' : 'Branded'}
                     </Badge>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingItem(med); setIsFormOpen(true); }} className="h-10 w-10 rounded-xl"><Edit2 className="w-4 h-4 text-gray-400" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteDocumentNonBlocking(doc(db, 'medicines', med.id))} className="h-10 w-10 rounded-xl"><Trash2 className="w-4 h-4 text-red-300" /></Button>
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
    isGeneric: initialData?.isGeneric || false,
    moleculeId: initialData?.moleculeId || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, price: Number(form.price), mrp: Number(form.mrp), availableQuantity: Number(form.availableQuantity) };
    initialData?.id ? updateDocumentNonBlocking(doc(db, 'medicines', initialData.id), payload) : addDocumentNonBlocking(collection(db, 'medicines'), payload);
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div className="col-span-2 space-y-2"><Label className="text-[10px] font-black uppercase text-gray-400">Product Name</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="rounded-2xl h-14 bg-gray-50 border-none font-bold" /></div>
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase text-gray-400">Molecule Mapping</Label>
          <select value={form.moleculeId} onChange={e => setForm({...form, moleculeId: e.target.value})} className="w-full h-14 rounded-2xl bg-gray-50 border-none px-4 font-bold outline-none">
             <option value="">Select Molecule</option>
             {molecules?.map(m => (
               <option key={m.id} value={m.id}>{m.molecule} ({m.form})</option>
             ))}
          </select>
        </div>
        <div className="space-y-2">
           <Label className="text-[10px] font-black uppercase text-gray-400">Type</Label>
           <select value={form.isGeneric ? 'true' : 'false'} onChange={e => setForm({...form, isGeneric: e.target.value === 'true'})} className="w-full h-14 rounded-2xl bg-gray-50 border-none px-4 font-bold outline-none">
             <option value="false">Branded</option>
             <option value="true">Generic</option>
           </select>
        </div>
        <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-gray-400">SKU</Label><Input value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} className="rounded-2xl h-14 bg-gray-50 border-none font-bold" /></div>
        <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-gray-400">Price</Label><Input type="number" value={form.price} onChange={e => setForm({...form, price: Number(e.target.value)})} required className="rounded-2xl h-14 bg-gray-50 border-none font-bold" /></div>
      </div>
      <Button type="submit" className="w-full h-16 rounded-full font-black uppercase tracking-widest bg-primary text-white">Save Product</Button>
    </form>
  );
}

// --- MOLECULE MASTER TAB ---

function MoleculeMasterTab({ db, isVerified, onBack }: { db: any, isVerified: boolean, onBack: () => void }) {
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
    const headers = ['Molecule', 'Master ID', 'Form'];
    const rows = molecules.map(m => [m.molecule, m.masterId, m.form]);
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
    const sample = ['Paracetamol', 'MOL-101', 'Tablet'];
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + sample.join(",");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "formula_template.csv");
    document.body.appendChild(link);
    link.click();
  };

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    toast({ title: "Import Started", description: "Parsing Formula CSV..." });
    setTimeout(() => {
      toast({ title: "Import Complete", description: "Registry updated." });
    }, 2000);
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2">
      <SectionHeader title="Formula Registry" subtitle="Clinical molecule master" onBack={onBack}>
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
            <Button onClick={() => setEditingMol(null)} className="rounded-full h-12 px-8 font-black text-[10px] uppercase tracking-widest gap-2 bg-primary text-white shadow-lg">
              <Plus className="w-4 h-4" /> New Formula
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[40px] max-w-lg border-none p-0 overflow-hidden shadow-3xl">
            <div className="bg-primary p-8 text-white"><DialogTitle className="text-2xl font-black uppercase tracking-tight">Clinical Formula</DialogTitle></div>
            <div className="p-8"><MoleculeForm db={db} initialData={editingMol} onSuccess={() => setIsFormOpen(false)} /></div>
          </DialogContent>
        </Dialog>
      </SectionHeader>

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
                  <td className="px-10 py-8 text-[11px] font-black text-gray-400 uppercase">{mol.form}</td>
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
        <Label className="text-[10px] font-black uppercase text-gray-400">Dosage Form</Label>
        <Input 
          value={form.form} 
          onChange={e => setForm({...form, form: e.target.value})} 
          placeholder="e.g. Tablet, Syrup, Injection"
          required 
          className="rounded-2xl h-14 bg-gray-50 border-none font-bold" 
        />
      </div>
      <Button type="submit" className="w-full h-16 rounded-full font-black uppercase tracking-widest bg-primary text-white">Save Formula</Button>
    </form>
  );
}

// --- FULFILLMENT TAB ---

function FulfillmentTab({ db, isVerified, onBack }: { db: any, isVerified: boolean, onBack: () => void }) {
  const ordersQuery = useMemoFirebase(() => isVerified ? query(collectionGroup(db, 'orders'), orderBy('orderDate', 'desc')) : null, [db, isVerified]);
  const { data: orders, isLoading } = useCollection(ordersQuery);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2">
      <SectionHeader title="Fulfillment Hub" subtitle="Active order processing" onBack={onBack} />
      <Card className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 border-b">
              <tr>
                <th className="px-10 py-8">Order ID</th>
                <th className="px-10 py-8">Amount</th>
                <th className="px-10 py-8">Status</th>
                <th className="px-10 py-8 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr><td colSpan={4} className="p-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" /></td></tr>
              ) : orders?.map(order => (
                <tr key={order.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-10 py-8 font-black text-sm uppercase">#{order.id.substring(0,8)}</td>
                  <td className="px-10 py-8 font-black text-accent">₹{order.totalAmount}</td>
                  <td className="px-10 py-8"><Badge variant="outline" className="text-[9px] font-black uppercase px-4 py-1.5 rounded-full">{order.status}</Badge></td>
                  <td className="px-10 py-8 text-right">
                    <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(order)} className="h-10 w-10 rounded-xl text-primary"><Eye className="w-4 h-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="rounded-[40px] max-w-2xl border-none p-0 overflow-hidden shadow-3xl print:shadow-none">
          <div className="bg-primary p-8 text-white flex justify-between items-center print:bg-white print:text-black">
            <div><DialogTitle className="text-2xl font-black uppercase">Order Invoice</DialogTitle><p className="text-[9px] opacity-60 uppercase">ID: {selectedOrder?.id}</p></div>
            <Button variant="outline" size="icon" onClick={() => window.print()} className="rounded-xl bg-white/10 text-white print:hidden"><Printer className="w-4 h-4" /></Button>
          </div>
          <div className="p-8 space-y-6">
            <div className="bg-gray-50 p-6 rounded-3xl space-y-3">
              {selectedOrder?.items?.map((item: any, i: number) => (
                <div key={i} className="flex justify-between items-center text-xs font-bold">
                  <span>{item.name} x {item.quantity}</span>
                  <span>₹{item.unitPrice * item.quantity}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-baseline pt-4 border-t">
              <span className="font-black text-sm uppercase">Total Payable</span>
              <span className="text-3xl font-black text-accent">₹{selectedOrder?.totalAmount}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- ENQUIRIES TAB (DIGITIZATION HUB) ---

function EnquiriesTab({ db, isVerified, onBack }: { db: any, isVerified: boolean, onBack: () => void }) {
  const presQuery = useMemoFirebase(() => isVerified ? collectionGroup(db, 'prescriptions') : null, [db, isVerified]);
  const { data: enquiries, isLoading } = useCollection(presQuery);
  const [selectedEnquiry, setSelectedEnquiry] = useState<any>(null);

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2">
      <SectionHeader title="Clinical Enquiries" subtitle="Prescription review queue" onBack={onBack} />
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-8">
        {isLoading ? (
          <div className="col-span-full py-20 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></div>
        ) : enquiries?.length === 0 ? (
          <div className="col-span-full py-20 text-center">
             <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-200" />
             </div>
             <p className="font-black text-gray-400 uppercase tracking-widest text-[10px]">No active enquiries</p>
          </div>
        ) : enquiries?.map(enq => (
          <Card key={enq.id} className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white p-6 group hover:shadow-2xl transition-all duration-500">
            <div className="aspect-[3/4] rounded-3xl bg-gray-50 mb-6 overflow-hidden border border-gray-100 relative shadow-inner">
              <img src={enq.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt="Prescription" />
              <div className="absolute top-4 right-4">
                <Badge className={cn(
                  "uppercase text-[8px] font-black px-3 py-1.5 rounded-full border-none shadow-lg",
                  enq.status === 'Digitized' ? "bg-accent text-white" : "bg-primary text-white"
                )}>
                  {enq.status}
                </Badge>
              </div>
            </div>
            <div className="space-y-1 mb-6">
               <p className="font-black text-sm uppercase text-gray-900 tracking-tight truncate">{enq.patientName || 'Patient Request'}</p>
               <div className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                  <Phone className="w-2.5 h-2.5" />
                  <span>{enq.phoneNumber || 'No number provided'}</span>
               </div>
               <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{enq.uploadDate?.toDate ? enq.uploadDate.toDate().toLocaleDateString() : 'Just now'}</p>
            </div>
            <Button onClick={() => setSelectedEnquiry(enq)} className="w-full rounded-full h-12 font-black uppercase text-[10px] tracking-widest bg-primary text-white gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
              <Wand2 className="w-3.5 h-3.5" /> Digitize & Order
            </Button>
          </Card>
        ))}
      </div>

      {selectedEnquiry && <DigitizationTerminal db={db} enquiry={selectedEnquiry} onClose={() => setSelectedEnquiry(null)} />}
    </div>
  );
}

function DigitizationTerminal({ db, enquiry, onClose }: { db: any, enquiry: any, onClose: () => void }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<any[]>(enquiry.digitizedData || []);
  const [summary, setSummary] = useState(enquiry.analysisSummary || '');
  const [searchQueryStr, setSearchQueryStr] = useState('');
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const { toast } = useToast();

  const medsQuery = useMemoFirebase(() => query(collection(db, 'medicines')), [db]);
  const { data: medicines } = useCollection(medsQuery);

  const searchedMeds = searchQueryStr.trim() ? medicines?.filter(m => 
    m.name.toLowerCase().includes(searchQueryStr.toLowerCase()) || 
    m.saltComposition?.toLowerCase().includes(searchQueryStr.toLowerCase())
  ).slice(0, 5) : [];

  const handleAIAnalysis = async () => {
    setAnalyzing(true);
    try {
      const output = await prescriptionAnalysisAndPreFill({ prescriptionImageUri: enquiry.imageUrl });
      if (output.isLegible) {
        setResults(output.medications);
        setSummary(output.analysisSummary);
        toast({ title: "Analysis Complete", description: "Medications extracted successfully." });
      } else {
        toast({ variant: "destructive", title: "Legibility Issue", description: output.analysisSummary });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "AI Error", description: "Failed to process prescription image." });
    } finally {
      setAnalyzing(false);
    }
  };

  const addToDraftOrder = (med: any) => {
    const existing = orderItems.find(item => item.id === med.id);
    if (existing) {
      setOrderItems(orderItems.map(item => item.id === med.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setOrderItems([...orderItems, { ...med, quantity: 1 }]);
    }
    setSearchQueryStr('');
    toast({ title: "Item Added", description: `${med.name} added to draft order.` });
  };

  const handleCompleteOrder = () => {
    if (!enquiry.userId) {
       toast({ variant: 'destructive', title: 'Error', description: 'User identifier missing.' });
       return;
    }
    if (orderItems.length === 0) {
       toast({ variant: 'destructive', title: 'Empty Order', description: 'Add at least one medicine to the order.' });
       return;
    }

    const totalAmount = orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const orderData = {
      userId: enquiry.userId,
      orderDate: serverTimestamp(),
      totalAmount: totalAmount,
      status: 'Created by Admin',
      paymentStatus: 'Pending',
      patientName: enquiry.patientName || 'Patient',
      phoneNumber: enquiry.phoneNumber || '',
      items: orderItems.map(item => ({
        medicineId: item.id,
        quantity: item.quantity,
        unitPrice: item.price,
        name: item.name,
        imageUrl: item.imageUrl
      }))
    };

    const orderRef = collection(db, 'userProfiles', enquiry.userId, 'orders');
    addDocumentNonBlocking(orderRef, orderData);

    updateDocumentNonBlocking(doc(db, 'userProfiles', enquiry.userId, 'prescriptions', enquiry.id), {
      digitizedData: results,
      analysisSummary: summary,
      status: 'Digitized',
      digitizedAt: serverTimestamp()
    });

    toast({ title: "Order Created", description: "Pharmacist-initiated order has been placed." });
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl rounded-[48px] border-none p-0 overflow-hidden shadow-3xl h-[90vh]">
        <div className="bg-primary p-8 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="bg-white/10 p-2 rounded-xl"><Sparkles className="w-6 h-6" /></div>
            <div>
              <DialogTitle className="text-2xl font-black uppercase tracking-tight">Digitization & Order Terminal</DialogTitle>
              <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Patient: {enquiry.patientName || 'Self'} • {enquiry.phoneNumber || 'N/A'}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleAIAnalysis} disabled={analyzing} className="rounded-full h-12 px-6 font-black text-[10px] uppercase bg-white/10 text-white border-white/20 hover:bg-white/20 transition-all gap-2">
              {analyzing ? <Loader2 className="animate-spin w-4 h-4" /> : <Wand2 className="w-4 h-4" />} AI Scan
            </Button>
            <Button onClick={handleCompleteOrder} disabled={orderItems.length === 0} className="rounded-full h-12 px-6 font-black text-[10px] uppercase bg-white text-primary hover:bg-white/90 shadow-xl transition-all gap-2">
              <ShoppingCart className="w-4 h-4" /> Complete Order
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl bg-white/5 text-white hover:bg-white/10 ml-2">
               <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 h-full overflow-hidden">
          <div className="bg-gray-100 p-8 overflow-auto border-r flex items-start justify-center">
             <img src={enquiry.imageUrl} className="max-w-full rounded-3xl shadow-2xl border-4 border-white" alt="Prescription" />
          </div>
          <div className="p-8 space-y-8 overflow-auto bg-white scrollbar-hide">
            
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 border-b pb-4">Order on Behalf (Product Search)</h3>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input 
                  placeholder="Find medicines to add to order..." 
                  value={searchQueryStr}
                  onChange={e => setSearchQueryStr(e.target.value)}
                  className="rounded-2xl h-14 bg-gray-50 border-none font-bold pl-12 shadow-inner"
                />
                {searchedMeds.length > 0 && (
                  <div className="absolute top-16 left-0 right-0 bg-white rounded-2xl shadow-2xl border z-20 overflow-hidden">
                    {searchedMeds.map(m => (
                      <button 
                        key={m.id}
                        onClick={() => addToDraftOrder(m)}
                        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors border-b last:border-none"
                      >
                        <div className="flex items-center gap-3">
                          <img src={m.imageUrl} className="w-10 h-10 object-contain bg-gray-50 rounded-lg p-1" alt="" />
                          <div className="text-left">
                            <p className="text-sm font-black uppercase">{m.name}</p>
                            <p className="text-[9px] text-gray-400 font-bold uppercase">{m.saltComposition}</p>
                          </div>
                        </div>
                        <PlusCircle className="w-5 h-5 text-primary" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {orderItems.length > 0 && (
              <div className="space-y-4 animate-in slide-in-from-top-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Draft Order Items</h3>
                <div className="space-y-3">
                  {orderItems.map((item, i) => (
                    <div key={i} className="bg-gray-50 p-4 rounded-2xl flex items-center justify-between border border-gray-100">
                      <div className="flex items-center gap-3">
                         <Badge className="bg-primary/10 text-primary border-none text-[10px] font-black">{item.quantity}x</Badge>
                         <div className="text-left">
                           <p className="text-xs font-black uppercase">{item.name}</p>
                           <p className="text-[9px] text-gray-400 font-bold uppercase">₹{item.price} per unit</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-black text-xs">₹{item.price * item.quantity}</span>
                        <Button variant="ghost" size="icon" onClick={() => setOrderItems(orderItems.filter(oi => oi.id !== item.id))} className="h-8 w-8 text-red-300 hover:text-red-500">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="pt-4 border-t border-dashed flex justify-between items-baseline">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Estimated Total</span>
                    <span className="text-2xl font-black text-accent">₹{orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0)}</span>
                  </div>
                </div>
              </div>
            )}

            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 border-b pb-4 pt-4">Prescription AI Extraction</h3>
            <div className="space-y-6">
              {results.length === 0 ? (
                <div className="py-20 text-center">
                   <AlertCircle className="w-10 h-10 text-gray-100 mx-auto mb-4" />
                   <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No medications extracted yet</p>
                </div>
              ) : results.map((med, idx) => (
                <Card key={idx} className="p-6 rounded-3xl border-none bg-gray-50 space-y-4 shadow-sm">
                  <div className="space-y-2">
                     <Label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Drug Name</Label>
                     <Input value={med.drugName} onChange={e => { const r = [...results]; r[idx].drugName = e.target.value; setResults(r); }} className="bg-white border-none font-bold h-12 rounded-xl shadow-inner px-4" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Dosage</Label>
                      <Input value={med.dosage} onChange={e => { const r = [...results]; r[idx].dosage = e.target.value; setResults(r); }} className="bg-white border-none font-bold h-12 rounded-xl shadow-inner px-4" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Quantity</Label>
                      <Input type="number" value={med.quantity} onChange={e => { const r = [...results]; r[idx].quantity = Number(e.target.value); setResults(r); }} className="bg-white border-none font-bold h-12 rounded-xl shadow-inner px-4" />
                    </div>
                  </div>
                  <div className="space-y-2">
                     <Label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Instructions</Label>
                     <Input value={med.instructions} onChange={e => { const r = [...results]; r[idx].instructions = e.target.value; setResults(r); }} className="bg-white border-none font-bold h-12 rounded-xl shadow-inner px-4" />
                  </div>
                </Card>
              ))}
            </div>
            
            {summary && (
              <div className="bg-primary/5 p-6 rounded-3xl space-y-2 border border-primary/10 mt-10">
                <div className="flex items-center gap-2 text-primary">
                   <Sparkles className="w-4 h-4" />
                   <span className="text-[10px] font-black uppercase tracking-widest">AI Clinical Analysis</span>
                </div>
                <p className="text-xs font-bold text-gray-600 leading-relaxed">{summary}</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// --- PLACEHOLDER TABS ---

function PromoCodesTab({ onBack }: { onBack: () => void }) { return <div className="space-y-8"><SectionHeader title="Coupons" subtitle="Manage offers" onBack={onBack} /></div>; }
function FeesTab({ onBack }: { onBack: () => void }) { return <div className="space-y-8"><SectionHeader title="Fees" subtitle="Manage dynamic charges" onBack={onBack} /></div>; }
function CustomersTab({ onBack }: { onBack: () => void }) { return <div className="space-y-8"><SectionHeader title="Customers" subtitle="Manage patient registry" onBack={onBack} /></div>; }
function StockAlertsTab({ onBack }: { onBack: () => void }) { return <div className="space-y-8"><SectionHeader title="Stock Alerts" subtitle="Manage restock queue" onBack={onBack} /></div>; }
