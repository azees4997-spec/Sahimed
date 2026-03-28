
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
  LocateFixed
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp, doc, getDoc, query, orderBy } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

export default function CheckoutPage() {
  const { 
    cart, 
    totalPrice, 
    clearCart, 
    attachedPrescription,
    activeFees,
    appliedPromo
  } = useCart();
  
  const { user } = useUser();
  const db = useFirestore();
  const [loading, setLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
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
        houseNumber: defaultAddr.houseNumber || '',
        buildingLocality: defaultAddr.street,
        pincode: defaultAddr.pincode,
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
    
    if (!orderInfo.houseNumber.trim()) {
      toast({ variant: 'destructive', title: "House no. missing", description: "House or Building number is mandatory." });
      return false;
    }

    if (!orderInfo.buildingLocality.trim()) {
      toast({ variant: 'destructive', title: "Locality required", description: "Please enter your street or area name." });
      return false;
    }
    if (!orderInfo.pincode.trim() || orderInfo.pincode.length !== 6) {
      toast({ variant: 'destructive', title: "Pincode required", description: "A valid 6-digit pincode is mandatory." });
      return false;
    }
    return true;
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
              toast({ title: "Live position locked" });
            }
          } catch (e) {
            toast({ variant: 'destructive', title: 'GPS sync failed' });
          } finally {
            setIsLocating(false);
          }
        },
        () => setIsLocating(false),
        { enableHighAccuracy: true }
      );
    }
  };

  const handleSaveNewAddress = async () => {
    if (!user || !db) return;
    
    if (!orderInfo.houseNumber.trim() || !orderInfo.buildingLocality.trim() || !orderInfo.pincode.trim()) {
      toast({ variant: 'destructive', title: "Incomplete address", description: "House No, Locality and Pincode are mandatory." });
      return;
    }

    const fullStreet = `${orderInfo.buildingLocality}${orderInfo.city ? ', ' + orderInfo.city : ''}${orderInfo.state ? ', ' + orderInfo.state : ''}`;
    const finalTag = orderInfo.tag === 'Other' ? (orderInfo.otherTag || 'Other') : orderInfo.tag;

    const payload = {
      houseNumber: orderInfo.houseNumber,
      street: fullStreet,
      pincode: orderInfo.pincode,
      lat: orderInfo.lat,
      lng: orderInfo.lng,
      tag: finalTag,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    try {
      addDocumentNonBlocking(collection(db, 'userProfiles', user.uid, 'addresses'), payload);
      setIsAddressModalOpen(false);
      toast({ title: "Address secured", description: `Saved to your ${finalTag} registry.` });
    } catch (err) {
      toast({ variant: 'destructive', title: "Save error" });
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

    const finalAmount = Math.max(0, totalPrice + feeTotal - promoDiscount);
    const cleanPhone = orderInfo.phoneNumber.replace(/\D/g, '');
    const finalTag = orderInfo.tag === 'Other' ? (orderInfo.otherTag || 'Other') : orderInfo.tag;

    const orderData = {
      userId: user.uid,
      orderDate: serverTimestamp(),
      totalAmount: finalAmount,
      status: 'Pending',
      paymentType: paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online',
      patientName: orderInfo.patientName,
      phoneNumber: `+91${cleanPhone}`,
      prescriptionUrl: attachedPrescription || null,
      shippingDetails: {
        houseNumber: orderInfo.houseNumber,
        street: orderInfo.buildingLocality,
        pincode: orderInfo.pincode,
        lat: orderInfo.lat,
        lng: orderInfo.lng,
        tag: finalTag
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
      
      toast({ title: "Order processed", description: "Redirecting to success page..." });
      
      setTimeout(() => {
        clearCart();
        router.push(`/order-success/${newOrderRef.id}`);
      }, 800);
    } catch (err) {
      setLoading(false);
      toast({ variant: 'destructive', title: "Order failed", description: "Failed to sync order with clinical hub." });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F8F8] pb-32 sm:pb-8 page-transition-wrapper">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-6 md:py-16">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 sm:mb-12">
           <div className="space-y-1">
             <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tighter">Delivery details</h1>
             <p className="text-[10px] font-black text-gray-400 tracking-widest leading-none">Confirm logistic path</p>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          <div className="lg:col-span-2 space-y-10">
            
            <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-sm font-black text-gray-900 tracking-tight">Saved delivery points</h3>
                <button 
                  onClick={() => {
                    setOrderInfo({ patientName: orderInfo.patientName, phoneNumber: orderInfo.phoneNumber, houseNumber: '', buildingLocality: '', city: '', state: '', pincode: '', lat: 0, lng: 0, tag: 'Home', otherTag: '' });
                    setIsAddressModalOpen(true);
                  }}
                  className="text-primary font-black text-[10px] tracking-widest flex items-center gap-1.5 hover:underline"
                >
                  <Plus className="w-3" /> Add new address
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {savedAddresses && savedAddresses.length > 0 ? (
                  savedAddresses.map((addr) => (
                    <div 
                      key={addr.id}
                      onClick={() => {
                        setSelectedAddressId(addr.id);
                        setOrderInfo(prev => ({
                          ...prev,
                          houseNumber: addr.houseNumber || '',
                          buildingLocality: addr.street,
                          pincode: addr.pincode,
                          lat: addr.lat || 0,
                          lng: addr.lng || 0,
                          tag: addr.tag
                        }));
                        toast({ title: `Location locked: ${addr.tag}` });
                      }}
                      className={cn(
                        "p-6 rounded-[32px] border-2 cursor-pointer transition-all flex items-center justify-between bg-white shadow-sm hover:shadow-md group",
                        selectedAddressId === addr.id ? "border-primary bg-primary/5 shadow-lg scale-[1.02]" : "border-transparent hover:border-gray-100"
                      )}
                    >
                      <div className="flex items-center gap-5 min-w-0">
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm", selectedAddressId === addr.id ? "bg-primary text-white" : "bg-gray-50 text-gray-400")}>
                          {addr.tag === 'Home' ? <Home className="w-6 h-6" /> : addr.tag === 'Office' ? <Briefcase className="w-6 h-6" /> : <MapPin className="w-6 h-6" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-[10px] text-gray-900 tracking-tight">{addr.tag}</p>
                          <p className="text-[11px] font-bold text-gray-500 line-clamp-2 leading-relaxed mt-1">
                            {addr.houseNumber ? `${addr.houseNumber}, ` : ''}{addr.street}
                          </p>
                          <p className="text-[9px] font-black text-gray-400 mt-1">PIN: {addr.pincode}</p>
                        </div>
                      </div>
                      <div className="shrink-0 ml-4">
                        <div className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center transition-all",
                          selectedAddressId === addr.id ? "bg-primary scale-110" : "bg-gray-100 group-hover:bg-gray-200"
                        )}>
                          <Check className={cn("w-3.5 h-3.5", selectedAddressId === addr.id ? "text-white" : "text-transparent")} />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div 
                    onClick={() => setIsAddressModalOpen(true)}
                    className="p-12 rounded-[40px] border-2 border-dashed border-gray-200 bg-white text-center cursor-pointer hover:bg-gray-50 transition-colors col-span-full group"
                  >
                    <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-inner">
                      <MapPin className="w-8 h-8 text-gray-200" />
                    </div>
                    <p className="text-[10px] font-black text-gray-400 tracking-widest" >No saved locations found</p>
                    <p className="text-[10px] font-bold text-primary mt-2 tracking-widest">+ Tap to add delivery point</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-sm font-black text-gray-900 tracking-tight px-2">Select payment</h3>
              <div 
                className={cn(
                  "p-6 rounded-[32px] border-2 cursor-pointer transition-all flex items-center justify-between bg-white shadow-sm",
                  paymentMethod === 'COD' ? "border-primary bg-primary/5" : "border-transparent hover:border-gray-100"
                )}
                onClick={() => setPaymentMethod('COD')}
              >
                <div className="flex items-center gap-5">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm", paymentMethod === 'COD' ? "bg-primary text-white" : "bg-gray-50 text-gray-400")}>
                    <Banknote className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-black text-xs tracking-tight">Cash on Delivery</p>
                    <p className="text-[9px] font-bold text-gray-400 tracking-widest">Collect at doorstep during fulfillment</p>
                  </div>
                </div>
                <div className={cn("w-6 h-6 rounded-full flex items-center justify-center", paymentMethod === 'COD' ? "bg-primary" : "bg-gray-100")}>
                  <Check className={cn("w-3.5 h-3.5", paymentMethod === 'COD' ? "text-white" : "text-transparent")} />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white p-8 sm:p-10 rounded-[48px] shadow-2xl border border-gray-50 sticky top-24 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl" />
              
              <h2 className="text-[10px] font-black mb-8 text-gray-400 tracking-[0.3em] relative z-10">Order summary</h2>
              
              <div className="space-y-5 mb-10 pt-6 border-t border-dashed relative z-10">
                <div className="flex justify-between text-[11px] font-black text-gray-500">
                  <span>Order value</span>
                  <span>₹{totalPrice.toFixed(2)}</span>
                </div>
                {appliedPromo && (
                  <div className="flex justify-between text-[11px] font-black text-accent animate-in slide-in-from-left-2">
                    <span className="flex items-center gap-1.5"><Tag className="w-3 h-3" /> Offer applied</span>
                    <span>-₹{(appliedPromo.discountType === 'fixed' ? appliedPromo.discountValue : (totalPrice * (appliedPromo.discountValue/100))).toFixed(2)}</span>
                  </div>
                )}
                <div className="pt-8 border-t border-gray-100 flex justify-between items-baseline">
                  <span className="text-xs font-black text-gray-900 tracking-widest">Total payable</span>
                  <span className="text-4xl font-black text-primary tracking-tighter">₹{(totalPrice - (appliedPromo ? (appliedPromo.discountType === 'fixed' ? appliedPromo.discountValue : (totalPrice * (appliedPromo.discountValue/100))) : 0)).toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-4 relative z-10">
                <Button 
                  onClick={handlePlaceOrder} 
                  disabled={loading} 
                  className="w-full h-20 rounded-full text-sm font-black tracking-[0.2em] shadow-2xl shadow-primary/30 bg-primary hover:bg-primary/90 gap-4 text-white transition-all active:scale-95 group"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      Verify & place order
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
                
                <div className="flex items-center justify-center gap-3 py-2">
                   <ShieldCheck className="w-4 h-4 text-accent" />
                   <span className="text-[8px] font-black text-gray-400 tracking-widest">Secured clinical checkout</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Dialog open={isAddressModalOpen} onOpenChange={setIsAddressModalOpen}>
        <DialogContent className="max-w-xl w-[96vw] sm:w-full rounded-[32px] border-none p-0 overflow-hidden shadow-3xl bg-white mx-auto z-[110]">
          <div className="max-h-[92vh] overflow-y-auto scrollbar-hide">
            <div className="bg-primary p-5 text-white relative overflow-hidden shrink-0">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl" />
              <DialogTitle className="text-xl font-black tracking-tight">Delivery point</DialogTitle>
              <p className="text-[8px] font-black text-white/60 tracking-[0.2em] mt-0.5">Clinical logistics path</p>
            </div>

            <div className="p-5 space-y-4">
              <Button 
                onClick={handleLocateMe}
                variant="outline" 
                type="button"
                className="h-12 w-full rounded-xl border-2 border-primary/20 text-primary bg-white hover:bg-primary/5 font-black text-[10px] gap-3 transition-none active:scale-95"
              >
                {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
                Autofill current location
              </Button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black text-gray-400 ml-1">Name *</Label>
                  <Input 
                    placeholder="e.g. Rahul Sharma" 
                    value={orderInfo.patientName} 
                    onChange={e => setOrderInfo({...orderInfo, patientName: e.target.value})}
                    className="h-12 rounded-xl bg-gray-50 border border-gray-200 font-bold text-sm px-4"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black text-gray-400 ml-1">Phone number *</Label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 border-r pr-2.5">+91</div>
                    <Input 
                      placeholder="Mobile number" 
                      value={orderInfo.phoneNumber} 
                      maxLength={10}
                      onChange={e => setOrderInfo({...orderInfo, phoneNumber: e.target.value.replace(/\D/g, '')})}
                      className="h-12 pl-14 rounded-xl bg-gray-50 border border-gray-200 font-bold text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[9px] font-black text-gray-400 ml-1">House no. / building *</Label>
                <Input 
                  placeholder="Apartment name, Flat number" 
                  value={orderInfo.houseNumber} 
                  onChange={e => setOrderInfo({...orderInfo, houseNumber: e.target.value})}
                  className="h-12 rounded-xl bg-gray-50 border border-gray-200 font-bold text-sm px-4"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[9px] font-black text-gray-400 ml-1">Locality / street *</Label>
                <Input 
                  placeholder="Street name, Area" 
                  value={orderInfo.buildingLocality} 
                  onChange={e => setOrderInfo({...orderInfo, buildingLocality: e.target.value})}
                  className="h-12 rounded-xl bg-gray-50 border border-gray-200 font-bold text-sm px-4"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black text-gray-400 ml-1">Pincode *</Label>
                  <Input 
                    placeholder="6-digits" 
                    value={orderInfo.pincode} 
                    maxLength={6}
                    onChange={e => setOrderInfo({...orderInfo, pincode: e.target.value.replace(/\D/g, '')})}
                    className="h-12 rounded-xl bg-gray-50 border border-gray-200 font-bold text-sm px-3"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black text-gray-400 ml-1">City *</Label>
                  <Input 
                    placeholder="City" 
                    value={orderInfo.city} 
                    onChange={e => setOrderInfo({...orderInfo, city: e.target.value})}
                    className="h-12 rounded-xl bg-gray-50 border border-gray-200 font-bold text-sm px-3"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black text-gray-400 ml-1">State *</Label>
                  <Input 
                    placeholder="State" 
                    value={orderInfo.state} 
                    onChange={e => setOrderInfo({...orderInfo, state: e.target.value})}
                    className="h-12 rounded-xl bg-gray-50 border border-gray-200 font-bold text-sm px-3"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-[9px] font-black text-gray-400 ml-1">Address type</Label>
                <RadioGroup 
                  value={orderInfo.tag} 
                  onValueChange={(v) => setOrderInfo({...orderInfo, tag: v})}
                  className="flex flex-wrap gap-4 items-center pt-0.5"
                >
                  {['Home', 'Office', 'Other'].map(t => (
                    <div key={t} className="flex items-center space-x-2">
                      <RadioGroupItem value={t} id={`type-${t}`} className="border-primary text-primary h-4 w-4" />
                      <Label htmlFor={`type-${t}`} className="text-xs font-bold tracking-tight cursor-pointer">{t}</Label>
                    </div>
                  ))}
                </RadioGroup>
                
                {orderInfo.tag === 'Other' && (
                  <div className="pt-2 animate-in fade-in slide-in-from-top-1">
                    <Input 
                      placeholder="Mention name (e.g. Clinic, Hostel)" 
                      value={orderInfo.otherTag} 
                      onChange={e => setOrderInfo({...orderInfo, otherTag: e.target.value})}
                      className="h-11 rounded-xl bg-gray-50 border border-primary/20 font-bold text-xs px-4"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button 
                  onClick={handleSaveNewAddress}
                  className="flex-1 h-12 rounded-xl bg-primary text-white font-black tracking-widest text-[10px] shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-95 transition-all"
                >
                  Save
                </Button>
                <Button 
                  onClick={() => setIsAddressModalOpen(false)}
                  variant="outline"
                  className="flex-1 h-12 rounded-xl border border-gray-200 text-gray-500 font-black tracking-widest text-[10px] hover:bg-gray-50 active:scale-95 transition-all"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
