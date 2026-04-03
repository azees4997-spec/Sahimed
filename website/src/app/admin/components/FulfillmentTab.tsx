"use client"

import { useState, useEffect } from 'react';
import { 
  Loader2, 
  Download, 
  Eye, 
  Edit2 
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
import { format } from "date-fns";
import { useUser } from '@/firebase';
import { SectionHeader } from './SectionHeader';

export function FulfillmentTab({ db, isVerified, onBack }: { db: any, isVerified: boolean, onBack: () => void }) {
  const [statusFilter, setStatusFilter] = useState('All');
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useUser();
  const { toast } = useToast();

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/orders?status=${statusFilter === 'All' ? '' : statusFilter}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setOrders(data);
      } else {
        console.error("Orders API returned non-array:", data);
        setOrders([]);
      }
    } catch (err) {
      toast({ variant: 'destructive', title: "Fetch failed" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [statusFilter]);

  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [statusUpdateTarget, setStatusUpdateTarget] = useState<any>(null);
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
        toast({ title: `Order ${newStatus}`, description: "Status successfully updated in clinical matrix." });
        await fetchOrders();
        setStatusUpdateTarget(null);
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

  const handleExport = () => {
    if (!orders || orders.length === 0) return;
    const headers = ["Order ID", "Date", "Patient Name", "Phone", "Address", "City", "PIN", "Items", "MRP", "Discount", "Fees", "Net Amount", "Status"];
    const rows = orders.map(order => {
      const itemsStr = (order.items || []).map((it: any) => `${it.name} x${it.quantity}`).join(" | ");
      const fullAddr = `${order.shippingDetails?.houseNumber ? order.shippingDetails.houseNumber + ', ' : ''}${order.shippingDetails?.street || ''}`;
      
      return [
        order.orderId, 
        format(new Date(order.orderDate), 'yyyy-MM-dd HH:mm'), 
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
    a.download = `orders_${format(new Date(), 'yyyyMMdd')}.csv`;
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
            <div class="branding"><h1>Sahi<span>Med</span></h1><p style="margin: 4px 0 0; font-weight: 800; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #666;">Clinical Fulfillment Hub</p></div>
            <div class="order-meta">
              <div style="font-weight: 900; font-size: 18px;">ORDER #${order.orderId}</div>
              <div style="font-weight: 600; font-size: 12px; color: #666;">DATE: ${format(new Date(order.orderDate), 'dd MMM yyyy HH:mm')}</div>
            </div>
          </div>
          <div style="display: flex; gap: 60px; margin-bottom: 40px;">
            <div style="flex: 1;">
              <div class="section-title">Patient / Recipient</div>
              <div style="font-weight: 800; font-size: 16px;">${order.patientName}</div>
              <div style="font-weight: 600; color: #444;">${order.phoneNumber}</div>
            </div>
            <div style="flex: 1;">
              <div class="section-title">Delivery Matrix</div>
              <div style="font-weight: 700; font-size: 13px; line-height: 1.4;">
                ${order.shippingDetails?.houseNumber ? order.shippingDetails.houseNumber + '<br>' : ''}
                ${order.shippingDetails?.street || ''}<br>
                ${order.shippingDetails?.city || ''}, ${order.shippingDetails?.state || ''} - ${order.shippingDetails?.pincode || ''}
              </div>
            </div>
          </div>
          <div class="section-title">Inventory Provisioning</div>
          <div style="margin-bottom: 40px;">${itemsHtml}</div>
          <div style="max-width: 400px; margin-left: auto;">
             <div class="total-row"><span>Gross MRP</span><span>₹${Number(order.billingBreakdown?.grossMrp || order.totalAmount).toFixed(2)}</span></div>
             <div class="total-row" style="color: #059669;"><span>Campaign Savings</span><span>-₹${Number(order.billingBreakdown?.campaignDiscount || 0).toFixed(2)}</span></div>
             <div class="total-row"><span>Delivery Fees</span><span>₹${Number(order.billingBreakdown?.deliveryFees || 0).toFixed(2)}</span></div>
             <div class="total-row grand-total"><span>Net Paid</span><span>₹${Number(order.totalAmount).toFixed(2)}</span></div>
          </div>
          <div style="margin-top: 80px; text-align: center; border-top: 1px dashed #ccc; padding-top: 20px; font-size: 10px; font-weight: 700; color: #999; text-transform: uppercase; letter-spacing: 2px;">
            Authorized clinical signature required for Schedule H1 drugs fulfillment
          </div>
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-10">
      <SectionHeader title="Fulfillment Matrix" subtitle="Operational Logistics Monitoring" onBack={onBack}>
        <Button onClick={handleExport} variant="outline" className="rounded-full h-14 px-8 font-black text-[10px] border-2 gap-3 uppercase tracking-widest hover:bg-white transition-all active:scale-95">
          <Download className="w-4 h-4" /> Export Ledger
        </Button>
      </SectionHeader>

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
        <div className="bg-white/60 backdrop-blur-md p-1.5 rounded-full border border-white shadow-xl flex w-fit gap-1.5 overflow-x-auto no-scrollbar">
          {['All', 'Confirmed', 'Packing', 'Shipped', 'Delivered', 'Cancelled'].map((status) => (
            <button key={status} onClick={() => setStatusFilter(status)} className={cn("px-8 py-3.5 rounded-full text-[9px] font-black tracking-[0.2em] transition-all uppercase whitespace-nowrap", statusFilter === status ? "bg-primary text-white shadow-lg shadow-primary/30" : "text-slate-400 hover:bg-white/80")}>{status}</button>
          ))}
        </div>
      </div>
      
      <Card className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[1000px]">
            <thead className="bg-gray-50 text-[10px] font-black text-gray-400 border-b">
              <tr><th className="px-8 py-6">Order id</th><th className="px-8 py-6">Date</th><th className="px-8 py-6">Patient</th><th className="px-8 py-6">Address</th><th className="px-8 py-6">Amount</th><th className="px-8 py-6 text-right">Action</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (<tr><td colSpan={6} className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></td></tr>) : (!Array.isArray(orders) || orders.length === 0) ? (<tr><td colSpan={6} className="p-20 text-center font-bold text-gray-400 text-[10px]">No orders found</td></tr>) : orders.map(order => (
                <tr key={order._id || order.id} className="hover:bg-gray-50/50">
                  <td className="px-8 py-6 font-black text-xs uppercase">{order.orderId}</td>
                  <td className="px-8 py-6 text-[10px] font-black">{format(new Date(order.orderDate), 'dd MMM yyyy')}</td>
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
                    <Badge className={cn("font-black text-[8px]", 
                      order.status === 'Confirmed' ? "bg-blue-100 text-blue-600" :
                      order.status === 'Shipped' ? "bg-purple-100 text-purple-600" :
                      order.status === 'Delivered' ? "bg-green-100 text-green-600" :
                      order.status === 'Cancelled' ? "bg-red-100 text-red-600" : "bg-gray-100"
                    )}>{order.status}</Badge>
                  </td>
                  <td className="px-8 py-6 text-right"><div className="flex justify-end gap-2"><Button variant="ghost" size="icon" onClick={() => setSelectedOrder(order)}><Eye className="w-4 h-4 text-primary" /></Button><Button variant="ghost" size="icon" onClick={() => { setSelectedOrder(order); setIsEditing(true); }}><Edit2 className="w-4 h-4 text-gray-300" /></Button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={!!selectedOrder} onOpenChange={o => !o && (setSelectedOrder(null), setIsEditing(false), setStatusUpdateTarget(null))}>
        <DialogContent className="rounded-[40px] max-w-2xl border-none p-0 overflow-hidden">
          <div className="bg-primary p-8 text-white flex justify-between items-center">
            <DialogTitle className="text-2xl font-black">Order #{selectedOrder?.orderId}</DialogTitle>
            <DialogDescription className="text-[10px] font-black text-white/60 tracking-widest mt-1 uppercase">
              Full transaction history and logistics status
            </DialogDescription>
            <Badge className="bg-white/20 text-white border-none font-black text-[10px]">{selectedOrder?.status}</Badge>
          </div>
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
            ) : statusUpdateTarget ? (
               <div className="space-y-6">
                 <h3 className="text-sm font-black">Finalize status: {statusUpdateTarget}</h3>
                 {statusUpdateTarget === 'Shipped' && (
                   <div className="space-y-4">
                     <Select onValueChange={v => setShippingInfo({...shippingInfo, partner: v})}>
                       <SelectTrigger className="rounded-2xl h-14 bg-gray-50 border-none font-bold"><SelectValue placeholder="Select partner" /></SelectTrigger>
                       <SelectContent><SelectItem value="Delhivery">Delhivery</SelectItem><SelectItem value="BlueDart">BlueDart</SelectItem><SelectItem value="Post">India Post</SelectItem></SelectContent>
                     </Select>
                     <Input placeholder="AWB Number" value={shippingInfo.awb} onChange={e => setShippingInfo({...shippingInfo, awb: e.target.value})} className="rounded-2xl h-14 bg-gray-50 border-none font-bold" />
                   </div>
                 )}
                 {statusUpdateTarget === 'Cancelled' && (
                   <Textarea placeholder="Reason for cancellation" value={cancelReason} onChange={e => setCancelReason(e.target.value)} className="rounded-2xl min-h-[100px] bg-gray-50 border-none font-bold" />
                 )}
                 <Button 
                   disabled={isUpdating}
                   onClick={() => updateOrderStatus(selectedOrder._id, statusUpdateTarget, statusUpdateTarget === 'Shipped' ? { shipping: shippingInfo } : statusUpdateTarget === 'Cancelled' ? { cancellationReason: cancelReason } : {})} 
                   className="w-full h-16 rounded-full font-black bg-primary text-white shadow-xl transition-all active:scale-95 disabled:opacity-50"
                 >
                   {isUpdating ? <Loader2 className="w-5 h-5 animate-spin mx-auto text-white" /> : "Confirm update"}
                 </Button>
               </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-8">
                  <div><h4 className="text-[10px] font-black text-gray-400 mb-2">Patient</h4><p className="font-black text-sm">{selectedOrder?.patientName}</p><p className="text-xs text-gray-500">{selectedOrder?.phoneNumber}</p></div>
                  <div>
                    <h4 className="text-[10px] font-black text-gray-400 mb-2">Delivery Matrix</h4>
                    <p className="text-[11px] font-bold leading-relaxed uppercase">
                      {selectedOrder?.shippingDetails?.houseNumber ? `${selectedOrder.shippingDetails.houseNumber}, ` : ''}
                      {selectedOrder?.shippingDetails?.street}
                    </p>
                    <p className="text-[10px] font-black text-primary uppercase opacity-60">
                      {selectedOrder?.shippingDetails?.city} {selectedOrder?.shippingDetails?.pincode}
                    </p>
                  </div>
                </div>
                <div className="bg-gray-50 p-6 rounded-[32px] border space-y-4">
                  <h4 className="text-[10px] font-black text-gray-400">Status Migration</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {['Packing', 'Packed', 'Shipped', 'Delivered', 'Cancelled'].map(s => (
                      <Button key={s} variant="outline" onClick={() => setStatusUpdateTarget(s)} className={cn("rounded-2xl h-12 font-black text-[10px] border-2", selectedOrder?.status === s ? "border-primary bg-primary/5 text-primary" : "text-gray-400")}>{s}</Button>
                    ))}
                  </div>
                </div>
                <div className="bg-gray-50 p-6 rounded-[32px] border space-y-4">
                  <h4 className="text-[10px] font-black text-gray-400">Order Items</h4>
                  {selectedOrder?.items?.map((it: any, i: number) => (
                    <div key={i} className="flex justify-between items-center bg-white p-3 rounded-2xl border border-slate-100">
                      <div className="space-y-0.5">
                        <p className="text-[11px] font-black uppercase text-slate-800">{it.name}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Qty: {it.quantity} × ₹{it.unitPrice}</p>
                      </div>
                      <span className="font-black text-xs">₹{(it.unitPrice * it.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  
                  <div className="pt-4 space-y-2 border-t mt-4">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <span>Gross MRP</span>
                      <span>₹{Number(selectedOrder?.billingBreakdown?.grossMrp || selectedOrder?.totalAmount).toFixed(2)}</span>
                    </div>
                    {selectedOrder?.billingBreakdown?.campaignDiscount && (
                      <div className="flex justify-between items-center text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                        <span>Campaign Saving</span>
                        <span>-₹{Number(selectedOrder.billingBreakdown.campaignDiscount).toFixed(2)}</span>
                      </div>
                    )}
                    {selectedOrder?.billingBreakdown?.deliveryFees && (
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <span>Fulfillment Fees</span>
                        <span>₹{Number(selectedOrder.billingBreakdown.deliveryFees).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center font-black text-primary pt-2 border-t border-dashed">
                      <span className="text-[10px] uppercase tracking-widest">Net Payable</span>
                      <span className="text-xl">₹{Number(selectedOrder?.totalAmount || 0).toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => handlePrint(selectedOrder)}
                    className="w-full h-14 rounded-2xl bg-slate-900 border-4 border-white text-white font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl mt-4"
                  >
                    Print Protocol Order
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
