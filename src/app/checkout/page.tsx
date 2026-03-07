
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
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, setDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp, doc, getDoc } from 'firebase/firestore';
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
  const { toast } = useToast();
  const router = useRouter();

  const [orderInfo, setOrderInfo] = useState({
    patientName: '',
    phoneNumber: '',
    street: homepageLocation || '',
    landmark: '',
    pincode: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchProfile = async () => {
      if (user && !isSomeoneElse) {
        let profileName = user.displayName || '';
        let profilePhone = user.phoneNumber?.replace('+91', '') || '';
        let profileStreet = homepageLocation || '';
        let profileLandmark = '';
        let profilePincode = '';

        try {
          const profileDoc = await getDoc(doc(db, 'userProfiles', user.uid));
          if (profileDoc.exists()) {
            const data = profileDoc.data();
            profileName = data.name || profileName;
            profilePhone = data.phone?.replace('+91', '') || profilePhone;
            profileStreet = data.address?.street || profileStreet;
            profileLandmark = data.address?.landmark || profileLandmark;
            profilePincode = data.address?.pincode || profilePincode;
          }
        } catch (e) {
          console.error("Profile sync error", e);
        }

        setOrderInfo({
          patientName: profileName,
          phoneNumber: profilePhone,
          street: profileStreet,
          landmark: profileLandmark,
          pincode: profilePincode
        });
      } else if (isSomeoneElse) {
        setOrderInfo({
          patientName: '',
          phoneNumber: '',
          street: '',
          landmark: '',
          pincode: ''
        });
      }
    };

    fetchProfile();
  }, [user, isSomeoneElse, db, homepageLocation]);

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
            // High-precision reverse geocoding with fallback fields
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
              signal: AbortSignal.timeout(10000) // 10s timeout
            });
            const data = await response.json();
            
            if (data && data.address) {
              const neighborhood = data.address.suburb || data.address.neighbourhood || data.address.residential || '';
              const city = data.address.city || data.address.town || data.address.village || '';
              const road = data.address.road || '';
              const state = data.address.state || '';
              
              setOrderInfo(prev => ({
                ...prev,
                street: `${road ? road + ', ' : ''}${neighborhood}${city ? ', ' + city : ''}${state ? ', ' + state : ''}`,
                pincode: data.address.postcode?.replace(/\s/g, '') || prev.pincode
              }));
              toast({ title: "Location Verified" });
            } else {
              toast({ variant: 'destructive', title: 'Location Unavailable', description: 'Could not resolve address details.' });
            }
          } catch (e) {
            toast({ variant: 'destructive', title: 'Network Error', description: 'Check your internet connection.' });
          } finally {
            setIsLocating(false);
          }
        },
        (error) => {
          setIsLocating(false);
          let msg = "Permission Denied";
          if (error.code === 2) msg = "Position Unavailable";
          if (error.code === 3) msg = "Request Timed Out";
          toast({ variant: 'destructive', title: 'GPS Error', description: msg });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setIsLocating(false);
      toast({ variant: 'destructive', title: 'Incompatible', description: 'Browser does not support GPS.' });
    }
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (!validate()) {
      setOrderError("Please fill all required delivery fields.");
      return;
    }

    if (cart.length === 0) {
      setOrderError("Your bag is currently empty.");
      return;
    }

    setLoading(true);
    setOrderError(null);
    
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
    const FREE_DELIVERY_THRESHOLD = deliveryFeeDoc?.minPurchase || 500;
    const finalBeforeDelivery = Math.max(0, totalPrice + feeTotal - promoDiscount);
    const deliveryCharge = finalBeforeDelivery < FREE_DELIVERY_THRESHOLD ? (deliveryFeeDoc?.discountedAmount || 40) : 0;
    const finalAmount = finalBeforeDelivery + deliveryCharge;

    const orderData = {
      userId: user.uid,
      orderDate: serverTimestamp(),
      totalAmount: finalAmount,
      billingBreakdown: {
        grossMrp: totalMrp,
        campaignDiscount: promoDiscount,
        serviceFees: feeTotal,
        deliveryCharge: deliveryCharge,
        savings: (totalMrp - totalPrice) + promoDiscount
      },
      status: 'Pending',
      paymentStatus: paymentMethod === 'COD' ? 'Pending' : 'Paid',
      paymentType: paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online',
      patientName: orderInfo.patientName,
      phoneNumber: orderInfo.phoneNumber.startsWith('+91') ? orderInfo.phoneNumber : `+91${orderInfo.phoneNumber}`,
      prescriptionUrl: attachedPrescription || null,
      orderingForSelf: !isSomeoneElse,
      shippingDetails: {
        street: orderInfo.street,
        landmark: orderInfo.landmark,
        pincode: orderInfo.pincode
      },
      items: cart.map(item => ({
        medicineId: item.id,
        quantity: item.quantity,
        unitPrice: item.price,
        name: item.name,
        imageUrl: item.imageUrl
      }))
    };

    try {
      // PRE-GENERATE ID FOR INSTANT REDIRECT
      const ordersColRef = collection(db, 'userProfiles', user.uid, 'orders');
      const newOrderRef = doc(ordersColRef);
      const orderId = newOrderRef.id;

      // INITIATE NON-BLOCKING WRITE
      setDocumentNonBlocking(newOrderRef, orderData, { merge: false });
      
      if (!isSomeoneElse) {
        setDocumentNonBlocking(doc(db, 'userProfiles', user.uid), {
          name: orderInfo.patientName,
          phone: orderData.phoneNumber,
          address: orderData.shippingDetails,
          updatedAt: serverTimestamp()
        }, { merge: true });
      }

      // REDIRECT INSTANTLY
      clearCart();
      router.push(`/order-success/${orderId}`);
    } catch (err) {
      setOrderError("Could not place order. Please check your internet connection.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F8F8] pb-32 sm:pb-8 page-transition-wrapper">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8 md:py-16">
        <div className="flex items-center gap-4 mb-12">
           <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Secure Checkout</h1>
           <div className="bg-primary/5 px-4 py-1 rounded-full border border-primary/10">
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">Final Step</span>
           </div>
        </div>
        
        {orderError && (
          <div className="mb-8 p-6 bg-red-50 border-2 border-red-100 rounded-[32px] flex items-center gap-4 animate-in slide-in-from-top-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <p className="text-sm font-black uppercase text-red-900 tracking-tight">{orderError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <Card className="rounded-[40px] border-none shadow-sm overflow-hidden bg-white">
              <CardHeader className="bg-white p-8 border-b space-y-6">
                <div className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <CardTitle className="text-xl font-black uppercase tracking-tight">Delivery Provision</CardTitle>
                  </div>
                  <button onClick={handleLocateMe} disabled={isLocating} className="rounded-full h-10 px-4 font-black text-[9px] uppercase tracking-widest gap-2 bg-primary/5 text-primary hover:bg-primary/10 active:scale-95 transition-all">
                    {isLocating ? <Loader2 className="animate-spin w-3 h-3" /> : <LocateFixed className="w-3 h-3" />}
                    Verify My GPS
                  </button>
                </div>

                <div className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl border border-gray-100">
                   <div className="flex items-center gap-3">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors", isSomeoneElse ? "bg-orange-100 text-orange-600" : "bg-green-100 text-green-600")}>
                         {isSomeoneElse ? <UserPlus className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                      </div>
                      <div>
                         <p className="text-[10px] font-black uppercase tracking-tight text-gray-900">Ordering for someone else?</p>
                         <p className="text-[8px] font-bold uppercase text-gray-400">Toggle for recipient mode</p>
                      </div>
                   </div>
                   <Switch 
                    checked={isSomeoneElse} 
                    onCheckedChange={setIsSomeoneElse} 
                    className="data-[state=checked]:bg-orange-500"
                   />
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 ml-1">
                      <User className="w-3.5 h-3.5 text-primary" />
                      <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Recipient Name <span className="text-red-500">*</span></Label>
                    </div>
                    <Input 
                      value={orderInfo.patientName} 
                      onChange={e => setOrderInfo({...orderInfo, patientName: e.target.value})} 
                      placeholder="Full Name" 
                      className={cn("h-16 rounded-2xl bg-gray-50 border-none font-bold shadow-inner px-6", errors.patientName && "ring-2 ring-red-500")} 
                    />
                    {errors.patientName && <p className="text-[9px] text-red-500 font-bold uppercase ml-2">{errors.patientName}</p>}
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 ml-1">
                      <Phone className="w-3.5 h-3.5 text-primary" />
                      <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Contact Number <span className="text-red-500">*</span></Label>
                    </div>
                    <div className="relative">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center gap-2 pr-4 border-r border-gray-200">
                        <span className="text-sm font-bold text-gray-400">+91</span>
                      </div>
                      <Input 
                        value={orderInfo.phoneNumber} 
                        onChange={e => setOrderInfo({...orderInfo, phoneNumber: e.target.value.replace(/\D/g, '').slice(0, 10)})} 
                        placeholder={orderInfo.phoneNumber ? "" : "10-digit Mobile"} 
                        readOnly={!isSomeoneElse && !!user?.phoneNumber}
                        className={cn(
                          "h-16 pl-16 rounded-2xl bg-gray-50 border-none font-bold shadow-inner px-6 transition-all", 
                          errors.phoneNumber && "ring-2 ring-red-500",
                          (!isSomeoneElse && !!user?.phoneNumber) && "opacity-60 cursor-not-allowed"
                        )} 
                      />
                    </div>
                    {errors.phoneNumber && <p className="text-[9px] text-red-500 font-bold uppercase ml-2">{errors.phoneNumber}</p>}
                  </div>
                  <div className="md:col-span-2 space-y-3">
                    <div className="flex items-center gap-2 ml-1">
                      <Home className="w-3.5 h-3.5 text-primary" />
                      <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Clinical Delivery Address <span className="text-red-500">*</span></Label>
                    </div>
                    <Input value={orderInfo.street} onChange={e => setOrderInfo({...orderInfo, street: e.target.value})} placeholder="House No, Street Name, Area" className={cn("h-16 rounded-2xl bg-gray-50 border-none font-bold shadow-inner px-6", errors.street && "ring-2 ring-red-500")} />
                    {errors.street && <p className="text-[9px] text-red-500 font-bold uppercase ml-2">{errors.street}</p>}
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 ml-1">
                      <Building2 className="w-3.5 h-3.5 text-primary" />
                      <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Landmark (Optional)</Label>
                    </div>
                    <Input value={orderInfo.landmark} onChange={e => setOrderInfo({...orderInfo, landmark: e.target.value})} placeholder="Nearby clinical landmark" className="h-16 rounded-2xl bg-gray-50 border-none font-bold shadow-inner px-6" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 ml-1">
                      <Hash className="w-3.5 h-3.5 text-primary" />
                      <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Pincode <span className="text-red-500">*</span></Label>
                    </div>
                    <Input value={orderInfo.pincode} onChange={e => setOrderInfo({...orderInfo, pincode: e.target.value.replace(/\D/g, '').slice(0, 6)})} placeholder="6-digit PIN" maxLength={6} className={cn("h-16 rounded-2xl bg-gray-50 border-none font-bold shadow-inner px-6", errors.pincode && "ring-2 ring-red-500")} />
                    {errors.pincode && <p className="text-[9px] text-red-500 font-bold uppercase ml-2">{errors.pincode}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[40px] border-none shadow-sm overflow-hidden bg-white">
              <CardHeader className="bg-white p-8 border-b">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <CardTitle className="text-xl font-black uppercase tracking-tight">Payment Method</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 gap-4">
                  <div 
                    className={cn(
                      "p-6 rounded-[32px] border-2 cursor-pointer transition-all flex items-center justify-between group",
                      paymentMethod === 'COD' ? "border-primary bg-primary/5" : "border-gray-100 hover:border-gray-200"
                    )}
                    onClick={() => setPaymentMethod('COD')}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                        paymentMethod === 'COD' ? "bg-primary text-white" : "bg-gray-100 text-gray-400"
                      )}>
                        <Banknote className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-black text-sm uppercase tracking-tight">Cash on Delivery</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Pay at your doorstep</p>
                      </div>
                    </div>
                    <div className={cn(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                      paymentMethod === 'COD' ? "border-primary bg-primary" : "border-gray-200"
                    )}>
                      {paymentMethod === 'COD' && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                  
                  <div className="p-6 rounded-[32px] border-2 border-dashed border-gray-100 opacity-50 cursor-not-allowed flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-300 flex items-center justify-center">
                        <Zap className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-black text-sm uppercase tracking-tight text-gray-400">Online Payment</p>
                        <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">Coming Soon</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="bg-accent/5 p-8 rounded-[40px] border border-accent/10 flex items-center gap-6">
               <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-lg border border-accent/10 shrink-0">
                  <ShieldCheck className="w-8 h-8 text-accent" />
               </div>
               <div>
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Verified Clinical Checkout</h3>
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1">Every order is audited for delivery accuracy and clinical protocol compliance.</p>
               </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white p-10 rounded-[50px] shadow-2xl border border-gray-50 sticky top-24 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />
              
              <h2 className="text-[11px] font-black mb-10 text-gray-400 uppercase tracking-[0.3em] relative z-10">Clinical Bag Summary</h2>
              
              <div className="space-y-6 mb-10 max-h-[30vh] overflow-y-auto scrollbar-hide relative z-10">
                 {cart.map(item => (
                   <div key={item.id} className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl group transition-all">
                     <div className="flex flex-col">
                        <span className="text-gray-900 font-black text-[11px] uppercase truncate max-w-[140px]">{item.name}</span>
                        <span className="text-[8px] text-gray-400 font-black uppercase tracking-widest">Qty: {item.quantity}</span>
                     </div>
                     <span className="font-black text-primary text-sm">₹{(item.price * item.quantity).toFixed(2)}</span>
                   </div>
                 ))}
              </div>

              <div className="space-y-4 mb-10 pt-6 border-t border-dashed relative z-10">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                  <span>Gross Total</span>
                  <span>₹{totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                  <span className="text-gray-500">Payment Mode</span>
                  <span className="text-primary font-black">{paymentMethod === 'COD' ? 'COD' : 'Online'}</span>
                </div>
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                  <span className="text-gray-500">Clinical Logistics</span>
                  <span className="text-accent">FREE</span>
                </div>
                <div className="pt-8 border-t border-gray-100 flex justify-between items-baseline">
                  <span className="text-sm font-black text-gray-900 uppercase tracking-widest">Payable Amount</span>
                  <span className="text-4xl font-black text-primary tracking-tighter">₹{totalPrice.toFixed(2)}</span>
                </div>
              </div>

              <Button onClick={handlePlaceOrder} disabled={loading || cart.length === 0} className="w-full h-20 rounded-full text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/40 hover:scale-[1.02] transition-all gap-4 relative z-10 bg-primary text-white">
                {loading ? <Loader2 className="animate-spin" /> : (user ? "Finalize Order" : "SignIn to Complete")}
                <ArrowRight className="w-5 h-5" />
              </Button>
              
              {!isSomeoneElse && (
                <div className="mt-6 flex items-center justify-center gap-2 bg-green-50 p-3 rounded-xl border border-green-100 animate-in slide-in-from-bottom-2">
                   <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                   <span className="text-[8px] font-black text-green-600 uppercase tracking-widest">Saving to Clinical Profile</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
