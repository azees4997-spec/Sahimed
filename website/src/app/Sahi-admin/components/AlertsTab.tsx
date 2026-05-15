"use client"

import { useState, useEffect } from 'react';
import { 
  Loader2, 
  Zap 
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SectionHeader } from './SectionHeader';
import { useToast } from '@/hooks/use-toast';

export function AlertsTab({ db, isVerified, onBack }: { db: any, isVerified: boolean, onBack: () => void }) {
  const { toast } = useToast();
  const [stockAlerts, setStockAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStockAlerts = async () => {
      try {
        const res = await fetch('/api/inventory/alerts', { cache: 'no-store' }); 
        if (!res.ok) {
           const errData = await res.json().catch(() => ({}));
           throw new Error(errData.error || `Server Error: ${res.status}`);
        }
        const data = await res.json();
        setStockAlerts(Array.isArray(data) ? data : []);
      } catch (err: any) {
        console.error(err);
        toast({ variant: 'destructive', title: "Fetch Failed", description: err.message });
      } finally {
        setIsLoading(false);
      }
    };
    fetchStockAlerts();
  }, []);

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2">
      <SectionHeader title="Inventory alerts" subtitle="Inventory Requested by Customers" onBack={onBack}>
        <Button variant="outline" className="rounded-full h-12 px-8 font-black text-[10px] border-2">Generate report</Button>
      </SectionHeader>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (<div className="col-span-full py-20 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></div>) : stockAlerts?.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-[40px] shadow-sm">
            <Zap className="w-12 h-12 text-green-100 mx-auto mb-4" />
            <p className="text-[10px] font-black text-gray-400">No customer requests at the moment.</p>
          </div>
        ) : stockAlerts?.map(item => (
          <Card key={item._id} className="rounded-[40px] border-none shadow-sm bg-white p-8 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-2 h-full bg-blue-500" />
            <div className="flex justify-between items-start mb-6">
              <Badge className="bg-blue-100 text-blue-600 font-black text-[8px] uppercase">Customer Ask</Badge>
              <span className="font-black text-lg text-blue-600">{item.count || 0} requested</span>
            </div>
            <h3 className="font-black text-sm mb-2 truncate">{item.product?.name || 'Unknown Product'}</h3>
            <p className="text-[10px] font-bold text-gray-400 mb-6">{item.product?.manufacturer || item.product?.brand || 'N/A'}</p>
            <div className="flex justify-between items-center mt-auto">
               <span className="text-[10px] font-black text-slate-400 uppercase">Available: {item.product?.availableQuantity || 0}</span>
               <Button className="rounded-full h-10 px-6 font-black text-[10px] bg-primary hover:bg-primary/90 text-white">Update Stock</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
