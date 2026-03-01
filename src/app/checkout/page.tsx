
"use client"

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { MapPin, Truck, ShieldCheck, Plus, CheckCircle2 } from 'lucide-react';
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
        <h1 className="text-3xl font-bold font-headline mb-12">Secure Checkout</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Checkout Steps */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Delivery Address */}
            <Card className="rounded-[40px] border-none shadow-sm overflow-hidden">
              <CardHeader className="bg-white p-8 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <CardTitle className="text-xl">Delivery Address</CardTitle>
                  </div>
                  {addressStep === 'select' && (
                    <Button variant="ghost" onClick={() => setAddressStep('new')} className="text-primary font-bold gap-2">
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
                      <div key={addr.id} className={`p-6 rounded-3xl border-2 transition-all cursor-pointer ${selectedAddress === addr.id ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200'}`} onClick={() => setSelectedAddress(addr.id)}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <RadioGroupItem value={addr.id} id={`addr-${addr.id}`} className="mt-1" />
                            <div>
                              <Label htmlFor={`addr-${addr.id}`} className="font-black text-sm uppercase tracking-widest text-primary mb-1 block cursor-pointer">{addr.label}</Label>
                              <p className="text-gray-900 font-bold mb-1">{addr.addr}</p>
                              <p className="text-gray-400 text-xs font-medium">Mobile: <span className="text-gray-600 font-bold">{addr.phone}</span></p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-gray-400">Recipient Name</Label>
                        <Input placeholder="Full Name" className="h-14 rounded-2xl bg-gray-50 border-none" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-gray-400">Mobile Number (10 digits)</Label>
                        <Input placeholder="Enter 10-digit number" maxLength={10} className="h-14 rounded-2xl bg-gray-50 border-none" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-gray-400">Complete Address</Label>
                      <Input placeholder="Flat, Building, Street, Area" className="h-14 rounded-2xl bg-gray-50 border-none" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Input placeholder="PIN Code" className="h-14 rounded-2xl bg-gray-50 border-none" />
                      <Input placeholder="City" className="h-14 rounded-2xl bg-gray-50 border-none" />
                      <Input placeholder="State" className="h-14 rounded-2xl bg-gray-50 border-none" />
                    </div>
                    <div className="flex gap-4">
                      <Button onClick={() => setAddressStep('select')} variant="outline" className="h-14 rounded-full px-8 font-bold">Cancel</Button>
                      <Button onClick={() => setAddressStep('select')} className="h-14 rounded-full px-8 font-bold flex-1">Save Address</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Delivery Method */}
            <Card className="rounded-[40px] border-none shadow-sm overflow-hidden">
               <CardContent className="p-8 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
                      <Truck className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Estimated Delivery</h3>
                      <p className="text-muted-foreground text-sm font-medium">Standard Delivery: <span className="text-gray-900 font-bold">{deliveryDate.toDateString()}</span> (2-3 days)</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-700 font-black uppercase text-[10px] border-none px-4 py-2">FREE</Badge>
               </CardContent>
            </Card>

          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white p-10 rounded-[40px] shadow-2xl border border-gray-100 sticky top-24">
              <h2 className="text-2xl font-bold mb-8">Order Summary</h2>
              
              <div className="space-y-4 mb-8">
                 {cart.map(item => (
                   <div key={item.id} className="flex justify-between text-sm">
                     <span className="text-gray-500 font-medium">{item.name} x {item.quantity}</span>
                     <span className="font-bold">₹{item.price * item.quantity}</span>
                   </div>
                 ))}
              </div>

              <div className="space-y-4 mb-8 pt-8 border-t border-gray-100">
                <div className="flex justify-between text-muted-foreground font-medium">
                  <span>Cart Total</span>
                  <span>₹{totalPrice}</span>
                </div>
                <div className="flex justify-between text-muted-foreground font-medium">
                  <span>Delivery Charges</span>
                  <span className="text-green-600 font-black uppercase text-[10px]">FREE</span>
                </div>
                <div className="pt-6 border-t border-gray-100 flex justify-between items-baseline">
                  <span className="text-xl font-bold">Grand Total</span>
                  <span className="text-3xl font-black text-primary">₹{totalPrice}</span>
                </div>
              </div>

              <Button onClick={handlePlaceOrder} disabled={loading} className="w-full h-16 rounded-full text-lg font-bold shadow-2xl shadow-primary/30 gap-2">
                {loading ? "Processing..." : "Confirm & Pay"}
              </Button>
              
              <div className="mt-8 pt-8 border-t flex flex-col gap-4">
                 <div className="flex items-center gap-3 text-[10px] font-black uppercase text-gray-400 tracking-widest bg-gray-50 p-4 rounded-2xl">
                   <ShieldCheck className="w-5 h-5 text-green-500 shrink-0" />
                   Genuine Medicines • Secure Payments
                 </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
