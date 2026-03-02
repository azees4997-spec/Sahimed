
"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldCheck, ArrowLeft, Smartphone, ChevronRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const [step, setStep] = useState(1); 
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined' && !(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved
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
      console.error(err);
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
        toast({ title: 'Welcome!', description: 'Your clinical session is now active.' });
        router.push('/');
      }
    } catch (err: any) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Invalid Code', description: 'The OTP entered is incorrect.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F8F8] flex items-center justify-center p-4">
      <div id="recaptcha-container"></div>
      
      <Card className="max-w-md w-full rounded-[40px] shadow-2xl border-none overflow-hidden bg-white">
        <CardHeader className="text-center p-12 bg-primary text-white relative">
          <Link href="/" className="absolute top-6 left-6 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-20 h-20 bg-white/20 rounded-[32px] flex items-center justify-center mx-auto mb-6 backdrop-blur">
            <Smartphone className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold font-headline mb-2">Patient Login</CardTitle>
          <CardDescription className="text-white/70 uppercase text-[9px] font-black tracking-widest">Secure clinical access</CardDescription>
        </CardHeader>
        
        <CardContent className="p-10">
          {step === 1 ? (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Indian Mobile Number</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 border-r pr-3 border-gray-100">
                    <span className="text-sm font-bold text-gray-400">+91</span>
                  </div>
                  <Input 
                    type="tel"
                    placeholder="Enter 10-digit number"
                    maxLength={10}
                    className="h-16 pl-20 rounded-2xl bg-gray-50 border-none font-bold text-lg focus-visible:ring-primary"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full h-16 rounded-full font-black uppercase text-sm tracking-widest gap-2 shadow-lg shadow-primary/20">
                {loading ? <Loader2 className="animate-spin" /> : "Get OTP"}
                <ChevronRight className="w-5 h-5" />
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="text-center mb-4">
                <p className="text-sm text-gray-500 uppercase font-bold text-[10px]">OTP sent to <span className="font-black text-gray-900">+91 {phone}</span></p>
                <Button variant="link" onClick={() => { setStep(1); setOtp(''); }} className="text-[10px] font-black text-primary p-0 h-auto uppercase tracking-widest">Change Number</Button>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block text-center">Enter 6-digit OTP</label>
                <Input 
                  type="text"
                  placeholder="0 0 0 0 0 0"
                  maxLength={6}
                  className="h-16 rounded-2xl bg-gray-50 border-none font-bold text-2xl text-center tracking-[0.5em] focus-visible:ring-primary"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full h-16 rounded-full font-black uppercase tracking-widest text-sm shadow-lg shadow-primary/20">
                {loading ? <Loader2 className="animate-spin" /> : "Verify & Login"}
              </Button>
              <p className="text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Didn't receive code? <Button variant="link" onClick={handleSendOtp} className="text-[10px] p-0 h-auto text-primary font-black uppercase tracking-widest">Resend</Button></p>
            </form>
          )}

          <div className="mt-8 pt-8 border-t flex items-center justify-center gap-3">
             <ShieldCheck className="w-5 h-5 text-green-500" />
             <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Pharmacist Verified Hub</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
