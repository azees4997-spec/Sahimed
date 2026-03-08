
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
  Edit2
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
import Link from 'next/link';
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { signOut } from 'firebase/auth';
import { doc, serverTimestamp } from 'firebase/firestore';
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

  // --- Fetch Saved Profile for Address Data ---
  const profileRef = useMemoFirebase(() => (db && user) ? doc(db, 'userProfiles', user.uid) : null, [db, user]);
  const { data: profile } = useDoc(profileRef);

  const [addressForm, setAddressForm] = useState({
    street: '',
    landmark: '',
    pincode: ''
  });

  useEffect(() => {
    if (profile?.address) {
      setAddressForm({
        street: profile.address.street || '',
        landmark: profile.address.landmark || '',
        pincode: profile.address.pincode || ''
      });
    }
  }, [profile]);

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

  const handleSaveAddress = () => {
    if (!user || !db) return;
    if (!addressForm.street || !addressForm.pincode) {
      toast({ variant: 'destructive', title: "Missing Data", description: "Street and Pincode are required." });
      return;
    }

    setDocumentNonBlocking(doc(db, 'userProfiles', user.uid), {
      address: {
        street: addressForm.street,
        landmark: addressForm.landmark,
        pincode: addressForm.pincode
      },
      updatedAt: serverTimestamp()
    }, { merge: true });

    setIsAddressDialogOpen(false);
    toast({ title: "Address Secured", description: "Your clinical delivery point is updated." });
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
        
        <div className="flex flex-col md:flex-row items-center gap-8 mb-10 bg-white p-8 sm:p-10 rounded-[48px] shadow-sm border border-gray-100">
          <div className="w-20 h-20 bg-primary/5 rounded-3xl flex items-center justify-center border-4 border-white shadow-xl shrink-0">
             <User className="w-10 h-10 text-primary" />
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-1 uppercase tracking-tighter">
              {profile?.name || user?.email?.split('@')[0] || 'SahiMed Member'}
            </h1>
            <p className="text-gray-400 font-black text-[10px] uppercase tracking-widest">
              {user.phoneNumber || user.email || 'Verified Customer'}
            </p>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <div className="space-y-8">
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
                <div className="flex items-center justify-between px-6">
                  <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Delivery Address</h2>
                  <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
                    <DialogTrigger asChild>
                      <button className="text-[9px] font-black text-primary uppercase tracking-widest flex items-center gap-1.5 hover:underline">
                        <Edit2 className="w-3 h-3" /> {profile?.address ? 'Update' : 'Add New'}
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md rounded-[40px] border-none p-0 overflow-hidden shadow-3xl">
                      <div className="bg-primary p-8 text-white">
                        <DialogTitle className="text-2xl font-black uppercase tracking-tight">Clinical Delivery Point</DialogTitle>
                      </div>
                      <div className="p-8 space-y-6">
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Street Address</Label>
                          <Input 
                            value={addressForm.street} 
                            onChange={e => setAddressForm({...addressForm, street: e.target.value})}
                            placeholder="House No, Street Name"
                            className="h-14 rounded-2xl bg-gray-50 border-none font-bold"
                          />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Landmark (Optional)</Label>
                          <Input 
                            value={addressForm.landmark} 
                            onChange={e => setAddressForm({...addressForm, landmark: e.target.value})}
                            placeholder="Near SahiMed Hub"
                            className="h-14 rounded-2xl bg-gray-50 border-none font-bold"
                          />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Pincode</Label>
                          <Input 
                            value={addressForm.pincode} 
                            onChange={e => setAddressForm({...addressForm, pincode: e.target.value.replace(/\D/g, '').slice(0, 6)})}
                            placeholder="6-digit PIN"
                            className="h-14 rounded-2xl bg-gray-50 border-none font-bold"
                          />
                        </div>
                        <Button onClick={handleSaveAddress} className="w-full h-16 rounded-full font-black uppercase text-xs tracking-widest gap-3 shadow-xl">
                          <Save className="w-4 h-4" /> Save Address
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />
                  {profile?.address ? (
                    <div className="space-y-4 relative z-10">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-gray-900 uppercase leading-relaxed line-clamp-2">{profile.address.street}</p>
                          {profile.address.landmark && (
                            <p className="text-[10px] font-bold text-gray-400 uppercase mt-1 flex items-center gap-1.5">
                              <Building2 className="w-3 h-3" /> {profile.address.landmark}
                            </p>
                          )}
                          <p className="text-[10px] font-black text-primary uppercase mt-2 flex items-center gap-1.5">
                            <Hash className="w-3 h-3" /> PIN: {profile.address.pincode}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 relative z-10">
                      <MapPin className="w-8 h-8 text-gray-100 mx-auto mb-3" />
                      <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No address saved</p>
                    </div>
                  )}
                </div>
              </div>
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
