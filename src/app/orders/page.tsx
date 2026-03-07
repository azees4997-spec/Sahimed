
"use client"

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  MapPin, 
  Clock, 
  ArrowLeft, 
  Loader2, 
  Info, 
  Banknote,
  ChevronRight,
  User,
  ClipboardList,
  Receipt,
  Phone,
  Tag,
  ImageIcon,
  Maximize2
} from 'lucide-react';
import Link from 'next/link';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { cn } from '@/lib/utils';
import Image from 'next/image';

export default function OrdersPage() {
  const { user } = useUser();
  const db = useFirestore();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const ordersQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'userProfiles', user.uid, 'orders'), orderBy('orderDate', 'desc'));
  }, [db, user]);

  const { data: orders, isLoading } = useCollection(ordersQuery);

  const formatCurrency = (val: number | string) => Number(val || 0).toFixed(2);

  return (
    <div className="min-h-screen bg-[#F8F8F8] page-transition-wrapper">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 py-6 md:py-16">
        <div className="flex items-center gap-4 mb-10">
          <Link href="/profile" className="sm:hidden">
            <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-sm">
              <ArrowLeft className="w-3.5 h-3.5" />
            </Button>
          </Link>
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Order History</h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Your Clinical Records</p>
          </div>
        </div>

        <div className="space-y-6">
          {isLoading ? (
            <div className="text-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-gray-400 font-bold uppercase text-[9px] tracking-[0.2em]">Syncing health records...</p>
            </div>
          ) : orders && orders.length > 0 ? (
            orders.map((order) => (
              <Card 
                key={order.id} 
                onClick={() => setSelectedOrder(order)}
                className="group rounded-[40px] border-none shadow-sm overflow-hidden bg-white hover:shadow-2xl transition-all duration-500 cursor-pointer active:scale-[0.98]"
              >
                <CardHeader className="p-8 border-b bg-gray-50/30">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110",
                        order.status === 'Delivered' ? 'bg-green-50 text-green-600' : 'bg-primary/5 text-primary'
                      )}>
                        {order.status === 'Delivered' ? <CheckCircle2 className="w-6 h-6" /> : <Package className="w-6 h-6" />}
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Order Ref</p>
                        <h3 className="font-black text-sm text-gray-900 uppercase tracking-tight">#{order.id.substring(0, 12).toUpperCase()}</h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Final Value</p>
                        <p className="font-black text-lg text-primary tracking-tighter">₹{formatCurrency(order.totalAmount)}</p>
                      </div>
                      <Badge className={cn(
                        "rounded-full px-5 py-1.5 text-[9px] font-black uppercase tracking-widest border-none",
                        order.status === 'Delivered' ? 'bg-green-600 text-white' : 'bg-primary text-white shadow-lg shadow-primary/20'
                      )}>
                        {order.status}
                      </Badge>
                      <ChevronRight className="w-5 h-5 text-gray-200 group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="px-8 py-6">
                  <div className="flex flex-wrap items-center gap-8">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        {order.orderDate?.toDate ? order.orderDate.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Processing'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Banknote className="w-3.5 h-3.5 text-accent" />
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{order.paymentType || 'COD'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest truncate max-w-[200px]">{order.shippingDetails?.street || 'Verified Address'}</span>
                    </div>
                    {order.prescriptionUrl && (
                      <div className="flex items-center gap-2 text-primary">
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Prescription Attached</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-20 bg-white rounded-[40px] border-none shadow-sm">
               <div className="w-20 h-20 bg-gray-50 rounded-[32px] flex items-center justify-center mx-auto mb-8">
                 <Package className="w-10 h-10 text-gray-200" />
               </div>
               <h2 className="text-2xl font-black mb-2 uppercase tracking-tight text-gray-900">No health journeys yet</h2>
               <p className="text-gray-400 font-bold mb-10 text-[10px] uppercase tracking-widest">Your clinical orders will appear here.</p>
               <Link href="/">
                 <Button className="rounded-full px-12 h-16 font-black text-sm shadow-2xl shadow-primary/20 uppercase tracking-widest active:scale-95 text-white bg-primary">Start Shopping</Button>
               </Link>
            </div>
          )}
        </div>
      </main>

      {/* DETAILED SUMMARY DIALOG */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl rounded-[48px] border-none p-0 overflow-hidden shadow-3xl">
          <div className="bg-primary p-8 md:p-10 text-white">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">Clinical Record</p>
                <DialogTitle className="text-2xl font-black uppercase tracking-tight">Order Details</DialogTitle>
              </div>
              <Badge className="bg-white/20 text-white border-none font-black text-[10px] uppercase px-4 py-1.5 rounded-full backdrop-blur-sm">
                {selectedOrder?.status || 'Processing'}
              </Badge>
            </div>
          </div>

          <div className="p-8 md:p-10 space-y-10 max-h-[75vh] overflow-y-auto scrollbar-hide">
            {/* Patient & Logistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <User className="w-3 h-3" /> Recipient
                </h4>
                <div className="bg-gray-50 p-5 rounded-[24px] border border-gray-100">
                  <p className="font-black text-sm uppercase text-gray-900">{selectedOrder?.patientName}</p>
                  <p className="text-xs font-bold text-gray-500 mt-1 flex items-center gap-2">
                    <Phone className="w-3 h-3" /> {selectedOrder?.phoneNumber}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <MapPin className="w-3 h-3" /> Delivery Point
                </h4>
                <div className="bg-gray-50 p-5 rounded-[24px] border border-gray-100">
                  <p className="text-[11px] font-bold text-gray-700 leading-relaxed uppercase">
                    {selectedOrder?.shippingDetails?.street}<br />
                    {selectedOrder?.shippingDetails?.landmark && <span className="text-gray-400">Landmark: {selectedOrder.shippingDetails.landmark}<br /></span>}
                    <span className="font-black text-primary">PIN: {selectedOrder?.shippingDetails?.pincode}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Prescription Attachment Section */}
            {selectedOrder?.prescriptionUrl && (
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <ImageIcon className="w-3 h-3" /> Clinical Documentation
                </h4>
                <Dialog>
                  <DialogTrigger asChild>
                    <div className="relative aspect-[16/9] w-full bg-gray-50 rounded-[32px] overflow-hidden border-2 border-dashed border-gray-200 cursor-zoom-in group">
                      <img 
                        src={selectedOrder.prescriptionUrl} 
                        className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500" 
                        alt="Prescription Attachment" 
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
                        <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                          <Maximize2 className="w-3 h-3 text-primary" />
                          <span className="text-[8px] font-black uppercase tracking-widest">Click to Expand</span>
                        </div>
                      </div>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-[95vw] sm:max-w-3xl border-none p-0 bg-transparent shadow-none">
                    <DialogTitle className="sr-only">Prescription View</DialogTitle>
                    <div className="relative aspect-[3/4] w-full bg-white rounded-[40px] overflow-hidden p-4">
                      <img src={selectedOrder.prescriptionUrl} className="w-full h-full object-contain" alt="Full Clinical Document" />
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            {/* Items Breakup */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <ClipboardList className="w-3 h-3" /> Item Wise Manifest
              </h4>
              <div className="border rounded-[32px] overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-4 text-[9px] font-black uppercase text-gray-400">Medicine</th>
                      <th className="px-6 py-4 text-[9px] font-black uppercase text-gray-400 text-center">Qty</th>
                      <th className="px-6 py-4 text-[9px] font-black uppercase text-gray-400 text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {selectedOrder?.items?.map((item: any, i: number) => (
                      <tr key={i}>
                        <td className="px-6 py-5 font-black text-xs uppercase text-gray-900">{item.name}</td>
                        <td className="px-6 py-5 text-xs font-black text-center text-gray-500">{item.quantity}</td>
                        <td className="px-6 py-5 text-xs font-black text-right text-gray-900">₹{formatCurrency(item.unitPrice * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Breakdown */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <Receipt className="w-3 h-3" /> Bill Breakup
              </h4>
              <div className="bg-gray-50 p-8 rounded-[40px] border border-gray-100 space-y-4">
                <div className="flex justify-between text-[11px] font-black text-gray-500 uppercase">
                  <span>Gross Value (MRP)</span>
                  <span className="text-red-400 line-through">₹{formatCurrency(selectedOrder?.billingBreakdown?.grossMrp || selectedOrder?.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-[11px] font-black uppercase text-accent">
                  <span className="flex items-center gap-1.5"><Tag className="w-3 h-3" /> Campaign Savings</span>
                  <span>-₹{formatCurrency(selectedOrder?.billingBreakdown?.campaignDiscount || 0)}</span>
                </div>
                <div className="flex justify-between text-[11px] font-black uppercase text-gray-900">
                  <span>Clinical Logistics</span>
                  <span className="text-accent">FREE</span>
                </div>
                <div className="pt-6 border-t border-dashed flex justify-between items-baseline">
                  <span className="text-sm font-black text-gray-900 uppercase tracking-tighter">Net Payable</span>
                  <span className="text-4xl font-black text-primary tracking-tighter">₹{formatCurrency(selectedOrder?.totalAmount)}</span>
                </div>
                <div className="pt-2 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                    Mode: {selectedOrder?.paymentType} • {selectedOrder?.paymentStatus === 'Paid' ? 'Payment Verified' : 'Collection at Doorstep'}
                  </span>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => setSelectedOrder(null)}
              className="w-full h-16 rounded-full font-black uppercase tracking-widest text-[11px] bg-gray-900 text-white hover:bg-gray-800 transition-all shadow-xl"
            >
              Close Record
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
