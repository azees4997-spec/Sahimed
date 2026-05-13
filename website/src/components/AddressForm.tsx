"use client"

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  LocateFixed, 
  Loader2, 
  Home, 
  Briefcase, 
  MoreHorizontal,
  Save,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

export interface AddressData {
  id?: string;
  patientName: string;
  phoneNumber: string;
  houseNumber: string;
  apartmentName?: string;
  street: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  tag: string;
  lat?: number;
  lng?: number;
}

interface AddressFormProps {
  initialData?: Partial<AddressData>;
  onSave: (data: AddressData) => void;
  isLoading?: boolean;
}

export default function AddressForm({ initialData, onSave, isLoading }: AddressFormProps) {
  const [formData, setFormData] = useState<AddressData>({
    patientName: initialData?.patientName || '',
    phoneNumber: initialData?.phoneNumber || '',
    houseNumber: initialData?.houseNumber || '',
    apartmentName: initialData?.apartmentName || '',
    street: initialData?.street || '',
    landmark: initialData?.landmark || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    pincode: initialData?.pincode || '',
    tag: initialData?.tag || 'Home',
    lat: initialData?.lat || 0,
    lng: initialData?.lng || 0,
    id: initialData?.id
  });

  const [otherTag, setOtherTag] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    if (initialData?.tag && !['Home', 'Office'].includes(initialData.tag)) {
      setOtherTag(initialData.tag);
      setFormData(prev => ({ ...prev, tag: 'Other' }));
    }
  }, [initialData]);

  const handleLocateMe = () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
            const data = await response.json();
            
            if (data && data.address) {
              setFormData(prev => ({
                ...prev,
                street: data.address.suburb || data.address.neighbourhood || data.display_name || prev.street,
                city: data.address.city || data.address.town || data.address.village || prev.city,
                state: data.address.state || prev.state,
                pincode: data.address.postcode?.replace(/\s/g, '') || prev.pincode,
                lat,
                lng
              }));
            }
          } catch (e) {
            console.error("GPS sync failed", e);
          } finally {
            setIsLocating(false);
          }
        },
        () => setIsLocating(false),
        { enableHighAccuracy: true }
      );
    }
  };

  const { toast } = useToast();

  const handleSubmit = async () => {
    setIsLocating(true);
    try {
      const res = await fetch('/api/logistics/shipway/serviceability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toPincode: formData.pincode })
      });
      const data = await res.json();
      if (!data.serviceable) {
        toast({ 
          variant: 'destructive', 
          title: "Not Serviceable", 
          description: `We currently do not deliver to pincode ${formData.pincode}.` 
        });
        setIsLocating(false);
        return;
      }
    } catch(e) {
      console.error("Shipway check failed", e);
    }
    setIsLocating(false);

    const finalTag = formData.tag === 'Other' ? (otherTag || 'Other') : formData.tag;
    onSave({ ...formData, tag: finalTag });
  };

  const tagOptions = [
    { value: 'Home', icon: Home, label: 'Home' },
    { value: 'Office', icon: Briefcase, label: 'Office' },
    { value: 'Other', icon: MoreHorizontal, label: 'Other' }
  ];

  return (
    <div className="space-y-6 pb-24 sm:pb-10 px-1">
      {/* Selection Based Tags */}
      <div className="space-y-3">
        <Label className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase opacity-60 ml-2">Save as</Label>
        <div className="flex gap-3">
          {tagOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setFormData({ ...formData, tag: opt.value })}
              className={cn(
                "flex-1 h-14 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all active:scale-95",
                formData.tag === opt.value 
                  ? "border-primary bg-primary/5 text-primary shadow-lg shadow-primary/5" 
                  : "border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-200"
              )}
            >
              <opt.icon className={cn("w-5 h-5", formData.tag === opt.value ? "animate-pulse" : "")} />
              <span className="text-[9px] font-black uppercase tracking-widest">{opt.label}</span>
            </button>
          ))}
        </div>
        
        {formData.tag === 'Other' && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="pt-2"
          >
            <Input 
              placeholder="E.G. GYM, HOSPITAL, FRIEND'S HOUSE" 
              value={otherTag} 
              onChange={e => setOtherTag(e.target.value)}
              className="h-12 rounded-xl bg-slate-50 border-none font-bold text-[10px] px-5 uppercase tracking-widest focus:bg-white transition-colors shadow-inner"
            />
          </motion.div>
        )}
      </div>

      <Button 
        onClick={handleLocateMe}
        variant="outline" 
        type="button"
        disabled={isLocating}
        className="h-14 w-full rounded-2xl border-2 border-primary/20 text-primary bg-white hover:bg-primary/5 font-black text-[10px] gap-3 transition-all shadow-xl uppercase tracking-widest relative overflow-hidden"
      >
        {isLocating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Finding you...</span>
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="absolute bottom-0 left-0 h-1 w-full bg-primary/20"
            />
          </>
        ) : (
          <>
            <LocateFixed className="w-4 h-4" />
            <span>Use Current Location</span>
          </>
        )}
      </Button>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-[9px] font-black text-slate-400 ml-2 uppercase opacity-60">Receiver Name *</Label>
          <Input 
            placeholder="FULL NAME" 
            value={formData.patientName} 
            onChange={e => setFormData({...formData, patientName: e.target.value})}
            className="h-12 rounded-xl bg-slate-50 border-none font-bold text-[10px] px-5 uppercase focus:bg-white transition-colors shadow-inner"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[9px] font-black text-slate-400 ml-2 uppercase opacity-60">Mobile Number *</Label>
          <Input 
            placeholder="10-DIGIT MOBILE" 
            value={formData.phoneNumber} 
            maxLength={10}
            onChange={e => setFormData({...formData, phoneNumber: e.target.value.replace(/\D/g, '')})}
            className="h-12 rounded-xl bg-slate-50 border-none font-bold text-[10px] px-5 uppercase focus:bg-white transition-colors shadow-inner"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-[9px] font-black text-slate-400 ml-2 uppercase opacity-60">House / Flat No *</Label>
          <Input 
            placeholder="FLAT 101" 
            value={formData.houseNumber} 
            onChange={e => setFormData({...formData, houseNumber: e.target.value})}
            className="h-12 rounded-xl bg-slate-50 border-none font-bold text-[10px] px-5 uppercase focus:bg-white transition-colors shadow-inner"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[9px] font-black text-slate-400 ml-2 uppercase opacity-60">Apartment / Building</Label>
          <Input 
            placeholder="BUILDING NAME" 
            value={formData.apartmentName} 
            onChange={e => setFormData({...formData, apartmentName: e.target.value})}
            className="h-12 rounded-xl bg-slate-50 border-none font-bold text-[10px] px-5 uppercase focus:bg-white transition-colors shadow-inner"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-[9px] font-black text-slate-400 ml-2 uppercase opacity-60">Street / Locality / Area *</Label>
        <Input 
          placeholder="LOCALITY / STREET" 
          value={formData.street} 
          onChange={e => setFormData({...formData, street: e.target.value})}
          className="h-12 rounded-xl bg-slate-50 border-none font-bold text-[10px] px-5 uppercase focus:bg-white transition-colors shadow-inner"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-[9px] font-black text-slate-400 ml-2 uppercase opacity-60">Landmark</Label>
        <Input 
          placeholder="NEAR BY..." 
          value={formData.landmark} 
          onChange={e => setFormData({...formData, landmark: e.target.value})}
          className="h-12 rounded-xl bg-slate-50 border-none font-bold text-[10px] px-5 uppercase focus:bg-white transition-colors shadow-inner"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-[9px] font-black text-slate-400 ml-1 uppercase opacity-60">City *</Label>
          <Input 
            placeholder="CITY" 
            value={formData.city} 
            onChange={e => setFormData({...formData, city: e.target.value})}
            className="h-12 rounded-xl bg-slate-50 border-none font-bold text-[10px] px-4 uppercase focus:bg-white transition-colors shadow-inner"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[9px] font-black text-slate-400 ml-1 uppercase opacity-60">State *</Label>
          <Input 
            placeholder="STATE" 
            value={formData.state} 
            onChange={e => setFormData({...formData, state: e.target.value})}
            className="h-12 rounded-xl bg-slate-50 border-none font-bold text-[10px] px-4 uppercase focus:bg-white transition-colors shadow-inner"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[9px] font-black text-slate-400 ml-1 uppercase opacity-60">Pincode *</Label>
          <Input 
            placeholder="6-DIGIT" 
            value={formData.pincode} 
            maxLength={6}
            onChange={e => setFormData({...formData, pincode: e.target.value.replace(/\D/g, '')})}
            className="h-12 rounded-xl bg-slate-50 border-none font-black text-[10px] px-4 uppercase tracking-widest focus:bg-white transition-colors shadow-inner"
          />
        </div>
      </div>

      <Button 
        onClick={handleSubmit} 
        disabled={isLoading || !formData.patientName || !formData.phoneNumber || !formData.houseNumber || !formData.street || !formData.pincode} 
        className="w-full h-16 rounded-full font-black text-[11px] tracking-[0.2em] gap-3 shadow-2xl shadow-primary/20 bg-primary text-white uppercase active:scale-95 transition-all mt-4"
      >
        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
        Confirm Address
      </Button>
    </div>
  );
}
