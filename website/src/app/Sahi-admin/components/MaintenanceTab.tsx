"use client"

import { useState, useEffect } from 'react';
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
import { useAuth, useFirestore } from '@/firebase';
import { collection, getDocs, query, orderBy, limit, startAfter } from 'firebase/firestore';
import { 
  Key, 
  Terminal, 
  ExternalLink as ExternalLinkIcon, 
  Info,
  Settings,
  ShieldCheck,
  Zap,
  Globe
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export function MaintenanceTab({ onBack }: { onBack: () => void }) {
  const [isMigrating, setIsMigrating] = useState(false);
  const [isSafeMirroring, setIsSafeMirroring] = useState(false);
  const [safeMirrorProgress, setSafeMirrorProgress] = useState({ current: 0, total: 0 });
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();
  const auth = useAuth();
  const db = useFirestore();

  const [counts, setCounts] = useState<{fs: number, mg: number} | null>(null);

  const checkCounts = async () => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) return;

      const res = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCounts(prev => ({ ...prev, mg: data.users }));
      }
    } catch (e) {}
  };

  useEffect(() => {
    checkCounts();
  }, []);

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
      const isMissingConfig = err.message?.includes("Configuration Missing");
      if (isMissingConfig) {
        setResult({ type: 'config_error', message: err.message });
      }
      toast({ variant: 'destructive', title: "Migration Failed", description: err.message });
    } finally {
      setIsMigrating(false);
    }
  };

  const handleSafeMirror = async () => {
    if (!confirm("This will fetch all users from Firestore on your device and mirror them to MongoDB. This is safer if you don't have server credentials. Proceed?")) return;
    
    setIsSafeMirroring(true);
    setResult(null);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("Unauthorized");

      // 1. Fetch all users from Firestore
      const usersSnap = await getDocs(collection(db, 'userProfiles'));
      const total = usersSnap.docs.length;
      setSafeMirrorProgress({ current: 0, total });

      let lastVisible = null;
      let processed = 0;

      while (processed < total) {
        const q = query(collection(db, 'userProfiles'), orderBy('__name__'), limit(50), ...(lastVisible ? [startAfter(lastVisible)] : []));
        const usersSnap = await getDocs(q);
        
        if (usersSnap.empty) break;

        for (const userDoc of usersSnap.docs) {
          const uid = userDoc.id;
          const userData = { id: uid, ...userDoc.data() };
          const addressesSnap = await getDocs(collection(db, 'userProfiles', uid, 'addresses'));
          const addresses = addressesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

          const res = await fetch('/api/admin/mirror-bridge', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${idToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ user: userData, addresses })
          });

          if (!res.ok) throw new Error(`Failed on user ${uid}`);
          processed++;
          setSafeMirrorProgress({ current: processed, total });
        }
        
        lastVisible = usersSnap.docs[usersSnap.docs.length - 1];
        await new Promise(r => setTimeout(r, 200));
      }

      toast({ title: "Safe Mirror Complete", description: `Synchronized ${total} users to MongoDB.` });
      setResult({ type: 'safe_success', count: total });
      checkCounts(); // Refresh counts
    } catch (err: any) {
      console.error("Safe Mirror Error:", err);
      toast({ variant: 'destructive', title: "Mirroring Stopped", description: err.message });
    } finally {
      setIsSafeMirroring(false);
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
                Caution: This is a heavy operation. It will iterate through every user in the pharmacy records. 
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
              disabled={isMigrating || isSafeMirroring}
              className="w-full h-16 rounded-full font-black text-[10px] tracking-[0.2em] bg-slate-900 text-white hover:bg-black uppercase shadow-xl active:scale-95 transition-all gap-3"
            >
              {isMigrating ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCcw className="w-5 h-5" />}
              {isMigrating ? "Synchronizing Pharmacy Core..." : "Start Full Database Mirroring"}
            </Button>
          </CardContent>
        </Card>

        {/* Safe Mirroring Section */}
        <Card className="rounded-[40px] border-none shadow-xl overflow-hidden bg-emerald-50/50 border border-emerald-100">
          <CardHeader className="p-8 bg-emerald-600 text-white">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-xl font-black uppercase font-outfit">Safe Mirror (Browser-Mode)</CardTitle>
                <p className="text-[10px] font-black text-white/60 tracking-widest uppercase">No Server Credentials Required</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <p className="text-sm font-medium text-slate-600 leading-relaxed">
              If your Firebase Admin configuration is missing, use this mode. It uses your <strong>Admin Login Session</strong> to fetch data from Firestore and mirror it to MongoDB.
            </p>
            
            {isSafeMirroring && (
              <div className="space-y-4 bg-white p-6 rounded-3xl border border-emerald-100 animate-in fade-in zoom-in-95">
                <div className="flex justify-between text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                  <span>Mirroring Medical Data...</span>
                  <span>{Math.round((safeMirrorProgress.current / safeMirrorProgress.total) * 100)}%</span>
                </div>
                <Progress value={(safeMirrorProgress.current / safeMirrorProgress.total) * 100} className="h-3 bg-emerald-100" />
                <p className="text-[9px] font-bold text-slate-400 text-center uppercase tracking-widest">
                  Processed {safeMirrorProgress.current} of {safeMirrorProgress.total} Profiles
                </p>
              </div>
            )}

            {result?.type === 'safe_success' && (
              <div className="bg-emerald-500 p-6 rounded-3xl text-white flex items-center gap-4 animate-in slide-in-from-top-4">
                <Zap className="w-6 h-6 animate-pulse" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Mirroring Complete</p>
                  <p className="text-sm font-black">{result.count} Users synced to MongoDB via Secure Tunnel.</p>
                </div>
              </div>
            )}

            <Button 
              onClick={handleSafeMirror} 
              disabled={isSafeMirroring || isMigrating}
              className="w-full h-16 rounded-full font-black text-[10px] tracking-[0.2em] bg-emerald-600 text-white hover:bg-emerald-700 uppercase shadow-xl active:scale-95 transition-all gap-3"
            >
              {isSafeMirroring ? <Loader2 className="w-5 h-5 animate-spin" /> : <Globe className="w-5 h-5" />}
              {isSafeMirroring ? "Tunneling Data..." : "Start Secure Client Mirroring"}
            </Button>
          </CardContent>
        </Card>

        {/* MongoDB Connection Reset Section */}
        <Card className="rounded-[40px] border-none shadow-xl overflow-hidden bg-white">
          <CardHeader className="p-8 bg-blue-600 text-white">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <RefreshCcw className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-xl font-black uppercase font-outfit">MongoDB Reset</CardTitle>
                <p className="text-[10px] font-black text-white/60 tracking-widest uppercase">Force Reconnect Backend Driver</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <p className="text-sm font-medium text-slate-600 leading-relaxed">
              If products and categories are not showing due to a database connection timeout or network hiccup, click here to force-reset the MongoDB connection pool in the backend memory.
            </p>
            
            <Button 
              onClick={async () => {
                try {
                  const idToken = await auth.currentUser?.getIdToken();
                  if (!idToken) throw new Error("Unauthorized");
                  
                  const res = await fetch('/api/diagnostics', {
                    method: 'POST',
                    headers: { 
                      'Authorization': `Bearer ${idToken}`,
                      'Content-Type': 'application/json'
                    }
                  });
                  const data = await res.json();
                  if (res.ok) {
                    toast({ title: "Database Reset Complete", description: data.message || "Connection cache cleared successfully." });
                  } else {
                    throw new Error(data.error || "Reset failed");
                  }
                } catch (err: any) {
                  toast({ variant: 'destructive', title: "Reset Failed", description: err.message });
                }
              }}
              className="w-full h-16 rounded-full font-black text-[10px] tracking-[0.2em] bg-blue-600 text-white hover:bg-blue-700 uppercase shadow-xl active:scale-95 transition-all gap-3"
            >
              <RefreshCcw className="w-5 h-5" />
              Force MongoDB Reconnect
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
                  This allows the backend to securely access your pharmacy records.
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
