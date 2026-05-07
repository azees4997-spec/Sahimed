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
  LogIn,
  Building2,
  Hash,
  Save,
  Edit2,
  Home,
  Briefcase,
  MoreHorizontal,
  Trash2,
  LocateFixed,
  Plus,
  Sparkles,
  Zap,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger 
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from 'next/link';
import { useUser, useAuth, useFirestore, useDoc, useCollection, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { signOut } from 'firebase/auth';
import { doc, collection, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '@/components/PageTransition';
import AddressForm from '@/components/AddressForm';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20
    } as any
  }
};

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const profileRef = useMemoFirebase(() => (db && user) ? doc(db, 'userProfiles', user.uid) : null, [db, user]);
  const { data: profile } = useDoc(profileRef);

  const addressesQuery = useMemoFirebase(() => (db && user) ? query(collection(db, 'userProfiles', user.uid, 'addresses'), orderBy('createdAt', 'desc')) : null, [db, user]);
  const { data: addresses, isLoading: addressesLoading } = useCollection(addressesQuery);

  const [addressForm, setAddressForm] = useState<any>(null);

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
        title: "PWA installation", 
        description: "Tap the Share icon and then 'Add to Home Screen'." 
      });
    }
  };

  const handleLocate = () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18`);
            const data = await response.json();
            if (data && data.address) {
              setAddressForm(prev => ({
                ...prev,
                lat: latitude,
                lng: longitude,
                street: data.display_name,
                pincode: data.address.postcode?.replace(/\s/g, '') || prev.pincode
              }));
              toast({ title: "Coordinates locked" });
            }
          } catch (e) {
            toast({ variant: 'destructive', title: "Geocoding failed" });
          } finally {
            setIsLocating(false);
          }
        },
        () => {
          setIsLocating(false);
          toast({ variant: 'destructive', title: "GPS denied" });
        }
      );
    }
  };

  const handleSaveAddress = (data: any) => {
    if (!user || !db) return;

    const payload = {
      patientName: data.patientName,
      phoneNumber: data.phoneNumber,
      houseNumber: data.houseNumber,
      apartmentName: data.apartmentName || '',
      street: data.street,
      landmark: data.landmark || '',
      city: data.city,
      state: data.state,
      pincode: data.pincode,
      tag: data.tag,
      lat: data.lat || 0,
      lng: data.lng || 0,
      updatedAt: serverTimestamp()
    };

    if (addressForm?.id) {
      setDocumentNonBlocking(doc(db, 'userProfiles', user.uid, 'addresses', addressForm.id), payload, { merge: true });
    } else {
      addDocumentNonBlocking(collection(db, 'userProfiles', user.uid, 'addresses'), { ...payload, createdAt: serverTimestamp() });
    }

    setIsAddressDialogOpen(false);
    toast({ title: "Address secured" });
    setAddressForm(null);

    // [STABILIZATION] SYNC TO MONGODB: Ensure real-time mirror after address change
    (async () => {
      try {
        const idToken = await user.getIdToken();
        await fetch('/api/user/sync', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          }
        });
      } catch (err) {
        console.warn("[Sync] Address sync failed", err);
      }
    })();
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const getTagIcon = (tag: string) => {
    if (tag === 'Home') return <Home className="w-5 h-5" />;
    if (tag === 'Office') return <Briefcase className="w-5 h-5" />;
    return <MoreHorizontal className="w-5 h-5" />;
  };

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F7F6]">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-10 h-10 text-primary" />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-[#F4F7F6] pharma-bg-pattern">
          <Navbar />
          <main className="max-w-md mx-auto px-6 py-20 text-center flex flex-col items-center justify-center min-h-[60vh]">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-24 h-24 bg-white rounded-[32px] shadow-xl flex items-center justify-center mx-auto mb-8 border border-white"
            >
              <User className="w-10 h-10 text-slate-200" />
            </motion.div>
            <h1 className="text-3xl font-black tracking-tighter mb-8 text-slate-900 font-outfit uppercase">SahiMed Account</h1>
            
            <Link href="/login" className="w-full">
              <Button className="w-full h-16 rounded-full font-black tracking-[0.2em] shadow-xl shadow-primary/20 text-[10px] gap-3 uppercase bg-primary text-white active:scale-95 transition-all">
                <LogIn className="w-5 h-5" /> Login or Sign Up
              </Button>
            </Link>

            <p className="mt-12 text-[8px] font-black text-slate-300 tracking-[0.3em] uppercase">
              Join 10L+ Trusted Users
            </p>
          </main>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#F4F7F6] pharma-bg-pattern pb-32">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
          
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex flex-col md:flex-row items-center gap-6 mb-10 bg-white/40 backdrop-blur-md p-6 sm:p-8 rounded-[40px] shadow-xl border border-white relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -mr-24 -mt-24" />
            
            <div className="w-12 h-12 bg-primary/10 rounded-[16px] flex items-center justify-center border-2 border-white shadow-lg shrink-0 group-hover:scale-110 transition-transform duration-500 relative z-10">
               <User className="w-6 h-6 text-primary" />
            </div>
            <div className="text-center md:text-left relative z-10">
              <h1 className="text-2xl sm:text-4xl font-black text-slate-900 mb-1 tracking-tighter font-outfit uppercase">
                {profile?.name || user?.email?.split('@')[0] || 'SahiMed member'}
              </h1>
              <div className="flex flex-col sm:flex-row items-center gap-2 opacity-60">
                <p className="text-slate-900 font-black text-[8px] tracking-[0.2em] uppercase">
                  {user.phoneNumber || user.email || 'Verified Customer'}
                </p>
                <div className="hidden sm:block w-1 h-1 rounded-full bg-slate-300" />
                <p className="text-slate-900 font-black text-[8px] tracking-[0.2em] uppercase">
                  Verified Profile
                </p>
              </div>
            </div>
            <div className="md:ml-auto relative z-10">
              <Button 
                variant="ghost" 
                onClick={handleLogout}
                className="rounded-full h-10 px-6 font-black text-[9px] tracking-[0.3em] text-rose-500 hover:bg-rose-50 gap-2 uppercase active:scale-95 transition-all"
              >
                <LogOut className="w-4 h-4" /> Logout
              </Button>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            <div className="lg:col-span-2 space-y-8">
               <motion.div 
                 variants={containerVariants}
                 initial="hidden"
                 animate="show"
                 className="space-y-6"
               >
                  <div className="space-y-3">
                    <h2 className="text-[9px] font-black tracking-[0.4em] text-slate-400 ml-4 uppercase">Order Management</h2>
                    <motion.div variants={itemVariants}>
                      <Link href="/orders" className="block">
                        <div className="bg-white/40 backdrop-blur-md p-5 rounded-[24px] border border-white flex items-center justify-between group active:scale-[0.98] transition-all hover:shadow-xl shadow-lg hover:bg-white">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-[12px] flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform"><Package className="w-4 h-4" /></div>
                            <div>
                              <h3 className="text-xs font-black text-slate-900 tracking-tight font-outfit uppercase">Order History</h3>
                              <p className="text-[7px] font-bold text-slate-400 tracking-[0.2em] uppercase mt-0.5">Track items</p>
                            </div>
                          </div>
                          <div className="bg-slate-50 w-8 h-8 rounded-full flex items-center justify-center group-hover:bg-primary transition-all">
                            <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-white transition-all group-hover:translate-x-1" />
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between px-4">
                      <h2 className="text-[9px] font-black tracking-[0.4em] text-slate-400 uppercase">Address Management</h2>
                      <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
                        <DialogTrigger asChild>
                          <button onClick={() => setAddressForm({ id: '', tag: 'Home', street: '', landmark: '', pincode: '', lat: 0, lng: 0 })} className="bg-white px-4 py-2 rounded-full border border-slate-100 text-[8px] font-black text-primary tracking-[0.2em] flex items-center gap-1.5 hover:bg-slate-50 transition-all uppercase active:scale-95">
                            <Plus className="w-3 h-3" /> Add New
                          </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md w-[94vw] rounded-[40px] border-none p-0 overflow-hidden shadow-3xl bg-white z-[110]">
                          <div className="bg-primary p-8 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
                              <MapPin className="w-20 h-20" />
                            </div>
                            <DialogTitle className="text-xl font-black tracking-tighter uppercase font-outfit">Address Details</DialogTitle>
                            <DialogDescription className="text-[8px] font-black text-white/60 tracking-[0.2em] mt-2 uppercase">
                              Save Delivery Information
                            </DialogDescription>
                          </div>
                          <div className="p-6 overflow-y-auto max-h-[70vh]">
                            <AddressForm 
                              initialData={addressForm || {}}
                              onSave={handleSaveAddress}
                              isLoading={false}
                            />
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    
                    <div className="space-y-6">
                      {addressesLoading ? (
                        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                      ) : (!addresses || addresses.length === 0) ? (
                        <div className="bg-white/40 backdrop-blur-md p-16 rounded-[48px] border border-white shadow-xl text-center">
                          <MapPin className="w-12 h-12 text-slate-200 mx-auto mb-6" />
                          <p className="text-[10px] font-black text-slate-300 tracking-[0.4em] uppercase">No saved addresses</p>
                        </div>
                      ) : addresses.map((addr) => (
                        <motion.div 
                          key={addr.id} 
                          variants={itemVariants}
                          className="bg-white/40 backdrop-blur-md p-6 rounded-[32px] border border-white shadow-xl relative overflow-hidden group hover:shadow-2xl transition-all hover:bg-white"
                        >
                          <div className="flex items-start justify-between relative z-10">
                            <div className="flex items-start gap-5">
                              <div className="w-12 h-12 bg-primary/10 text-primary rounded-[16px] flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-all">
                                {getTagIcon(addr.tag)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <span className="font-black text-[9px] text-primary tracking-[0.2em] uppercase">{addr.tag}</span>
                                  {addr.lat !== 0 && <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" title="GPS Verified" />}
                                </div>
                                <p className="text-[11px] font-bold text-slate-900 leading-tight uppercase tracking-tight">
                                  {addr.houseNumber}{addr.apartmentName ? `, ${addr.apartmentName}` : ''}
                                </p>
                                <p className="text-[10px] font-medium text-slate-600 leading-tight uppercase tracking-tight mt-1">{addr.street}</p>
                                <p className="text-[8px] font-black text-gray-400 mt-2 tracking-[0.2em] uppercase opacity-60">{addr.city}, {addr.state} - {addr.pincode}</p>
                              </div>
                            </div>
                            <div className="flex gap-1.5">
                              <Button variant="ghost" size="icon" onClick={() => { setAddressForm(addr); setIsAddressDialogOpen(true); }} className="h-8 w-8 rounded-full bg-white shadow-sm text-slate-300 hover:text-primary active:scale-95"><Edit2 className="w-3.5 h-3.5" /></Button>
                              <Button variant="ghost" size="icon" onClick={async () => {
                                await deleteDocumentNonBlocking(doc(db, 'userProfiles', user.uid, 'addresses', addr.id));
                                // [STABILIZATION] SYNC TO MONGODB: Ensure real-time mirror after address deletion
                                try {
                                  const idToken = await user.getIdToken();
                                  await fetch('/api/user/sync', {
                                    method: 'POST',
                                    headers: { 
                                      'Content-Type': 'application/json',
                                      'Authorization': `Bearer ${idToken}`
                                    }
                                  });
                                  toast({ title: "Address removed" });
                                } catch (err) {
                                  console.warn("[Sync] Address deletion sync failed", err);
                                }
                              }} className="h-8 w-8 rounded-full bg-white shadow-sm text-slate-300 hover:text-rose-500 active:scale-95"><Trash2 className="w-3.5 h-3.5" /></Button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
               </motion.div>
            </div>

            <div className="lg:col-span-1">
               <motion.div 
                 initial={{ x: 20, opacity: 0 }}
                 animate={{ x: 0, opacity: 1 }}
                 transition={{ delay: 0.5 }}
                 className="space-y-8 sticky top-32"
               >
                  <h2 className="text-[9px] font-black tracking-[0.4em] text-slate-400 ml-4 uppercase">SahiMed App</h2>
                  <div 
                    onClick={handleInstallClick}
                    className="bg-primary p-8 rounded-[40px] border border-white/20 flex flex-col items-center text-center gap-6 cursor-pointer hover:shadow-primary/30 transition-all group shadow-2xl relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-12 -mt-12" />
                    <div className="w-12 h-12 bg-white rounded-[16px] flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-500 relative z-10">
                      <Smartphone className="w-6 h-6 text-primary" />
                    </div>
                    <div className="relative z-10">
                      <h3 className="text-lg font-black text-white tracking-tight font-outfit uppercase leading-none">Download SahiMed App</h3>
                      <p className="text-[8px] text-white/50 font-black mt-3 max-w-[180px] leading-relaxed tracking-widest uppercase italic">Install for premium healthcare logistics.</p>
                    </div>
                    <Button className="w-full rounded-full h-14 font-black text-[9px] tracking-[0.2em] gap-3 shadow-xl bg-white text-primary hover:bg-slate-50 uppercase active:scale-95 transition-all relative z-10">
                      <Download className="w-4 h-4" /> Download Now
                    </Button>
                    <div className="flex items-center gap-2 opacity-30 relative z-10">
                       <Zap className="w-3 h-3 text-white" />
                       <span className="text-[7px] font-black text-white tracking-[0.3em] uppercase">PWA Optimized</span>
                    </div>
                  </div>
                  
                  <div className="bg-white/40 backdrop-blur-md p-8 rounded-[40px] border border-white text-center shadow-xl">
                      <div className="flex items-center justify-center gap-3 py-2 text-slate-400">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-[8px] font-black tracking-[0.4em] uppercase">Clinical Encryption Active</span>
                      </div>
                  </div>
               </motion.div>
            </div>
          </div>
        </main>
      </div>
    </PageTransition>
  );
}
