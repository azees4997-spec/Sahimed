
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
    <div className="fixed inset-0 h-[100dvh] bg-[#F4F7F6] pharma-bg-pattern flex flex-col items-center justify-start p-0 sm:p-8 overflow-hidden">
      <div id="recaptcha-container"></div>
      
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="max-w-md w-full h-full sm:h-auto"
      >
        <Card className="rounded-none sm:rounded-[40px] shadow-3xl border-none overflow-hidden bg-white/80 backdrop-blur-3xl border border-white mx-auto relative group w-full h-full sm:h-auto flex flex-col">
          <CardHeader className="text-center p-4 sm:p-10 bg-primary text-white relative overflow-hidden shrink-0">
            <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12 scale-150">
               <Zap className="w-48 h-48" />
            </div>
            
            <Link href="/" className="absolute top-6 left-6 p-3 sm:top-10 sm:left-10 sm:p-4 bg-white/10 rounded-full hover:bg-white/20 transition-all hover:scale-110 active:scale-95 z-10">
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
            
            <div className="w-14 h-14 sm:w-28 sm:h-28 bg-white/20 rounded-[24px] sm:rounded-[40px] flex items-center justify-center mx-auto mb-4 sm:mb-8 backdrop-blur-md relative z-10 border border-white/20 shadow-xl group hover:scale-110 transition-transform duration-500">
              <Smartphone className="w-7 h-7 sm:w-12 sm:h-12 text-white group-hover:rotate-12 transition-transform" />
            </div>
            
            <div className="space-y-1 relative z-10">
              <CardTitle className="text-xl sm:text-3xl font-black font-outfit mb-0.5 tracking-tighter uppercase leading-none">Login or Sign Up</CardTitle>
            </div>
          </CardHeader>
          
          <CardContent className="p-6 sm:p-10 pb-12 sm:pb-10">
            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.form 
                  key="step1"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  onSubmit={handleSendOtp} 
                  className="space-y-4 sm:space-y-8"
                >
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block opacity-60">Mobile Number</label>
                    <div className="relative group">
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center h-full px-6 border-r-2 border-slate-100 group-focus-within:border-primary/20 transition-colors bg-slate-50/50 rounded-l-[24px]">
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">+91</span>
                      </div>
                      <Input 
                        type="tel"
                        placeholder="Enter 10 Digit Number"
                        maxLength={10}
                        className="h-14 sm:h-16 pl-24 rounded-[24px] bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white text-sm font-black tracking-widest transition-all placeholder:text-slate-300 shadow-inner"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        required
                      />
                    </div>

                    <motion.div 
                      key="illustration"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ 
                        opacity: 1, 
                        scale: 1,
                        y: [-5, 5, -5]
                      }}
                      transition={{ 
                        opacity: { duration: 0.5 },
                        y: { 
                          repeat: Infinity, 
                          duration: 4, 
                          ease: "easeInOut" 
                        }
                      }}
                      className="relative w-full h-auto max-h-[140px] sm:max-h-[200px] aspect-auto rounded-[32px] sm:rounded-[40px] overflow-hidden border-2 border-white shadow-xl bg-slate-50/50 mt-10 sm:mt-12 group flex items-center justify-center p-1"
                    >
                      <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent mix-blend-overlay z-10" />
                      <img 
                        src="/medical_login_illustration.png" 
                        alt="Medical Illustration" 
                        className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110"
                      />
                    </motion.div>
                  </div>
                  <Button 
                    type="submit" 
                    disabled={loading} 
                    className="hidden sm:flex w-full h-20 rounded-full font-black uppercase text-xs tracking-[0.4em] gap-4 shadow-2xl shadow-primary/30 active:scale-95 transition-all bg-primary hover:scale-[1.02] border-4 border-white"
                  >
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
                  className="space-y-6 sm:space-y-8"
                >
                  <div className="text-center space-y-2">
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest opacity-60">OTP sent to</p>
                    <div className="flex items-center justify-between bg-primary/5 p-4 rounded-2xl border border-primary/10">
                      <span className="text-primary font-black tracking-widest text-sm">+91 {phone}</span>
                      <Button variant="link" onClick={() => { setStep(1); setOtp(''); }} className="text-[9px] font-black text-primary p-0 h-auto uppercase tracking-widest hover:underline">Change</Button>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block text-center opacity-60">Enter 6-Digit OTP</label>
                    <div className="relative">
                      <Input 
                        type="text"
                        placeholder="······"
                        maxLength={6}
                        className="h-16 sm:h-20 rounded-[28px] bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white font-black text-4xl text-center tracking-[0.2em] sm:tracking-[0.5em] shadow-inner px-4 transition-all"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        required
                      />
                    </div>
                  </div>
                  
                  <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-60">
                    Didn't receive OTP? <Button variant="link" onClick={handleSendOtp} className="text-[10px] p-0 h-auto text-primary font-black uppercase tracking-widest hover:underline">Resend</Button>
                  </p>

                  <Button 
                    type="submit" 
                    disabled={loading} 
                    className="hidden sm:flex w-full h-16 rounded-full font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary/30 active:scale-95 transition-all bg-primary hover:scale-[1.02] border-4 border-white"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : "Verify & Login"}
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Sticky Mobile Interaction Bar - Parity Height (h-24) */}
        <div className="sm:hidden fixed bottom-[5.5rem] left-0 right-0 z-[100] h-24 bg-white/80 backdrop-blur-3xl border-t border-slate-100/50 shadow-[0_-10px_30px_rgba(0,0,0,0.08)] flex items-center px-6 animate-in slide-in-from-bottom-full duration-500">
           <Button 
             onClick={(e) => {
               e.preventDefault();
               if (step === 1) handleSendOtp(e as any);
               else handleVerifyOtp(e as any);
             }}
             disabled={loading} 
             className="w-full h-14 rounded-full font-black uppercase text-[10px] tracking-[0.3em] gap-4 shadow-2xl shadow-primary/40 active:scale-95 transition-all bg-primary text-white border-none ring-offset-white"
           >
             {loading ? <Loader2 className="animate-spin" /> : (
               <>
                 {step === 1 ? (
                   <>
                    <Sparkles className="w-4 h-4 transition-transform group-hover:rotate-12" />
                    Request OTP
                   </>
                 ) : (
                   "Verify & Login"
                 )}
                 <ChevronRight className="w-4 h-4 ml-auto" />
               </>
             )}
           </Button>
        </div>
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
