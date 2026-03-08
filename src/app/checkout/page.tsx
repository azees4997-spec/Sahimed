
"use client"

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  MapPin, 
  ShieldCheck, 
  Loader2, 
  Phone, 
  User, 
  Home, 
  Building2, 
  Hash, 
  ArrowRight, 
  LocateFixed, 
  AlertCircle, 
  UserPlus, 
  CheckCircle2, 
  AlertTriangle,
  Banknote,
  CreditCard,
  Check,
  Zap,
  Briefcase,
  Navigation,
  Search,
  Plus,
  UserCheck,
  Tag,
  X,
  Target
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp, doc, getDoc, query, orderBy } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function CheckoutPage() {
  const { 
    cart, 
    totalPrice, 
    clearCart, 
    location: homepageLocation, 
    attachedPrescription,
    activeFees,
    appliedPromo
  } = useCart();
  
  const { user } = useUser();
  const db = useFirestore();
  const [loading, setLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isSomeoneElse, setIsSomeoneElse] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'Online'>('COD');
  
  const { toast } = useToast();
  const router = useRouter();

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
    tag: 'Home'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // --- Fetch Addresses ---
  const addressesQuery = useMemoFirebase(() => (db && user) ? query(collection(db, 'userProfiles', user.uid, 'addresses'), orderBy('updatedAt', 'desc')) : null, [db, user]);
  const { data: savedAddresses } = useCollection(addressesQuery);

  useEffect(() => {
    const initCheckout = async () => {
      if (user) {
        const profileDoc = await getDoc(doc(db, 'userProfiles', user.uid));
        if (profileDoc.exists()) {
          const data = profileDoc.data();
          if (!isSomeoneElse) {
            setOrderInfo(prev => ({
              ...prev,
              patientName: data.name || user.displayName || '',
              phoneNumber: (data.phone || user.phoneNumber || '').replace('+91', '')
            }));
          }
        }
      }
    };
    initCheckout();
  }, [user, db, isSomeoneElse]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!orderInfo.patientName.trim()) newErrors.patientName = "Name is required";
    if (!orderInfo.phoneNumber.trim()) newErrors.phoneNumber = "Phone is required";
    if (!orderInfo.buildingLocality.trim()) newErrors.buildingLocality = "Address is required";
    if (!orderInfo.pincode.trim() || orderInfo.pincode.length !== 6) newErrors.pincode = "Invalid PIN";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLocateMe = () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
            const data = await response.json();
            
            if (data && data.address) {
              setOrderInfo(prev => ({
                ...prev,
                buildingLocality: data.address.suburb || data.address.neighbourhood || data.display_name,
                city: data.address.city || data.address.town || data.address.village || '',
                state: data.address.state || '',
                pincode: data.address.postcode?.replace(/\s/g, '') || prev.pincode,
                lat,
                lng
              }));
              toast({ title: "Live Position Locked" });
            }
          } catch (e) {
            toast({ variant: 'destructive', title: 'GPS Sync Failed' });
          } finally {
            setIsLocating(false);
          }
        },
        () => setIsLocating(false),
        { enableHighAccuracy: true }
      );
    }
  };

  const handlePlaceOrder = async () => {
    if (!user) return;
    if (!validate()) return;

    setLoading(true);
    
    const applicableFees = activeFees.filter(f => totalPrice >= (f.minPurchase || 0));
    const feeTotal = applicableFees.reduce((acc, fee) => {
      const amt = fee.discountedAmount ?? fee.originalAmount ?? 0;
      return fee.type === 'fixed' ? acc + amt : acc + (totalPrice * (amt / 100));
    }, 0);

    let promoDiscount = 0;
    if (appliedPromo) {
      const raw = appliedPromo.discountType === 'fixed' ? appliedPromo.discountValue : (totalPrice * (appliedPromo.discountValue/100));
      promoDiscount = (appliedPromo.maxDiscount && appliedPromo.maxDiscount > 0) ? Math.min(raw, appliedPromo.maxDiscount) : raw;
    }

    const deliveryFeeDoc = activeFees.find(f => f.name.toLowerCase().includes('delivery'));
    const finalAmount = Math.max(0, totalPrice + feeTotal - promoDiscount) + (totalPrice < (deliveryFeeDoc?.minPurchase || 500) ? (deliveryFeeDoc?.discountedAmount || 40) : 0);

    const fullStreet = `${orderInfo.houseNumber}, ${orderInfo.buildingLocality}, ${orderInfo.city}, ${orderInfo.state}`;

    const orderData = {
      userId: user.uid,
      orderDate: serverTimestamp(),
      totalAmount: finalAmount,
      status: 'Pending',
      paymentType: paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online',
      patientName: orderInfo.patientName,
      phoneNumber: `+91${orderInfo.phoneNumber}`,
      isSomeoneElse,
      prescriptionUrl: attachedPrescription || null,
      shippingDetails: {
        street: fullStreet,
        pincode: orderInfo.pincode,
        lat: orderInfo.lat,
        lng: orderInfo.lng,
        tag: orderInfo.tag
      },
      items: cart.map(item => ({
        medicineId: item.id,
        quantity: item.quantity,
        unitPrice: item.price,
        name: item.name
      })),
      billingBreakdown: {
        grossMrp: cart.reduce((acc, it) => acc + (it.mrp || it.price + 50) * it.quantity, 0),
        campaignDiscount: promoDiscount,
        savings: (cart.reduce((acc, it) => acc + (it.mrp || it.price + 50) * it.quantity, 0)) - finalAmount
      }
    };

    try {
      const newOrderRef = doc(collection(db, 'userProfiles', user.uid, 'orders'));
      setDocumentNonBlocking(newOrderRef, orderData, { merge: false });
      
      // Auto-save address to registry
      addDocumentNonBlocking(collection(db, 'userProfiles', user.uid, 'addresses'), {
        street: fullStreet,
        pincode: orderInfo.pincode,
        lat: orderInfo.lat,
        lng: orderInfo.lng,
        tag: orderInfo.tag,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      clearCart();
      router.push(`/order-success/${newOrderRef.id}`);
    } catch (err) {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F8F8] pb-32 sm:pb-8 page-transition-wrapper">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-6 md:py-16">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 sm:mb-12">
           <div className="space-y-1">
             <h1 className="text-2xl sm:text-3xl font-black text-gray-900 uppercase tracking-tighter">Delivery Details</h1>
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Confirm Logistic Path</p>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          <div className="lg:col-span-2 space-y-8">
            
            {/* ADDRESS LIST SECTION */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Address List</h3>
                <button 
                  onClick={() => setIsAddressModalOpen(true)}
                  className="text-primary font-black text-[10px] uppercase tracking-widest flex items-center gap-1.5 hover:underline"
                >
                  <Plus className="w-3 h-3" /> Add New Address
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {savedAddresses && savedAddresses.length > 0 ? (
                  savedAddresses.map((addr) => (
                    <div 
                      key={addr.id}
                      onClick={() => {
                        setOrderInfo(prev => ({
                          ...prev,
                          buildingLocality: addr.street,
                          pincode: addr.pincode,
                          lat: addr.lat || 0,
                          lng: addr.lng || 0,
                          tag: addr.tag
                        }));
                        toast({ title: `Location Locked: ${addr.tag}` });
                      }}
                      className={cn(
                        "p-5 rounded-[24px] border-2 cursor-pointer transition-all flex items-center justify-between bg-white shadow-sm hover:shadow-md",
                        orderInfo.buildingLocality === addr.street ? "border-primary bg-primary/5" : "border-transparent hover:border-gray-100"
                      )}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", orderInfo.buildingLocality === addr.street ? "bg-primary text-white" : "bg-gray-50 text-gray-400")}>
                          {addr.tag === 'Home' ? <Home className="w-5 h-5" /> : addr.tag === 'Office' ? <Briefcase className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-[10px] uppercase text-gray-900 tracking-tight">{addr.tag}</p>
                          <p className="text-[11px] font-bold text-gray-500 line-clamp-1 uppercase leading-tight mt-0.5">{addr.street}</p>
                        </div>
                      </div>
                      {orderInfo.buildingLocality === addr.street && (
                        <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center shrink-0 ml-2">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div 
                    onClick={() => setIsAddressModalOpen(true)}
                    className="p-10 rounded-[32px] border-2 border-dashed border-gray-200 bg-white text-center cursor-pointer hover:bg-gray-50 transition-colors col-span-full"
                  >
                    <MapPin className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No saved locations found</p>
                    <p className="text-[10px] font-bold text-primary mt-2 uppercase tracking-widest">+ Tap to add delivery point</p>
                  </div>
                )}
              </div>
            </div>

            {/* PAYMENT MODE SELECTOR */}
            <Card className="rounded-[32px] border-none shadow-sm overflow-hidden bg-white">
              <CardHeader className="bg-white p-6 border-b">
                <CardTitle className="text-lg font-black uppercase tracking-tight">Payment Method</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div 
                  className={cn(
                    "p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between",
                    paymentMethod === 'COD' ? "border-primary bg-primary/5" : "border-gray-50 hover:border-gray-100"
                  )}
                  onClick={() => setPaymentMethod('COD')}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", paymentMethod === 'COD' ? "bg-primary text-white" : "bg-gray-50 text-gray-400")}>
                      <Banknote className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-black text-xs uppercase tracking-tight">Cash on Delivery</p>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Collect at doorstep</p>
                    </div>
                  </div>
                  {paymentMethod === 'COD' && <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white p-8 rounded-[40px] shadow-2xl border border-gray-50 sticky top-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-[10px] font-black mb-8 text-gray-400 uppercase tracking-[0.3em]">Checkout Summary</h2>
              
              <div className="space-y-4 mb-8 pt-6 border-t border-dashed">
                <div className="flex justify-between text-[10px] font-black uppercase text-gray-400">
                  <span>Order Value</span>
                  <span>₹{totalPrice.toFixed(2)}</span>
                </div>
                {appliedPromo && (
                  <div className="flex justify-between text-[10px] font-black uppercase text-accent">
                    <span className="flex items-center gap-1.5"><Tag className="w-3 h-3" /> Offer Applied</span>
                    <span>-₹{(appliedPromo.discountType === 'fixed' ? appliedPromo.discountValue : (totalPrice * (appliedPromo.discountValue/100))).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[10px] font-black uppercase text-gray-900">
                  <span>Logistics Charge</span>
                  <span className="text-accent font-black">FREE</span>
                </div>
                <div className="pt-6 border-t border-gray-100 flex justify-between items-baseline">
                  <span className="text-sm font-black text-gray-900 uppercase tracking-widest">Payable</span>
                  <span className="text-3xl font-black text-primary tracking-tighter">₹{totalPrice.toFixed(2)}</span>
                </div>
              </div>
              <Button onClick={handlePlaceOrder} disabled={loading} className="w-full h-18 rounded-full text-xs font-black uppercase tracking-widest shadow-2xl bg-primary hover:bg-primary/90 gap-3 text-white transition-all active:scale-95">
                {loading ? <Loader2 className="animate-spin" /> : "Verify & Place Order"}
                <ArrowRight className="w-4 h-4" />
              </Button>
              <div className="mt-6 flex items-center justify-center gap-3">
                 <ShieldCheck className="w-4 h-4 text-accent" />
                 <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Licensed Pharmacy Network</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* DELIVERY DETAILS MODAL */}
      <Dialog open={isAddressModalOpen} onOpenChange={setIsAddressModalOpen}>
        <DialogContent className="max-w-md w-[92vw] sm:w-full rounded-[32px] border-none p-0 overflow-hidden shadow-3xl bg-white mx-auto animate-in zoom-in-95 duration-300">
          <div className="max-h-[90vh] overflow-y-auto scrollbar-hide">
            <div className="p-6 md:p-10 space-y-8">
              <div className="space-y-1.5">
                <DialogTitle className="text-2xl font-black text-gray-900 uppercase tracking-tight">Delivery Details</DialogTitle>
                <p className="text-[11px] font-bold text-primary uppercase tracking-widest opacity-80">For all delivery related communication</p>
              </div>

              <div className="space-y-5">
                <div className="space-y-1">
                  <Input 
                    placeholder="Your Name" 
                    value={orderInfo.patientName} 
                    onChange={e => setOrderInfo({...orderInfo, patientName: e.target.value})}
                    className="h-14 rounded-2xl bg-gray-50 border border-gray-100 font-bold placeholder:text-gray-300 text-sm focus-visible:ring-primary focus-visible:ring-offset-0 focus-visible:border-primary transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input 
                    placeholder="Pin Code" 
                    value={orderInfo.pincode} 
                    onChange={e => setOrderInfo({...orderInfo, pincode: e.target.value.replace(/\D/g, '').slice(0, 6)})}
                    className="h-14 rounded-2xl bg-gray-50 border border-gray-100 font-bold placeholder:text-gray-300 text-sm focus-visible:ring-primary focus-visible:ring-offset-0"
                  />
                  <Button 
                    onClick={handleLocateMe}
                    variant="outline" 
                    className="h-14 rounded-2xl border-primary text-primary hover:bg-primary/5 font-black text-[10px] uppercase gap-2 bg-white transition-all active:scale-95 shadow-sm"
                  >
                    {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
                    PICK LOCATION
                  </Button>
                </div>

                <Input 
                  placeholder="House number, floor" 
                  value={orderInfo.houseNumber} 
                  onChange={e => setOrderInfo({...orderInfo, houseNumber: e.target.value})}
                  className="h-14 rounded-2xl bg-gray-50 border border-gray-100 font-bold placeholder:text-gray-300 text-sm focus-visible:ring-primary focus-visible:ring-offset-0"
                />

                <Input 
                  placeholder="Building name, locality" 
                  value={orderInfo.buildingLocality} 
                  onChange={e => setOrderInfo({...orderInfo, buildingLocality: e.target.value})}
                  className="h-14 rounded-2xl bg-gray-50 border border-gray-100 font-bold placeholder:text-gray-300 text-sm focus-visible:ring-primary focus-visible:ring-offset-0"
                />

                <Input 
                  placeholder="City" 
                  value={orderInfo.city} 
                  onChange={e => setOrderInfo({...orderInfo, city: e.target.value})}
                  className="h-14 rounded-2xl bg-gray-50 border border-gray-100 font-bold placeholder:text-gray-300 text-sm focus-visible:ring-primary focus-visible:ring-offset-0"
                />

                <Input 
                  placeholder="State" 
                  value={orderInfo.state} 
                  onChange={e => setOrderInfo({...orderInfo, state: e.target.value})}
                  className="h-14 rounded-2xl bg-gray-50 border border-gray-100 font-bold placeholder:text-gray-300 text-sm focus-visible:ring-primary focus-visible:ring-offset-0"
                />

                <Input 
                  placeholder="Phone Number" 
                  value={orderInfo.phoneNumber} 
                  onChange={e => setOrderInfo({...orderInfo, phoneNumber: e.target.value.replace(/\D/g, '').slice(0, 10)})}
                  className="h-14 rounded-2xl bg-gray-50 border border-gray-100 font-bold placeholder:text-gray-300 text-sm focus-visible:ring-primary focus-visible:ring-offset-0"
                />

                <div className="bg-[#FFFCE6] p-5 rounded-2xl border border-[#F5E1A4]">
                  <p className="text-[10px] font-black text-[#856404] leading-relaxed uppercase tracking-wider text-center">
                    DELIVERY AGENT WILL CALL ON THIS NUMBER AT TIME OF DELIVERY
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  {['Home', 'Office', 'Other'].map(t => (
                    <button 
                      key={t}
                      onClick={() => setOrderInfo({...orderInfo, tag: t})}
                      className={cn(
                        "flex-1 h-12 rounded-full text-[10px] font-black uppercase tracking-widest border-2 transition-all shadow-sm",
                        orderInfo.tag === t ? "border-primary text-primary bg-primary/5" : "border-gray-100 text-gray-400 bg-white hover:bg-gray-50"
                      )}
                    >
                      {t.toUpperCase()}
                    </button>
                  ))}
                </div>

                <Button 
                  onClick={() => setIsAddressModalOpen(false)}
                  className="w-full h-16 rounded-full bg-primary text-white font-black uppercase tracking-[0.2em] text-[11px] mt-4 shadow-2xl shadow-primary/30 hover:bg-primary/90 transition-all active:scale-95"
                >
                  SAVE DELIVERY POINT
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
