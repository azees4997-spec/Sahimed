"use client"

import { useState, useEffect } from 'react';
import { 
  Loader2,
  Download, 
  Eye, 
  Edit2,
  X,
  Plus,
  ChevronRight,
  Package,
  Search,
  Stethoscope,
  CheckCircle,
  FileCheck,
  FileText,
  Printer,
  Trash2,
  Clock
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';
import { safeFormat } from '@/lib/safe-date';
import { SectionHeader } from './SectionHeader';

export function FulfillmentTab({ db, isVerified, onBack }: { db: any, isVerified: boolean, onBack: () => void }) {
  const [statusFilter, setStatusFilter] = useState('All');
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const { user } = useUser();
  const { toast } = useToast();

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const sp = new URLSearchParams();
      if (statusFilter !== 'All') sp.append('status', statusFilter);
      if (startDate) sp.append('start', startDate);
      if (endDate) sp.append('end', endDate);
      if (searchTerm) sp.append('search', searchTerm);
      sp.append('page', page.toString());
      sp.append('limit', '50');
      
      const token = await user?.getIdToken();
      const res = await fetch(`/api/orders?${sp.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      
      if (data.orders && Array.isArray(data.orders)) {
        setOrders(data.orders);
        setTotalOrders(data.total || 0);
        setTotalPages(data.totalPages || 1);
      } else if (Array.isArray(data)) {
        setOrders(data);
        setTotalOrders(data.length);
        setTotalPages(1);
      } else {
        setOrders([]);
      }
    } catch (err) {
      toast({ variant: 'destructive', title: "Fetch failed" });
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [statusFilter, startDate, endDate, searchTerm, page]);
  useEffect(() => { setPage(1); }, [statusFilter, startDate, endDate, searchTerm]);

  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [nextStatus, setNextStatus] = useState<any>(null);
  const [shippingInfo, setShippingInfo] = useState({ partner: '', awb: '' });
  const [cancelReason, setCancelReason] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const [isUpdating, setIsUpdating] = useState(false);
  const updateOrderStatus = async (id: string, newStatus: string, extra = {}) => {
    if (!id) {
      toast({ variant: 'destructive', title: "Missing ID", description: "Internal selection error." });
      return;
    }
    setIsUpdating(true);
    try {
      const token = await user?.getIdToken();
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id, status: newStatus, ...extra })
      });

      const result = await res.json();

      if (res.ok) {
        if (result.shipway && !result.shipway.success) {
          toast({ variant: 'destructive', title: "Logistics Sync Failed", description: result.shipway.error || "Shipway push failed" });
        } else {
          toast({ title: `Order ${newStatus}`, description: "Status successfully updated in prescription records." });
        }
        await fetchOrders();
        setNextStatus(null);
        setSelectedOrder(null);
      } else {
        throw new Error(result.error || "Update protocol failed");
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: "Synchronization Error", description: err.message });
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleDeleteOrder = async (id: string) => {
    if (!window.confirm("Are you sure? This will PERMANENTLY delete this order from both MongoDB and Firestore. This cannot be undone.")) return;
    
    setIsUpdating(true);
    try {
      const token = await user?.getIdToken();
      const res = await fetch(`/api/orders?id=${id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });
      
      const result = await res.json();
      if (res.ok) {
        toast({ title: "Order Purged", description: "The transaction has been removed from all databases." });
        await fetchOrders();
        setSelectedOrder(null);
      } else {
        throw new Error(result.error || "Purge failed");
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: "Deletion Error", description: err.message });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExport = () => {
    if (!orders || orders.length === 0) return;
    const headers = ["Order ID", "Date", "Patient Name", "Phone", "Address", "City", "PIN", "Items", "MRP", "Discount", "Fees", "Net Amount", "Status"];
    const rows = orders.map(order => {
      const itemsStr = (order.items || []).map((it: any) => `${it.name} x${it.quantity}`).join(" | ");
      const fullAddr = `${order.shippingDetails?.houseNumber ? order.shippingDetails.houseNumber + ', ' : ''}${order.shippingDetails?.street || ''}`;
      
      return [
        order.orderId, 
        safeFormat(order.orderDate, 'yyyy-MM-dd HH:mm'), 
        order.patientName, 
        order.phoneNumber, 
        `"${fullAddr.replace(/"/g, '""')}"`, 
        order.shippingDetails?.city || '',
        order.shippingDetails?.pincode || '',
        `"${itemsStr.replace(/"/g, '""')}"`,
        order.billingBreakdown?.grossMrp || '',
        order.billingBreakdown?.campaignDiscount || '',
        order.billingBreakdown?.deliveryFees || '',
        order.totalAmount,
        order.status
      ].join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_${safeFormat(new Date(), 'yyyyMMdd')}.csv`;
    a.click();
  };

  const handlePrint = (order: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsHtml = order.items.map((it: any) => `
      <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding: 10px 0;">
        <div style="font-weight: 600;">${it.name} <span style="font-weight: normal; color: #666; margin-left: 8px;">x ${it.quantity}</span></div>
        <div style="font-weight: 800;">₹${(it.unitPrice * it.quantity).toFixed(2)}</div>
      </div>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>SahiMed - Order #${order.orderId}</title>
          <style>
            body { font-family: 'Inter', system-ui, -apple-system, sans-serif; padding: 40px; color: #111; line-height: 1.5; }
            .header { border-bottom: 3px solid #000; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
            .branding h1 { margin: 0; font-size: 32px; font-weight: 900; letter-spacing: -1px; text-transform: uppercase; }
            .branding span { color: #5B21B6; }
            .order-meta { text-align: right; }
            .grid { display: grid; grid-cols: 2; gap: 40px; margin-bottom: 40px; }
            .section-title { font-size: 10px; font-weight: 900; color: #666; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px; }
            .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; font-weight: 600; }
            .grand-total { border-top: 3px solid #000; margin-top: 20px; padding-top: 20px; font-size: 24px; font-weight: 900; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="branding"><h1>Sahi<span>Med</span></h1><p style="margin: 4px 0 0; font-weight: 800; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #666;">Store Order Summary</p></div>
            <div class="order-meta">
              <div style="font-weight: 900; font-size: 18px;">ORDER #${order.orderId}</div>
              <div style="font-size: 12px; font-weight: 600; color: #666; margin-top: 4px;">
                ${safeFormat(order.orderDate || order.timestamp, 'dd MMM yyyy HH:mm')}
              </div>
            </div>
          </div>
          <div style="display: flex; gap: 60px; margin-bottom: 40px;">
            <div style="flex: 1;">
              <div class="section-title">Patient / Recipient</div>
              <div style="font-weight: 800; font-size: 16px;">${order.patientName}</div>
              <div style="font-weight: 600; color: #444;">${order.phoneNumber}</div>
            </div>
            <div style="flex: 1;">
              <div class="section-title">Delivery Address</div>
              <div style="font-weight: 700; font-size: 13px; line-height: 1.4;">
                ${order.shippingDetails?.houseNumber ? order.shippingDetails.houseNumber + '<br>' : ''}
                ${order.shippingDetails?.street || ''}<br>
                ${order.shippingDetails?.city || ''}, ${order.shippingDetails?.state || ''} - ${order.shippingDetails?.pincode || ''}
              </div>
            </div>
          </div>
          <div class="section-title">Order Items</div>
          <div style="margin-bottom: 40px;">${itemsHtml}</div>
          <div style="max-width: 400px; margin-left: auto;">
             <div class="total-row"><span>Gross MRP</span><span>₹${Number(order.billingBreakdown?.grossMrp || order.totalAmount).toFixed(2)}</span></div>
             <div class="total-row" style="color: #059669;"><span>Item Savings</span><span>-₹${Number(order.billingBreakdown?.campaignDiscount || order.billingBreakdown?.promoDiscount || 0).toFixed(2)}</span></div>
             <div class="total-row"><span>Delivery Fees</span><span>₹${Number(order.billingBreakdown?.deliveryFees || 0).toFixed(2)}</span></div>
             <div class="total-row grand-total"><span>Net Paid</span><span>₹${Number(order.totalAmount).toFixed(2)}</span></div>
          </div>
          <div style="margin-top: 80px; text-align: center; border-top: 1px dashed #ccc; padding-top: 20px; font-size: 10px; font-weight: 700; color: #999; text-transform: uppercase; letter-spacing: 2px;">
            Authorized medical signature required for Schedule H1 drugs fulfillment
          </div>
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-10">
      <SectionHeader title="Order Fulfillment" subtitle="Manage and track customer orders" onBack={onBack}>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-4 bg-white/60 backdrop-blur-md rounded-full px-6 h-14 border border-slate-200 shadow-sm min-w-[300px]">
            <Search className="w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by ID, Name or Phone..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-transparent border-none text-xs font-bold outline-none focus:ring-0 flex-1 placeholder:text-slate-300"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 bg-slate-100 rounded-full px-5 h-14 border border-slate-200 shadow-inner">
             <div className="flex items-center gap-2 group/date">
              <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest group-hover/date:text-primary transition-colors">Start Date</span>
              <input 
                type="date" 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)}
                className="bg-transparent border-none text-[10px] font-black outline-none focus:ring-0 uppercase cursor-pointer"
              />
            </div>
            <div className="w-px h-6 bg-slate-200 mx-2" />
            <div className="flex items-center gap-2 group/date">
              <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest group-hover/date:text-primary transition-colors">End Date</span>
              <input 
                type="date" 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)}
                className="bg-transparent border-none text-[10px] font-black outline-none focus:ring-0 uppercase cursor-pointer"
              />
            </div>
            {(startDate || endDate) && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => { setStartDate(''); setEndDate(''); }}
                className="h-8 w-8 ml-2 hover:bg-red-50 text-red-500 rounded-full transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
          <Button onClick={handleExport} variant="outline" className="rounded-full h-14 px-8 font-black text-[10px] border-2 gap-3 uppercase tracking-widest hover:bg-white transition-all active:scale-95 border-primary/20 text-primary">
            <Download className="w-4 h-4" /> Export Ledger
          </Button>
        </div>
      </SectionHeader>

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
        <div className="bg-white/60 backdrop-blur-md p-1.5 rounded-full border border-white shadow-xl flex w-fit gap-1.5 overflow-x-auto no-scrollbar">
          {['All', 'Pending', 'Pending Pharmacist', 'Pending Consult', 'Confirmed', 'Packing', 'Packed', 'Shipped', 'Delivered', 'Returned', 'Cancelled'].map((status) => (
            <button key={status} onClick={() => setStatusFilter(status)} className={cn("px-6 py-3.5 rounded-full text-[9px] font-black tracking-[0.2em] transition-all uppercase whitespace-nowrap", statusFilter === status ? "bg-primary text-white shadow-lg shadow-primary/30" : "text-slate-400 hover:bg-white/80")}>{status}</button>
          ))}
        </div>
      </div>
      
      <Card className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[1000px]">
            <thead className="bg-gray-50 text-[10px] font-black text-gray-400 border-b">
              <tr>
                <th className="px-8 py-6">Order id</th>
                <th className="px-8 py-6">Date</th>
                <th className="px-8 py-6">Patient</th>
                <th className="px-8 py-6">Address</th>
                <th className="px-8 py-6">Status</th>
                <th className="px-8 py-6 text-right">Amount</th>
                <th className="px-8 py-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td className="px-8 py-6"><div className="w-24 h-4 bg-slate-100 animate-pulse rounded-full" /></td>
                    <td className="px-8 py-6"><div className="w-20 h-4 bg-slate-100 animate-pulse rounded-full" /></td>
                    <td className="px-8 py-6"><div className="w-32 h-6 bg-slate-100 animate-pulse rounded-full" /></td>
                    <td className="px-8 py-6"><div className="w-48 h-4 bg-slate-50 animate-pulse rounded-full" /></td>
                    <td className="px-8 py-6"><div className="w-24 h-6 bg-slate-100 animate-pulse rounded-full" /></td>
                    <td className="px-8 py-6 text-right"><div className="w-16 h-4 bg-slate-100 animate-pulse rounded-full ml-auto" /></td>
                    <td className="px-8 py-6 text-right"><div className="w-8 h-8 bg-slate-50 animate-pulse rounded-lg ml-auto" /></td>
                  </tr>
                ))
              ) : (!Array.isArray(orders) || orders.length === 0) ? (<tr><td colSpan={7} className="p-20 text-center font-bold text-gray-400 text-[10px]">No orders found</td></tr>) : orders.map(order => (
                <tr key={order._id || order.id} className="hover:bg-gray-50/50">
                  <td className="px-8 py-6 font-black text-xs uppercase">{order.orderId}</td>
                  <td className="px-8 py-6 text-[10px] font-black">{safeFormat(order.orderDate, 'dd MMM yyyy HH:mm')}</td>
                  <td className="px-8 py-6"><p className="font-bold text-xs">{order.patientName}</p><p className="text-[10px] text-gray-400">{order.phoneNumber}</p></td>
                  <td className="px-8 py-6 max-w-[250px]">
                    <p className="text-[10px] font-bold text-gray-600 line-clamp-1 uppercase">
                      {order.shippingDetails?.houseNumber ? `${order.shippingDetails.houseNumber}, ` : ''}{order.shippingDetails?.street}
                    </p>
                    <p className="text-[9px] font-black text-primary opacity-60 uppercase tracking-tighter">
                      {order.shippingDetails?.city} - {order.shippingDetails?.pincode}
                    </p>
                  </td>
                  <td className="px-8 py-6">
                    <Badge className={cn("font-black text-[8px] whitespace-nowrap", 
                      order.status === 'Pending Pharmacist' ? "bg-orange-500 text-white shadow-sm" :
                      order.status === 'Pending Consult' ? "bg-emerald-100 text-emerald-600 border border-emerald-200" :
                      order.status === 'Confirmed' ? "bg-blue-100 text-blue-600" :
                      order.status === 'Shipped' ? "bg-purple-100 text-purple-600" :
                      order.status === 'Delivered' ? "bg-green-100 text-green-600" :
                      order.status === 'Returned' ? "bg-orange-100 text-orange-600" :
                      order.status === 'Cancelled' ? "bg-red-100 text-red-600" : "bg-gray-100"
                    )}>{order.status}</Badge>
                  </td>
                  <td className="px-8 py-6 text-right font-black text-xs">
                    ₹{Number(order.totalAmount || 0).toFixed(2)}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(order)}><Eye className="w-4 h-4 text-primary" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => { setSelectedOrder(order); setIsEditing(true); }}><Edit2 className="w-4 h-4 text-gray-300" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {!isLoading && totalPages > 1 && (
          <div className="px-8 py-6 bg-slate-50/50 border-t flex items-center justify-between">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Showing <span className="text-primary">{orders.length}</span> of <span className="text-primary">{totalOrders}</span> orders
            </p>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="rounded-full h-10 px-6 font-black text-[9px] uppercase tracking-widest gap-2"
              >
                Previous
              </Button>
              <div className="flex items-center gap-1 mx-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = page;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (page <= 3) pageNum = i + 1;
                  else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = page - 2 + i;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={cn(
                        "w-8 h-8 rounded-full text-[9px] font-black transition-all",
                        page === pageNum ? "bg-primary text-white" : "text-slate-400 hover:bg-slate-200"
                      )}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="rounded-full h-10 px-6 font-black text-[9px] uppercase tracking-widest gap-2"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Dialog open={!!selectedOrder} onOpenChange={o => !o && (setSelectedOrder(null), setIsEditing(false), setNextStatus(null))}>
        <DialogContent className="rounded-[40px] max-w-5xl border-none p-0 overflow-hidden">
          <DialogHeader className="bg-primary p-8 text-white flex flex-row items-center justify-between space-y-0">
            <div className="flex flex-col gap-1">
              <DialogTitle className="text-4xl font-black text-white">Order #{selectedOrder?.orderId || 'Detail'}</DialogTitle>
              <DialogDescription className="text-xs font-black text-white/60 tracking-widest uppercase">
                Full transaction history and logistics status
              </DialogDescription>
            </div>
            <Badge className="bg-white/20 text-white border-none font-black text-xs uppercase tracking-widest px-6 py-2 rounded-full">{selectedOrder?.status}</Badge>
          </DialogHeader>
          <div className="p-8 space-y-8 max-h-[80vh] overflow-y-auto scrollbar-hide">
            {isEditing ? (
              <div className="space-y-6">
                <h3 className="text-sm font-black">Update patient details</h3>
                <Input value={selectedOrder?.patientName} onChange={e => setSelectedOrder({...selectedOrder, patientName: e.target.value})} className="rounded-2xl h-14 bg-gray-50 border-none font-bold" />
                <Input value={selectedOrder?.phoneNumber} onChange={e => setSelectedOrder({...selectedOrder, phoneNumber: e.target.value})} className="rounded-2xl h-14 bg-gray-50 border-none font-bold" />
                <Button 
                  disabled={isUpdating}
                  onClick={() => updateOrderStatus(selectedOrder._id, selectedOrder.status, selectedOrder)} 
                  className="w-full h-16 rounded-full font-black bg-primary text-white shadow-xl transition-all active:scale-95 disabled:opacity-50"
                >
                  {isUpdating ? <Loader2 className="w-5 h-5 animate-spin mx-auto text-white" /> : "Save Changes"}
                </Button>
              </div>
            ) : nextStatus ? (
               <div className="space-y-6">
                 <h3 className="text-sm font-black">Finalize status: {nextStatus}</h3>
                 {(nextStatus === 'Shipped' || nextStatus === 'Returned') && (
                     <div className="space-y-4">
                       <div className="p-6 bg-primary/5 border-2 border-primary/20 rounded-2xl">
                         <p className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2">
                           <Package className="w-4 h-4" />
                           Shipway Shipping (Default Partner)
                         </p>
                         <p className="text-[9px] font-bold text-primary/60 mt-1 uppercase tracking-widest">
                           Automated AWB orchestration will trigger on confirmation
                         </p>
                       </div>
                       <Input placeholder="Manual AWB (Optional)" value={shippingInfo.awb} onChange={e => setShippingInfo({...shippingInfo, awb: e.target.value, partner: 'Shipway'})} className="rounded-2xl h-14 bg-gray-50 border-none font-bold" />
                     </div>
                 )}
                 {nextStatus === 'Cancelled' && (
                   <Textarea placeholder="Reason for cancellation" value={cancelReason} onChange={e => setCancelReason(e.target.value)} className="rounded-2xl min-h-[100px] bg-gray-50 border-none font-bold" />
                 )}
                 <Button 
                   disabled={isUpdating}
                   onClick={() => updateOrderStatus(selectedOrder._id, nextStatus, (nextStatus === 'Shipped' || nextStatus === 'Returned') ? { shipping: shippingInfo } : nextStatus === 'Cancelled' ? { cancellationReason: cancelReason } : {})} 
                   className="w-full h-16 rounded-full font-black bg-primary text-white shadow-xl transition-all active:scale-95 disabled:opacity-50"
                 >
                   {isUpdating ? <Loader2 className="w-5 h-5 animate-spin mx-auto text-white" /> : "Confirm update"}
                 </Button>
               </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-12">
                  <div><h4 className="text-xs font-black text-gray-400 mb-3 uppercase tracking-widest">Patient / Customer</h4><p className="font-black text-2xl tracking-tight">{selectedOrder?.patientName}</p><p className="text-base font-bold text-gray-500">{selectedOrder?.phoneNumber}</p></div>
                  <div>
                    <h4 className="text-xs font-black text-gray-400 mb-3 uppercase tracking-widest">Shipping Address</h4>
                    <p className="text-lg font-bold leading-relaxed uppercase">
                      {selectedOrder?.shippingDetails?.houseNumber ? `${selectedOrder.shippingDetails.houseNumber}, ` : ''}
                      {selectedOrder?.shippingDetails?.street}
                    </p>
                    <p className="text-sm font-black text-primary uppercase opacity-60">
                      {selectedOrder?.shippingDetails?.city} {selectedOrder?.shippingDetails?.pincode}
                    </p>
                  </div>
                </div>

                {((selectedOrder?.prescriptionUrls?.length > 0) || (selectedOrder?.doctorConsultation?.prescriptionLink)) && (
                  <div className="bg-emerald-50/50 p-6 rounded-[32px] border border-emerald-100 space-y-3">
                    <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                      <FileCheck className="w-4 h-4" /> Prescriptions
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {selectedOrder?.prescriptionUrls?.map((url: string, idx: number) => (
                        <a 
                          key={idx} 
                          href={url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3 bg-white rounded-2xl border border-emerald-100 text-[10px] font-black text-emerald-700 hover:bg-emerald-50 transition-all uppercase tracking-wider"
                        >
                          <span className="flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5" />
                            Prescription #{idx + 1}
                          </span>
                          <span className="text-[8px] bg-emerald-100 px-2 py-1 rounded-lg">VIEW FILE</span>
                        </a>
                      ))}
                      {selectedOrder?.doctorConsultation?.prescriptionLink && (
                         <a 
                          href={selectedOrder.doctorConsultation.prescriptionLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3 bg-white rounded-2xl border border-emerald-100 text-[10px] font-black text-emerald-700 hover:bg-emerald-50 transition-all uppercase tracking-wider"
                        >
                          <span className="flex items-center gap-2">
                            <Stethoscope className="w-3.5 h-3.5" />
                            Doctor Consult Link
                          </span>
                          <span className="text-[8px] bg-emerald-100 px-2 py-1 rounded-lg">OPEN LINK</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {selectedOrder?.timeline && selectedOrder.timeline.length > 0 && (
                  <div className="bg-slate-50 p-8 rounded-[40px] border border-slate-100 space-y-6">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Clock className="w-5 h-5 text-primary" /> Order Track History
                    </h4>
                    <div className="space-y-6">
                      {selectedOrder.timeline.map((entry: any, idx: number) => (
                        <div key={idx} className="flex gap-6 items-start relative">
                          {idx !== selectedOrder.timeline.length - 1 && (
                            <div className="absolute left-[15px] top-8 -bottom-6 w-0.5 bg-slate-200" />
                          )}
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-4 border-white shadow-md",
                            idx === selectedOrder.timeline.length - 1 ? "bg-primary text-white scale-110" : "bg-slate-200 text-slate-500"
                          )}>
                            <div className="w-2 h-2 rounded-full bg-current" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className={cn("text-sm font-black uppercase tracking-tight", 
                                idx === selectedOrder.timeline.length - 1 ? "text-primary" : "text-slate-600"
                              )}>
                                {entry.status}
                              </p>
                              <p className="text-[10px] font-black text-slate-400 uppercase whitespace-nowrap">
                                {safeFormat(entry.timestamp, 'HH:mm | dd MMM')}
                              </p>
                            </div>
                            <p className="text-xs font-bold text-slate-400 mt-1">{entry.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 p-8 rounded-[40px] border space-y-6">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Order Processing Pipeline</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedOrder?.status === 'Pending Pharmacist' ? (
                      <>
                        <Button 
                          disabled={isUpdating}
                          onClick={() => updateOrderStatus(selectedOrder._id, 'Confirmed', { action: 'pharmacist_accept' })}
                          className="col-span-2 rounded-[32px] h-24 bg-emerald-600 text-white font-black text-xl uppercase tracking-widest hover:bg-emerald-700 shadow-2xl shadow-emerald-100 gap-4"
                        >
                           <CheckCircle className="w-8 h-8" /> Pharmacist Accept
                        </Button>
                        <Button 
                          disabled={isUpdating}
                          onClick={() => updateOrderStatus(selectedOrder._id, 'Pending Consult', { action: 'pharmacist_consult_req' })}
                          className="rounded-[32px] h-20 bg-blue-500 text-white font-black text-xs uppercase tracking-widest hover:bg-blue-600 shadow-xl"
                        >
                           <Stethoscope className="w-5 h-5 mr-3" /> Consult Req
                        </Button>
                        <Button 
                          disabled={isUpdating}
                          onClick={() => updateOrderStatus(selectedOrder._id, 'Cancelled', { action: 'pharmacist_reject' })}
                          className="rounded-[32px] h-20 bg-red-50 text-red-500 font-black text-xs uppercase tracking-widest hover:bg-red-100 border-4 border-red-100"
                        >
                           <X className="w-5 h-5 mr-3" /> Reject
                        </Button>
                      </>
                    ) : selectedOrder?.status === 'Pending Consult' ? (
                      <div className="col-span-2 space-y-4">
                        <div className="grid grid-cols-1 gap-3">
                           <Input 
                            placeholder="Paste Prescription Link (Google Drive/S3)" 
                            value={shippingInfo.awb} // Reuse awb state temporarily or use new one
                            onChange={e => setShippingInfo({...shippingInfo, awb: e.target.value})} 
                            className="rounded-[32px] h-20 bg-white border-4 border-slate-100 font-bold text-base px-8" 
                          />
                          <Button 
                            disabled={isUpdating}
                            onClick={() => updateOrderStatus(selectedOrder._id, 'Confirmed', { 
                              action: 'doctor_submit_rx', 
                              prescriptionLink: shippingInfo.awb 
                            })}
                            className="rounded-[32px] h-24 bg-primary text-white font-black text-lg uppercase tracking-widest hover:bg-primary/90 shadow-2xl shadow-primary/10 gap-4"
                          >
                             <FileCheck className="w-8 h-8" /> Submit Doctor RX
                          </Button>
                        </div>
                      </div>
                    ) : (
                      ['Packing', 'Packed', 'Shipped', 'Delivered', 'Returned', 'Cancelled'].map(s => (
                        <Button key={s} variant="outline" onClick={() => setNextStatus(s)} className={cn("rounded-[32px] h-20 font-black text-xs border-4 uppercase tracking-widest", selectedOrder?.status === s ? "border-primary bg-primary/5 text-primary shadow-lg" : "text-gray-400 border-slate-100 hover:bg-white")}>{s}</Button>
                      ))
                    )}
                  </div>
                </div>
                <div className="bg-gray-50 p-8 rounded-[40px] border-2 space-y-6">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Medicine & Item Summary</h4>
                  {selectedOrder?.items?.map((it: any, i: number) => (
                    <div key={i} className="flex justify-between items-center bg-white p-5 rounded-3xl border-2 border-slate-100 shadow-sm">
                      <div className="space-y-1">
                        <p className="text-base font-black uppercase text-slate-800">{it.name}</p>
                        <p className="text-xs font-bold text-slate-400 uppercase">Quantity: {it.quantity} × ₹{it.unitPrice}</p>
                      </div>
                      <span className="font-black text-xl">₹{(it.unitPrice * it.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  
                  <div className="pt-8 space-y-4 border-t-4 border-slate-200 border-dashed mt-6">
                    <div className="flex justify-between items-center text-xs font-black text-slate-400 uppercase tracking-widest">
                      <span>Gross MRP</span>
                      <span>₹{Number(selectedOrder?.billingBreakdown?.grossMrp || selectedOrder?.totalAmount).toFixed(2)}</span>
                    </div>
                    {selectedOrder?.billingBreakdown?.campaignDiscount && (
                      <div className="flex justify-between items-center text-xs font-black text-emerald-500 uppercase tracking-widest">
                        <span>Campaign Saving</span>
                        <span>-₹{Number(selectedOrder.billingBreakdown.campaignDiscount).toFixed(2)}</span>
                      </div>
                    )}
                    {selectedOrder?.billingBreakdown?.deliveryFees && (
                      <div className="flex justify-between items-center text-xs font-black text-slate-400 uppercase tracking-widest">
                        <span>Fulfillment Fees</span>
                        <span>₹{Number(selectedOrder.billingBreakdown.deliveryFees).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center font-black text-primary pt-6 border-t-4 border-primary/20">
                      <span className="text-sm uppercase tracking-[0.3em]">Total Net Payable</span>
                      <span className="text-5xl font-outfit tracking-tighter">₹{Number(selectedOrder?.totalAmount || 0).toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => handlePrint(selectedOrder)}
                    className="w-full h-24 rounded-[32px] bg-slate-900 border-8 border-white text-white font-black text-lg uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-2xl mt-8"
                  >
                    Print Order Summary (Invoice)
                  </Button>
                  
                  {selectedOrder?.shipping?.awb && !selectedOrder?.shipping?.labelUrl && (
                    <Button 
                      disabled={isUpdating}
                      onClick={() => updateOrderStatus(selectedOrder._id, selectedOrder.status, { action: 'manifest_order' })}
                      className="w-full h-20 rounded-[32px] bg-emerald-600 border-8 border-white text-white font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-2xl mt-4"
                    >
                      <FileText className="w-6 h-6 mr-3" /> Generate Shipping Label
                    </Button>
                  )}
                  
                  {selectedOrder?.shipping?.labelUrl && (
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => window.open(selectedOrder.shipping.labelUrl, '_blank')}
                        variant="outline"
                        className="flex-1 h-14 rounded-2xl border-4 text-primary font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl mt-2"
                      >
                        <Package className="w-4 h-4 mr-2" />
                        Print Label
                      </Button>
                      <Button 
                        onClick={() => updateOrderStatus(selectedOrder._id, selectedOrder.status, { action: 'cancel_shipment', isReturn: false })}
                        variant="outline"
                        className="w-14 h-14 rounded-2xl border-4 border-red-100 text-red-500 font-black text-[10px] uppercase hover:bg-red-50 active:scale-95 transition-all shadow-xl mt-2"
                        title="Cancel Forward AWB"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  {selectedOrder?.returnShipping?.labelUrl && (
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => window.open(selectedOrder.returnShipping.labelUrl, '_blank')}
                        variant="outline"
                        className="flex-1 h-14 rounded-2xl border-4 text-orange-500 border-orange-100 font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl mt-2"
                      >
                        <Package className="w-4 h-4 mr-2" />
                        Print Return Label
                      </Button>
                      <Button 
                        onClick={() => updateOrderStatus(selectedOrder._id, selectedOrder.status, { action: 'cancel_shipment', isReturn: true })}
                        variant="outline"
                        className="w-14 h-14 rounded-2xl border-4 border-red-100 text-red-500 font-black text-[10px] uppercase hover:bg-red-50 active:scale-95 transition-all shadow-xl mt-2"
                        title="Cancel Return AWB"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  
                  <div className="pt-8 border-t border-dashed border-slate-200 mt-8">
                    <Button 
                      variant="ghost" 
                      disabled={isUpdating}
                      onClick={() => handleDeleteOrder(selectedOrder._id)}
                      className="w-full h-12 rounded-xl text-rose-500 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-rose-50 hover:text-rose-600 gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Hard Delete Order
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
