
"use client"

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { MapPin, Truck, ShieldCheck, Plus, CheckCircle2, LocateFixed } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function CheckoutPage() {
  const { cart, totalPrice, clearCart, location } = useCart();
  const [addressStep, setAddressStep] = useState('select'); // 'select' | 'new'
  const [selectedAddress, setSelectedAddress] = useState('1');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handlePlaceOrder = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast({ title: "Order Placed!", description: "Your healthcare needs are on the way." });
      clearCart();
      router.push('/');
    }, 1500);
  };

  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 3);

  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8 md:py-16">
        <h1 className="text-3xl font-black font-headline mb-12 text-gray-900 uppercase tracking-widest">Secure Checkout</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Checkout Steps */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Picked Location Info */}
            <Card className="rounded-[40px] border-none shadow-sm bg-primary/5 border border-primary/10">
               <CardContent className="p-8 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                      <LocateFixed className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-black text-sm uppercase tracking-widest text-primary">Your Selected Area</h3>
                      <p className="text-gray-900 font-bold">{location}</p>
                    </div>
                  </div>
                  <Button variant="outline" className="rounded-full h-10 border-primary text-primary font-black text-[10px] uppercase tracking-widest">Change</Button>
               </CardContent>
            </Card>

            {/* Delivery Address */}
            <Card className="rounded-[40px] border-none shadow-sm overflow-hidden">
              <CardHeader className="bg-white p-8 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                      <MapPin className="w-5 h-5" />
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

            {/* Delivery Method */}
            <Card className="rounded-[40px] border-none shadow-sm overflow-hidden bg-white">
               <CardContent className="p-8 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-green-50 text-green-600 rounded-[20px] flex items-center justify-center shadow-inner">
                      <Truck className="w-7 h-7" />
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

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white p-10 rounded-[50px] shadow-2xl border border-gray-100 sticky top-24">
              <h2 className="text-2xl font-black mb-10 text-gray-900 uppercase tracking-widest">Order Summary</h2>
              
              <div className="space-y-6 mb-10">
                 {cart.map(item => (
                   <div key={item.id} className="flex justify-between items-center text-sm">
                     <div className="flex flex-col">
                        <span className="text-gray-900 font-black">{item.name}</span>
                        <span className="text-[10px] text-gray-400 font-bold">Qty: {item.quantity}</span>
                     </div>
                     <span className="font-black text-gray-900">₹{item.price * item.quantity}</span>
                   </div>
                 ))}
              </div>

              <div className="space-y-5 mb-10 pt-10 border-t border-gray-50">
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

              <Button onClick={handlePlaceOrder} disabled={loading} className="w-full h-16 rounded-full text-lg font-black uppercase tracking-widest shadow-2xl shadow-primary/40 hover:scale-[1.02] transition-all gap-3">
                {loading ? "Verifying..." : "Confirm & Pay"}
              </Button>
              
              <div className="mt-10 flex flex-col gap-4">
                 <div className="flex items-center gap-4 text-[10px] font-black uppercase text-gray-400 tracking-widest bg-gray-50 p-5 rounded-[24px] border border-gray-100">
                   <ShieldCheck className="w-6 h-6 text-green-500 shrink-0" />
                   100% Genuine Medicines • Secure Encryption
                 </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
