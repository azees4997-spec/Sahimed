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
  Tag
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
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
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
          if (!isSomeoneElse) {
            setOrderInfo(prev => ({
              ...prev,
              patientName: data.name || user.displayName || '',
              phoneNumber: (data.phone || user.phoneNumber || '').replace('+91', '')
            }));
          }
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
  }, [user, db, savedAddresses, isSomeoneElse]);

  // --- Autocomplete Suggestions Logic ---
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.trim().length >= 3) {
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&addressdetails=1&countrycodes=in`);
          const data = await response.json();
          setLocationSuggestions(data);
        } catch (e) {
          console.error("Suggestions fetch error", e);
        }
      } else {
        setLocationSuggestions([]);
      }
    };

    const timer = setTimeout(fetchSuggestions, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

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

  const handleSearchAddress = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&addressdetails=1&countrycodes=in`);
      const results = await response.json();
      if (results && results.length > 0) {
        const place = results[0];
        setOrderInfo(prev => ({
          ...prev,
          street: place.display_name,
          pincode: place.address.postcode?.replace(/\s/g, '') || prev.pincode,
          lat: parseFloat(place.lat),
          lng: parseFloat(place.lon)
        }));
        setLocationSuggestions([]);
        setSearchQuery('');
        toast({ title: "Location Verified" });
      } else {
        toast({ variant: 'destructive', title: 'Address Not Found', description: 'Try searching with landmark or pincode.' });
      }
    } catch (e) {
      toast({ variant: 'destructive', title: 'Search Error' });
    } finally {
      setIsSearching(false);
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
      isSomeoneElse,
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
          tag: orderInfo.tag || 'Other',
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
      <main className="max-w-7xl mx-auto px-4 py-6 md:py-16">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 sm:mb-12">
           <div className="space-y-1">
             <h1 className="text-2xl sm:text-3xl font-black text-gray-900 uppercase tracking-tighter">Secure Checkout</h1>
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Final Step: Verification</p>
           </div>
           <div className="bg-primary/5 px-4 py-2 rounded-full border border-primary/10 w-fit flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[9px] sm:text-[10px] font-black text-primary uppercase tracking-widest">Clinical Logistics Active</span>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          <div className="lg:col-span-2 space-y-8">
            
            {/* RECIPIENT MODE SELECTOR */}
            <Card className="rounded-[32px] sm:rounded-[40px] border-none shadow-sm overflow-hidden bg-white">
              <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-center sm:text-left">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-colors", isSomeoneElse ? "bg-orange-100 text-orange-600" : "bg-primary/10 text-primary")}>
                    {isSomeoneElse ? <UserPlus className="w-6 h-6" /> : <UserCheck className="w-6 h-6" />}
                  </div>
                  <div>
                    <p className="font-black text-xs sm:text-sm uppercase tracking-tight">Ordering for someone else?</p>
                    <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Provide patient details for pharmacist review</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-full border">
                  <span className="text-[9px] font-black uppercase text-gray-400">Yes</span>
                  <Switch checked={isSomeoneElse} onCheckedChange={(v) => {
                    setIsSomeoneElse(v);
                    if (v) {
                      setOrderInfo({...orderInfo, patientName: '', phoneNumber: ''});
                    }
                  }} />
                </div>
              </CardContent>
            </Card>

            {/* SAVED ADDRESSES SELECTOR */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Delivery Provision</h3>
                <button onClick={() => setOrderInfo({...orderInfo, street: '', landmark: '', pincode: '', lat: 0, lng: 0})} className="text-primary font-black text-[10px] uppercase tracking-widest flex items-center gap-1.5 hover:underline">
                  <Plus className="w-3.5 h-3.5" /> Add New Address
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {savedAddresses?.map((addr) => (
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

            <Card className="rounded-[32px] sm:rounded-[40px] border-none shadow-sm overflow-hidden bg-white">
              <CardHeader className="bg-white p-6 sm:p-8 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <CardTitle className="text-lg font-black uppercase tracking-tight">Delivery Logistics</CardTitle>
                </div>
                <Button onClick={handleLocateMe} variant="outline" className="rounded-full border-2 font-black text-[9px] uppercase tracking-widest h-10 px-5 gap-2">
                  {isLocating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LocateFixed className="w-3.5 h-3.5" />}
                  Verify My GPS
                </Button>
              </CardHeader>
              <CardContent className="p-6 sm:p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Recipient Name</Label>
                    <Input 
                      value={orderInfo.patientName} 
                      onChange={e => setOrderInfo({...orderInfo, patientName: e.target.value})} 
                      placeholder={isSomeoneElse ? "Enter Patient Name" : "Your Full Name"}
                      className="h-14 rounded-2xl bg-gray-50 border-none font-bold text-sm" 
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Contact Number</Label>
                    <Input 
                      value={orderInfo.phoneNumber} 
                      onChange={e => setOrderInfo({...orderInfo, phoneNumber: e.target.value.replace(/\D/g, '').slice(0, 10)})} 
                      placeholder="Enter mobile number"
                      className="h-14 rounded-2xl bg-gray-50 border-none font-bold text-sm" 
                    />
                  </div>
                  <div className="md:col-span-2 space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Full Delivery Address</Label>
                    <div className="relative">
                      <Input 
                        value={orderInfo.street} 
                        onChange={e => setOrderInfo({...orderInfo, street: e.target.value})} 
                        className="h-14 pr-14 rounded-2xl bg-gray-50 border-none font-bold text-sm" 
                      />
                      <button 
                        onClick={() => {
                          setSearchQuery(orderInfo.street);
                          handleSearchAddress();
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                      >
                        {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 relative">
                       <div className="flex-1 relative">
                          <Input 
                            placeholder="Search Landmark or Area (min. 3 letters)..." 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSearchAddress()}
                            className="h-10 rounded-xl bg-gray-100 border-none text-[10px] font-bold"
                          />
                          {locationSuggestions.length > 0 && (
                            <div className="absolute top-[calc(100%+8px)] left-0 right-0 z-[120] bg-white rounded-2xl shadow-3xl border border-gray-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                              <div className="max-h-[280px] overflow-y-auto scrollbar-hide">
                                {locationSuggestions.map((place, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => {
                                      setOrderInfo(prev => ({
                                        ...prev,
                                        street: place.display_name,
                                        pincode: place.address.postcode?.replace(/\s/g, '') || prev.pincode,
                                        lat: parseFloat(place.lat),
                                        lng: parseFloat(place.lon)
                                      }));
                                      setSearchQuery('');
                                      setLocationSuggestions([]);
                                      toast({ title: "Location verified" });
                                    }}
                                    className="w-full p-4 text-left hover:bg-primary/5 border-b last:border-none transition-all group"
                                  >
                                    <p className="text-[10px] font-black uppercase text-gray-900 line-clamp-1 group-hover:text-primary transition-colors">{place.display_name}</p>
                                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{place.address.suburb || place.address.neighbourhood || 'Clinical Logistics Point'}</p>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                       </div>
                       <Button onClick={handleSearchAddress} className="h-10 rounded-xl px-6 font-black text-[9px] uppercase tracking-widest shrink-0">Search Location</Button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Flat / Landmark</Label>
                    <Input value={orderInfo.landmark} onChange={e => setOrderInfo({...orderInfo, landmark: e.target.value})} placeholder="e.g. Near Hub" className="h-14 rounded-2xl bg-gray-50 border-none font-bold text-sm" />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Pincode</Label>
                    <Input value={orderInfo.pincode} onChange={e => setOrderInfo({...orderInfo, pincode: e.target.value.replace(/\D/g, '').slice(0, 6)})} placeholder="6-digit PIN" className="h-14 rounded-2xl bg-gray-50 border-none font-bold text-sm" />
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
                    paymentMethod === 'COD' ? "border-primary bg-primary/5 shadow-md" : "border-gray-100 hover:border-gray-200"
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
              <h2 className="text-[10px] font-black mb-8 text-gray-400 uppercase tracking-[0.3em]">Billing Summary</h2>
              <div className="space-y-4 mb-8 pt-6 border-t border-dashed">
                <div className="flex justify-between text-[10px] font-black uppercase text-gray-400">
                  <span>Medicine Value</span>
                  <span>₹{totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[10px] font-black uppercase text-accent">
                  <span className="flex items-center gap-1.5"><Tag className="w-3 h-3" /> Offer Applied</span>
                  <span>-₹{appliedPromo ? (appliedPromo.discountType === 'fixed' ? appliedPromo.discountValue : (totalPrice * (appliedPromo.discountValue/100))).toFixed(2) : '0.00'}</span>
                </div>
                <div className="flex justify-between text-[10px] font-black uppercase text-gray-900">
                  <span>Clinical Logistics</span>
                  <span className="text-accent">FREE</span>
                </div>
                <div className="pt-6 border-t border-gray-100 flex justify-between items-baseline">
                  <span className="text-sm font-black text-gray-900 uppercase tracking-widest">Payable</span>
                  <span className="text-3xl font-black text-primary tracking-tighter">₹{totalPrice.toFixed(2)}</span>
                </div>
              </div>
              <Button onClick={handlePlaceOrder} disabled={loading} className="w-full h-18 rounded-full text-xs font-black uppercase tracking-widest shadow-2xl shadow-primary/30 gap-3">
                {loading ? <Loader2 className="animate-spin" /> : "Verify & Place Order"}
                <ArrowRight className="w-4 h-4" />
              </Button>
              <div className="mt-6 flex items-center justify-center gap-3">
                 <ShieldCheck className="w-4 h-4 text-green-500" />
                 <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Verified Pharmacy Transaction</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
