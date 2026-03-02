
"use client"

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Package, 
  MapPin, 
  Heart, 
  LogOut, 
  ChevronRight, 
  Settings, 
  Smartphone, 
  Download, 
  ShieldCheck,
  SmartphoneNfc
} from 'lucide-react';
import Link from 'next/link';
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export default function ProfilePage() {
  const { user } = useUser();
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
        toast({ title: "Welcome!", description: "HealthLink is installing on your home screen." });
      }
      setDeferredPrompt(null);
    } else {
      toast({ 
        title: "PWA Installation", 
        description: "To install, tap the Share icon and then 'Add to Home Screen' in your browser menu." 
      });
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-[#F8F8F8] page-transition-wrapper">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-6 md:py-16">
        
        {/* User Intro */}
        <div className="flex flex-col md:flex-row items-center gap-6 mb-8 bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
          <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center border-2 border-white shadow-sm shrink-0">
             <User className="w-8 h-8 text-primary" />
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-2xl font-black text-gray-900 mb-0.5 uppercase tracking-tighter">
              {user?.email?.split('@')[0] || 'Patient Access'}
            </h1>
            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest flex items-center justify-center md:justify-start gap-1.5">
              <Smartphone className="w-3 h-3" /> {user?.email || 'Guest User'}
            </p>
          </div>
          <div className="md:ml-auto">
            <Button 
              variant="ghost" 
              onClick={handleLogout}
              className="rounded-full h-10 px-6 font-black text-[10px] uppercase tracking-widest text-red-500 hover:bg-red-50 gap-2"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           
           {/* Section 1: Account */}
           <div className="space-y-4">
              <h2 className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 ml-4">Account Dashboard</h2>
              
              <Link href="/orders" className="block">
                <div className="bg-white p-5 rounded-[24px] border border-gray-100 flex items-center justify-between group hover:shadow-lg transition-all active:scale-95">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-gray-900 uppercase">Order History</h3>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">Refill clinical supplies</p>
                    </div>
                  </div>
                  <ChevronRight className="w-3 h-3 text-gray-300" />
                </div>
              </Link>

              <Link href="/checkout" className="block">
                <div className="bg-white p-5 rounded-[24px] border border-gray-100 flex items-center justify-between group hover:shadow-lg transition-all active:scale-95">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-gray-900 uppercase">Addresses</h3>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">Home & office hubs</p>
                    </div>
                  </div>
                  <ChevronRight className="w-3 h-3 text-gray-300" />
                </div>
              </Link>
           </div>

           {/* Section 2: Flutter-like App Integration */}
           <div className="space-y-4">
              <h2 className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 ml-4">App Integration</h2>
              
              <div 
                onClick={handleInstallClick}
                className="bg-primary/5 p-6 rounded-[32px] border border-primary/10 flex flex-col items-center text-center gap-4 cursor-pointer hover:bg-primary/10 transition-colors group"
              >
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                  <SmartphoneNfc className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Add to Home Screen</h3>
                  <p className="text-[10px] text-gray-500 font-bold mt-1 max-w-[200px] uppercase tracking-wide">Install HealthLink for a faster, professional clinical experience.</p>
                </div>
                <Button className="rounded-full h-10 px-8 font-black uppercase text-[10px] tracking-widest gap-2 shadow-lg shadow-primary/20">
                  <Download className="w-3.5 h-3.5" /> Install App
                </Button>
              </div>

              <div className="bg-white p-5 rounded-[24px] border border-gray-100 flex items-center justify-between group active:scale-95">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-gray-900 uppercase">Clinical Trust</h3>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">100% Genuine Supplies</p>
                    </div>
                  </div>
                  <Settings className="w-3 h-3 text-gray-300" />
                </div>
           </div>

        </div>
      </main>
    </div>
  );
}
