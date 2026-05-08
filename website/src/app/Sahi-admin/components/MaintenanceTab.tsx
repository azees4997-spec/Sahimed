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
import { 
  Key, 
  Terminal, 
  ExternalLink as ExternalLinkIcon, 
  Info,
  Settings
} from 'lucide-react';

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
      }
    } catch (err: any) {
      const isMissingConfig = err.message?.includes("Configuration Missing");
      if (isMissingConfig) {
        setResult({ type: 'config_error', message: err.message });
      }
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

        {/* Configuration Setup Guide - Shown only on error */}
        {result?.type === 'config_error' ? (
          <Card className="rounded-[40px] border-2 border-rose-100 bg-rose-50/30 overflow-hidden animate-in zoom-in-95 duration-500">
            <CardHeader className="p-8 bg-rose-500 text-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Key className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-xl font-black uppercase font-outfit tracking-tighter">Setup Required</CardTitle>
                  <p className="text-[10px] font-black text-white/60 tracking-widest uppercase">Firebase Admin Authentication</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-rose-600 flex items-center gap-2">
                  <Info className="w-4 h-4" /> Why is this needed?
                </h4>
                <p className="text-sm font-medium text-slate-600 leading-relaxed">
                  To mirror your data between Firestore and MongoDB, the server needs a <strong>Service Account</strong>. 
                  This allows the backend to securely access your clinical registry.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-rose-100 space-y-4">
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Step 1: Generate Key</h5>
                  <p className="text-xs text-slate-500 font-medium">Go to <strong>Firebase Console &rarr; Project Settings &rarr; Service Accounts</strong>. Click "Generate new private key".</p>
                  <Button variant="outline" className="w-full h-12 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 gap-2" onClick={() => window.open('https://console.firebase.google.com/project/_/settings/serviceaccounts/adminsdk', '_blank')}>
                    <ExternalLinkIcon className="w-4 h-4" /> Open Firebase Console
                  </Button>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-rose-100 space-y-4">
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Step 2: Add Environment Variables</h5>
                  <p className="text-xs text-slate-500 font-medium">Add the following keys to your deployment platform (Vercel or Firebase App Hosting):</p>
                  <div className="space-y-2">
                    {['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'].map(key => (
                      <div key={key} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                        <code className="text-[9px] font-black text-slate-600">{key}</code>
                        <Terminal className="w-3 h-3 text-slate-300 group-hover:text-primary transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-rose-100">
                <p className="text-[9px] font-bold text-slate-400 uppercase leading-relaxed italic">
                  Note: If using Firebase App Hosting, ensure these are added to Google Cloud Secret Manager and referenced in apphosting.yaml.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-[40px] border-2 border-dashed border-slate-100 bg-transparent flex items-center justify-center p-12 text-center opacity-40">
             <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Advanced Integrity Checks</p>
               <p className="text-[8px] font-bold text-slate-300 uppercase mt-2">Coming Soon to Console 4.0</p>
             </div>
          </Card>
        )}
      </div>
    </div>
  );
}
