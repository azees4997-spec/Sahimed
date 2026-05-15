"use client"

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ShieldCheck, 
  LogOut, 
  Loader2, 
  ShieldAlert,
  Lock,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  useUser, 
  useFirestore, 
  useAuth, 
  setDocumentNonBlocking,
} from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '@/components/PageTransition';

import { AdminTab } from './types';
import { AdminProfile } from '@/types';

// Tab Components
import { OverviewTab } from './components/OverviewTab';
import { EnquiriesTab } from './components/EnquiriesTab';
import { FulfillmentTab } from './components/FulfillmentTab';
import { PromoCodesTab } from './components/PromoCodesTab';
import { FeesTab } from './components/FeesTab';
import { CategoriesTab } from './components/CategoriesTab';
import { CustomersTab } from './components/CustomersTab';
import { AlertsTab } from './components/AlertsTab';
import { ItemMasterTab } from './components/ItemMasterTab';
import { MoleculeMasterTab } from './components/MoleculeMasterTab';
import { BannersTab } from './components/BannersTab';
import { AdminProfilesTab } from './components/AdminProfilesTab';
import { PagesTab } from './components/PagesTab';
import { SearchAnalyticsTab } from './components/SearchAnalyticsTab';
import { MaintenanceTab } from './components/MaintenanceTab';
import { InventoryTab } from './components/InventoryTab';

const MASTER_UIDS = ["BM9HheYflheT0Wyj6olaEnyCAHl1", "RzB6nqlQumg1VEniFcZrgbcDdRA2"];

function AdminConsoleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as AdminTab) || 'overview';

  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);
  const [isVerified, setIsVerified] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [isVerifying, setIsVerifying] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const performVerification = async () => {
    if (!db || !user) return;
    // 1. MASTER BYPASS: Immediate verification for owners
    if (MASTER_UIDS.includes(user.uid)) {
      setIsVerified(true);
      setUserRole('admin');
      setPermissions({
        orders_view: true,
        orders_create: true,
        shipping_edit: true,
        inventory_manage: true,
        staff_manage: true
      });
      setIsVerifying(false);
      return;
    }

    setIsVerifying(true);
    try {
      const snap = await getDoc(doc(db, 'adminProfiles', user.uid));
      if (snap.exists()) {
        const data = snap.data() as AdminProfile;
        if (['admin', 'pharmacist', 'sub-admin'].includes(data.role)) {
          setIsVerified(true);
          setUserRole(data.role);
          setPermissions(data.permissions || {});
        } else {
          setIsVerified(false);
          setUserRole('');
          setPermissions({});
        }
      } else {
        setIsVerified(false);
        setUserRole('');
        setPermissions({});
      }
    } catch (err) {
      setIsVerified(false);
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (user && !isVerified) {
      performVerification();
    } else if (!user) {
      setIsVerified(false);
    }
  }, [user]);

  // Sync state with URL
  useEffect(() => {
    const tab = searchParams.get('tab') as AdminTab;
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab);
    router.push(`/Sahi-admin?tab=${tab}`);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      if (!auth) throw new Error("Auth system inactive");
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: 'Authorization Granting', description: 'Establishing session link...' });
    } catch (err) {
      console.error("ADMIN_AUTH_FAILURE:", err);
      const error = err as { code?: string; message?: string };
      const errorCode = error.code || 'unknown-matrix-error';
      const errorMessage = error.message || 'Invalid credentials or network rejection.';
      
      toast({ 
        variant: 'destructive', 
        title: 'Access Denied', 
        description: `Code: ${errorCode}. ${errorMessage}` 
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthLoading(true);
    try {
      if (!auth) throw new Error("Auth system inactive");
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast({ title: 'Google Authority Verified', description: 'Establishing session link...' });
    } catch (err) {
      console.error("GOOGLE_AUTH_FAILURE:", err);
      const error = err as { message?: string };
      toast({ 
        variant: 'destructive', 
        title: 'Access Denied', 
        description: error.message || 'Identity rejection or network protocol error.' 
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      toast({ variant: 'destructive', title: 'Email Required', description: 'Please enter your admin email to reset the password.' });
      return;
    }
    setAuthLoading(true);
    try {
      if (!auth) throw new Error("Auth system inactive");
      await sendPasswordResetEmail(auth, email);
      toast({ title: 'Reset Link Processed', description: `A security link has been dispatched to ${email}. Please examine your inbox and spam folder.` });
    } catch (err: any) {
      console.error("RESET_FAILURE:", err);
      const msg = err.code === 'auth/user-not-found' 
        ? "This email is not registered as an administrative identity in this sector."
        : err.message || "Protocol rejection during reset transmission.";
      
      toast({ variant: 'destructive', title: 'Transmission Failure', description: msg });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setIsVerified(false);
    signOut(auth);
  };

  const bootstrapAdmin = () => {
    if (!db || !user) return;
    setDocumentNonBlocking(doc(db, 'adminProfiles', user.uid), {
      id: user.uid,
      role: 'admin',
      activatedAt: new Date().toISOString()
    }, { merge: true });
    
    setIsVerifying(true);
    toast({ title: 'Requesting authority', description: 'Provisioning admin role...' });
    setTimeout(performVerification, 3000);
  };

  if (isUserLoading || isVerifying) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F7F6] gap-6 pharma-bg-pattern">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-12 h-12 text-primary" />
        </motion.div>
        <p className="text-[10px] font-black tracking-[0.4em] text-slate-400 uppercase">Synchronizing Matrix...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center bg-[#F4F7F6] p-6 pharma-bg-pattern">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <Card className="max-w-md w-full rounded-[56px] shadow-3xl border-none overflow-hidden bg-white/80 backdrop-blur-xl border border-white">
              <CardHeader className="text-center p-12 bg-primary text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
                   <ShieldCheck className="w-32 h-32" />
                </div>
                <Lock className="w-14 h-14 mx-auto mb-4 text-white/40 relative z-10" />
                <CardTitle className="text-3xl font-black tracking-tighter text-white uppercase font-outfit relative z-10">Admin Access</CardTitle>
                <p className="text-[10px] font-black text-white/50 tracking-[0.3em] uppercase relative z-10">SahiMed Administrative Console</p>
                <div className="mt-4 pt-4 border-t border-white/10 relative z-10">
                  <p className="text-[8px] font-black text-white/40 tracking-[0.2em] uppercase">Matrix Identity: {auth?.app.options.projectId || 'Unknown Sector'}</p>
                </div>
              </CardHeader>
              <CardContent className="p-10">
                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Admin Email</Label>
                    <input type="email" placeholder="admin@sahimed.com" value={email} onChange={e => setEmail(e.target.value)} required className="w-full h-16 rounded-[24px] bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white px-6 font-black outline-none transition-all placeholder:text-slate-300" />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Password</Label>
                    <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required className="w-full h-16 rounded-[24px] bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white px-6 font-black outline-none transition-all placeholder:text-slate-300" />
                  </div>
                  <Button type="submit" disabled={authLoading} className="w-full h-20 rounded-full font-black tracking-[0.3em] mt-4 shadow-2xl shadow-primary/30 uppercase active:scale-95 text-xs bg-primary hover:scale-[1.02] transition-all">
                    {authLoading ? <Loader2 className="animate-spin" /> : "Authorize Protocol"}
                  </Button>

                  <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100"></span></div>
                    <div className="relative flex justify-center text-[8px] font-black uppercase tracking-[0.3em]"><span className="bg-white px-4 text-slate-300">OR</span></div>
                  </div>

                  <Button 
                    type="button" 
                    onClick={handleGoogleLogin} 
                    disabled={authLoading} 
                    variant="outline"
                    className="w-full h-16 rounded-full font-black tracking-[0.2em] border-2 border-slate-50 hover:bg-slate-50 transition-all uppercase text-[10px] gap-3"
                  >
                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
                       <Zap className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    </div>
                    Sign In with Google Identity
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={handleResetPassword}
                    disabled={authLoading}
                    className="w-full text-[10px] font-black tracking-widest text-slate-400 hover:text-primary uppercase"
                  >
                    Set / Reset Master Password
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </PageTransition>
    );
  }

  if (!isVerified) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center bg-[#F4F7F6] p-6 pharma-bg-pattern">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <Card className="max-w-md w-full rounded-[56px] shadow-3xl border-none p-12 text-center space-y-8 bg-white/80 backdrop-blur-xl border border-white">
              <div className="w-24 h-24 bg-orange-50 rounded-[40px] flex items-center justify-center mx-auto shadow-inner">
                <ShieldAlert className="w-12 h-12 text-orange-500" />
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-black tracking-tight uppercase font-outfit">Restricted Sector</h2>
                <p className="text-[10px] font-black tracking-[0.3em] text-slate-400 uppercase opacity-60">Authentication Failure • Unauthorized Access</p>
              </div>
              <p className="text-sm font-medium text-slate-500 leading-relaxed px-4">Your current profile does not possess the requisite clearance for administrative operations.</p>
              <div className="flex flex-col gap-4">
                <Button onClick={bootstrapAdmin} className="w-full h-16 rounded-full font-black text-[10px] tracking-[0.2em] bg-slate-900 shadow-xl active:scale-95 uppercase">Request Clearance</Button>
                <Button variant="ghost" onClick={handleLogout} className="w-full h-16 rounded-full font-black text-[10px] tracking-[0.2em] text-slate-400 uppercase hover:text-slate-900 active:scale-95">Deauthorize Session</Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#F4F7F6] pharma-bg-pattern pb-32">
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/40 backdrop-blur-2xl border-b border-white shadow-lg">
          <div className="max-w-[1600px] mx-auto px-8 md:px-12 h-24 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="group flex items-center gap-4">
                <div className="w-14 h-14 bg-primary rounded-[20px] shadow-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                  <Zap className="w-8 h-8 text-white fill-white" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-2xl font-black tracking-tighter text-slate-900 uppercase font-outfit leading-none">SahiMed</h1>
                  <p className="text-[8px] font-black text-slate-400 tracking-[0.5em] uppercase opacity-60">Admin Dashboard 4.0</p>
                </div>
              </Link>
            </div>

            <div className="flex items-center gap-6">
              <div className="hidden lg:flex flex-col items-end mr-6 border-r border-slate-200 pr-8">
                 <p className="text-[9px] font-black text-slate-300 tracking-[0.3em] uppercase opacity-60">Session Active</p>
                 <p className="text-xs font-black text-primary uppercase">{user?.email}</p>
              </div>
              <Button 
                onClick={handleLogout}
                variant="ghost" 
                size="icon" 
                className="w-14 h-14 rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg active:scale-90"
              >
                <LogOut className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </header>

        <main className="max-w-[1600px] mx-auto px-8 md:px-12 pt-40 pb-20">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.02, y: -10 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              {activeTab === 'overview' && <OverviewTab setTab={handleTabChange} role={userRole} />}
              {(permissions.orders_view || userRole === 'admin') && activeTab === 'enquiries' && <EnquiriesTab db={db} isVerified={isVerified} onBack={() => handleTabChange('overview')} />}
              {(permissions.orders_view || userRole === 'admin') && activeTab === 'fulfillment' && <FulfillmentTab db={db} isVerified={isVerified} onBack={() => handleTabChange('overview')} />}
              {(permissions.inventory_manage || userRole === 'admin') && activeTab === 'promocodes' && <PromoCodesTab db={db} isVerified={isVerified} onBack={() => handleTabChange('overview')} />}
              {(permissions.inventory_manage || userRole === 'admin') && activeTab === 'fees' && <FeesTab db={db} isVerified={isVerified} onBack={() => handleTabChange('overview')} />}
              {(permissions.inventory_manage || userRole === 'admin') && activeTab === 'categories' && <CategoriesTab db={db} isVerified={isVerified} onBack={() => handleTabChange('overview')} />}
              {(permissions.orders_view || userRole === 'admin') && activeTab === 'customers' && <CustomersTab db={db} isVerified={isVerified} onBack={() => handleTabChange('overview')} />}
              {(permissions.inventory_manage || userRole === 'admin') && activeTab === 'stockAlerts' && <AlertsTab db={db} isVerified={isVerified} onBack={() => handleTabChange('overview')} />}
              {(permissions.inventory_manage || userRole === 'admin') && activeTab === 'itemMaster' && <ItemMasterTab db={db} isVerified={isVerified} onBack={() => handleTabChange('overview')} />}
              {(permissions.inventory_manage || userRole === 'admin') && activeTab === 'moleculeMaster' && <MoleculeMasterTab db={db} isVerified={isVerified} onBack={() => handleTabChange('overview')} />}
              {(permissions.inventory_manage || userRole === 'admin') && activeTab === 'banners' && <BannersTab db={db} isVerified={isVerified} onBack={() => handleTabChange('overview')} />}
              {(permissions.staff_manage || userRole === 'admin') && activeTab === 'admins' && <AdminProfilesTab db={db} isVerified={isVerified} onBack={() => handleTabChange('overview')} />}
              {(permissions.inventory_manage || userRole === 'admin') && activeTab === 'pages' && <PagesTab db={db} isVerified={isVerified} onBack={() => handleTabChange('overview')} />}
              {(permissions.inventory_manage || userRole === 'admin') && activeTab === 'searchAnalytics' && <SearchAnalyticsTab onBack={() => handleTabChange('overview')} />}
              {(permissions.inventory_manage || userRole === 'admin') && activeTab === 'inventory' && <InventoryTab db={db} isVerified={isVerified} onBack={() => handleTabChange('overview')} />}
              {(permissions.staff_manage || userRole === 'admin') && activeTab === 'maintenance' && <MaintenanceTab onBack={() => handleTabChange('overview')} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </PageTransition>
  );
}

export default function AdminConsole() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F7F6] gap-6 pharma-bg-pattern">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-[10px] font-black tracking-[0.4em] text-slate-400 uppercase">Loading Session...</p>
      </div>
    }>
      <AdminConsoleContent />
    </Suspense>
  );
}
