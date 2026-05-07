"use client"

import { useState } from 'react';
import { 
  Database, 
  RefreshCcw, 
  CheckCircle2, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { SectionHeader } from './SectionHeader';
import { useAuth } from '@/firebase';

export function MaintenanceTab({ onBack }: { onBack: () => void }) {
  const [isMigrating, setIsMigrating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();
  const auth = useAuth();

  const handleMigration = async () => {
    if (!confirm("This will mirror all Firestore users and addresses to MongoDB. It may take a while. Proceed?")) return;
    
    setIsMigrating(true);
    setResult(null);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Unauthorized");

      const res = await fetch('/api/admin/migrate-to-mongo', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      const data = await res.json();
      
      if (res.ok) {
        setResult(data);
        toast({ title: "Migration Successful", description: `Synced ${data.usersMigrated} users and ${data.addressesMigrated} addresses.` });
      } else {
        throw new Error(data.error || "Migration failed");
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: "Migration Failed", description: err.message });
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2">
      <SectionHeader 
        title="System Maintenance" 
        subtitle="Manage cross-database synchronization and integrity" 
        onBack={onBack} 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="rounded-[40px] border-none shadow-xl overflow-hidden bg-white">
          <CardHeader className="p-8 bg-slate-900 text-white">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-xl font-black uppercase font-outfit">MongoDB Mirroring</CardTitle>
                <p className="text-[10px] font-black text-white/40 tracking-widest uppercase">Full Firestore &rarr; MongoDB Sync</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <p className="text-sm font-medium text-slate-600 leading-relaxed">
              Manually trigger a full synchronization of all customer profiles and addresses from Firestore to MongoDB. 
              This is useful for initializing a new MongoDB instance or recovering from sync failures.
            </p>
            
            <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 flex gap-4">
              <AlertCircle className="w-6 h-6 text-amber-500 shrink-0" />
              <p className="text-[10px] font-bold text-amber-700 leading-normal uppercase">
                Caution: This is a heavy operation. It will iterate through every user in the clinical registry. 
                Use during low-traffic periods.
              </p>
            </div>

            {result && (
              <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 flex items-center gap-4">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                <div>
                  <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Last Sync Result</p>
                  <p className="text-sm font-black text-emerald-900">
                    {result.usersMigrated} Users • {result.addressesMigrated} Addresses
                  </p>
                </div>
              </div>
            )}

            <Button 
              onClick={handleMigration} 
              disabled={isMigrating}
              className="w-full h-16 rounded-full font-black text-[10px] tracking-[0.2em] bg-slate-900 text-white hover:bg-black uppercase shadow-xl active:scale-95 transition-all gap-3"
            >
              {isMigrating ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCcw className="w-5 h-5" />}
              {isMigrating ? "Synchronizing Clinical Matrix..." : "Start Full Database Mirroring"}
            </Button>
          </CardContent>
        </Card>

        {/* Placeholder for future maintenance tasks */}
        <Card className="rounded-[40px] border-2 border-dashed border-slate-100 bg-transparent flex items-center justify-center p-12 text-center opacity-40">
           <div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Advanced Integrity Checks</p>
             <p className="text-[8px] font-bold text-slate-300 uppercase mt-2">Coming Soon to Console 4.0</p>
           </div>
        </Card>
      </div>
    </div>
  );
}
