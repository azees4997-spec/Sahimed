
"use client"

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { MapPin, ShieldCheck, Loader2, Phone, User, Home, Building2, Hash, ArrowRight, LocateFixed, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';

export default function CheckoutPage() {
  const { cart, totalPrice, clearCart, location: homepageLocation } = useCart();
  const { user } = useUser();
  const db = useFirestore();
  const [loading, setLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
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
    if (user) {
      setOrderInfo(prev => ({
        ...prev,
        phoneNumber: user.phoneNumber?.replace('+91', '') || prev.phoneNumber,
        patientName: user.displayName || prev.patientName
      }));
    }
  }, [user]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!orderInfo.patientName.trim()) newErrors.patientName = "Name is required";
    if (!orderInfo.phoneNumber.trim()) newErrors.phoneNumber = "Phone is required";
    if (!orderInfo.street.trim()) newErrors.street = "Street address is required";
    if (!orderInfo.pincode.trim() || orderInfo.pincode.length !== 6) newErrors.pincode = "Valid 6-digit pincode is required";
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
              const neighborhood = data.address.suburb || data.address.neighbourhood || data.address.road || '';
              const city = data.address.city || data.address.town || data.address.village || '';
              const road = data.address.road || '';
              setOrderInfo(prev => ({
                ...prev,
                street: `${road ? road + ', ' : ''}${neighborhood}${city ? ', ' + city : ''}`,
                pincode: data.address.postcode || prev.pincode
              }));
              toast({ title: "Location Updated", description: "GPS coordinates applied." });
            }
          } catch (e) {
            toast({ variant: 'destructive', title: 'Location Error', description: 'Could not fetch address.' });
          } finally {
            setIsLocating(false);
          }
        },
        () => {
          setIsLocating(false);
          toast({ variant: 'destructive', title: 'Permission Denied', description: 'Allow GPS access to use this feature.' });
        }
      );
    }
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      toast({ title: "Login Required", description: "Please sign in to complete your order." });
      router.push('/login');
      return;
    }

    if (!validate()) {
      toast({ variant: "destructive", title: "Incomplete Address", description: "Please fill all mandatory delivery fields." });
      return;
    }

    if (cart.length === 0) {
      toast({ variant: "destructive", title: "Cart Empty", description: "Add items to cart first." });
      return;
    }

    setLoading(true);
    
    const orderData = {
      userId: user.uid,
      orderDate: serverTimestamp(),
      totalAmount: totalPrice,
      status: 'Pending',
      paymentStatus: 'Paid',
      patientName: orderInfo.patientName,
      phoneNumber: orderInfo.phoneNumber,
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
      const orderRef = collection(db, 'userProfiles', user.uid, 'orders');
      addDocumentNonBlocking(orderRef, orderData);
      
      toast({ title: "Order Placed!", description: "Your healthcare needs are on the way." });
      clearCart();
      
      setTimeout(() => {
        router.push('/orders');
      }, 500);
    } catch (err) {
      toast({ variant: "destructive", title: "Order Failed", description: "Something went wrong." });
    } finally {
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
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <Card className="rounded-[40px] border-none shadow-sm overflow-hidden bg-white">
              <CardHeader className="bg-white p-8 border-b flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <CardTitle className="text-xl font-black uppercase tracking-tight">Delivery Address Provision</CardTitle>
                </div>
                <Button variant="ghost" onClick={handleLocateMe} disabled={isLocating} className="rounded-full h-10 px-4 font-black text-[9px] uppercase tracking-widest gap-2 bg-primary/5 text-primary hover:bg-primary/10 active:scale-95">
                  {isLocating ? <Loader2 className="animate-spin w-3 h-3" /> : <LocateFixed className="w-3 h-3" />}
                  Locate Me
                </Button>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 ml-1">
                      <User className="w-3.5 h-3.5 text-primary" />
                      <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Patient Full Name <span className="text-red-500">*</span></Label>
                    </div>
                    <Input value={orderInfo.patientName} onChange={e => setOrderInfo({...orderInfo, patientName: e.target.value})} placeholder="Full Name" className={cn("h-16 rounded-2xl bg-gray-50 border-none font-bold shadow-inner px-6", errors.patientName && "ring-2 ring-red-500")} />
                    {errors.patientName && <p className="text-[9px] text-red-500 font-bold uppercase ml-2">{errors.patientName}</p>}
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 ml-1">
                      <Phone className="w-3.5 h-3.5 text-primary" />
                      <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Contact Number <span className="text-red-500">*</span></Label>
                    </div>
                    <Input value={orderInfo.phoneNumber} onChange={e => setOrderInfo({...orderInfo, phoneNumber: e.target.value})} placeholder="Mobile Number" className={cn("h-16 rounded-2xl bg-gray-50 border-none font-bold shadow-inner px-6", errors.phoneNumber && "ring-2 ring-red-500")} />
                    {errors.phoneNumber && <p className="text-[9px] text-red-500 font-bold uppercase ml-2">{errors.phoneNumber}</p>}
                  </div>
                  <div className="md:col-span-2 space-y-3">
                    <div className="flex items-center gap-2 ml-1">
                      <Home className="w-3.5 h-3.5 text-primary" />
                      <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Complete Street Address <span className="text-red-500">*</span></Label>
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
                    <Input value={orderInfo.pincode} onChange={e => setOrderInfo({...orderInfo, pincode: e.target.value})} placeholder="6-digit PIN" maxLength={6} className={cn("h-16 rounded-2xl bg-gray-50 border-none font-bold shadow-inner px-6", errors.pincode && "ring-2 ring-red-500")} />
                    {errors.pincode && <p className="text-[9px] text-red-500 font-bold uppercase ml-2">{errors.pincode}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="bg-accent/5 p-8 rounded-[40px] border border-accent/10 flex items-center gap-6">
               <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-lg border border-accent/10 shrink-0">
                  <ShieldCheck className="w-8 h-8 text-accent" />
               </div>
               <div>
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Pharmacist Verified Checkout</h3>
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1">Every order is reviewed for clinical safety and accuracy by our team.</p>
               </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white p-10 rounded-[50px] shadow-2xl border border-gray-50 sticky top-24 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />
              
              <h2 className="text-[11px] font-black mb-10 text-gray-400 uppercase tracking-[0.3em] relative z-10">Bill Breakdown</h2>
              
              <div className="space-y-6 mb-10 max-h-[30vh] overflow-y-auto scrollbar-hide relative z-10">
                 {cart.map(item => (
                   <div key={item.id} className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl group transition-all">
                     <div className="flex flex-col">
                        <span className="text-gray-900 font-black text-[11px] uppercase truncate max-w-[140px]">{item.name}</span>
                        <span className="text-[8px] text-gray-400 font-black uppercase tracking-widest">Qty: {item.quantity}</span>
                     </div>
                     <span className="font-black text-primary text-sm">₹{item.price * item.quantity}</span>
                   </div>
                 ))}
              </div>

              <div className="space-y-4 mb-10 pt-6 border-t border-dashed relative z-10">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-500">
                  <span>Cart Total</span>
                  <span>₹{totalPrice}</span>
                </div>
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                  <span className="text-gray-500">Shipping</span>
                  <span className="text-accent">FREE</span>
                </div>
                <div className="pt-8 border-t border-gray-100 flex justify-between items-baseline">
                  <span className="text-sm font-black text-gray-900 uppercase tracking-widest">Final Total</span>
                  <span className="text-4xl font-black text-primary tracking-tighter">₹{totalPrice}</span>
                </div>
              </div>

              <Button onClick={handlePlaceOrder} disabled={loading || cart.length === 0} className="w-full h-20 rounded-full text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/40 hover:scale-[1.02] transition-all gap-4 relative z-10 bg-primary text-white">
                {loading ? <Loader2 className="animate-spin" /> : (user ? "Confirm Order" : "Login to Checkout")}
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
