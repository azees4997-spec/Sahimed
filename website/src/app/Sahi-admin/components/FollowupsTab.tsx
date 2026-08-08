"use client"

import { useState, useEffect, useRef } from 'react';
import { 
  Phone, 
  MessageSquare, 
  Calendar, 
  Clock, 
  Plus, 
  Search, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  DollarSign, 
  FileText, 
  Trash2, 
  Edit3, 
  X,
  PackageCheck,
  UserCheck
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { useUser } from '@/firebase';
import { SectionHeader } from './SectionHeader';

export function FollowupsTab({ db, isVerified, onBack }: { db: any, isVerified: boolean, onBack: () => void }) {
  const [followups, setFollowups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'due' | 'pending' | 'converted' | 'closed'>('all');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [newNote, setNewNote] = useState('');
  const [newStatus, setNewStatus] = useState('Called - Follow-up Set');
  const [rescheduleDate, setRescheduleDate] = useState('');

  const { user } = useUser();
  const { toast } = useToast();

  const fetchFollowups = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/followups?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setFollowups(data);
      }
    } catch (e) {
      console.error('Fetch followups failed', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(fetchFollowups, 300);
    return () => clearTimeout(delay);
  }, [searchQuery]);

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredList = followups.filter(f => {
    if (activeFilter === 'due') {
      return f.scheduledDate <= todayStr && f.status !== 'Closed' && f.status !== 'Called - Order Placed';
    }
    if (activeFilter === 'pending') {
      return f.status === 'Pending Call' || f.status === 'Called - Follow-up Set';
    }
    if (activeFilter === 'converted') {
      return f.status === 'Called - Order Placed';
    }
    if (activeFilter === 'closed') {
      return f.status === 'Closed';
    }
    return true;
  });

  const dueCount = followups.filter(f => f.scheduledDate <= todayStr && f.status !== 'Closed' && f.status !== 'Called - Order Placed').length;
  const convertedCount = followups.filter(f => f.status === 'Called - Order Placed').length;
  const totalPipelineValue = followups
    .filter(f => f.status !== 'Closed')
    .reduce((sum, f) => sum + (f.estimatedOrderValue || 0), 0);

  const handleOpenWhatsApp = (patient: any) => {
    const cleanPhone = patient.mobile.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    
    const itemList = (patient.enquiredItems || [])
      .map((it: any) => `• ${it.itemName} (${it.quantityEnquired}) - ₹${it.currentPrice}`)
      .join('\n');

    const message = `Namaste ${patient.customerName} ji! 🙏\n\nThis is SahiMed Pharmacy following up regarding your monthly medicine refill:\n${itemList || 'Your requested medicines'}\n\nTotal Estimated: ₹${patient.estimatedOrderValue || 0}\n\nWe offer 100% authentic medicines, up to 61% savings & express delivery. Reply to confirm your order today! 💊`;
    
    window.open(`https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleSaveNote = async () => {
    if (!selectedPatient) return;
    try {
      const token = await user?.getIdToken();
      const payload: any = {
        newCallNote: newNote.trim(),
        status: newStatus,
      };
      if (rescheduleDate) {
        payload.scheduledDate = rescheduleDate;
      }

      const res = await fetch(`/api/admin/followups/${selectedPatient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to update note');
      toast({ title: 'Call log updated!' });
      setIsNoteModalOpen(false);
      setNewNote('');
      setRescheduleDate('');
      fetchFollowups();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Update failed', description: err.message });
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2">
      <SectionHeader 
        title="Patient Refill & Follow-ups CRM 📞" 
        subtitle="Track customer refill inquiries, schedule monthly call dates, and log conversation notes" 
        onBack={onBack}
      >
        <Button 
          onClick={() => { setEditingItem(null); setIsFormOpen(true); }} 
          className="rounded-full h-14 px-8 font-black text-xs bg-primary text-white shadow-xl shadow-primary/20 hover:scale-105 transition-all"
        >
          <Plus className="w-4 h-4 mr-2" /> Log Patient Inquiry
        </Button>
      </SectionHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card className={`rounded-[32px] p-6 border-none shadow-sm transition-all ${dueCount > 0 ? 'bg-rose-600 text-white animate-pulse' : 'bg-white text-slate-800'}`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Due Today / Overdue</span>
            <AlertCircle className="w-5 h-5 opacity-90" />
          </div>
          <p className="text-3xl font-black font-outfit mt-2">{dueCount}</p>
          <p className="text-[10px] font-bold mt-1 opacity-80">Patients awaiting refill call</p>
        </Card>

        <Card className="rounded-[32px] p-6 bg-white border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-black uppercase tracking-widest">Active Follow-ups</span>
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <p className="text-3xl font-black text-slate-900 font-outfit mt-2">{followups.length}</p>
          <p className="text-[10px] font-bold text-slate-400 mt-1">Total Scheduled Pipeline</p>
        </Card>

        <Card className="rounded-[32px] p-6 bg-white border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-black uppercase tracking-widest">Converted Orders</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-3xl font-black text-emerald-600 font-outfit mt-2">{convertedCount}</p>
          <p className="text-[10px] font-bold text-slate-400 mt-1">Successfully fulfilled</p>
        </Card>

        <Card className="rounded-[32px] p-6 bg-white border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-black uppercase tracking-widest">Pipeline Potential</span>
            <DollarSign className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-black text-slate-900 font-outfit mt-2">₹{totalPipelineValue.toLocaleString()}</p>
          <p className="text-[10px] font-bold text-slate-400 mt-1">Enquired Order Potential</p>
        </Card>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-6 rounded-[32px] shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search by patient name, phone number, or medicine..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full h-14 bg-slate-50 rounded-2xl pl-12 pr-6 font-bold text-sm outline-none focus:bg-slate-100/50 focus:ring-2 focus:ring-primary/20 transition-all text-slate-900"
          />
        </div>

        <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl shrink-0 gap-1">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${activeFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
          >
            All ({followups.length})
          </button>
          <button
            onClick={() => setActiveFilter('due')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${activeFilter === 'due' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-500'}`}
          >
            🚨 Due Today ({dueCount})
          </button>
          <button
            onClick={() => setActiveFilter('converted')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${activeFilter === 'converted' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500'}`}
          >
            ✅ Converted ({convertedCount})
          </button>
        </div>
      </div>

      {/* Patient Cards List */}
      <div className="space-y-4">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => (
            <Card key={i} className="rounded-[32px] p-6 bg-white animate-pulse space-y-4">
              <div className="w-48 h-5 bg-slate-100 rounded-full" />
              <div className="w-32 h-3 bg-slate-50 rounded-full" />
            </Card>
          ))
        ) : filteredList.length === 0 ? (
          <Card className="rounded-[32px] p-16 text-center bg-white border-none shadow-sm space-y-3">
            <UserCheck className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-black text-slate-800 uppercase font-outfit">No follow-ups match current filter</h3>
            <p className="text-xs text-slate-400">Click "Log Patient Inquiry" above to schedule a new customer follow-up call.</p>
          </Card>
        ) : (
          filteredList.map((patient) => {
            const isDueToday = patient.scheduledDate <= todayStr && patient.status !== 'Closed' && patient.status !== 'Called - Order Placed';

            return (
              <Card key={patient.id} className={`rounded-[32px] p-6 bg-white border transition-all ${isDueToday ? 'border-rose-300 shadow-md ring-2 ring-rose-500/10' : 'border-slate-100 shadow-sm'}`}>
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                  {/* Patient Info */}
                  <div className="space-y-2 max-w-md">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-black text-slate-900 uppercase font-outfit">{patient.customerName}</h3>
                      <a 
                        href={`tel:${patient.mobile}`} 
                        className="inline-flex items-center gap-1.5 text-xs font-black text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1 rounded-full transition-all"
                      >
                        <Phone className="w-3.5 h-3.5" /> {patient.mobile}
                      </a>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" /> Target Call Date:
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full font-black uppercase text-[10px] ${
                        isDueToday ? 'bg-rose-100 text-rose-700 font-extrabold animate-bounce' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {isDueToday ? '🚨 Due Today' : patient.scheduledDate}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full font-black uppercase text-[10px] ${
                        patient.status === 'Called - Order Placed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {patient.status}
                      </span>
                    </div>

                    {/* Previous Notes */}
                    {patient.lastCallNotes && (
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1 mt-2">
                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Previous Call Notes</p>
                        <p className="text-xs font-medium text-slate-700 italic">"{patient.lastCallNotes}"</p>
                      </div>
                    )}
                  </div>

                  {/* Enquired Medicines Breakdown */}
                  <div className="flex-1 bg-slate-50/70 p-4 rounded-2xl border border-slate-100 space-y-2 w-full lg:w-auto">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-200/60">
                      <span>Enquired Medicine</span>
                      <span>Qty Enquired</span>
                      <span>Current Price</span>
                      <span>Line Total</span>
                    </div>
                    {patient.enquiredItems?.map((it: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-xs font-bold text-slate-800">
                        <span className="truncate max-w-[180px] text-slate-900">{it.itemName}</span>
                        <span className="text-slate-500 font-mono">{it.quantityEnquired}</span>
                        <span className="text-slate-600 font-mono">₹{it.currentPrice}</span>
                        <span className="font-mono text-emerald-700 font-black">₹{it.totalValue || (it.currentPrice * 1)}</span>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs font-black">
                      <span className="uppercase text-slate-500">Estimated Order Total:</span>
                      <span className="text-sm font-black text-primary font-mono">₹{patient.estimatedOrderValue || 0}</span>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex flex-row lg:flex-col gap-2 shrink-0 w-full lg:w-auto">
                    <Button 
                      onClick={() => handleOpenWhatsApp(patient)}
                      className="flex-1 bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-xs rounded-2xl h-11 px-4 shadow-sm uppercase tracking-wider"
                    >
                      <MessageSquare className="w-4 h-4 mr-1.5" /> WhatsApp Follow-up
                    </Button>
                    <Button 
                      onClick={() => {
                        setSelectedPatient(patient);
                        setNewStatus(patient.status);
                        setRescheduleDate(patient.scheduledDate);
                        setIsNoteModalOpen(true);
                      }}
                      variant="outline"
                      className="flex-1 border-slate-200 hover:bg-slate-50 text-slate-700 font-black text-xs rounded-2xl h-11 px-4 uppercase tracking-wider"
                    >
                      <Edit3 className="w-4 h-4 mr-1.5" /> Log Call Note
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Log Call Note Modal */}
      <Dialog open={isNoteModalOpen} onOpenChange={setIsNoteModalOpen}>
        <DialogContent className="rounded-[36px] max-w-lg border-none p-0 overflow-hidden bg-white shadow-2xl">
          <DialogHeader className="bg-primary p-6 text-white space-y-1">
            <DialogTitle className="text-xl font-black text-white font-outfit uppercase tracking-tight">
              Log Conversation for {selectedPatient?.customerName}
            </DialogTitle>
            <DialogDescription className="text-[10px] font-black text-white/70 tracking-widest uppercase">
              Update call outcome, notes, or reschedule follow-up date
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-500">Call Outcome Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none font-bold text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl font-bold text-xs">
                  <SelectItem value="Pending Call">Pending Call</SelectItem>
                  <SelectItem value="Called - Follow-up Set">Called - Follow-up Set</SelectItem>
                  <SelectItem value="Called - Order Placed">✅ Called - Order Placed</SelectItem>
                  <SelectItem value="Called - No Answer">Called - No Answer</SelectItem>
                  <SelectItem value="Call Postponed">Call Postponed</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-500">Reschedule Call Date</Label>
              <Input 
                type="date"
                value={rescheduleDate}
                onChange={e => setRescheduleDate(e.target.value)}
                className="h-12 rounded-2xl bg-slate-50 border-none font-bold text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-500">Conversation Details / Notes</Label>
              <Textarea 
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                placeholder="e.g. Patient mentioned they have 10 days supply left. Offered 15% discount for 3-month supply..."
                className="min-h-[100px] rounded-2xl bg-slate-50 border-none font-bold text-xs"
              />
            </div>

            <Button 
              onClick={handleSaveNote}
              className="w-full h-14 rounded-full font-black bg-primary text-white uppercase tracking-wider"
            >
              Save Call Outcome
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add New Inquiry Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="rounded-[40px] max-w-2xl border-none p-0 overflow-hidden bg-white shadow-2xl">
          <DialogHeader className="bg-primary p-8 text-white space-y-2">
            <DialogTitle className="text-2xl font-black text-white font-outfit uppercase tracking-tight">
              Log Patient Refill Inquiry 📞
            </DialogTitle>
            <DialogDescription className="text-[10px] font-black text-white/60 tracking-widest uppercase">
              Schedule follow-up call & log enquired medicine prices
            </DialogDescription>
          </DialogHeader>

          <div className="p-8">
            <FollowupForm 
              onSuccess={() => { setIsFormOpen(false); fetchFollowups(); }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FollowupForm({ onSuccess }: { onSuccess: () => void }) {
  const [customerName, setCustomerName] = useState('');
  const [mobile, setMobile] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<any[]>([
    { itemName: '', quantityEnquired: '1 Strip', currentPrice: '' }
  ]);

  const { user } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    // Default scheduled date to 30 days from today
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);
    setScheduledDate(in30Days.toISOString().split('T')[0]);
  }, []);

  const addItemRow = () => {
    setItems(prev => [...prev, { itemName: '', quantityEnquired: '1 Strip', currentPrice: '' }]);
  };

  const removeItemRow = (idx: number) => {
    if (items.length > 1) {
      setItems(prev => prev.filter((_, i) => i !== idx));
    }
  };

  const updateItem = (idx: number, field: string, value: any) => {
    setItems(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !mobile || !scheduledDate) {
      toast({ variant: 'destructive', title: 'Required fields missing', description: 'Patient name, mobile, and scheduled date are required.' });
      return;
    }

    try {
      const token = await user?.getIdToken();
      const payload = {
        customerName,
        mobile,
        scheduledDate,
        lastCallNotes: notes,
        enquiredItems: items.filter(it => it.itemName.trim())
      };

      const res = await fetch('/api/admin/followups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Save failed');
      toast({ title: 'Follow-up Scheduled!', description: `Scheduled call for ${customerName} on ${scheduledDate}.` });
      onSuccess();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Save failed', description: err.message });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase text-slate-500">Patient Name *</Label>
          <Input 
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
            required
            placeholder="e.g. Ramesh Kumar"
            className="h-12 rounded-2xl bg-slate-50 border-none font-bold text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase text-slate-500">Mobile Number *</Label>
          <Input 
            value={mobile}
            onChange={e => setMobile(e.target.value)}
            required
            placeholder="e.g. 9876543210"
            className="h-12 rounded-2xl bg-slate-50 border-none font-bold text-xs"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-[10px] font-black uppercase text-slate-500">Scheduled Call Date *</Label>
        <Input 
          type="date"
          value={scheduledDate}
          onChange={e => setScheduledDate(e.target.value)}
          required
          className="h-12 rounded-2xl bg-slate-50 border-none font-bold text-xs"
        />
      </div>

      {/* Enquired Items Repeater */}
      <div className="space-y-3 p-4 bg-slate-50 rounded-3xl border border-slate-100">
        <div className="flex items-center justify-between">
          <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Enquired Medicines & Price Details</Label>
          <Button type="button" onClick={addItemRow} variant="outline" className="h-8 text-[10px] font-black rounded-xl border-slate-200">
            <Plus className="w-3 h-3 mr-1" /> Add Medicine
          </Button>
        </div>

        {items.map((it, idx) => (
          <div key={idx} className="flex flex-col sm:flex-row items-center gap-2 bg-white p-3 rounded-2xl border border-slate-200/60 shadow-2xs">
            <MedicineSearchInput
              value={it.itemName}
              onChange={val => updateItem(idx, 'itemName', val)}
              onSelectProduct={prod => {
                updateItem(idx, 'itemName', prod.name);
                if (prod.mrp || prod.price) {
                  updateItem(idx, 'currentPrice', String(prod.mrp || prod.price));
                }
              }}
            />
            <Input 
              placeholder="Qty (e.g. 3 Strips)"
              value={it.quantityEnquired}
              onChange={e => updateItem(idx, 'quantityEnquired', e.target.value)}
              className="w-full sm:w-32 h-10 rounded-xl bg-slate-50 border-none font-bold text-xs"
            />
            <Input 
              type="number"
              placeholder="MRP Price (₹)"
              value={it.currentPrice}
              onChange={e => updateItem(idx, 'currentPrice', e.target.value)}
              className="w-full sm:w-28 h-10 rounded-xl bg-slate-50 border-none font-bold text-xs"
            />
            {items.length > 1 && (
              <Button type="button" variant="ghost" size="icon" onClick={() => removeItemRow(idx)} className="h-8 w-8 text-rose-500 shrink-0">
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      <div className="space-y-1.5">
        <Label className="text-[10px] font-black uppercase text-slate-500">Initial Call Notes / Reason</Label>
        <Textarea 
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="e.g. Patient bought 1 month supply from Apollo on Aug 8. Call Sept 5 to offer 15% discount."
          className="min-h-[80px] rounded-2xl bg-slate-50 border-none font-bold text-xs"
        />
      </div>

      <Button type="submit" className="w-full h-14 rounded-full font-black bg-primary text-white uppercase tracking-wider">
        Save & Schedule Follow-up Call 📞
      </Button>
    </form>
  );
}

function MedicineSearchInput({ 
  value, 
  onChange, 
  onSelectProduct 
}: { 
  value: string; 
  onChange: (val: string) => void; 
  onSelectProduct: (product: any) => void; 
}) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/products?q=${encodeURIComponent(query)}&limit=10`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.filter((p: any) => p._type === 'medicine'));
          setIsOpen(true);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative flex-1 w-full" ref={wrapperRef}>
      <Input
        placeholder="Search Medicine (e.g. Dolo 650)..."
        value={query}
        onChange={e => {
          setQuery(e.target.value);
          onChange(e.target.value);
        }}
        className="h-10 rounded-xl bg-slate-50 border-none font-bold text-xs pr-8"
      />
      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
        </div>
      )}

      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white rounded-2xl shadow-2xl border border-slate-100 max-h-56 overflow-y-auto z-[300] py-1 animate-in fade-in duration-200">
          <div className="px-3 py-1 bg-slate-50 border-b border-slate-100 text-[9px] font-black uppercase text-slate-400">
            Click to Auto-fill Medicine & Price
          </div>
          {suggestions.map(p => (
            <button
              type="button"
              key={p.id}
              onClick={() => {
                onSelectProduct(p);
                setQuery(p.name);
                setIsOpen(false);
              }}
              className="w-full px-3 py-2 text-left hover:bg-emerald-50/60 transition-all flex items-center justify-between border-b border-slate-50 last:border-none active:scale-[0.99]"
            >
              <div className="min-w-0 pr-2">
                <p className="font-extrabold text-xs text-slate-800 uppercase truncate">{p.name}</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase truncate">{p.sku} {p.saltComposition ? `• ${p.saltComposition}` : ''}</p>
              </div>
              <span className="text-xs font-black text-emerald-600 font-mono shrink-0">₹{p.mrp || p.price || 0}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
