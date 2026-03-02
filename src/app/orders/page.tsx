
"use client"

import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, Truck, CheckCircle2, MapPin, Clock, ArrowLeft, Loader2 } from 'lucide-react';
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
    <div className="min-h-screen bg-[#F8F8F8] pb-16">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 py-8 md:py-16">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/profile">
            <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-black font-headline text-gray-900 uppercase tracking-widest">Order History</h1>
        </div>

        <div className="space-y-6">
          {isLoading ? (
            <div className="text-center py-24">
              <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
              <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em]">Retrieving Clinical Records...</p>
            </div>
          ) : orders && orders.length > 0 ? (
            orders.map((order) => (
              <Card key={order.id} className="rounded-[40px] border-none shadow-sm overflow-hidden bg-white hover:shadow-xl transition-all duration-300 group">
                <CardHeader className="p-8 border-b bg-gray-50/50">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm ${
                        order.status === 'Delivered' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {order.status === 'Delivered' ? <CheckCircle2 className="w-5 h-5" /> : <Truck className="w-5 h-5 animate-pulse" />}
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Order Reference</p>
                        <h3 className="font-black text-lg text-gray-900">{order.id.substring(0, 8).toUpperCase()}</h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={`rounded-full px-6 py-2 text-[10px] font-black uppercase tracking-widest border-none ${
                        order.status === 'Delivered' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'
                      }`}>
                        {order.status}
                      </Badge>
                      <span className="text-sm font-bold text-gray-400">
                        {order.orderDate?.toDate ? order.orderDate.toDate().toLocaleDateString() : 'Syncing...'}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Items List */}
                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Prescription Breakdown</p>
                      {order.items?.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between items-center group/item">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900 group-hover/item:text-primary transition-colors">{item.name}</span>
                            <span className="text-xs text-gray-400">Quantity: {item.quantity}</span>
                          </div>
                          <span className="font-black text-gray-900">₹{item.unitPrice * item.quantity}</span>
                        </div>
                      ))}
                      <div className="pt-4 border-t flex justify-between items-baseline">
                        <span className="text-sm font-black text-gray-900 uppercase tracking-widest">Total Paid</span>
                        <span className="text-2xl font-black text-primary">₹{order.totalAmount}</span>
                      </div>
                    </div>

                    {/* Delivery Details */}
                    <div className="space-y-6">
                       <div className="bg-gray-50 p-6 rounded-[32px] border border-gray-100">
                          <div className="flex items-start gap-3 mb-4">
                            <MapPin className="w-3 h-3 text-primary shrink-0 mt-1" />
                            <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Delivering to Hub</p>
                              <p className="text-xs font-bold text-gray-700 leading-relaxed">Verified Delivery Address</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <Clock className="w-3 h-3 text-orange-400 shrink-0 mt-1" />
                            <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Estimated Arrival</p>
                              <p className="text-xs font-bold text-gray-700">Standard Healthcare Logistics (2-3 days)</p>
                            </div>
                          </div>
                       </div>
                       
                       <div className="flex gap-3">
                          <Button className="flex-1 rounded-full h-12 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20">Refill All</Button>
                          <Button variant="outline" className="flex-1 rounded-full h-12 font-black uppercase text-[10px] tracking-widest border-2">Report Issue</Button>
                       </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-24 bg-white rounded-[40px] border shadow-sm">
               <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                 <Package className="w-8 h-8 text-gray-200" />
               </div>
               <h2 className="text-2xl font-black mb-2 uppercase tracking-tight">No health journeys recorded</h2>
               <p className="text-gray-400 font-bold mb-8">Your future orders will appear here for tracking.</p>
               <Link href="/">
                 <Button className="rounded-full px-12 h-14 font-black text-lg shadow-xl shadow-primary/20 uppercase tracking-widest">Start Shopping</Button>
               </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
