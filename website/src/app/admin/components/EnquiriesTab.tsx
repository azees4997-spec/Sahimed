"use client"

import { useState } from 'react';
import { 
  Loader2, 
  Wand2,
  ImageIcon
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { 
  useMemoFirebase, 
  useCollection 
} from '@/firebase';
import { collectionGroup, query, limit } from 'firebase/firestore';
import { SectionHeader } from './SectionHeader';
import { OrderCreationForm } from './OrderCreationForm';

export function EnquiriesTab({ db, isVerified, onBack }: { db: any, isVerified: boolean, onBack: () => void }) {
  const presQuery = useMemoFirebase(() => isVerified ? query(collectionGroup(db, 'prescriptions'), limit(50)) : null, [db, isVerified]);
  const { data: enquiries, isLoading } = useCollection(presQuery);
  const [selectedEnquiry, setSelectedEnquiry] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<'Pending' | 'Open' | 'Completed'>('Pending');

  const filteredEnquiries = enquiries?.filter(enq => {
    const status = (enq.status || 'Pending Review').toLowerCase();
    if (statusFilter === 'Pending') return status === 'pending review';
    if (statusFilter === 'Open') return status === 'in process' || status === 'processing';
    if (statusFilter === 'Completed') return status === 'digitized' || status === 'completed';
    return false;
  });

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2">
      <SectionHeader title="Clinical enquiries" subtitle="Prescription review queue" onBack={onBack} />
      <div className="bg-white p-1 rounded-full border flex w-fit gap-1 mb-8">
        {['Pending', 'Open', 'Completed'].map((status) => (<button key={status} onClick={() => setStatusFilter(status as any)} className={cn("px-8 py-2.5 rounded-full text-[10px] font-black tracking-widest transition-all", statusFilter === status ? "bg-primary text-white shadow-lg scale-105" : "text-gray-400 hover:bg-gray-50")}>{status}</button>))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-8">
        {isLoading ? (<div className="col-span-full py-20 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></div>) : (!filteredEnquiries || filteredEnquiries.length === 0) ? (<div className="col-span-full py-20 text-center font-black text-gray-400 text-[10px]">No matches found</div>) : filteredEnquiries.map(enq => {
          const displayImg = enq.imageUrls?.[0] || enq.imageUrl;
          const docCount = enq.imageUrls?.length || (enq.imageUrl ? 1 : 0);
          return (
            <Card key={enq.id} className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white p-6 hover:shadow-2xl transition-all">
              <div className="aspect-[3/4] rounded-3xl bg-gray-50 mb-6 overflow-hidden border relative">
                {displayImg ? (
                  <img src={displayImg} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-200">
                    <ImageIcon className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                   <Badge className="bg-primary text-white text-[8px] font-black uppercase shadow-lg">{enq?.status || 'Pending'}</Badge>
                   {docCount > 1 && <Badge className="bg-white text-primary border border-primary/20 text-[8px] font-black uppercase shadow-sm">+{docCount - 1} DOCS</Badge>}
                </div>
              </div>
              <p className="font-black text-sm mb-6 truncate uppercase tracking-tight">{enq?.patientName || 'Patient'}</p>
              {statusFilter !== 'Completed' && (<Button onClick={() => setSelectedEnquiry(enq)} className="w-full rounded-full h-12 font-black text-[10px] bg-primary text-white gap-2"><Wand2 className="w-3.5 h-3.5" /> Digitize</Button>)}
            </Card>
          );
        })}
      </div>

      <Dialog open={!!selectedEnquiry} onOpenChange={o => !o && setSelectedEnquiry(null)}>
        <DialogContent className="rounded-[40px] max-w-5xl border-none p-0 overflow-hidden">
          <div className="bg-primary p-8 text-white flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-black">Create manual order</DialogTitle>
              <DialogDescription className="text-[10px] font-black text-white/60 tracking-widest mt-1 uppercase">
                Authorize manual entry and prescription digitization
              </DialogDescription>
            </div>
          </div>
          <div className="p-8 h-[80vh] overflow-y-auto scrollbar-hide">
            {selectedEnquiry && (
              <OrderCreationForm 
                enquiry={selectedEnquiry} 
                db={db}
                onSuccess={() => { setSelectedEnquiry(null); }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
