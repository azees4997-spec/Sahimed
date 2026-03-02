
"use client"

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, CheckCircle2, ArrowLeft, Home, ShoppingBag, Loader2, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function PrescriptionPage() {
  const [image, setImage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitEnquiry = async () => {
    if (!user) {
      toast({ title: "Login Required", description: "Please login to submit your prescription." });
      router.push('/login');
      return;
    }

    if (!image) {
      toast({ variant: "destructive", title: "No Image", description: "Please capture or upload a prescription first." });
      return;
    }

    setSubmitting(true);
    try {
      const prescriptionData = {
        userId: user.uid,
        imageUrl: image, // In a real app, this would be uploaded to Firebase Storage first
        uploadDate: serverTimestamp(),
        status: 'Pending Review',
        analysisSummary: 'Manual Prescription Enquiry'
      };

      const ref = collection(db, 'userProfiles', user.uid, 'prescriptions');
      addDocumentNonBlocking(ref, prescriptionData);
      
      setIsSuccess(true);
      toast({ title: "Submitted Successfully", description: "Your enquiry has been sent to our pharmacists." });
    } catch (err) {
      toast({ variant: "destructive", title: "Submission Failed", description: "Could not send enquiry. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-8 shadow-xl shadow-green-100">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-4">Thank You!</h1>
        <p className="text-gray-500 font-medium max-w-xs mb-12 leading-relaxed">
          Your prescription has been received as an enquiry. Our clinical team will review it and get back to you shortly with a pre-filled order.
        </p>
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <Link href="/">
            <Button className="w-full h-16 rounded-full font-black uppercase tracking-widest text-[10px] gap-3">
              <Home className="w-5 h-5" /> Return to Home
            </Button>
          </Link>
          <Link href="/orders">
            <Button variant="outline" className="w-full h-16 rounded-full font-black uppercase tracking-widest text-[10px] border-2">
              <ShoppingBag className="w-5 h-5" /> View My Enquiries
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8] pb-32">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-sm">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-black font-headline text-gray-900 uppercase tracking-widest">Submit Prescription</h1>
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
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                       <Button variant="secondary" className="rounded-full font-black uppercase text-[10px] tracking-widest">Change Photo</Button>
                    </div>
                  </>
                ) : (
                  <div className="p-12 text-center">
                    <div className="w-20 h-20 bg-primary/10 text-primary rounded-[32px] flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                      <Camera className="w-10 h-10" />
                    </div>
                    <p className="font-black text-gray-900 uppercase tracking-tight text-lg">Tap to Scan</p>
                    <p className="text-xs text-gray-400 font-bold mt-2 uppercase tracking-widest">Take a photo or upload</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <input id="file-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

          {image && (
            <div className="space-y-4 animate-in slide-in-from-bottom-4">
              <Button 
                onClick={handleSubmitEnquiry} 
                disabled={submitting}
                className="w-full h-16 rounded-full font-black uppercase tracking-widest shadow-2xl shadow-primary/40 text-lg flex items-center justify-center gap-3"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Sending Enquiry...
                  </>
                ) : (
                  <>
                    <Send className="w-6 h-6" />
                    Submit Prescription
                  </>
                )}
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setImage(null)} 
                disabled={submitting}
                className="w-full text-gray-400 font-black uppercase text-[10px] tracking-widest"
              >
                Cancel & Re-take
              </Button>
            </div>
          )}

          {!image && (
            <div className="bg-blue-50 p-6 rounded-[32px] border border-blue-100">
              <h3 className="font-black text-blue-900 text-sm uppercase tracking-tight mb-2">Instructions</h3>
              <ul className="text-xs text-blue-700/80 space-y-2 font-bold leading-relaxed">
                <li className="flex gap-2"><span>•</span> Ensure all text on the prescription is clear and legible.</li>
                <li className="flex gap-2"><span>•</span> Include the doctor's signature and stamp if possible.</li>
                <li className="flex gap-2"><span>•</span> Avoid bright glare or dark shadows on the paper.</li>
              </ul>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
