"use client"

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  BarChart3, 
  Download, 
  Search, 
  Smartphone,
  Loader2,
  RefreshCw,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SectionHeader } from './SectionHeader';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format, subDays } from 'date-fns';
import { useUser } from '@/firebase';
import { safeFormat } from '@/lib/safe-date';

const MAX_RETRIES = 5;
const HEARTBEAT_INTERVAL_MS = 30_000;

export function SearchAnalyticsTab({ onBack }: { onBack: () => void }) {
  const { toast } = useToast();
  const { user } = useUser();
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'live' | 'retrying' | 'error'>('live');
  const [retryCount, setRetryCount] = useState(0);
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });

  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchLogs = useCallback(async (attempt = 0): Promise<void> => {
    if (!user) return;
    if (attempt === 0) setIsLoading(true);

    try {
      // Force-refresh token if retrying (handles expiry)
      const idToken = await user.getIdToken(attempt > 0);
      const res = await fetch(
        `/api/analytics/search?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
        { headers: { 'Authorization': `Bearer ${idToken}` } }
      );

      if (!res.ok) {
        if (res.status === 401 && attempt < MAX_RETRIES) {
          // Token expired — schedule retry with exponential backoff
          const delay = Math.min(Math.pow(2, attempt) * 1000, 32_000);
          setConnectionStatus('retrying');
          setRetryCount(attempt + 1);
          retryTimeoutRef.current = setTimeout(() => fetchLogs(attempt + 1), delay);
          return;
        }
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      setLogs(data);
      setConnectionStatus('live');
      setRetryCount(0);
    } catch (err) {
      if (attempt < MAX_RETRIES) {
        const delay = Math.min(Math.pow(2, attempt) * 1000, 32_000);
        setConnectionStatus('retrying');
        setRetryCount(attempt + 1);
        retryTimeoutRef.current = setTimeout(() => fetchLogs(attempt + 1), delay);
      } else {
        setConnectionStatus('error');
        toast({ variant: 'destructive', title: "Insight Error", description: "Could not retrieve medicine trends after multiple attempts." });
      }
    } finally {
      if (attempt === 0) setIsLoading(false);
    }
  }, [user, dateRange, toast]);

  // Initial fetch + re-fetch on date/user change
  useEffect(() => {
    if (user) {
      fetchLogs();
    }
    return () => {
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, [dateRange, user]);

  // 30-second heartbeat
  useEffect(() => {
    if (!user) return;
    heartbeatRef.current = setInterval(() => {
      fetchLogs();
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [user, fetchLogs]);

  const downloadCSV = () => {
    if (logs.length === 0) return;
    
    const headers = ["Platform", "Mobile", "Keyword", "Results", "Pincode", "Timestamp"];
    const csvContent = [
      headers.join(","),
      ...logs.map(log => `"${log.platform || 'web'}","${log.mobile}","${(log.keyword || '').replace(/"/g, '""')}","${log.resultsCount ?? 'N/A'}","${log.pincode || ''}","${log.timestamp ? safeFormat(log.timestamp, 'yyyy-MM-dd HH:mm:ss') : 'N/A'}"`)
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
    
    toast({ title: "Report Exported", description: "Search data is ready for analysis." });
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <SectionHeader title="Medicine Search Trends" subtitle="Direct Customer Search Analytics" onBack={onBack}>
        {/* Connection Status Indicator */}
        <div className="flex items-center gap-3 mr-4">
          {connectionStatus === 'live' ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-100">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Live</span>
            </div>
          ) : connectionStatus === 'retrying' ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-full border border-amber-100">
              <Loader2 className="w-3 h-3 text-amber-500 animate-spin" />
              <span className="text-[9px] font-black uppercase tracking-widest text-amber-600">Retry {retryCount}/{MAX_RETRIES}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-full border border-red-100">
              <WifiOff className="w-3 h-3 text-red-500" />
              <span className="text-[9px] font-black uppercase tracking-widest text-red-600">Disconnected</span>
            </div>
          )}
        </div>
        <Button onClick={downloadCSV} disabled={logs.length === 0} className="rounded-full h-14 px-10 font-black text-[10px] bg-primary text-white shadow-2xl shadow-primary/30 uppercase tracking-widest hover:scale-105 transition-all border-4 border-white active:scale-95 disabled:opacity-50">
          <Download className="w-5 h-5 mr-3" /> Export Logs
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

          <Button onClick={() => fetchLogs(0)} variant="ghost" className="w-full h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest text-primary bg-primary/5 hover:bg-primary/10 transition-all gap-3 border border-primary/20">
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
                <span className="font-black text-xs uppercase tracking-tight text-slate-900">Analytics Log</span>
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
                  <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Platform</th>
                  <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Identity (Mobile)</th>
                  <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Keyword (Search)</th>
                  <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Results</th>
                  <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Region</th>
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
                       <Badge className={cn(
                         "uppercase border-none",
                         log.platform === 'mobile' ? "bg-indigo-50 text-indigo-600" : "bg-sky-50 text-sky-600"
                       )}>
                         {log.platform || 'web'}
                       </Badge>
                    </td>
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
                      <span className={cn(
                        "font-black text-xs",
                        (log.resultsCount === 0) ? "text-red-500" : "text-emerald-500"
                      )}>
                        {log.resultsCount ?? 'N/A'}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-xs text-slate-600">{log.pincode || 'Generic'}</span>
                        {log.lat && (
                          <span className="text-[8px] text-slate-400 font-mono">{log.lat.toFixed(2)}, {log.lng.toFixed(2)}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-right">
                        <span className="font-bold text-xs text-slate-500">
                          {safeFormat(log.timestamp, 'MMM dd, yyyy')}
                        </span>
                        <span className="text-[10px] font-medium text-slate-300 ml-2">
                          {safeFormat(log.timestamp, 'HH:mm:ss')}
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
