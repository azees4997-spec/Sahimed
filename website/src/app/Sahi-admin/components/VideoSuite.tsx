"use client"

import { useState, useEffect } from 'react';
import { 
  Search, 
  PenTool, 
  Video, 
  ShieldCheck, 
  Share2, 
  Download, 
  CloudUpload,
  Loader2,
  Play,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useFirestore } from '@/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export function VideoSuite() {
  const [topic, setTopic] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [missionId, setMissionId] = useState<string | null>(null);
  const [missionData, setMissionData] = useState<any>(null);
  
  const db = useFirestore();

  // Listen for real-time updates from Firebase
  useEffect(() => {
    if (!missionId || !db) return;

    let timeout: NodeJS.Timeout;

    const unsub = onSnapshot(doc(db, 'marketing_missions', missionId), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setMissionData(data);
        setCurrentStep(data.currentStep);
        if (data.status === 'ready' || data.status === 'error') {
          setIsProcessing(false);
          if (timeout) clearTimeout(timeout);
        }
      } else {
        // Document doesn't exist yet, start a timeout to prevent infinite loading
        timeout = setTimeout(() => {
          if (isProcessing) {
            setIsProcessing(false);
            setMissionData({ status: 'error', errorMessage: 'Mission initialization timed out. Please check your connection.' });
          }
        }, 15000); // 15 second timeout
      }
    }, (error) => {
      console.error("Firestore Listen Error:", error);
      setIsProcessing(false);
      setMissionData({ status: 'error', errorMessage: 'Permission denied or connection error.' });
    });

    return () => {
      unsub();
      if (timeout) clearTimeout(timeout);
    };
  }, [missionId, db]);

  const agents = [
    { 
      id: 'intelligence', 
      name: 'Intelligence', 
      role: 'Market Researcher', 
      icon: Search, 
      color: 'text-blue-500', 
      bg: 'bg-blue-50',
      desc: 'Analyzing competitors & hooks'
    },
    { 
      id: 'creative', 
      name: 'Creative', 
      role: 'Script Writer', 
      icon: PenTool, 
      color: 'text-purple-500', 
      bg: 'bg-purple-50',
      desc: 'Drafting high-energy scripts'
    },
    { 
      id: 'production', 
      name: 'Production', 
      role: 'Video Generator', 
      icon: Video, 
      color: 'text-rose-500', 
      bg: 'bg-rose-50',
      desc: 'Rendering AI video & audio'
    },
    { 
      id: 'compliance', 
      name: 'Compliance', 
      role: 'Auditor', 
      icon: ShieldCheck, 
      color: 'text-emerald-500', 
      bg: 'bg-emerald-50',
      desc: 'Safety & platform audit'
    },
    { 
      id: 'distribution', 
      name: 'Distribution', 
      role: 'SEO Saver', 
      icon: Share2, 
      color: 'text-amber-500', 
      bg: 'bg-amber-50',
      desc: 'Export & SEO optimization'
    }
  ];

  const handleStartMission = async () => {
    if (!topic) return;
    setIsProcessing(true);
    setCurrentStep(0);
    setMissionId(null);
    setMissionData(null);

    try {
      const res = await fetch('/api/marketing/video/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic })
      });
      const data = await res.json();
      if (data.missionId) {
        setMissionId(data.missionId);
      }
    } catch (err) {
      console.error("Mission start failed", err);
      setIsProcessing(false);
    }
  };

  const handleSaveToDrive = async () => {
    if (!missionId) return;
    try {
      const res = await fetch('/api/marketing/video/save-to-drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ missionId })
      });
      const data = await res.json();
      
      if (data.authRequired && data.authUrl) {
        // Redirect to Google Auth
        window.open(data.authUrl, '_blank');
      } else if (data.success) {
        alert('Video saved to Google Drive!');
      } else {
        alert(data.message || 'Failed to connect to Drive');
      }
    } catch (err) {
      console.error("Drive save failed", err);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Input Section */}
      <Card className="rounded-[40px] border-none shadow-3xl bg-white/50 backdrop-blur-xl border border-white overflow-hidden">
        <CardContent className="p-10">
          <div className="flex flex-col md:flex-row gap-4">
            <input 
              type="text" 
              placeholder="Enter medicine name or competitor video link..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={isProcessing}
              className="flex-1 h-20 bg-slate-100/50 rounded-[24px] px-8 font-black outline-none focus:bg-white focus:ring-4 ring-primary/5 transition-all text-sm disabled:opacity-50"
            />
            <Button 
              onClick={handleStartMission} 
              disabled={isProcessing || !topic}
              className="h-20 px-10 rounded-full bg-slate-900 text-white font-black uppercase tracking-widest text-xs gap-3 shadow-2xl active:scale-95 transition-all"
            >
              {isProcessing ? <Loader2 className="animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
              Launch Video Mission
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      <AnimatePresence>
        {missionData?.status === 'error' && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-6 bg-red-50 border border-red-100 rounded-[32px] flex items-center gap-4 text-red-600 mb-8"
          >
            <AlertCircle className="w-6 h-6 shrink-0" />
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest">Mission Failed</p>
              <p className="text-sm font-medium">{missionData.errorMessage || 'Unknown error occurred during processing.'}</p>
            </div>
            <Button variant="outline" onClick={handleStartMission} className="rounded-full border-red-200 text-red-600 hover:bg-red-100 uppercase text-[10px] font-black">
              Retry Mission
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Agents Chain */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {agents.map((agent, idx) => {
          const Icon = agent.icon;
          const isActive = idx === currentStep;
          const isCompleted = idx < currentStep;
          const isWaiting = idx > currentStep;

          return (
            <motion.div 
              key={agent.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className={cn(
                "rounded-[40px] border-none shadow-xl transition-all duration-500 h-full flex flex-col",
                isActive ? "ring-4 ring-primary/20 scale-105 bg-white" : isCompleted ? "bg-white/80" : "bg-white/40 grayscale opacity-60"
              )}>
                <CardHeader className="p-8 pb-4 text-center">
                  <div className={cn(
                    "w-16 h-16 rounded-[24px] mx-auto mb-4 flex items-center justify-center transition-all",
                    agent.bg, agent.color,
                    isActive && "animate-pulse shadow-lg"
                  )}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <CardTitle className="text-sm font-black uppercase tracking-tighter leading-none">{agent.name}</CardTitle>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{agent.role}</p>
                </CardHeader>
                <CardContent className="p-8 pt-0 flex-1 flex flex-col justify-between">
                  <p className="text-[10px] font-medium text-slate-500 leading-relaxed text-center">
                    {agent.desc}
                  </p>
                  
                  <div className="mt-6 flex flex-col items-center">
                    {isActive ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        <span className="text-[8px] font-black text-primary uppercase tracking-[0.2em]">Processing...</span>
                      </div>
                    ) : isCompleted ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-slate-200" />
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Results Section */}
      <AnimatePresence>
        {(currentStep === agents.length - 1 || missionData?.status === 'ready') && !isProcessing && missionData && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8"
          >
            {/* Video Preview Card */}
            <Card className="rounded-[56px] border-none shadow-3xl bg-slate-900 text-white overflow-hidden p-2">
              <div className="aspect-video bg-slate-800 rounded-[48px] flex items-center justify-center relative group">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto backdrop-blur-md border border-white/20 group-hover:scale-110 transition-transform">
                    <Play className="w-8 h-8 fill-current" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">
                    {missionData.videoUrl ? 'Production Ready' : 'Preview Generated'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Actions Card */}
            <Card className="rounded-[56px] border-none shadow-3xl bg-white p-10 flex flex-col justify-between">
              <div className="space-y-6 overflow-y-auto max-h-[400px] scrollbar-hide">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                      {missionData.auditData?.passed ? 'Compliance Verified' : 'Compliance Warning'}
                    </span>
                  </div>
                  <h3 className="text-3xl font-black uppercase tracking-tighter text-slate-900 leading-none">Mission Ready</h3>
                </div>
                
                <div className="space-y-4">
                   <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Generated Script</p>
                     <p className="text-xs font-medium text-slate-600 leading-relaxed italic">
                       "{missionData.scriptData?.script || 'Awaiting script content...'}"
                     </p>
                   </div>

                   <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">SEO Bundle</p>
                     <div className="flex flex-wrap gap-2 mb-2">
                        {missionData.seoData?.hashtags?.map((tag: string) => (
                          <span key={tag} className="text-[8px] font-black text-primary uppercase">#{tag}</span>
                        ))}
                     </div>
                     <p className="text-xs font-medium text-slate-500 line-clamp-3">
                       {missionData.seoData?.description}
                     </p>
                   </div>
                </div>
              </div>

              <div className="flex flex-col gap-4 mt-8">
                <Button 
                  onClick={() => missionData.videoUrl && window.open(missionData.videoUrl, '_blank')}
                  disabled={!missionData.videoUrl}
                  className="h-16 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[10px] gap-3 shadow-xl shadow-primary/20"
                >
                  <Download className="w-4 h-4" />
                  Download Final Video
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleSaveToDrive}
                  className="h-16 rounded-2xl border-2 border-slate-50 font-black uppercase tracking-widest text-[10px] gap-3"
                >
                  <CloudUpload className="w-4 h-4" />
                  Save to Google Drive
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
