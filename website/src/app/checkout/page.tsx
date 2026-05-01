"use client"

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  MapPin, 
  ShieldCheck, 
  Loader2, 
  Phone, 
  User, 
  Home, 
  ArrowRight, 
  Check,
  Briefcase,
  Plus,
  Tag,
  X,
  Target,
  Banknote,
  Navigation,
  LocateFixed,
  Zap,
  Sparkles,
  Camera,
  FileText,
  Trash2,
  Stethoscope, Lock
} from 'lucide-react';
import { useStorage } from '@/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp, doc, getDoc, query, orderBy, addDoc } from 'firebase/firestore';
import AddressForm from '@/components/AddressForm';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import BottomNav from '@/components/BottomNav';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '@/components/PageTransition';
import Link from 'next/link';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20
    } as any
  }
};

export default function CheckoutPage() {
  const { 
    cart, 
    totalPrice, 
    clearCart, 
    attachedPrescriptions,
    addPrescription,
    removePrescription,
    activeFees,
    appliedPromo
  } = useCart();
  
  const { user } = useUser();
  const db = useFirestore();
  const [loading, setLoading] = useState(false);
  const [isAddressFormLoading, setIsAddressFormLoading] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'Online'>('COD');
  
  const { toast } = useToast();
  const router = useRouter();
  const storage = useStorage();

  const [clinicalPath, setClinicalPath] = useState<'attach' | 'consult'>('attach');
  const [isUploading, setIsUploading] = useState(false);

  const totalMrp = cart.reduce((acc, item) => acc + (item.mrp || item.price + 50) * item.quantity, 0);
  const applicableFees = activeFees.filter(f => totalPrice >= (f.minPurchase || 0));
  const feeTotal = applicableFees.reduce((acc, fee) => {
    const amt = fee.discountedAmount ?? fee.originalAmount ?? 0;
    return fee.type === 'fixed' ? acc + amt : acc + (totalPrice * (amt / 100));
  }, 0);

  let rawDiscount = 0;
  if (appliedPromo) {
    rawDiscount = appliedPromo.discountType === 'fixed' ? appliedPromo.discountValue : (totalPrice * (appliedPromo.discountValue / 100));
  }
  const promoDiscount = (appliedPromo?.maxDiscount && appliedPromo.maxDiscount > 0) ? Math.min(rawDiscount, appliedPromo.maxDiscount) : rawDiscount;
  
  const finalPayable = Math.max(0, totalPrice + feeTotal - promoDiscount);
  const itemSavings = totalMrp - totalPrice;
  const totalSavings = itemSavings + promoDiscount;

  const [orderInfo, setOrderInfo] = useState({
    patientName: '',
    phoneNumber: '',
    houseNumber: '',
    buildingLocality: '',
    city: '',
    state: '',
    pincode: '',
    lat: 0,
    lng: 0,
    tag: 'Home',
    otherTag: ''
  });

  const addressesQuery = useMemoFirebase(() => (db && user) ? query(collection(db, 'userProfiles', user.uid, 'addresses'), orderBy('updatedAt', 'desc')) : null, [db, user]);
  const { data: savedAddresses } = useCollection(addressesQuery);

  useEffect(() => {
    const initProfile = async () => {
      if (user && db) {
        const profileDoc = await getDoc(doc(db, 'userProfiles', user.uid));
        let pName = user.displayName || '';
        let pPhone = (user.phoneNumber || '').replace('+91', '');
        
        if (profileDoc.exists()) {
          const data = profileDoc.data();
          pName = data.name || pName;
          pPhone = (data.phone || pPhone || '').replace('+91', '');
        }
        
        setOrderInfo(prev => ({
          ...prev,
          patientName: pName,
          phoneNumber: pPhone
        }));
      }
    };
    initProfile();
  }, [user, db]);

  useEffect(() => {
    if (savedAddresses && savedAddresses.length > 0 && !selectedAddressId) {
      const defaultAddr = savedAddresses[0];
      setSelectedAddressId(defaultAddr.id);
      setOrderInfo(prev => ({
        ...prev,
        patientName: defaultAddr.patientName || prev.patientName,
        phoneNumber: (defaultAddr.phoneNumber || prev.phoneNumber || '').replace('+91', ''),
        houseNumber: defaultAddr.houseNumber || '',
        buildingLocality: defaultAddr.street,
        pincode: defaultAddr.pincode,
        city: defaultAddr.city || '',
        state: defaultAddr.state || '',
        lat: defaultAddr.lat || 0,
        lng: defaultAddr.lng || 0,
        tag: defaultAddr.tag,
        otherTag: defaultAddr.tag !== 'Home' && defaultAddr.tag !== 'Office' ? defaultAddr.tag : ''
      }));
    }
  }, [savedAddresses]);

  const validate = () => {
    if (!orderInfo.patientName.trim()) {
      toast({ variant: 'destructive', title: "Name missing", description: "Recipient name is required." });
      return false;
    }
    
    const cleanPhone = orderInfo.phoneNumber.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      toast({ variant: 'destructive', title: "Contact error", description: "Please enter a valid 10-digit mobile number." });
      return false;
    }

    const requiresPrescription = cart.some(item => item.prescriptionRequired);
    if (requiresPrescription && clinicalPath === 'attach' && attachedPrescriptions.length === 0) {
      toast({ variant: 'destructive', title: "Clinical File Required", description: "Please attach your prescription or select Doctor Consultation." });
      return false;
    }
    
    if (!orderInfo.houseNumber.trim()) {
      toast({ variant: 'destructive', title: "House no. missing", description: "House or Building number is mandatory." });
      return false;
    }

    if (!orderInfo.buildingLocality.trim()) {
      toast({ variant: 'destructive', title: "Locality required", description: "Please enter your street or area name." });
      return false;
    }
    if (!orderInfo.city.trim()) {
      toast({ variant: 'destructive', title: "City required", description: "City/District is mandatory for delivery." });
      return false;
    }
    if (!orderInfo.state.trim()) {
      toast({ variant: 'destructive', title: "State required", description: "State is mandatory." });
      return false;
    }
    if (!orderInfo.pincode.trim() || orderInfo.pincode.length !== 6) {
      toast({ variant: 'destructive', title: "Pincode required", description: "A valid 6-digit pincode is mandatory." });
      return false;
    }
    return true;
  };

  const handleAddAddress = async (data: any) => {
    if (!user || !db) return;
    setIsAddressFormLoading(true);

    try {
      const payload = {
        patientName: data.patientName,
        phoneNumber: data.phoneNumber,
        houseNumber: data.houseNumber,
        apartmentName: data.apartmentName || '',
        street: data.street,
        landmark: data.landmark || '',
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        tag: data.tag,
        lat: data.lat || 0,
        lng: data.lng || 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'userProfiles', user.uid, 'addresses'), payload);
      
      setIsAddressModalOpen(false);
      toast({
        title: "Address Saved",
        description: "Your new delivery point is ready."
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save address. Please try again."
      });
    } finally {
      setIsAddressFormLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !storage) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 5 * 1024 * 1024) {
          toast({ variant: 'destructive', title: "File too large", description: `${file.name} exceeds 5MB limit.` });
          continue;
        }

        const path = `prescriptions/${user?.uid || 'anonymous'}/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        addPrescription(url);
      }
      toast({ title: "Clinical files locked", description: "Prescription matrix updated." });
    } catch (err) {
      toast({ variant: 'destructive', title: "Upload failed", description: "Could not sync clinical files to cloud." });
    } finally {
      setIsUploading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!user || !db) return;
    if (!selectedAddressId) {
      toast({ variant: 'destructive', title: "No address", description: "Please select or add a delivery point to proceed." });
      return;
    }
    if (!validate()) return;

    setLoading(true);

    try {
      const res = await fetch('/api/logistics/shipway/serviceability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toPincode: orderInfo.pincode })
      });
      const data = await res.json();
      if (!data.serviceable) {
        toast({ 
          variant: 'destructive', 
          title: "Not Serviceable", 
          description: `We currently do not deliver to pincode ${orderInfo.pincode}.` 
        });
        setLoading(false);
        return;
      }
    } catch(e) {
      console.error("Shipway check failed", e);
    }
    
    const cleanPhone = orderInfo.phoneNumber.replace(/\D/g, '');
    const finalTag = orderInfo.tag === 'Other' ? (orderInfo.otherTag || 'Other') : orderInfo.tag;

    const orderData = {
      userId: user.uid,
      orderDate: serverTimestamp(),
      totalAmount: finalPayable,
      status: 'Pending',
      paymentType: paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online',
      patientName: orderInfo.patientName,
      phoneNumber: `+91${cleanPhone}`,
      clinicalPath: clinicalPath,
      isConsultationRequired: clinicalPath === 'consult',
      prescriptionUrls: attachedPrescriptions,
      shippingDetails: {
        houseNumber: orderInfo.houseNumber,
        street: orderInfo.buildingLocality,
        city: orderInfo.city,
        state: orderInfo.state,
        pincode: orderInfo.pincode,
        lat: orderInfo.lat,
        lng: orderInfo.lng,
        tag: finalTag
      },
      items: cart.map(item => ({
        medicineId: item.id,
        quantity: item.quantity,
        unitPrice: item.price,
        mrp: item.mrp || item.price + 50,
        name: item.name
      })),
      billingBreakdown: {
        grossMrp: totalMrp,
        campaignDiscount: promoDiscount,
        deliveryFees: feeTotal,
        savings: totalSavings
      },
      platform: 'website'
    };

    try {
      // 1. Get Authentication Token
      const idToken = await user.getIdToken();

      // 2. Transmit to MongoDB Backend
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(orderData)
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Clinical transmission failed');
      }

      const mongoOrderId = result.orderId; // The ORD00xx ID

      // 3. Sync to User Profile (Firestore) using the SAME ID
      const newOrderRef = doc(db, 'userProfiles', user.uid, 'orders', mongoOrderId);
      setDocumentNonBlocking(newOrderRef, { 
        ...orderData, 
        orderId: mongoOrderId,
        mongoId: result.id 
      }, { merge: false });
      
      toast({ title: "Order processed", description: `Order ID ${mongoOrderId} generated.` });
      
      // 4. Success Navigation
      setTimeout(() => {
        clearCart();
        router.push(`/order-success/${mongoOrderId}`);
      }, 1000);
    } catch (err: any) {
      setLoading(false);
      toast({ variant: 'destructive', title: "Order failed", description: err.message || "Failed to sync order with clinical hub." });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F4F7F6] pharma-bg-pattern pb-32">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-max-h-screen flex items-center justify-center pt-20">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-xl w-full"
          >
            <Card className="rounded-[56px] border-none shadow-3xl bg-white overflow-hidden text-center p-12 sm:p-20 relative">
              <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12">
                 <Lock className="w-48 h-48" />
              </div>
              <div className="w-24 h-24 bg-primary/10 text-primary rounded-[32px] flex items-center justify-center mx-auto mb-10 shadow-xl shadow-primary/5 relative z-10">
                <Lock className="w-10 h-10" />
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tighter font-outfit uppercase mb-6 relative z-10">Checkout Restricted</h1>
              <p className="text-[11px] font-black text-slate-400 tracking-[0.3em] uppercase max-w-sm mx-auto mb-12 relative z-10 leading-relaxed">
                Please login to your Sahimed account to complete your purchase.
              </p>
              <div className="space-y-4 relative z-10">
                <Button 
                  onClick={() => router.push('/login?redirect=/checkout')}
                  className="w-full h-20 rounded-full font-black tracking-widest text-xs uppercase gap-4 shadow-2xl shadow-primary/30 active:scale-95 transition-all bg-primary"
                >
                  <User className="w-6 h-6" />
                  Sign In to Checkout
                </Button>
                <Link href="/">
                  <Button variant="ghost" className="w-full h-14 rounded-full font-black text-[10px] tracking-widest text-slate-400 uppercase gap-2">
                    <ArrowRight className="w-4 h-4 rotate-180" /> Continue Shopping
                  </Button>
                </Link>
              </div>
            </Card>
          </motion.div>
        </main>
      </div>
    );
  }
  return (
    <PageTransition>
      <div className="min-h-screen bg-[#F4F7F6] pharma-bg-pattern pb-32">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-12 md:py-20">
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-12 sm:mb-20"
          >
             <div className="space-y-4">
               <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tighter font-outfit uppercase">Checkout</h1>
               <div className="flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                 <p className="text-[10px] font-black text-slate-400 tracking-[0.3em] uppercase">Confirm your delivery address</p>
               </div>
             </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-20">
            <div className="lg:col-span-2 space-y-16">
              
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="space-y-10"
              >
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight font-outfit uppercase">Shipping Addresses</h3>
                  <button 
                    onClick={() => setIsAddressModalOpen(true)}
                    className="bg-white/60 backdrop-blur-md px-6 py-3 rounded-full border border-white text-primary font-black text-[10px] tracking-[0.2em] flex items-center gap-3 uppercase hover:bg-white shadow-xl transition-all active:scale-95"
                  >
                    <Plus className="w-4 h-4" /> Add Address
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {savedAddresses && savedAddresses.length > 0 ? (
                    savedAddresses.map((addr) => (
                      <motion.div 
                        key={addr.id}
                        variants={itemVariants}
                        onClick={() => {
                          setSelectedAddressId(addr.id);
                          setOrderInfo(prev => ({
                            ...prev,
                            patientName: addr.patientName || prev.patientName,
                            phoneNumber: (addr.phoneNumber || prev.phoneNumber || '').replace('+91', ''),
                            houseNumber: addr.houseNumber || '',
                            buildingLocality: addr.street,
                            pincode: addr.pincode,
                            city: addr.city || '',
                            state: addr.state || '',
                            lat: addr.lat || 0,
                            lng: addr.lng || 0,
                            tag: addr.tag
                          }));
                          toast({ title: `Target locked: ${addr.tag}` });
                        }}
                        className={cn(
                          "p-8 rounded-[48px] border-2 cursor-pointer transition-all flex items-center justify-between bg-white/40 backdrop-blur-md shadow-xl hover:shadow-2xl group relative overflow-hidden",
                          selectedAddressId === addr.id ? "border-primary bg-white shadow-primary/10" : "border-transparent"
                        )}
                      >
                        <div className="flex items-center gap-6 min-w-0 relative z-10">
                          <div className={cn("w-16 h-16 rounded-[24px] flex items-center justify-center shrink-0 shadow-inner", selectedAddressId === addr.id ? "bg-primary text-white" : "bg-white text-slate-300")}>
                            {addr.tag === 'Home' ? <Home className="w-8 h-8" /> : addr.tag === 'Office' ? <Briefcase className="w-8 h-8" /> : <MapPin className="w-8 h-8" />}
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-[10px] text-slate-900 tracking-[0.2em] uppercase">{addr.tag}</p>
                            <p className="text-xs font-bold text-slate-500 line-clamp-2 leading-relaxed mt-2 uppercase">
                              {addr.houseNumber ? `${addr.houseNumber}, ` : ''}{addr.street}
                            </p>
                            <p className="text-[9px] font-black text-slate-400 mt-2 tracking-widest uppercase opacity-60">PIN: {addr.pincode}</p>
                          </div>
                        </div>
                        <div className="shrink-0 ml-6 relative z-10">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-inner",
                            selectedAddressId === addr.id ? "bg-primary scale-110" : "bg-white group-hover:bg-slate-50"
                          )}>
                            <Check className={cn("w-4 h-4", selectedAddressId === addr.id ? "text-white" : "text-transparent")} />
                          </div>
                        </div>
                        {selectedAddressId === addr.id && (
                          <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12">
                            <LocateFixed className="w-20 h-20 text-primary" />
                          </div>
                        )}
                      </motion.div>
                    ))
                  ) : (
                    <motion.div 
                      variants={itemVariants}
                      onClick={() => setIsAddressModalOpen(true)}
                      className="p-16 rounded-[48px] border-2 border-dashed border-slate-200 bg-white/40 backdrop-blur-md text-center cursor-pointer hover:bg-white transition-all col-span-full group"
                    >
                      <div className="w-20 h-20 bg-white rounded-[32px] flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-2xl border border-white">
                        <MapPin className="w-10 h-10 text-slate-200" />
                      </div>
                      <p className="text-[10px] font-black text-slate-400 tracking-[0.4em] uppercase" >No saved addresses found</p>
                      <p className="text-xs font-black text-primary mt-4 tracking-[0.2em] uppercase transition-all group-hover:scale-110">+ Add Delivery Address</p>
                    </motion.div>
                  )}
                </div>
              </motion.div>


              {/* Clinical Verification Path */}
              {cart.some(i => i.prescriptionRequired) && (
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="space-y-10"
                >
                  <div className="flex items-center gap-4 px-2">
                    <div className="w-1 h-6 bg-rose-500 rounded-full" />
                    <h3 className="text-lg font-black text-slate-900 tracking-tight font-outfit uppercase">Prescription Options</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Attach Option */}
                    <div 
                      onClick={() => setClinicalPath('attach')}
                      className={cn(
                        "p-8 rounded-[48px] border-2 cursor-pointer transition-all bg-white/40 backdrop-blur-md shadow-xl relative overflow-hidden group",
                        clinicalPath === 'attach' ? "border-primary bg-white ring-4 ring-primary/5" : "border-transparent"
                      )}
                    >
                      <div className="flex items-center gap-6 relative z-10">
                        <div className={cn("w-14 h-14 rounded-[20px] flex items-center justify-center shadow-inner", clinicalPath === 'attach' ? "bg-primary text-white" : "bg-white text-slate-300")}>
                          <FileText className="w-7 h-7" />
                        </div>
                        <div>
                          <p className="font-black text-sm tracking-tight font-outfit uppercase">Prescription Available</p>
                          <p className="text-[9px] font-bold text-slate-400 tracking-widest uppercase mt-1">Upload verified files</p>
                        </div>
                      </div>
                      <div className={cn("absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center border-2", clinicalPath === 'attach' ? "bg-primary border-primary" : "border-slate-100")}>
                        {clinicalPath === 'attach' && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                    </div>

                    {/* Consult Option */}
                    <div 
                      onClick={() => setClinicalPath('consult')}
                      className={cn(
                        "p-8 rounded-[48px] border-2 cursor-pointer transition-all bg-white/40 backdrop-blur-md shadow-xl relative overflow-hidden group",
                        clinicalPath === 'consult' ? "border-emerald-500 bg-white ring-4 ring-emerald-500/5" : "border-transparent"
                      )}
                    >
                      <div className="flex items-center gap-6 relative z-10">
                        <div className={cn("w-14 h-14 rounded-[20px] flex items-center justify-center shadow-inner", clinicalPath === 'consult' ? "bg-emerald-500 text-white" : "bg-white text-slate-300")}>
                          <Stethoscope className="w-7 h-7" />
                        </div>
                        <div>
                          <p className="font-black text-sm tracking-tight font-outfit uppercase">Consult Doctor</p>
                          <p className="text-[9px] font-bold text-slate-400 tracking-widest uppercase mt-1">Free digital consultation</p>
                        </div>
                      </div>
                      <div className={cn("absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center border-2", clinicalPath === 'consult' ? "bg-emerald-500 border-emerald-500" : "border-slate-100")}>
                        {clinicalPath === 'consult' && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                    </div>
                  </div>

                  {/* Attachment Matrix Layer */}
                  <AnimatePresence mode="wait">
                    {clinicalPath === 'attach' && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="bg-white p-10 rounded-[48px] border-2 border-primary/5 shadow-2xl space-y-8">
                          <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Upload Prescription</h4>
                            <Button 
                              onClick={() => document.getElementById('checkout-rx-upload')?.click()} 
                              disabled={isUploading}
                              className="rounded-full bg-primary/10 hover:bg-primary/20 text-primary font-black text-[9px] tracking-widest px-6 h-10 border-none uppercase flex gap-2"
                            >
                              {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                              Upload File
                            </Button>
                            <input id="checkout-rx-upload" type="file" multiple className="hidden" accept="image/*,.pdf" onChange={handleFileChange} />
                          </div>

                          {attachedPrescriptions.length > 0 ? (
                            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                              {attachedPrescriptions.map((url, idx) => {
                                const isPDF = url.toLowerCase().includes('.pdf') || url.includes('application%2Fpdf');
                                if (!user) {
    return (
      <div className="min-h-screen bg-[#F4F7F6] pharma-bg-pattern pb-32">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-max-h-screen flex items-center justify-center pt-20">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-xl w-full"
          >
            <Card className="rounded-[56px] border-none shadow-3xl bg-white overflow-hidden text-center p-12 sm:p-20 relative">
              <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12">
                 <Lock className="w-48 h-48" />
              </div>
              <div className="w-24 h-24 bg-primary/10 text-primary rounded-[32px] flex items-center justify-center mx-auto mb-10 shadow-xl shadow-primary/5 relative z-10">
                <Lock className="w-10 h-10" />
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tighter font-outfit uppercase mb-6 relative z-10">Checkout Restricted</h1>
              <p className="text-[11px] font-black text-slate-400 tracking-[0.3em] uppercase max-w-sm mx-auto mb-12 relative z-10 leading-relaxed">
                Please login to your Sahimed account to complete your purchase.
              </p>
              <div className="space-y-4 relative z-10">
                <Button 
                  onClick={() => router.push('/login?redirect=/checkout')}
                  className="w-full h-20 rounded-full font-black tracking-widest text-xs uppercase gap-4 shadow-2xl shadow-primary/30 active:scale-95 transition-all bg-primary"
                >
                  <User className="w-6 h-6" />
                  Sign In to Checkout
                </Button>
                <Link href="/">
                  <Button variant="ghost" className="w-full h-14 rounded-full font-black text-[10px] tracking-widest text-slate-400 uppercase gap-2">
                    <ArrowRight className="w-4 h-4 rotate-180" /> Continue Shopping
                  </Button>
                </Link>
              </div>
            </Card>
          </motion.div>
        </main>
      </div>
    );
  }
  return (
                                  <motion.div key={idx} initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="relative shrink-0 group">
                                    {isPDF ? (
                                      <div className="w-24 h-24 rounded-3xl bg-slate-50 border-2 border-slate-100 flex flex-col items-center justify-center text-rose-500">
                                        <FileText className="w-10 h-10" />
                                        <p className="text-[8px] font-black mt-1 uppercase">CLINICAL DOC</p>
                                      </div>
                                    ) : (
                                      <img src={url} className="w-24 h-24 object-cover rounded-3xl border-2 border-slate-100 shadow-md" alt="" />
                                    )}
                                    <button 
                                      onClick={() => removePrescription(idx)}
                                      className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white shadow-xl border border-slate-100 flex items-center justify-center text-rose-500 hover:scale-110 transition-all opacity-0 group-hover:opacity-100"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </motion.div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="py-12 text-center rounded-[32px] bg-slate-50 border-2 border-dashed border-slate-100">
                              <Camera className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                              <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">No documentation synchronized</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {clinicalPath === 'consult' && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="overflow-hidden"
                      >
                       <div className="bg-emerald-50/50 p-10 rounded-[48px] border-2 border-emerald-100 text-center space-y-4">
                          <Stethoscope className="w-12 h-12 text-emerald-300 mx-auto" />
                          <h4 className="text-sm font-black text-emerald-900 tracking-tight font-outfit uppercase">Doctor Consultation Requested</h4>
                          <p className="text-[10px] font-bold text-emerald-700 leading-relaxed max-w-sm mx-auto uppercase tracking-wider">
                            Our medical team will contact you to confirm your prescription and authorize your order via free digital consult.
                          </p>
                       </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="space-y-10"
              >
                <div className="flex items-center gap-4 px-2">
                   <div className="w-1 h-6 bg-primary rounded-full" />
                   <h3 className="text-lg font-black text-slate-900 tracking-tight font-outfit uppercase">Payment Method</h3>
                </div>
                <div 
                  className={cn(
                    "p-8 rounded-[48px] border-2 cursor-pointer transition-all flex items-center justify-between bg-white/40 backdrop-blur-md shadow-xl relative overflow-hidden group",
                    paymentMethod === 'COD' ? "border-primary bg-white" : "border-transparent"
                  )}
                  onClick={() => setPaymentMethod('COD')}
                >
                  <div className="flex items-center gap-8 relative z-10">
                    <div className={cn("w-16 h-16 rounded-[24px] flex items-center justify-center shadow-inner transition-colors", paymentMethod === 'COD' ? "bg-primary text-white" : "bg-white text-slate-300")}>
                      <Banknote className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="font-black text-lg tracking-tight font-outfit uppercase">Cash on Delivery</p>
                      <p className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase mt-1">Pay when you receive your order</p>
                    </div>
                  </div>
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shadow-inner relative z-10", paymentMethod === 'COD' ? "bg-primary" : "bg-white")}>
                    <Check className={cn("w-4 h-4", paymentMethod === 'COD' ? "text-white" : "text-transparent")} />
                  </div>
                  {paymentMethod === 'COD' && (
                    <div className="absolute top-0 right-0 p-6 opacity-5 rotate-12">
                      <Zap className="w-24 h-24 text-primary fill-primary" />
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            <div className="lg:col-span-1">
              <motion.div 
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-white p-10 sm:p-12 rounded-[56px] shadow-[0_64px_96px_-16px_rgba(0,0,0,0.1)] border border-white sticky top-32 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />
                
                <h2 className="text-[10px] sm:text-xs font-black mb-8 tracking-[0.4em] text-slate-400 uppercase relative z-10">Invoice Summary</h2>
                <div className="space-y-4 sm:space-y-6 mb-8 relative z-10 pt-8 border-t border-slate-100">
                  <div className="flex justify-between text-xs sm:text-sm font-bold text-slate-600 uppercase tracking-widest">
                    <span>Total MRP</span>
                    <span>₹{totalMrp.toFixed(2)}</span>
                  </div>
                  {itemSavings > 0 && (
                    <div className="flex justify-between text-xs sm:text-sm font-bold text-primary uppercase tracking-widest">
                      <span>Discount Amount</span>
                      <span>-₹{itemSavings.toFixed(2)}</span>
                    </div>
                  )}
                  {appliedPromo && (
                    <div className="flex justify-between text-xs sm:text-sm font-bold text-primary uppercase tracking-widest">
                      <span className="flex items-center gap-2"><Tag className="w-3.5 h-3.5" /> Promocode Saving</span>
                      <span>-₹{promoDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  {feeTotal > 0 && (
                    <div className="flex justify-between text-xs sm:text-sm font-bold text-slate-600 uppercase tracking-widest">
                      <span>Delivery Fees</span>
                      <span>₹{feeTotal.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="pt-6 sm:pt-8 border-t border-slate-100 flex justify-between items-baseline">
                    <span className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-widest">Total Payable</span>
                    <span className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tighter font-outfit">₹{finalPayable.toFixed(2)}</span>
                  </div>
                  
                  {totalSavings > 0 && (
                    <div className="mt-6 flex justify-between items-center text-xs sm:text-sm font-black text-emerald-700 bg-emerald-50 p-4 rounded-[16px] border border-emerald-100 shadow-inner">
                      <span className="flex items-center gap-2 uppercase tracking-widest">Total Savings</span>
                      <span className="bg-emerald-100 px-3 py-1.5 rounded-md text-[10px] sm:text-xs uppercase tracking-widest border border-emerald-200">
                        Saved ₹{totalSavings.toFixed(2)} ({Math.round((totalSavings / totalMrp) * 100)}%)
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-6 relative z-10">
                  <Button 
                    onClick={handlePlaceOrder} 
                    disabled={loading} 
                    className="w-full h-20 rounded-full text-xs font-black tracking-[0.3em] uppercase shadow-2xl shadow-primary/20 bg-primary hover:bg-primary/90 gap-4 text-white transition-all active:scale-95 group"
                  >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                      <>
                        Place Order
                        <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                      </>
                    )}
                  </Button>
                  
                  <div className="flex items-center justify-center gap-3 py-4 bg-slate-50 rounded-[28px] border border-slate-100 shadow-inner">
                     <ShieldCheck className="w-4 h-4 text-primary" />
                     <span className="text-[9px] font-black text-slate-400 tracking-[0.2em] uppercase">100% Safe & Secure</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </main>
        <BottomNav />

        <Dialog open={isAddressModalOpen} onOpenChange={setIsAddressModalOpen}>
          <DialogContent className="max-w-md w-[94vw] rounded-[40px] p-0 border-none shadow-3xl bg-white z-[110] overflow-hidden">
            <div className="bg-primary p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
                <MapPin className="w-20 h-20" />
              </div>
              <DialogTitle className="text-xl font-black tracking-tighter uppercase font-outfit">New Address</DialogTitle>
              <DialogDescription className="text-[8px] font-black text-white/60 tracking-[0.2em] mt-2 uppercase">
                Add delivery information
              </DialogDescription>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <AddressForm 
                initialData={{
                  patientName: orderInfo?.patientName || '',
                  phoneNumber: orderInfo?.phoneNumber || ''
                }}
                onSave={handleAddAddress}
                isLoading={isAddressFormLoading}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
}

