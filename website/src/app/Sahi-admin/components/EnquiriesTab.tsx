import { useState } from 'react';
import { 
  Loader2, 
  Wand2,
  ImageIcon,
  CheckCircle,
  Edit3,
  Trash2,
  AlertCircle,
  Plus
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogTitle, 
  DialogDescription,
  DialogHeader,
  DialogFooter
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { 
  useMemoFirebase, 
  useCollection,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking
} from '@/firebase';
import { collectionGroup, query, limit, doc, serverTimestamp } from 'firebase/firestore';
import { SectionHeader } from './SectionHeader';
import { OrderCreationForm } from './OrderCreationForm';
import { EnquiryEditForm } from './EnquiryEditForm';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { safeFormat } from '@/lib/safe-date';

export function EnquiriesTab({ db, isVerified, onBack }: { db: any, isVerified: boolean, onBack: () => void }) {
  const { toast } = useToast();
  const presQuery = useMemoFirebase(() => isVerified ? query(collectionGroup(db, 'prescriptions'), limit(50)) : null, [db, isVerified]);
  const { data: enquiries, isLoading } = useCollection(presQuery);
  const [selectedEnquiry, setSelectedEnquiry] = useState<any>(null);
  const [actionMode, setActionMode] = useState<'DIGITIZE' | 'EDIT' | 'DELETE' | 'COMPLETE' | null>(null);
  const [statusFilter, setStatusFilter] = useState<'Pending' | 'Open' | 'Completed'>('Pending');
  const [completionRemark, setCompletionRemark] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const filteredEnquiries = enquiries?.filter(enq => {
    const status = (enq.status || 'Pending Review').toLowerCase();
    if (statusFilter === 'Pending') return status === 'pending review';
    if (statusFilter === 'Open') return status === 'in process' || status === 'processing';
    if (statusFilter === 'Completed') return status === 'digitized' || status === 'completed';
    return false;
  });

  const handleAction = (enq: any, mode: 'DIGITIZE' | 'EDIT' | 'DELETE' | 'COMPLETE') => {
    setSelectedEnquiry(enq);
    setActionMode(mode);
  };

  const executeDelete = async () => {
    if (!selectedEnquiry) return;
    setIsProcessing(true);
    try {
      const path = selectedEnquiry.__path || selectedEnquiry.path || `prescriptions/${selectedEnquiry.id}`;
      await deleteDocumentNonBlocking(doc(db, path));
      toast({ title: "Enquiry deleted", description: "Record has been removed from the prescription queue." });
      setSelectedEnquiry(null);
    } catch (err: any) {
      toast({ variant: 'destructive', title: "Deletion failed", description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const executeComplete = async () => {
    if (!selectedEnquiry) return;
    setIsProcessing(true);
    try {
      const path = selectedEnquiry.__path || selectedEnquiry.path || `prescriptions/${selectedEnquiry.id}`;
      await updateDocumentNonBlocking(doc(db, path), {
        status: 'completed',
        remarks: completionRemark,
        completedAt: serverTimestamp()
      });
      toast({ title: "Prescription order completed", description: "The enquiry has been marked as finished." });
      setSelectedEnquiry(null);
      setCompletionRemark('');
    } catch (err: any) {
      toast({ variant: 'destructive', title: "Update failed", description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2">
      <SectionHeader title="Digitize enquiries" subtitle="Manage and process prescription records" onBack={onBack}>
        <Button 
          onClick={() => handleAction({}, 'DIGITIZE')} 
          className="rounded-full h-12 bg-primary text-white font-black px-6 shadow-xl shadow-primary/20 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create Manual Order
        </Button>
      </SectionHeader>
      
      <div className="bg-white p-1 rounded-full border flex w-fit gap-1 mb-8">
        {['Pending', 'Open', 'Completed'].map((status) => (
          <button 
            key={status} 
            onClick={() => setStatusFilter(status as any)} 
            className={cn(
              "px-8 py-2.5 rounded-full text-[10px] font-black tracking-widest transition-all", 
              statusFilter === status ? "bg-primary text-white shadow-lg scale-105" : "text-gray-400 hover:bg-gray-50"
            )}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-[40px] bg-white animate-pulse shadow-sm border border-slate-50 p-6 flex flex-col space-y-4">
              <div className="flex-1 bg-slate-50 rounded-3xl" />
              <div className="h-4 bg-slate-100 rounded-full w-3/4" />
              <div className="h-4 bg-slate-50 rounded-full w-1/2" />
            </div>
          ))
        ) : (!filteredEnquiries || filteredEnquiries.length === 0) ? (
          <div className="col-span-full py-20 text-center font-black text-gray-400 text-[10px] uppercase tracking-widest">No entries in queue</div>
        ) : filteredEnquiries.map(enq => {
          const displayImg = enq.imageUrls?.[0] || enq.imageUrl;
          const docCount = enq.imageUrls?.length || (enq.imageUrl ? 1 : 0);
          return (
            <Card key={enq.id} className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white p-6 hover:shadow-2xl transition-all group border-2 border-transparent hover:border-primary/5">
              <div className="aspect-[3/4] rounded-3xl bg-gray-50 mb-6 overflow-hidden border relative">
                {displayImg ? (
                  <img src={displayImg} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-200">
                    <ImageIcon className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                   <Badge className="bg-primary text-white text-[8px] font-black uppercase shadow-lg px-3 py-1 rounded-full">{enq?.status || 'Pending'}</Badge>
                   {docCount > 1 && <Badge className="bg-white/90 backdrop-blur-sm text-primary border border-primary/20 text-[8px] font-black uppercase shadow-sm px-3 py-1 rounded-full">+{docCount - 1} DOCS</Badge>}
                </div>
                
                {/* Action Hover Overlay */}
                {statusFilter !== 'Completed' && (
                  <div className="absolute inset-x-4 bottom-4 translate-y-full group-hover:translate-y-0 transition-transform flex gap-2">
                     <Button onClick={() => handleAction(enq, 'DIGITIZE')} className="flex-1 rounded-2xl h-14 font-black text-[10px] bg-primary text-white gap-2 shadow-2xl">
                       <Wand2 className="w-4 h-4" /> Digitize
                     </Button>
                  </div>
                )}
              </div>

              <div className="px-1">
                <p className="font-black text-sm mb-1 truncate uppercase tracking-tight text-gray-900">{enq?.patientName || 'Patient Name'}</p>
                <div className="flex items-center justify-between mb-6">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">#{enq.id.slice(-6)} • {enq.phoneNumber || 'NO MOBILE'}</p>
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">{safeFormat(enq.uploadDate || enq.createdAt, 'dd MMM HH:mm')}</p>
                </div>
                
                {enq.pendingRemarks && (
                  <div className="mb-6 p-4 rounded-2xl bg-amber-50/50 border border-amber-100 flex gap-3">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <p className="text-[10px] font-black text-amber-600 leading-relaxed italic truncate">“{enq.pendingRemarks}”</p>
                  </div>
                )}
                
                {enq.remarks && statusFilter === 'Completed' && (
                  <div className="mb-6 p-4 rounded-2xl bg-green-50/50 border border-green-100 flex gap-3">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                    <p className="text-[10px] font-black text-green-600 leading-relaxed truncate">“{enq.remarks}”</p>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1">
                    <Button 
                      onClick={() => handleAction(enq, 'EDIT')} 
                      variant="ghost" 
                      className="w-full rounded-2xl h-12 text-gray-400 hover:text-primary hover:bg-primary/5 transition-all"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="col-span-1">
                    {statusFilter !== 'Completed' && (
                      <Button 
                        onClick={() => handleAction(enq, 'COMPLETE')} 
                        variant="ghost" 
                        className="w-full rounded-2xl h-12 text-gray-400 hover:text-green-600 hover:bg-green-50 transition-all"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <div className="col-span-1">
                    <Button 
                      onClick={() => handleAction(enq, 'DELETE')} 
                      variant="ghost" 
                      className="w-full rounded-2xl h-12 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Primary Digitize/Order Form */}
      <Dialog open={actionMode === 'DIGITIZE'} onOpenChange={o => !o && setActionMode(null)}>
        <DialogContent className="rounded-[40px] max-w-5xl border-none p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="bg-primary p-8 text-white flex flex-row items-center justify-between space-y-0">
            <div>
              <DialogTitle className="text-2xl font-black italic tracking-tighter text-white">CREATE MANUAL ORDER</DialogTitle>
              <DialogDescription className="text-[10px] font-black text-white/50 tracking-widest mt-1 uppercase">
                Authorize record entry and prescription digitization
              </DialogDescription>
            </div>
          </DialogHeader>
          <div className="p-8 h-[80vh] overflow-y-auto scrollbar-hide bg-white">
            {selectedEnquiry && (
              <OrderCreationForm 
                enquiry={selectedEnquiry} 
                db={db}
                onSuccess={() => { setActionMode(null); setSelectedEnquiry(null); }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modify Metadata Form */}
      <Dialog open={actionMode === 'EDIT'} onOpenChange={o => !o && setActionMode(null)}>
        <DialogContent className="rounded-[40px] max-w-2xl border-none p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="bg-blue-600 p-8 text-white space-y-2">
             <DialogTitle className="text-2xl font-black italic tracking-tighter uppercase text-white">Modify Enquiry</DialogTitle>
             <DialogDescription className="text-[10px] font-black text-white/50 tracking-widest uppercase">Updates patient records and pending remarks</DialogDescription>
          </DialogHeader>
          <div className="p-8 bg-white">
             {selectedEnquiry && (
               <EnquiryEditForm 
                 enquiry={selectedEnquiry} 
                 db={db} 
                 onSuccess={() => { setActionMode(null); setSelectedEnquiry(null); }}
               />
             )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Completion Remarks Dialog */}
      <Dialog open={actionMode === 'COMPLETE'} onOpenChange={o => !o && setActionMode(null)}>
        <DialogContent className="rounded-[40px] max-w-md border-none p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="bg-green-600 p-8 text-white space-y-2">
             <DialogTitle className="text-xl font-black uppercase tracking-tighter text-white">Close Medical Queue</DialogTitle>
             <DialogDescription className="text-[10px] font-black text-white/50 tracking-widest uppercase">Add final remarks to complete this entry</DialogDescription>
          </DialogHeader>
          <div className="p-8 bg-white space-y-6">
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400">Final Remarks</label>
                <Textarea 
                  placeholder="e.g. Processed manually via offline pharmacy" 
                  value={completionRemark}
                  onChange={e => setCompletionRemark(e.target.value)}
                  className="rounded-2xl min-h-[120px] bg-gray-50 border-none font-bold text-xs"
                />
             </div>
             <div className="flex gap-4">
                <Button onClick={() => setActionMode(null)} variant="ghost" className="flex-1 h-14 rounded-full font-black uppercase text-[10px]">Cancel</Button>
                <Button 
                  onClick={executeComplete} 
                  disabled={isProcessing}
                  className="flex-[2] h-14 rounded-full font-black uppercase text-[10px] bg-green-600 text-white shadow-xl shadow-green-200"
                >
                  {isProcessing ? <Loader2 className="animate-spin" /> : "Confirm Completion"}
                </Button>
             </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deletion Confirmation Dialog */}
      <Dialog open={actionMode === 'DELETE'} onOpenChange={o => !o && setActionMode(null)}>
        <DialogContent className="rounded-[40px] max-w-sm border-none p-0 overflow-hidden shadow-2xl text-center">
          <div className="p-10 space-y-6 bg-white">
             <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
                <Trash2 className="w-8 h-8" />
             </div>
             <DialogHeader>
                <DialogTitle className="text-xl font-black uppercase tracking-tighter">Purge Record?</DialogTitle>
                <DialogDescription className="text-xs font-bold text-gray-400 leading-relaxed px-4">
                  This prescription record will be permanently purged from the server. This action cannot be undone.
                </DialogDescription>
             </DialogHeader>
             <div className="flex flex-col gap-3">
                <Button 
                  onClick={executeDelete} 
                  disabled={isProcessing}
                  className="h-14 rounded-full font-black uppercase text-[10px] bg-red-500 text-white shadow-xl shadow-red-200"
                >
                  {isProcessing ? <Loader2 className="animate-spin" /> : "Delete Permanently"}
                </Button>
                <Button onClick={() => setActionMode(null)} variant="ghost" className="h-10 text-gray-400 font-bold text-[10px] hover:text-gray-900">Cancel Action</Button>
             </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
