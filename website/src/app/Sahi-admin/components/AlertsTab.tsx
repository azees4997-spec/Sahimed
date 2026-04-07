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

export function AlertsTab({ db, isVerified, onBack }: { db: any, isVerified: boolean, onBack: () => void }) {
  const [stockAlerts, setStockAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStockAlerts = async () => {
      try {
        const res = await fetch('/api/products?limit=100'); 
        const data = await res.json();
        const lowStock = data.filter((p: any) => (p.availableQuantity || 0) <= 10);
        setStockAlerts(lowStock);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStockAlerts();
  }, []);

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2">
      <SectionHeader title="Inventory alerts" subtitle="Low stock notifications" onBack={onBack}>
        <Button variant="outline" className="rounded-full h-12 px-8 font-black text-[10px] border-2">Generate report</Button>
      </SectionHeader>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (<div className="col-span-full py-20 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></div>) : stockAlerts?.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-[40px] shadow-sm">
            <Zap className="w-12 h-12 text-green-100 mx-auto mb-4" />
            <p className="text-[10px] font-black text-gray-400">Inventory is healthy. No alerts.</p>
          </div>
        ) : stockAlerts?.map(item => (
          <Card key={item._id} className="rounded-[40px] border-none shadow-sm bg-white p-8 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-2 h-full bg-red-500" />
            <div className="flex justify-between items-start mb-6">
              <Badge className="bg-red-100 text-red-600 font-black text-[8px] uppercase">Low Stock</Badge>
              <span className="font-black text-lg text-red-600">{item.availableQuantity || 0} left</span>
            </div>
            <h3 className="font-black text-sm mb-2 truncate">{item.name}</h3>
            <p className="text-[10px] font-bold text-gray-400 mb-6">{item.manufacturer}</p>
            <Button className="w-full rounded-full h-12 font-black text-[10px] bg-red-600 hover:bg-red-700 text-white gap-2">Update inventory</Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
