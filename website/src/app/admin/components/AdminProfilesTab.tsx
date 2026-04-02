"use client"

import { useState } from 'react';
import { 
  ShieldCheck, 
  UserPlus, 
  Trash2, 
  Shield, 
  UserCircle,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';
import { useUser } from '@/firebase'; // Added user hook
import { SectionHeader } from './SectionHeader';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export function AdminProfilesTab({ db, isVerified, onBack }: { db: any, isVerified: boolean, onBack: () => void }) {
  const { toast } = useToast();
  const { user } = useUser();
  const [adminList, setAdminList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ uid: '', role: 'sub-admin', name: '', email: '' });

  const fetchAdmins = async () => {
    setIsLoading(true);
    try {
      const token = await user?.getIdToken();
      const res = await fetch('/api/admin/profiles', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setAdminList(data);
      else throw new Error(data.error || "Fetch failed");
    } catch (err: any) {
      toast({ variant: 'destructive', title: "Authority List Unavailable", description: "Bootstrap or log in again." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { 
    if (isVerified) fetchAdmins(); 
  }, [isVerified]);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalId = newAdmin.uid || newAdmin.email;
    if (!finalId) return;

    try {
      const token = await user?.getIdToken();
      const res = await fetch('/api/admin/profiles', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...newAdmin, id: newAdmin.uid })
      });
      if (!res.ok) throw new Error("Provisioning failed");
      
      toast({ title: "Authority Granted", description: `User role set to ${newAdmin.role} in MongoDB` });
      setIsFormOpen(false);
      setNewAdmin({ uid: '', role: 'sub-admin', name: '', email: '' });
      fetchAdmins();
    } catch (err: any) {
      toast({ variant: 'destructive', title: "Provisioning failed", description: err.message });
    }
  };

  const updateRole = async (uid: string, newRole: string) => {
    try {
      const token = await user?.getIdToken();
      const res = await fetch('/api/admin/profiles', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ id: uid, role: newRole })
      });
      if (res.ok) {
        toast({ title: "Access Level Updated" });
        fetchAdmins();
      }
    } catch (err) {
      toast({ variant: 'destructive', title: "Update failed" });
    }
  };

  const deleteAdmin = async (id: string) => {
    if (!confirm("Revoke all access?")) return;
    try {
      const token = await user?.getIdToken();
      const res = await fetch(`/api/admin/profiles?id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast({ title: "Admin Revoked" });
        fetchAdmins();
      }
    } catch (err) {
      toast({ variant: 'destructive', title: "Revocation failed" });
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <SectionHeader title="Team Architecture" subtitle="Administrative Hierarchy & Access Control" onBack={onBack}>
        <Button onClick={() => setIsFormOpen(true)} className="rounded-full h-14 px-10 font-black text-[10px] bg-primary text-white shadow-2xl shadow-primary/30 uppercase tracking-widest hover:scale-105 transition-all border-4 border-white active:scale-95">
          <UserPlus className="w-5 h-5 mr-3" /> Recruit Admin
        </Button>
      </SectionHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => <div key={i} className="h-64 bg-white/50 animate-pulse rounded-[48px]" />)
        ) : (!adminList || adminList.length === 0) ? (
          <div className="col-span-full p-20 text-center space-y-4">
             <Shield className="w-16 h-16 mx-auto text-slate-200" />
             <p className="font-black text-slate-300 uppercase tracking-widest text-[10px]">No MongoDB profiles found</p>
             <Button onClick={() => setIsFormOpen(true)} className="rounded-full bg-slate-900 text-white font-black text-[10px] px-8">Bootstrap First Admin</Button>
          </div>
        ) : adminList?.map((admin: any) => (
          <Card key={admin.id || admin.uid} className="rounded-[44px] p-10 border-none shadow-xl bg-white group hover:shadow-2xl transition-all border border-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Shield className="w-24 h-24" />
            </div>
            
            <div className="flex items-center gap-6 mb-8">
              <div className={cn("w-16 h-16 rounded-[24px] flex items-center justify-center shadow-inner", 
                admin.role === 'admin' ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-400"
              )}>
                <UserCircle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-black text-sm uppercase tracking-tight">{admin.name || 'Anonymous Admin'}</h3>
                <p className="text-[10px] font-bold text-slate-400">{admin.email || admin.id?.slice(0, 12) + '...'}</p>
              </div>
            </div>

            <div className="space-y-6 relative z-10">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black tracking-widest text-slate-300 uppercase">Access Role</span>
                <div className={cn("rounded-full font-black text-[8px] px-3 py-1", 
                  admin.role === 'admin' ? "bg-primary text-white" : 
                  admin.role === 'pharmacist' ? "bg-orange-500 text-white" : "bg-slate-900 text-white"
                )}>{admin.role}</div>
              </div>

              <div className="pt-4 border-t border-slate-50">
                <Select defaultValue={admin.role} onValueChange={(val) => updateRole(admin.id || admin.uid, val)}>
                  <SelectTrigger className="w-full h-12 rounded-2xl bg-slate-50 border-none font-bold text-[10px] uppercase shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl">
                    <SelectItem value="admin">Super Admin</SelectItem>
                    <SelectItem value="pharmacist">Pharmacist</SelectItem>
                    <SelectItem value="sub-admin">Sub-Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400">
                  <Clock className="w-3 h-3" />
                  {admin.activatedAt ? format(new Date(admin.activatedAt), 'MMM dd, yyyy') : 'No date'}
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteAdmin(admin.id || admin.uid)} className="text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="rounded-[48px] border-none p-0 overflow-hidden shadow-4xl max-w-lg">
          <div className="bg-primary p-10 text-white relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <ShieldCheck className="w-24 h-24" />
            </div>
            <DialogTitle className="text-3xl font-black font-outfit uppercase tracking-tighter">Issue Credentials</DialogTitle>
            <DialogDescription className="text-xs font-black text-white/60 tracking-widest mt-2 uppercase">
              Granting authority to the Sahimed Matrix
            </DialogDescription>
          </div>
          <form onSubmit={handleCreateAdmin} className="p-10 space-y-8">
            <div className="space-y-4">
              <Label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">User UID (from Firebase)</Label>
              <Input placeholder="PASTE FIREBASE USER ID..." value={newAdmin.uid} onChange={e => setNewAdmin({...newAdmin, uid: e.target.value})} required className="h-14 rounded-2xl bg-slate-50 border-none font-bold" />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <Label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Display Name</Label>
                <Input placeholder="NAME..." value={newAdmin.name} onChange={e => setNewAdmin({...newAdmin, name: e.target.value})} className="h-14 rounded-2xl bg-slate-50 border-none font-bold" />
              </div>
              <div className="space-y-4">
                <Label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Access Level</Label>
                <Select value={newAdmin.role} onValueChange={(val) => setNewAdmin({...newAdmin, role: val})}>
                  <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-[10px] uppercase">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl">
                    <SelectItem value="admin">Super Admin</SelectItem>
                    <SelectItem value="pharmacist">Pharmacist</SelectItem>
                    <SelectItem value="sub-admin">Sub-Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-4">
              <Label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Registered Email</Label>
              <Input type="email" placeholder="EMAIL@SAHIMED.COM" value={newAdmin.email} onChange={e => setNewAdmin({...newAdmin, email: e.target.value})} className="h-14 rounded-2xl bg-slate-50 border-none font-bold" />
            </div>
            <Button type="submit" className="w-full h-16 rounded-full font-black text-xs tracking-widest bg-primary text-white shadow-xl shadow-primary/20 uppercase hover:scale-[1.02] transition-all">Activate Profile</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return <span className={cn("px-2 py-1 rounded-md", className)}>{children}</span>;
}
