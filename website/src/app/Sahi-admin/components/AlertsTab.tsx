"use client"

import { useState, useEffect, useMemo } from 'react';
import { 
  Loader2, 
  Zap,
  Download,
  Calendar,
  Smartphone,
  Globe,
  User,
  Clock,
  MapPin,
  ArrowUpDown,
  Filter
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SectionHeader } from './SectionHeader';
import { useToast } from '@/hooks/use-toast';
import { formatInIST, cn } from '@/lib/utils';

export function AlertsTab({ db, isVerified, onBack }: { db: any, isVerified: boolean, onBack: () => void }) {
  const { toast } = useToast();
  const [stockAlerts, setStockAlerts] = useState<any[]>([]);
  const [detailedAlerts, setDetailedAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'summary' | 'detailed'>('detailed');
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const url = new URL('/api/inventory/alerts', window.location.origin);
      if (viewMode === 'detailed') {
        url.searchParams.set('detailed', 'true');
        if (startDate) url.searchParams.set('startDate', startDate);
        if (endDate) url.searchParams.set('endDate', endDate);
      }
      
      const res = await fetch(url.toString(), { cache: 'no-store' }); 
      if (!res.ok) {
         const errData = await res.json().catch(() => ({}));
         throw new Error(errData.error || `Server Error: ${res.status}`);
      }
      const data = await res.json();
      if (viewMode === 'detailed') {
        setDetailedAlerts(Array.isArray(data) ? data : []);
      } else {
        setStockAlerts(Array.isArray(data) ? data : []);
      }
    } catch (err: any) {
      console.error(err);
      toast({ variant: 'destructive', title: "Fetch Failed", description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [viewMode, startDate, endDate]);

  const exportToCSV = () => {
    const data = detailedAlerts;
    if (!data.length) return;

    const headers = ["Date (IST)", "Customer", "Phone", "Product", "Manufacturer", "Pincode", "Platform"];
    const rows = data.map(item => [
      formatInIST(item.createdAt),
      item.userName || "Anonymous",
      item.userPhone || "N/A",
      item.product?.name || "Unknown",
      item.product?.manufacturer || "N/A",
      item.pincode || "N/A",
      (item.platform || "Web").toUpperCase()
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `stock_alerts_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2">
      <SectionHeader title="Inventory alerts" subtitle="Inventory Requested by Customers" onBack={onBack}>
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-100 p-1 rounded-full border border-slate-200">
            <button 
              onClick={() => setViewMode('summary')}
              className={cn(
                "px-4 py-2 rounded-full font-black text-[8px] uppercase tracking-widest transition-all",
                viewMode === 'summary' ? "bg-white shadow-sm text-primary" : "text-slate-400 hover:text-slate-600"
              )}
            >Summary</button>
            <button 
              onClick={() => setViewMode('detailed')}
              className={cn(
                "px-4 py-2 rounded-full font-black text-[8px] uppercase tracking-widest transition-all",
                viewMode === 'detailed' ? "bg-white shadow-sm text-primary" : "text-slate-400 hover:text-slate-600"
              )}
            >Detailed</button>
          </div>
          <Button 
            onClick={exportToCSV}
            disabled={detailedAlerts.length === 0}
            variant="outline" 
            className="rounded-full h-12 px-8 font-black text-[10px] border-2 uppercase tracking-widest gap-2"
          >
            <Download className="w-4 h-4" />
            Generate report
          </Button>
        </div>
      </SectionHeader>

      {/* Filters */}
      <Card className="rounded-[32px] border-none shadow-sm bg-white p-6 mb-8">
        <div className="flex flex-col md:flex-row items-end gap-6">
          <div className="space-y-2 flex-1 w-full">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Calendar className="w-3 h-3" /> Start Date
            </label>
            <input 
              type="date" 
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full h-14 rounded-2xl bg-slate-50 border-none px-6 font-black text-xs focus:ring-2 focus:ring-primary/20 transition-all outline-none" 
            />
          </div>
          <div className="space-y-2 flex-1 w-full">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Calendar className="w-3 h-3" /> End Date
            </label>
            <input 
              type="date" 
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full h-14 rounded-2xl bg-slate-50 border-none px-6 font-black text-xs focus:ring-2 focus:ring-primary/20 transition-all outline-none" 
            />
          </div>
          <Button 
            onClick={() => { setStartDate(''); setEndDate(''); }}
            variant="ghost"
            className="h-14 px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-primary"
          >Reset</Button>
        </div>
      </Card>
      
      {isLoading ? (
        <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></div>
      ) : viewMode === 'summary' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stockAlerts.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-white rounded-[40px] shadow-sm">
              <Zap className="w-12 h-12 text-green-100 mx-auto mb-4" />
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">No customer requests found</p>
            </div>
          ) : stockAlerts.map(item => (
            <Card key={item._id} className="rounded-[40px] border-none shadow-sm bg-white p-8 relative overflow-hidden group hover:shadow-xl transition-all duration-500">
              <div className="absolute top-0 left-0 w-2 h-full bg-primary" />
              <div className="flex justify-between items-start mb-6">
                <Badge className="bg-primary/10 text-primary border-none font-black text-[8px] uppercase tracking-widest">Customer Ask</Badge>
                <span className="font-black text-xl text-primary font-outfit">{item.count || 0} REQ</span>
              </div>
              <h3 className="font-black text-sm mb-2 truncate font-outfit uppercase tracking-tight">{item.product?.name || 'Unknown Product'}</h3>
              <p className="text-[10px] font-bold text-slate-400 mb-6 uppercase tracking-widest">{item.product?.manufacturer || item.product?.brand || 'N/A'}</p>
              <div className="flex justify-between items-center mt-auto pt-6 border-t border-slate-50">
                 <div className="space-y-0.5">
                   <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Available</p>
                   <p className="text-xs font-black text-slate-600">{item.product?.availableQuantity || 0}</p>
                 </div>
                 <Button className="rounded-full h-10 px-6 font-black text-[9px] bg-slate-900 hover:bg-primary text-white transition-all uppercase tracking-widest">Update Stock</Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="rounded-[40px] border-none shadow-sm bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Timestamp (IST)</th>
                  <th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Customer</th>
                  <th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Product</th>
                  <th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Region</th>
                  <th className="px-8 py-6 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Platform</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {detailedAlerts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                       <Zap className="w-8 h-8 text-slate-100 mx-auto mb-4" />
                       <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No detailed logs available</p>
                    </td>
                  </tr>
                ) : detailedAlerts.map(item => (
                  <tr key={item._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                          <Clock className="w-4 h-4" />
                        </div>
                        <span className="text-[11px] font-black text-slate-600 uppercase tabular-nums">
                          {formatInIST(item.createdAt)}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{item.userName || "Anonymous"}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          {item.userPhone || "N/A"}
                        </p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1 max-w-[250px]">
                        <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight truncate">{item.product?.name || "Unknown"}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">{item.product?.manufacturer || "N/A"}</p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <Badge className="bg-slate-50 text-slate-500 border-none font-black text-[9px] uppercase tracking-widest px-3 py-1 gap-1.5">
                        <MapPin className="w-3 h-3" />
                        {item.pincode || "Generic"}
                      </Badge>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        {item.platform === 'app' ? (
                          <div className="flex items-center gap-2 text-primary font-black text-[9px] uppercase tracking-widest">
                            <Smartphone className="w-3.5 h-3.5" />
                            Mobile App
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-slate-400 font-black text-[9px] uppercase tracking-widest">
                            <Globe className="w-3.5 h-3.5" />
                            Website
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
