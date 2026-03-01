
"use client"

import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, Truck, CheckCircle2, ChevronRight, MapPin, Clock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const DUMMY_ORDERS = [
  {
    id: 'ORD-8821',
    date: 'Oct 24, 2023',
    status: 'Delivered',
    total: '₹1,450',
    items: [
      { name: 'Janumet 50mg/500mg', qty: 1, price: '₹1,250' },
      { name: 'Pantoprazole 40mg', qty: 1, price: '₹200' }
    ],
    address: 'B-402, Sunshine Apts, Worli, Mumbai'
  },
  {
    id: 'ORD-8905',
    date: 'Oct 28, 2023',
    status: 'In Transit',
    total: '₹535',
    items: [
      { name: 'Atorvastatin Generic 20mg', qty: 2, price: '₹170' },
      { name: 'Standard Gauze Roll', qty: 3, price: '₹365' }
    ],
    address: 'B-402, Sunshine Apts, Worli, Mumbai'
  }
];

export default function OrdersPage() {
  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 py-8 md:py-16">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/profile">
            <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-sm">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-black font-headline text-gray-900 uppercase tracking-widest">Order History</h1>
        </div>

        <div className="space-y-6">
          {DUMMY_ORDERS.length > 0 ? (
            DUMMY_ORDERS.map((order) => (
              <Card key={order.id} className="rounded-[40px] border-none shadow-sm overflow-hidden bg-white hover:shadow-xl transition-all duration-300 group">
                <CardHeader className="p-8 border-b bg-gray-50/50">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${
                        order.status === 'Delivered' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {order.status === 'Delivered' ? <CheckCircle2 className="w-6 h-6" /> : <Truck className="w-6 h-6 animate-pulse" />}
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Order ID</p>
                        <h3 className="font-black text-lg text-gray-900">{order.id}</h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={`rounded-full px-6 py-2 text-[10px] font-black uppercase tracking-widest border-none ${
                        order.status === 'Delivered' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'
                      }`}>
                        {order.status}
                      </Badge>
                      <span className="text-sm font-bold text-gray-400">{order.date}</span>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Items List */}
                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Items Summary</p>
                      {order.items.map((item, i) => (
                        <div key={i} className="flex justify-between items-center group/item">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900 group-hover/item:text-primary transition-colors">{item.name}</span>
                            <span className="text-xs text-gray-400">Quantity: {item.qty}</span>
                          </div>
                          <span className="font-black text-gray-900">{item.price}</span>
                        </div>
                      ))}
                      <div className="pt-4 border-t flex justify-between items-baseline">
                        <span className="text-sm font-black text-gray-900 uppercase tracking-widest">Total Amount Paid</span>
                        <span className="text-2xl font-black text-primary">{order.total}</span>
                      </div>
                    </div>

                    {/* Delivery Details */}
                    <div className="space-y-6">
                       <div className="bg-gray-50 p-6 rounded-[32px] border border-gray-100">
                          <div className="flex items-start gap-3 mb-4">
                            <MapPin className="w-4 h-4 text-primary shrink-0 mt-1" />
                            <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Shipping to</p>
                              <p className="text-xs font-bold text-gray-700 leading-relaxed">{order.address}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <Clock className="w-4 h-4 text-orange-400 shrink-0 mt-1" />
                            <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Estimated Arrival</p>
                              <p className="text-xs font-bold text-gray-700">Delivered within 3 business days</p>
                            </div>
                          </div>
                       </div>
                       
                       <div className="flex gap-3">
                          <Button className="flex-1 rounded-full h-12 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20">Reorder All</Button>
                          <Button variant="outline" className="flex-1 rounded-full h-12 font-black uppercase text-[10px] tracking-widest border-2">Need Help?</Button>
                       </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-24 bg-white rounded-[40px] border shadow-sm">
               <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                 <Package className="w-10 h-10 text-gray-200" />
               </div>
               <h2 className="text-2xl font-black mb-2">No orders yet</h2>
               <p className="text-gray-400 font-bold mb-8">Your health journeys will appear here.</p>
               <Link href="/">
                 <Button className="rounded-full px-12 h-14 font-black text-lg">Start Shopping</Button>
               </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
