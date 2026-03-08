
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
  Navigation
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp, doc, getDoc, query, orderBy } from 'firebase/firestore';
import { cn } from '@/lib/utils';

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
  const [orderError, setOrderError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'Online'>('COD');
  const [detectedAddress, setDetectedAddress] = useState<any>(null);
  const [currentPos, setCurrentPos] = useState<{lat: number, lng: number} | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const [orderInfo, setOrderInfo] = useState({
    patientName: '',
    phoneNumber: '',
    street: homepageLocation || '',
    landmark: '',
    pincode: '',
    lat: 0,
    lng: 0,
    tag: 'Other'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // --- Fetch Addresses ---
  const addressesQuery = useMemoFirebase(() => (db && user) ? query(collection(db, 'userProfiles', user.uid, 'addresses'), orderBy('updatedAt', 'desc')) : null, [db, user]);
  const { data: savedAddresses } = useCollection(addressesQuery);

  // --- HA VERSINE DISTANCE CALCULATION ---
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // in metres
  };

  useEffect(() => {
    const initCheckout = async () => {
      if (user) {
        // 1. Load Profile Basics
        const profileDoc = await getDoc(doc(db, 'userProfiles', user.uid));
        if (profileDoc.exists()) {
          const data = profileDoc.data();
          setOrderInfo(prev => ({
            ...prev,
            patientName: data.name || user.displayName || '',
            phoneNumber: (data.phone || user.phoneNumber || '').replace('+91', '')
          }));
        }

        // 2. Proximity Detection Logic
        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition((pos) => {
            const { latitude, longitude } = pos.coords;
            setCurrentPos({ lat: latitude, lng: longitude });
            
            if (savedAddresses && savedAddresses.length > 0) {
              let closest = null;
              let minDistance = Infinity;

              savedAddresses.forEach(addr => {
                if (addr.lat && addr.lng) {
                  const dist = calculateDistance(latitude, longitude, addr.lat, addr.lng);
                  if (dist < minDistance) {
                    minDistance = dist;
                    closest = addr;
                  }
                }
              });

              // Threshold: 500 meters (Standard delivery proximity)
              if (closest && minDistance < 500) {
                setDetectedAddress(closest);
                setOrderInfo(prev => ({
                  ...prev,
                  street: closest.street,
                  landmark: closest.landmark || '',
                  pincode: closest.pincode,
                  lat: closest.lat,
                  lng: closest.lng,
                  tag: closest.tag
                }));
                toast({ title: `Detected Near ${closest.tag}` });
              }
            }
          });
        }
      }
    };

    initCheckout();
  }, [user, db, savedAddresses]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!orderInfo.patientName.trim()) newErrors.patientName = "Recipient name is required";
    if (!orderInfo.phoneNumber.trim()) newErrors.phoneNumber = "Contact number is required";
    if (!orderInfo.street.trim()) newErrors.street = "Street address is required";
    if (!orderInfo.pincode.trim() || orderInfo.pincode.length !== 6) newErrors.pincode = "Valid 6-digit Indian PIN required";
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
                street: data.display_name,
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
    
    // Financial calculations
    const totalMrp = cart.reduce((acc, item) => acc + (item.mrp || item.price + 50) * item.quantity, 0);
    const applicableFees = activeFees.filter(f => totalPrice >= (f.minPurchase || 0));
    const feeTotal = applicableFees.reduce((acc, fee) => {
      const amt = fee.discountedAmount ?? fee.originalAmount ?? 0;
      return fee.type === 'fixed' ? acc + amt : acc + (totalPrice * (amt / 100));
    }, 0);

    let promoDiscount = 0;
    if (appliedPromo) {
      const raw = appliedPromo.discountType === 'fixed' ? appliedPromo.discountValue : (totalPrice * (appliedPromo.discountValue / 100));
      promoDiscount = (appliedPromo.maxDiscount && appliedPromo.maxDiscount > 0) ? Math.min(raw, appliedPromo.maxDiscount) : raw;
    }

    const deliveryFeeDoc = activeFees.find(f => f.name.toLowerCase().includes('delivery'));
    const finalAmount = Math.max(0, totalPrice + feeTotal - promoDiscount) + (totalPrice < (deliveryFeeDoc?.minPurchase || 500) ? (deliveryFeeDoc?.discountedAmount || 40) : 0);

    const orderData = {
      userId: user.uid,
      orderDate: serverTimestamp(),
      totalAmount: finalAmount,
      status: 'Pending',
      paymentType: paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online',
      patientName: orderInfo.patientName,
      phoneNumber: `+91${orderInfo.phoneNumber}`,
      prescriptionUrl: attachedPrescription || null,
      shippingDetails: {
        street: orderInfo.street,
        landmark: orderInfo.landmark,
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
      }))
    };

    try {
      const newOrderRef = doc(collection(db, 'userProfiles', user.uid, 'orders'));
      setDocumentNonBlocking(newOrderRef, orderData, { merge: false });
      
      // Smart Auto-Save: If this was a manual entry far from others, save it to the registry
      if (!detectedAddress && orderInfo.lat !== 0) {
        addDocumentNonBlocking(collection(db, 'userProfiles', user.uid, 'addresses'), {
          street: orderInfo.street,
          landmark: orderInfo.landmark,
          pincode: orderInfo.pincode,
          lat: orderInfo.lat,
          lng: orderInfo.lng,
          tag: 'Other',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      clearCart();
      router.push(`/order-success/${newOrderRef.id}`);
    } catch (err) {
      setLoading(false);
    }
  };

  const getTagIcon = (tag: string) => {
    switch (tag) {
      case 'Home': return <Home className="w-4 h-4" />;
      case 'Office': return <Briefcase className="w-4 h-4" />;
      default: return <MapPin className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F8F8] pb-32 sm:pb-8 page-transition-wrapper">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8 md:py-16">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 sm:mb-12">
           <h1 className="text-2xl sm:text-3xl font-black text-gray-900 uppercase tracking-tighter">Secure Checkout</h1>
           <div className="bg-primary/5 px-4 py-1.5 rounded-full border border-primary/10 w-fit">
              <span className="text-[9px] sm:text-[10px] font-black text-primary uppercase tracking-widest">Clinical Protocol</span>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            {/* SAVED ADDRESSES SELECTOR */}
            {savedAddresses && savedAddresses.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-4">Saved Locations</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {savedAddresses.map((addr) => (
                    <div 
                      key={addr.id}
                      onClick={() => {
                        setOrderInfo({...orderInfo, street: addr.street, landmark: addr.landmark || '', pincode: addr.pincode, lat: addr.lat, lng: addr.lng, tag: addr.tag});
                        setDetectedAddress(addr);
                      }}
                      className={cn(
                        "p-5 rounded-[24px] border-2 cursor-pointer transition-all flex items-center gap-4 bg-white",
                        orderInfo.street === addr.street ? "border-primary bg-primary/5 shadow-lg" : "border-transparent hover:border-gray-200"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                        orderInfo.street === addr.street ? "bg-primary text-white" : "bg-gray-50 text-gray-400"
                      )}>
                        {getTagIcon(addr.tag)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-[10px] uppercase tracking-widest leading-none mb-1">{addr.tag}</p>
                        <p className="text-[11px] font-bold text-gray-600 truncate uppercase">{addr.street}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* LOCATION DETECTION ALERT */}
            {!detectedAddress && currentPos && (
              <div className="bg-blue-50 border-2 border-blue-100 p-6 rounded-[32px] flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-4">
                <div className="flex items-center gap-4 text-center sm:text-left">
                  <div className="w-12 h-12 bg-white text-blue-600 rounded-2xl flex items-center justify-center shadow-lg"><Navigation className="w-6 h-6" /></div>
                  <div>
                    <p className="font-black text-xs uppercase text-blue-900">New Location Detected</p>
                    <p className="text-[9px] font-bold text-blue-700/70 uppercase">You are far from your saved points. Set current GPS?</p>
                  </div>
                </div>
                <Button onClick={handleLocateMe} className="rounded-full bg-blue-600 text-white font-black uppercase text-[10px] h-12 px-8 shadow-xl shadow-blue-200">
                  {isLocating ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <LocateFixed className="w-4 h-4 mr-2" />}
                  Use Detected Point
                </Button>
              </div>
            )}

            <Card className="rounded-[32px] sm:rounded-[40px] border-none shadow-sm overflow-hidden bg-white">
              <CardHeader className="bg-white p-6 sm:p-8 border-b">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <CardTitle className="text-lg font-black uppercase tracking-tight">Delivery Logistics</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 sm:p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Recipient Name</Label>
                    <Input value={orderInfo.patientName} onChange={e => setOrderInfo({...orderInfo, patientName: e.target.value})} className="h-14 rounded-2xl bg-gray-50 border-none font-bold" />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Contact (Mobile)</Label>
                    <Input value={orderInfo.phoneNumber} onChange={e => setOrderInfo({...orderInfo, phoneNumber: e.target.value.replace(/\D/g, '').slice(0, 10)})} className="h-14 rounded-2xl bg-gray-50 border-none font-bold" />
                  </div>
                  <div className="md:col-span-2 space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Full Delivery Address</Label>
                    <Input value={orderInfo.street} onChange={e => setOrderInfo({...orderInfo, street: e.target.value})} className="h-14 rounded-2xl bg-gray-50 border-none font-bold" />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Landmark</Label>
                    <Input value={orderInfo.landmark} onChange={e => setOrderInfo({...orderInfo, landmark: e.target.value})} className="h-14 rounded-2xl bg-gray-50 border-none font-bold" />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Pincode</Label>
                    <Input value={orderInfo.pincode} onChange={e => setOrderInfo({...orderInfo, pincode: e.target.value.replace(/\D/g, '').slice(0, 6)})} className="h-14 rounded-2xl bg-gray-50 border-none font-bold" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[32px] sm:rounded-[40px] border-none shadow-sm overflow-hidden bg-white">
              <CardHeader className="bg-white p-6 sm:p-8 border-b">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <CardTitle className="text-lg font-black uppercase tracking-tight">Payment Selection</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 sm:p-8">
                <div 
                  className={cn(
                    "p-6 rounded-[32px] border-2 cursor-pointer transition-all flex items-center justify-between",
                    paymentMethod === 'COD' ? "border-primary bg-primary/5" : "border-gray-100"
                  )}
                  onClick={() => setPaymentMethod('COD')}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", paymentMethod === 'COD' ? "bg-primary text-white" : "bg-gray-50 text-gray-400")}>
                      <Banknote className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-black text-sm uppercase">Cash on Delivery</p>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Pay at doorstep</p>
                    </div>
                  </div>
                  <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center", paymentMethod === 'COD' ? "bg-primary border-primary" : "border-gray-200")}>
                    {paymentMethod === 'COD' && <Check className="w-3 h-3 text-white" />}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white p-8 rounded-[40px] shadow-2xl border border-gray-50 sticky top-24">
              <h2 className="text-[10px] font-black mb-8 text-gray-400 uppercase tracking-[0.3em]">Summary</h2>
              <div className="space-y-4 mb-8 pt-6 border-t border-dashed">
                <div className="flex justify-between text-[10px] font-black uppercase text-gray-400">
                  <span>Gross Total</span>
                  <span>₹{totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[10px] font-black uppercase text-accent">
                  <span>Clinical Savings</span>
                  <span>-₹{appliedPromo ? (appliedPromo.discountType === 'fixed' ? appliedPromo.discountValue : (totalPrice * (appliedPromo.discountValue/100))).toFixed(2) : '0.00'}</span>
                </div>
                <div className="pt-6 border-t border-gray-100 flex justify-between items-baseline">
                  <span className="text-sm font-black text-gray-900 uppercase tracking-widest">Payable</span>
                  <span className="text-3xl font-black text-primary tracking-tighter">₹{totalPrice.toFixed(2)}</span>
                </div>
              </div>
              <Button onClick={handlePlaceOrder} disabled={loading} className="w-full h-18 rounded-full text-xs font-black uppercase tracking-widest shadow-2xl shadow-primary/30 gap-3">
                {loading ? <Loader2 className="animate-spin" /> : "Finalize Order"}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
