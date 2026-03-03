
"use client"

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Camera, CheckCircle2, ArrowLeft, Home, ShoppingBag, Loader2, Send, ShieldCheck } from 'lucide-react';
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
        status: 'Pending Review', // Essential for collectionGroup filtering in admin panel
        analysisSummary: 'Manual Prescription Enquiry',
        phoneNumber: user.phoneNumber || ''
      };

      const ref = collection(db, 'userProfiles', user.uid, 'prescriptions');
      addDocumentNonBlocking(ref, prescriptionData);
      
      setTimeout(() => {
        setIsSuccess(true);
        toast({ title: "Enquiry Sent", description: "Pharmacist review in progress." });
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
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-8 shadow-xl">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-4">Submission Sent</h1>
        <p className="text-gray-500 font-medium max-w-xs mb-12 leading-relaxed uppercase text-[10px] tracking-widest">
          A licensed pharmacist will review your clinical records and notify you within 30 minutes.
        </p>
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <Link href="/">
            <Button className="w-full h-16 rounded-full font-black uppercase tracking-widest text-[10px] gap-3">
              <Home className="w-4 h-4" /> Return Home
            </Button>
          </Link>
          <Link href="/orders">
            <Button variant="outline" className="w-full h-16 rounded-full font-black uppercase tracking-widest text-[10px] border-2">
              View Status
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8] pb-16">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-black font-headline text-gray-900 uppercase tracking-widest">Prescription Portal</h1>
        </div>

        <div className="space-y-6">
          <Card className="rounded-[40px] border-none shadow-xl overflow-hidden bg-white">
            <CardContent className="p-0">
              <div 
                className={`relative aspect-[3/4] flex flex-col items-center justify-center transition-all cursor-pointer group ${image ? 'bg-black' : 'bg-gray-50'}`}
                onClick={() => !submitting && document.getElementById('file-upload')?.click()}
              >
                {image ? (
                  <>
                    <Image src={image} alt="Prescription" fill className="object-contain" />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center">
                       <Button variant="secondary" className="rounded-full font-black uppercase text-[10px]">Retake</Button>
                    </div>
                  </>
                ) : (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-primary/10 text-primary rounded-[24px] flex items-center justify-center mx-auto mb-6">
                      <Camera className="w-8 h-8" />
                    </div>
                    <p className="font-black text-gray-900 uppercase tracking-tight text-lg">Scan & Upload</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <input id="file-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

          {image && (
            <div className="bg-white p-8 rounded-[32px] shadow-sm border space-y-6 animate-in slide-in-from-bottom-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Ordering For (Patient Name)</Label>
                <Input 
                  placeholder="e.g. John Doe" 
                  value={patientName} 
                  onChange={e => setPatientName(e.target.value)} 
                  className="rounded-xl h-12 bg-gray-50 border-none font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Notes for Pharmacist</Label>
                <Textarea 
                  placeholder="Tell us about the medications or special requirements..." 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)}
                  className="rounded-xl bg-gray-50 border-none font-bold min-h-[100px]"
                />
              </div>
              <Button 
                onClick={handleSubmitEnquiry} 
                disabled={submitting}
                className="w-full h-16 rounded-full font-black uppercase tracking-widest shadow-xl text-lg gap-3"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                {user ? "Submit to Pharmacist" : "Login to Submit"}
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
