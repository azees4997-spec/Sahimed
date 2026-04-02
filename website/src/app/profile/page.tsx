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

  const [addressForm, setAddressForm] = useState({
    id: '',
    tag: 'Home',
    street: '',
    landmark: '',
    pincode: '',
    lat: 0,
    lng: 0
  });

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

  const handleSaveAddress = () => {
    if (!user || !db) return;
    if (!addressForm.street || !addressForm.pincode) {
      toast({ variant: 'destructive', title: "Missing data", description: "Street and Pincode are required." });
      return;
    }

    const payload = {
      tag: addressForm.tag,
      street: addressForm.street,
      landmark: addressForm.landmark,
      pincode: addressForm.pincode,
      lat: addressForm.lat,
      lng: addressForm.lng,
      updatedAt: serverTimestamp()
    };

    if (addressForm.id) {
      setDocumentNonBlocking(doc(db, 'userProfiles', user.uid, 'addresses', addressForm.id), payload, { merge: true });
    } else {
      addDocumentNonBlocking(collection(db, 'userProfiles', user.uid, 'addresses'), { ...payload, createdAt: serverTimestamp() });
    }

    setIsAddressDialogOpen(false);
    toast({ title: "Address secured" });
    setAddressForm({ id: '', tag: 'Home', street: '', landmark: '', pincode: '', lat: 0, lng: 0 });
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const getTagIcon = (tag: string) => {
    switch (tag) {
      case 'Home': return <Home className="w-5 h-5" />;
      case 'Office': return <Briefcase className="w-5 h-5" />;
      default: return <MoreHorizontal className="w-5 h-5" />;
    }
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
          <main className="max-w-md mx-auto px-6 py-32 text-center">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-32 h-32 bg-white rounded-[48px] shadow-2xl flex items-center justify-center mx-auto mb-12 border border-white"
            >
              <User className="w-12 h-12 text-slate-100" />
            </motion.div>
            <h1 className="text-4xl font-black tracking-tighter mb-4 text-slate-900 font-outfit uppercase">SahiMed Account</h1>
            <p className="text-slate-400 font-black text-[10px] tracking-[0.3em] mb-16 leading-relaxed max-w-[280px] mx-auto uppercase">
              Manage your professional health journey in one secure hub.
            </p>
            <Link href="/login" className="w-full">
              <Button className="w-full h-20 rounded-full font-black tracking-[0.3em] shadow-2xl shadow-primary/20 text-xs gap-4 uppercase bg-primary text-white">
                <LogIn className="w-6 h-6" /> Authenticate
              </Button>
            </Link>
            <div className="mt-24 flex items-center justify-center gap-4 py-4 bg-white/40 backdrop-blur-md rounded-[32px] border border-white shadow-xl">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <span className="text-[9px] font-black text-slate-400 tracking-[0.2em] uppercase">Secured SahiMed Portal Matrix</span>
            </div>
          </main>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#F4F7F6] pharma-bg-pattern pb-32">
        <Navbar />
        <main className="max-w-7xl mx-auto px-6 py-12 sm:py-20">
          
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex flex-col md:flex-row items-center gap-10 mb-16 bg-white/40 backdrop-blur-md p-10 sm:p-12 rounded-[56px] shadow-2xl border border-white relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />
            
            <div className="w-16 h-16 bg-primary/10 rounded-[20px] flex items-center justify-center border-4 border-white shadow-xl shrink-0 group-hover:scale-110 transition-transform duration-500 relative z-10">
               <User className="w-8 h-8 text-primary" />
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
                  Level 1 Clinical Status
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
            <div className="lg:col-span-2 space-y-12">
               <motion.div 
                 variants={containerVariants}
                 initial="hidden"
                 animate="show"
                 className="space-y-8"
               >
                  <div className="space-y-4">
                    <h2 className="text-[9px] font-black tracking-[0.4em] text-slate-400 ml-6 uppercase">Order Management</h2>
                    <motion.div variants={itemVariants}>
                      <Link href="/orders" className="block">
                        <div className="bg-white/40 backdrop-blur-md p-6 rounded-[32px] border border-white flex items-center justify-between group active:scale-[0.98] transition-all hover:shadow-2xl shadow-xl hover:bg-white">
                          <div className="flex items-center gap-5">
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-[16px] flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform"><Package className="w-5 h-5" /></div>
                            <div>
                              <h3 className="text-sm font-black text-slate-900 tracking-tight font-outfit uppercase">Order History</h3>
                              <p className="text-[8px] font-bold text-slate-400 tracking-[0.2em] uppercase mt-0.5">Track your clinical supplies</p>
                            </div>
                          </div>
                          <div className="bg-slate-50 w-10 h-10 rounded-full flex items-center justify-center group-hover:bg-primary transition-all">
                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-white transition-all group-hover:translate-x-1" />
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  </div>

                  <div className="space-y-8">
                    <div className="flex items-center justify-between px-6">
                      <h2 className="text-[9px] font-black tracking-[0.4em] text-slate-400 uppercase">Address Management</h2>
                      <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
                        <DialogTrigger asChild>
                          <button onClick={() => setAddressForm({ id: '', tag: 'Home', street: '', landmark: '', pincode: '', lat: 0, lng: 0 })} className="bg-white px-5 py-2.5 rounded-full shadow-lg border border-white text-[9px] font-black text-primary tracking-[0.2em] flex items-center gap-2 hover:scale-105 transition-all uppercase active:scale-95">
                            <Plus className="w-3.5 h-3.5" /> Add New
                          </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl w-[96vw] sm:w-full rounded-[56px] border-none p-0 overflow-hidden shadow-3xl bg-white/90 backdrop-blur-3xl z-[110]">
                          <div className="bg-primary p-12 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12">
                              <MapPin className="w-32 h-32" />
                            </div>
                            <DialogTitle className="text-3xl font-black tracking-tighter uppercase font-outfit">Delivery Point Matrix</DialogTitle>
                            <DialogDescription className="text-[10px] font-black text-white/60 tracking-[0.3em] mt-3 uppercase">
                              Securely register destination coordinates
                            </DialogDescription>
                          </div>
                          <div className="p-10 space-y-8">
                            <div className="space-y-3">
                              <Label className="text-[10px] font-black tracking-[0.2em] text-slate-400 ml-2 uppercase opacity-60">Classification</Label>
                              <Select value={addressForm.tag} onValueChange={(v) => setAddressForm({...addressForm, tag: v})}>
                                <SelectTrigger className="h-16 rounded-[24px] bg-slate-50 border-none font-black text-xs px-6 uppercase tracking-widest shadow-inner">
                                  <SelectValue placeholder="Select Tag" />
                                </SelectTrigger>
                                <SelectContent className="rounded-[32px] border-none shadow-3xl p-2 bg-white/95 backdrop-blur-xl">
                                  <SelectItem value="Home" className="font-black text-[10px] tracking-widest uppercase">Home Registry</SelectItem>
                                  <SelectItem value="Office" className="font-black text-[10px] tracking-widest uppercase">Office Registry</SelectItem>
                                  <SelectItem value="Other" className="font-black text-[10px] tracking-widest uppercase">External Base</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-4">
                              <div className="flex justify-between items-center px-2">
                                <Label className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase opacity-60">Destination Address</Label>
                                <button onClick={handleLocate} className="text-[10px] font-black text-primary tracking-[0.2em] flex items-center gap-2 hover:underline uppercase">
                                  {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
                                  Sync GPS
                                </button>
                              </div>
                              <Input 
                                value={addressForm.street} 
                                onChange={e => setAddressForm({...addressForm, street: e.target.value})}
                                placeholder="HOUSE NO, SECTOR, LOCALITY"
                                className="h-16 rounded-[24px] bg-slate-50 border-none font-black text-xs px-6 uppercase tracking-tight shadow-inner"
                              />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                              <div className="space-y-3">
                                <Label className="text-[10px] font-black tracking-[0.2em] text-slate-400 ml-2 uppercase opacity-60">Reference Marker</Label>
                                <Input 
                                  value={addressForm.landmark} 
                                  onChange={e => setAddressForm({...addressForm, landmark: e.target.value})}
                                  placeholder="LANDMARK (OPTIONAL)"
                                  className="h-16 rounded-[24px] bg-slate-50 border-none font-black text-xs px-6 uppercase tracking-tight shadow-inner"
                                />
                              </div>
                              <div className="space-y-3">
                                <Label className="text-[10px] font-black tracking-[0.2em] text-slate-400 ml-2 uppercase opacity-60">Hub Code</Label>
                                <Input 
                                  value={addressForm.pincode} 
                                  onChange={e => setAddressForm({...addressForm, pincode: e.target.value.replace(/\D/g, '').slice(0, 6)})}
                                  placeholder="6-DIGIT PIN"
                                  className="h-16 rounded-[24px] bg-slate-50 border-none font-black text-xs px-6 uppercase tracking-[0.5em] text-center shadow-inner"
                                />
                              </div>
                            </div>
                            <Button onClick={handleSaveAddress} className="w-full h-20 rounded-full font-black text-xs tracking-[0.3em] gap-4 shadow-2xl shadow-primary/20 bg-primary text-white uppercase active:scale-95 transition-all">
                              <Save className="w-6 h-6" /> Commit Protocol
                            </Button>
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
                          <p className="text-[10px] font-black text-slate-300 tracking-[0.4em] uppercase">No Logistics Protocol Saved</p>
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
                                <p className="text-[11px] font-bold text-slate-900 leading-relaxed line-clamp-2 uppercase tracking-tight">{addr.street}</p>
                                <p className="text-[8px] font-black text-gray-400 mt-2 tracking-[0.2em] uppercase opacity-60">PIN: {addr.pincode}</p>
                              </div>
                            </div>
                            <div className="flex gap-1.5">
                              <Button variant="ghost" size="icon" onClick={() => { setAddressForm(addr); setIsAddressDialogOpen(true); }} className="h-8 w-8 rounded-full bg-white shadow-sm text-slate-300 hover:text-primary active:scale-95"><Edit2 className="w-3.5 h-3.5" /></Button>
                              <Button variant="ghost" size="icon" onClick={() => deleteDocumentNonBlocking(doc(db, 'userProfiles', user.uid, 'addresses', addr.id))} className="h-8 w-8 rounded-full bg-white shadow-sm text-slate-300 hover:text-rose-500 active:scale-95"><Trash2 className="w-3.5 h-3.5" /></Button>
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
                  <h2 className="text-[10px] font-black tracking-[0.4em] text-slate-400 ml-8 uppercase">Application Nexus</h2>
                  <div 
                    onClick={handleInstallClick}
                    className="bg-primary p-12 rounded-[56px] border border-white/20 flex flex-col items-center text-center gap-8 cursor-pointer hover:shadow-primary/30 transition-all group shadow-3xl relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16" />
                    <div className="w-16 h-16 bg-white rounded-[24px] flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-500 relative z-10"><SmartphoneNfc className="w-8 h-8 text-primary" /></div>
                    <div className="relative z-10">
                      <h3 className="text-xl font-black text-white tracking-tight font-outfit uppercase">SahiMed Terminal</h3>
                      <p className="text-[10px] text-white/60 font-black mt-4 max-w-[200px] leading-relaxed tracking-widest uppercase">Install for maximum logistics optimization and push synchronicity.</p>
                    </div>
                    <Button className="w-full rounded-full h-18 font-black text-[10px] tracking-[0.3em] gap-4 shadow-2xl bg-white text-primary hover:bg-slate-50 uppercase active:scale-95 transition-all relative z-10">
                      <Download className="w-5 h-5" /> Integrate Matrix
                    </Button>
                    <div className="flex items-center gap-3 opacity-40 relative z-10">
                       <Sparkles className="w-4 h-4 text-white" />
                       <span className="text-[8px] font-black text-white tracking-[0.4em] uppercase">Premium PWA Integration</span>
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
