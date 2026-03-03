
"use client"

import { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  LogOut, 
  Loader2, 
  Package, 
  Database, 
  ShoppingBag, 
  ShieldAlert,
  UserPlus,
  Lock,
  FileText,
  Trash2,
  Search,
  CheckCircle2,
  Plus,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Home,
  X,
  Edit2,
  Upload,
  Download,
  Fingerprint,
  Dna,
  Link as LinkIcon,
  Users,
  BriefcaseMedical,
  Phone,
  MessageSquare,
  Clock,
  ClipboardList
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger
} from '@/components/ui/dialog';
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
import { doc, collection, query, orderBy, collectionGroup, getDoc, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import Link from 'next/link';
import Image from 'next/image';

type AdminTab = 'overview' | 'inventory' | 'molecules' | 'enquiries' | 'fulfillment' | 'customers';

export default function SupervisorConsole() {
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
        setIsVerifying(false);
        toast({ title: "Identity Verified", description: "Clinical supervisor access active." });
      } else {
        setIsVerified(false);
        setIsVerifying(false);
      }
    } catch (err) {
      console.error("Verification failed", err);
      setIsVerified(false);
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
      toast({ variant: 'destructive', title: 'Access Denied', description: 'Invalid clinical credentials.' });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setIsVerified(false);
    signOut(auth);
  };

  const copyUid = () => {
    if (user) {
      navigator.clipboard.writeText(user.uid);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "UID Copied", description: "Use this to create an Admin Profile in the console." });
    }
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
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Syncing clinical authority...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F7F6] p-4">
        <Card className="max-w-md w-full rounded-[40px] shadow-2xl border-none overflow-hidden bg-white">
          <CardHeader className="text-center p-10 bg-primary text-white">
            <Lock className="w-10 h-10 mx-auto mb-4 opacity-50" />
            <CardTitle className="text-2xl font-black uppercase tracking-tight text-white">Supervisor Gateway</CardTitle>
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
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed">Logged in as {user.email || 'Phone User'}, but clinical supervisor role is not detected.</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-2xl space-y-2">
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Your Unique Identifier (UID)</p>
            <div className="flex items-center gap-2 bg-white border p-3 rounded-xl">
              <code className="text-[10px] font-black text-gray-600 truncate flex-1">{user.uid}</code>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-primary" onClick={copyUid}>
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-3 pt-6 border-t">
            <Button onClick={bootstrapAdmin} className="w-full gap-2 rounded-full h-14 bg-orange-600 hover:bg-orange-700 uppercase font-black text-[10px] tracking-widest">
              <UserPlus className="w-4 h-4" /> Initialize Admin Role
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
            <button 
              onClick={() => setActiveTab('overview')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity outline-none group"
            >
              <div className="bg-primary p-1.5 rounded-lg group-active:scale-95 transition-transform">
                <ShieldCheck className="text-white w-4 h-4" />
              </div>
              <div className="flex flex-col items-start leading-none">
                <span className="font-black text-lg tracking-tighter text-gray-900 uppercase">Supervisor Terminal</span>
                <span className="text-[8px] font-black text-primary uppercase tracking-[0.3em]">Home Dashboard</span>
              </div>
            </button>
            <nav className="hidden lg:flex gap-1">
              {[
                { id: 'overview', label: 'Dashboard', icon: Home },
                { id: 'enquiries', label: 'Enquiries', icon: FileText },
                { id: 'fulfillment', label: 'Orders', icon: ShoppingBag },
                { id: 'customers', label: 'Customers', icon: Users },
                { id: 'inventory', label: 'SKU Master', icon: Package },
                { id: 'molecules', label: 'Molecule Master', icon: Dna },
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
                <ExternalLink className="w-3.5 h-3.5" />
                Live Store
              </Button>
            </Link>
            <Button variant="ghost" onClick={performVerification} size="icon" className="w-10 h-10 rounded-xl text-gray-400"><RefreshCw className="w-4 h-4" /></Button>
            <Button variant="ghost" onClick={handleLogout} size="icon" className="w-10 h-10 rounded-xl text-gray-400 hover:text-red-500"><LogOut className="w-4 h-4" /></Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {activeTab === 'overview' && <OverviewTab db={db} setTab={setActiveTab} isVerified={isVerified} />}
        {activeTab === 'enquiries' && <EnquiriesTab db={db} isVerified={isVerified} />}
        {activeTab === 'fulfillment' && <FulfillmentTab db={db} isVerified={isVerified} />}
        {activeTab === 'customers' && <CustomersTab db={db} isVerified={isVerified} />}
        {activeTab === 'inventory' && <InventoryTab db={db} isVerified={isVerified} />}
        {activeTab === 'molecules' && <MoleculeMasterTab db={db} isVerified={isVerified} />}
      </main>
    </div>
  );
}

function OverviewTab({ db, setTab, isVerified }: { db: any, setTab: (t: AdminTab) => void, isVerified: boolean }) {
  const medsQuery = useMemoFirebase(() => query(collection(db, 'medicines')), [db]);
  const molsQuery = useMemoFirebase(() => query(collection(db, 'moleculeMaster')), [db]);
  const usersQuery = useMemoFirebase(() => query(collection(db, 'userProfiles')), [db]);
  
  // Defensive gating for collection group queries
  const presQuery = useMemoFirebase(() => isVerified ? query(collectionGroup(db, 'prescriptions')) : null, [db, isVerified]);
  const ordersQuery = useMemoFirebase(() => isVerified ? query(collectionGroup(db, 'orders')) : null, [db, isVerified]);

  const { data: meds } = useCollection(medsQuery);
  const { data: mols } = useCollection(molsQuery);
  const { data: pres } = useCollection(presQuery);
  const { data: orders } = useCollection(ordersQuery);
  const { data: users } = useCollection(usersQuery);

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">Clinical Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {[
          { label: 'Enquiries', icon: FileText, count: pres?.filter(p => p.status === 'Pending Review').length || 0, tab: 'enquiries' as AdminTab },
          { label: 'Active Orders', icon: ShoppingBag, count: orders?.filter(o => o.status !== 'Delivered').length || 0, tab: 'fulfillment' as AdminTab },
          { label: 'Customers', icon: Users, count: users?.length || 0, tab: 'customers' as AdminTab },
          { label: 'SKU Master', icon: Package, count: meds?.length || 0, tab: 'inventory' as AdminTab },
          { label: 'Molecules', icon: Dna, count: mols?.length || 0, tab: 'molecules' as AdminTab },
        ].map(card => (
          <Card key={card.label} className="rounded-[32px] p-8 border-none shadow-sm hover:shadow-xl transition-all cursor-pointer bg-white group" onClick={() => setTab(card.tab)}>
            <card.icon className="w-10 h-10 text-primary mb-6 group-hover:scale-110 transition-transform" />
            <CardTitle className="text-sm font-black uppercase text-gray-400 tracking-widest mb-1">{card.label}</CardTitle>
            <p className="text-4xl font-black text-primary">{card.count}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

function EnquiriesTab({ db, isVerified }: { db: any, isVerified: boolean }) {
  const presQuery = useMemoFirebase(() => isVerified ? query(collectionGroup(db, 'prescriptions'), orderBy('uploadDate', 'desc')) : null, [db, isVerified]);
  const medsQuery = useMemoFirebase(() => query(collection(db, 'medicines')), [db]);
  const { data: enquiries, isLoading } = useCollection(presQuery);
  const { data: medicines } = useCollection(medsQuery);
  const { toast } = useToast();

  const [filter, setFilter] = useState<'Pending' | 'Open' | 'Completed'>('Pending');
  const [digitizingEnquiry, setDigitizingEnquiry] = useState<any>(null);

  const filteredEnquiries = enquiries?.filter(enq => {
    if (filter === 'Pending') return enq.status === 'Pending Review';
    if (filter === 'Open') return enq.status === 'Acknowledged' || enq.status === 'Processing';
    if (filter === 'Completed') return enq.status === 'Completed' || enq.status === 'Ordered';
    return true;
  });

  const updateStatus = (enquiry: any, status: string) => {
    if (!enquiry.userId) return;
    const ref = doc(db, 'userProfiles', enquiry.userId, 'prescriptions', enquiry.id);
    updateDocumentNonBlocking(ref, { status });
    toast({ title: "Clinical Update", description: `Enquiry status changed to ${status}` });
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black uppercase text-gray-900">Clinical Enquiries</h2>
        <div className="flex bg-white p-1 rounded-full border">
          {(['Pending', 'Open', 'Completed'] as const).map(f => (
            <Button 
              key={f} 
              variant={filter === f ? 'secondary' : 'ghost'} 
              size="sm" 
              onClick={() => setFilter(f)}
              className={`rounded-full px-6 font-black text-[9px] uppercase tracking-widest ${filter === f ? 'bg-primary text-white hover:bg-primary/90' : 'text-gray-400'}`}
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          <div className="col-span-full py-20 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : filteredEnquiries?.length ? filteredEnquiries.map(enq => (
          <Card key={enq.id} className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white hover:shadow-xl transition-all flex flex-col group">
             <div className="aspect-[4/5] relative bg-gray-100 overflow-hidden">
                <img src={enq.imageUrl} alt="Prescription" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <Badge className={`absolute top-4 right-4 text-white text-[8px] font-black uppercase border-none px-4 py-1.5 rounded-full shadow-lg ${
                  enq.status === 'Pending Review' ? 'bg-orange-500' : enq.status === 'Completed' ? 'bg-green-600' : 'bg-blue-600'
                }`}>
                  {enq.status}
                </Badge>
             </div>
             <CardContent className="p-6 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Patient Name</p>
                    <p className="text-[12px] font-black text-gray-900 uppercase">{enq.patientName || 'Not Specified'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Contact</p>
                    <p className="text-[10px] font-bold text-gray-900 flex items-center gap-1 justify-end"><Phone className="w-2.5 h-2.5" /> {enq.phoneNumber || 'N/A'}</p>
                  </div>
                </div>

                {enq.notes && (
                  <div className="bg-gray-50 p-3 rounded-2xl mb-4 border border-dashed">
                     <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1"><MessageSquare className="w-2.5 h-2.5" /> Patient Note</p>
                     <p className="text-[10px] font-bold text-gray-700 leading-tight line-clamp-2">{enq.notes}</p>
                  </div>
                )}

                <div className="mt-auto flex flex-col gap-2">
                  <Dialog open={digitizingEnquiry?.id === enq.id} onOpenChange={(open) => !open && setDigitizingEnquiry(null)}>
                    <DialogTrigger asChild>
                      <Button onClick={() => setDigitizingEnquiry(enq)} size="sm" className="w-full rounded-full h-10 font-black uppercase text-[9px] tracking-widest gap-2 bg-primary shadow-lg shadow-primary/20">
                        <ClipboardList className="w-3.5 h-3.5" /> Digitize & Order
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-[40px] max-w-4xl border-none">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-black uppercase tracking-tight">Prescription Digitization</DialogTitle>
                        <CardDescription className="text-[9px] font-black uppercase tracking-widest">Converting manual enquiry into a clinical order</CardDescription>
                      </DialogHeader>
                      {digitizingEnquiry && (
                        <DigitizationWorkflow 
                          db={db} 
                          enquiry={digitizingEnquiry} 
                          medicines={medicines || []} 
                          onSuccess={() => {
                            updateStatus(digitizingEnquiry, 'Completed');
                            setDigitizingEnquiry(null);
                          }} 
                        />
                      )}
                    </DialogContent>
                  </Dialog>
                  
                  {enq.status === 'Pending Review' && (
                    <Button onClick={() => updateStatus(enq, 'Acknowledged')} variant="outline" size="sm" className="w-full rounded-full h-10 font-black uppercase text-[9px] tracking-widest border-2">
                      Mark as In Progress
                    </Button>
                  )}
                </div>
             </CardContent>
          </Card>
        )) : (
          <div className="col-span-full py-24 text-center bg-white rounded-[40px] border border-dashed">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="w-6 h-6 text-gray-200" />
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight text-gray-900">No Enquiries Found</h3>
            <p className="text-gray-400 font-bold uppercase text-[9px] tracking-widest mt-2">Check other status buckets</p>
          </div>
        )}
      </div>
    </div>
  );
}

function DigitizationWorkflow({ db, enquiry, medicines, onSuccess }: { db: any, enquiry: any, medicines: any[], onSuccess: () => void }) {
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const filteredMeds = medicines.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) || 
    m.sku?.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 5);

  const addItem = (med: any) => {
    setSelectedItems(prev => {
      const existing = prev.find(i => i.id === med.id);
      if (existing) return prev.map(i => i.id === med.id ? {...i, quantity: i.quantity + 1} : i);
      return [...prev, { ...med, quantity: 1 }];
    });
    setSearch('');
  };

  const removeItem = (id: string) => {
    setSelectedItems(prev => prev.filter(i => i.id !== id));
  };

  const calculateTotal = () => selectedItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);

  const handleCreateOrder = async () => {
    if (selectedItems.length === 0) {
      toast({ variant: 'destructive', title: 'Cart Empty', description: 'Add clinical SKUs before ordering.' });
      return;
    }

    setIsProcessing(true);
    try {
      const orderData = {
        userId: enquiry.userId,
        orderDate: serverTimestamp(),
        totalAmount: calculateTotal(),
        status: 'Confirmed',
        paymentStatus: 'Post-paid (Clinical)',
        prescriptionId: enquiry.id,
        items: selectedItems.map(i => ({
          medicineId: i.id,
          quantity: i.quantity,
          unitPrice: i.price,
          name: i.name,
          imageUrl: i.imageUrl
        }))
      };

      const orderRef = collection(db, 'userProfiles', enquiry.userId, 'orders');
      addDocumentNonBlocking(orderRef, orderData);
      
      toast({ title: "Order Digitized", description: "Clinical record created in patient history." });
      onSuccess();
    } catch (e) {
      toast({ variant: 'destructive', title: "Order Failed" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-8 py-6 h-[70vh]">
      <div className="relative rounded-[32px] overflow-hidden border bg-gray-50 flex items-center justify-center">
        <img src={enquiry.imageUrl} alt="Source" className="w-full h-full object-contain" />
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
           <Badge className="bg-white/90 text-primary font-black uppercase text-[8px] tracking-widest backdrop-blur border-none px-3">Reference Image</Badge>
        </div>
      </div>

      <div className="flex flex-col gap-6 overflow-y-auto pr-2 scrollbar-hide">
        <div className="space-y-4">
          <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Search Clinical SKU</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
            <Input 
              placeholder="Start typing SKU or Medicine name..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              className="pl-10 h-12 rounded-xl bg-gray-50 border-none font-bold"
            />
            {search.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border z-10 overflow-hidden">
                {filteredMeds.map(med => (
                  <button key={med.id} onClick={() => addItem(med)} className="w-full p-4 hover:bg-gray-50 flex items-center justify-between transition-colors border-b last:border-none">
                    <div className="flex items-center gap-3">
                      <img src={med.imageUrl} className="w-8 h-8 object-contain bg-gray-50 rounded" />
                      <div className="text-left">
                        <p className="text-[10px] font-black text-gray-900 uppercase">{med.name}</p>
                        <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">{med.sku}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-primary">₹{med.price}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Order Items</Label>
          {selectedItems.length > 0 ? (
            <div className="space-y-2">
              {selectedItems.map(item => (
                <div key={item.id} className="bg-gray-50 p-3 rounded-2xl flex items-center justify-between border">
                   <div className="flex items-center gap-3">
                      <p className="text-[10px] font-black text-gray-900 uppercase">{item.name}</p>
                      <Badge variant="secondary" className="text-[8px] font-black">x{item.quantity}</Badge>
                   </div>
                   <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-gray-900">₹{item.price * item.quantity}</span>
                      <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="h-6 w-6 text-red-300 hover:text-red-500 rounded-lg">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                   </div>
                </div>
              ))}
              <div className="pt-4 mt-4 border-t border-dashed flex justify-between items-baseline">
                <span className="text-xs font-black uppercase tracking-widest text-gray-400">Order Total</span>
                <span className="text-2xl font-black text-primary">₹{calculateTotal()}</span>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center border-2 border-dashed rounded-[32px] bg-gray-50/50">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Add items to begin digitization</p>
            </div>
          )}
        </div>

        <div className="pt-6 border-t mt-auto flex items-center gap-3">
           <Button 
            onClick={handleCreateOrder} 
            disabled={isProcessing || selectedItems.length === 0} 
            className="flex-1 h-14 rounded-full font-black uppercase tracking-widest text-[11px] shadow-xl shadow-primary/20"
           >
             {isProcessing ? <Loader2 className="animate-spin w-4 h-4" /> : "Confirm Digitized Order"}
           </Button>
           <Button onClick={onSuccess} variant="ghost" className="h-14 px-8 rounded-full font-black uppercase text-[9px] tracking-widest text-gray-400">Cancel</Button>
        </div>
      </div>
    </div>
  );
}

function FulfillmentTab({ db, isVerified }: { db: any, isVerified: boolean }) {
  const ordersQuery = useMemoFirebase(() => isVerified ? query(collectionGroup(db, 'orders'), orderBy('orderDate', 'desc')) : null, [db, isVerified]);
  const { data: orders, isLoading } = useCollection(ordersQuery);
  const { toast } = useToast();

  const updateStatus = (order: any, status: string) => {
    if (!order.userId) return;
    const ref = doc(db, 'userProfiles', order.userId, 'orders', order.id);
    updateDocumentNonBlocking(ref, { status });
    toast({ title: "Order Updated", description: `Order ${order.id.substring(0,6)} is ${status}` });
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2">
      <h2 className="text-2xl font-black uppercase text-gray-900">Clinical Logistics</h2>
      <Card className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-[9px] font-black uppercase text-gray-400 border-b">
            <tr>
              <th className="px-8 py-6">Order Reference</th>
              <th className="px-8 py-6">Patient Identifier</th>
              <th className="px-8 py-6">SKUs</th>
              <th className="px-8 py-6 text-center">Value</th>
              <th className="px-8 py-6">Status</th>
              <th className="px-8 py-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr><td colSpan={6} className="p-20 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></td></tr>
            ) : orders?.map(order => (
              <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-8 py-6">
                   <div className="flex flex-col">
                      <span className="font-black text-gray-900 text-xs">#{order.id.substring(0,8).toUpperCase()}</span>
                      <span className="text-[8px] text-gray-400 uppercase font-black tracking-widest flex items-center gap-1"><Clock className="w-2 h-2" /> {order.orderDate?.toDate().toLocaleDateString()}</span>
                   </div>
                </td>
                <td className="px-8 py-6">
                   <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-md">P_{order.userId?.substring(0,8).toUpperCase()}</Badge>
                </td>
                <td className="px-8 py-6">
                  <span className="text-[10px] font-bold text-gray-500 uppercase">{order.items?.length || 0} ITEMS</span>
                </td>
                <td className="px-8 py-6 font-black text-primary text-sm text-center">₹{order.totalAmount}</td>
                <td className="px-8 py-6">
                  <Badge variant="outline" className={`text-[8px] uppercase font-black border-none px-4 py-1.5 rounded-full ${
                    order.status === 'Pending' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'
                  }`}>
                    {order.status}
                  </Badge>
                </td>
                <td className="px-8 py-6 text-right">
                  {order.status !== 'Delivered' && (
                    <div className="flex justify-end gap-2">
                      <Button onClick={() => updateStatus(order, 'Shipped')} disabled={order.status === 'Shipped'} size="sm" className="rounded-full h-10 px-6 font-black uppercase text-[8px] tracking-widest shadow-lg shadow-primary/20">Dispatch</Button>
                      <Button onClick={() => updateStatus(order, 'Delivered')} variant="outline" size="sm" className="rounded-full h-10 px-6 font-black uppercase text-[8px] tracking-widest border-2">Mark Delivered</Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function CustomersTab({ db, isVerified }: { db: any, isVerified: boolean }) {
  const usersQuery = useMemoFirebase(() => query(collection(db, 'userProfiles'), orderBy('createdAt', 'desc')), [db]);
  const { data: users, isLoading } = useCollection(usersQuery);

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2">
      <h2 className="text-2xl font-black uppercase text-gray-900">Customer Master</h2>
      <Card className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-[9px] font-black uppercase text-gray-400 border-b">
            <tr>
              <th className="px-8 py-6">Customer ID</th>
              <th className="px-8 py-6">Full Name</th>
              <th className="px-8 py-6">Mobile Number</th>
              <th className="px-8 py-6">Email Address</th>
              <th className="px-8 py-6">Registration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr><td colSpan={5} className="p-20 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></td></tr>
            ) : users?.map(u => (
              <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-8 py-6">
                   <code className="text-[10px] font-black text-primary bg-primary/5 px-3 py-1 rounded-md">{u.id.substring(0,10)}</code>
                </td>
                <td className="px-8 py-6">
                  <span className="font-black text-gray-900 text-xs uppercase">{u.firstName} {u.lastName}</span>
                </td>
                <td className="px-8 py-6">
                  <span className="text-[10px] font-bold text-gray-600 font-code">{u.phoneNumber}</span>
                </td>
                <td className="px-8 py-6">
                  <span className="text-[10px] font-bold text-gray-400">{u.email || 'N/A'}</span>
                </td>
                <td className="px-8 py-6">
                   <span className="text-[10px] font-bold text-gray-400">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function MoleculeMasterTab({ db, isVerified }: { db: any, isVerified: boolean }) {
  const molsQuery = useMemoFirebase(() => query(collection(db, 'moleculeMaster'), orderBy('molecule', 'asc')), [db]);
  const { data: molecules, isLoading } = useCollection(molsQuery);
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMolecule, setEditingMolecule] = useState<any>(null);

  const filtered = molecules?.filter(m => 
    m.molecule?.toLowerCase().includes(search.toLowerCase()) || 
    m.masterId?.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddNew = () => {
    setEditingMolecule(null);
    setIsFormOpen(true);
  };

  const handleEdit = (mol: any) => {
    setEditingMolecule(mol);
    setIsFormOpen(true);
  };

  const downloadMaster = () => {
    if (!molecules) return;
    const headers = "masterId,molecule,form\n";
    const rows = molecules.map(m => `"${m.masterId}","${m.molecule}","${m.form}"`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'molecule_master.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-black uppercase text-gray-900">Molecule Master</h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <Input placeholder="Search Molecule..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10 rounded-full border-none bg-white font-bold text-xs" />
          </div>
          
          <Button variant="outline" onClick={downloadMaster} className="rounded-full h-10 px-4 font-black text-[9px] uppercase tracking-widest gap-2">
            <Download className="w-3.5 h-3.5" /> Export Master
          </Button>

          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAddNew} className="rounded-full h-10 px-6 font-black text-[9px] uppercase tracking-widest gap-2 shadow-lg shadow-primary/20">
                <Plus className="w-3.5 h-3.5" /> Add Molecule
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[40px] max-w-lg border-none">
              <DialogHeader>
                <DialogTitle className="text-xl font-black uppercase tracking-tight">
                  {editingMolecule ? 'Edit Molecule' : 'Register Molecule'}
                </DialogTitle>
                <CardDescription className="uppercase text-[8px] font-black tracking-widest">
                  Unique identification for bio-equivalent linking
                </CardDescription>
              </DialogHeader>
              <MoleculeForm 
                db={db} 
                initialData={editingMolecule} 
                onSuccess={() => {
                  setIsFormOpen(false);
                  setEditingMolecule(null);
                }} 
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[9px] font-black uppercase text-gray-400 border-b">
              <tr>
                <th className="px-8 py-6">Master ID</th>
                <th className="px-8 py-6">Molecule / Salt</th>
                <th className="px-8 py-6">Dosage Form</th>
                <th className="px-8 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr><td colSpan={4} className="p-20 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></td></tr>
              ) : filtered?.map(mol => (
                <tr key={mol.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <code className="text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-1 rounded-md">{mol.masterId}</code>
                  </td>
                  <td className="px-8 py-6">
                    <span className="font-black text-gray-900 text-xs">{mol.molecule}</span>
                  </td>
                  <td className="px-8 py-6">
                    <Badge variant="secondary" className="px-3 py-1 rounded-full font-black text-[8px] uppercase">
                      {mol.form}
                    </Badge>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" className="text-gray-300 hover:text-primary rounded-full" onClick={() => handleEdit(mol)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-gray-300 hover:text-red-500 rounded-full" onClick={() => {
                        deleteDocumentNonBlocking(doc(db, 'moleculeMaster', mol.id));
                        toast({ title: "Molecule Removed" });
                      }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
  const { toast } = useToast();
  const [form, setForm] = useState({
    masterId: initialData?.masterId || '',
    molecule: initialData?.molecule || '',
    form: initialData?.form || 'Tablet'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const docRef = doc(db, 'moleculeMaster', form.masterId);
    setDocumentNonBlocking(docRef, { ...form, updatedAt: serverTimestamp() }, { merge: true });
    toast({ title: "Molecule Committed" });
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="space-y-2">
        <Label className="text-[9px] font-black uppercase">Master ID (Unique Molecule Identifier)</Label>
        <Input 
          value={form.masterId} 
          onChange={e => setForm({...form, masterId: e.target.value.toLowerCase().replace(/\s+/g, '-')})} 
          disabled={!!initialData}
          required 
          placeholder="e.g. sita-met-50-500" 
          className="rounded-xl h-12 bg-gray-50 border-none font-bold" 
        />
      </div>
      <div className="space-y-2">
        <Label className="text-[9px] font-black uppercase">Molecule / Salt Combination</Label>
        <Input value={form.molecule} onChange={e => setForm({...form, molecule: e.target.value})} required className="rounded-xl h-12 bg-gray-50 border-none font-bold" />
      </div>
      <div className="space-y-2">
        <Label className="text-[9px] font-black uppercase">Standard Dosage Form</Label>
        <select value={form.form} onChange={e => setForm({...form, form: e.target.value})} className="w-full h-12 rounded-xl bg-gray-50 border-none px-4 font-bold outline-none focus:ring-2 focus:ring-primary/20">
          <option value="Tablet">Tablet</option>
          <option value="Capsule">Capsule</option>
          <option value="Syrup">Syrup</option>
          <option value="Injection">Injection</option>
          <option value="Ointment">Ointment</option>
          <option value="Drops">Drops</option>
        </select>
      </div>
      <div className="flex items-center gap-3 pt-6">
        <Button type="submit" className="flex-1 rounded-full h-14 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20">
          Save Molecule
        </Button>
        <Button type="button" variant="ghost" onClick={onSuccess} className="rounded-full h-14 font-black uppercase text-[10px] tracking-widest text-gray-400">Cancel</Button>
      </div>
    </form>
  );
}

function InventoryTab({ db, isVerified }: { db: any, isVerified: boolean }) {
  const medsQuery = useMemoFirebase(() => query(collection(db, 'medicines'), orderBy('name', 'asc')), [db]);
  const molsQuery = useMemoFirebase(() => query(collection(db, 'moleculeMaster')), [db]);
  const { data: medicines, isLoading } = useCollection(medsQuery);
  const { data: molecules } = useCollection(molsQuery);
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [editingMedicine, setEditingMedicine] = useState<any>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const moleculeMap = new Map(molecules?.map(m => [m.masterId, m]));

  const filtered = medicines?.filter(m => 
    m.name?.toLowerCase().includes(search.toLowerCase()) || 
    m.saltComposition?.toLowerCase().includes(search.toLowerCase()) ||
    m.sku?.toLowerCase().includes(search.toLowerCase()) ||
    m.moleculeId?.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (med: any) => {
    setEditingMedicine(med);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingMedicine(null);
    setIsFormOpen(true);
  };

  const downloadCatalog = () => {
    if (!medicines) return;
    const headers = "sku,moleculeId,name,manufacturer,price,availableQuantity\n";
    const rows = medicines.map(m => `"${m.sku}","${m.moleculeId}","${m.name}","${m.manufacturer}",${m.price},${m.availableQuantity}`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sku_master.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-black uppercase text-gray-900">Inventory Control</h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <Input placeholder="Search SKU or Molecule..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10 rounded-full border-none bg-white font-bold text-xs" />
          </div>
          
          <Button variant="outline" onClick={downloadCatalog} className="rounded-full h-10 px-4 font-black text-[9px] uppercase tracking-widest gap-2">
            <Download className="w-3.5 h-3.5" /> Export Catalog
          </Button>

          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAddNew} className="rounded-full h-10 px-6 font-black text-[9px] uppercase tracking-widest gap-2 shadow-lg shadow-primary/20">
                <Plus className="w-3.5 h-3.5" /> Add SKU
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[40px] max-w-2xl border-none">
              <DialogHeader>
                <DialogTitle className="text-xl font-black uppercase tracking-tight">
                  {editingMedicine ? 'Edit Clinical SKU' : 'Add New Medicine'}
                </DialogTitle>
                <CardDescription className="uppercase text-[8px] font-black tracking-widest">
                  Linking to Molecule Master
                </CardDescription>
              </DialogHeader>
              <MedicineForm 
                db={db} 
                initialData={editingMedicine} 
                molecules={molecules || []}
                onSuccess={() => {
                  setIsFormOpen(false);
                  setEditingMedicine(null);
                }} 
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[9px] font-black uppercase text-gray-400 border-b">
              <tr>
                <th className="px-8 py-6">Unique SKU</th>
                <th className="px-8 py-6">Product & MFR</th>
                <th className="px-8 py-6">Molecule Link</th>
                <th className="px-8 py-6 text-center">Unit Price</th>
                <th className="px-8 py-6 text-center">Stock Level</th>
                <th className="px-8 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr><td colSpan={6} className="p-20 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></td></tr>
              ) : filtered?.map(med => {
                const molFound = moleculeMap.get(med.moleculeId);
                return (
                  <tr key={med.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <code className="text-[10px] font-black text-primary bg-primary/5 px-2 py-1 rounded-md">{med.sku || 'N/A'}</code>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="font-black text-gray-900 text-xs">{med.name}</span>
                        <span className="text-[8px] text-gray-400 uppercase font-bold tracking-widest">{med.manufacturer}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-1.5">
                        <LinkIcon className={`w-3 h-3 ${molFound ? 'text-green-500' : 'text-red-400'}`} />
                        <span className={`text-[9px] font-bold ${molFound ? 'text-gray-500' : 'text-red-400 italic'}`}>
                          {med.moleculeId || 'UNTAGGED'} {!molFound && '(Invalid ID)'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 font-black text-center text-sm">₹{med.price}</td>
                    <td className="px-8 py-6 text-center">
                      <Badge variant={med.availableQuantity < 50 ? 'destructive' : 'secondary'} className="px-3 py-1 rounded-full font-black text-[8px] uppercase">
                        {med.availableQuantity || 0} Units
                      </Badge>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" className="text-gray-300 hover:text-primary rounded-full" onClick={() => handleEdit(med)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-gray-300 hover:text-red-500 rounded-full" onClick={() => {
                          deleteDocumentNonBlocking(doc(db, 'medicines', med.id));
                          toast({ title: "SKU Deleted" });
                        }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
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

function MedicineForm({ db, initialData, molecules, onSuccess }: { db: any, initialData?: any, molecules: any[], onSuccess: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    sku: initialData?.sku || '',
    moleculeId: initialData?.moleculeId || '',
    name: initialData?.name || '',
    manufacturer: initialData?.manufacturer || '',
    saltComposition: initialData?.saltComposition || '',
    dosageForm: initialData?.dosageForm || 'Tablet',
    price: initialData?.price || '',
    mrp: initialData?.mrp || '',
    availableQuantity: initialData?.availableQuantity || '',
    packSize: initialData?.packSize || '',
    category: initialData?.category || 'Diabetes',
    isGeneric: initialData?.isGeneric || false,
    prescriptionRequired: initialData?.prescriptionRequired || false,
    imageUrls: initialData?.imageUrls || (initialData?.imageUrl ? [initialData.imageUrl] : [])
  });

  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setUploading(true);
      const newImages: string[] = [];
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newImages.push(reader.result as string);
          if (newImages.length === files.length) {
            setForm(prev => ({ ...prev, imageUrls: [...prev.imageUrls, ...newImages] }));
            setUploading(false);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      imageUrl: form.imageUrls[0] || '',
      price: Number(form.price),
      mrp: Number(form.mrp),
      availableQuantity: Number(form.availableQuantity),
      updatedAt: serverTimestamp()
    };

    if (initialData?.id) {
      updateDocumentNonBlocking(doc(db, 'medicines', initialData.id), payload);
    } else {
      addDocumentNonBlocking(collection(db, 'medicines'), { ...payload, createdAt: serverTimestamp() });
    }
    toast({ title: "SKU Master Updated" });
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 py-4 max-h-[70vh] overflow-y-auto px-1 scrollbar-hide">
      <div className="col-span-2 space-y-2">
        <Label className="text-[9px] font-black uppercase">Product Images</Label>
        <div className="grid grid-cols-5 gap-2">
          {form.imageUrls.map((url: string, i: number) => (
            <div key={i} className="relative aspect-square rounded-lg bg-gray-50 border overflow-hidden group">
              <Image src={url} alt="Preview" fill className="object-contain" />
              <button type="button" onClick={() => setForm(p => ({...p, imageUrls: p.imageUrls.filter((_, idx) => idx !== i)}))} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100"><X className="w-2.5 h-2.5" /></button>
            </div>
          ))}
          <button type="button" onClick={() => document.getElementById('sku-img')?.click()} className="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center text-gray-400"><Plus className="w-4 h-4" /></button>
        </div>
        <input id="sku-img" type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>

      <div className="space-y-2">
        <Label className="text-[9px] font-black uppercase">SKU ID</Label>
        <Input value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} required className="rounded-xl h-12 bg-gray-50 border-none font-bold" />
      </div>
      <div className="space-y-2">
        <Label className="text-[9px] font-black uppercase">Molecule Master ID</Label>
        <select value={form.moleculeId} onChange={e => setForm({...form, moleculeId: e.target.value})} className="w-full h-12 rounded-xl bg-gray-50 border-none px-4 font-bold outline-none focus:ring-2 focus:ring-primary/20">
          <option value="">Select Molecule...</option>
          {molecules.map(m => (
            <option key={m.masterId} value={m.masterId}>{m.molecule} ({m.masterId})</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label className="text-[9px] font-black uppercase">Medicine Name</Label>
        <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="rounded-xl h-12 bg-gray-50 border-none font-bold" />
      </div>
      <div className="space-y-2">
        <Label className="text-[9px] font-black uppercase">Manufacturer</Label>
        <Input value={form.manufacturer} onChange={e => setForm({...form, manufacturer: e.target.value})} required className="rounded-xl h-12 bg-gray-50 border-none font-bold" />
      </div>
      <div className="space-y-2 col-span-2">
        <Label className="text-[9px] font-black uppercase">Salt Composition</Label>
        <Input value={form.saltComposition} onChange={e => setForm({...form, saltComposition: e.target.value})} required className="rounded-xl h-12 bg-gray-50 border-none font-bold" />
      </div>
      <div className="space-y-2">
        <Label className="text-[9px] font-black uppercase">Price (₹)</Label>
        <Input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required className="rounded-xl h-12 bg-gray-50 border-none font-bold" />
      </div>
      <div className="space-y-2">
        <Label className="text-[9px] font-black uppercase">Stock Level</Label>
        <Input type="number" value={form.availableQuantity} onChange={e => setForm({...form, availableQuantity: e.target.value})} required className="rounded-xl h-12 bg-gray-50 border-none font-bold" />
      </div>

      <div className="col-span-2 flex items-center gap-3 pt-6 border-t">
        <Button type="submit" disabled={uploading} className="flex-1 rounded-full h-14 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20">
          Commit SKU
        </Button>
        <Button type="button" variant="ghost" onClick={onSuccess} className="rounded-full h-14 font-black uppercase text-[10px] tracking-widest text-gray-400">Cancel</Button>
      </div>
    </form>
  );
}
