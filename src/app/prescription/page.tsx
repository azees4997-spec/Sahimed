
"use client"

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, 
  CheckCircle2, 
  ArrowLeft, 
  Home, 
  Loader2, 
  Send, 
  Sparkles, 
  AlertCircle,
  FileText,
  RotateCcw,
  ClipboardCheck,
  Stethoscope
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { prescriptionAnalysisAndPreFill, type MedicationDetails } from '@/ai/flows/prescription-analysis-and-pre-fill-flow';

export default function PrescriptionPage() {
  const [image, setImage] = useState<string | null>(null);
  const [patientName, setPatientName] = useState('');
  const [notes, setNotes] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    isLegible: boolean;
    medications: any[];
    summary: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({ variant: "destructive", title: "File too large", description: "Limit: 2MB." });
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        setImage(base64);
        setAnalysisResult(null); // Reset previous analysis
        
        // Trigger AI Analysis
        setIsAnalyzing(true);
        try {
          const result = await prescriptionAnalysisAndPreFill({
            prescriptionImageUri: base64
          });
          setAnalysisResult({
            isLegible: result.isLegible,
            medications: result.medications,
            summary: result.analysisSummary
          });
          
          if (!result.isLegible) {
            toast({
              variant: "destructive",
              title: "Legibility Alert",
              description: "Prescription might be unclear. Our pharmacists will double-check."
            });
          } else {
            toast({
              title: "Clinical Data Extracted",
              description: `Identified ${result.medications.length} items from scan.`
            });
          }
        } catch (err) {
          console.error("AI Analysis failed", err);
          toast({ variant: "destructive", title: "AI Analysis Error", description: "Could not pre-fill details, but you can still submit." });
        } finally {
          setIsAnalyzing(false);
        }
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
        analysisSummary: analysisResult?.summary || 'Manual Upload',
        extractedMedications: analysisResult?.medications || [],
        isLegible: analysisResult?.isLegible ?? true,
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
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Clinical Scan & AI Pre-fill</p>
          </div>
        </div>

        <div className="space-y-8">
          <Card className="rounded-[40px] border-none shadow-2xl overflow-hidden bg-white">
            <CardContent className="p-0">
              <div 
                className={`relative aspect-[3/4] flex flex-col items-center justify-center transition-all cursor-pointer group ${image ? 'bg-black' : 'bg-gray-50 border-4 border-dashed border-gray-100'}`}
                onClick={() => !submitting && !isAnalyzing && document.getElementById('file-upload')?.click()}
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

                {isAnalyzing && (
                  <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center p-10 text-center animate-in fade-in duration-300">
                     <div className="w-20 h-20 relative mb-6">
                        <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
                        <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-primary animate-pulse" />
                     </div>
                     <h3 className="text-lg font-black uppercase text-gray-900 tracking-tight">AI Clinical Audit</h3>
                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-2">Extracting medication details...</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <input id="file-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

          {image && !isAnalyzing && (
            <div className="space-y-6 animate-in slide-in-from-bottom-6 duration-500">
              {analysisResult && (
                <Card className={`rounded-[32px] border-none shadow-xl overflow-hidden ${analysisResult.isLegible ? 'bg-green-50/50 border-green-100' : 'bg-orange-50/50 border-orange-100'}`}>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className={`w-4 h-4 ${analysisResult.isLegible ? 'text-green-600' : 'text-orange-500'}`} />
                        <CardTitle className="text-sm font-black uppercase tracking-tight">AI Audit Results</CardTitle>
                      </div>
                      <Badge variant={analysisResult.isLegible ? 'default' : 'destructive'} className="rounded-full text-[8px] font-black uppercase tracking-widest px-3">
                        {analysisResult.isLegible ? 'Clinical Grade' : 'Low Clarity'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {analysisResult.medications.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Digitized Draft</p>
                        {analysisResult.medications.map((med, i) => (
                          <div key={i} className="bg-white p-3 rounded-2xl border flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 bg-primary/5 rounded-lg flex items-center justify-center">
                                  <Stethoscope className="w-4 h-4 text-primary" />
                               </div>
                               <div>
                                  <p className="text-[10px] font-black text-gray-900 uppercase">{med.drugName}</p>
                                  <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">{med.dosage} • {med.instructions}</p>
                               </div>
                            </div>
                            <Badge variant="secondary" className="text-[8px] font-black">x{med.quantity}</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-4 bg-white/50 rounded-2xl border-dashed border">
                         <AlertCircle className="w-5 h-5 text-orange-400" />
                         <p className="text-[10px] font-bold text-gray-600 uppercase tracking-tight">{analysisResult.summary}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <div className="bg-white p-8 rounded-[40px] shadow-sm border space-y-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Ordering For (Patient Name)</Label>
                  <Input 
                    placeholder="e.g. Self or Family Member Name" 
                    value={patientName} 
                    onChange={e => setPatientName(e.target.value)} 
                    className="rounded-2xl h-14 bg-gray-50 border-none font-bold text-sm focus-visible:ring-primary shadow-inner"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Notes for Supervisor</Label>
                  <Textarea 
                    placeholder="Any specific instructions or chronic history..." 
                    value={notes} 
                    onChange={e => setNotes(e.target.value)}
                    className="rounded-2xl bg-gray-50 border-none font-bold min-h-[120px] text-sm focus-visible:ring-primary shadow-inner p-5"
                  />
                </div>

                <div className="pt-4 flex flex-col gap-4">
                  <Button 
                    onClick={handleSubmitEnquiry} 
                    disabled={submitting}
                    className="w-full h-20 rounded-full font-black uppercase tracking-widest shadow-2xl shadow-primary/30 text-lg gap-4 active:scale-95 transition-all"
                  >
                    {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <ClipboardCheck className="w-6 h-6" />}
                    {user ? "Submit for Clinical Review" : "Login to Submit"}
                  </Button>
                  
                  <div className="flex items-center justify-center gap-2">
                     <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                     <p className="text-[9px] text-gray-400 font-black uppercase tracking-[0.2em]">Pharmacist Verified Portal</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
