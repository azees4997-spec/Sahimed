"use client"

import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Download, 
  Calendar, 
  Search, 
  User as UserIcon, 
  Smartphone,
  ChevronLeft,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SectionHeader } from './SectionHeader';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';
import { useUser } from '@/firebase';

export function SearchAnalyticsTab({ onBack }: { onBack: () => void }) {
  const { toast } = useToast();
  const { user } = useUser();
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });

  const fetchLogs = async () => {
    if (!user) return; // Wait for authentication
    setIsLoading(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch(`/api/analytics/search?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`, {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      if (!res.ok) throw new Error("Verification Failed");
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      toast({ variant: 'destructive', title: "Insight Error", description: "Could not retrieve clinical trends." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchLogs();
    }
  }, [dateRange, user]);

  const downloadCSV = () => {
    if (logs.length === 0) return;
    
    const headers = ["Mobile", "Keyword", "Timestamp"];
    const csvContent = [
      headers.join(","),
      ...logs.map(log => `"${log.mobile}","${(log.keyword || '').replace(/"/g, '""')}","${log.timestamp ? format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss') : 'N/A'}"`)
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Sahimed_SearchInsights_${dateRange.startDate}_to_${dateRange.endDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({ title: "Report Exported", description: "Search matrix is ready for analysis." });
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <SectionHeader title="Clinical Interest Engine" subtitle="Direct Customer Search Analytics" onBack={onBack}>
        <Button onClick={downloadCSV} disabled={logs.length === 0} className="rounded-full h-14 px-10 font-black text-[10px] bg-primary text-white shadow-2xl shadow-primary/30 uppercase tracking-widest hover:scale-105 transition-all border-4 border-white active:scale-95 disabled:opacity-50">
          <Download className="w-5 h-5 mr-3" /> Export Matrix
        </Button>
      </SectionHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <Card className="md:col-span-1 p-8 rounded-[44px] bg-white border-none shadow-xl flex flex-col gap-6 h-fit sticky top-24">
          <div className="flex flex-col gap-1.5">
            <h3 className="text-sm font-black uppercase tracking-tighter text-slate-900">Filter Range</h3>
            <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Temporal window selection</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Start Protocol</Label>
              <Input type="date" value={dateRange.startDate} onChange={e => setDateRange({...dateRange, startDate: e.target.value})} className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-xs" />
            </div>
            <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">End Protocol</Label>
              <Input type="date" value={dateRange.endDate} onChange={e => setDateRange({...dateRange, endDate: e.target.value})} className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-xs" />
            </div>
          </div>

          <Button onClick={fetchLogs} variant="ghost" className="w-full h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest text-primary bg-primary/5 hover:bg-primary/10 transition-all gap-3 border border-primary/20">
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} /> Update Stream
          </Button>
        </Card>

        <Card className="md:col-span-3 p-0 rounded-[44px] bg-white border-none shadow-xl overflow-hidden min-h-[600px] flex flex-col">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-fuchsia-50 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-fuchsia-600" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-xs uppercase tracking-tight text-slate-900">Log Matrix</span>
                <span className="text-[10px] font-bold text-slate-400 tracking-widest">REAL-TIME INGESTION FEED</span>
              </div>
            </div>
            <div className="px-4 py-2 rounded-full bg-slate-50 border border-slate-100 font-black text-[10px] text-slate-500 uppercase tracking-widest">
              {logs.length} Data Points
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Identity (Mobile)</th>
                  <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Keyword (Search)</th>
                  <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={3} className="px-8 py-6"><div className="h-4 bg-slate-100 rounded-lg w-full" /></td>
                    </tr>
                  ))
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-20">
                        <Search className="w-16 h-16" />
                        <p className="font-black text-xs uppercase tracking-[0.3em]">No activity detected in window</p>
                      </div>
                    </td>
                  </tr>
                ) : logs.map((log) => (
                  <tr key={log._id} className="group hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-white transition-colors">
                          <Smartphone className="w-4 h-4 text-slate-400" />
                        </div>
                        <span className="font-bold text-xs text-slate-700 tracking-tight">{log.mobile}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-primary/5 text-primary border-primary/20 uppercase">
                          {log.keyword}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-right">
                        <span className="font-bold text-xs text-slate-500">
                          {(() => {
                            if (!log.timestamp) return 'N/A';
                            try {
                              const d = new Date(log.timestamp);
                              return isNaN(d.getTime()) ? 'N/A' : format(d, 'MMM dd, yyyy');
                            } catch (e) { return 'N/A'; }
                          })()}
                        </span>
                        <span className="text-[10px] font-medium text-slate-300">
                          {(() => {
                            if (!log.timestamp) return '';
                            try {
                              const d = new Date(log.timestamp);
                              return isNaN(d.getTime()) ? '' : format(d, 'HH:mm:ss');
                            } catch (e) { return ''; }
                          })()}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <span className={cn("px-3 py-1 rounded-lg text-[10px] font-black tracking-widest border", className)}>
      {children}
    </span>
  );
}
