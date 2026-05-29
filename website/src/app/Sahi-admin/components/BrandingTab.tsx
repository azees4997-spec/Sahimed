"use client"

import { useState, useEffect, useRef } from 'react';
import { 
  Loader2, 
  UploadCloud, 
  Trash2, 
  Sparkles,
  RefreshCw,
  Sliders,
  CheckCircle,
  Eye,
  SlidersHorizontal
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  useStorage, 
  useMemoFirebase, 
  useDoc,
  setDocumentNonBlocking,
  deleteDocumentNonBlocking
} from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { SectionHeader } from './SectionHeader';
import SahiMedLogo from '@/components/SahiMedLogo';

export function BrandingTab({ db, isVerified, onBack }: { db: any, isVerified: boolean, onBack: () => void }) {
  const { toast } = useToast();
  const storage = useStorage();
  
  const logoSettingsRef = useMemoFirebase(() => doc(db, 'settings', 'logo'), [db]);
  const { data: logoSettings, isLoading: isSettingsLoading } = useDoc(logoSettingsRef);

  const defaultFileRef = useRef<HTMLInputElement>(null);
  const whiteFileRef = useRef<HTMLInputElement>(null);

  const [isUploadingDefault, setIsUploadingDefault] = useState(false);
  const [isUploadingWhite, setIsUploadingWhite] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [logoUrl, setLogoUrl] = useState('');
  const [whiteLogoUrl, setWhiteLogoUrl] = useState('');
  const [navHeightDesktop, setNavHeightDesktop] = useState(44);
  const [navHeightMobile, setNavHeightMobile] = useState(32);
  const [footerHeightDesktop, setFooterHeightDesktop] = useState(44);
  const [footerHeightMobile, setFooterHeightMobile] = useState(32);

  // Populate from DB
  useEffect(() => {
    if (logoSettings) {
      setLogoUrl(logoSettings.logoUrl || '');
      setWhiteLogoUrl(logoSettings.whiteLogoUrl || '');
      setNavHeightDesktop(logoSettings.navHeightDesktop ?? 44);
      setNavHeightMobile(logoSettings.navHeightMobile ?? 32);
      setFooterHeightDesktop(logoSettings.footerHeightDesktop ?? 44);
      setFooterHeightMobile(logoSettings.footerHeightMobile ?? 32);
    } else if (!isSettingsLoading) {
      // Set to defaults if no doc exists
      setLogoUrl('');
      setWhiteLogoUrl('');
      setNavHeightDesktop(44);
      setNavHeightMobile(32);
      setFooterHeightDesktop(44);
      setFooterHeightMobile(32);
    }
  }, [logoSettings, isSettingsLoading]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isWhite: boolean) => {
    const file = e.target.files?.[0];
    if (!file || !storage) return;

    // Validation
    const allowedTypes = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({ 
        variant: 'destructive', 
        title: 'Format Rejection', 
        description: 'Please upload an SVG, PNG, JPEG, or WEBP image format.' 
      });
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({ 
        variant: 'destructive', 
        title: 'File Too Large', 
        description: 'File size must be below 5MB.' 
      });
      return;
    }

    if (isWhite) setIsUploadingWhite(true);
    else setIsUploadingDefault(true);

    try {
      const extension = file.name.split('.').pop() || 'png';
      const fileName = `branding/logos/logo_${isWhite ? 'white' : 'default'}_${Date.now()}.${extension}`;
      const storageRef = ref(storage, fileName);
      
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      if (isWhite) {
        setWhiteLogoUrl(url);
        toast({ title: 'White Logo Uploaded', description: 'Visual asset processed.' });
      } else {
        setLogoUrl(url);
        toast({ title: 'Default Logo Uploaded', description: 'Visual asset processed.' });
      }
    } catch (err: any) {
      console.error(err);
      toast({ 
        variant: 'destructive', 
        title: 'Upload Failed', 
        description: 'Could not establish cloud storage upload.' 
      });
    } finally {
      if (isWhite) setIsUploadingWhite(false);
      else setIsUploadingDefault(false);
    }
  };

  const handleSave = async () => {
    if (!logoUrl) {
      toast({ 
        variant: 'destructive', 
        title: 'Logo Url Required', 
        description: 'Please upload at least the primary logo.' 
      });
      return;
    }

    setIsSaving(true);
    try {
      await setDocumentNonBlocking(logoSettingsRef, {
        logoUrl,
        whiteLogoUrl: whiteLogoUrl || null,
        navHeightDesktop,
        navHeightMobile,
        footerHeightDesktop,
        footerHeightMobile,
        updatedAt: serverTimestamp()
      }, { merge: true });

      toast({ 
        title: 'Branding Saved', 
        description: 'Dynamic logo parameters synchronized successfully.' 
      });
    } catch (err: any) {
      toast({ 
        variant: 'destructive', 
        title: 'Save Failed', 
        description: err.message 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (confirm('Are you sure you want to restore the default native vector code logo? This will delete the custom branding settings.')) {
      setIsSaving(true);
      try {
        await deleteDocumentNonBlocking(logoSettingsRef);
        setLogoUrl('');
        setWhiteLogoUrl('');
        setNavHeightDesktop(44);
        setNavHeightMobile(32);
        setFooterHeightDesktop(44);
        setFooterHeightMobile(32);
        toast({ 
          title: 'Branding Restored', 
          description: 'Reverted to native vector SahiMed logo.' 
        });
      } catch (err: any) {
        toast({ 
          variant: 'destructive', 
          title: 'Reset Failed', 
          description: err.message 
        });
      } finally {
        setIsSaving(false);
      }
    }
  };

  if (isSettingsLoading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center gap-6">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-[10px] font-black tracking-[0.4em] text-slate-500 uppercase">Fetching brand parameters...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <SectionHeader title="Branding Configuration" subtitle="Logo Upload & Dimension Control" onBack={onBack}>
        <div className="flex gap-4">
          <Button 
            onClick={handleReset}
            disabled={isSaving || !logoSettings}
            variant="outline"
            className="rounded-full h-14 px-8 font-black text-[10px] uppercase tracking-widest border-2 hover:bg-slate-50 transition-all active:scale-95 text-slate-500"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Reset Default
          </Button>
          <Button 
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-full h-14 px-10 font-black text-[10px] bg-primary text-white shadow-2xl shadow-primary/30 uppercase tracking-widest hover:scale-105 transition-all border-4 border-white active:scale-95"
          >
            {isSaving ? <Loader2 className="w-5 h-5 mr-3 animate-spin" /> : <CheckCircle className="w-5 h-5 mr-3" />} 
            Save Configuration
          </Button>
        </div>
      </SectionHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Logo Uploads */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="rounded-[48px] border-none shadow-xl bg-white overflow-hidden p-8 sm:p-10">
            <CardHeader className="p-0 mb-8">
              <CardTitle className="text-xl font-black font-outfit uppercase tracking-tight text-slate-900 flex items-center gap-3">
                <UploadCloud className="w-6 h-6 text-primary" /> Logo Asset Upload
              </CardTitle>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Upload visual resources for default and dark themes (supports SVG, PNG, JPG, WEBP)</p>
            </CardHeader>
            <CardContent className="p-0 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Default Logo */}
              <div className="space-y-4">
                <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Primary Logo (Light Backgrounds)</Label>
                <div className="relative border-2 border-dashed border-slate-200/80 rounded-[32px] p-6 bg-slate-50 flex flex-col items-center justify-center text-center min-h-[220px]">
                  {logoUrl ? (
                    <div className="space-y-4 flex flex-col items-center">
                      <div className="bg-white border rounded-2xl p-4 shadow-sm max-w-[200px] h-20 flex items-center justify-center">
                        <img src={logoUrl} className="max-h-full object-contain" alt="Primary Logo" />
                      </div>
                      <Button variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50 font-black text-[9px] uppercase tracking-widest rounded-xl" onClick={() => setLogoUrl('')}><Trash2 className="w-3.5 h-3.5 mr-2" /> Delete Asset</Button>
                    </div>
                  ) : (
                    <div className="space-y-3 flex flex-col items-center">
                      {isUploadingDefault ? (
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      ) : (
                        <>
                          <UploadCloud className="w-10 h-10 text-slate-300" />
                          <div>
                            <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight">Click to browse file</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Supports SVG or PNG</p>
                          </div>
                          <input type="file" ref={defaultFileRef} onChange={(e) => handleFileUpload(e, false)} className="hidden" accept="image/*" />
                          <Button size="sm" onClick={() => defaultFileRef.current?.click()} className="rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 text-[9px] font-black tracking-widest uppercase py-2 px-5">Browse</Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* White Logo (Contrast) */}
              <div className="space-y-4">
                <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Contrast Logo (Optional - For Dark Backgrounds)</Label>
                <div className="relative border-2 border-dashed border-slate-200/80 rounded-[32px] p-6 bg-slate-900 flex flex-col items-center justify-center text-center min-h-[220px]">
                  {whiteLogoUrl ? (
                    <div className="space-y-4 flex flex-col items-center">
                      <div className="bg-white/10 border border-white/10 rounded-2xl p-4 shadow-sm max-w-[200px] h-20 flex items-center justify-center">
                        <img src={whiteLogoUrl} className="max-h-full object-contain" alt="Contrast Logo" />
                      </div>
                      <Button variant="ghost" className="text-red-400 hover:text-red-500 hover:bg-red-500/10 font-black text-[9px] uppercase tracking-widest rounded-xl" onClick={() => setWhiteLogoUrl('')}><Trash2 className="w-3.5 h-3.5 mr-2" /> Delete Asset</Button>
                    </div>
                  ) : (
                    <div className="space-y-3 flex flex-col items-center text-white">
                      {isUploadingWhite ? (
                        <Loader2 className="w-8 h-8 animate-spin text-white" />
                      ) : (
                        <>
                          <UploadCloud className="w-10 h-10 text-slate-700" />
                          <div>
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-tight">Click to browse file</p>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Supports SVG or PNG</p>
                          </div>
                          <input type="file" ref={whiteFileRef} onChange={(e) => handleFileUpload(e, true)} className="hidden" accept="image/*" />
                          <Button size="sm" onClick={() => whiteFileRef.current?.click()} className="rounded-full bg-white/20 hover:bg-white text-white hover:text-slate-900 text-[9px] font-black tracking-widest uppercase py-2 px-5 border border-white/10">Browse</Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sizing Previews */}
          <Card className="rounded-[48px] border-none shadow-xl bg-white overflow-hidden p-8 sm:p-10">
            <CardHeader className="p-0 mb-8">
              <CardTitle className="text-xl font-black font-outfit uppercase tracking-tight text-slate-900 flex items-center gap-3">
                <Eye className="w-6 h-6 text-primary" /> Storefront Sizing Preview
              </CardTitle>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Simulated display boxes showing exactly how the uploaded logo renders in context</p>
            </CardHeader>
            <CardContent className="p-0 space-y-8">
              {/* Header Nav Preview Box */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Navbar Simulated Header</Label>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 py-1 px-3 rounded-full">Background: White</span>
                </div>
                <div className="w-full h-24 bg-white border border-slate-100 rounded-3xl flex items-center px-8 shadow-inner overflow-hidden justify-between">
                  <div className="flex items-center">
                    {logoUrl ? (
                      <img 
                        src={logoUrl} 
                        style={{ height: `${navHeightDesktop}px` }} 
                        className="w-auto object-contain transition-all" 
                        alt="Logo"
                      />
                    ) : (
                      <SahiMedLogo showText={true} />
                    )}
                  </div>
                  {/* Dummy Nav items */}
                  <div className="hidden sm:flex gap-6 text-[9px] font-black uppercase text-slate-400">
                    <span>Products</span>
                    <span>Categories</span>
                    <span>Prescriptions</span>
                  </div>
                </div>
              </div>

              {/* Footer Preview Box */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Footer Simulated Area</Label>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-[#FFF9F9] border border-[#FFE4E4] py-1 px-3 rounded-full text-slate-500">Background: #FFF9F9</span>
                </div>
                <div className="w-full h-32 bg-[#FFF9F9] border border-[#FFE4E4] rounded-3xl flex items-center px-8 shadow-inner overflow-hidden justify-between">
                  <div className="flex flex-col gap-3">
                    {logoUrl ? (
                      <img 
                        src={logoUrl} 
                        style={{ height: `${footerHeightDesktop}px` }} 
                        className="w-auto object-contain transition-all" 
                        alt="Logo"
                      />
                    ) : (
                      <SahiMedLogo showText={true} />
                    )}
                    <span className="text-[9px] text-slate-500 font-bold max-w-[200px] leading-relaxed uppercase tracking-tighter">Revolutionizing medication accessibility</span>
                  </div>
                  <div className="hidden sm:flex gap-12 text-[9px] font-black uppercase text-slate-600">
                    <div className="flex flex-col gap-2"><span>Discover</span><span className="opacity-50">Shop All</span></div>
                    <div className="flex flex-col gap-2"><span>Know Us</span><span className="opacity-50">About</span></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Height Controls */}
        <div className="space-y-8">
          <Card className="rounded-[48px] border-none shadow-xl bg-white overflow-hidden p-8 sm:p-10 h-full flex flex-col">
            <CardHeader className="p-0 mb-8 shrink-0">
              <CardTitle className="text-xl font-black font-outfit uppercase tracking-tight text-slate-900 flex items-center gap-3">
                <Sliders className="w-6 h-6 text-primary" /> Sizing Controls
              </CardTitle>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Adjust dimensions to fit the logo place (values in pixels)</p>
            </CardHeader>
            <CardContent className="p-0 space-y-8 flex-1">
              {/* Navbar Sizing */}
              <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 space-y-6">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b pb-3 flex items-center gap-2">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-primary" /> Navbar Settings
                </h3>
                
                {/* Desktop Height */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <span>Desktop Height</span>
                    <span className="text-primary font-bold">{navHeightDesktop}px</span>
                  </div>
                  <input 
                    type="range" 
                    min="20" 
                    max="60" 
                    value={navHeightDesktop}
                    onChange={(e) => setNavHeightDesktop(Number(e.target.value))}
                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary" 
                  />
                  <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                    <span>Min: 20px</span>
                    <span>Max: 60px</span>
                  </div>
                </div>

                {/* Mobile Height */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <span>Mobile Height</span>
                    <span className="text-primary font-bold">{navHeightMobile}px</span>
                  </div>
                  <input 
                    type="range" 
                    min="15" 
                    max="45" 
                    value={navHeightMobile}
                    onChange={(e) => setNavHeightMobile(Number(e.target.value))}
                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary" 
                  />
                  <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                    <span>Min: 15px</span>
                    <span>Max: 45px</span>
                  </div>
                </div>
              </div>

              {/* Footer Sizing */}
              <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 space-y-6">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b pb-3 flex items-center gap-2">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-primary" /> Footer Settings
                </h3>

                {/* Desktop Height */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <span>Desktop Height</span>
                    <span className="text-primary font-bold">{footerHeightDesktop}px</span>
                  </div>
                  <input 
                    type="range" 
                    min="20" 
                    max="60" 
                    value={footerHeightDesktop}
                    onChange={(e) => setFooterHeightDesktop(Number(e.target.value))}
                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary" 
                  />
                  <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                    <span>Min: 20px</span>
                    <span>Max: 60px</span>
                  </div>
                </div>

                {/* Mobile Height */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <span>Mobile Height</span>
                    <span className="text-primary font-bold">{footerHeightMobile}px</span>
                  </div>
                  <input 
                    type="range" 
                    min="15" 
                    max="45" 
                    value={footerHeightMobile}
                    onChange={(e) => setFooterHeightMobile(Number(e.target.value))}
                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary" 
                  />
                  <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                    <span>Min: 15px</span>
                    <span>Max: 45px</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
