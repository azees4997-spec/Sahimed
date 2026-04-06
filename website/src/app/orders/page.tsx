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
  Maximize2,
  Calendar,
  CreditCard,
  Hash,
  ShieldCheck,
  Zap,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogTrigger
} from "@/components/ui/dialog";
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '@/components/PageTransition';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20
    } as any
  }
};

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
    <PageTransition>
      <div className="min-h-screen bg-[#F4F7F6] pharma-bg-pattern pb-32">
        <Navbar />
        
        <main className="max-w-5xl mx-auto px-6 py-12 md:py-20">
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center justify-between gap-6 mb-16"
          >
            <div className="flex items-center gap-6">
              <Link href="/profile">
                <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-xl hover:scale-110 transition-transform w-12 h-12 border border-white active:scale-95">
                  <ArrowLeft className="w-5 h-5 text-slate-900" />
                </Button>
              </Link>
              <div className="space-y-1">
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase font-outfit">Order History</h1>
                <p className="text-[10px] font-black text-slate-400 tracking-[0.4em] uppercase leading-none opacity-60">View & Track Your Orders</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-4 py-3 px-6 bg-white rounded-full shadow-xl border border-white">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span className="text-[9px] font-black text-slate-400 tracking-[0.2em] uppercase">Secure Delivery</span>
            </div>
          </motion.div>

          <div className="space-y-8">
            {isLoading ? (
              <div className="text-center py-32 bg-white/40 backdrop-blur-md rounded-[56px] border border-white shadow-2xl">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="inline-block mb-6"
                >
                  <Loader2 className="w-12 h-12 text-primary" />
                </motion.div>
                <p className="text-slate-400 font-black text-[10px] tracking-[0.3em] uppercase">Fetching your orders...</p>
              </div>
            ) : orders && orders.length > 0 ? (
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="space-y-6"
              >
                {orders.map((order) => (
                  <motion.div key={order.id} variants={itemVariants}>
                    <Card 
                      onClick={() => setSelectedOrder(order)}
                      className="group rounded-[48px] border-none shadow-xl overflow-hidden bg-white/40 backdrop-blur-md hover:bg-white hover:shadow-2xl transition-all duration-500 cursor-pointer active:scale-[0.98] border border-white"
                    >
                      <CardHeader className="p-10 border-b border-white/40">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div className="flex items-center gap-6">
                            <div className={cn(
                              "w-16 h-16 rounded-[24px] flex items-center justify-center shadow-inner transition-transform group-hover:scale-110 duration-500",
                              order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-600' : 'bg-primary/10 text-primary'
                            )}>
                              {order.status === 'Delivered' ? <CheckCircle2 className="w-8 h-8" /> : <Package className="w-8 h-8" />}
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-slate-400 tracking-[0.3em] mb-1.5 uppercase opacity-60">Order ID</p>
                              <h3 className="font-black text-lg text-slate-900 tracking-tight font-outfit uppercase">#{order.id.substring(0, 12).toUpperCase()}</h3>
                            </div>
                          </div>
                          <div className="flex items-center gap-8">
                            <div className="text-right hidden sm:block">
                              <p className="text-[9px] font-black text-slate-400 tracking-[0.3em] mb-1.5 uppercase opacity-60">Order Total</p>
                              <p className="font-black text-2xl text-primary tracking-tighter">₹{formatCurrency(order.totalAmount)}</p>
                            </div>
                            <div className="flex items-center gap-6">
                              <Badge className={cn(
                                "rounded-full px-8 py-3 text-[10px] font-black tracking-[0.2em] border-none uppercase shadow-lg",
                                order.status === 'Delivered' ? 'bg-emerald-600 text-white shadow-emerald-200' : 'bg-primary text-white shadow-primary/20'
                              )}>
                                {order.status}
                              </Badge>
                              <div className="bg-white/60 p-3 rounded-full group-hover:bg-primary group-hover:text-white transition-all">
                                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-white transition-all group-hover:translate-x-1" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="px-10 py-8">
                        <div className="flex flex-wrap items-center gap-10">
                          <div className="flex items-center gap-3">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span className="text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase">
                              {order.orderDate?.toDate ? order.orderDate.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'PROCESSING'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <CreditCard className="w-4 h-4 text-slate-400" />
                            <span className="text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase">{order.paymentType || 'COD'}</span>
                          </div>
                          <div className="flex items-center gap-3 max-w-[300px]">
                            <MapPin className="w-4 h-4 text-slate-400" />
                            <span className="text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase truncate">{order.shippingDetails?.street || 'VERIFIED DESTINATION'}</span>
                          </div>
                          {order.prescriptionUrl && (
                            <div className="flex items-center gap-3 text-primary bg-primary/5 px-4 py-2 rounded-full border border-primary/10">
                              <ImageIcon className="w-4 h-4" />
                              <span className="text-[9px] font-black tracking-[0.2em] uppercase">Prescription Attached</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-24 bg-white/40 backdrop-blur-md rounded-[56px] border border-white shadow-2xl"
              >
                 <div className="w-28 h-28 bg-white rounded-[40px] flex items-center justify-center mx-auto mb-10 shadow-xl border border-white">
                   <Package className="w-14 h-14 text-slate-100" />
                 </div>
                 <h2 className="text-3xl font-black mb-4 tracking-tighter text-slate-900 font-outfit uppercase">No Orders Found</h2>
                 <p className="text-slate-400 font-black mb-12 text-[10px] tracking-[0.3em] uppercase opacity-60">You haven't placed any orders yet</p>
                 <Link href="/">
                   <Button className="rounded-full px-16 h-20 font-black text-xs shadow-2xl shadow-primary/30 tracking-[0.3em] active:scale-95 text-white bg-primary uppercase hover:scale-105 transition-all">Shop Now</Button>
                 </Link>
              </motion.div>
            )}
          </div>
        </main>

        <AnimatePresence>
          {selectedOrder && (
            <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
              <DialogContent className="max-w-3xl w-[96vw] sm:w-full rounded-[64px] border-none p-0 overflow-hidden shadow-3xl bg-white/95 backdrop-blur-3xl z-[110]">
                <div className="bg-primary p-12 md:p-14 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-14 opacity-10 rotate-12 scale-150">
                    <Receipt className="w-48 h-48" />
                  </div>
                  <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start gap-6">
                    <div className="space-y-3">
                      <DialogDescription className="text-[10px] font-black tracking-[0.4em] text-white/60 uppercase">
                        Order Status & History
                      </DialogDescription>
                      <DialogTitle className="text-3xl font-black tracking-tighter uppercase font-outfit">Order Details</DialogTitle>
                    </div>
                    <Badge className="bg-white/20 text-white border-2 border-white/20 font-black text-[10px] tracking-[0.2em] px-8 py-3 rounded-full backdrop-blur-md uppercase">
                      {selectedOrder?.status || 'Active'}
                    </Badge>
                  </div>
                </div>

                <div className="p-12 md:p-14 space-y-12 max-h-[75vh] overflow-y-auto custom-scrollbar">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-6">
                      <h4 className="text-[10px] font-black tracking-[0.3em] text-slate-400 flex items-center gap-4 uppercase opacity-60">
                        <User className="w-4 h-4" /> Customer Details
                      </h4>
                      <div className="bg-slate-50/50 p-8 rounded-[32px] border border-white shadow-inner">
                        <p className="font-black text-base text-slate-900 uppercase tracking-tight">{selectedOrder?.patientName}</p>
                        <p className="text-[10px] font-black text-slate-400 mt-2 flex items-center gap-3 uppercase tracking-widest leading-none">
                          <Phone className="w-3.5 h-3.5" /> {selectedOrder?.phoneNumber}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <h4 className="text-[10px] font-black tracking-[0.3em] text-slate-400 flex items-center gap-4 uppercase opacity-60">
                        <MapPin className="w-4 h-4" /> Delivery Address
                      </h4>
                      <div className="bg-slate-50/50 p-8 rounded-[32px] border border-white shadow-inner">
                        <p className="text-[11px] font-bold text-slate-900 leading-relaxed uppercase tracking-tight">
                          {selectedOrder?.shippingDetails?.street}<br />
                          {selectedOrder?.shippingDetails?.landmark && <span className="text-slate-400">Marker: {selectedOrder.shippingDetails.landmark}<br /></span>}
                          <span className="font-black text-primary mt-2 block tracking-widest">POSTAL: {selectedOrder?.shippingDetails?.pincode}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {selectedOrder?.prescriptionUrl && (
                    <div className="space-y-6">
                      <h4 className="text-[10px] font-black tracking-[0.3em] text-slate-400 flex items-center gap-4 uppercase opacity-60">
                        <ImageIcon className="w-4 h-4" /> Prescription Attached
                      </h4>
                      <Dialog>
                        <DialogTrigger asChild>
                          <div className="relative aspect-[16/9] w-full bg-slate-50 rounded-[40px] overflow-hidden border-2 border-dashed border-slate-200 cursor-zoom-in group shadow-inner">
                            <img 
                              src={selectedOrder.prescriptionUrl} 
                              className="w-full h-full object-contain p-6 group-hover:scale-105 transition-transform duration-700" 
                              alt="Clinical Attachment" 
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-slate-900/10 transition-colors flex items-center justify-center">
                              <div className="bg-white/95 backdrop-blur-md px-8 py-3 rounded-full shadow-2xl opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0 flex items-center gap-4">
                                <Maximize2 className="w-4 h-4 text-primary" />
                                <span className="text-[9px] font-black tracking-[0.3em] uppercase">Analyze Image</span>
                              </div>
                            </div>
                          </div>
                        </DialogTrigger>
                        <DialogContent className="max-w-[95vw] sm:max-w-4xl border-none p-0 bg-black/80 backdrop-blur-3xl shadow-none z-[200]">
                          <DialogTitle className="sr-only">Clinical Document Matrix</DialogTitle>
                          <div className="relative aspect-[3/4] w-full max-h-[90vh] flex items-center justify-center p-6">
                            <img src={selectedOrder.prescriptionUrl} className="max-w-full max-h-full object-contain rounded-[40px] shadow-3xl" alt="Full Analysis" />
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}

                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black tracking-[0.3em] text-slate-400 flex items-center gap-4 uppercase opacity-60">
                      <ClipboardList className="w-4 h-4" /> Items Ordered
                    </h4>
                    <div className="bg-white rounded-[40px] border border-white shadow-xl overflow-hidden">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50/50 border-b border-white">
                          <tr>
                            <th className="px-10 py-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Medicine</th>
                            <th className="px-10 py-6 text-[9px] font-black text-slate-400 text-center uppercase tracking-widest">Qty</th>
                            <th className="px-10 py-6 text-[9px] font-black text-slate-400 text-right uppercase tracking-widest">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {selectedOrder?.items?.map((item: any, i: number) => (
                            <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                              <td className="px-10 py-8 font-black text-xs text-slate-900 uppercase tracking-tight">{item.name}</td>
                              <td className="px-10 py-8 text-xs font-black text-center text-slate-500">{item.quantity} units</td>
                              <td className="px-10 py-8 text-xs font-black text-right text-slate-900">₹{formatCurrency(item.unitPrice * item.quantity)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black tracking-[0.4em] text-slate-400 flex items-center gap-4 uppercase opacity-60">
                      <MapPin className="w-4 h-4" /> Delivery Address
                    </h4>
                    <div className="bg-white/60 backdrop-blur-md p-8 rounded-[40px] border border-white shadow-xl">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shrink-0">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] font-black text-primary tracking-[0.2em] mb-1.5 uppercase">{selectedOrder?.shippingDetails?.tag || 'Delivery Point'}</p>
                          <p className="text-sm font-black text-slate-900 tracking-tighter font-outfit uppercase">
                            {selectedOrder?.shippingDetails?.houseNumber}
                            {selectedOrder?.shippingDetails?.apartmentName ? `, ${selectedOrder?.shippingDetails?.apartmentName}` : ''}
                          </p>
                          <p className="text-[11px] font-bold text-slate-600 uppercase tracking-tight mt-1">
                            {selectedOrder?.shippingDetails?.street}
                          </p>
                          {selectedOrder?.shippingDetails?.landmark && (
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1 italic">
                              Near: {selectedOrder?.shippingDetails?.landmark}
                            </p>
                          )}
                          <p className="text-[10px] font-black text-slate-400 mt-3 tracking-[0.1em] uppercase opacity-60">
                            {selectedOrder?.shippingDetails?.city}, {selectedOrder?.shippingDetails?.state} - {selectedOrder?.shippingDetails?.pincode}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black tracking-[0.3em] text-slate-400 flex items-center gap-4 uppercase opacity-60">
                      <Receipt className="w-4 h-4" /> Bill Details
                    </h4>
                    <div className="bg-primary/5 p-12 rounded-[56px] border border-primary/10 space-y-6 relative overflow-hidden shadow-inner">
                      <div className="absolute bottom-0 right-0 p-8 opacity-5">
                         <Zap className="w-32 h-32 text-primary" />
                      </div>
                      <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-widest">
                        <span>Total MRP</span>
                        <span className="text-rose-400 line-through">₹{formatCurrency(selectedOrder?.billingBreakdown?.grossMrp || selectedOrder?.totalAmount)}</span>
                      </div>
                      <div className="flex justify-between text-[11px] font-black text-emerald-600 uppercase tracking-widest">
                        <span className="flex items-center gap-3"><Tag className="w-4 h-4" /> Discount</span>
                        <span>-₹{formatCurrency(selectedOrder?.billingBreakdown?.campaignDiscount || 0)}</span>
                      </div>
                      <div className="flex justify-between text-[11px] font-black text-slate-900 uppercase tracking-widest">
                        <span>Delivery Charges</span>
                        <span className="text-emerald-600 font-black">FREE</span>
                      </div>
                      <div className="pt-8 border-t border-dashed border-primary/20 flex flex-col items-end gap-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] opacity-60">Total Payable Amount</span>
                        <span className="text-5xl font-black text-primary tracking-tighter">₹{formatCurrency(selectedOrder?.totalAmount)}</span>
                      </div>
                      <div className="pt-6 flex items-center justify-center sm:justify-start gap-4 p-4 bg-white/60 rounded-[24px] border border-white">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                        <span className="text-[9px] font-black text-slate-900 tracking-[0.2em] uppercase">
                          Source: {selectedOrder?.paymentType} • Status: {selectedOrder?.paymentStatus === 'Paid' ? 'AUTHENTICATED' : 'COLLECTION PENDING'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={() => setSelectedOrder(null)}
                    className="w-full h-20 rounded-full font-black tracking-[0.4em] text-[11px] bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-2xl uppercase active:scale-95 border-4 border-white"
                  >
                    Close Details
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
