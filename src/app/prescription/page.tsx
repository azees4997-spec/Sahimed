
"use client"

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Camera, Image as ImageIcon, Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { prescriptionAnalysisAndPreFill, PrescriptionAnalysisAndPreFillOutput } from '@/ai/flows/prescription-analysis-and-pre-fill-flow';
import Image from 'next/image';
import { Progress } from '@/components/ui/progress';

export default function PrescriptionPage() {
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<PrescriptionAnalysisAndPreFillOutput | null>(null);
  const { toast } = useToast();

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
      if (analysis.isLegible) {
        toast({ title: "Analysis Complete", description: "Medications extracted successfully." });
      } else {
        toast({ variant: "destructive", title: "Image Unclear", description: "Please upload a clearer image." });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to analyze prescription." });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8 md:py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-bold font-headline text-gray-900 mb-4">Prescription Portal</h1>
          <p className="text-muted-foreground text-lg">Upload your prescription and let our AI handle the rest.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="rounded-3xl border-none shadow-xl overflow-hidden">
            <CardHeader className="bg-primary text-white p-8">
              <CardTitle className="text-2xl font-bold">Upload Document</CardTitle>
              <CardDescription className="text-white/80">Select a photo of your valid prescription</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-6">
                <div 
                  className={`border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-12 transition-all cursor-pointer hover:border-primary/50 hover:bg-primary/5 group relative overflow-hidden ${image ? 'border-primary' : 'border-gray-200'}`}
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  {image ? (
                    <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden">
                      <Image src={image} alt="Prescription" fill className="object-cover" />
                    </div>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                        <Upload className="w-8 h-8" />
                      </div>
                      <p className="font-bold text-gray-700">Tap to upload</p>
                      <p className="text-xs text-gray-400 mt-1">Supports JPG, PNG (Max 5MB)</p>
                    </>
                  )}
                </div>
                
                <input 
                  id="file-upload" 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleFileChange} 
                />

                <div className="flex gap-4">
                  <Button 
                    variant="outline" 
                    className="flex-1 rounded-full h-12 gap-2"
                    onClick={() => setImage(null)}
                    disabled={!image || analyzing}
                  >
                    Reset
                  </Button>
                  <Button 
                    className="flex-1 rounded-full h-12 gap-2"
                    disabled={!image || analyzing}
                    onClick={handleAnalyze}
                  >
                    {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                    {analyzing ? 'Analyzing...' : 'Analyze Image'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
             {analyzing && (
               <Card className="rounded-3xl border-none shadow-xl p-8 bg-white animate-pulse">
                 <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                 <h3 className="text-xl font-bold mb-2">Analyzing with AI</h3>
                 <p className="text-muted-foreground text-sm mb-6">Our AI is reading your prescription to pre-fill medication details...</p>
                 <Progress value={66} className="h-2" />
               </Card>
             )}

             {result && (
               <Card className="rounded-3xl border-none shadow-xl overflow-hidden h-full">
                  <CardHeader className={`${result.isLegible ? 'bg-green-50' : 'bg-red-50'} p-6`}>
                    <div className="flex items-center gap-3">
                      {result.isLegible ? (
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                      ) : (
                        <AlertCircle className="w-6 h-6 text-red-600" />
                      )}
                      <CardTitle className={result.isLegible ? 'text-green-800' : 'text-red-800'}>
                        {result.isLegible ? 'Legible Prescription' : 'Action Required'}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="mb-6">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Summary</h4>
                      <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-100">{result.analysisSummary}</p>
                    </div>

                    {result.medications.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">Pre-filled Details</h4>
                        {result.medications.map((med, idx) => (
                          <div key={idx} className="p-4 border rounded-xl bg-white shadow-sm hover:border-primary transition-colors">
                            <p className="font-bold text-primary">{med.drugName}</p>
                            <div className="flex gap-4 mt-2 text-xs text-gray-500">
                               <span><strong className="text-gray-900">Dosage:</strong> {med.dosage}</span>
                               <span><strong className="text-gray-900">Qty:</strong> {med.quantity}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2 italic">{med.instructions}</p>
                          </div>
                        ))}
                        <Button className="w-full rounded-full h-12 mt-4 font-bold">
                          Add Extracted Items to Cart
                        </Button>
                      </div>
                    )}
                  </CardContent>
               </Card>
             )}

             {!analyzing && !result && (
               <div className="h-full flex flex-col items-center justify-center p-12 text-center text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200">
                  <ImageIcon className="w-16 h-16 mb-4 opacity-20" />
                  <p className="font-medium">Upload an image to see AI analysis results here.</p>
               </div>
             )}
          </div>
        </div>
      </main>
    </div>
  );
}
