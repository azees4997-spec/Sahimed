"use client"

import { useState } from 'react';
import { 
  Users, 
  Phone, 
  MapPin, 
  Save, 
  Loader2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { doc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase';

export function EnquiryEditForm({ enquiry, db, onSuccess }: { enquiry: any, db: any, onSuccess: () => void }) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    patientName: enquiry.patientName || '',
    phoneNumber: enquiry.phoneNumber || '',
    pendingRemarks: enquiry.pendingRemarks || '',
    shippingDetails: {
      street: enquiry.shippingDetails?.street || '',
      city: enquiry.shippingDetails?.city || 'Hyderabad'
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const path = enquiry.__path || enquiry.path || `prescriptions/${enquiry.id}`;
      // Note: If using collectionGroup, we might need the actual doc path. 
      // Most of our useCollection returns the document ref or path.
      const docRef = doc(db, path);
      
      await updateDocumentNonBlocking(docRef, {
        ...form,
        lastUpdated: new Date()
      });

      toast({ title: "Enquiry updated", description: "Metadata has been successfully synchronized." });
      onSuccess();
    } catch (err: any) {
      toast({ variant: 'destructive', title: "Update failed", description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[32px] border shadow-sm space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
              <Users className="w-3 h-3" /> Basic Info
            </h4>
            <div className="space-y-4">
              <div className="space-y-1.5">
                 <Label className="text-[10px] font-black text-gray-400">Patient Name</Label>
                 <Input 
                   value={form.patientName} 
                   onChange={e => setForm({...form, patientName: e.target.value})} 
                   className="rounded-xl h-12 bg-gray-50 border-none font-bold" 
                   placeholder="Full Name" 
                   required
                 />
              </div>
              <div className="space-y-1.5">
                 <Label className="text-[10px] font-black text-gray-400">Mobile Number</Label>
                 <div className="relative">
                   <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-300" />
                   <Input 
                     value={form.phoneNumber} 
                     onChange={e => setForm({...form, phoneNumber: e.target.value})} 
                     className="rounded-xl h-12 bg-gray-50 border-none font-bold pl-10" 
                     placeholder="10 digits" 
                   />
                 </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[32px] border shadow-sm space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
              <MapPin className="w-3 h-3" /> Shipping Preview
            </h4>
            <div className="space-y-4">
              <div className="space-y-1.5">
                 <Label className="text-[10px] font-black text-gray-400">Street / Colony</Label>
                 <Input 
                   value={form.shippingDetails.street} 
                   onChange={e => setForm({
                     ...form, 
                     shippingDetails: { ...form.shippingDetails, street: e.target.value }
                   })} 
                   className="rounded-xl h-12 bg-gray-50 border-none font-bold" 
                 />
              </div>
              <div className="space-y-1.5">
                 <Label className="text-[10px] font-black text-gray-400">Pending Remarks (Internal)</Label>
                 <Textarea 
                   value={form.pendingRemarks} 
                   onChange={e => setForm({...form, pendingRemarks: e.target.value})} 
                   placeholder="e.g. Waiting for prescription back side..."
                   className="rounded-xl min-h-[100px] bg-gray-50 border-none font-bold text-xs" 
                 />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full h-16 rounded-full font-black bg-primary text-white shadow-xl shadow-primary/20">
        {isSubmitting ? <Loader2 className="animate-spin" /> : (
          <span className="flex items-center gap-2 uppercase tracking-widest text-[11px]">
            <Save className="w-4 h-4" /> Save Changes
          </span>
        )}
      </Button>
    </form>
  );
}
