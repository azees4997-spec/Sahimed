
"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldCheck, ArrowLeft, Phone, Smartphone, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [step, setStep] = useState(1); // 1: Number, 2: OTP
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length !== 10) return alert("Please enter a valid 10-digit number");
    setLoading(true);
    setTimeout(() => {
      setStep(2);
      setLoading(false);
    }, 1000);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      router.push('/');
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#F8F8F8] flex items-center justify-center p-4">
      <Card className="max-w-md w-full rounded-[40px] shadow-2xl border-none overflow-hidden bg-white">
        <CardHeader className="text-center p-12 bg-primary text-white relative">
          <Link href="/" className="absolute top-6 left-6 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-20 h-20 bg-white/20 rounded-[32px] flex items-center justify-center mx-auto mb-6 backdrop-blur">
            <Smartphone className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold font-headline mb-2">Secure Login</CardTitle>
          <CardDescription className="text-white/70">OTP based login for HealthLink Pharmacy</CardDescription>
        </CardHeader>
        
        <CardContent className="p-10">
          {step === 1 ? (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 block">Indian Mobile Number</label>
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
              <Button type="submit" disabled={loading} className="w-full h-16 rounded-full font-bold text-lg gap-2 shadow-lg shadow-primary/20">
                {loading ? "Sending..." : "Get OTP"}
                <ChevronRight className="w-5 h-5" />
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="text-center mb-4">
                <p className="text-sm text-gray-500">OTP sent to <span className="font-bold text-gray-900">+91 {phone}</span></p>
                <Button variant="link" onClick={() => setStep(1)} className="text-xs font-bold text-primary p-0 h-auto">Change Number</Button>
              </div>
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 block text-center">Enter 6-digit OTP</label>
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
              <Button type="submit" disabled={loading} className="w-full h-16 rounded-full font-bold text-lg shadow-lg shadow-primary/20">
                {loading ? "Verifying..." : "Login to HealthLink"}
              </Button>
              <p className="text-center text-xs text-gray-400">Didn't receive code? <Button variant="link" className="text-xs p-0 h-auto text-primary font-bold">Resend OTP</Button></p>
            </form>
          )}

          <div className="mt-8 pt-8 border-t flex items-center justify-center gap-3">
             <ShieldCheck className="w-5 h-5 text-green-500" />
             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Secured by industry-standard encryption</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
