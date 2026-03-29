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

  const updateOrderStatus = async (id: string, newStatus: string, extra = {}) => {
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
      if (res.ok) {
        toast({ title: `Order ${newStatus}` });
        fetchOrders();
        setStatusUpdateTarget(null);
        setSelectedOrder(null);
      }
    } catch (err) {
      toast({ variant: 'destructive', title: "Update failed" });
    }
  };

  const handleExport = () => {
    if (!orders || orders.length === 0) return;
    const headers = ["Order ID", "Order Date", "Patient Name", "Phone", "Street", "Status", "Grand Total"];
    const rows = orders.map(order => [
      order.orderId, 
      format(new Date(order.orderDate), 'yyyy-MM-dd HH:mm'), 
      order.patientName, 
      order.phoneNumber, 
      `"${(order.shippingDetails?.street || '').replace(/"/g, '""')}"`, 
      order.status, 
      order.totalAmount
    ].join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_${format(new Date(), 'yyyyMMdd')}.csv`;
    a.click();
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
                  <td className="px-8 py-6 max-w-[250px]"><p className="text-[10px] font-bold text-gray-600 truncate">{order.shippingDetails?.street}</p></td>
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
                <Button onClick={() => updateOrderStatus(selectedOrder._id, selectedOrder.status, selectedOrder)} className="w-full h-16 rounded-full font-black bg-primary text-white">Save Changes</Button>
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
                 <Button onClick={() => updateOrderStatus(selectedOrder._id, statusUpdateTarget, statusUpdateTarget === 'Shipped' ? { shipping: shippingInfo } : statusUpdateTarget === 'Cancelled' ? { cancellationReason: cancelReason } : {})} className="w-full h-16 rounded-full font-black bg-primary text-white shadow-xl">Confirm update</Button>
               </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-8">
                  <div><h4 className="text-[10px] font-black text-gray-400 mb-2">Patient</h4><p className="font-black text-sm">{selectedOrder?.patientName}</p><p className="text-xs text-gray-500">{selectedOrder?.phoneNumber}</p></div>
                  <div><h4 className="text-[10px] font-black text-gray-400 mb-2">Address</h4><p className="text-[11px] font-bold leading-relaxed">{selectedOrder?.shippingDetails?.street}</p></div>
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
                  {selectedOrder?.items?.map((it: any, i: number) => (<div key={i} className="flex justify-between items-center"><p className="text-[11px] font-black">{it.name} x {it.quantity}</p><span className="font-black text-xs">₹{(it.unitPrice * it.quantity).toFixed(2)}</span></div>))}
                  <div className="pt-4 border-t flex justify-between items-center font-black text-primary"><span>Total Amount</span><span className="text-xl">₹{Number(selectedOrder?.totalAmount || 0).toFixed(2)}</span></div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
