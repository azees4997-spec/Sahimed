"use client"

import { useState, useEffect } from 'react';
import { 
  Loader2, 
  Package, 
  Truck, 
  CheckCircle2, 
  MapPin, 
  ChevronDown, 
  ChevronUp,
  RefreshCw,
  Clock,
  Box
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';
import { motion, AnimatePresence } from 'framer-motion';

interface Scan {
  date: string;
  time: string;
  activity: string;
  location: string;
}

interface TrackingData {
  carrier_name?: string;
  shipment_track_activities?: Scan[];
}

interface OrderTrackingVisualProps {
  awb: string;
  orderId?: string;
  currentStatus?: string;
  isAdmin?: boolean;
  onStatusUpdate?: (status: string) => void;
}

export function OrderTrackingVisual({ awb, orderId, currentStatus, isAdmin, onStatusUpdate }: OrderTrackingVisualProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    let isMounted = true;
    async function fetchTracking() {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/orders/track?awb=${awb}${orderId ? `&orderId=${orderId}` : ''}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        if (isMounted) {
          setData(json);
          
          // Auto-sync logic for admins (or as a silent update)
          if (isAdmin && onStatusUpdate) {
            const scans = json.tracking_data?.shipment_track_activities || json.response?.tracking_details || [];
            if (scans.length > 0) {
              const latest = scans[0].activity || scans[0].status || '';
              const mapped = mapToEcomStatus(latest);
              if (mapped && mapped !== currentStatus) {
                // We could auto-sync here, but for now let's keep the manual button or 
                // just notify the parent. Let's stick to the sync button for clarity first.
              }
            }
          }
        }
      } catch (e) {
        console.error('[Tracking] Fetch error:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchTracking();
    return () => { isMounted = false; };
  }, [awb, orderId, user, isAdmin]);

  const mapToEcomStatus = (activity: string) => {
    const s = activity.toLowerCase();
    if (s.includes('delivered')) return 'Delivered';
    if (s.includes('out for delivery')) return 'Out for Delivery';
    if (s.includes('transit') || s.includes('departed') || s.includes('picked up') || s.includes('dispatched') || s.includes('vehicle')) return 'In Transit';
    if (s.includes('returned') || s.includes('rto')) return 'Returned';
    if (s.includes('manifest') || s.includes('pickup scheduled') || s.includes('packed')) return 'Packed';
    return null;
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-12 bg-white/50 backdrop-blur-sm rounded-[40px] border border-white shadow-xl">
      <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Connecting to Carrier...</p>
    </div>
  );

  if (!data || data.error) return null;

  const scans: Scan[] = 
    data.tracking_data?.shipment_track_activities || 
    data.response?.tracking_data?.shipment_track_activities || 
    data.response?.tracking_details ||
    data.tracking_details ||
    [];

  if (scans.length === 0) return null;

  const latestActivity = scans[0].activity || '';
  const suggestedStatus = mapToEcomStatus(latestActivity);
  const needsSync = isAdmin && suggestedStatus && suggestedStatus !== currentStatus;

  // Milestone logic
  const milestones = [
    { label: 'Confirmed', icon: Package, active: true },
    { label: 'Packed', icon: Box, active: ['Packed', 'In Transit', 'Out for Delivery', 'Delivered'].includes(currentStatus || '') },
    { label: 'Shipped', icon: Truck, active: ['In Transit', 'Out for Delivery', 'Delivered'].includes(currentStatus || '') },
    { label: 'Delivered', icon: CheckCircle2, active: currentStatus === 'Delivered' }
  ];

  const visibleScans = isExpanded ? scans : scans.slice(0, 3);
  const hasMore = scans.length > 3;

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-500">
      {/* Premium Milestone Stepper */}
      <div className="bg-white/80 backdrop-blur-md p-8 rounded-[40px] border border-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-5">
           <Truck className="w-24 h-24 text-primary" />
        </div>
        <div className="flex justify-between items-center relative mb-2">
          {milestones.map((m, i) => (
            <div key={i} className="flex flex-col items-center gap-3 z-10">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-700",
                m.active ? "bg-primary text-white shadow-lg shadow-primary/20 scale-110" : "bg-slate-100 text-slate-300"
              )}>
                <m.icon className="w-5 h-5" />
              </div>
              <span className={cn(
                "text-[9px] font-black uppercase tracking-widest",
                m.active ? "text-primary" : "text-slate-300"
              )}>{m.label}</span>
            </div>
          ))}
          {/* Progress Line */}
          <div className="absolute top-6 left-6 right-6 h-0.5 bg-slate-100 -z-0">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(milestones.filter(m => m.active).length - 1) / (milestones.length - 1) * 100}%` }}
              className="h-full bg-primary"
            />
          </div>
        </div>
      </div>

      {/* Timeline Section */}
      <div className="bg-white/60 backdrop-blur-md p-8 rounded-[40px] border border-white shadow-xl space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Live Tracking Timeline</h5>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 text-[9px] font-black uppercase px-3 py-1">
                {data.tracking_data?.carrier_name || 'Standard Shipping'}
              </Badge>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-60">AWB: {awb}</span>
            </div>
          </div>
          
          {needsSync && onStatusUpdate && (
            <Button 
              size="sm"
              disabled={isSyncing}
              onClick={async () => {
                setIsSyncing(true);
                await onStatusUpdate(suggestedStatus!);
                setIsSyncing(false);
              }}
              className="h-9 rounded-2xl bg-primary text-white font-black text-[9px] uppercase tracking-wider px-6 shadow-xl shadow-primary/20 animate-pulse"
            >
              {isSyncing ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <RefreshCw className="w-3 h-3 mr-2" />}
              Update to {suggestedStatus}
            </Button>
          )}
        </div>

        <div className="space-y-8">
          <AnimatePresence mode="popLayout">
            {visibleScans.map((scan, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ delay: idx * 0.05 }}
                className="flex gap-6 items-start relative group"
              >
                {idx !== visibleScans.length - 1 && (
                  <div className="absolute left-[11px] top-8 bottom-[-32px] w-0.5 bg-slate-100 group-hover:bg-primary/20 transition-colors" />
                )}
                <div className={cn(
                  "w-6 h-6 rounded-xl flex items-center justify-center shrink-0 z-10 border-4 border-white shadow-md transition-all duration-500",
                  idx === 0 ? "bg-primary text-white scale-125 shadow-primary/20" : "bg-slate-50 text-slate-300"
                )}>
                  {idx === 0 ? <Clock className="w-2.5 h-2.5" /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                </div>
                
                <div className="flex-1 min-w-0 -mt-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                    <p className={cn(
                      "text-[13px] font-black uppercase tracking-tight font-outfit",
                      idx === 0 ? "text-slate-900" : "text-slate-500"
                    )}>
                      {scan.activity}
                    </p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap opacity-60">
                      {scan.date} • {scan.time}
                    </p>
                  </div>
                  {scan.location && (
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="w-4 h-4 bg-slate-50 rounded-md flex items-center justify-center">
                        <MapPin className="w-2.5 h-2.5 text-slate-400" />
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                        {scan.location}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {hasMore && (
            <Button
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full h-12 rounded-[24px] bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-primary transition-all flex items-center justify-center gap-3 border border-dashed border-slate-200"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                {isExpanded ? 'Show Less' : `View Full Journey (${scans.length - 3} more updates)`}
              </span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
