
"use client"

import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, Truck, CheckCircle2, MapPin, Clock, ArrowLeft, Loader2, Info } from 'lucide-react';
import Link from 'next/link';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';

export default function OrdersPage() {
  const { user } = useUser();
  const db = useFirestore();

  const ordersQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'userProfiles', user.uid, 'orders'), orderBy('orderDate', 'desc'));
  }, [db, user]);

  const { data: orders, isLoading } = useCollection(ordersQuery);

  return (
    <div className="min-h-screen bg-[#F8F8F8] page-transition-wrapper">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 py-6 md:py-16">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/profile" className="sm:hidden">
            <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-sm">
              <ArrowLeft className="w-3.5 h-3.5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-black font-headline text-gray-900 uppercase tracking-widest">Order History</h1>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-gray-400 font-bold uppercase text-[9px] tracking-[0.2em]">Syncing health records...</p>
            </div>
          ) : orders && orders.length > 0 ? (
            orders.map((order) => (
              <Card key={order.id} className="rounded-[32px] border-none shadow-sm overflow-hidden bg-white hover:shadow-xl transition-all duration-300 active:scale-[0.98]">
                <CardHeader className="p-6 border-b bg-gray-50/30">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-sm ${
                        order.status === 'Delivered' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {order.status === 'Delivered' ? <CheckCircle2 className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">ORDER_REF</p>
                        <h3 className="font-black text-sm text-gray-900">{order.id.substring(0, 8).toUpperCase()}</h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={`rounded-full px-4 py-1 text-[8px] font-black uppercase tracking-widest border-none ${
                        order.status === 'Delivered' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'
                      }`}>
                        {order.status}
                      </Badge>
                      <span className="text-[10px] font-bold text-gray-400">
                        {order.orderDate?.toDate ? order.orderDate.toDate().toLocaleDateString() : 'Pending'}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Items List */}
                    <div className="space-y-3">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Prescription Details</p>
                      {order.items?.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between items-center text-xs">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900">{item.name}</span>
                            <span className="text-[9px] text-gray-400 uppercase">Qty: {item.quantity}</span>
                          </div>
                          <span className="font-black text-gray-900">₹{item.unitPrice * item.quantity}</span>
                        </div>
                      ))}
                      <div className="pt-3 border-t flex justify-between items-baseline">
                        <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Total Value</span>
                        <span className="text-xl font-black text-primary">₹{order.totalAmount}</span>
                      </div>
                    </div>

                    {/* Logistics & Tracking */}
                    <div className="space-y-4">
                       <div className="bg-gray-50/50 p-5 rounded-[24px] border border-gray-100/50 space-y-4">
                          {order.trackingId ? (
                            <div className="space-y-3">
                               <div className="flex items-center gap-2 mb-2">
                                  <Truck className="w-4 h-4 text-blue-600" />
                                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Tracking Active</span>
                               </div>
                               <div>
                                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Logistic Partner</p>
                                  <p className="text-xs font-black text-gray-900">{order.carrier || 'Not Specified'}</p>
                               </div>
                               <div>
                                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">AWB / Tracking ID</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <code className="text-[11px] font-black text-primary bg-primary/5 px-3 py-1 rounded-md">{order.trackingId}</code>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => navigator.clipboard.writeText(order.trackingId)}>
                                      <Info className="w-3 h-3" />
                                    </Button>
                                  </div>
                               </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-start gap-3">
                                <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Destination Hub</p>
                                  <p className="text-[10px] font-bold text-gray-700 leading-tight">Verified Delivery Address</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-3">
                                <Clock className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">ETA</p>
                                  <p className="text-[10px] font-bold text-gray-700">Clinical Logistics (2-3 days)</p>
                                </div>
                              </div>
                            </>
                          )}
                       </div>
                       
                       <div className="flex gap-2">
                          <Button className="flex-1 rounded-full h-10 font-black uppercase text-[9px] tracking-widest shadow-md active:scale-95 transition-all text-white bg-primary">Quick Refill</Button>
                          <Button variant="outline" className="flex-1 rounded-full h-10 font-black uppercase text-[9px] tracking-widest border-2 active:scale-95">Support</Button>
                       </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-20 bg-white rounded-[32px] border border-gray-100 shadow-sm">
               <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                 <Package className="w-6 h-6 text-gray-200" />
               </div>
               <h2 className="text-xl font-black mb-1.5 uppercase tracking-tight">No health journeys yet</h2>
               <p className="text-gray-400 font-bold mb-8 text-[10px] uppercase tracking-widest">Future orders will appear here.</p>
               <Link href="/">
                 <Button className="rounded-full px-10 h-14 font-black text-sm shadow-xl shadow-primary/20 uppercase tracking-widest active:scale-95 text-white bg-primary">Start Shopping</Button>
               </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

