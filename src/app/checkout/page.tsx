"use client"

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MapPin, Truck, ShieldCheck, Plus, LocateFixed, Loader2, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';

export default function CheckoutPage() {
  const { cart, totalPrice, clearCart, location } = useCart();
  const { user } = useUser();
  const db = useFirestore();
  const [addressStep, setAddressStep] = useState('select'); 
  const [selectedAddress, setSelectedAddress] = useState('1');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handlePlaceOrder = async () => {
    if (!user) {
      toast({ title: "Login Required", description: "Please sign in to complete your order." });
      router.push('/login');
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
      shippingAddressId: selectedAddress,
      paymentStatus: 'Paid',
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
      console.error(err);
      toast({ variant: "destructive", title: "Order Failed", description: "Something went wrong." });
    } finally {
      setLoading(false);
    }
  };

  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 3);

  return (
    <div className="min-h-screen bg-[#F8F8F8] pb-32 sm:pb-8">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8 md:py-16">
        <h1 className="text-3xl font-black font-headline mb-12 text-gray-900 uppercase tracking-widest">Secure Checkout</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <Card className="rounded-[40px] border-none shadow-sm bg-primary/5 border border-primary/10">
               <CardContent className="p-8 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                      <LocateFixed className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-sm uppercase tracking-widest text-primary">Your Selected Area</h3>
                      <p className="text-gray-900 font-bold">{location}</p>
                    </div>
                  </div>
                  <Button variant="outline" className="rounded-full h-10 border-primary text-primary font-black text-[10px] uppercase tracking-widest">Change</Button>
               </CardContent>
            </Card>

            <Card className="rounded-[40px] border-none shadow-sm overflow-hidden bg-white">
              <CardHeader className="bg-white p-8 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <CardTitle className="text-xl font-black">Delivery Address</CardTitle>
                  </div>
                  {addressStep === 'select' && (
                    <Button variant="ghost" onClick={() => setAddressStep('new')} className="text-primary font-bold gap-2 hover:bg-primary/5 rounded-full px-6">
                      <Plus className="w-4 h-4" /> Add New
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-8">
                {addressStep === 'select' ? (
                  <RadioGroup value={selectedAddress} onValueChange={setSelectedAddress} className="space-y-4">
                    {[
                      { id: '1', label: 'Home', addr: 'B-402, Sunshine Apts, Worli, Mumbai', phone: '9876543210' },
                      { id: '2', label: 'Office', addr: 'Level 12, Tech Park, Whitefield, Bangalore', phone: '9123456789' }
                    ].map((addr) => (
                      <div key={addr.id} className={`p-6 rounded-[32px] border-2 transition-all cursor-pointer ${selectedAddress === addr.id ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10' : 'border-gray-50 hover:border-gray-200 bg-gray-50/50'}`} onClick={() => setSelectedAddress(addr.id)}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <RadioGroupItem value={addr.id} id={`addr-${addr.id}`} className="mt-1" />
                            <div>
                              <Label htmlFor={`addr-${addr.id}`} className="font-black text-[10px] uppercase tracking-widest text-primary mb-1 block cursor-pointer">{addr.label}</Label>
                              <p className="text-gray-900 font-black mb-1 text-lg">{addr.addr}</p>
                              <p className="text-gray-400 text-sm font-bold">Mobile: <span className="text-gray-900 font-black">{addr.phone}</span></p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                ) : (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Recipient Name</Label>
                        <Input placeholder="e.g. Rahul Sharma" className="h-14 rounded-2xl bg-gray-50 border-none font-bold focus-visible:ring-primary" />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Mobile Number (10 digits)</Label>
                        <Input placeholder="Enter 10-digit number" maxLength={10} className="h-14 rounded-2xl bg-gray-50 border-none font-bold focus-visible:ring-primary" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Complete Physical Address</Label>
                      <Input placeholder="Flat No, Building Name, Landmark, Area" className="h-14 rounded-2xl bg-gray-50 border-none font-bold focus-visible:ring-primary" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <Input placeholder="PIN Code" className="h-14 rounded-2xl bg-gray-50 border-none font-bold" />
                      <Input placeholder="City" className="h-14 rounded-2xl bg-gray-50 border-none font-bold" />
                      <Input placeholder="State" className="h-14 rounded-2xl bg-gray-50 border-none font-bold" />
                    </div>
                    <div className="flex gap-4 pt-4">
                      <Button onClick={() => setAddressStep('select')} variant="outline" className="h-14 rounded-full px-8 font-black uppercase text-[10px] tracking-widest border-2">Cancel</Button>
                      <Button onClick={() => setAddressStep('select')} className="h-14 rounded-full px-12 font-black uppercase text-[10px] tracking-widest flex-1 shadow-xl shadow-primary/20">Save & Deliver Here</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-[40px] border-none shadow-sm overflow-hidden bg-white">
               <CardContent className="p-8 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-green-50 text-green-600 rounded-[20px] flex items-center justify-center shadow-inner">
                      <Truck className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-black text-xl text-gray-900">Estimated Delivery</h3>
                      <p className="text-muted-foreground text-sm font-bold mt-1">
                        Arrival by: <span className="text-primary font-black">{deliveryDate.toDateString()}</span> (2-3 days)
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-700 font-black uppercase text-[10px] border-none px-6 py-3 rounded-full">FREE DELIVERY</Badge>
               </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white p-10 rounded-[50px] shadow-2xl border border-gray-100 sticky top-24">
              <h2 className="text-2xl font-black mb-10 text-gray-900 uppercase tracking-widest">Order Summary</h2>
              
              <div className="space-y-6 mb-10 max-h-[30vh] overflow-y-auto scrollbar-hide">
                 {cart.map(item => (
                   <div key={item.id} className="flex justify-between items-center text-sm p-2 border-b border-gray-50 last:border-none">
                     <div className="flex flex-col">
                        <span className="text-gray-900 font-black">{item.name}</span>
                        <span className="text-[10px] text-gray-400 font-bold">Qty: {item.quantity} • ₹{item.price}</span>
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
                  <span>Delivery Charges</span>
                  <span className="text-green-600 font-black uppercase text-[10px]">FREE</span>
                </div>
                <div className="pt-8 border-t border-gray-100 flex justify-between items-baseline">
                  <span className="text-xl font-black text-gray-900 uppercase tracking-widest">Grand Total</span>
                  <span className="text-4xl font-black text-primary">₹{totalPrice}</span>
                </div>
              </div>

              <div className="hidden sm:block">
                <Button onClick={handlePlaceOrder} disabled={loading || cart.length === 0} className="w-full h-16 rounded-full text-lg font-black uppercase tracking-widest shadow-2xl shadow-primary/40 hover:scale-[1.02] transition-all gap-3">
                  {loading ? <Loader2 className="animate-spin" /> : (user ? "Confirm & Pay" : "Login to Checkout")}
                </Button>
              </div>
              
              <div className="mt-10 flex flex-col gap-4">
                 <div className="flex items-center gap-4 text-[10px] font-black uppercase text-gray-400 tracking-widest bg-gray-50 p-5 rounded-[24px] border border-gray-100">
                   <ShieldCheck className="w-5 h-5 text-green-500 shrink-0" />
                   100% Genuine Medicines • Secure Encryption
                 </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* STICKY MOBILE CHECKOUT BAR */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 animate-in slide-in-from-bottom-6 duration-500">
        <div className="bg-primary p-4 rounded-[32px] shadow-2xl shadow-primary/50 flex items-center justify-between gap-4 border border-white/20 backdrop-blur-md bg-primary/95">
          <div className="pl-2">
            <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Grand Total</p>
            <p className="text-2xl font-black text-white">₹{totalPrice}</p>
          </div>
          <Button 
            onClick={handlePlaceOrder} 
            disabled={loading || cart.length === 0}
            className="flex-1 bg-white text-primary hover:bg-gray-100 rounded-full h-14 font-black uppercase text-xs tracking-widest gap-2 shadow-lg"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                {user ? "Confirm & Pay" : "Login to Checkout"}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
