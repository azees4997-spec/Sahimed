"use client"

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Package, 
  MapPin, 
  LogOut, 
  ChevronRight, 
  Settings, 
  Smartphone, 
  Download, 
  ShieldCheck,
  SmartphoneNfc,
  Loader2,
  LogIn
} from 'lucide-react';
import Link from 'next/link';
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        toast({ title: "Welcome!", description: "SahiMed is installing." });
      }
      setDeferredPrompt(null);
    } else {
      toast({ 
        title: "PWA Installation", 
        description: "Tap the Share icon and then 'Add to Home Screen'." 
      });
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F8F8]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F8F8F8] page-transition-wrapper">
        <Navbar />
        <main className="max-w-md mx-auto px-6 py-24 text-center">
          <div className="w-20 h-20 bg-white rounded-[40px] shadow-2xl flex items-center justify-center mx-auto mb-10 border border-gray-50">
            <User className="w-10 h-10 text-gray-100" />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tighter mb-4 text-gray-900">SahiMed Account</h1>
          <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-12 leading-relaxed max-w-[280px] mx-auto">
            sahi dawa sahi daam pe. Manage your health journey in one secure hub.
          </p>
          <Link href="/login" className="w-full">
            <Button className="w-full h-18 rounded-full font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 text-xs gap-3">
              <LogIn className="w-5 h-5" /> Sign In / Register
            </Button>
          </Link>
          <div className="mt-16 flex items-center justify-center gap-3">
            <ShieldCheck className="w-4 h-4 text-green-500" />
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Secured SahiMed Portal</span>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8] page-transition-wrapper">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-10 sm:py-20">
        
        <div className="flex flex-col md:flex-row items-center gap-8 mb-10 bg-white p-10 rounded-[48px] shadow-sm border border-gray-100">
          <div className="w-20 h-20 bg-primary/5 rounded-3xl flex items-center justify-center border-4 border-white shadow-xl shrink-0">
             <User className="w-10 h-10 text-primary" />
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-black text-gray-900 mb-1 uppercase tracking-tighter">
              {user?.email?.split('@')[0] || 'SahiMed Member'}
            </h1>
            <p className="text-gray-400 font-black text-[10px] uppercase tracking-widest">Active Customer Session</p>
          </div>
          <div className="md:ml-auto">
            <Button 
              variant="ghost" 
              onClick={handleLogout}
              className="rounded-full h-12 px-8 font-black text-[11px] uppercase tracking-[0.2em] text-red-500 hover:bg-red-50 gap-3"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="space-y-5">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 ml-6">Shopping History</h2>
              <Link href="/orders" className="block">
                <div className="bg-white p-6 rounded-[32px] border border-gray-100 flex items-center justify-between group active:scale-[0.98] transition-all hover:shadow-xl">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner"><Package className="w-5 h-5" /></div>
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Track Orders</h3>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors" />
                </div>
              </Link>
           </div>

           <div className="space-y-5">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 ml-6">SahiMed App</h2>
              <div 
                onClick={handleInstallClick}
                className="bg-primary/5 p-8 rounded-[48px] border border-primary/10 flex flex-col items-center text-center gap-5 cursor-pointer hover:bg-primary/10 transition-all group shadow-sm hover:shadow-xl"
              >
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"><SmartphoneNfc className="w-7 h-7 text-primary" /></div>
                <div>
                  <h3 className="text-base font-black text-gray-900 uppercase tracking-tight">Get SahiMed on Mobile</h3>
                  <p className="text-[10px] text-gray-500 font-bold mt-2 max-w-[220px] uppercase leading-relaxed">Install for a faster, professional clinical shopping experience.</p>
                </div>
                <Button className="rounded-full h-12 px-10 font-black uppercase text-[11px] tracking-[0.2em] gap-3 shadow-xl shadow-primary/20">
                  <Download className="w-4 h-4" /> Add to Home
                </Button>
              </div>
           </div>
        </div>
      </main>
    </div>
  );
}
