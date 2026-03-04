
"use client"

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { MapPin, ShieldCheck, Loader2, Phone, User, Home, Building2, Hash } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';

export default function CheckoutPage() {
  const { cart, totalPrice, clearCart, location } = useCart();
  const { user } = useUser();
  const db = useFirestore();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const [orderInfo, setOrderInfo] = useState({
    patientName: '',
    phoneNumber: '',
    street: '',
    landmark: '',
    pincode: ''
  });

  useEffect(() => {
    if (user) {
      setOrderInfo(prev => ({
        ...prev,
        phoneNumber: user.phoneNumber?.replace('+91', '') || '',
        patientName: user.displayName || ''
      }));
    }
  }, [user]);

  const handlePlaceOrder = async () => {
    if (!user) {
      toast({ title: "Login Required", description: "Please sign in to complete your order." });
      router.push('/login');
      return;
    }

    if (!orderInfo.street || !orderInfo.pincode || !orderInfo.phoneNumber) {
      toast({ variant: "destructive", title: "Incomplete Address", description: "Please provide essential delivery details." });
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
        <h1 className="text-3xl font-black font-headline mb-12 text-gray-900 uppercase tracking-widest">Secure Checkout</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <Card className="rounded-[40px] border-none shadow-sm overflow-hidden bg-white">
              <CardHeader className="bg-white p-8 border-b">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <CardTitle className="text-xl font-black uppercase tracking-tight">Delivery Details</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Patient Name</Label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input value={orderInfo.patientName} onChange={e => setOrderInfo({...orderInfo, patientName: e.target.value})} placeholder="Full Name" className="h-14 pl-12 rounded-2xl bg-gray-50 border-none font-bold" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Contact Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input value={orderInfo.phoneNumber} onChange={e => setOrderInfo({...orderInfo, phoneNumber: e.target.value})} placeholder="Mobile Number" className="h-14 pl-12 rounded-2xl bg-gray-50 border-none font-bold" />
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Street / Area Name</Label>
                    <div className="relative">
                      <Home className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input value={orderInfo.street} onChange={e => setOrderInfo({...orderInfo, street: e.target.value})} placeholder="Apartment, Street, Area" className="h-14 pl-12 rounded-2xl bg-gray-50 border-none font-bold" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Landmark (Optional)</Label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input value={orderInfo.landmark} onChange={e => setOrderInfo({...orderInfo, landmark: e.target.value})} placeholder="Nearby landmark" className="h-14 pl-12 rounded-2xl bg-gray-50 border-none font-bold" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Pincode</Label>
                    <div className="relative">
                      <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input value={orderInfo.pincode} onChange={e => setOrderInfo({...orderInfo, pincode: e.target.value})} placeholder="6-digit PIN" maxLength={6} className="h-14 pl-12 rounded-2xl bg-gray-50 border-none font-bold" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white p-10 rounded-[50px] shadow-2xl border border-gray-100 sticky top-24">
              <h2 className="text-2xl font-black mb-10 text-gray-900 uppercase tracking-widest">Bill Summary</h2>
              <div className="space-y-6 mb-10 max-h-[30vh] overflow-y-auto scrollbar-hide">
                 {cart.map(item => (
                   <div key={item.id} className="flex justify-between items-center text-sm p-2 border-b border-gray-50 last:border-none">
                     <div className="flex flex-col">
                        <span className="text-gray-900 font-black">{item.name}</span>
                        <span className="text-[10px] text-gray-400 font-bold">Qty: {item.quantity}</span>
                     </div>
                     <span className="font-black text-gray-900">₹{item.price * item.quantity}</span>
                   </div>
                 ))}
              </div>
              <div className="space-y-5 mb-10 pt-6 border-t border-gray-100">
                <div className="flex justify-between text-gray-500 font-bold">
                  <span>Cart Total</span>
                  <span>₹{totalPrice}</span>
                </div>
                <div className="flex justify-between text-gray-500 font-bold">
                  <span>Shipping</span>
                  <span className="text-green-600 font-black uppercase text-[10px]">FREE</span>
                </div>
                <div className="pt-8 border-t border-gray-100 flex justify-between items-baseline">
                  <span className="text-xl font-black text-gray-900 uppercase tracking-widest">Total</span>
                  <span className="text-4xl font-black text-primary">₹{totalPrice}</span>
                </div>
              </div>
              <Button onClick={handlePlaceOrder} disabled={loading || cart.length === 0} className="w-full h-16 rounded-full text-lg font-black uppercase tracking-widest shadow-2xl shadow-primary/40 hover:scale-[1.02] transition-all gap-3">
                {loading ? <Loader2 className="animate-spin" /> : (user ? "Confirm & Pay" : "Login to Checkout")}
              </Button>
              <div className="mt-10 flex flex-col gap-4">
                 <div className="flex items-center gap-4 text-[10px] font-black uppercase text-gray-400 tracking-widest bg-gray-50 p-5 rounded-[24px] border border-gray-100">
                   <ShieldCheck className="w-5 h-5 text-green-500 shrink-0" />
                   Pharmacist Verified • Secure Gateway
                 </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
