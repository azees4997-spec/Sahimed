
"use client"

import { useState, useEffect, useRef, useMemo } from 'react';
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
  Dna,
  Receipt,
  Ticket,
  ExternalLink,
  Check,
  Search,
  FileDown,
  Eye,
  ChevronRight,
  Download,
  Upload,
  Wand2,
  PlusCircle,
  MinusCircle,
  Tag,
  Phone,
  ShoppingCart,
  ChevronDown,
  FileWarning,
  Megaphone,
  Activity,
  ClipboardList,
  Star,
  ImageIcon,
  Link as LinkIcon,
  UploadCloud,
  Bomb,
  Stethoscope,
  AlertTriangle,
  Zap,
  Filter,
  Calendar,
  X,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { 
  useUser, 
  useFirestore, 
  useAuth, 
  useMemoFirebase, 
  useCollection,
  useFunctions,
  setDocumentNonBlocking,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking,
  addDocumentNonBlocking,
  initializeFirebase
} from '@/firebase';
import { doc, collection, query, collectionGroup, getDoc, getDocs, serverTimestamp, orderBy, where, writeBatch, limit } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
import { useMongoDBCollection } from '@/hooks/use-mongodb';

function SectionHeader({ title, subtitle, onBack, children }: { title: string, subtitle: string, onBack?: () => void, children?: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
      <div className="flex items-center gap-4">
        {onBack && (
          <button onClick={onBack} className="rounded-full bg-white shadow-sm h-12 w-12 hover:scale-110 transition-transform flex items-center justify-center">
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
        )}
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">{title}</h2>
          <p className="text-[10px] font-black text-gray-400 tracking-widest leading-none">{subtitle}</p>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        {children}
      </div>
    </div>
  );
}

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
      toast({ variant: 'destructive', title: 'Access denied', description: 'Invalid admin credentials.' });
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
    toast({ title: 'Requesting authority', description: 'Provisioning admin role...' });
    setTimeout(performVerification, 3000);
  };

  if (isUserLoading || isVerifying) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F7F6] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-[10px] font-black tracking-[0.3em] text-gray-400">Syncing authority...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F7F6] p-4">
        <Card className="max-w-md w-full rounded-[40px] shadow-2xl border-none overflow-hidden bg-white">
          <CardHeader className="text-center p-10 bg-primary text-white">
            <Lock className="w-10 h-10 mx-auto mb-4 opacity-50" />
            <CardTitle className="text-2xl font-black tracking-tight text-white">SahiMed admin</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black tracking-widest text-gray-400">Admin email</Label>
                <input type="email" placeholder="admin@sahimed.com" value={email} onChange={e => setEmail(e.target.value)} required className="w-full h-14 rounded-2xl bg-gray-50 border-none px-4 font-bold outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black tracking-widest text-gray-400">Password</Label>
                <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required className="w-full h-14 rounded-2xl bg-gray-50 border-none px-4 font-bold outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <Button type="submit" disabled={authLoading} className="w-full h-14 rounded-full font-black tracking-widest mt-4 shadow-xl shadow-primary/20">
                {authLoading ? <Loader2 className="animate-spin" /> : "Authorize access"}
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
            <h2 className="text-xl font-black">Restricted area</h2>
            <p className="text-gray-400 text-[10px] font-bold tracking-widest leading-relaxed">Admin role is not detected.</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-2xl space-y-2">
            <p className="text-[8px] font-black text-gray-400 tracking-widest">Your uid</p>
            <div className="flex items-center gap-2 bg-white border p-3 rounded-xl">
              <code className="text-[10px] font-black text-gray-600 truncate flex-1">{user.uid}</code>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-primary" onClick={() => {
                navigator.clipboard.writeText(user.uid);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
                toast({ title: "Uid copied" });
              }}>
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <LogOut className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          <div className="space-y-3 pt-6 border-t">
            <Button onClick={bootstrapAdmin} className="w-full gap-2 rounded-full h-14 bg-orange-600 hover:bg-orange-700 font-black text-[10px] tracking-widest">
              <UserPlus className="w-4 h-4" /> Initialize admin role
            </Button>
            <Button onClick={performVerification} variant="outline" className="w-full h-14 rounded-full font-black text-[10px] border-2">
               Refresh authority
            </Button>
            <Button onClick={handleLogout} variant="ghost" className="w-full text-gray-400 font-bold text-[9px] tracking-widest">Sign out</Button>
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
                <span className="font-black text-xl tracking-tighter text-gray-900">Admin center</span>
                <span className="text-[8px] font-black text-primary tracking-[0.3em]">Management portal</span>
              </div>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" target="_blank">
              <Button variant="outline" className="rounded-xl border-2 font-black text-[9px] gap-1.5 h-10 px-4 hidden sm:flex">
                <ExternalLink className="w-3.5 h-3.5" /> Live store
              </Button>
            </Link>
            <Button variant="ghost" onClick={handleLogout} size="icon" className="w-10 h-10 rounded-xl text-gray-400 hover:text-red-500"><LogOut className="w-4 h-4" /></Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {activeTab === 'overview' && <OverviewTab setTab={setActiveTab} />}
        {activeTab === 'enquiries' && <EnquiriesTab db={db} isVerified={isVerified} onBack={() => setActiveTab('overview')} />}
        {activeTab === 'fulfillment' && <FulfillmentTab db={db} isVerified={isVerified} onBack={() => setActiveTab('overview')} />}
        {activeTab === 'promocodes' && <PromoCodesTab db={db} isVerified={isVerified} onBack={() => setActiveTab('overview')} />}
        {activeTab === 'fees' && <FeesTab db={db} isVerified={isVerified} onBack={() => setActiveTab('overview')} />}
        {activeTab === 'categories' && <CategoriesTab db={db} isVerified={isVerified} onBack={() => setActiveTab('overview')} />}
        {activeTab === 'customers' && <CustomersTab db={db} isVerified={isVerified} onBack={() => setActiveTab('overview')} />}
        {activeTab === 'stockAlerts' && <AlertsTab db={db} isVerified={isVerified} onBack={() => setActiveTab('overview')} />}
        {activeTab === 'itemMaster' && <ItemMasterTab db={db} isVerified={isVerified} onBack={() => setActiveTab('overview')} />}
        {activeTab === 'moleculeMaster' && <MoleculeMasterTab db={db} isVerified={isVerified} onBack={() => setActiveTab('overview')} />}
        {activeTab === 'banners' && <BannersTab db={db} isVerified={isVerified} onBack={() => setActiveTab('overview')} />}
      </main>
    </div>
  );
}

function OverviewTab({ setTab }: { setTab: (t: AdminTab) => void }) {
  const stats = [
    { label: 'Inquiries', icon: FileText, desc: 'Prescription digitization', tab: 'enquiries', color: 'text-blue-600' },
    { label: 'Orders', icon: ShoppingBag, desc: 'Fulfillment & logistics', tab: 'fulfillment', color: 'text-blue-500' },
    { label: 'Coupons', icon: Ticket, desc: 'Marketing campaigns', tab: 'promocodes', color: 'text-purple-500' },
    { label: 'Fees', icon: Receipt, desc: 'Billing adjustments', tab: 'fees', color: 'text-orange-500' },
    { label: 'Banners', icon: ImageIcon, desc: 'Storefront promotions', tab: 'banners', color: 'text-yellow-500' },
    { label: 'Categories', icon: Tag, desc: 'Therapeutic taxonomy', tab: 'categories', color: 'text-pink-500' },
    { label: 'Customers', icon: Users, desc: 'Patient registry', tab: 'customers', color: 'text-indigo-500' },
    { label: 'Alerts', icon: Megaphone, desc: 'System broadcasts', tab: 'stockAlerts', color: 'text-red-500' },
    { label: 'Catalog', icon: Package, desc: 'Product master data', tab: 'itemMaster', color: 'text-green-600' },
    { label: 'Formulas', icon: Dna, desc: 'Molecule registry', tab: 'moleculeMaster', color: 'text-green-500' },
  ];

  return (
    <div className="animate-in fade-in duration-500">
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {stats.map(card => (
          <Card key={card.label} className="rounded-[40px] p-8 border-none shadow-sm hover:shadow-2xl transition-all cursor-pointer bg-white group text-center flex flex-col items-center justify-center min-h-[220px]" onClick={() => setTab(card.tab as AdminTab)}>
            <div className={cn("w-16 h-16 rounded-[24px] bg-gray-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform", card.color)}>
               <card.icon className="w-8 h-8" />
            </div>
            <CardTitle className="text-[10px] font-black text-gray-400 tracking-[0.2em] mb-2">{card.label}</CardTitle>
            <p className="text-[10px] font-black text-gray-900 tracking-tighter opacity-60 group-hover:opacity-100 transition-opacity">Manage portal</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

function FulfillmentTab({ db, isVerified, onBack }: { db: any, isVerified: boolean, onBack: () => void }) {
  const [statusFilter, setStatusFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const ordersQuery = useMemoFirebase(() => {
    if (!db || !isVerified) return null;
    return query(collectionGroup(db, 'orders'), limit(100)); 
  }, [db, isVerified]);

  const { data: rawOrders, isLoading } = useCollection(ordersQuery);
  const { toast } = useToast();

  const orders = useMemo(() => {
    if (!rawOrders) return null;
    let filtered = [...rawOrders];

    if (statusFilter !== 'All') {
      filtered = filtered.filter(o => (o.status || 'Pending').toLowerCase() === statusFilter.toLowerCase());
    }

    if (startDate) {
      const start = startOfDay(new Date(startDate));
      filtered = filtered.filter(o => {
        const orderDate = o.orderDate?.toDate ? o.orderDate.toDate() : null;
        return orderDate && (orderDate >= start);
      });
    }

    if (endDate) {
      const end = endOfDay(new Date(endDate));
      filtered = filtered.filter(o => {
        const orderDate = o.orderDate?.toDate ? o.orderDate.toDate() : null;
        return orderDate && (orderDate <= end);
      });
    }

    return filtered.sort((a, b) => {
      const timeA = a.orderDate?.seconds || 0;
      const timeB = b.orderDate?.seconds || 0;
      return timeB - timeA;
    });
  }, [rawOrders, statusFilter, startDate, endDate]);

  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isShippingDialogOpen, setIsShippingDialogOpen] = useState(false);
  const [shippingData, setShippingData] = useState({ carrier: '', trackingId: '' });

  const handleExport = () => {
    if (!orders || orders.length === 0) return;
    const headers = ["Order ID", "Order Date", "Patient Name", "Phone", "Street", "Landmark", "Pincode", "Payment Type", "Status", "Grand Total", "Medicine Name", "Quantity", "Unit Price", "Item Total"];
    const rows = orders.flatMap(order => {
      const dateStr = order.orderDate?.toDate ? format(order.orderDate.toDate(), 'yyyy-MM-dd HH:mm') : 'Pending';
      const baseInfo = [order.id, dateStr, order.patientName || 'N/A', order.phoneNumber || 'N/A', `"${(order.shippingDetails?.street || '').replace(/"/g, '""')}"`, `"${(order.shippingDetails?.landmark || '').replace(/"/g, '""')}"`, order.shippingDetails?.pincode || '', order.paymentType || 'COD', order.status || 'Pending', Number(order.totalAmount || 0).toFixed(2)];
      return (order.items || []).map((item: any) => [...baseInfo, `"${(item.name || '').replace(/"/g, '""')}"`, item.quantity || 0, Number(item.unitPrice || 0).toFixed(2), Number((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2)].join(","));
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SahiMed_Fulfillment_${format(new Date(), 'yyyyMMdd')}.csv`;
    a.click();
    toast({ title: "Manifest exported" });
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2">
      <SectionHeader title="Fulfillment hub" subtitle="Active order processing" onBack={onBack}>
        <Button onClick={handleExport} variant="outline" className="rounded-full h-12 px-6 font-black text-[10px] border-2 gap-2">
          <Download className="w-4 h-4" /> Download manifest
        </Button>
      </SectionHeader>

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="bg-white p-1 rounded-full border flex w-fit gap-1">
          {['All', 'Pending', 'Shipping', 'Delivered'].map((status) => (
            <button key={status} onClick={() => setStatusFilter(status)} className={cn("px-8 py-2.5 rounded-full text-[10px] font-black tracking-widest transition-all", statusFilter === status ? "bg-primary text-white shadow-lg scale-105" : "text-gray-400 hover:bg-gray-50")}>{status}</button>
          ))}
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-3xl border shadow-sm">
          <Calendar className="w-3.5 h-3.5 text-primary ml-2" /><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-10 w-36 rounded-xl border-none bg-gray-50 font-bold text-[10px] px-3" />
          <span className="text-gray-300 font-bold">→</span><Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-10 w-36 rounded-xl border-none bg-gray-50 font-bold text-[10px] px-3" />
          {(startDate || endDate) && <Button variant="ghost" size="icon" onClick={() => { setStartDate(''); setEndDate(''); }} className="h-8 w-8 text-red-400"><X className="w-4 h-4" /></Button>}
        </div>
      </div>
      
      <Card className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[1000px]">
            <thead className="bg-gray-50 text-[10px] font-black text-gray-400 border-b">
              <tr><th className="px-8 py-6">Order id</th><th className="px-8 py-6">Date</th><th className="px-8 py-6">Patient</th><th className="px-8 py-6">Address</th><th className="px-8 py-6">Amount</th><th className="px-8 py-6 text-right">Action</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (<tr><td colSpan={6} className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></td></tr>) : (!orders || orders.length === 0) ? (<tr><td colSpan={6} className="p-20 text-center font-bold text-gray-400 text-[10px]">No orders found</td></tr>) : orders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50/50">
                  <td className="px-8 py-6 font-black text-xs uppercase">#{order.id.substring(0,8)}</td>
                  <td className="px-8 py-6 text-[10px] font-black">{order.orderDate?.toDate ? format(order.orderDate.toDate(), 'dd MMM yyyy') : 'N/A'}</td>
                  <td className="px-8 py-6"><p className="font-bold text-xs">{order.patientName}</p><p className="text-[10px] text-gray-400">{order.phoneNumber}</p></td>
                  <td className="px-8 py-6 max-w-[250px]"><p className="text-[10px] font-bold text-gray-600 truncate">{order.shippingDetails?.street}</p></td>
                  <td className="px-8 py-6 font-black text-accent">₹{Number(order.totalAmount || 0).toFixed(2)}</td>
                  <td className="px-8 py-6 text-right"><Button variant="ghost" size="icon" onClick={() => setSelectedOrder(order)}><Eye className="w-4 h-4 text-primary" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={!!selectedOrder && !isShippingDialogOpen} onOpenChange={o => !o && setSelectedOrder(null)}>
        <DialogContent className="rounded-[40px] max-w-2xl border-none p-0 overflow-hidden">
          <div className="bg-primary p-8 text-white"><DialogTitle className="text-2xl font-black">Order details</DialogTitle></div>
          <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-hide">
             <div className="grid grid-cols-2 gap-8">
                <div><h4 className="text-[10px] font-black text-gray-400 mb-2">Patient</h4><p className="font-black text-sm">{selectedOrder?.patientName}</p><p className="text-xs text-gray-500">{selectedOrder?.phoneNumber}</p></div>
                <div><h4 className="text-[10px] font-black text-gray-400 mb-2">Address</h4><p className="text-[11px] font-bold leading-relaxed">{selectedOrder?.shippingDetails?.street}</p><p className="text-[10px] font-black text-primary mt-1">Pin: {selectedOrder?.shippingDetails?.pincode}</p></div>
             </div>
             {selectedOrder?.prescriptionUrl && (
               <div className="space-y-3"><h4 className="text-[10px] font-black text-gray-400">Prescription</h4><div className="rounded-[32px] overflow-hidden aspect-[3/4] bg-gray-50 border"><img src={selectedOrder.prescriptionUrl} className="w-full h-full object-contain" alt="" /></div></div>
             )}
             <div className="bg-gray-50 p-6 rounded-[32px] border space-y-4">
                <h4 className="text-[10px] font-black text-gray-400 mb-2">Items breakdown</h4>
                {selectedOrder?.items?.map((it: any, i: number) => (<div key={i} className="flex justify-between items-center"><p className="text-[11px] font-black">{it.name} x {it.quantity}</p><span className="font-black text-xs">₹{(it.unitPrice * it.quantity).toFixed(2)}</span></div>))}
             </div>
             <div className="flex justify-between items-center border-t pt-6">
               <div><span className="font-black text-[10px] text-gray-400">Payment</span><Badge className="bg-green-100 text-green-600 ml-2">{selectedOrder?.paymentType}</Badge></div>
               <div className="text-right"><span className="font-black text-[10px] text-gray-400">Total</span><p className="text-3xl font-black text-accent">₹{Number(selectedOrder?.totalAmount || 0).toFixed(2)}</p></div>
             </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ItemMasterTab({ db, isVerified, onBack }: { db: any, isVerified: boolean, onBack: () => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    window.open('/api/products/bulk', '_blank');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').map(l => l.trim()).filter(l => l);
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      
      const products = lines.slice(1).map(line => {
        // Simple CSV parser handling quotes
        const values: string[] = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') inQuotes = !inQuotes;
          else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        values.push(current.trim());

        const obj: any = {};
        headers.forEach((h, i) => {
          let val: any = values[i]?.replace(/^"|"$/g, '') || '';
          if (h === 'isGeneric' || h === 'prescriptionRequired') val = val.toLowerCase() === 'true';
          obj[h] = val;
        });
        return obj;
      });

      try {
        const res = await fetch('/api/products/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(products)
        });
        if (res.ok) {
          toast({ title: "Bulk import success", description: "Catalog updated" });
          window.location.reload();
        } else {
          throw new Error('Import failed');
        }
      } catch (err: any) {
        toast({ variant: 'destructive', title: "Import failed", description: err.message });
      }
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    if (searchTerm.trim().length >= 2) {
      setIsSearching(true);
      const term = searchTerm.trim();
      
      const fetchSuggestions = async () => {
        try {
          const res = await fetch(`/api/products?q=${encodeURIComponent(term)}&limit=10`);
          if (res.ok) {
            const data = await res.json();
            setSuggestions(data.map((p: any) => ({ ...p, id: p._id || p.id })));
          }
        } catch (error) {
          console.warn("Suggestion fetch error:", error);
        } finally {
          setIsSearching(false);
        }
      };

      const timer = setTimeout(fetchSuggestions, 300);
      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
      setIsSearching(false);
    }
  }, [searchTerm]);

  const { data: medicines, isLoading, refetch } = useMongoDBCollection({
    q: debouncedSearch,
    limit: 50
  });

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2">
      <SectionHeader title="Product master" subtitle="Targeted management (Limit: 2)" onBack={onBack}>
        <div className="flex gap-4">
          <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".csv" />
          <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="rounded-full h-12 px-6 font-black text-[10px] border-2 gap-2 text-primary border-primary/20">
            <Upload className="w-4 h-4" /> Bulk Import
          </Button>
          <Button onClick={handleExport} variant="outline" className="rounded-full h-12 px-6 font-black text-[10px] border-2 gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
          <Button onClick={() => { setEditingItem(null); setIsFormOpen(true); }} className="rounded-full h-12 px-8 font-black text-[10px] bg-primary text-white"><Plus className="w-4 h-4" /> New product</Button>
        </div>
      </SectionHeader>

      <div className="relative" ref={suggestionRef}>
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
        <Input 
          placeholder="Search items (e.g. d-veniz)..." 
          value={searchTerm} 
          onChange={e => setSearchTerm(e.target.value)} 
          className="h-16 pl-14 rounded-[32px] border-none bg-white shadow-sm font-black text-sm" 
        />
        {isSearching && (
          <div className="absolute right-6 top-1/2 -translate-y-1/2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          </div>
        )}

        {suggestions.length > 0 && (
          <div className="absolute top-[calc(100%+12px)] left-0 right-0 bg-white rounded-[32px] shadow-2xl border border-gray-100 overflow-hidden z-[110] animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="px-6 py-3 bg-gray-50 border-b">
              <p className="text-[8px] font-black text-gray-400 tracking-widest">Clinical selection</p>
            </div>
            <div className="max-h-[300px] overflow-y-auto scrollbar-hide">
              {suggestions.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setSearchTerm(item.name);
                    setSuggestions([]);
                  }}
                  className="w-full p-5 flex items-center gap-4 hover:bg-primary/5 transition-all border-b last:border-none text-left active:scale-[0.98]"
                >
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex-shrink-0 border border-gray-100 p-1 flex items-center justify-center overflow-hidden">
                    {item.imageUrl ? <img src={item.imageUrl} alt="" className="w-full h-full object-contain" /> : <Package className="w-5 h-5 text-gray-200" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-[11px] text-gray-900 truncate tracking-tight">{item.name}</p>
                    <p className="text-[8px] font-bold text-gray-400 tracking-widest truncate">{item.sku} • {item.manufacturer}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-200" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <Card className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-gray-50 text-[10px] font-black text-gray-400 border-b">
              <tr><th className="px-10 py-8">Clinical item</th><th className="px-10 py-8">Category</th><th className="px-10 py-8 text-right">Manage</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (<tr><td colSpan={3} className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></td></tr>) : medicines?.length === 0 ? (<tr><td colSpan={3} className="p-20 text-center font-bold text-gray-300">No entries found</td></tr>) : medicines?.map(med => (
                <tr key={med.id} className="hover:bg-gray-50/50">
                  <td className="px-10 py-8"><div className="flex items-center gap-4"><div className="w-12 h-12 bg-gray-50 rounded-2xl p-2 border flex items-center justify-center overflow-hidden">{med.imageUrl ? <img src={med.imageUrl} alt="" className="w-full h-full object-contain" /> : <Package className="w-6 h-6 text-gray-200" />}</div><div className="flex flex-col"><span className="font-black text-sm">{med.name}</span><span className="text-[9px] text-gray-400 uppercase">{med.sku} • {med.manufacturer}</span></div></div></td>
                  <td className="px-10 py-8"><Badge variant="outline" className="font-black text-[8px]">{med.category}</Badge></td>
                  <td className="px-10 py-8 text-right">
                     <div className="flex justify-end gap-2">
                       <Button variant="ghost" size="icon" onClick={() => { setEditingItem(med); setIsFormOpen(true); }}>
                         <Edit2 className="w-4 h-4 text-gray-400" />
                       </Button>
                       <Button variant="ghost" size="icon" onClick={async () => {
                         if (confirm("Delete this product from MongoDB & Firestore?")) {
                           const docId = med._id || med.id;
                           // 1. Delete from MongoDB
                           await fetch(`/api/products/${docId}`, { method: 'DELETE' });
                           // 2. Delete from Firestore (legacy)
                           deleteDocumentNonBlocking(doc(db, 'medicines', docId));
                           toast({ title: "Product deleted" });
                           refetch?.();
                         }
                       }}>
                         <Trash2 className="w-4 h-4 text-red-300" />
                       </Button>
                     </div>
                   </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={isFormOpen => setIsFormOpen(isFormOpen)}>
        <DialogContent className="rounded-[40px] max-w-5xl border-none p-0 overflow-hidden">
          <div className="bg-primary p-8 text-white"><DialogTitle className="text-2xl font-black">Product profile</DialogTitle></div>
          <div className="p-8 max-h-[80vh] overflow-y-auto scrollbar-hide"><ItemForm db={db} initialData={editingItem} onSuccess={() => setIsFormOpen(false)} /></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ItemForm({ db, initialData, onSuccess }: { db: any, initialData?: any, onSuccess: () => void }) {
  const { toast } = useToast();
  const molsQuery = useMemoFirebase(() => query(collection(db, 'moleculeMaster'), orderBy('molecule', 'asc'), limit(100)), [db]);
  const { data: molecules } = useCollection(molsQuery);
  const [form, setForm] = useState({
    name: initialData?.name || '',
    sku: initialData?.sku || '',
    manufacturer: initialData?.manufacturer || '',
    category: initialData?.category || '',
    isGeneric: initialData?.isGeneric || false,
    prescriptionRequired: initialData?.prescriptionRequired || false,
    moleculeId: initialData?.moleculeId || '',
    packSize: initialData?.packSize || '',
    description: initialData?.description || '',
    howToUse: initialData?.howToUse || '',
    treatment: initialData?.treatment || '',
    imageUrl: initialData?.imageUrl || '',
    imageUrl2: initialData?.imageUrls?.[1] || '',
    imageUrl3: initialData?.imageUrls?.[2] || ''
  });

  const [liveData, setLiveData] = useState({ price: 0, mrp: 0, availableQuantity: 0 });

  useEffect(() => {
    if (initialData?.sku) {
      getDoc(doc(db, 'product_live_data', initialData.sku)).then(snap => {
        if (snap.exists()) {
          const d = snap.data();
          setLiveData({ price: d.sahimed_price || 0, mrp: d.mrp || 0, availableQuantity: d.stock_quantity || 0 });
        }
      });
    }
  }, [initialData, db]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const docId = initialData?.id || initialData?._id || form.sku;
    if (!docId) {
      toast({ variant: 'destructive', title: "Error", description: "Sku is required for new products" });
      return;
    }

    const staticPayload = { 
      ...form, 
      imageUrls: [form.imageUrl, form.imageUrl2, form.imageUrl3].filter(Boolean) 
    };
    const livePayload = { 
      mrp: Number(liveData.mrp), 
      sahimed_price: Number(liveData.price), 
      stock_quantity: Number(liveData.availableQuantity) 
    };

    const combinedPayload = {
      ...staticPayload,
      liveData: livePayload,
      id: docId
    };

    try {
      // 1. Sync to MongoDB
      const method = initialData ? 'PUT' : 'POST';
      const url = initialData ? `/api/products/${docId}` : '/api/products';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(combinedPayload)
      });
      
      if (!res.ok) throw new Error('Failed to sync with MongoDB');

      // 2. Legacy Sync to Firestore
      setDocumentNonBlocking(doc(db, 'medicines', docId), { ...staticPayload, updatedAt: serverTimestamp() }, { merge: true });
      if (form.sku) {
        setDocumentNonBlocking(doc(db, 'product_live_data', form.sku), { ...livePayload, updatedAt: serverTimestamp() }, { merge: true });
      }

      toast({ title: "Product synchronized", description: "Updated in MongoDB and Firestore" });
      onSuccess();
    } catch (err: any) {
      toast({ variant: 'destructive', title: "Sync failed", description: err.message });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="bg-gray-100 p-1 rounded-2xl h-14 w-full flex mb-8">
          <TabsTrigger value="basic" className="flex-1 rounded-xl font-black text-[10px]">Identity</TabsTrigger>
          <TabsTrigger value="live" className="flex-1 rounded-xl font-black text-[10px] text-primary">Live stock</TabsTrigger>
          <TabsTrigger value="images" className="flex-1 rounded-xl font-black text-[10px]">Media</TabsTrigger>
          <TabsTrigger value="clinical" className="flex-1 rounded-xl font-black text-[10px]">Clinical</TabsTrigger>
        </TabsList>
        <TabsContent value="basic" className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2 space-y-2"><Label className="text-[10px] font-black">Medicine name</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="rounded-2xl h-14 bg-gray-50 border-none font-bold" /></div>
            <div className="space-y-2"><Label className="text-[10px] font-black">Sku</Label><Input value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} className="rounded-2xl h-14 bg-gray-50 border-none font-bold" /></div>
            <div className="space-y-2"><Label className="text-[10px] font-black">Manufacturer</Label><Input value={form.manufacturer} onChange={e => setForm({...form, manufacturer: e.target.value})} className="rounded-2xl h-14 bg-gray-50 border-none font-bold" /></div>
            <div className="col-span-2 flex items-center space-x-10 pt-4">
              <div className="flex items-center space-x-2"><Checkbox id="rx-req" checked={form.prescriptionRequired} onCheckedChange={(c) => setForm({...form, prescriptionRequired: !!c})} /><Label htmlFor="rx-req" className="text-[10px] font-black text-red-500">Rx required</Label></div>
              <div className="flex items-center space-x-2"><Checkbox id="is-generic" checked={form.isGeneric} onCheckedChange={(c) => setForm({...form, isGeneric: !!c})} /><Label htmlFor="is-generic" className="text-[10px] font-black text-accent">SahiMed generic</Label></div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="live" className="space-y-6"><div className="grid grid-cols-3 gap-6 bg-primary/5 p-8 rounded-[32px] border border-primary/10"><div className="space-y-2"><Label className="text-[10px] font-black text-primary">Live price</Label><Input type="number" value={liveData.price} onChange={e => setLiveData({...liveData, price: Number(e.target.value)})} className="rounded-2xl h-14 bg-white border-none font-black text-xl" /></div><div className="space-y-2"><Label className="text-[10px] font-black">Mrp</Label><Input type="number" value={liveData.mrp} onChange={e => setLiveData({...liveData, mrp: Number(e.target.value)})} className="rounded-2xl h-14 bg-white border-none font-bold" /></div><div className="space-y-2"><Label className="text-[10px] font-black">Stock</Label><Input type="number" value={liveData.availableQuantity} onChange={e => setLiveData({...liveData, availableQuantity: Number(e.target.value)})} className="rounded-2xl h-14 bg-white border-none font-bold" /></div></div></TabsContent>
        <TabsContent value="images" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-primary">Primary Image URL</Label>
                <Input value={form.imageUrl} onChange={e => setForm({...form, imageUrl: e.target.value})} placeholder="https://..." className="rounded-2xl h-14 bg-gray-50 border-none font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black">Alternate Image 2</Label>
                <Input value={form.imageUrl2} onChange={e => setForm({...form, imageUrl2: e.target.value})} placeholder="https://..." className="rounded-2xl h-14 bg-gray-50 border-none font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black">Alternate Image 3</Label>
                <Input value={form.imageUrl3} onChange={e => setForm({...form, imageUrl3: e.target.value})} placeholder="https://..." className="rounded-2xl h-14 bg-gray-50 border-none font-bold" />
              </div>
              <p className="text-[9px] font-bold text-gray-400">Add up to 3 public URLs for the product. The first one is the primary display image.</p>
            </div>
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Previews</Label>
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-gray-50 rounded-[32px] border border-dashed aspect-[16/9] flex items-center justify-center p-4">
                  {form.imageUrl ? <img src={form.imageUrl} alt="1" className="h-full object-contain rounded-xl" /> : <ImageIcon className="w-8 h-8 text-gray-100" />}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-[28px] border border-dashed aspect-square flex items-center justify-center p-2">
                    {form.imageUrl2 ? <img src={form.imageUrl2} alt="2" className="h-full object-contain rounded-lg" /> : <ImageIcon className="w-4 h-4 text-gray-100" />}
                  </div>
                  <div className="bg-gray-50 rounded-[28px] border border-dashed aspect-square flex items-center justify-center p-2">
                    {form.imageUrl3 ? <img src={form.imageUrl3} alt="3" className="h-full object-contain rounded-lg" /> : <ImageIcon className="w-4 h-4 text-gray-100" />}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="clinical" className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black">Molecule mapping</Label>
              <Select value={form.moleculeId} onValueChange={v => setForm({...form, moleculeId: v})}>
                <SelectTrigger className="rounded-2xl h-14 bg-gray-50 border-none font-bold"><SelectValue placeholder="Select molecule" /></SelectTrigger>
                <SelectContent className="rounded-2xl">{molecules?.map(m => (<SelectItem key={m.id} value={m.id}>{m.molecule} ({m.masterId})</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label className="text-[10px] font-black">Primary treatment</Label><Input value={form.treatment} onChange={e => setForm({...form, treatment: e.target.value})} className="rounded-2xl h-14 bg-gray-50 border-none font-bold" /></div>
            <div className="col-span-2 space-y-2"><Label className="text-[10px] font-black">Clinical description</Label><Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="rounded-2xl min-h-[100px] bg-gray-50 border-none font-bold" /></div>
          </div>
        </TabsContent>
      </Tabs>
      <Button type="submit" className="w-full h-20 rounded-[32px] font-black tracking-widest bg-primary text-white shadow-2xl">Save profile</Button>
    </form>
  );
}

function CategoriesTab({ db, isVerified, onBack }: { db: any, isVerified: boolean, onBack: () => void }) {
  const catsQuery = useMemoFirebase(() => isVerified ? query(collection(db, 'categories'), orderBy('name', 'asc'), limit(50)) : null, [db, isVerified]);
  const { data: categories, isLoading } = useCollection(catsQuery);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<any>(null);

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2">
      <SectionHeader title="Health categories" subtitle="Manage therapeutic classes" onBack={onBack}>
        <Button onClick={() => { setEditingCat(null); setIsFormOpen(true); }} className="rounded-full h-12 px-8 font-black text-[10px] bg-primary text-white"><Plus className="w-4 h-4" /> New category</Button>
      </SectionHeader>
      <Card className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-gray-50 text-[10px] font-black text-gray-400 border-b">
              <tr><th className="px-10 py-8">Visual</th><th className="px-10 py-8">Category name</th><th className="px-10 py-8">Description</th><th className="px-10 py-8 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (<tr><td colSpan={4} className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></td></tr>) : (!categories || categories.length === 0) ? (<tr><td colSpan={4} className="p-20 text-center font-bold text-gray-300">No categories found</td></tr>) : categories.map(cat => (
                <tr key={cat.id} className="hover:bg-gray-50/50">
                  <td className="px-10 py-8"><div className="w-12 h-12 rounded-2xl bg-gray-50 border p-2 overflow-hidden flex items-center justify-center">{cat.imageUrl ? <img src={cat.imageUrl} className="w-full h-full object-contain" alt="" /> : <Activity className="text-gray-300 w-6 h-6" />}</div></td>
                  <td className="px-10 py-8 font-black text-sm">{cat.name}</td>
                  <td className="px-10 py-8 text-[11px] font-bold text-gray-500 max-w-[300px] truncate">{cat.description}</td>
                  <td className="px-10 py-8 text-right"><div className="flex justify-end gap-2"><Button variant="ghost" size="icon" onClick={() => { setEditingCat(cat); setIsFormOpen(true); }}><Edit2 className="w-4 h-4 text-gray-400" /></Button><Button variant="ghost" size="icon" onClick={() => deleteDocumentNonBlocking(doc(db, 'categories', cat.id))}><Trash2 className="w-4 h-4 text-red-300" /></Button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}><DialogContent className="rounded-[40px] max-lg border-none p-0 overflow-hidden"><div className="bg-primary p-8 text-white"><DialogTitle className="text-2xl font-black">Category definition</DialogTitle></div><div className="p-8"><CategoryForm db={db} initialData={editingCat} onSuccess={() => setIsFormOpen(false)} /></div></DialogContent></Dialog>
    </div>
  );
}

function CategoryForm({ db, initialData, onSuccess }: { db: any, initialData?: any, onSuccess: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: initialData?.name || '', description: initialData?.description || '', imageUrl: initialData?.imageUrl || '' });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, updatedAt: new Date() };
    
    try {
      // 1. Sync to MongoDB
      const method = initialData ? 'PUT' : 'POST';
      const url = initialData ? `/api/categories/${initialData.id || initialData._id}` : '/api/categories';
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      // 2. Sync to Firestore
      initialData?.id ? updateDocumentNonBlocking(doc(db, 'categories', initialData.id), { ...payload, updatedAt: serverTimestamp() }) : addDocumentNonBlocking(collection(db, 'categories'), { ...payload, createdAt: serverTimestamp() });
      
      toast({ title: "Category synchronized" });
      onSuccess();
    } catch (err: any) {
      toast({ variant: 'destructive', title: "Sync failed", description: err.message });
    }
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2"><Label className="text-[10px] font-black">Category name</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="rounded-2xl h-14 bg-gray-50 border-none font-bold" /></div>
      <div className="space-y-2"><Label className="text-[10px] font-black">Description</Label><Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="rounded-2xl min-h-[100px] bg-gray-50 border-none font-bold" /></div>
      <div className="space-y-2"><Label className="text-[10px] font-black">Category Image URL</Label><Input value={form.imageUrl} onChange={e => setForm({...form, imageUrl: e.target.value})} placeholder="https://..." className="rounded-2xl h-14 bg-gray-50 border-none font-bold" /></div>
      <Button type="submit" className="w-full h-16 rounded-full font-black bg-primary text-white">Save category profile</Button>
    </form>
  );
}

function MoleculeMasterTab({ db, isVerified, onBack }: { db: any, isVerified: boolean, onBack: () => void }) {
  const molsQuery = useMemoFirebase(() => isVerified ? query(collection(db, 'moleculeMaster'), orderBy('molecule', 'asc'), limit(50)) : null, [db, isVerified]);
  const { data: molecules, isLoading } = useCollection(molsQuery);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMol, setEditingMol] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleExport = async () => {
    window.open('/api/molecules/bulk', '_blank');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').map(l => l.trim()).filter(l => l);
      const headers = lines[0].split(',').map(h => h.trim());
      
      const molecules = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const obj: any = {};
        headers.forEach((h, i) => {
          obj[h] = values[i];
        });
        return obj;
      });

      try {
        const res = await fetch('/api/molecules/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(molecules)
        });
        if (res.ok) {
          toast({ title: "Bulk import success", description: "Registry updated" });
          window.location.reload();
        } else {
          throw new Error('Import failed');
        }
      } catch (err: any) {
        toast({ variant: 'destructive', title: "Import failed", description: err.message });
      }
    };
    reader.readAsText(file);
  };

  const filtered = molecules?.filter(m => {
    const s = searchTerm.toLowerCase();
    return (m.molecule || '').toLowerCase().includes(s) || (m.masterId || '').toLowerCase().includes(s);
  });

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2">
      <SectionHeader title="Formula registry" subtitle="Clinical molecule masters" onBack={onBack}>
        <div className="flex gap-4">
          <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".csv" />
          <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="rounded-full h-12 px-6 font-black text-[10px] border-2 gap-2 text-primary border-primary/20">
            <Upload className="w-4 h-4" /> Bulk Import
          </Button>
          <Button onClick={handleExport} variant="outline" className="rounded-full h-12 px-6 font-black text-[10px] border-2 gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
          <Button onClick={() => { setEditingMol(null); setIsFormOpen(true); }} className="rounded-full h-12 px-8 font-black text-[10px] bg-primary text-white"><Plus className="w-4 h-4" /> New formula</Button>
        </div>
      </SectionHeader>
      <div className="relative"><Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" /><Input placeholder="Search formulas..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="h-16 pl-14 rounded-[32px] border-none bg-white shadow-sm font-black text-sm" /></div>
      <Card className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-gray-50 text-[10px] font-black text-gray-400 border-b">
              <tr><th className="px-10 py-8">Molecule</th><th className="px-10 py-8">Master id</th><th className="px-10 py-8">Clinical form</th><th className="px-10 py-8 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (<tr><td colSpan={4} className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></td></tr>) : filtered?.length === 0 ? (<tr><td colSpan={4} className="p-20 text-center font-bold text-gray-300">No molecules found</td></tr>) : filtered?.map(mol => (
                <tr key={mol.id} className="hover:bg-gray-50/50">
                  <td className="px-10 py-8 font-black text-sm">{mol.molecule}</td>
                  <td className="px-10 py-8 text-[11px] font-bold text-gray-500">{mol.masterId}</td>
                  <td className="px-10 py-8"><Badge variant="outline" className="font-black text-[8px]">{mol.form}</Badge></td>
                  <td className="px-10 py-8 text-right"><div className="flex justify-end gap-2"><Button variant="ghost" size="icon" onClick={() => { setEditingMol(mol); setIsFormOpen(true); }}><Edit2 className="w-4 h-4 text-gray-400" /></Button><Button variant="ghost" size="icon" onClick={() => deleteDocumentNonBlocking(doc(db, 'moleculeMaster', mol.id))}><Trash2 className="w-4 h-4 text-red-300" /></Button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}><DialogContent className="rounded-[40px] max-lg border-none p-0 overflow-hidden"><div className="bg-primary p-8 text-white"><DialogTitle className="text-2xl font-black">Clinical formula</DialogTitle></div><div className="p-8"><MoleculeForm db={db} initialData={editingMol} onSuccess={() => setIsFormOpen(false)} /></div></DialogContent></Dialog>
    </div>
  );
}

function MoleculeForm({ db, initialData, onSuccess }: { db: any, initialData?: any, onSuccess: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ molecule: initialData?.molecule || '', masterId: initialData?.masterId || '', form: initialData?.form || 'Tablet' });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, updatedAt: new Date() };

    try {
      // 1. Sync to MongoDB
      const method = initialData ? 'PUT' : 'POST';
      const url = initialData ? `/api/molecules/${initialData.id || initialData._id}` : '/api/molecules';
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      // 2. Sync to Firestore
      initialData?.id ? updateDocumentNonBlocking(doc(db, 'moleculeMaster', initialData.id), { ...payload, updatedAt: serverTimestamp() }) : addDocumentNonBlocking(collection(db, 'moleculeMaster'), { ...payload, createdAt: serverTimestamp() });
      
      toast({ title: "Molecule synchronized" });
      onSuccess();
    } catch (err: any) {
      toast({ variant: 'destructive', title: "Sync failed", description: err.message });
    }
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2"><Label className="text-[10px] font-black">Molecule name</Label><Input value={form.molecule} onChange={e => setForm({...form, molecule: e.target.value})} required className="rounded-2xl h-14 bg-gray-50 border-none font-bold" /></div>
      <div className="space-y-2"><Label className="text-[10px] font-black">Master id</Label><Input value={form.masterId} onChange={e => setForm({...form, masterId: e.target.value})} required className="rounded-2xl h-14 bg-gray-50 border-none font-bold" /></div>
      <div className="space-y-2"><Label className="text-[10px] font-black">Form</Label><Select value={form.form} onValueChange={v => setForm({...form, form: v})}><SelectTrigger className="rounded-2xl h-14 bg-gray-50 border-none font-bold"><SelectValue /></SelectTrigger><SelectContent className="rounded-2xl">
        <SelectItem value="Tablet">Tablet</SelectItem>
        <SelectItem value="Tablet ER">Tablet ER</SelectItem>
        <SelectItem value="Tablet PR">Tablet PR</SelectItem>
        <SelectItem value="Tablet SR">Tablet SR</SelectItem>
        <SelectItem value="Capsule">Capsule</SelectItem>
        <SelectItem value="Capsule ER">Capsule ER</SelectItem>
        <SelectItem value="Syrup">Syrup</SelectItem>
        <SelectItem value="Injection">Injection</SelectItem>
        <SelectItem value="Gel">Gel</SelectItem>
        <SelectItem value="Cream">Cream</SelectItem>
        <SelectItem value="Ointment">Ointment</SelectItem>
        <SelectItem value="Drops">Drops</SelectItem>
        <SelectItem value="Sachet">Sachet</SelectItem>
        <SelectItem value="Liquid">Liquid</SelectItem>
      </SelectContent></Select></div>
      <Button type="submit" className="w-full h-16 rounded-full font-black bg-primary text-white">Save registry entry</Button>
    </form>
  );
}

function EnquiriesTab({ db, isVerified, onBack }: { db: any, isVerified: boolean, onBack: () => void }) {
  const presQuery = useMemoFirebase(() => isVerified ? query(collectionGroup(db, 'prescriptions'), limit(50)) : null, [db, isVerified]);
  const { data: enquiries, isLoading } = useCollection(presQuery);
  const [selectedEnquiry, setSelectedEnquiry] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<'Pending' | 'Open' | 'Completed'>('Pending');

  const filteredEnquiries = enquiries?.filter(enq => {
    const status = (enq.status || 'Pending Review').toLowerCase();
    if (statusFilter === 'Pending') return status === 'pending review';
    if (statusFilter === 'Open') return status === 'in process' || status === 'processing';
    if (statusFilter === 'Completed') return status === 'digitized' || status === 'completed';
    return false;
  });

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2">
      <SectionHeader title="Clinical enquiries" subtitle="Prescription review queue" onBack={onBack} />
      <div className="bg-white p-1 rounded-full border flex w-fit gap-1 mb-8">
        {['Pending', 'Open', 'Completed'].map((status) => (<button key={status} onClick={() => setStatusFilter(status as any)} className={cn("px-8 py-2.5 rounded-full text-[10px] font-black tracking-widest transition-all", statusFilter === status ? "bg-primary text-white shadow-lg scale-105" : "text-gray-400 hover:bg-gray-50")}>{status}</button>))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-8">
        {isLoading ? (<div className="col-span-full py-20 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></div>) : (!filteredEnquiries || filteredEnquiries.length === 0) ? (<div className="col-span-full py-20 text-center font-black text-gray-400 text-[10px]">No matches found</div>) : filteredEnquiries.map(enq => (
          <Card key={enq.id} className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white p-6 hover:shadow-2xl transition-all">
            <div className="aspect-[3/4] rounded-3xl bg-gray-50 mb-6 overflow-hidden border relative">{enq?.imageUrl && <img src={enq.imageUrl} className="w-full h-full object-cover" alt="" />}<div className="absolute top-4 right-4"><Badge className="bg-primary text-white text-[8px] font-black">{enq?.status || 'Pending'}</Badge></div></div>
            <p className="font-black text-sm mb-6 truncate">{enq?.patientName || 'Patient'}</p>
            {statusFilter !== 'Completed' && (<Button onClick={() => setSelectedEnquiry(enq)} className="w-full rounded-full h-12 font-black text-[10px] bg-primary text-white gap-2"><Wand2 className="w-3.5 h-3.5" /> Digitize</Button>)}
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedEnquiry} onOpenChange={o => !o && setSelectedEnquiry(null)}>
        <DialogContent className="rounded-[40px] max-w-5xl border-none p-0 overflow-hidden">
          <div className="bg-primary p-8 text-white flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-black">Clinical digitization</DialogTitle>
              <p className="text-[10px] font-black text-white/60 tracking-widest mt-1 uppercase">Powered by Genkit AI</p>
            </div>
          </div>
          <div className="p-8 h-[80vh] overflow-hidden flex flex-col md:flex-row gap-8">
             <div className="flex-1 bg-gray-50 rounded-[32px] border overflow-hidden relative group">
                {selectedEnquiry?.imageUrl && <img src={selectedEnquiry.imageUrl} className="w-full h-full object-contain" alt="Prescription" />}
                <div className="absolute top-6 left-6 flex gap-2">
                  <Badge className="bg-white/90 backdrop-blur text-primary border-none font-black text-[9px] px-3 py-1.5 shadow-sm">Patient: {selectedEnquiry?.patientName}</Badge>
                </div>
             </div>
             <div className="w-full md:w-[400px] flex flex-col gap-6 overflow-y-auto pr-2 scrollbar-hide">
                <DigitizePanel enquiry={selectedEnquiry} db={db} onComplete={() => setSelectedEnquiry(null)} />
             </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DigitizePanel({ enquiry, db, onComplete }: { enquiry: any, db: any, onComplete: () => void }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [meds, setMeds] = useState<any[]>(enquiry?.digitizedData?.medications || []);
  const [summary, setSummary] = useState(enquiry?.digitizedData?.analysisSummary || '');
  const [isLegible, setIsLegible] = useState(enquiry?.digitizedData?.isLegible ?? true);
  const { toast } = useToast();
  const functions = useFunctions();

  const handleAIAnalysis = async () => {
    if (!enquiry?.imageUrl) return;
    setIsAnalyzing(true);
    try {
      const analyzeFn = httpsCallable<any, any>(functions, 'prescriptionAnalysisAndPreFillFlow');
      const { data: result } = await analyzeFn({
        prescriptionImageUri: enquiry.imageUrl
      });

      if (result) {
        setMeds(result.medications || []);
        setSummary(result.analysisSummary || '');
        setIsLegible(result.isLegible);
        toast({ title: "Analysis complete", description: "Medications extracted successfully." });
      }
    } catch (err) {
      console.error("AI Analysis Error:", err);
      toast({ variant: "destructive", title: "Analysis failed", description: "Cloud processing error." });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const updateMed = (index: number, field: string, value: any) => {
    const newMeds = [...meds];
    newMeds[index] = { ...newMeds[index], [field]: value };
    setMeds(newMeds);
  };

  const removeMed = (index: number) => {
    setMeds(meds.filter((_, i) => i !== index));
  };

  const addMed = () => {
    setMeds([...meds, { drugName: '', dosage: '', quantity: 1, instructions: '' }]);
  };

  const handleSave = async () => {
    try {
      // Find the specific prescription document within the user's subcollection
      // Note: enquiry.id is the document ID, but we need the path. 
      // Since it's from collectionGroup, we can use the ref if available, or build it.
      // But useCollection with collectionGroup usually gives docs with id and data.
      // We need to find the user ID. 
      // Most prescriptions uploaded in this app are at /userProfiles/{userId}/prescriptions/{id}
      
      // Let's assume enquiry has userId or we can extract it from the path if we had access to the doc object.
      // Since we are using useCollection hook, it might not return the full path easily.
      // However, the blueprint says userProfiles/{userId}/prescriptions.
      
      // I'll try to find the document reference.
      const userId = enquiry.userId;
      if (!userId) {
        toast({ variant: "destructive", title: "Error", description: "User ID not found for this enquiry." });
        return;
      }

      const docRef = doc(db, 'userProfiles', userId, 'prescriptions', enquiry.id);
      
      await updateDocumentNonBlocking(docRef, {
        digitizedData: {
          medications: meds,
          analysisSummary: summary,
          isLegible: isLegible,
          digitizedAt: serverTimestamp()
        },
        status: 'Digitized'
      });

      toast({ title: "Saving digital record", description: "Prescription successfully digitized." });
      onComplete();
    } catch (err) {
      toast({ variant: "destructive", title: "Save failed" });
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="space-y-4">
        <Button 
          onClick={handleAIAnalysis} 
          disabled={isAnalyzing} 
          className="w-full h-16 rounded-2xl bg-accent hover:bg-accent/90 text-white font-black tracking-widest gap-3 shadow-xl shadow-accent/20"
        >
          {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          {meds.length > 0 ? "Re-run AI Analysis" : "Auto-digitize with AI"}
        </Button>

        {!isLegible && (
          <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex gap-3">
             <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
             <p className="text-[10px] font-bold text-red-800 leading-tight">AI flagged this image as potentially illegible. Please review manually.</p>
          </div>
        )}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto pr-2 scrollbar-hide min-h-0">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-black text-gray-400 tracking-widest uppercase">Medications ({meds.length})</h3>
          <Button variant="ghost" size="sm" onClick={addMed} className="h-8 rounded-lg font-black text-[9px] text-primary gap-1"><PlusCircle className="w-3 h-3" /> Add item</Button>
        </div>

        <div className="space-y-3">
          {meds.map((med, i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 space-y-4 relative group/item hover:border-primary/20 transition-colors shadow-sm">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => removeMed(i)} 
                className="absolute top-4 right-4 h-8 w-8 rounded-full text-gray-300 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
              
              <div className="space-y-2">
                <Label className="text-[8px] font-black text-gray-400">Drug name</Label>
                <Input 
                  value={med.drugName} 
                  onChange={e => updateMed(i, 'drugName', e.target.value)} 
                  className="h-10 rounded-xl bg-gray-50 border-none font-bold text-xs" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-[8px] font-black text-gray-400">Dosage</Label>
                  <Input 
                    value={med.dosage} 
                    onChange={e => updateMed(i, 'dosage', e.target.value)} 
                    className="h-10 rounded-xl bg-gray-50 border-none font-bold text-xs" 
                    placeholder="e.g. 500mg"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[8px] font-black text-gray-400">Qty</Label>
                  <Input 
                    type="number" 
                    value={med.quantity} 
                    onChange={e => updateMed(i, 'quantity', parseInt(e.target.value))} 
                    className="h-10 rounded-xl bg-gray-50 border-none font-bold text-xs" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[8px] font-black text-gray-400">Instructions</Label>
                <Input 
                  value={med.instructions} 
                  onChange={e => updateMed(i, 'instructions', e.target.value)} 
                  className="h-10 rounded-xl bg-gray-50 border-none font-bold text-xs italic" 
                  placeholder="e.g. 1-0-1 after food"
                />
              </div>
            </div>
          ))}

          {meds.length === 0 && !isAnalyzing && (
            <div className="py-12 text-center border-2 border-dashed rounded-[32px] border-gray-100">
               <ClipboardList className="w-8 h-8 text-gray-200 mx-auto mb-3" />
               <p className="text-[10px] font-black text-gray-300 tracking-widest uppercase">No medications added</p>
            </div>
          )}
        </div>

        <div className="space-y-2 pt-4">
          <Label className="text-[10px] font-black text-gray-400 tracking-widest uppercase ml-1">AI Assistant Notes</Label>
          <Textarea 
            value={summary} 
            onChange={e => setSummary(e.target.value)} 
            placeholder="AI observations..." 
            className="rounded-2xl bg-gray-50 border-none font-bold text-xs min-h-[100px] resize-none p-4"
          />
        </div>
      </div>

      <div className="pt-6 border-t mt-auto">
        <Button 
          onClick={handleSave} 
          disabled={meds.length === 0}
          className="w-full h-16 rounded-full font-black tracking-widest bg-primary text-white shadow-2xl gap-3"
        >
          Confirm & Digitization <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function PromoCodesTab({ db, isVerified, onBack }: { db: any, isVerified: boolean, onBack: () => void }) {
  const promosQuery = useMemoFirebase(() => isVerified ? query(collection(db, 'promocodes'), orderBy('code', 'asc'), limit(50)) : null, [db, isVerified]);
  const { data: promos, isLoading } = useCollection(promosQuery);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<any>(null);

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2">
      <SectionHeader title="Clinical coupons" subtitle="Manage patient offers" onBack={onBack}><Button onClick={() => { setEditingPromo(null); setIsFormOpen(true); }} className="rounded-full h-12 px-8 font-black text-[10px] bg-primary text-white"><Plus className="w-4 h-4" /> New campaign</Button></SectionHeader>
      <Card className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] font-black text-gray-400 border-b">
              <tr><th className="px-10 py-8">Code</th><th className="px-10 py-8">Value</th><th className="px-10 py-8">Status</th><th className="px-10 py-8 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (<tr><td colSpan={4} className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></td></tr>) : (!promos || promos.length === 0) ? (<tr><td colSpan={4} className="p-20 text-center font-bold text-gray-300">No active campaigns</td></tr>) : promos?.map(promo => (
                <tr key={promo.id} className="hover:bg-gray-50/50">
                  <td className="px-10 py-8 font-black text-sm text-primary">{promo.code}</td>
                  <td className="px-10 py-8 font-black text-accent">{Number(promo.discountValue).toFixed(2)}{promo.discountType === 'percentage' ? '%' : '₹'}</td>
                  <td className="px-10 py-8"><Badge className={cn("rounded-full font-black text-[8px]", promo.isActive ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400")}>{promo.isActive ? 'Active' : 'Disabled'}</Badge></td>
                  <td className="px-10 py-8 text-right"><Button variant="ghost" size="icon" onClick={() => { setEditingPromo(promo); setIsFormOpen(true); }}><Edit2 className="w-4 h-4 text-gray-400" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}><DialogContent className="rounded-[40px] max-lg border-none p-0 overflow-hidden"><div className="bg-primary p-8 text-white"><DialogTitle className="text-2xl font-black">Coupon config</DialogTitle></div><div className="p-8"><PromoCodeForm db={db} initialData={editingPromo} onSuccess={() => setIsFormOpen(false)} /></div></DialogContent></Dialog>
    </div>
  );
}

function PromoCodeForm({ db, initialData, onSuccess }: { db: any, initialData?: any, onSuccess: () => void }) {
  const [form, setForm] = useState({ code: initialData?.code || '', description: initialData?.description || '', discountType: initialData?.discountType || 'fixed', discountValue: initialData?.discountValue || 0, minOrderValue: initialData?.minOrderValue || 0, isActive: initialData?.isActive ?? true });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, updatedAt: serverTimestamp() };
    initialData?.id ? updateDocumentNonBlocking(doc(db, 'promocodes', initialData.id), payload) : addDocumentNonBlocking(collection(db, 'promocodes'), { ...payload, createdAt: serverTimestamp() });
    onSuccess();
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2"><Label className="text-[10px] font-black">Code</Label><Input value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} required className="rounded-2xl h-14 bg-gray-50 border-none font-black text-primary" /></div>
        <div className="space-y-2"><Label className="text-[10px] font-black">Type</Label><Select value={form.discountType} onValueChange={v => setForm({...form, discountType: v})}><SelectTrigger className="rounded-2xl h-14 bg-gray-50 border-none font-bold"><SelectValue /></SelectTrigger><SelectContent className="rounded-2xl"><SelectItem value="fixed">Fixed (₹)</SelectItem><SelectItem value="percentage">Percentage (%)</SelectItem></SelectContent></Select></div>
        <div className="space-y-2"><Label className="text-[10px] font-black">Value</Label><Input type="number" value={form.discountValue} onChange={e => setForm({...form, discountValue: Number(e.target.value)})} required className="rounded-2xl h-14 bg-gray-50 border-none font-bold" /></div>
        <div className="space-y-2"><Label className="text-[10px] font-black">Min purchase</Label><Input type="number" value={form.minOrderValue} onChange={e => setForm({...form, minOrderValue: Number(e.target.value)})} className="rounded-2xl h-14 bg-gray-50 border-none font-bold" /></div>
        <div className="flex items-center space-x-2 pt-2"><Checkbox id="promo-active" checked={form.isActive} onCheckedChange={c => setForm({...form, isActive: !!c})} /><Label htmlFor="promo-active" className="text-[10px] font-black cursor-pointer">Live</Label></div>
      </div>
      <Button type="submit" className="w-full h-16 rounded-full font-black bg-primary text-white">Commit campaign</Button>
    </form>
  );
}

function FeesTab({ db, isVerified, onBack }: { db: any, isVerified: boolean, onBack: () => void }) {
  const feesQuery = useMemoFirebase(() => isVerified ? query(collection(db, 'fees'), orderBy('name', 'asc'), limit(50)) : null, [db, isVerified]);
  const { data: fees, isLoading } = useCollection(feesQuery);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFee, setEditingFee] = useState<any>(null);

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2">
      <SectionHeader title="Clinical fees" subtitle="Manage dynamic charges" onBack={onBack}><Button onClick={() => { setEditingFee(null); setIsFormOpen(true); }} className="rounded-full h-12 px-8 font-black text-[10px] bg-primary text-white"><Plus className="w-4 h-4" /> Add charge</Button></SectionHeader>
      <Card className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] font-black text-gray-400 border-b">
              <tr><th className="px-10 py-8">Charge name</th><th className="px-10 py-8">Pricing</th><th className="px-10 py-8">Status</th><th className="px-10 py-8 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (<tr><td colSpan={4} className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></td></tr>) : (!fees || fees.length === 0) ? (<tr><td colSpan={4} className="p-20 text-center font-bold text-gray-300">No fees found</td></tr>) : fees?.map(fee => (
                <tr key={fee.id} className="hover:bg-gray-50/50">
                  <td className="px-10 py-8 font-black text-sm">{fee.name}</td>
                  <td className="px-10 py-8 font-black text-gray-900">₹{Number(fee.discountedAmount).toFixed(2)}</td>
                  <td className="px-10 py-8"><Badge className={cn("rounded-full font-black text-[8px]", fee.isActive ? "bg-accent text-white" : "bg-gray-100 text-gray-400")}>{fee.isActive ? 'Enabled' : 'Paused'}</Badge></td>
                  <td className="px-10 py-8 text-right"><Button variant="ghost" size="icon" onClick={() => { setEditingFee(fee); setIsFormOpen(true); }}><Edit2 className="w-4 h-4 text-gray-400" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}><DialogContent className="rounded-[40px] max-lg border-none p-0 overflow-hidden"><div className="bg-primary p-8 text-white"><DialogTitle className="text-2xl font-black">Fee structure</DialogTitle></div><div className="p-8"><FeeForm db={db} initialData={editingFee} onSuccess={() => setIsFormOpen(false)} /></div></DialogContent></Dialog>
    </div>
  );
}

function FeeForm({ db, initialData, onSuccess }: { db: any, initialData?: any, onSuccess: () => void }) {
  const [form, setForm] = useState({ name: initialData?.name || '', discountedAmount: initialData?.discountedAmount || 0, type: initialData?.type || 'fixed', minPurchase: initialData?.minPurchase || 0, isActive: initialData?.isActive ?? true });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, updatedAt: serverTimestamp() };
    initialData?.id ? updateDocumentNonBlocking(doc(db, 'fees', initialData.id), payload) : addDocumentNonBlocking(collection(db, 'fees'), { ...payload, createdAt: serverTimestamp() });
    onSuccess();
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2"><Label className="text-[10px] font-black">Fee label</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="rounded-2xl h-14 bg-gray-50 border-none font-bold" /></div>
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2"><Label className="text-[10px] font-black">Charge amount</Label><Input type="number" value={form.discountedAmount} onChange={e => setForm({...form, discountedAmount: Number(e.target.value)})} required className="rounded-2xl h-14 bg-gray-50 border-none font-bold" /></div>
        <div className="space-y-2"><Label className="text-[10px] font-black">Free above</Label><Input type="number" value={form.minPurchase} onChange={e => setForm({...form, minPurchase: Number(e.target.value)})} className="rounded-2xl h-14 bg-gray-50 border-none font-bold" /></div>
        <div className="flex items-center space-x-2 pt-8"><Checkbox id="fee-active" checked={form.isActive} onCheckedChange={c => setForm({...form, isActive: !!c})} /><Label htmlFor="fee-active" className="text-[10px] font-black cursor-pointer">Active</Label></div>
      </div>
      <Button type="submit" className="w-full h-16 rounded-full font-black bg-primary text-white">Update logistics policy</Button>
    </form>
  );
}

function CustomersTab({ db, isVerified, onBack }: { db: any, isVerified: boolean, onBack: () => void }) {
  const usersQuery = useMemoFirebase(() => isVerified ? query(collection(db, 'userProfiles'), orderBy('createdAt', 'desc'), limit(50)) : null, [db, isVerified]);
  const { data: users, isLoading } = useCollection(usersQuery);
  const [searchTerm, setSearchTerm] = useState('');
  const filteredUsers = users?.filter(patient => {
    const s = searchTerm.toLowerCase();
    const name = String(patient.name || '').toLowerCase();
    const id = String(patient.phone || patient.email || '').toLowerCase();
    return name.includes(s) || id.includes(s);
  });
  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2">
      <SectionHeader title="Patient registry" subtitle="Verified account sync" onBack={onBack} />
      <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" /><Input placeholder="Search registry..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 rounded-2xl h-12 bg-white border-none font-bold text-xs" /></div>
      <Card className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] font-black text-gray-400 border-b">
              <tr><th className="px-10 py-8">Name</th><th className="px-10 py-8">Identifier</th><th className="px-10 py-8 text-right">Action</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (<tr><td colSpan={3} className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></td></tr>) : filteredUsers?.map(patient => (
                <tr key={patient.id} className="hover:bg-gray-50/50">
                  <td className="px-10 py-8 font-black text-sm">{patient.name || 'SahiMed member'}</td>
                  <td className="px-10 py-8 font-bold text-sm text-primary">{patient.phone || patient.email}</td>
                  <td className="px-10 py-8 text-right"><Button variant="ghost" size="icon"><Eye className="w-4 h-4" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function AlertsTab({ db, isVerified, onBack }: { db: any, isVerified: boolean, onBack: () => void }) {
  const alertsQuery = useMemoFirebase(() => isVerified ? query(collection(db, 'systemAlerts'), orderBy('createdAt', 'desc'), limit(20)) : null, [db, isVerified]);
  const { data: alerts, isLoading } = useCollection(alertsQuery);
  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2">
      <SectionHeader title="Clinical alerts" subtitle="System broadcasts" onBack={onBack}><Button className="rounded-full h-12 px-8 font-black text-[10px] bg-red-600 text-white"><Plus className="w-4 h-4" /> New alert</Button></SectionHeader>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isLoading ? (<div className="col-span-full py-20 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></div>) : alerts?.map(alert => (
          <Card key={alert.id} className="rounded-[40px] border-none shadow-sm bg-white p-8">
            <Badge className="bg-red-100 text-red-600 font-black text-[8px] mb-4">Live</Badge>
            <h3 className="font-black text-sm mb-2">{alert.title}</h3>
            <p className="text-[11px] font-bold text-gray-500">{alert.message}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

function BannersTab({ db, isVerified, onBack }: { db: any, isVerified: boolean, onBack: () => void }) {
  const bannersQuery = useMemoFirebase(() => isVerified ? query(collection(db, 'banners'), orderBy('order', 'asc')) : null, [db, isVerified]);
  const { data: banners, isLoading } = useCollection(bannersQuery);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any>(null);

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2">
      <SectionHeader title="Storefront banners" subtitle="Manage carousel promotions" onBack={onBack}>
        <Button onClick={() => { setEditingBanner(null); setIsFormOpen(true); }} className="rounded-full h-12 px-8 font-black text-[10px] bg-primary text-white"><Plus className="w-4 h-4" /> Add banner</Button>
      </SectionHeader>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (<div className="col-span-full py-20 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></div>) : banners?.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-[40px] border-none shadow-sm">
            <ImageIcon className="w-12 h-12 text-gray-100 mx-auto mb-4" />
            <p className="text-[10px] font-black text-gray-400">No custom banners found. Using fallbacks.</p>
          </div>
        ) : banners?.map(banner => (
          <Card key={banner.id} className="rounded-[32px] overflow-hidden border-none shadow-sm bg-white group">
            <div className="aspect-[24/9] relative bg-gray-50">
              {banner.imageUrl && <img src={banner.imageUrl} className="w-full h-full object-cover" alt="" />}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button variant="secondary" size="icon" onClick={() => { setEditingBanner(banner); setIsFormOpen(true); }} className="rounded-full"><Edit2 className="w-4 h-4" /></Button>
                <Button variant="destructive" size="icon" onClick={() => deleteDocumentNonBlocking(doc(db, 'banners', banner.id))} className="rounded-full"><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Badge className={cn("text-[8px] font-black uppercase tracking-widest", banner.isActive ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400")}>{banner.isActive ? 'Active' : 'Inactive'}</Badge>
                <span className="text-[10px] font-black text-gray-300">Order: {banner.order}</span>
              </div>
              <h3 className="font-black text-xs truncate text-gray-900 tracking-tight">{banner.title || 'No title'}</h3>
            </div>
          </Card>
        ))}
      </div>
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="rounded-[40px] max-w-2xl border-none p-0 overflow-hidden">
          <div className="bg-primary p-8 text-white"><DialogTitle className="text-2xl font-black">Banner configuration</DialogTitle></div>
          <div className="p-8"><BannerForm db={db} initialData={editingBanner} onSuccess={() => setIsFormOpen(false)} /></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BannerForm({ db, initialData, onSuccess }: { db: any, initialData?: any, onSuccess: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    title: initialData?.title || 'Upto 81% discount',
    subtitle: initialData?.subtitle || 'On all medicines & health products',
    hindiTagline: initialData?.hindiTagline || 'सही दवा, सही दाम',
    imageUrl: initialData?.imageUrl || '',
    isActive: initialData?.isActive ?? true,
    order: initialData?.order || 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, updatedAt: new Date() };

    try {
      // 1. Sync to MongoDB
      const method = initialData?.id ? 'PUT' : 'POST';
      const url = initialData?.id ? `/api/banners/${initialData.id || initialData._id}` : '/api/banners';
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      // 2. Sync to Firestore
      if (initialData?.id) {
        updateDocumentNonBlocking(doc(db, 'banners', initialData.id), { ...payload, updatedAt: serverTimestamp() });
      } else {
        addDocumentNonBlocking(collection(db, 'banners'), { ...payload, createdAt: serverTimestamp() });
      }
      
      toast({ title: "Banner synchronized" });
      onSuccess();
    } catch (err: any) {
      toast({ variant: 'destructive', title: "Sync failed", description: err.message });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2"><Label className="text-[10px] font-black text-gray-400 ml-1">Main title (Left)</Label><Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="rounded-xl h-14 bg-gray-50 border-none font-bold" placeholder="e.g. Upto 81% discount" /></div>
        <div className="space-y-2"><Label className="text-[10px] font-black text-gray-400 ml-1">Subtitle (Left)</Label><Input value={form.subtitle} onChange={e => setForm({...form, subtitle: e.target.value})} className="rounded-xl h-14 bg-gray-50 border-none font-bold" placeholder="On all medicines..." /></div>
        <div className="space-y-2"><Label className="text-[10px] font-black text-gray-400 ml-1">Hindi tagline (Bottom)</Label><Input value={form.hindiTagline} onChange={e => setForm({...form, hindiTagline: e.target.value})} className="rounded-xl h-14 bg-gray-50 border-none font-bold" placeholder="सही दवा, सही दाम" /></div>
        <div className="space-y-2"><Label className="text-[10px] font-black text-gray-400 ml-1">Display order</Label><Input type="number" value={form.order} onChange={e => setForm({...form, order: Number(e.target.value)})} className="rounded-xl h-14 bg-gray-50 border-none font-bold" /></div>
      </div>
      <Button type="submit" className="w-full h-20 rounded-full font-black tracking-[0.2em] bg-primary text-white shadow-2xl active:scale-[0.98] transition-all">
        {initialData?.id ? 'Commit updates' : 'Sync visual promotion'}
      </Button>
    </form>
  );
}

type AdminTab = 'overview' | 'enquiries' | 'fulfillment' | 'promocodes' | 'fees' | 'categories' | 'customers' | 'stockAlerts' | 'itemMaster' | 'moleculeMaster' | 'banners';
