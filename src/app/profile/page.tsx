
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
  LocateFixed
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
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
      case 'Home': return <Home className="w-4 h-4" />;
      case 'Office': return <Briefcase className="w-4 h-4" />;
      default: return <MoreHorizontal className="w-4 h-4" />;
    }
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
          <h1 className="text-3xl font-black tracking-tighter mb-4 text-gray-900">SahiMed account</h1>
          <p className="text-gray-400 font-bold text-[10px] tracking-widest mb-12 leading-relaxed max-w-[280px] mx-auto">
            Manage your health journey in one secure hub.
          </p>
          <Link href="/login" className="w-full">
            <Button className="w-full h-18 rounded-full font-black tracking-[0.2em] shadow-2xl shadow-primary/20 text-xs gap-3">
              <LogIn className="w-5 h-5" /> Sign in / Register
            </Button>
          </Link>
          <div className="mt-16 flex items-center justify-center gap-3">
            <ShieldCheck className="w-4 h-4 text-green-500" />
            <span className="text-[9px] font-black text-gray-400 tracking-widest">Secured SahiMed portal</span>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8] page-transition-wrapper">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-10 sm:py-20">
        
        <div className="flex flex-col md:flex-row items-center gap-8 mb-10 bg-white p-8 sm:p-10 rounded-[48px] shadow-sm border border-gray-100">
          <div className="w-20 h-20 bg-primary/5 rounded-3xl flex items-center justify-center border-4 border-white shadow-xl shrink-0">
             <User className="w-10 h-10 text-primary" />
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-1 tracking-tighter">
              {profile?.name || user?.email?.split('@')[0] || 'SahiMed member'}
            </h1>
            <p className="text-gray-400 font-black text-[10px] tracking-widest">
              {user.phoneNumber || user.email || 'Verified customer'}
            </p>
          </div>
          <div className="md:ml-auto">
            <Button 
              variant="ghost" 
              onClick={handleLogout}
              className="rounded-full h-12 px-8 font-black text-[11px] tracking-[0.2em] text-red-500 hover:bg-red-50 gap-3"
            >
              <LogOut className="w-4 h-4" /> Sign out
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <div className="space-y-8">
              <div className="space-y-5">
                <h2 className="text-[10px] font-black tracking-[0.3em] text-gray-400 ml-6">Shopping history</h2>
                <Link href="/orders" className="block">
                  <div className="bg-white p-6 rounded-[32px] border border-gray-100 flex items-center justify-between group active:scale-[0.98] transition-all hover:shadow-xl">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner"><Package className="w-5 h-5" /></div>
                      <h3 className="text-sm font-black text-gray-900 tracking-tight">Track orders</h3>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors" />
                  </div>
                </Link>
              </div>

              <div className="space-y-5">
                <div className="flex items-center justify-between px-6">
                  <h2 className="text-[10px] font-black tracking-[0.3em] text-gray-400">Clinical delivery points</h2>
                  <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
                    <DialogTrigger asChild>
                      <button onClick={() => setAddressForm({ id: '', tag: 'Home', street: '', landmark: '', pincode: '', lat: 0, lng: 0 })} className="text-[9px] font-black text-primary tracking-widest flex items-center gap-1.5 hover:underline">
                        <Edit2 className="w-3 h-3" /> Add new
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md rounded-[40px] border-none p-0 overflow-hidden shadow-3xl">
                      <div className="bg-primary p-8 text-white">
                        <DialogTitle className="text-2xl font-black tracking-tight">Add delivery point</DialogTitle>
                      </div>
                      <div className="p-8 space-y-6">
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black tracking-widest text-gray-400 ml-1">Tag as</Label>
                          <Select value={addressForm.tag} onValueChange={(v) => setAddressForm({...addressForm, tag: v})}>
                            <SelectTrigger className="h-14 rounded-2xl bg-gray-50 border-none font-bold">
                              <SelectValue placeholder="Select tag" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-none shadow-2xl">
                              <SelectItem value="Home" className="font-bold">Home</SelectItem>
                              <SelectItem value="Office" className="font-bold">Office</SelectItem>
                              <SelectItem value="Other" className="font-bold">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center px-1">
                            <Label className="text-[10px] font-black tracking-widest text-gray-400">Street address</Label>
                            <button onClick={handleLocate} className="text-[8px] font-black text-primary tracking-widest flex items-center gap-1">
                              {isLocating ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <LocateFixed className="w-2.5 h-2.5" />}
                              Autofill
                            </button>
                          </div>
                          <Input 
                            value={addressForm.street} 
                            onChange={e => setAddressForm({...addressForm, street: e.target.value})}
                            placeholder="House No, Street Name"
                            className="h-14 rounded-2xl bg-gray-50 border-none font-bold"
                          />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black tracking-widest text-gray-400 ml-1">Landmark (Optional)</Label>
                          <Input 
                            value={addressForm.landmark} 
                            onChange={e => setAddressForm({...addressForm, landmark: e.target.value})}
                            placeholder="Near SahiMed Hub"
                            className="h-14 rounded-2xl bg-gray-50 border-none font-bold"
                          />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black tracking-widest text-gray-400 ml-1">Pincode</Label>
                          <Input 
                            value={addressForm.pincode} 
                            onChange={e => setAddressForm({...addressForm, pincode: e.target.value.replace(/\D/g, '').slice(0, 6)})}
                            placeholder="6-digit PIN"
                            className="h-14 rounded-2xl bg-gray-50 border-none font-bold"
                          />
                        </div>
                        <Button onClick={handleSaveAddress} className="w-full h-16 rounded-full font-black text-xs tracking-widest gap-3 shadow-xl">
                          <Save className="w-4 h-4" /> Save address
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <div className="space-y-4">
                  {addressesLoading ? (
                    <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                  ) : (!addresses || addresses.length === 0) ? (
                    <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm text-center">
                      <MapPin className="w-8 h-8 text-gray-100 mx-auto mb-3" />
                      <p className="text-[10px] font-black text-gray-300 tracking-widest">No addresses saved</p>
                    </div>
                  ) : addresses.map((addr) => (
                    <div key={addr.id} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all">
                      <div className="flex items-start justify-between relative z-10">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                            {getTagIcon(addr.tag)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-black text-[10px] text-primary tracking-widest">{addr.tag}</span>
                              {addr.lat !== 0 && <span className="w-1 h-1 rounded-full bg-green-500" title="GPS Verified" />}
                            </div>
                            <p className="text-xs font-bold text-gray-900 leading-relaxed line-clamp-2">{addr.street}</p>
                            <p className="text-[9px] font-black text-gray-400 mt-1">PIN: {addr.pincode}</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => { setAddressForm(addr); setIsAddressDialogOpen(true); }} className="h-8 w-8 rounded-full text-gray-300 hover:text-primary"><Edit2 className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteDocumentNonBlocking(doc(db, 'userProfiles', user.uid, 'addresses', addr.id))} className="h-8 w-8 rounded-full text-gray-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
           </div>

           <div className="space-y-5">
              <h2 className="text-[10px] font-black tracking-[0.3em] text-gray-400 ml-6">SahiMed App</h2>
              <div 
                onClick={handleInstallClick}
                className="bg-primary/5 p-8 rounded-[48px] border border-primary/10 flex flex-col items-center text-center gap-5 cursor-pointer hover:bg-primary/10 transition-all group shadow-sm hover:shadow-xl"
              >
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"><SmartphoneNfc className="w-7 h-7 text-primary" /></div>
                <div>
                  <h3 className="text-base font-black text-gray-900 tracking-tight">Get SahiMed on mobile</h3>
                  <p className="text-[10px] text-gray-500 font-bold mt-2 max-w-[220px] leading-relaxed">Install for a faster, professional clinical shopping experience.</p>
                </div>
                <Button className="rounded-full h-12 px-10 font-black text-[11px] tracking-[0.2em] gap-3 shadow-xl shadow-primary/20">
                  <Download className="w-4 h-4" /> Add to home
                </Button>
              </div>
           </div>
        </div>
      </main>
    </div>
  );
}
