"use client"

import { useState } from 'react';
import { 
  Loader2, 
  Search, 
  Edit2 
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader,
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  useMemoFirebase, 
  useCollection,
  updateDocumentNonBlocking
} from '@/firebase';
import { doc, collection, query, orderBy, serverTimestamp, limit } from 'firebase/firestore';
import { SectionHeader } from './SectionHeader';

export function CustomersTab({ db, isVerified, onBack }: { db: any, isVerified: boolean, onBack: () => void }) {
  const usersQuery = useMemoFirebase(() => isVerified ? query(collection(db, 'userProfiles'), orderBy('createdAt', 'desc'), limit(50)) : null, [db, isVerified]);
  const { data: users, isLoading } = useCollection(usersQuery);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const { toast } = useToast();

  const handleUpdateUser = (id: string, updates: any) => {
    updateDocumentNonBlocking(doc(db, 'userProfiles', id), { ...updates, updatedAt: serverTimestamp() });
    toast({ title: "Customer profile updated" });
    setSelectedUser(null);
  };

  const filteredUsers = users?.filter(patient => {
    const s = searchTerm.toLowerCase();
    const name = String(patient.name || '').toLowerCase();
    const id = String(patient.phone || patient.email || '').toLowerCase();
    return name.includes(s) || id.includes(s);
  });

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2">
      <SectionHeader title="Customer Directory" subtitle="Manage profiles and demographics" onBack={onBack} />
      <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" /><Input placeholder="Search customers..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 rounded-2xl h-12 bg-white border-none font-bold text-xs" /></div>
      <Card className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] font-black text-gray-400 border-b">
              <tr><th className="px-10 py-8">Name</th><th className="px-10 py-8">Identifier</th><th className="px-10 py-8">Tags</th><th className="px-10 py-8 text-right">Action</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td className="px-10 py-8"><div className="w-32 h-4 bg-slate-100 animate-pulse rounded-full" /></td>
                    <td className="px-10 py-8"><div className="w-24 h-4 bg-slate-100 animate-pulse rounded-full" /></td>
                    <td className="px-10 py-8"><div className="flex gap-2"><div className="w-12 h-4 bg-slate-50 animate-pulse rounded-full" /><div className="w-12 h-4 bg-slate-50 animate-pulse rounded-full" /></div></td>
                    <td className="px-10 py-8 text-right"><div className="flex justify-end"><div className="w-8 h-8 bg-slate-50 animate-pulse rounded-lg" /></div></td>
                  </tr>
                ))
              ) : filteredUsers?.map(patient => (
                <tr key={patient.id} className="hover:bg-gray-50/50">
                  <td className="px-10 py-8 font-black text-sm">{patient.name || 'SahiMed member'}</td>
                  <td className="px-10 py-8 font-bold text-sm text-primary">{patient.phone || patient.email}</td>
                  <td className="px-10 py-8 flex flex-wrap gap-1">
                    {(patient.tags || []).map((t: string) => <Badge key={t} className="bg-gray-100 text-gray-400 text-[8px] font-black">{t}</Badge>)}
                    {(!patient.tags || patient.tags.length === 0) && <span className="text-[10px] text-gray-300 font-bold italic">No tags</span>}
                  </td>
                  <td className="px-10 py-8 text-right"><Button variant="ghost" size="icon" onClick={() => setSelectedUser(patient)}><Edit2 className="w-4 h-4" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      
      <Dialog open={!!selectedUser} onOpenChange={o => !o && setSelectedUser(null)}>
        <DialogContent className="rounded-[40px] max-w-lg border-none p-0 overflow-hidden">
          <DialogHeader className="bg-primary p-8 text-white space-y-2">
            <DialogTitle className="text-2xl font-black text-white">Customer Card</DialogTitle>
            <DialogDescription className="text-[10px] font-black text-white/60 tracking-widest uppercase">
              User profile summary and administrative tags
            </DialogDescription>
          </DialogHeader>
          <div className="p-8 space-y-6">
            <div className="space-y-2"><Label className="text-[10px] font-black">Display Name</Label><Input value={selectedUser?.name} onChange={e => setSelectedUser({...selectedUser, name: e.target.value})} className="rounded-2xl h-14 bg-gray-50 border-none font-bold" /></div>
            <div className="space-y-2"><Label className="text-[10px] font-black">Administrative Tags (Comma separated)</Label><Input value={selectedUser?.tags?.join(', ')} onChange={e => setSelectedUser({...selectedUser, tags: e.target.value.split(',').map(t => t.trim())})} className="rounded-2xl h-14 bg-gray-50 border-none font-bold" placeholder="VIP, Chronic, Priority" /></div>
            <Button onClick={() => handleUpdateUser(selectedUser.id, { name: selectedUser.name, tags: selectedUser.tags })} className="w-full h-16 rounded-full font-black bg-primary text-white">Save Record</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
