"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger 
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Plus, 
  Trash2, 
  Edit2, 
  User, 
  Activity, 
  Loader2, 
  Heart, 
  AlertCircle,
  FileText,
  ShoppingBag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { 
  useUser, 
  useFirestore, 
  useCollection, 
  useMemoFirebase,
  setDocumentNonBlocking, 
  deleteDocumentNonBlocking, 
  addDocumentNonBlocking 
} from '@/firebase';
import { collection, query, orderBy, doc, serverTimestamp } from 'firebase/firestore';

interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  age: number;
  gender: string;
  allergies?: string[];
  chronicDiseases?: string[];
  notes?: string;
}

export default function FamilyTab() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [isLoadingMeds, setIsLoadingMeds] = useState(false);
  const [selectedMeds, setSelectedMeds] = useState<any[]>([]);
  const [isMedsDialogOpen, setIsMedsDialogOpen] = useState(false);
  const [selectedMemberName, setSelectedMemberName] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('Father');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [allergies, setAllergies] = useState('');
  const [chronicDiseases, setChronicDiseases] = useState('');
  const [notes, setNotes] = useState('');

  // Fetch family members
  const familyQuery = useMemoFirebase(() => 
    (db && user) ? query(collection(db, 'userProfiles', user.uid, 'familyMembers'), orderBy('createdAt', 'desc')) : null, 
    [db, user]
  );
  const { data: familyMembers, isLoading: isFamilyLoading } = useCollection(familyQuery);

  const resetForm = () => {
    setName('');
    setRelationship('Father');
    setAge('');
    setGender('Male');
    setAllergies('');
    setChronicDiseases('');
    setNotes('');
    setEditingMember(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (member: FamilyMember) => {
    setEditingMember(member);
    setName(member.name);
    setRelationship(member.relationship);
    setAge(member.age.toString());
    setGender(member.gender);
    setAllergies(member.allergies?.join(', ') || '');
    setChronicDiseases(member.chronicDiseases?.join(', ') || '');
    setNotes(member.notes || '');
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) return;

    if (!name.trim() || !age.trim()) {
      toast({ variant: 'destructive', title: "Validation Error", description: "Name and Age are required fields." });
      return;
    }

    const payload = {
      name: name.trim(),
      relationship,
      age: parseInt(age),
      gender,
      allergies: allergies.split(',').map(s => s.trim()).filter(Boolean),
      chronicDiseases: chronicDiseases.split(',').map(s => s.trim()).filter(Boolean),
      notes: notes.trim(),
      updatedAt: serverTimestamp()
    };

    try {
      if (editingMember) {
        await setDocumentNonBlocking(
          doc(db, 'userProfiles', user.uid, 'familyMembers', editingMember.id), 
          payload, 
          { merge: true }
        );
        toast({ title: "Profile Updated", description: `${name}'s profile has been updated.` });
      } else {
        await addDocumentNonBlocking(
          collection(db, 'userProfiles', user.uid, 'familyMembers'), 
          { ...payload, createdAt: serverTimestamp() }
        );
        toast({ title: "Profile Added", description: `${name} is added to family profiles.` });
      }
      setIsDialogOpen(false);
      resetForm();
      
      // Trigger MongoDB Sync
      const idToken = await user.getIdToken();
      await fetch('/api/user/sync', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        }
      });
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: "Operation failed", description: "Could not save family profile." });
    }
  };

  const handleDelete = async (id: string, memberName: string) => {
    if (!user || !db) return;
    if (!confirm(`Are you sure you want to delete ${memberName}'s profile?`)) return;

    try {
      await deleteDocumentNonBlocking(doc(db, 'userProfiles', user.uid, 'familyMembers', id));
      toast({ title: "Profile Removed", description: `${memberName} was removed from profiles.` });
      
      // Trigger MongoDB Sync
      const idToken = await user.getIdToken();
      await fetch('/api/user/sync', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        }
      });
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: "Delete failed" });
    }
  };

  const handleViewMeds = async (memberId: string, memberName: string) => {
    if (!user) return;
    setIsLoadingMeds(true);
    setSelectedMemberName(memberName);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/user/family/medications?memberId=${memberId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch medications');
      const data = await res.json();
      setSelectedMeds(data.medications || []);
      setIsMedsDialogOpen(true);
    } catch (err) {
      toast({ variant: 'destructive', title: "Error", description: "Failed to load medication history." });
    } finally {
      setIsLoadingMeds(false);
    }
  };

  const handleReorderMeds = (meds: any[]) => {
    if (meds.length === 0) return;
    
    try {
      meds.forEach(med => {
        addToCart({
          id: med._id,
          name: med.name,
          price: med.price,
          mrp: med.mrp,
          imageUrl: med.imageUrl,
          prescriptionRequired: med.prescriptionRequired || false
        } as any, med.quantity || 1);
      });

      toast({ title: "Cart Updated", description: `Added ${meds.length} items to your shopping cart.` });
      setIsMedsDialogOpen(false);
    } catch (e) {
      toast({ variant: 'destructive', title: "Failed to add items to cart" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-4">
        <h2 className="text-[9px] font-black tracking-[0.4em] text-slate-400 uppercase">Family Health Directory</h2>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <button 
              onClick={handleOpenAdd}
              className="bg-white px-5 py-2.5 rounded-full border border-slate-100 text-[8px] font-black text-primary tracking-[0.2em] flex items-center gap-1.5 hover:bg-slate-50 transition-all uppercase active:scale-95 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Add Profile
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-md w-[94vw] rounded-[40px] border-none p-0 overflow-hidden shadow-3xl bg-white z-[160]">
            <div className="bg-primary p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
                <User className="w-20 h-20" />
              </div>
              <DialogTitle className="text-xl font-black tracking-tighter uppercase font-outfit">
                {editingMember ? 'Edit Profile' : 'New Family Profile'}
              </DialogTitle>
              <DialogDescription className="text-[8px] font-black text-white/60 tracking-[0.2em] mt-2 uppercase">
                Provide health details for personalized verification
              </DialogDescription>
            </div>
            
            <form onSubmit={handleSave} className="p-6 pb-12 space-y-5 overflow-y-auto max-h-[70vh]">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-[8px] font-black tracking-[0.2em] text-slate-400 uppercase">Full Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ramesh Kumar" className="rounded-2xl h-12" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="relationship" className="text-[8px] font-black tracking-[0.2em] text-slate-400 uppercase">Relationship</Label>
                  <Select value={relationship} onValueChange={setRelationship}>
                    <SelectTrigger className="rounded-2xl h-12">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {['Father', 'Mother', 'Spouse', 'Child', 'Sibling', 'Other'].map(rel => (
                        <SelectItem key={rel} value={rel}>{rel}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="gender" className="text-[8px] font-black tracking-[0.2em] text-slate-400 uppercase">Gender</Label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger className="rounded-2xl h-12">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {['Male', 'Female', 'Other'].map(g => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="age" className="text-[8px] font-black tracking-[0.2em] text-slate-400 uppercase">Age</Label>
                <Input id="age" type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g. 62" className="rounded-2xl h-12" required />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="allergies" className="text-[8px] font-black tracking-[0.2em] text-slate-400 uppercase">Allergies (comma separated)</Label>
                <Input id="allergies" value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="e.g. Penicillin, Sulphur" className="rounded-2xl h-12" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="chronic" className="text-[8px] font-black tracking-[0.2em] text-slate-400 uppercase">Chronic Conditions (comma separated)</Label>
                <Input id="chronic" value={chronicDiseases} onChange={(e) => setChronicDiseases(e.target.value)} placeholder="e.g. Diabetes, Hypertension" className="rounded-2xl h-12" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes" className="text-[8px] font-black tracking-[0.2em] text-slate-400 uppercase">General Notes</Label>
                <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any special instruction for pharmacy check" className="rounded-2xl h-12" />
              </div>

              <Button type="submit" className="w-full h-14 rounded-full font-black tracking-[0.2em] text-[10px] bg-primary text-white hover:bg-primary/90 uppercase active:scale-95 transition-all mt-4">
                Save Profile
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        {isFamilyLoading ? (
          <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (!familyMembers || familyMembers.length === 0) ? (
          <div className="bg-white/40 backdrop-blur-md p-16 rounded-[48px] border border-white shadow-xl text-center">
            <User className="w-12 h-12 text-slate-200 mx-auto mb-6" />
            <p className="text-[10px] font-black text-slate-300 tracking-[0.4em] uppercase">No family profiles created yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {familyMembers.map((member) => (
              <motion.div 
                key={member.id} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/40 backdrop-blur-md p-6 rounded-[32px] border border-white shadow-xl relative overflow-hidden group hover:shadow-2xl transition-all hover:bg-white"
              >
                <div className="flex items-start justify-between relative z-10">
                  <div className="flex items-start gap-5">
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-[16px] flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-all">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-black text-[9px] text-primary tracking-[0.2em] uppercase">{member.relationship}</span>
                        <span className="text-[8px] font-bold text-slate-400">• {member.age} Yrs • {member.gender}</span>
                      </div>
                      <p className="text-sm font-black text-slate-900 leading-tight uppercase tracking-tight">
                        {member.name}
                      </p>
                      
                      {/* Allergies / Chronic Conditions indicators */}
                      {(member.allergies?.length > 0 || member.chronicDiseases?.length > 0) && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {member.chronicDiseases?.map((dis: string) => (
                            <span key={dis} className="px-2 py-0.5 rounded-md bg-rose-50 border border-rose-100 text-[8px] font-black text-rose-500 uppercase tracking-wider flex items-center gap-1">
                              <Activity className="w-2.5 h-2.5 text-rose-400 animate-pulse" /> {dis}
                            </span>
                          ))}
                          {member.allergies?.map((alg: string) => (
                            <span key={alg} className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-100 text-[8px] font-black text-amber-600 uppercase tracking-wider flex items-center gap-1">
                              <AlertCircle className="w-2.5 h-2.5 text-amber-400" /> {alg}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(member)} className="h-8 w-8 rounded-full bg-white shadow-sm text-slate-300 hover:text-primary active:scale-95"><Edit2 className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(member.id, member.name)} className="h-8 w-8 rounded-full bg-white shadow-sm text-slate-300 hover:text-rose-500 active:scale-95"><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
                
                {/* Active Medicine / Quick Reorder Action Section */}
                <div className="mt-6 pt-4 border-t border-slate-100/50 flex justify-between items-center gap-4">
                  <Button 
                    variant="ghost"
                    onClick={() => handleViewMeds(member.id, member.name)}
                    className="h-8 px-4 text-[8px] font-black text-slate-500 tracking-[0.2em] uppercase rounded-full hover:bg-slate-50 flex items-center gap-2"
                  >
                    <FileText className="w-3.5 h-3.5" /> View Active Meds
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Medications Drawer / Dialog */}
      <Dialog open={isMedsDialogOpen} onOpenChange={setIsMedsDialogOpen}>
        <DialogContent className="max-w-md w-[94vw] rounded-[40px] border-none p-0 overflow-hidden shadow-3xl bg-white z-[160]">
          <div className="bg-primary p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
              <Heart className="w-20 h-20" />
            </div>
            <DialogTitle className="text-xl font-black tracking-tighter uppercase font-outfit">Active Medications</DialogTitle>
            <DialogDescription className="text-[8px] font-black text-white/60 tracking-[0.2em] mt-2 uppercase">
              Recent medicine logs for {selectedMemberName}
            </DialogDescription>
          </div>
          
          <div className="p-6 space-y-6">
            {selectedMeds.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400 font-bold text-xs uppercase">No medication records found</p>
                <p className="text-[8px] font-black text-slate-300 tracking-wider uppercase mt-1">Assign orders or upload prescriptions to start tracking</p>
              </div>
            ) : (
              <>
                <div className="max-h-[40vh] overflow-y-auto space-y-3 custom-scrollbar pr-1">
                  {selectedMeds.map((med, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/50 border border-slate-100">
                      <div>
                        <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{med.name}</p>
                        <p className="text-[7px] font-black text-slate-400 tracking-wider uppercase mt-0.5">Last Ordered: {med.lastOrdered ? new Date(med.lastOrdered).toLocaleDateString() : 'N/A'}</p>
                      </div>
                      <span className="text-[9px] font-bold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-100 shadow-sm">{med.quantity} Qty</span>
                    </div>
                  ))}
                </div>
                
                <Button 
                  onClick={() => handleReorderMeds(selectedMeds)}
                  className="w-full h-14 rounded-full font-black tracking-[0.2em] text-[10px] bg-primary text-white hover:bg-primary/90 uppercase active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                >
                  <ShoppingBag className="w-4 h-4" /> Reorder {selectedMemberName}'s Meds
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
