"use client"

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Camera, 
  CheckCircle2, 
  ArrowLeft, 
  Home, 
  Loader2, 
  RotateCcw,
  ClipboardCheck,
  ShieldCheck,
  User,
  FileText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function PrescriptionPage() {
  const [image, setImage] = useState<string | null>(null);
  const [patientName, setPatientName] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({ variant: "destructive", title: "File too large", description: "Limit: 2MB." });
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitEnquiry = async () => {
    if (!user) {
      toast({ title: "Login Required", description: "Please sign in to submit your prescription." });
      router.push('/login');
      return;
    }

    if (!image) {
      toast({ variant: "destructive", title: "No Image", description: "Please scan a prescription." });
      return;
    }

    setSubmitting(true);
    try {
      const prescriptionData = {
        userId: user.uid,
        imageUrl: image,
        patientName: patientName || 'Self',
        notes: notes,
        uploadDate: serverTimestamp(),
        status: 'Pending Review',
        phoneNumber: user.phoneNumber || ''
      };

      const ref = collection(db, 'userProfiles', user.uid, 'prescriptions');
      addDocumentNonBlocking(ref, prescriptionData);
      
      setTimeout(() => {
        setIsSuccess(true);
        toast({ title: "Clinical Submission Sent", description: "Pharmacist review in progress (Mumbai HQ)." });
      }, 800);
    } catch (err) {
      toast({ variant: "destructive", title: "Submission Failed" });
    } finally {
      setSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-8 shadow-xl">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-4">Submission Sent</h1>
        <p className="text-gray-500 font-medium max-w-sm mb-12 leading-relaxed uppercase text-[10px] tracking-widest">
          A licensed clinical supervisor in Mumbai has received your record. You will be notified via SMS once verified.
        </p>
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <Link href="/">
            <Button className="w-full h-16 rounded-full font-black uppercase tracking-widest text-[11px] gap-3">
              <Home className="w-4 h-4" /> Return Home
            </Button>
          </Link>
          <Link href="/orders">
            <Button variant="outline" className="w-full h-16 rounded-full font-black uppercase tracking-widest text-[11px] border-2">
              Track My Records
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8] pb-16 page-transition-wrapper">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-10">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-sm hover:scale-110 transition-transform">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-black font-headline text-gray-900 uppercase tracking-tight">Prescription Portal</h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mumbai Clinical Hub</p>
          </div>
        </div>

        <div className="space-y-8">
          <Card className="rounded-[40px] border-none shadow-2xl overflow-hidden bg-white">
            <CardContent className="p-0">
              <div 
                className={`relative aspect-[3/4] flex flex-col items-center justify-center transition-all cursor-pointer group ${image ? 'bg-black' : 'bg-gray-50 border-4 border-dashed border-gray-100'}`}
                onClick={() => !submitting && document.getElementById('file-upload')?.click()}
              >
                {image ? (
                  <>
                    <Image src={image} alt="Prescription" fill className="object-contain" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity gap-3">
                       <Button variant="secondary" className="rounded-full font-black uppercase text-[10px] px-8 h-12 shadow-2xl">
                         <RotateCcw className="w-4 h-4 mr-2" /> Retake Scan
                       </Button>
                    </div>
                  </>
                ) : (
                  <div className="p-12 text-center">
                    <div className="w-20 h-20 bg-primary/10 text-primary rounded-[32px] flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-primary/5">
                      <Camera className="w-10 h-10" />
                    </div>
                    <p className="font-black text-gray-900 uppercase tracking-tight text-xl mb-2">Scan Prescription</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Clinical quality photo required</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <input id="file-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

          {/* Form Fields - Patient Info & Notes */}
          <div className="space-y-6 animate-in slide-in-from-bottom-6 duration-500">
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 space-y-8">
              <div className="space-y-3">
                <div className="flex items-center gap-2 ml-1">
                  <User className="w-3.5 h-3.5 text-primary" />
                  <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Ordering For (Patient Name)</Label>
                </div>
                <Input 
                  placeholder="e.g. Self or Family Member Name" 
                  value={patientName} 
                  onChange={e => setPatientName(e.target.value)} 
                  className="rounded-2xl h-14 bg-gray-50 border-none font-bold text-sm focus-visible:ring-primary shadow-inner px-6"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 ml-1">
                  <FileText className="w-3.5 h-3.5 text-primary" />
                  <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Notes for Clinical Supervisor</Label>
                </div>
                <Textarea 
                  placeholder="Mention current symptoms or specific requirements..." 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)}
                  className="rounded-2xl bg-gray-50 border-none font-bold min-h-[140px] text-sm focus-visible:ring-primary shadow-inner p-6 resize-none"
                />
              </div>

              <div className="pt-4 flex flex-col gap-4">
                <Button 
                  onClick={handleSubmitEnquiry} 
                  disabled={submitting || !image}
                  className="w-full h-20 rounded-full font-black uppercase tracking-widest shadow-2xl shadow-primary/30 text-lg gap-4 active:scale-95 transition-all"
                >
                  {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <ClipboardCheck className="w-6 h-6" />}
                  {user ? "Submit for Clinical Review" : "Login to Submit"}
                </Button>
                
                <div className="flex items-center justify-center gap-2">
                   <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                   <p className="text-[9px] text-gray-400 font-black uppercase tracking-[0.2em]">Pharmacist Verified Portal</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
