
"use client"

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldCheck, ArrowLeft, Smartphone, ChevronRight, Loader2, Sparkles, Zap, Shield } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '@/components/PageTransition';

function LoginForm() {
  const [step, setStep] = useState(1); 
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuth();
  const { toast } = useToast();

  const redirectPath = searchParams.get('redirect') || '/';

  useEffect(() => {
    if (typeof window !== 'undefined' && !(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
        }
      });
    }
  }, [auth]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length !== 10) {
      toast({ variant: 'destructive', title: 'Invalid Phone', description: 'Please enter a valid 10-digit number.' });
      return;
    }
    
    setLoading(true);
    try {
      const appVerifier = (window as any).recaptchaVerifier;
      const formatPhone = `+91${phone}`;
      const result = await signInWithPhoneNumber(auth, formatPhone, appVerifier);
      setConfirmationResult(result);
      setStep(2);
      toast({ title: 'OTP Sent', description: `Check your phone for the code.` });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message || 'Failed to send OTP.' });
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.clear();
        (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast({ variant: 'destructive', title: 'Invalid OTP', description: 'Please enter the 6-digit code.' });
      return;
    }

    setLoading(true);
    try {
      if (confirmationResult) {
        await confirmationResult.confirm(otp);
        toast({ title: 'Welcome!', description: 'Your session is now active.' });
        router.push(redirectPath);
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Invalid Code', description: 'The OTP entered is incorrect.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7F6] pharma-bg-pattern flex items-center justify-center p-6 sm:p-8">
      <div id="recaptcha-container"></div>
      
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="max-w-md w-full"
      >
        <Card className="rounded-[40px] shadow-3xl border-none overflow-hidden bg-white/80 backdrop-blur-3xl border border-white mx-auto relative group">
          <CardHeader className="text-center p-8 sm:p-10 bg-primary text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12 scale-150">
               <Zap className="w-48 h-48" />
            </div>
            
            <Link href="/" className="absolute top-10 left-10 p-4 bg-white/10 rounded-full hover:bg-white/20 transition-all hover:scale-110 active:scale-95 z-10">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            
            <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white/20 rounded-[40px] flex items-center justify-center mx-auto mb-8 backdrop-blur-md relative z-10 border border-white/20 shadow-xl group hover:scale-110 transition-transform duration-500">
              <Smartphone className="w-12 h-12 text-white group-hover:rotate-12 transition-transform" />
            </div>
            
            <div className="space-y-1 relative z-10">
              <CardTitle className="text-2xl sm:text-3xl font-black font-outfit mb-0.5 tracking-tighter uppercase leading-none">Login or Sign Up</CardTitle>
              <CardDescription className="text-white/70 uppercase text-[9px] font-black tracking-widest leading-none">Access the Clinical Ecosystem</CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="p-8 sm:p-10">
            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.form 
                  key="step1"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  onSubmit={handleSendOtp} 
                  className="space-y-8"
                >
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block opacity-60">Mobile Number</label>
                    <div className="relative group">
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center h-full px-6 border-r-2 border-slate-100 group-focus-within:border-primary/20 transition-colors bg-slate-50/50 rounded-l-[24px]">
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">+91</span>
                      </div>
                      <Input 
                        type="tel"
                        placeholder="Enter 10 Digit Number"
                        maxLength={10}
                        className="h-16 pl-24 rounded-[24px] bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white text-sm font-black tracking-widest transition-all placeholder:text-slate-300 shadow-inner"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={loading} className="w-full h-20 rounded-full font-black uppercase text-xs tracking-[0.4em] gap-4 shadow-2xl shadow-primary/30 active:scale-95 transition-all bg-primary hover:scale-[1.02] border-4 border-white">
                    {loading ? <Loader2 className="animate-spin" /> : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Request OTP
                        <ChevronRight className="w-4 h-4 ml-auto" />
                      </>
                    )}
                  </Button>
                </motion.form>
              ) : (
                <motion.form 
                  key="step2"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  onSubmit={handleVerifyOtp} 
                  className="space-y-8"
                >
                  <div className="text-center space-y-2">
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest opacity-60">OTP sent to</p>
                    <div className="bg-primary/5 py-3 rounded-2xl border border-primary/10">
                      <span className="text-primary font-black tracking-widest">+91 {phone}</span>
                    </div>
                    <Button variant="link" onClick={() => { setStep(1); setOtp(''); }} className="text-[9px] font-black text-primary p-0 h-auto uppercase tracking-widest mt-1 hover:underline">Change Number</Button>
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block text-center opacity-60">Enter 6-Digit OTP</label>
                    <div className="relative">
                      <Input 
                        type="text"
                        placeholder="······"
                        maxLength={6}
                        className="h-20 rounded-[28px] bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white font-black text-4xl text-center tracking-[0.5em] shadow-inner px-8 transition-all"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        required
                      />
                    </div>
                  </div>
                  
                  <Button type="submit" disabled={loading} className="w-full h-16 rounded-full font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary/30 active:scale-95 transition-all bg-primary hover:scale-[1.02] border-4 border-white">
                    {loading ? <Loader2 className="animate-spin" /> : "Verify & Login"}
                  </Button>
                  
                  <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-60">
                    Didn't receive OTP? <Button variant="link" onClick={handleSendOtp} className="text-[10px] p-0 h-auto text-primary font-black uppercase tracking-widest hover:underline">Resend</Button>
                  </p>
                </motion.form>
              )}
            </AnimatePresence>

            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-14 pt-10 border-t border-slate-100 flex items-center justify-center gap-4"
            >
               <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center">
                 <Shield className="w-6 h-6 text-emerald-500" />
               </div>
               <div className="flex flex-col gap-1 leading-none">
                 <p className="text-[9px] text-emerald-600 font-black uppercase tracking-[0.3em]">SahiMed Firewall Active</p>
                 <p className="text-[8px] text-slate-300 font-black uppercase tracking-[0.2em]">Bank-Grade Security Layer</p>
               </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <PageTransition>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#F4F7F6]"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>}>
        <LoginForm />
      </Suspense>
    </PageTransition>
  );
}
