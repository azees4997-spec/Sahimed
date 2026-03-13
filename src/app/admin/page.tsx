
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
  X
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
  setDocumentNonBlocking,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking,
  addDocumentNonBlocking,
  initializeFirebase
} from '@/firebase';
import { doc, collection, query, collectionGroup, getDoc, getDocs, serverTimestamp, orderBy, where, writeBatch, limit } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";

// --- SHARED UI ---

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
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <LogOut className="w-4 h-4" />}
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
      </main>
    </div>
  );
}

// --- OVERVIEW DASHBOARD (No-Fetch Optimized) ---

function OverviewTab({ setTab }: { setTab: (t: AdminTab) => void }) {
  // NAVIGATION TILES: No clinical queries are triggered on the overview dashboard to save reads.
  const stats = [
    { label: 'INQUIRIES', icon: FileText, desc: 'Prescription Digitization', tab: 'enquiries', color: 'text-blue-600' },
    { label: 'ORDERS', icon: ShoppingBag, desc: 'Fulfillment & Logistics', tab: 'fulfillment', color: 'text-blue-500' },
    { label: 'COUPONS', icon: Ticket, desc: 'Marketing Campaigns', tab: 'promocodes', color: 'text-purple-500' },
    { label: 'FEES', icon: Receipt, desc: 'Billing Adjustments', tab: 'fees', color: 'text-orange-500' },
    { label: 'CATEGORIES', icon: Tag, desc: 'Therapeutic Taxonomy', tab: 'categories', color: 'text-pink-500' },
    { label: 'CUSTOMERS', icon: Users, desc: 'Patient Registry', tab: 'customers', color: 'text-indigo-500' },
    { label: 'ALERTS', icon: Megaphone, desc: 'System Broadcasts', tab: 'stockAlerts', color: 'text-red-500' },
    { label: 'CATALOG', icon: Package, desc: 'Product Master Data', tab: 'itemMaster', color: 'text-green-600' },
    { label: 'FORMULAS', icon: Dna, desc: 'Molecule Registry', tab: 'moleculeMaster', color: 'text-green-500' },
  ];

  return (
    <div className="animate-in fade-in duration-500">
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {stats.map(card => (
          <Card key={card.label} className="rounded-[40px] p-8 border-none shadow-sm hover:shadow-2xl transition-all cursor-pointer bg-white group text-center flex flex-col items-center justify-center min-h-[220px]" onClick={() => setTab(card.tab as AdminTab)}>
            <div className={cn("w-16 h-16 rounded-[24px] bg-gray-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform", card.color)}>
               <card.icon className="w-8 h-8" />
            </div>
            <CardTitle className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-2">{card.label}</CardTitle>
            <p className="text-[10px] font-black text-gray-900 uppercase tracking-tighter opacity-60 group-hover:opacity-100 transition-opacity">Manage Portal</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

// --- FULFILLMENT HUB ---

function FulfillmentTab({ db, isVerified, onBack }: { db: any, isVerified: boolean, onBack: () => void }) {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // FETCH TRIGGER: Only triggered when the Fulfillment tab is active.
  const ordersQuery = useMemoFirebase(() => {
    if (!db || !isVerified) return null;
    return query(collectionGroup(db, 'orders'), limit(100)); // Strict limit for targeted sessions
  }, [db, isVerified]);

  const { data: rawOrders, isLoading } = useCollection(ordersQuery);
  const { toast } = useToast();

  const orders = useMemo(() => {
    if (!rawOrders) return null;
    let filtered = [...rawOrders];

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(o => (o.status || 'Pending').toUpperCase() === statusFilter);
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
    toast({ title: "Manifest Exported" });
  };

  const handleStatusUpdate = (order: any, newStatus: string) => {
    if (newStatus === 'Shipping') { setSelectedOrder(order); setIsShippingDialogOpen(true); return; }
    if (!order?.userId || !order?.id) return;
    updateDocumentNonBlocking(doc(db, 'userProfiles', order.userId, 'orders', order.id), { status: newStatus });
    toast({ title: "Status Updated" });
  };

  const finalizeShipping = () => {
    if (!selectedOrder) return;
    updateDocumentNonBlocking(doc(db, 'userProfiles', selectedOrder.userId, 'orders', selectedOrder.id), { status: 'Shipping', carrier: shippingData.carrier, trackingId: shippingData.trackingId });
    setIsShippingDialogOpen(false);
    toast({ title: "Shipping Linked" });
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2">
      <SectionHeader title="Fulfillment Hub" subtitle="Active order processing" onBack={onBack}>
        <Button onClick={handleExport} variant="outline" className="rounded-full h-12 px-6 font-black text-[10px] uppercase border-2 gap-2">
          <Download className="w-4 h-4" /> Download Manifest
        </Button>
      </SectionHeader>

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="bg-white p-1 rounded-full border flex w-fit gap-1">
          {['ALL', 'PENDING', 'SHIPPING', 'DELIVERED'].map((status) => (
            <button key={status} onClick={() => setStatusFilter(status)} className={cn("px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all", statusFilter === status ? "bg-primary text-white shadow-lg scale-105" : "text-gray-400 hover:bg-gray-50")}>{status}</button>
          ))}
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-3xl border shadow-sm">
          <Calendar className="w-3.5 h-3.5 text-primary ml-2" /><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-10 w-36 rounded-xl border-none bg-gray-50 font-bold text-[10px] uppercase px-3" />
          <span className="text-gray-300 font-bold">→</span><Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-10 w-36 rounded-xl border-none bg-gray-50 font-bold text-[10px] uppercase px-3" />
          {(startDate || endDate) && <Button variant="ghost" size="icon" onClick={() => { setStartDate(''); setEndDate(''); }} className="h-8 w-8 text-red-400"><X className="w-4 h-4" /></Button>}
        </div>
      </div>
      
      <Card className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[1000px]">
            <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 border-b">
              <tr><th className="px-8 py-6">Order ID</th><th className="px-8 py-6">Date</th><th className="px-8 py-6">Patient</th><th className="px-8 py-6">Address</th><th className="px-8 py-6">Amount</th><th className="px-8 py-6 text-right">Action</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (<tr><td colSpan={6} className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></td></tr>) : (!orders || orders.length === 0) ? (<tr><td colSpan={6} className="p-20 text-center font-bold text-gray-400 uppercase text-[10px]">No orders found</td></tr>) : orders.map(order => (
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
          <div className="bg-primary p-8 text-white"><DialogTitle className="text-2xl font-black uppercase">Order Details</DialogTitle></div>
          <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-hide">
             <div className="grid grid-cols-2 gap-8">
                <div><h4 className="text-[10px] font-black uppercase text-gray-400 mb-2">Patient</h4><p className="font-black text-sm">{selectedOrder?.patientName}</p><p className="text-xs text-gray-500">{selectedOrder?.phoneNumber}</p></div>
                <div><h4 className="text-[10px] font-black uppercase text-gray-400 mb-2">Address</h4><p className="text-[11px] font-bold leading-relaxed">{selectedOrder?.shippingDetails?.street}</p><p className="text-[10px] font-black text-primary uppercase mt-1">PIN: {selectedOrder?.shippingDetails?.pincode}</p></div>
             </div>
             {selectedOrder?.prescriptionUrl && (
               <div className="space-y-3"><h4 className="text-[10px] font-black uppercase text-gray-400">Prescription</h4><div className="rounded-[32px] overflow-hidden aspect-[3/4] bg-gray-50 border"><img src={selectedOrder.prescriptionUrl} className="w-full h-full object-contain" alt="" /></div></div>
             )}
             <div className="bg-gray-50 p-6 rounded-[32px] border space-y-4">
                <h4 className="text-[10px] font-black uppercase text-gray-400 mb-2">Items Breakdown</h4>
                {selectedOrder?.items?.map((it: any, i: number) => (<div key={i} className="flex justify-between items-center"><p className="text-[11px] font-black uppercase">{it.name} x {it.quantity}</p><span className="font-black text-xs">₹{(it.unitPrice * it.quantity).toFixed(2)}</span></div>))}
             </div>
             <div className="flex justify-between items-center border-t pt-6">
               <div><span className="font-black text-[10px] uppercase text-gray-400">Payment</span><Badge className="bg-green-100 text-green-600 ml-2">{selectedOrder?.paymentType}</Badge></div>
               <div className="text-right"><span className="font-black text-[10px] uppercase text-gray-400">Total</span><p className="text-3xl font-black text-accent">₹{Number(selectedOrder?.totalAmount || 0).toFixed(2)}</p></div>
             </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- ITEM MASTER ---

function ItemMasterTab({ db, isVerified, onBack }: { db: any, isVerified: boolean, onBack: () => void }) {
  // FETCH TRIGGER: Only triggered when the Product Master tab is active.
  const medsQuery = useMemoFirebase(() => {
    if (!db || !isVerified) return null;
    return query(collection(db, 'medicines'), orderBy('name', 'asc'), limit(2)); // Strict limit(2) as requested
  }, [db, isVerified]);

  const molsQuery = useMemoFirebase(() => isVerified ? query(collection(db, 'moleculeMaster'), limit(50)) : null, [db, isVerified]);
  const { data: medicines, isLoading } = useCollection(medsQuery);
  const { data: molecules } = useCollection(molsQuery);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const moleculeLookup = (molecules || []).reduce((acc: any, m: any) => { acc[m.id] = m.molecule; return acc; }, {});
  const filtered = medicines?.filter(m => {
    const s = searchTerm.toLowerCase();
    return (m.name || '').toLowerCase().includes(s) || (m.sku || '').toLowerCase().includes(s);
  });

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2">
      <SectionHeader title="Product Master" subtitle="Targeted Management (Limit: 2)" onBack={onBack}>
        <Button onClick={() => { setEditingItem(null); setIsFormOpen(true); }} className="rounded-full h-12 px-8 font-black text-[10px] uppercase bg-primary text-white"><Plus className="w-4 h-4" /> New Product</Button>
      </SectionHeader>

      <div className="relative"><Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" /><Input placeholder="Search within limited set..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="h-16 pl-14 rounded-[32px] border-none bg-white shadow-sm font-black text-sm uppercase" /></div>

      <Card className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 border-b">
              <tr><th className="px-10 py-8">Clinical Item</th><th className="px-10 py-8">Category</th><th className="px-10 py-8 text-right">Manage</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (<tr><td colSpan={3} className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></td></tr>) : filtered?.length === 0 ? (<tr><td colSpan={3} className="p-20 text-center font-bold text-gray-300">No entries found</td></tr>) : filtered?.map(med => (
                <tr key={med.id} className="hover:bg-gray-50/50">
                  <td className="px-10 py-8"><div className="flex items-center gap-4"><div className="w-12 h-12 bg-gray-50 rounded-2xl p-2 border flex items-center justify-center overflow-hidden">{med.imageUrl ? <img src={med.imageUrl} alt="" className="w-full h-full object-contain" /> : <Package className="w-6 h-6 text-gray-200" />}</div><div className="flex flex-col"><span className="font-black text-sm uppercase">{med.name}</span><span className="text-[9px] text-gray-400 uppercase">{med.sku} • {med.manufacturer}</span></div></div></td>
                  <td className="px-10 py-8"><Badge variant="outline" className="font-black text-[8px] uppercase">{med.category}</Badge></td>
                  <td className="px-10 py-8 text-right"><div className="flex justify-end gap-2"><Button variant="ghost" size="icon" onClick={() => { setEditingItem(med); setIsFormOpen(true); }}><Edit2 className="w-4 h-4 text-gray-400" /></Button><Button variant="ghost" size="icon" onClick={() => deleteDocumentNonBlocking(doc(db, 'medicines', med.id))}><Trash2 className="w-4 h-4 text-red-300" /></Button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="rounded-[40px] max-w-5xl border-none p-0 overflow-hidden">
          <div className="bg-primary p-8 text-white"><DialogTitle className="text-2xl font-black uppercase">Product Profile</DialogTitle></div>
          <div className="p-8 max-h-[80vh] overflow-y-auto scrollbar-hide"><ItemForm db={db} initialData={editingItem} onSuccess={() => setIsFormOpen(false)} /></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ItemForm({ db, initialData, onSuccess }: { db: any, initialData?: any, onSuccess: () => void }) {
  const molsQuery = useMemoFirebase(() => query(collection(db, 'moleculeMaster'), orderBy('molecule', 'asc'), limit(100)), [db]);
  const { data: molecules } = useCollection(molsQuery);
  const { storage } = initializeFirebase();
  const { toast } = useToast();

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
    treatment: initialData?.treatment || ''
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

  const [imageUrls, setImageUrls] = useState<string[]>(() => {
    const arr = initialData?.imageUrls || (initialData?.imageUrl ? [initialData.imageUrl] : []);
    const result = [...arr]; while (result.length < 3) result.push('');
    return result.slice(0, 3);
  });

  const [thumbnailIdx, setThumbnailIdx] = useState<number>(0);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try {
      const storageRef = ref(storage, `medicines/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      const newUrls = [...imageUrls]; newUrls[index] = url; setImageUrls(newUrls);
      toast({ title: "Image Uploaded" });
    } catch (err) { toast({ variant: 'destructive', title: "Upload Failed" }); } finally { setUploading(false); }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalImages = imageUrls.filter(Boolean);
    
    // Determine the document ID for the medicine
    // If we are editing, use the existing ID. If new, use SKU.
    const docId = initialData?.id || form.sku;
    if (!docId) {
      toast({ variant: 'destructive', title: "Identity Error", description: "SKU is required for new products." });
      return;
    }

    const staticPayload = { ...form, imageUrls: finalImages, imageUrl: finalImages[thumbnailIdx] || finalImages[0] || '', updatedAt: serverTimestamp() };
    const livePayload = { mrp: Number(liveData.mrp), sahimed_price: Number(liveData.price), stock_quantity: Number(liveData.availableQuantity), updatedAt: serverTimestamp() };
    
    // Update or Create the medicine document using the confirmed docId
    setDocumentNonBlocking(doc(db, 'medicines', docId), staticPayload, { merge: true });
    
    // Live data is always indexed by SKU
    if (form.sku) {
      setDocumentNonBlocking(doc(db, 'product_live_data', form.sku), livePayload, { merge: true });
    }
    
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="bg-gray-100 p-1 rounded-2xl h-14 w-full flex mb-8">
          <TabsTrigger value="basic" className="flex-1 rounded-xl font-black text-[10px] uppercase">Identity</TabsTrigger>
          <TabsTrigger value="live" className="flex-1 rounded-xl font-black text-[10px] uppercase text-primary">Live Stock</TabsTrigger>
          <TabsTrigger value="images" className="flex-1 rounded-xl font-black text-[10px] uppercase">Media</TabsTrigger>
          <TabsTrigger value="clinical" className="flex-1 rounded-xl font-black text-[10px] uppercase">Clinical</TabsTrigger>
        </TabsList>
        <TabsContent value="basic" className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2 space-y-2"><Label className="text-[10px] font-black uppercase">Medicine Name</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="rounded-2xl h-14 bg-gray-50 border-none font-bold" /></div>
            <div className="space-y-2"><Label className="text-[10px] font-black uppercase">SKU</Label><Input value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} className="rounded-2xl h-14 bg-gray-50 border-none font-bold" /></div>
            <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Manufacturer</Label><Input value={form.manufacturer} onChange={e => setForm({...form, manufacturer: e.target.value})} className="rounded-2xl h-14 bg-gray-50 border-none font-bold" /></div>
            <div className="col-span-2 flex items-center space-x-10 pt-4">
              <div className="flex items-center space-x-2"><Checkbox id="rx-req" checked={form.prescriptionRequired} onCheckedChange={(c) => setForm({...form, prescriptionRequired: !!c})} /><Label htmlFor="rx-req" className="text-[10px] font-black uppercase text-red-500">Rx Required</Label></div>
              <div className="flex items-center space-x-2"><Checkbox id="is-generic" checked={form.isGeneric} onCheckedChange={(c) => setForm({...form, isGeneric: !!c})} /><Label htmlFor="is-generic" className="text-[10px] font-black uppercase text-accent">SahiMed Generic</Label></div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="live" className="space-y-6"><div className="grid grid-cols-3 gap-6 bg-primary/5 p-8 rounded-[32px] border border-primary/10"><div className="space-y-2"><Label className="text-[10px] font-black uppercase text-primary">Live Price</Label><Input type="number" value={liveData.price} onChange={e => setLiveData({...liveData, price: Number(e.target.value)})} className="rounded-2xl h-14 bg-white border-none font-black text-xl" /></div><div className="space-y-2"><Label className="text-[10px] font-black uppercase">MRP</Label><Input type="number" value={liveData.mrp} onChange={e => setLiveData({...liveData, mrp: Number(e.target.value)})} className="rounded-2xl h-14 bg-white border-none font-bold" /></div><div className="space-y-2"><Label className="text-[10px] font-black uppercase">Stock</Label><Input type="number" value={liveData.availableQuantity} onChange={e => setLiveData({...liveData, availableQuantity: Number(e.target.value)})} className="rounded-2xl h-14 bg-white border-none font-bold" /></div></div></TabsContent>
        <TabsContent value="clinical" className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase">Molecule Mapping</Label>
              <Select value={form.moleculeId} onValueChange={v => setForm({...form, moleculeId: v})}>
                <SelectTrigger className="rounded-2xl h-14 bg-gray-50 border-none font-bold"><SelectValue placeholder="Select Molecule" /></SelectTrigger>
                <SelectContent className="rounded-2xl">{molecules?.map(m => (<SelectItem key={m.id} value={m.id}>{m.molecule} ({m.masterId})</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Primary Treatment</Label><Input value={form.treatment} onChange={e => setForm({...form, treatment: e.target.value})} className="rounded-2xl h-14 bg-gray-50 border-none font-bold" /></div>
            <div className="col-span-2 space-y-2"><Label className="text-[10px] font-black uppercase">Clinical Description</Label><Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="rounded-2xl min-h-[100px] bg-gray-50 border-none font-bold" /></div>
          </div>
        </TabsContent>
      </Tabs>
      <Button type="submit" className="w-full h-20 rounded-[32px] font-black uppercase tracking-widest bg-primary text-white shadow-2xl">Save Profile</Button>
    </form>
  );
}

// --- CATEGORIES HUB ---

function CategoriesTab({ db, isVerified, onBack }: { db: any, isVerified: boolean, onBack: () => void }) {
  const catsQuery = useMemoFirebase(() => isVerified ? query(collection(db, 'categories'), orderBy('name', 'asc'), limit(50)) : null, [db, isVerified]);
  const { data: categories, isLoading } = useCollection(catsQuery);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<any>(null);

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2">
      <SectionHeader title="Health Categories" subtitle="Manage therapeutic classes" onBack={onBack}>
        <Button onClick={() => { setEditingCat(null); setIsFormOpen(true); }} className="rounded-full h-12 px-8 font-black text-[10px] uppercase bg-primary text-white"><Plus className="w-4 h-4" /> New Category</Button>
      </SectionHeader>
      <Card className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 border-b">
              <tr><th className="px-10 py-8">Visual</th><th className="px-10 py-8">Category Name</th><th className="px-10 py-8">Description</th><th className="px-10 py-8 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (<tr><td colSpan={4} className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></td></tr>) : (!categories || categories.length === 0) ? (<tr><td colSpan={4} className="p-20 text-center font-bold text-gray-300">No categories found</td></tr>) : categories.map(cat => (
                <tr key={cat.id} className="hover:bg-gray-50/50">
                  <td className="px-10 py-8"><div className="w-12 h-12 rounded-2xl bg-gray-50 border p-2 overflow-hidden flex items-center justify-center">{cat.imageUrl ? <img src={cat.imageUrl} className="w-full h-full object-contain" alt="" /> : <Activity className="text-gray-300 w-6 h-6" />}</div></td>
                  <td className="px-10 py-8 font-black text-sm uppercase">{cat.name}</td>
                  <td className="px-10 py-8 text-[11px] font-bold text-gray-500 max-w-[300px] truncate">{cat.description}</td>
                  <td className="px-10 py-8 text-right"><div className="flex justify-end gap-2"><Button variant="ghost" size="icon" onClick={() => { setEditingCat(cat); setIsFormOpen(true); }}><Edit2 className="w-4 h-4 text-gray-400" /></Button><Button variant="ghost" size="icon" onClick={() => deleteDocumentNonBlocking(doc(db, 'categories', cat.id))}><Trash2 className="w-4 h-4 text-red-300" /></Button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}><DialogContent className="rounded-[40px] max-lg border-none p-0 overflow-hidden"><div className="bg-primary p-8 text-white"><DialogTitle className="text-2xl font-black uppercase">Category Definition</DialogTitle></div><div className="p-8"><CategoryForm db={db} initialData={editingCat} onSuccess={() => setIsFormOpen(false)} /></div></DialogContent></Dialog>
    </div>
  );
}

function CategoryForm({ db, initialData, onSuccess }: { db: any, initialData?: any, onSuccess: () => void }) {
  const { storage } = initializeFirebase();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: initialData?.name || '', description: initialData?.description || '', imageUrl: initialData?.imageUrl || '' });
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try {
      const storageRef = ref(storage, `categories/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      setForm({ ...form, imageUrl: url });
      toast({ title: "Icon Uploaded" });
    } catch (err) { toast({ variant: 'destructive', title: "Upload Failed" }); } finally { setUploading(false); }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, createdAt: initialData?.createdAt || serverTimestamp(), updatedAt: serverTimestamp() };
    initialData?.id ? updateDocumentNonBlocking(doc(db, 'categories', initialData.id), payload) : addDocumentNonBlocking(collection(db, 'categories'), payload);
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col items-center gap-6 mb-8"><div className="w-24 h-24 bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden relative">{form.imageUrl ? <img src={form.imageUrl} className="w-full h-full object-contain p-4" alt="" /> : <Activity className="text-gray-200 w-10 h-10" />}{uploading && <div className="absolute inset-0 bg-white/80 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>}</div><div className="relative"><input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" disabled={uploading} /><Button variant="outline" type="button" className="rounded-full h-10 px-6 font-black uppercase text-[9px] gap-2 border-2"><UploadCloud className="w-3.5 h-3.5" /> {form.imageUrl ? 'Change Icon' : 'Upload Icon'}</Button></div></div>
      <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-gray-400">Category Name</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="rounded-2xl h-14 bg-gray-50 border-none font-bold" /></div>
      <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-gray-400">Description</Label><Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="rounded-2xl min-h-[100px] bg-gray-50 border-none font-bold p-6" /></div>
      <Button type="submit" className="w-full h-16 rounded-full font-black uppercase bg-primary text-white">Save Category</Button>
    </form>
  );
}

// --- FORMULATION ---

function MoleculeMasterTab({ db, isVerified, onBack }: { db: any, isVerified: boolean, onBack: () => void }) {
  const molsQuery = useMemoFirebase(() => isVerified ? query(collection(db, 'moleculeMaster'), orderBy('molecule', 'asc'), limit(50)) : null, [db, isVerified]);
  const { data: molecules, isLoading } = useCollection(molsQuery);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMol, setEditingMol] = useState<any>(null);

  const filtered = molecules?.filter(m => {
    const s = searchTerm.toLowerCase();
    return (m.molecule || '').toLowerCase().includes(s) || (m.masterId || '').toLowerCase().includes(s);
  });

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2">
      <SectionHeader title="Formula Registry" subtitle="Clinical molecule masters" onBack={onBack}>
        <Button onClick={() => { setEditingMol(null); setIsFormOpen(true); }} className="rounded-full h-12 px-8 font-black text-[10px] uppercase bg-primary text-white"><Plus className="w-4 h-4" /> New Formula</Button>
      </SectionHeader>
      <div className="relative"><Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" /><Input placeholder="Search formulas..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="h-16 pl-14 rounded-[32px] border-none bg-white shadow-sm font-black text-sm uppercase" /></div>
      <Card className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 border-b">
              <tr><th className="px-10 py-8">Molecule</th><th className="px-10 py-8">Master ID</th><th className="px-10 py-8">Clinical Form</th><th className="px-10 py-8 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (<tr><td colSpan={4} className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></td></tr>) : filtered?.length === 0 ? (<tr><td colSpan={4} className="p-20 text-center font-bold text-gray-300">No molecules found</td></tr>) : filtered?.map(mol => (
                <tr key={mol.id} className="hover:bg-gray-50/50">
                  <td className="px-10 py-8 font-black text-sm uppercase">{mol.molecule}</td>
                  <td className="px-10 py-8 text-[11px] font-bold text-gray-500">{mol.masterId}</td>
                  <td className="px-10 py-8"><Badge variant="outline" className="font-black text-[8px] uppercase">{mol.form}</Badge></td>
                  <td className="px-10 py-8 text-right"><div className="flex justify-end gap-2"><Button variant="ghost" size="icon" onClick={() => { setEditingMol(mol); setIsFormOpen(true); }}><Edit2 className="w-4 h-4 text-gray-400" /></Button><Button variant="ghost" size="icon" onClick={() => deleteDocumentNonBlocking(doc(db, 'moleculeMaster', mol.id))}><Trash2 className="w-4 h-4 text-red-300" /></Button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}><DialogContent className="rounded-[40px] max-lg border-none p-0 overflow-hidden"><div className="bg-primary p-8 text-white"><DialogTitle className="text-2xl font-black uppercase">Clinical Formula</DialogTitle></div><div className="p-8"><MoleculeForm db={db} initialData={editingMol} onSuccess={() => setIsFormOpen(false)} /></div></DialogContent></Dialog>
    </div>
  );
}

function MoleculeForm({ db, initialData, onSuccess }: { db: any, initialData?: any, onSuccess: () => void }) {
  const [form, setForm] = useState({ molecule: initialData?.molecule || '', masterId: initialData?.masterId || '', form: initialData?.form || 'Tablet' });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, updatedAt: serverTimestamp() };
    initialData?.id ? updateDocumentNonBlocking(doc(db, 'moleculeMaster', initialData.id), payload) : addDocumentNonBlocking(collection(db, 'moleculeMaster'), { ...payload, createdAt: serverTimestamp() });
    onSuccess();
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Molecule Name</Label><Input value={form.molecule} onChange={e => setForm({...form, molecule: e.target.value})} required className="rounded-2xl h-14 bg-gray-50 border-none font-bold" /></div>
      <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Master ID</Label><Input value={form.masterId} onChange={e => setForm({...form, masterId: e.target.value})} required className="rounded-2xl h-14 bg-gray-50 border-none font-bold" /></div>
      <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Form</Label><Select value={form.form} onValueChange={v => setForm({...form, form: v})}><SelectTrigger className="rounded-2xl h-14 bg-gray-50 border-none font-bold"><SelectValue /></SelectTrigger><SelectContent className="rounded-2xl"><SelectItem value="Tablet">Tablet</SelectItem><SelectItem value="Capsule">Capsule</SelectItem><SelectItem value="Syrup">Syrup</SelectItem></SelectContent></Select></div>
      <Button type="submit" className="w-full h-16 rounded-full font-black uppercase bg-primary text-white">Save Registry Entry</Button>
    </form>
  );
}

// --- ENQUIRIES HUB ---

function EnquiriesTab({ db, isVerified, onBack }: { db: any, isVerified: boolean, onBack: () => void }) {
  const presQuery = useMemoFirebase(() => isVerified ? query(collectionGroup(db, 'prescriptions'), limit(50)) : null, [db, isVerified]);
  const { data: enquiries, isLoading } = useCollection(presQuery);
  const [selectedEnquiry, setSelectedEnquiry] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'OPEN' | 'COMPLETED'>('PENDING');

  const filteredEnquiries = enquiries?.filter(enq => {
    const status = (enq.status || 'Pending Review').toUpperCase();
    if (statusFilter === 'PENDING') return status === 'PENDING REVIEW';
    if (statusFilter === 'OPEN') return status === 'IN PROCESS' || status === 'PROCESSING';
    if (statusFilter === 'COMPLETED') return status === 'DIGITIZED' || status === 'COMPLETED';
    return false;
  });

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2">
      <SectionHeader title="Clinical Enquiries" subtitle="Prescription review queue" onBack={onBack} />
      <div className="bg-white p-1 rounded-full border flex w-fit gap-1 mb-8">
        {['PENDING', 'OPEN', 'COMPLETED'].map((status) => (<button key={status} onClick={() => setStatusFilter(status as any)} className={cn("px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all", statusFilter === status ? "bg-primary text-white shadow-lg scale-105" : "text-gray-400 hover:bg-gray-50")}>{status}</button>))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-8">
        {isLoading ? (<div className="col-span-full py-20 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></div>) : (!filteredEnquiries || filteredEnquiries.length === 0) ? (<div className="col-span-full py-20 text-center font-black text-gray-400 uppercase text-[10px]">No matches found</div>) : filteredEnquiries.map(enq => (
          <Card key={enq.id} className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white p-6 hover:shadow-2xl transition-all">
            <div className="aspect-[3/4] rounded-3xl bg-gray-50 mb-6 overflow-hidden border relative">{enq?.imageUrl && <img src={enq.imageUrl} className="w-full h-full object-cover" alt="" />}<div className="absolute top-4 right-4"><Badge className="bg-primary text-white text-[8px] font-black">{enq?.status || 'Pending'}</Badge></div></div>
            <p className="font-black text-sm uppercase mb-6 truncate">{enq?.patientName || 'Patient'}</p>
            {statusFilter !== 'COMPLETED' && (<Button onClick={() => setSelectedEnquiry(enq)} className="w-full rounded-full h-12 font-black uppercase text-[10px] bg-primary text-white gap-2"><Wand2 className="w-3.5 h-3.5" /> Digitize</Button>)}
          </Card>
        ))}
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
      <SectionHeader title="Clinical Coupons" subtitle="Manage patient offers" onBack={onBack}><Button onClick={() => { setEditingPromo(null); setIsFormOpen(true); }} className="rounded-full h-12 px-8 font-black text-[10px] uppercase bg-primary text-white"><Plus className="w-4 h-4" /> New Campaign</Button></SectionHeader>
      <Card className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 border-b">
              <tr><th className="px-10 py-8">Code</th><th className="px-10 py-8">Value</th><th className="px-10 py-8">Status</th><th className="px-10 py-8 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (<tr><td colSpan={4} className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></td></tr>) : (!promos || promos.length === 0) ? (<tr><td colSpan={4} className="p-20 text-center font-bold text-gray-300">No active campaigns</td></tr>) : promos?.map(promo => (
                <tr key={promo.id} className="hover:bg-gray-50/50">
                  <td className="px-10 py-8 font-black text-sm uppercase text-primary">{promo.code}</td>
                  <td className="px-10 py-8 font-black text-accent">{Number(promo.discountValue).toFixed(2)}{promo.discountType === 'percentage' ? '%' : '₹'}</td>
                  <td className="px-10 py-8"><Badge className={cn("rounded-full font-black text-[8px]", promo.isActive ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400")}>{promo.isActive ? 'ACTIVE' : 'DISABLED'}</Badge></td>
                  <td className="px-10 py-8 text-right"><Button variant="ghost" size="icon" onClick={() => { setEditingPromo(promo); setIsFormOpen(true); }}><Edit2 className="w-4 h-4 text-gray-400" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}><DialogContent className="rounded-[40px] max-lg border-none p-0 overflow-hidden"><div className="bg-primary p-8 text-white"><DialogTitle className="text-2xl font-black uppercase">Coupon Config</DialogTitle></div><div className="p-8"><PromoCodeForm db={db} initialData={editingPromo} onSuccess={() => setIsFormOpen(false)} /></div></DialogContent></Dialog>
    </div>
  );
}

function PromoCodeForm({ db, initialData, onSuccess }: { db: any, initialData?: any, onSuccess: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ code: initialData?.code || '', description: initialData?.description || '', discountType: initialData?.discountType || 'fixed', discountValue: initialData?.discountValue || 0, minOrderValue: initialData?.minOrderValue || 0, isActive: initialData?.isActive ?? true });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, updatedAt: serverTimestamp() };
    initialData?.id ? updateDocumentNonBlocking(doc(db, 'promocodes', initialData.id), payload) : addDocumentNonBlocking(collection(db, 'promocodes'), { ...payload, createdAt: serverTimestamp() });
    toast({ title: "Campaign Updated" }); onSuccess();
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Code</Label><Input value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} required className="rounded-2xl h-14 bg-gray-50 border-none font-black text-primary" /></div>
        <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Type</Label><Select value={form.discountType} onValueChange={v => setForm({...form, discountType: v})}><SelectTrigger className="rounded-2xl h-14 bg-gray-50 border-none font-bold"><SelectValue /></SelectTrigger><SelectContent className="rounded-2xl"><SelectItem value="fixed">Fixed (₹)</SelectItem><SelectItem value="percentage">Percentage (%)</SelectItem></SelectContent></Select></div>
        <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Value</Label><Input type="number" value={form.discountValue} onChange={e => setForm({...form, discountValue: Number(e.target.value)})} required className="rounded-2xl h-14 bg-gray-50 border-none font-bold" /></div>
        <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Min Purchase</Label><Input type="number" value={form.minOrderValue} onChange={e => setForm({...form, minOrderValue: Number(e.target.value)})} className="rounded-2xl h-14 bg-gray-50 border-none font-bold" /></div>
        <div className="flex items-center space-x-2 pt-2"><Checkbox id="promo-active" checked={form.isActive} onCheckedChange={c => setForm({...form, isActive: !!c})} /><Label htmlFor="promo-active" className="text-[10px] font-black uppercase cursor-pointer">Live</Label></div>
      </div>
      <Button type="submit" className="w-full h-16 rounded-full font-black uppercase bg-primary text-white">Commit Campaign</Button>
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
      <SectionHeader title="Clinical Fees" subtitle="Manage dynamic charges" onBack={onBack}><Button onClick={() => { setEditingFee(null); setIsFormOpen(true); }} className="rounded-full h-12 px-8 font-black text-[10px] uppercase bg-primary text-white"><Plus className="w-4 h-4" /> Add Charge</Button></SectionHeader>
      <Card className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 border-b">
              <tr><th className="px-10 py-8">Charge Name</th><th className="px-10 py-8">Pricing</th><th className="px-10 py-8">Status</th><th className="px-10 py-8 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (<tr><td colSpan={4} className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></td></tr>) : (!fees || fees.length === 0) ? (<tr><td colSpan={4} className="p-20 text-center font-bold text-gray-300">No fees found</td></tr>) : fees?.map(fee => (
                <tr key={fee.id} className="hover:bg-gray-50/50">
                  <td className="px-10 py-8 font-black text-sm uppercase">{fee.name}</td>
                  <td className="px-10 py-8 font-black text-gray-900">₹{Number(fee.discountedAmount).toFixed(2)}</td>
                  <td className="px-10 py-8"><Badge className={cn("rounded-full font-black text-[8px]", fee.isActive ? "bg-accent text-white" : "bg-gray-100 text-gray-400")}>{fee.isActive ? 'ENABLED' : 'PAUSED'}</Badge></td>
                  <td className="px-10 py-8 text-right"><Button variant="ghost" size="icon" onClick={() => { setEditingFee(fee); setIsFormOpen(true); }}><Edit2 className="w-4 h-4 text-gray-400" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}><DialogContent className="rounded-[40px] max-lg border-none p-0 overflow-hidden"><div className="bg-primary p-8 text-white"><DialogTitle className="text-2xl font-black uppercase">Fee Structure</DialogTitle></div><div className="p-8"><FeeForm db={db} initialData={editingFee} onSuccess={() => setIsFormOpen(false)} /></div></DialogContent></Dialog>
    </div>
  );
}

function FeeForm({ db, initialData, onSuccess }: { db: any, initialData?: any, onSuccess: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: initialData?.name || '', discountedAmount: initialData?.discountedAmount || 0, type: initialData?.type || 'fixed', minPurchase: initialData?.minPurchase || 0, isActive: initialData?.isActive ?? true });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, updatedAt: serverTimestamp() };
    initialData?.id ? updateDocumentNonBlocking(doc(db, 'fees', initialData.id), payload) : addDocumentNonBlocking(collection(db, 'fees'), { ...payload, createdAt: serverTimestamp() });
    toast({ title: "Clinical Fee Synced" }); onSuccess();
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Fee Label</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="rounded-2xl h-14 bg-gray-50 border-none font-bold" /></div>
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Charge Amount</Label><Input type="number" value={form.discountedAmount} onChange={e => setForm({...form, discountedAmount: Number(e.target.value)})} required className="rounded-2xl h-14 bg-gray-50 border-none font-bold" /></div>
        <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Free Above</Label><Input type="number" value={form.minPurchase} onChange={e => setForm({...form, minPurchase: Number(e.target.value)})} className="rounded-2xl h-14 bg-gray-50 border-none font-bold" /></div>
        <div className="flex items-center space-x-2 pt-8"><Checkbox id="fee-active" checked={form.isActive} onCheckedChange={c => setForm({...form, isActive: !!c})} /><Label htmlFor="fee-active" className="text-[10px] font-black uppercase cursor-pointer">Active</Label></div>
      </div>
      <Button type="submit" className="w-full h-16 rounded-full font-black uppercase bg-primary text-white">Update Logistics Policy</Button>
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
      <SectionHeader title="Patient Registry" subtitle="Verified Account Sync" onBack={onBack} />
      <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" /><Input placeholder="Search Registry..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 rounded-2xl h-12 bg-white border-none font-bold text-xs" /></div>
      <Card className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 border-b">
              <tr><th className="px-10 py-8">Name</th><th className="px-10 py-8">Identifier</th><th className="px-10 py-8 text-right">Action</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (<tr><td colSpan={3} className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></td></tr>) : filteredUsers?.map(patient => (
                <tr key={patient.id} className="hover:bg-gray-50/50">
                  <td className="px-10 py-8 font-black text-sm uppercase">{patient.name || 'SahiMed Member'}</td>
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
      <SectionHeader title="Clinical Alerts" subtitle="System broadcasts" onBack={onBack}><Button className="rounded-full h-12 px-8 font-black text-[10px] uppercase bg-red-600 text-white"><Plus className="w-4 h-4" /> New Alert</Button></SectionHeader>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isLoading ? (<div className="col-span-full py-20 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></div>) : alerts?.map(alert => (
          <Card key={alert.id} className="rounded-[40px] border-none shadow-sm bg-white p-8">
            <Badge className="bg-red-100 text-red-600 font-black text-[8px] mb-4">LIVE</Badge>
            <h3 className="font-black text-sm uppercase mb-2">{alert.title}</h3>
            <p className="text-[11px] font-bold text-gray-500">{alert.message}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

type AdminTab = 'overview' | 'enquiries' | 'fulfillment' | 'promocodes' | 'fees' | 'categories' | 'customers' | 'stockAlerts' | 'itemMaster' | 'moleculeMaster';
