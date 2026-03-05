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
  PlusCircle,
  MinusCircle,
  Tag,
  Truck,
  MapPin,
  Clock,
  ChevronDown,
  FileWarning,
  Calendar as CalendarIcon,
  Megaphone,
  Stethoscope,
  Activity,
  ClipboardList,
  Star,
  Image as ImageIcon,
  Link as LinkIcon,
  UploadCloud
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
import { doc, collection, query, collectionGroup, getDoc, getDocs, serverTimestamp, orderBy, where, writeBatch } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from "date-fns";

type AdminTab = 'overview' | 'enquiries' | 'fulfillment' | 'promocodes' | 'fees' | 'customers' | 'stockAlerts' | 'itemMaster' | 'moleculeMaster';

const ORDER_STATUSES = ['Pending', 'Packed', 'Shipping', 'Delivered', 'Cancelled'];

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
        {activeTab === 'stockAlerts' && <AlertsTab db={db} isVerified={isVerified} onBack={() => setActiveTab('overview')} />}
        {activeTab === 'itemMaster' && <ItemMasterTab db={db} isVerified={isVerified} onBack={() => setActiveTab('overview')} />}
        {activeTab === 'moleculeMaster' && <MoleculeMasterTab db={db} isVerified={isVerified} onBack={() => setActiveTab('overview')} />}
      </main>
    </div>
  );
}

// --- SHARED UI ---

function SectionHeader({ title, subtitle, onBack, children }: { title: string, subtitle: string, onBack: () => void, children?: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="rounded-full bg-white shadow-sm h-12 w-12 hover:scale-110 transition-transform flex items-center justify-center"><ChevronRight className="w-5 h-5 rotate-180" /></button>
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

// --- OVERVIEW COMPONENT ---

function OverviewTab({ db, setTab, isVerified }: { db: any, setTab: (t: AdminTab) => void, isVerified: boolean }) {
  const medsQuery = useMemoFirebase(() => query(collection(db, 'medicines')), [db]);
  const molsQuery = useMemoFirebase(() => query(collection(db, 'moleculeMaster')), [db]);
  const usersQuery = useMemoFirebase(() => isVerified ? query(collection(db, 'userProfiles')) : null, [db, isVerified]);
  const ordersQuery = useMemoFirebase(() => isVerified ? query(collectionGroup(db, 'orders')) : null, [db, isVerified]);
  const promosQuery = useMemoFirebase(() => query(collection(db, 'promocodes')), [db]);
  const feesQuery = useMemoFirebase(() => query(collection(db, 'fees')), [db]);
  const alertsQuery = useMemoFirebase(() => query(collection(db, 'systemAlerts')), [db]);
  const presQuery = useMemoFirebase(() => isVerified ? query(collectionGroup(db, 'prescriptions')) : null, [db, isVerified]);

  const { data: medicines } = useCollection(medsQuery);
  const { data: formulas } = useCollection(molsQuery);
  const { data: orders } = useCollection(ordersQuery);
  const { data: users } = useCollection(usersQuery);
  const { data: promos } = useCollection(promosQuery);
  const { data: fees } = useCollection(feesQuery);
  const { data: alerts } = useCollection(alertsQuery);
  const { data: enquiries } = useCollection(presQuery);

  const stats = [
    { label: 'INQUIRIES', icon: FileText, count: enquiries?.length || 0, tab: 'enquiries', color: 'text-blue-600' },
    { label: 'ORDERS', icon: ShoppingBag, count: orders?.length || 0, tab: 'fulfillment', color: 'text-blue-500' },
    { label: 'COUPONS', icon: Ticket, count: promos?.length || 0, tab: 'promocodes', color: 'text-purple-500' },
    { label: 'FEES', icon: Receipt, count: fees?.length || 0, tab: 'fees', color: 'text-orange-500' },
    { label: 'CUSTOMERS', icon: Users, count: users?.length || 0, tab: 'customers', color: 'text-indigo-500' },
    { label: 'ALERTS', icon: Megaphone, count: alerts?.length || 0, tab: 'stockAlerts', color: 'text-red-500' },
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

// --- FULFILLMENT HUB ---

function FulfillmentTab({ db, isVerified, onBack }: { db: any, isVerified: boolean, onBack: () => void }) {
  const ordersQuery = useMemoFirebase(() => isVerified ? query(collectionGroup(db, 'orders')) : null, [db, isVerified]);
  const { data: orders, isLoading } = useCollection(ordersQuery);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isShippingDialogOpen, setIsShippingDialogOpen] = useState(false);
  const [shippingData, setShippingData] = useState({ carrier: '', trackingId: '' });
  const { toast } = useToast();

  const handleStatusUpdate = (order: any, newStatus: string) => {
    if (newStatus === 'Shipping') {
      setSelectedOrder(order);
      setShippingData({ carrier: order?.carrier || '', trackingId: order?.trackingId || '' });
      setIsShippingDialogOpen(true);
      return;
    }

    if (!order?.userId || !order?.id) {
      toast({ variant: 'destructive', title: 'Data Error', description: 'Missing identifiers.' });
      return;
    }

    const orderRef = doc(db, 'userProfiles', order.userId, 'orders', order.id);
    updateDocumentNonBlocking(orderRef, { status: newStatus });
    toast({ title: "Status Updated", description: `Order set to ${newStatus}.` });
  };

  const finalizeShipping = () => {
    if (!selectedOrder) return;
    const orderRef = doc(db, 'userProfiles', selectedOrder.userId, 'orders', selectedOrder.id);
    updateDocumentNonBlocking(orderRef, { 
      status: 'Shipping',
      carrier: shippingData.carrier,
      trackingId: shippingData.trackingId
    });
    setIsShippingDialogOpen(false);
    toast({ title: "Shipping Linked" });
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2">
      <SectionHeader title="Fulfillment Hub" subtitle="Active order processing" onBack={onBack} />
      
      <Card className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[1000px]">
            <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 border-b">
              <tr>
                <th className="px-8 py-6">Order ID</th>
                <th className="px-8 py-6">Contact / Mobile</th>
                <th className="px-8 py-6">Address</th>
                <th className="px-8 py-6">Amount</th>
                <th className="px-8 py-6">Status</th>
                <th className="px-8 py-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr><td colSpan={6} className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></td></tr>
              ) : (!orders || orders.length === 0) ? (
                <tr><td colSpan={6} className="p-20 text-center font-bold text-gray-400 uppercase tracking-widest">Waiting for orders from Firestore...</td></tr>
              ) : orders.map(order => {
                const mobile = order?.phoneNumber || <span className="text-red-500 font-black">NO PHONE</span>;
                const address = order?.shippingDetails?.street || <span className="text-red-500 font-black">MISSING ADDRESS</span>;
                return (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-6 font-black text-xs uppercase">#{order.id.substring(0,8)}</td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-xs">{order.patientName || 'Patient'}</span>
                        <span className="text-[10px] font-bold text-gray-400">{mobile}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 max-w-[250px]"><p className="text-[10px] font-bold text-gray-600 line-clamp-1">{address}</p></td>
                    <td className="px-8 py-6 font-black text-accent">₹{order.totalAmount || 0}</td>
                    <td className="px-8 py-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="outline" className="h-8 rounded-full px-4 text-[9px] font-black uppercase border-2 gap-2">{order.status || 'Pending'} <ChevronDown className="w-3 h-3" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent className="rounded-2xl border-none shadow-2xl p-2">
                          {ORDER_STATUSES.map(s => <DropdownMenuItem key={s} onClick={() => handleStatusUpdate(order, s)} className="rounded-xl font-bold text-[10px] uppercase h-10 px-4">{s}</DropdownMenuItem>)}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                    <td className="px-8 py-6 text-right"><Button variant="ghost" size="icon" onClick={() => setSelectedOrder(order)} className="h-9 w-9 rounded-xl text-primary"><Eye className="w-4 h-4" /></Button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={!!selectedOrder && !isShippingDialogOpen} onOpenChange={o => !o && setSelectedOrder(null)}>
        <DialogContent className="rounded-[40px] max-w-2xl border-none p-0 overflow-hidden">
          <div className="bg-primary p-8 text-white"><DialogTitle className="text-2xl font-black uppercase">Order Details</DialogTitle></div>
          <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
             <div className="grid grid-cols-2 gap-8">
                <div><h4 className="text-[10px] font-black uppercase text-gray-400 mb-2">Patient</h4><p className="font-black text-sm">{selectedOrder?.patientName}</p><p className="text-xs text-gray-500">{selectedOrder?.phoneNumber}</p></div>
                <div><h4 className="text-[10px] font-black uppercase text-gray-400 mb-2">Address</h4><p className="text-[11px] font-bold leading-relaxed">{selectedOrder?.shippingDetails?.street}</p></div>
             </div>
             <div className="bg-gray-50 p-6 rounded-[32px] border space-y-4">
                {selectedOrder?.items?.map((it: any, i: number) => (
                  <div key={i} className="flex justify-between items-center"><p className="text-[11px] font-black uppercase">{it.name} x {it.quantity}</p><span className="font-black text-xs">₹{it.unitPrice * it.quantity}</span></div>
                )) || <p className="text-center text-[10px] font-black text-gray-300">0 ITEMS</p>}
             </div>
             <div className="flex justify-between border-t pt-4"><span className="font-black text-sm uppercase text-gray-400">Total</span><span className="text-3xl font-black text-accent">₹{selectedOrder?.totalAmount || 0}</span></div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isShippingDialogOpen} onOpenChange={setIsShippingDialogOpen}>
        <DialogContent className="rounded-[40px] max-w-md border-none p-0 overflow-hidden">
          <div className="bg-blue-600 p-8 text-white"><DialogTitle className="text-2xl font-black uppercase">Shipping Details</DialogTitle></div>
          <div className="p-8 space-y-6">
             <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Partner Name</Label><Input value={shippingData.carrier} onChange={e => setShippingData({...shippingData, carrier: e.target.value})} placeholder="e.g. BlueDart" className="rounded-2xl h-14 bg-gray-50 border-none font-bold" /></div>
             <div className="space-y-2"><Label className="text-[10px] font-black uppercase">AWB / Tracking</Label><Input value={shippingData.trackingId} onChange={e => setShippingData({...shippingData, trackingId: e.target.value})} placeholder="Tracking ID" className="rounded-2xl h-14 bg-gray-50 border-none font-bold" /></div>
             <Button onClick={finalizeShipping} className="w-full h-16 rounded-full font-black uppercase bg-blue-600 text-white">Confirm Shipment</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- ITEM MASTER (PRODUCT CATALOGUE) ---

function ItemMasterTab({ db, isVerified, onBack }: { db: any, isVerified: boolean, onBack: () => void }) {
  const medsQuery = useMemoFirebase(() => isVerified ? query(collection(db, 'medicines'), orderBy('name', 'asc')) : null, [db, isVerified]);
  const { data: medicines, isLoading } = useCollection(medsQuery);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const { toast } = useToast();

  const filtered = medicines?.filter(m => m.name?.toLowerCase().includes(searchTerm.toLowerCase()) || m.sku?.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleExport = () => {
    if (!filtered) return;
    const headers = "Name,SKU,Manufacturer,Price,MRP,Stock,Category,Generic,RX_Required,PackSize,Description,HowToUse,Treatment,SafetyAdvice,SideEffects,AlcoholInteraction,PregnancyInteraction,LactationInteraction,DrivingInteraction,KidneyInteraction,LiverInteraction,ImageURL1,ImageURL2,ImageURL3\n";
    const rows = filtered.map(m => `"${m.name}","${m.sku || ''}","${m.manufacturer}",${m.price},${m.mrp},${m.availableQuantity},"${m.category}",${m.isGeneric},${m.prescriptionRequired},"${m.packSize || ''}","${(m.description || '').replace(/"/g, '""')}","${(m.howToUse || '').replace(/"/g, '""')}","${(m.treatment || '').replace(/"/g, '""')}","${(m.safetyAdvice || '').replace(/"/g, '""')}","${(m.sideEffects || '').replace(/"/g, '""')}","${(m.alcoholInteraction || '').replace(/"/g, '""')}","${(m.pregnancyInteraction || '').replace(/"/g, '""')}","${(m.lactationInteraction || '').replace(/"/g, '""')}","${(m.drivingInteraction || '').replace(/"/g, '""')}","${(m.kidneyInteraction || '').replace(/"/g, '""')}","${(m.liverInteraction || '').replace(/"/g, '""')}","${m.imageUrls?.[0] || ''}","${m.imageUrls?.[1] || ''}","${m.imageUrls?.[2] || ''}"`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `SahiMed_Catalogue_Master_${format(new Date(), 'yyyyMMdd')}.csv`; a.click();
  };

  const downloadTemplate = () => {
    const headers = "Name,SKU,Manufacturer,Price,MRP,Stock,Category,Generic,RX_Required,PackSize,Description,HowToUse,Treatment,SafetyAdvice,SideEffects,AlcoholInteraction,PregnancyInteraction,LactationInteraction,DrivingInteraction,KidneyInteraction,LiverInteraction,ImageURL1,ImageURL2,ImageURL3\n";
    const sample = `"Sample Product","SKU123","SahiMed Labs",100,150,50,"Diabetes",true,false,"Strip of 10","Clinical Desc","1 daily","Control sugar","Safe","Nausea","None","Consult Dr","Safe","Safe","Safe","Safe","https://picsum.photos/300","",""`;
    const blob = new Blob([headers + sample], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `SahiMed_Catalogue_Template.csv`; a.click();
  };

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n").slice(1); // skip headers
      const batch = writeBatch(db);
      let count = 0;
      for (const line of lines) {
        if (!line.trim()) continue;
        const [name, sku, manufacturer, price, mrp, stock, category, generic, rx, pack, desc, how, treat, safety, side, alc, preg, lact, driv, kid, liv, img1, img2, img3] = line.split(",").map(s => s.replace(/"/g, '').trim());
        const ref = doc(collection(db, 'medicines'));
        const images = [img1, img2, img3].filter(Boolean);
        batch.set(ref, { 
          name, sku, manufacturer, 
          price: Number(price) || 0, 
          mrp: Number(mrp) || 0, 
          availableQuantity: Number(stock) || 0, 
          category,
          isGeneric: generic?.toLowerCase() === 'true',
          prescriptionRequired: rx?.toLowerCase() === 'true',
          packSize: pack,
          description: desc,
          howToUse: how,
          treatment: treat,
          safetyAdvice: safety,
          sideEffects: side,
          alcoholInteraction: alc,
          pregnancyInteraction: preg,
          lactationInteraction: lact,
          drivingInteraction: driv,
          kidneyInteraction: kid,
          liverInteraction: liv,
          imageUrls: images,
          imageUrl: images[0] || '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        count++;
      }
      await batch.commit();
      toast({ title: "Bulk Upload Success", description: `${count} clinical entries added.` });
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2">
      <SectionHeader title="Product Master" subtitle="Global Clinical Catalogue" onBack={onBack}>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadTemplate} className="rounded-full h-12 px-6 font-black text-[10px] uppercase border-2 gap-2"><FileDown className="w-4 h-4" /> Template</Button>
          <Button variant="outline" onClick={handleExport} className="rounded-full h-12 px-6 font-black text-[10px] uppercase border-2 gap-2"><Download className="w-4 h-4" /> Export</Button>
          <div className="relative">
            <input type="file" accept=".csv" onChange={handleBulkUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
            <Button variant="outline" className="rounded-full h-12 px-6 font-black text-[10px] uppercase border-2 gap-2"><Upload className="w-4 h-4" /> Bulk Upload</Button>
          </div>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild><Button onClick={() => setEditingItem(null)} className="rounded-full h-12 px-8 font-black text-[10px] uppercase tracking-widest gap-2 bg-primary text-white shadow-lg"><Plus className="w-4 h-4" /> New Product</Button></DialogTrigger>
            <DialogContent className="rounded-[40px] max-w-5xl border-none p-0 overflow-hidden shadow-3xl">
              <div className="bg-primary p-8 text-white"><DialogTitle className="text-2xl font-black uppercase tracking-tight">Clinical Product Profile</DialogTitle></div>
              <div className="p-8 max-h-[80vh] overflow-y-auto scrollbar-hide"><ItemForm db={db} initialData={editingItem} onSuccess={() => setIsFormOpen(false)} /></div>
            </DialogContent>
          </Dialog>
        </div>
      </SectionHeader>

      <div className="relative"><Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" /><Input placeholder="Search catalog by name or SKU..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="h-16 pl-14 rounded-[32px] border-none bg-white shadow-sm font-black text-sm uppercase" /></div>

      <Card className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 border-b">
              <tr><th className="px-10 py-8">Clinical Item</th><th className="px-10 py-8">Pricing (₹)</th><th className="px-10 py-8">Inventory</th><th className="px-10 py-8 text-right">Manage</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (<tr><td colSpan={4} className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></td></tr>) : filtered?.length === 0 ? (<tr><td colSpan={4} className="p-20 text-center font-bold text-gray-300">No catalogue entries found</td></tr>) : filtered?.map(med => {
                const price = med.price || <span className="text-red-500 font-black">MISSING</span>;
                const stock = med.availableQuantity !== undefined ? `${med.availableQuantity} PCS` : <span className="text-red-500 font-black">NO STOCK DATA</span>;
                return (
                  <tr key={med.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-10 py-8"><div className="flex items-center gap-4"><div className="w-12 h-12 bg-gray-50 rounded-2xl p-2 border"><img src={med.imageUrl} alt="" className="w-full h-full object-contain" /></div><div className="flex flex-col"><span className="font-black text-sm uppercase">{med.name}</span><span className="text-[9px] text-gray-400 uppercase">{med.sku} • {med.manufacturer}</span></div></div></td>
                    <td className="px-10 py-8"><div className="flex flex-col"><span className="font-black text-accent text-lg">₹{price}</span><span className="text-[9px] text-red-600 line-through font-bold">MRP ₹{med.mrp || 0}</span></div></td>
                    <td className="px-10 py-8 font-black text-[10px] uppercase text-gray-700">{stock}</td>
                    <td className="px-10 py-8 text-right"><div className="flex justify-end gap-2"><Button variant="ghost" size="icon" onClick={() => { setEditingItem(med); setIsFormOpen(true); }} className="h-10 w-10 rounded-xl"><Edit2 className="w-4 h-4 text-gray-400" /></Button><Button variant="ghost" size="icon" onClick={() => deleteDocumentNonBlocking(doc(db, 'medicines', med.id))} className="h-10 w-10 rounded-xl"><Trash2 className="w-4 h-4 text-red-300" /></Button></div></td>
                  </tr>
                );
              })}
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
  const { storage } = initializeFirebase();
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: initialData?.name || '',
    sku: initialData?.sku || '',
    manufacturer: initialData?.manufacturer || '',
    price: initialData?.price || 0,
    mrp: initialData?.mrp || 0,
    availableQuantity: initialData?.availableQuantity || 0,
    category: initialData?.category || '',
    isGeneric: initialData?.isGeneric || false,
    prescriptionRequired: initialData?.prescriptionRequired || false,
    moleculeId: initialData?.moleculeId || '',
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

  const [imageUrls, setImageUrls] = useState<string[]>(initialData?.imageUrls || (initialData?.imageUrl ? [initialData.imageUrl] : []));
  const [thumbnailIdx, setThumbnailIdx] = useState<number>(0);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const storageRef = ref(storage, `medicines/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      const newUrls = [...imageUrls];
      newUrls[index] = url;
      setImageUrls(newUrls);
      toast({ title: "Image Uploaded" });
    } catch (err) {
      toast({ variant: 'destructive', title: "Upload Failed" });
    } finally {
      setUploading(false);
    }
  };

  const handleUrlPaste = (val: string, index: number) => {
    const newUrls = [...imageUrls];
    newUrls[index] = val;
    setImageUrls(newUrls);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalImages = imageUrls.filter(Boolean).slice(0, 3);
    const payload = { 
      ...form, 
      price: Number(form.price), 
      mrp: Number(form.mrp), 
      availableQuantity: Number(form.availableQuantity), 
      imageUrls: finalImages,
      imageUrl: finalImages[thumbnailIdx] || finalImages[0] || '',
      updatedAt: serverTimestamp() 
    };
    initialData?.id ? updateDocumentNonBlocking(doc(db, 'medicines', initialData.id), payload) : addDocumentNonBlocking(collection(db, 'medicines'), { ...payload, createdAt: serverTimestamp() });
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="bg-gray-100 p-1 rounded-2xl h-14 w-full flex mb-8">
          <TabsTrigger value="basic" className="flex-1 rounded-xl font-black text-[10px] uppercase">Basic Info</TabsTrigger>
          <TabsTrigger value="images" className="flex-1 rounded-xl font-black text-[10px] uppercase">Images (3 Max)</TabsTrigger>
          <TabsTrigger value="clinical" className="flex-1 rounded-xl font-black text-[10px] uppercase">Clinical Data</TabsTrigger>
          <TabsTrigger value="safety" className="flex-1 rounded-xl font-black text-[10px] uppercase">Safety & Interactions</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2 space-y-2"><Label className="text-[10px] font-black uppercase text-gray-400">Clinical Name</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="rounded-2xl h-14 bg-gray-50 border-none font-bold" /></div>
            <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-gray-400">SKU / ID</Label><Input value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} className="rounded-2xl h-14 bg-gray-50 border-none font-bold" /></div>
            <div className="space-y-2">
              <Label className="text-[10px) font-black uppercase text-gray-400">Therapeutic Class</Label>
              <Select value={form.category} onValueChange={v => setForm({...form, category: v})}><SelectTrigger className="rounded-2xl h-14 bg-gray-50 border-none font-bold"><SelectValue placeholder="Select Class" /></SelectTrigger><SelectContent className="rounded-2xl"><SelectItem value="Diabetes">Diabetes</SelectItem><SelectItem value="Heart care">Heart care</SelectItem><SelectItem value="Stomach care">Stomach care</SelectItem><SelectItem value="Liver care">Liver care</SelectItem><SelectItem value="Derma care">Derma care</SelectItem><SelectItem value="Respicare">Respicare</SelectItem></SelectContent></Select>
            </div>
            <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-gray-400">Price (Sell)</Label><Input type="number" value={form.price} onChange={e => setForm({...form, price: Number(e.target.value)})} required className="rounded-2xl h-14 bg-gray-50 border-none font-bold" /></div>
            <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-gray-400">MRP (Print)</Label><Input type="number" value={form.mrp} onChange={e => setForm({...form, mrp: Number(e.target.value)})} required className="rounded-2xl h-14 bg-gray-50 border-none font-bold" /></div>
            <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-gray-400">Current Inventory</Label><Input type="number" value={form.availableQuantity} onChange={e => setForm({...form, availableQuantity: Number(e.target.value)})} required className="rounded-2xl h-14 bg-gray-50 border-none font-bold" /></div>
            <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-gray-400">Pack Size</Label><Input value={form.packSize} onChange={e => setForm({...form, packSize: e.target.value})} placeholder="e.g. Strip of 15" className="rounded-2xl h-14 bg-gray-50 border-none font-bold" /></div>
            <div className="col-span-2 flex items-center gap-8 bg-gray-50 p-6 rounded-3xl">
               <div className="flex items-center gap-2"><input type="checkbox" id="isGeneric" checked={form.isGeneric} onChange={e => setForm({...form, isGeneric: e.target.checked})} className="w-5 h-5 accent-primary" /><Label htmlFor="isGeneric" className="text-[10px] font-black uppercase">Generic Variant</Label></div>
               <div className="flex items-center gap-2"><input type="checkbox" id="isRx" checked={form.prescriptionRequired} onChange={e => setForm({...form, prescriptionRequired: e.target.checked})} className="w-5 h-5 accent-red-500" /><Label htmlFor="isRx" className="text-[10px] font-black uppercase text-red-500">RX Required</Label></div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="images" className="space-y-8 animate-in fade-in duration-300">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[0, 1, 2].map(idx => (
                <div key={idx} className="bg-gray-50 rounded-[32px] p-6 border-2 border-dashed border-gray-200 flex flex-col items-center gap-4 relative">
                   <button type="button" onClick={() => setThumbnailIdx(idx)} className={cn("absolute top-4 right-4 p-2 rounded-full transition-all", thumbnailIdx === idx ? "bg-primary text-white" : "bg-white text-gray-300")}>
                      <Star className="w-4 h-4 fill-current" />
                   </button>
                   <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center overflow-hidden border shadow-inner">
                      {imageUrls[idx] ? <img src={imageUrls[idx]} className="w-full h-full object-contain" /> : <ImageIcon className="text-gray-200 w-10 h-10" />}
                   </div>
                   <div className="w-full space-y-3">
                      <div className="relative">
                         <input type="file" accept="image/*" onChange={e => handleFileUpload(e, idx)} className="absolute inset-0 opacity-0 cursor-pointer" disabled={uploading} />
                         <Button variant="outline" className="w-full rounded-xl h-10 text-[9px] font-black uppercase gap-2">
                            {uploading ? <Loader2 className="animate-spin w-3 h-3" /> : <UploadCloud className="w-3 h-3" />} Device
                         </Button>
                      </div>
                      <div className="flex items-center gap-2">
                         <LinkIcon className="w-3 h-3 text-gray-400" />
                         <Input placeholder="Paste URL" value={imageUrls[idx] || ''} onChange={e => handleUrlPaste(e.target.value, idx)} className="h-10 rounded-xl bg-white border-none text-[10px] font-bold" />
                      </div>
                   </div>
                </div>
              ))}
           </div>
           <p className="text-[9px] font-black text-gray-400 uppercase text-center tracking-widest">Max 3 clinical images per product profile.</p>
        </TabsContent>

        <TabsContent value="clinical" className="space-y-6 animate-in fade-in duration-300">
          <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-gray-400">Active Formula Mapping</Label><Select value={form.moleculeId} onValueChange={v => setForm({...form, moleculeId: v})}><SelectTrigger className="rounded-2xl h-14 bg-gray-50 border-none font-bold"><SelectValue placeholder="Select Molecule" /></SelectTrigger><SelectContent className="rounded-2xl">{molecules?.map(m => <SelectItem key={m.id} value={m.id}>{m.molecule} ({m.form})</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-gray-400">Primary Treatment</Label><Textarea value={form.treatment} onChange={e => setForm({...form, treatment: e.target.value})} className="rounded-2xl min-h-[100px] bg-gray-50 border-none font-bold" /></div>
          <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-gray-400">Clinical Description</Label><Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="rounded-2xl min-h-[120px] bg-gray-50 border-none font-bold" /></div>
          <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-gray-400">Expected Side Effects</Label><Textarea value={form.sideEffects} onChange={e => setForm({...form, sideEffects: e.target.value})} className="rounded-2xl min-h-[100px] bg-gray-50 border-none font-bold" /></div>
        </TabsContent>

        <TabsContent value="safety" className="space-y-6 animate-in fade-in duration-300">
          <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-gray-400">Usage Instructions</Label><Textarea value={form.howToUse} onChange={e => setForm({...form, howToUse: e.target.value})} className="rounded-2xl min-h-[100px] bg-gray-50 border-none font-bold" /></div>
          <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-gray-400">General Safety Advice</Label><Textarea value={form.safetyAdvice} onChange={e => setForm({...form, safetyAdvice: e.target.value})} className="rounded-2xl min-h-[100px] bg-gray-50 border-none font-bold" /></div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-gray-400">Alcohol Interaction</Label><Input value={form.alcoholInteraction} onChange={e => setForm({...form, alcoholInteraction: e.target.value})} className="rounded-2xl h-14 bg-gray-50 border-none font-bold" /></div>
            <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-gray-400">Kidney Safety</Label><Input value={form.kidneyInteraction} onChange={e => setForm({...form, kidneyInteraction: e.target.value})} className="rounded-2xl h-14 bg-gray-50 border-none font-bold" /></div>
          </div>
        </TabsContent>
      </Tabs>

      <Button type="submit" className="w-full h-20 rounded-[32px] font-black uppercase tracking-widest bg-primary text-white shadow-2xl shadow-primary/20 text-lg">Save Catalogue Entry</Button>
    </form>
  );
}

// --- FORMULATION (MOLECULE MASTER) ---

function MoleculeMasterTab({ db, isVerified, onBack }: { db: any, isVerified: boolean, onBack: () => void }) {
  const molsQuery = useMemoFirebase(() => isVerified ? query(collection(db, 'moleculeMaster'), orderBy('molecule', 'asc')) : null, [db, isVerified]);
  const { data: molecules, isLoading } = useCollection(molsQuery);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMol, setEditingMol] = useState<any>(null);
  const { toast } = useToast();

  const filtered = molecules?.filter(m => m.molecule?.toLowerCase().includes(searchTerm.toLowerCase()) || m.masterId?.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleExport = () => {
    if (!filtered) return;
    const headers = "Molecule,MasterID,Form\n";
    const rows = filtered.map(m => `"${m.molecule}","${m.masterId}","${m.form}"`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `SahiMed_Registry_Master_${format(new Date(), 'yyyyMMdd')}.csv`; a.click();
  };

  const downloadTemplate = () => {
    const headers = "Molecule,MasterID,Form\n";
    const sample = `"Sitagliptin","MOL789","Tablet"`;
    const blob = new Blob([headers + sample], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `SahiMed_Formula_Template.csv`; a.click();
  };

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n").slice(1);
      const batch = writeBatch(db);
      let count = 0;
      for (const line of lines) {
        if (!line.trim()) continue;
        const [molecule, masterId, form] = line.split(",").map(s => s.replace(/"/g, '').trim());
        const ref = doc(collection(db, 'moleculeMaster'));
        batch.set(ref, { molecule, masterId, form, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        count++;
      }
      await batch.commit();
      toast({ title: "Registry Updated", description: `${count} formula entries added.` });
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2">
      <SectionHeader title="Formula Registry" subtitle="Clinical molecule masters" onBack={onBack}>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadTemplate} className="rounded-full h-12 px-6 font-black text-[10px] uppercase border-2 gap-2"><FileDown className="w-4 h-4" /> Template</Button>
          <Button variant="outline" onClick={handleExport} className="rounded-full h-12 px-6 font-black text-[10px] uppercase border-2 gap-2"><Download className="w-4 h-4" /> Export</Button>
          <div className="relative">
            <input type="file" accept=".csv" onChange={handleBulkUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
            <Button variant="outline" className="rounded-full h-12 px-6 font-black text-[10px] uppercase border-2 gap-2"><Upload className="w-4 h-4" /> Bulk Upload</Button>
          </div>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild><Button onClick={() => setEditingMol(null)} className="rounded-full h-12 px-8 font-black text-[10px] uppercase tracking-widest gap-2 bg-primary text-white shadow-lg"><Plus className="w-4 h-4" /> New Formula</Button></DialogTrigger>
            <DialogContent className="rounded-[40px] max-w-lg border-none p-0 overflow-hidden shadow-3xl">
              <div className="bg-primary p-8 text-white"><DialogTitle className="text-2xl font-black uppercase tracking-tight">Clinical Formula Definition</DialogTitle></div>
              <div className="p-8"><MoleculeForm db={db} initialData={editingMol} onSuccess={() => setIsFormOpen(false)} /></div>
            </DialogContent>
          </Dialog>
        </div>
      </SectionHeader>

      <div className="relative"><Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" /><Input placeholder="Search formulas by name or ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="h-16 pl-14 rounded-[32px] border-none bg-white shadow-sm font-black text-sm uppercase" /></div>

      <Card className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 border-b">
              <tr><th className="px-10 py-8">Molecule</th><th className="px-10 py-8">Master ID</th><th className="px-10 py-8">Clinical Form</th><th className="px-10 py-8 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (<tr><td colSpan={4} className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></td></tr>) : filtered?.length === 0 ? (<tr><td colSpan={4} className="p-20 text-center font-bold text-gray-300">No molecules recorded</td></tr>) : filtered?.map(mol => (
                <tr key={mol.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-10 py-8 font-black text-sm uppercase">{mol.molecule}</td>
                  <td className="px-10 py-8 text-[11px] font-bold text-gray-500">{mol.masterId}</td>
                  <td className="px-10 py-8"><Badge variant="outline" className="font-black text-[8px] uppercase">{mol.form}</Badge></td>
                  <td className="px-10 py-8 text-right"><div className="flex justify-end gap-2"><Button variant="ghost" size="icon" onClick={() => { setEditingMol(mol); setIsFormOpen(true); }} className="h-10 w-10 rounded-xl"><Edit2 className="w-4 h-4 text-gray-400" /></Button><Button variant="ghost" size="icon" onClick={() => deleteDocumentNonBlocking(doc(db, 'moleculeMaster', mol.id))} className="h-10 w-10 rounded-xl"><Trash2 className="w-4 h-4 text-red-300" /></Button></div></td>
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
  const [form, setForm] = useState({ 
    molecule: initialData?.molecule || '', 
    masterId: initialData?.masterId || '', 
    form: initialData?.form || 'Tablet' 
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, updatedAt: serverTimestamp() };
    initialData?.id ? updateDocumentNonBlocking(doc(db, 'moleculeMaster', initialData.id), payload) : addDocumentNonBlocking(collection(db, 'moleculeMaster'), { ...payload, createdAt: serverTimestamp() });
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Molecule Name</Label><Input value={form.molecule} onChange={e => setForm({...form, molecule: e.target.value})} required className="rounded-2xl h-14 bg-gray-50 border-none font-bold" /></div>
      <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Master Clinical ID</Label><Input value={form.masterId} onChange={e => setForm({...form, masterId: e.target.value})} required className="rounded-2xl h-14 bg-gray-50 border-none font-bold" /></div>
      <div className="space-y-2">
        <Label className="text-[10px] font-black uppercase">Form</Label>
        <Select value={form.form} onValueChange={v => setForm({...form, form: v})}><SelectTrigger className="rounded-2xl h-14 bg-gray-50 border-none font-bold"><SelectValue /></SelectTrigger><SelectContent className="rounded-2xl"><SelectItem value="Tablet">Tablet</SelectItem><SelectItem value="Capsule">Capsule</SelectItem><SelectItem value="Syrup">Syrup</SelectItem><SelectItem value="Injection">Injection</SelectItem><SelectItem value="Cream">Cream</SelectItem></SelectContent></Select>
      </div>
      <Button type="submit" className="w-full h-16 rounded-full font-black uppercase tracking-widest bg-primary text-white">Save Registry Entry</Button>
    </form>
  );
}

// --- ENQUIRIES TAB (DIGITIZATION HUB) ---

function EnquiriesTab({ db, isVerified, onBack }: { db: any, isVerified: boolean, onBack: () => void }) {
  const presQuery = useMemoFirebase(() => isVerified ? query(collectionGroup(db, 'prescriptions')) : null, [db, isVerified]);
  const { data: enquiries, isLoading } = useCollection(presQuery);
  const [selectedEnquiry, setSelectedEnquiry] = useState<any>(null);

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2">
      <SectionHeader title="Clinical Enquiries" subtitle="Prescription review queue" onBack={onBack} />
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-8">
        {isLoading ? (
          <div className="col-span-full py-20 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></div>
        ) : (!enquiries || enquiries.length === 0) ? (
          <div className="col-span-full py-20 text-center font-black text-gray-400 uppercase tracking-widest text-[10px]">Waiting for enquiries from Firestore...</div>
        ) : enquiries.map(enq => {
          const patientMobile = enq?.phoneNumber || <span className="text-red-500 font-black">NO PHONE</span>;
          return (
            <Card key={enq.id} className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white p-6 group hover:shadow-2xl transition-all duration-500">
              <div className="aspect-[3/4] rounded-3xl bg-gray-50 mb-6 overflow-hidden border border-gray-100 relative">
                {enq?.imageUrl ? <img src={enq.imageUrl} className="w-full h-full object-cover" alt="Prescription" /> : <div className="w-full h-full flex items-center justify-center text-gray-200"><FileWarning className="w-10 h-10" /></div>}
                <div className="absolute top-4 right-4"><Badge className="bg-primary text-white uppercase text-[8px] font-black">{enq?.status || 'Pending'}</Badge></div>
              </div>
              <div className="space-y-1 mb-6">
                 <p className="font-black text-sm uppercase text-gray-900 truncate">{enq?.patientName || <span className="text-red-500">NO NAME</span>}</p>
                 <div className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                    <Phone className="w-2.5 h-2.5" />
                    <span>{patientMobile}</span>
                 </div>
              </div>
              <Button onClick={() => setSelectedEnquiry(enq)} className="w-full rounded-full h-12 font-black uppercase text-[10px] tracking-widest bg-primary text-white gap-2">
                <Wand2 className="w-3.5 h-3.5" /> Digitize & Order
              </Button>
            </Card>
          );
        })}
      </div>
      {selectedEnquiry && <DigitizationTerminal db={db} enquiry={selectedEnquiry} onClose={() => setSelectedEnquiry(null)} />}
    </div>
  );
}

function DigitizationTerminal({ db, enquiry, onClose }: { db: any, enquiry: any, onClose: () => void }) {
  const [searchQueryStr, setSearchQueryStr] = useState('');
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [activePromo, setActivePromo] = useState<any>(null);
  const { toast } = useToast();

  const medsQuery = useMemoFirebase(() => query(collection(db, 'medicines')), [db]);
  const { data: medicines } = useCollection(medsQuery);

  const searchedMeds = searchQueryStr.trim() ? medicines?.filter(m => m.name?.toLowerCase().includes(searchQueryStr.toLowerCase())).slice(0, 5) : [];

  const addToDraftOrder = (med: any) => {
    const existing = orderItems.find(item => item.id === med.id);
    if (existing) {
      setOrderItems(orderItems.map(item => item.id === med.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setOrderItems([...orderItems, { ...med, quantity: 1 }]);
    }
    setSearchQueryStr('');
  };

  const handleApplyPromo = async () => {
    if (!promoCodeInput.trim()) return;
    const q = query(collection(db, 'promocodes'), where('code', '==', promoCodeInput.trim().toUpperCase()), where('isActive', '==', true));
    const snap = await getDocs(q);
    if (!snap.empty) {
      setActivePromo({ ...snap.docs[0].data(), id: snap.docs[0].id });
      toast({ title: "Promo Applied" });
    } else {
      toast({ variant: 'destructive', title: 'Invalid Code' });
    }
  };

  const handleCompleteOrder = () => {
    if (!enquiry?.userId || orderItems.length === 0) return;
    const orderData = {
      userId: enquiry.userId,
      orderDate: serverTimestamp(),
      totalAmount: orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0),
      status: 'Created by Admin',
      patientName: enquiry?.patientName || 'Patient',
      phoneNumber: enquiry?.phoneNumber || '',
      items: orderItems.map(item => ({ medicineId: item.id, quantity: item.quantity, unitPrice: item.price, name: item.name }))
    };
    addDocumentNonBlocking(collection(db, 'userProfiles', enquiry.userId, 'orders'), orderData);
    updateDocumentNonBlocking(doc(db, 'userProfiles', enquiry.userId, 'prescriptions', enquiry.id), { status: 'Digitized' });
    toast({ title: "Order Created" });
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl rounded-[48px] border-none p-0 overflow-hidden shadow-3xl h-[90vh]">
        <div className="bg-primary p-8 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="bg-white/10 p-2 rounded-xl"><ShoppingCart className="w-6 h-6" /></div>
            <div>
              <DialogTitle className="text-2xl font-black uppercase tracking-tight">Digitization Terminal</DialogTitle>
              <p className="text-[9px] font-black uppercase opacity-60">Patient: {enquiry?.patientName || 'Self'}</p>
            </div>
          </div>
          <Button onClick={handleCompleteOrder} disabled={orderItems.length === 0} className="rounded-full h-12 px-8 font-black text-[10px] uppercase bg-white text-primary hover:bg-white/90">
            Complete Order
          </Button>
        </div>
        <div className="grid grid-cols-2 h-full overflow-hidden">
          <div className="bg-gray-100 p-8 overflow-auto border-r flex items-start justify-center">
             {enquiry?.imageUrl ? <img src={enquiry.imageUrl} className="max-w-full rounded-3xl shadow-2xl border-4 border-white" alt="Prescription" /> : <div className="text-gray-300"><FileWarning className="w-20 h-20" /></div>}
          </div>
          <div className="p-8 space-y-8 overflow-auto bg-white scrollbar-hide pb-24">
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Order on Behalf</h3>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input placeholder="Find medicines..." value={searchQueryStr} onChange={e => setSearchQueryStr(e.target.value)} className="rounded-2xl h-14 bg-gray-50 border-none font-bold pl-12" />
                {searchedMeds.length > 0 && (
                  <div className="absolute top-16 left-0 right-0 bg-white rounded-2xl shadow-2xl border z-20 overflow-hidden">
                    {searchedMeds.map(m => (
                      <button key={m.id} onClick={() => addToDraftOrder(m)} className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors border-b last:border-none text-left">
                        <div className="flex flex-col items-start"><p className="text-sm font-black uppercase">{m.name}</p><p className="text-[9px] text-gray-400">{m.saltComposition}</p></div>
                        <PlusCircle className="w-5 h-5 text-primary" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {orderItems.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Draft Order</h3>
                <div className="space-y-3">
                  {orderItems.map((item, i) => (
                    <div key={i} className="bg-gray-50 p-4 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-4">
                         <div className="flex items-center bg-white rounded-xl border p-1 shadow-sm">
                            <button onClick={() => setOrderItems(orderItems.map(oi => oi.id === item.id ? { ...oi, quantity: Math.max(1, oi.quantity - 1) } : oi))} className="p-1"><MinusCircle className="w-5 h-5" /></button>
                            <span className="w-8 text-center font-black text-xs">{item.quantity}</span>
                            <button onClick={() => setOrderItems(orderItems.map(oi => oi.id === item.id ? { ...oi, quantity: oi.quantity + 1 } : oi))} className="p-1"><PlusCircle className="w-5 h-5" /></button>
                         </div>
                         <p className="text-xs font-black uppercase">{item.name}</p>
                      </div>
                      <span className="font-black text-xs">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <Input placeholder="APPLY PROMOCODE" value={promoCodeInput} onChange={e => setPromoCodeInput(e.target.value.toUpperCase())} className="rounded-xl h-12 bg-gray-50 border-none font-bold" />
                  <Button onClick={handleApplyPromo} variant="outline" className="rounded-xl h-12">Apply</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// --- MANAGEMENT TABS ---

function PromoCodesTab({ db, isVerified, onBack }: { db: any, isVerified: boolean, onBack: () => void }) {
  const promosQuery = useMemoFirebase(() => isVerified ? query(collection(db, 'promocodes'), orderBy('code', 'asc')) : null, [db, isVerified]);
  const { data: promos, isLoading } = useCollection(promosQuery);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<any>(null);

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2">
      <SectionHeader title="Clinical Coupons" subtitle="Manage patient offers" onBack={onBack}>
        <Button onClick={() => { setEditingPromo(null); setIsFormOpen(true); }} className="rounded-full h-12 px-8 font-black text-[10px] uppercase tracking-widest gap-2 bg-primary text-white">
          <Plus className="w-4 h-4" /> New Coupon
        </Button>
      </SectionHeader>
      <Card className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 border-b">
              <tr><th className="px-10 py-8">Code</th><th className="px-10 py-8">Type</th><th className="px-10 py-8">Value</th><th className="px-10 py-8">Status</th><th className="px-10 py-8 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (<tr><td colSpan={5} className="p-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" /></td></tr>) : promos?.length === 0 ? (<tr><td colSpan={5} className="p-20 text-center font-bold text-gray-300 uppercase tracking-widest">No active coupons</td></tr>) : promos?.map(promo => (
                <tr key={promo.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-10 py-8 font-black text-sm uppercase text-primary">{promo.code}</td>
                  <td className="px-10 py-8 text-[10px] font-bold uppercase text-gray-400">{promo.discountType}</td>
                  <td className="px-10 py-8 font-black text-accent">{promo.discountValue}{promo.discountType === 'percentage' ? '%' : '₹'}</td>
                  <td className="px-10 py-8"><Badge className={cn("rounded-full font-black text-[8px]", promo.isActive ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400")}>{promo.isActive ? 'ACTIVE' : 'DISABLED'}</Badge></td>
                  <td className="px-10 py-8 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingPromo(promo); setIsFormOpen(true); }}><Edit2 className="w-4 h-4 text-gray-400" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteDocumentNonBlocking(doc(db, 'promocodes', promo.id))}><Trash2 className="w-4 h-4 text-red-300" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="rounded-[40px] max-w-lg border-none p-0 overflow-hidden shadow-3xl">
          <div className="bg-primary p-8 text-white"><DialogTitle className="text-2xl font-black uppercase tracking-tight">Clinical Coupon</DialogTitle></div>
          <div className="p-8"><PromoForm db={db} initialData={editingPromo} onSuccess={() => setIsFormOpen(false)} /></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PromoForm({ db, initialData, onSuccess }: { db: any, initialData?: any, onSuccess: () => void }) {
  const [form, setForm] = useState({ code: initialData?.code || '', discountType: initialData?.discountType || 'fixed', discountValue: initialData?.discountValue || 0, minOrderValue: initialData?.minOrderValue || 0, isActive: initialData?.isActive ?? true, applyTo: 'cart' });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, discountValue: Number(form.discountValue), minOrderValue: Number(form.minOrderValue) };
    initialData?.id ? updateDocumentNonBlocking(doc(db, 'promocodes', initialData.id), payload) : addDocumentNonBlocking(collection(db, 'promocodes'), payload);
    onSuccess();
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-gray-400">Coupon Code</Label><Input value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} required className="rounded-2xl h-14 bg-gray-50 border-none font-black text-lg tracking-widest px-6" /></div>
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase text-gray-400">Type</Label>
          <Select value={form.discountType} onValueChange={v => setForm({...form, discountType: v})}>
            <SelectTrigger className="rounded-2xl h-14 bg-gray-50 border-none font-bold"><SelectValue /></SelectTrigger>
            <SelectContent className="rounded-2xl"><SelectItem value="fixed">Fixed Amount</SelectItem><SelectItem value="percentage">Percentage %</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-gray-400">Value</Label><Input type="number" value={form.discountValue} onChange={e => setForm({...form, discountValue: Number(e.target.value)})} required className="rounded-2xl h-14 bg-gray-50 border-none font-bold" /></div>
      </div>
      <Button type="submit" className="w-full h-16 rounded-full font-black uppercase tracking-widest bg-primary text-white">Save Voucher</Button>
    </form>
  );
}

function FeesTab({ db, isVerified, onBack }: { db: any, isVerified: boolean, onBack: () => void }) {
  const feesQuery = useMemoFirebase(() => isVerified ? query(collection(db, 'fees'), orderBy('name', 'asc')) : null, [db, isVerified]);
  const { data: fees, isLoading } = useCollection(feesQuery);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFee, setEditingFee] = useState<any>(null);

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2">
      <SectionHeader title="Clinical Fees" subtitle="Manage dynamic charges" onBack={onBack}>
        <Button onClick={() => { setEditingFee(null); setIsFormOpen(true); }} className="rounded-full h-12 px-8 font-black text-[10px] uppercase tracking-widest gap-2 bg-primary text-white">
          <Plus className="w-4 h-4" /> Add Charge
        </Button>
      </SectionHeader>
      <Card className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 border-b">
              <tr><th className="px-10 py-8">Charge Name</th><th className="px-10 py-8">Amount</th><th className="px-10 py-8">Type</th><th className="px-10 py-8">Status</th><th className="px-10 py-8 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (<tr><td colSpan={5} className="p-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" /></td></tr>) : fees?.length === 0 ? (<tr><td colSpan={5} className="p-20 text-center font-bold text-gray-300 uppercase tracking-widest">No fees configured</td></tr>) : fees?.map(fee => (
                <tr key={fee.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-10 py-8 font-black text-sm uppercase">{fee.name}</td>
                  <td className="px-10 py-8 font-black text-gray-900">₹{fee.amount}</td>
                  <td className="px-10 py-8 text-[10px] font-black uppercase text-gray-400">{fee.type}</td>
                  <td className="px-10 py-8"><Badge className={cn("rounded-full font-black text-[8px]", fee.isActive ? "bg-accent text-white" : "bg-gray-100 text-gray-400")}>{fee.isActive ? 'ENABLED' : 'PAUSED'}</Badge></td>
                  <td className="px-10 py-8 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingFee(fee); setIsFormOpen(true); }}><Edit2 className="w-4 h-4 text-gray-400" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteDocumentNonBlocking(doc(db, 'fees', fee.id))}><Trash2 className="w-4 h-4 text-red-300" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="rounded-[40px] max-md border-none p-0 overflow-hidden shadow-3xl">
          <div className="bg-primary p-8 text-white"><DialogTitle className="text-2xl font-black uppercase tracking-tight">Fee Configuration</DialogTitle></div>
          <div className="p-8"><FeeForm db={db} initialData={editingFee} onSuccess={() => setIsFormOpen(false)} /></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FeeForm({ db, initialData, onSuccess }: { db: any, initialData?: any, onSuccess: () => void }) {
  const [form, setForm] = useState({ name: initialData?.name || '', amount: initialData?.amount || 0, type: initialData?.type || 'fixed', isActive: initialData?.isActive ?? true });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, amount: Number(form.amount) };
    initialData?.id ? updateDocumentNonBlocking(doc(db, 'fees', initialData.id), payload) : addDocumentNonBlocking(collection(db, 'fees'), payload);
    onSuccess();
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-gray-400">Charge Name</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="rounded-2xl h-14 bg-gray-50 border-none font-bold" /></div>
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-gray-400">Amount</Label><Input type="number" value={form.amount} onChange={e => setForm({...form, amount: Number(e.target.value)})} required className="rounded-2xl h-14 bg-gray-50 border-none font-bold" /></div>
        <div className="flex items-center gap-2 p-2 pt-8"><input type="checkbox" id="active" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})} className="w-5 h-5" /><Label htmlFor="active" className="text-[10px] font-black uppercase">Active</Label></div>
      </div>
      <Button type="submit" className="w-full h-16 rounded-full font-black uppercase tracking-widest bg-primary text-white">Save Configuration</Button>
    </form>
  );
}

function CustomersTab({ db, isVerified, onBack }: { db: any, isVerified: boolean, onBack: () => void }) {
  const usersQuery = useMemoFirebase(() => isVerified ? query(collection(db, 'userProfiles'), orderBy('createdAt', 'desc')) : null, [db, isVerified]);
  const { data: users, isLoading } = useCollection(usersQuery);

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2">
      <SectionHeader title="Patient Registry" subtitle="Manage customer profiles" onBack={onBack} />
      <Card className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 border-b">
              <tr><th className="px-10 py-8">Patient Name</th><th className="px-10 py-8">Mobile Number</th><th className="px-10 py-8">Joined On</th><th className="px-10 py-8 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (<tr><td colSpan={4} className="p-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" /></td></tr>) : users?.length === 0 ? (<tr><td colSpan={4} className="p-20 text-center font-bold text-gray-300 uppercase tracking-widest">No patients found</td></tr>) : users?.map(patient => (
                <tr key={patient.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-10 py-8 font-black text-sm uppercase">{patient.name || <span className="text-red-500 font-black">NO NAME</span>}</td>
                  <td className="px-10 py-8 font-bold text-sm text-gray-600">{patient.phone || <span className="text-red-500 font-black">NO PHONE</span>}</td>
                  <td className="px-10 py-8 text-[10px] font-black uppercase text-gray-400">{patient.createdAt ? format(new Date(patient.createdAt), 'MMM dd, yyyy') : 'N/A'}</td>
                  <td className="px-10 py-8 text-right"><Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl"><Eye className="w-4 h-4 text-gray-400" /></Button></td>
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
  const alertsQuery = useMemoFirebase(() => isVerified ? query(collection(db, 'systemAlerts'), orderBy('createdAt', 'desc')) : null, [db, isVerified]);
  const { data: alerts, isLoading } = useCollection(alertsQuery);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<any>(null);

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2">
      <SectionHeader title="Clinical Broadcasts" subtitle="System-wide patient alerts" onBack={onBack}>
        <Button onClick={() => { setEditingAlert(null); setIsFormOpen(true); }} className="rounded-full h-12 px-8 font-black text-[10px] uppercase tracking-widest gap-2 bg-red-600 text-white shadow-lg shadow-red-100">
          <Plus className="w-4 h-4" /> Create Alert
        </Button>
      </SectionHeader>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (<div className="col-span-full py-20 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></div>) : alerts?.length === 0 ? (<div className="col-span-full py-20 text-center font-black text-gray-300 uppercase tracking-widest text-[10px]">No broadcasts active</div>) : alerts?.map(alert => (
          <Card key={alert.id} className={cn("rounded-[32px] p-6 border-none shadow-sm", alert.isActive ? "bg-red-50/50 ring-2 ring-red-100" : "bg-white")}>
            <div className="flex justify-between items-start mb-4"><Megaphone className={cn("w-6 h-6", alert.isActive ? "text-red-600" : "text-gray-300")} /><Badge className={cn("rounded-full text-[8px] font-black", alert.isActive ? "bg-red-600 text-white" : "bg-gray-100 text-gray-400")}>{alert.isActive ? 'LIVE' : 'OFF'}</Badge></div>
            <h3 className="font-black text-sm uppercase tracking-tight text-gray-900 mb-2">{alert.title}</h3>
            <p className="text-xs font-bold text-gray-500 line-clamp-2 uppercase mb-6">{alert.message}</p>
            <div className="flex gap-2 justify-end border-t pt-4">
              <Button variant="ghost" size="icon" onClick={() => { setEditingAlert(alert); setIsFormOpen(true); }}><Edit2 className="w-3.5 h-3.5" /></Button>
              <Button variant="ghost" size="icon" onClick={() => deleteDocumentNonBlocking(doc(db, 'systemAlerts', alert.id))} className="text-red-300"><Trash2 className="w-3.5 h-3.5" /></Button>
            </div>
          </Card>
        ))}
      </div>
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="rounded-[40px] max-w-lg border-none p-0 overflow-hidden shadow-3xl">
          <div className="bg-red-600 p-8 text-white"><DialogTitle className="text-2xl font-black uppercase tracking-tight">Broadcast Message</DialogTitle></div>
          <div className="p-8"><AlertForm db={db} initialData={editingAlert} onSuccess={() => setIsFormOpen(false)} /></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AlertForm({ db, initialData, onSuccess }: { db: any, initialData?: any, onSuccess: () => void }) {
  const [form, setForm] = useState({ title: initialData?.title || '', message: initialData?.message || '', isActive: initialData?.isActive ?? true });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, createdAt: initialData?.createdAt || serverTimestamp() };
    initialData?.id ? updateDocumentNonBlocking(doc(db, 'systemAlerts', initialData.id), payload) : addDocumentNonBlocking(collection(db, 'systemAlerts'), payload);
    onSuccess();
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Broadcast Title</Label><Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required className="rounded-2xl h-14 bg-gray-50 border-none font-bold" /></div>
      <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Message</Label><Textarea value={form.message} onChange={e => setForm({...form, message: e.target.value})} required className="rounded-2xl min-h-[120px] bg-gray-50 border-none font-bold p-6" /></div>
      <div className="flex items-center gap-2"><input type="checkbox" id="broadcast-active" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})} className="w-5 h-5 accent-red-600" /><Label htmlFor="broadcast-active" className="text-[10px] font-black uppercase">Live</Label></div>
      <Button type="submit" className="w-full h-16 rounded-full font-black uppercase bg-red-600 text-white">Send Broadcast</Button>
    </form>
  );
}
