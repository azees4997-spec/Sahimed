
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
import { useUser, useFirestore, useStorage, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function PrescriptionPage() {
  const [attachedFiles, setAttachedFiles] = useState<string[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const { user } = useUser();
  const db = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const router = useRouter();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!storage) {
       toast({ variant: "destructive", title: "Storage service not ready" });
       return;
    }

    const fileList = Array.from(files);
    setIsUploading(true);

    try {
      for (const file of fileList) {
        if (file.size > 5 * 1024 * 1024) {
          toast({ variant: "destructive", title: `${file.name} too large (>5MB)` });
          continue;
        }

        const validTypes = ['image/jpeg', 'image/png', 'application/pdf', 'image/jpg'];
        if (!validTypes.includes(file.type)) {
          toast({ variant: "destructive", title: `Invalid format: ${file.name}` });
          continue;
        }

        const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
        const userId = user?.uid || 'anonymous';
        const storageRef = ref(storage, `prescriptions/${userId}/${fileName}`);
        
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        
        setAttachedFiles(prev => [...prev, downloadURL]);
      }
      toast({ title: "Prescription files added" });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Upload failed" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmitEnquiry = async () => {
    if (!user) {
      toast({ title: "Login required", description: "Please sign in to submit your prescription." });
      router.push('/login');
      return;
    }

    if (attachedFiles.length === 0) {
      toast({ variant: "destructive", title: "No files attached", description: "Please upload your prescription documents." });
      return;
    }

    setSubmitting(true);
    try {
      // Save directly with the cloud URLs already collected
      const prescriptionData = {
        userId: user.uid,
        imageUrl: attachedFiles[0], // Keep for backward compatibility
        imageUrls: attachedFiles,     // Full history for modern digitization
        patientName: customerName || 'Self',
        notes: notes,
        uploadDate: serverTimestamp(),
        status: 'Pending Review',
        phoneNumber: user.phoneNumber || ''
      };

      const enquiryRef = collection(db, 'userProfiles', user.uid, 'prescriptions');
      addDocumentNonBlocking(enquiryRef, prescriptionData);
      
      setTimeout(() => {
        setIsSuccess(true);
        toast({ title: "Order request sent", description: "Our team is reviewing your prescription." });
      }, 800);
    } catch (err) {
      console.error("Upload failure:", err);
      toast({ variant: "destructive", title: "Submission failed" });
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
        <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-4">Request sent</h1>
        <p className="text-gray-500 font-medium max-w-sm mb-12 leading-relaxed text-[10px] tracking-widest">
          We have received your prescription. You will receive an update once verified.
        </p>
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <Link href="/">
            <Button className="w-full h-16 rounded-full font-black tracking-widest text-[11px] gap-3">
              <Home className="w-4 h-4" /> Return home
            </Button>
          </Link>
          <Link href="/orders">
            <Button variant="outline" className="w-full h-16 rounded-full font-black tracking-widest text-[11px] border-2">
              Track order
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
            <h1 className="text-3xl font-black font-headline text-gray-900 tracking-tight">Prescription upload</h1>
            <p className="text-[10px] font-black text-gray-400 tracking-widest">Quick order system</p>
          </div>
        </div>

        <div className="space-y-8">
          <Card className="rounded-[40px] border-none shadow-2xl overflow-hidden bg-white">
            <CardContent className="p-0">
              <div 
                className={`relative aspect-[3/4] flex flex-col items-center justify-center transition-all cursor-pointer group ${attachedFiles.length > 0 ? 'bg-slate-900/5' : 'bg-gray-50 border-4 border-dashed border-gray-100'}`}
                onClick={() => !submitting && !isUploading && document.getElementById('file-upload')?.click()}
              >
                {attachedFiles.length > 0 ? (
                  <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-[32px] flex items-center justify-center shadow-lg mb-6 group-hover:scale-110 transition-transform">
                      <ClipboardCheck className="w-10 h-10" />
                    </div>
                    <p className="font-extrabold text-slate-900 text-2xl tracking-tight mb-2 uppercase">{attachedFiles.length} Prescription(s) Uploaded</p>
                    <p className="text-[10px] font-black tracking-widest leading-relaxed uppercase max-w-[240px]">Files uploaded • Verification pending</p>
                    
                    <Button variant="outline" className="mt-8 rounded-full font-black text-[9px] px-8 h-12 border-2 uppercase tracking-widest gap-2 bg-white">
                      <RotateCcw className="w-4 h-4" /> Add more documents
                    </Button>
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <div className="w-20 h-20 bg-primary/10 text-primary rounded-[32px] flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-primary/5">
                      <Camera className="w-10 h-10" />
                    </div>
                    <p className="font-black text-gray-900 tracking-tight text-xl mb-2">Upload Prescription</p>
                    <p className="text-[10px] text-gray-400 font-bold tracking-widest">Image, PDF up to 5MB supported</p>
                  </div>
                )}

                {isUploading && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-50 flex flex-col items-center justify-center animate-in fade-in duration-300">
                    <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                    <p className="font-black text-[10px] tracking-widest uppercase text-primary">Uploading your files...</p>
                  </div>
                )}
              </div>

              {attachedFiles.length > 0 && (
                <div className="bg-slate-100/50 p-4 border-t border-slate-100">
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {attachedFiles.map((url, idx) => {
                      const isPDF = url.toLowerCase().includes('.pdf') || url.includes('application%2Fpdf');
                      return (
                        <motion.div 
                          key={idx} 
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-white shadow-xl shrink-0 group bg-white flex items-center justify-center"
                        >
                          {isPDF ? (
                            <div className="flex flex-col items-center justify-center w-full h-full text-rose-500">
                               <FileText className="w-8 h-8 sm:w-10 sm:h-10" />
                               <span className="text-[10px] font-black uppercase tracking-tighter mt-1">PDF</span>
                            </div>
                          ) : (
                            <Image src={url} alt="Prescription" fill className="object-cover" />
                          )}
                          <button 
                            onClick={(e) => { e.stopPropagation(); setAttachedFiles(prev => prev.filter((_, i) => i !== idx)); }}
                            className="absolute top-1 right-1 bg-rose-500 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-lg"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
 
          <input id="file-upload" type="file" accept=".jpg,.jpeg,.png,.pdf" multiple className="hidden" onChange={handleFileChange} />

          <div className="space-y-6 animate-in slide-in-from-bottom-6 duration-500">
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 space-y-8">
              <div className="space-y-3">
                <div className="flex items-center gap-2 ml-1">
                  <User className="w-3.5 h-3.5 text-primary" />
                  <Label className="text-[10px] font-black tracking-widest text-gray-400">Ordering for (Customer name)</Label>
                </div>
                <Input 
                  placeholder="e.g. Self or Family Member Name" 
                  value={customerName} 
                  onChange={e => setCustomerName(e.target.value)} 
                  className="rounded-2xl h-14 bg-gray-50 border-none font-bold text-sm focus-visible:ring-primary shadow-inner px-6"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 ml-1">
                  <FileText className="w-3.5 h-3.5 text-primary" />
                  <Label className="text-[10px] font-black tracking-widest text-gray-400">Order notes</Label>
                </div>
                <Textarea 
                  placeholder="Any specific requirements or instructions..." 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)}
                  className="rounded-2xl bg-gray-50 border-none font-bold min-h-[140px] text-sm focus-visible:ring-primary shadow-inner p-6 resize-none"
                />
              </div>

              <div className="pt-4 flex flex-col gap-4">
                <Button 
                  onClick={handleSubmitEnquiry} 
                  disabled={submitting || attachedFiles.length === 0 || isUploading}
                  className="w-full h-20 rounded-full font-black tracking-widest shadow-2xl shadow-primary/30 text-lg gap-4 active:scale-95 transition-all"
                >
                  {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <ClipboardCheck className="w-6 h-6" />}
                  {user ? (isUploading ? "Syncing..." : "Submit order request") : "Login to submit"}
                </Button>
                
                <div className="flex items-center justify-center gap-2">
                   <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                   <p className="text-[9px] text-gray-400 font-black tracking-[0.2em]">100% Secure & Reliable</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
