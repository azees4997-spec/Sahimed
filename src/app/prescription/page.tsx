
"use client"

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, Upload, Loader2, CheckCircle2, AlertCircle, ArrowLeft, Home, ShoppingBag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { prescriptionAnalysisAndPreFill, PrescriptionAnalysisAndPreFillOutput } from '@/ai/flows/prescription-analysis-and-pre-fill-flow';
import Image from 'next/image';
import { Progress } from '@/components/ui/progress';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function PrescriptionPage() {
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<PrescriptionAnalysisAndPreFillOutput | null>(null);
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
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setAnalyzing(true);
    try {
      const analysis = await prescriptionAnalysisAndPreFill({ prescriptionImageUri: image });
      setResult(analysis);
      if (!analysis.isLegible) {
        toast({ variant: "destructive", title: "Image Unclear", description: "Please upload a clearer image for faster processing." });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Analysis Failed", description: "Our AI is currently busy. You can still submit for manual review." });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmitEnquiry = async () => {
    if (!user) {
      toast({ title: "Login Required", description: "Please login to submit your prescription." });
      router.push('/login');
      return;
    }

    setSubmitting(true);
    try {
      const prescriptionData = {
        userId: user.uid,
        imageUrl: image, // In production, this would be a Storage URL
        uploadDate: serverTimestamp(),
        status: 'Pending Review',
        aiAnalysisNotes: result ? JSON.stringify(result.medications) : 'Manual Review Requested',
        analysisSummary: result?.analysisSummary || 'No AI analysis performed'
      };

      const ref = collection(db, 'userProfiles', user.uid, 'prescriptions');
      addDocumentNonBlocking(ref, prescriptionData);
      
      setIsSuccess(true);
      toast({ title: "Submitted Successfully", description: "A pharmacist will review this shortly." });
    } catch (err) {
      toast({ variant: "destructive", title: "Submission Failed", description: "Could not save prescription. Please try again." });
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
        <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-4">Enquiry Received!</h1>
        <p className="text-gray-500 font-medium max-w-xs mb-12 leading-relaxed">
          Your prescription has been securely uploaded. Our pharmacists are reviewing it and will add the items to your account shortly.
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
          <h1 className="text-2xl font-black font-headline text-gray-900 uppercase tracking-widest">Prescription Portal</h1>
        </div>

        <div className="space-y-6">
          <Card className="rounded-[40px] border-none shadow-xl overflow-hidden bg-white">
            <CardContent className="p-0">
              <div 
                className={`relative aspect-[3/4] flex flex-col items-center justify-center transition-all cursor-pointer group ${image ? 'bg-black' : 'bg-gray-50'}`}
                onClick={() => !analyzing && !submitting && document.getElementById('file-upload')?.click()}
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
                    <p className="text-xs text-gray-400 font-bold mt-2 uppercase tracking-widest">Camera or Gallery</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <input id="file-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

          {image && !result && !analyzing && (
            <Button 
              onClick={handleAnalyze} 
              className="w-full h-16 rounded-full font-black uppercase tracking-widest shadow-xl shadow-primary/20 animate-in slide-in-from-bottom-4"
            >
              Analyze with AI
            </Button>
          )}

          {analyzing && (
            <Card className="rounded-[32px] border-none shadow-lg p-8 bg-white text-center">
              <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
              <h3 className="font-black text-gray-900 uppercase tracking-tight">AI Reading Details...</h3>
              <p className="text-xs text-gray-400 font-bold mt-2 mb-6">Extracting clinical information</p>
              <Progress value={66} className="h-2 rounded-full" />
            </Card>
          )}

          {result && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <Card className={`rounded-[32px] border-none shadow-lg overflow-hidden ${result.isLegible ? 'bg-green-50' : 'bg-orange-50'}`}>
                  <div className="p-6 flex items-center gap-4">
                    {result.isLegible ? <CheckCircle2 className="text-green-600" /> : <AlertCircle className="text-orange-600" />}
                    <div>
                       <h3 className="font-black text-gray-900 text-sm uppercase">{result.isLegible ? 'Analysis Ready' : 'Low Clarity'}</h3>
                       <p className="text-[10px] text-gray-500 font-bold">{result.analysisSummary}</p>
                    </div>
                  </div>
               </Card>

               {result.medications.length > 0 && (
                 <div className="space-y-3">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Extracted Medications</p>
                    {result.medications.map((med, idx) => (
                      <div key={idx} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                        <p className="font-black text-gray-900">{med.drugName}</p>
                        <div className="flex gap-4 mt-1 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                           <span>Dosage: {med.dosage}</span>
                           <span>Qty: {med.quantity}</span>
                        </div>
                      </div>
                    ))}
                 </div>
               )}

               <Button 
                 onClick={handleSubmitEnquiry} 
                 disabled={submitting}
                 className="w-full h-16 rounded-full font-black uppercase tracking-widest shadow-2xl shadow-primary/40 text-lg"
               >
                 {submitting ? <Loader2 className="animate-spin" /> : "Submit for Fulfillment"}
               </Button>
            </div>
          )}

          {image && !analyzing && !result && (
            <div className="text-center">
               <Button variant="ghost" onClick={() => setImage(null)} className="text-gray-400 font-black uppercase text-[10px] tracking-widest">
                 Cancel & Retry
               </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
