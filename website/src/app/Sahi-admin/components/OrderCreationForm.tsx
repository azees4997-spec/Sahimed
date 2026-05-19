"use client"

import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Loader2, 
  Search, 
  Plus, 
  X, 
  UploadCloud, 
  Users, 
  MapPin, 
  Trash2, 
  Ticket, 
  Tag, 
  Zap, 
  ImageIcon,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { 
  useUser,
  useFirestore, 
  useMemoFirebase, 
  useCollection 
} from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useStorage } from '@/firebase';

export function OrderCreationForm({ enquiry, db, onSuccess }: { enquiry: any, db: any, onSuccess: () => void }) {
  const { toast } = useToast();
  const { user } = useUser();
  const [customer, setCustomer] = useState({ 
    name: enquiry.patientName || '', 
    mobile: enquiry.phoneNumber || '', 
    area: '', 
    pincode: '', 
    landmark: '', 
    city: 'Hyderabad',
    fullAddress: enquiry.shippingDetails?.street || '' 
  });
  const [items, setItems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [promocode, setPromocode] = useState('');
  const [activePromo, setActivePromo] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [prescriptions, setPrescriptions] = useState<string[]>(
    enquiry.imageUrls || [enquiry.imageUrl].filter(Boolean)
  );
  const [isFetchingPincode, setIsFetchingPincode] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [paymentType, setPaymentType] = useState<'COD' | 'PREPAID'>('COD');
  const storage = useStorage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pincode lookup logic
  useEffect(() => {
    if (customer.pincode.length === 6) {
      setIsFetchingPincode(true);
      fetch(`https://api.postalpincode.in/pincode/${customer.pincode}`)
        .then(res => res.json())
        .then(data => {
          if (data?.[0]?.Status === 'Success') {
            const first = data[0].PostOffice[0];
            setCustomer(prev => ({ 
              ...prev, 
              area: first.Name, 
              city: first.District 
            }));
          }
        })
        .catch(err => console.error('Pincode fetch failed', err))
        .finally(() => setIsFetchingPincode(false));
    }
  }, [customer.pincode]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !storage) return;

    setIsUploading(true);
    try {
      const fileName = `admin_attachments/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      const storageRef = ref(storage, fileName);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setPrescriptions(prev => [...prev, url]);
      toast({ title: "Cloud sync complete", description: "Prescription attached and uploaded." });
    } catch (err) {
      toast({ variant: 'destructive', title: "Upload failed", description: "Could not sync file to storage." });
    } finally {
      setIsUploading(false);
    }
  };

  const promosQuery = useMemoFirebase(() => query(collection(db, 'promocodes'), where('isActive', '==', true)), [db]);
  const { data: promoRegistry } = useCollection(promosQuery);

  useEffect(() => {
    if (searchTerm.trim().length >= 2) {
      fetch(`/api/products?q=${encodeURIComponent(searchTerm)}&limit=10`).then(res => res.json()).then(data => setSuggestions(data));
    } else {
      setSuggestions([]);
    }
  }, [searchTerm]);

  useEffect(() => {
    if (promocode && promoRegistry) {
      const match = promoRegistry.find(p => p.code.toUpperCase() === promocode.toUpperCase());
      setActivePromo(match || null);
    } else {
      setActivePromo(null);
    }
  }, [promocode, promoRegistry]);

  const addItem = (prod: any) => {
    setItems([...items, { 
      id: prod._id, 
      name: prod.name, 
      mrp: prod.mrp || 0, 
      price: prod.sahimed_price || prod.price || prod.mrp || 0, 
      qty: 1,
      rx: prod.prescriptionRequired || false 
    }]);
    setSearchTerm('');
    setSuggestions([]);
  };

  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const updateQty = (idx: number, q: number) => {
    const next = [...items];
    next[idx].qty = Math.max(1, q);
    setItems(next);
  };

  const totals = useMemo(() => {
    const mrp = items.reduce((acc, it) => acc + (it.mrp * it.qty), 0);
    const sale = items.reduce((acc, it) => acc + (it.price * it.qty), 0);
    let discount = mrp - sale;
    let promo = 0;
    if (activePromo) {
      if (activePromo.discountType === 'percentage') {
        promo = (sale * Number(activePromo.discountValue)) / 100;
        if (activePromo.maxDiscount) promo = Math.min(promo, activePromo.maxDiscount);
      } else {
        promo = Number(activePromo.discountValue);
      }
    }
    return { mrp, sale, discount, promo, total: Math.max(0, sale - promo) };
  }, [items, activePromo]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const hasRxItem = items.some(it => it.rx);
      if (hasRxItem && prescriptions.length === 0) {
        toast({ variant: 'destructive', title: "Prescription Required", description: "At least one prescription must be attached for RX items." });
        return;
      }

      if (customer.pincode.length !== 6) {
        toast({ variant: 'destructive', title: "Invalid Pincode", description: "Please enter a valid 6-digit Indian Pincode." });
        return;
      }

      const orderData = {
        enquiryPath: enquiry?.id ? (enquiry?.__path || enquiry?.path || `prescriptions/${enquiry.id}`) : null,
        patientName: customer.name,
        phoneNumber: customer.mobile,
        shippingDetails: { 
          area: customer.area,
          pincode: customer.pincode,
          city: customer.city,
          landmark: customer.landmark,
          street: customer.fullAddress 
        },
        items: items.map(it => ({ name: it.name, quantity: it.qty, unitPrice: it.price, mrp: it.mrp, rx: it.rx })),
        totalAmount: totals.total,
        totalMrp: totals.mrp,
        discount: totals.discount,
        promoDiscount: totals.promo,
        promocode: activePromo?.code || null,
        paymentType: paymentType,
        status: paymentType === 'PREPAID' ? 'Pending Payment' : 'Confirmed',
        orderDate: new Date(),
        prescriptionUrls: prescriptions
      };

      const token = await user?.getIdToken();
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });

      const result = await res.json();

      if (res.ok) {
        if (paymentType === 'PREPAID') {
           toast({ title: "Order created & SMS Sent", description: `ID: ${result.orderId}. Link sent via Paytm.` });
        } else {
           toast({ title: "Order created successfully", description: `ID: ${result.orderId}` });
        }
        onSuccess();
      } else {
        throw new Error(result.error || 'Failed to create order');
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: "Order failed", description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[32px] border shadow-sm space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
              <Users className="w-3 h-3" /> Customer Information
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                 <Label className="text-[10px] font-black text-gray-400">Patient Name</Label>
                 <Input value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} className="rounded-xl h-12 bg-gray-50 border-none font-bold" placeholder="Full Name" />
              </div>
              <div className="space-y-1.5">
                 <Label className="text-[10px] font-black text-gray-400">Mobile Number</Label>
                 <Input value={customer.mobile} onChange={e => setCustomer({...customer, mobile: e.target.value})} className="rounded-xl h-12 bg-gray-50 border-none font-bold" placeholder="10 digits" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[32px] border shadow-sm space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
              <MapPin className="w-3 h-3" /> Shipping Address
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 relative">
                 <Label className="text-[10px] font-black text-gray-400">Pincode</Label>
                 <div className="relative">
                   <Input value={customer.pincode} onChange={e => setCustomer({...customer, pincode: e.target.value.replace(/\D/g, '').slice(0,6)})} className="rounded-xl h-12 bg-gray-50 border-none font-bold pr-10" placeholder="500081" />
                   {isFetchingPincode && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />}
                 </div>
              </div>
              <div className="space-y-1.5">
                 <Label className="text-[10px] font-black text-gray-400">City</Label>
                 <Input value={customer.city} onChange={e => setCustomer({...customer, city: e.target.value})} className="rounded-xl h-12 bg-gray-50 border-none font-bold" />
              </div>
              <div className="col-span-2 space-y-1.5">
                 <Label className="text-[10px] font-black text-gray-400">Area / Colony</Label>
                 <Input value={customer.area} onChange={e => setCustomer({...customer, area: e.target.value})} className="rounded-xl h-12 bg-gray-50 border-none font-bold" placeholder="e.g. Madhapur" />
              </div>
              <div className="col-span-2 space-y-1.5">
                 <Label className="text-[10px] font-black text-gray-400">Landmark (Optional)</Label>
                 <Input value={customer.landmark} onChange={e => setCustomer({...customer, landmark: e.target.value})} className="rounded-xl h-12 bg-gray-50 border-none font-bold" placeholder="Near Cyber Towers" />
              </div>
              <div className="col-span-2 space-y-1.5">
                 <Label className="text-[10px] font-black text-gray-400">Complete Address</Label>
                 <Textarea value={customer.fullAddress} onChange={e => setCustomer({...customer, fullAddress: e.target.value})} className="rounded-xl min-h-[80px] bg-gray-50 border-none font-bold" />
              </div>
            </div>
          </div>
          
          <div className="relative">
            <Label className="text-[10px] font-black mb-3 block text-primary uppercase tracking-widest">Add Medicines</Label>
            <div className="relative">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4" />
               <Input placeholder="Search catalog..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="rounded-2xl h-14 pl-12 bg-white border-2 border-primary/5 shadow-sm font-bold focus:border-primary/20" />
            </div>
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white shadow-2xl rounded-[24px] border mt-2 z-50 overflow-hidden">
                {suggestions.map(p => (
                  <button key={p._id} onClick={() => addItem(p)} className="w-full p-4 hover:bg-gray-50 flex items-center gap-4 text-left border-b last:border-none group">
                    <img src={p.imageUrl} className="w-12 h-12 object-contain rounded-xl bg-gray-50 group-hover:bg-white transition-colors" alt="" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-black">{p.name}</p>
                        {p.prescriptionRequired && <Badge className="bg-red-50 text-red-500 text-[8px] border-none font-black uppercase">RX</Badge>}
                      </div>
                      <p className="text-[10px] font-bold text-gray-400">₹{p.sahimed_price || p.price} <span className="line-through opacity-50 ml-1">₹{p.mrp}</span></p>
                    </div>
                    <Plus className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-all" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-[32px] border shadow-sm space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Prescriptions</h4>
            <div className="flex flex-wrap gap-4">
               {prescriptions.map((url, idx) => {
                 const isPDF = url.toLowerCase().includes('.pdf') || url.includes('application%2Fpdf');
                 return (
                   <div key={idx} className="relative group">
                     {isPDF ? (
                       <div className="w-20 h-20 rounded-2xl border bg-slate-50 flex flex-col items-center justify-center text-rose-500 shadow-sm">
                          <FileText className="w-8 h-8" />
                          <span className="text-[8px] font-black uppercase mt-1">PDF</span>
                       </div>
                     ) : (
                       <img src={url} className="w-20 h-20 object-cover rounded-2xl border bg-gray-50 shadow-sm" alt="" />
                     )}
                     <button onClick={() => setPrescriptions(prescriptions.filter((_, i) => i !== idx))} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-100 shadow-lg border-2 border-white transition-transform hover:scale-110"><X className="w-2.5 h-2.5" /></button>
                   </div>
                 );
               })}
               <div className="flex flex-col gap-3 w-full mt-2">
                 <div className="flex gap-2">
                   <Input 
                     id="new-prescription-url"
                     placeholder="Paste Image URL..." 
                     className="rounded-xl h-12 bg-gray-50 border-none font-bold text-[11px]" 
                     onKeyDown={(e) => {
                       if (e.key === 'Enter') {
                         const val = (e.target as HTMLInputElement).value;
                         if (val) {
                           setPrescriptions([...prescriptions, val]);
                           (e.target as HTMLInputElement).value = '';
                         }
                       }
                     }}
                   />
                   <Button 
                     onClick={() => {
                       const el = document.getElementById('new-prescription-url') as HTMLInputElement;
                       if (el.value) {
                         setPrescriptions([...prescriptions, el.value]);
                         el.value = '';
                       }
                     }}
                     className="rounded-xl h-12 bg-primary text-white font-black text-[10px] px-6"
                   >
                     Attach
                   </Button>
                 </div>
                 <div className="relative">
                   <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
                   <Button 
                     onClick={() => fileInputRef.current?.click()}
                     variant="outline"
                     className="w-full rounded-2xl h-14 border-2 border-dashed border-primary/20 bg-primary/5 text-primary font-black text-[10px] flex items-center justify-center gap-2 hover:bg-primary/10 transition-all"
                   >
                     <UploadCloud className="w-4 h-4" /> Browse Local Machine
                   </Button>
                 </div>
               </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-50 p-6 rounded-[32px] border">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">Order Items</h4>
            <div className="space-y-4 max-h-[300px] overflow-y-auto scrollbar-hide">
              {items.length === 0 ? <p className="text-center py-10 text-[10px] font-black text-gray-300 uppercase tracking-widest">No items added</p> : items.map((it, i) => {
                const discPc = Math.round(((it.mrp - it.price) / it.mrp) * 100) || 0;
                return (
                  <div key={i} className="flex flex-col gap-2 bg-white p-5 rounded-3xl border shadow-sm relative overflow-hidden">
                    {it.rx && <div className="absolute top-0 right-0 bg-red-500 text-white text-[7px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest">RX Req</div>}
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm font-black text-gray-900 leading-tight mb-1">{it.name}</p>
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded-full">Sale Price: ₹{it.price}</span>
                           <span className="text-[9px] font-bold text-gray-400 line-through">MRP: ₹{it.mrp}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-100 hover:text-red-500 hover:bg-red-50 transition-all" onClick={() => removeItem(i)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-1">
                      <div className="flex flex-col">
                        <p className="text-[9px] font-black text-green-600 uppercase tracking-tighter">Savings: ₹{(it.mrp - it.price).toFixed(0)} ({discPc}%)</p>
                        <p className="text-xs font-black text-gray-900 mt-0.5">Subtotal: ₹{(it.price * it.qty).toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-1 bg-gray-50 rounded-2xl p-1.5 border">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-white" onClick={() => updateQty(i, it.qty - 1)}>-</Button>
                        <span className="text-xs font-black w-6 text-center">{it.qty}</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-white" onClick={() => updateQty(i, it.qty + 1)}>+</Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-[32px] border space-y-4">
             <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center justify-between">
               <span>Coupons & Offers</span>
               {activePromo ? (
                 <Badge className="bg-green-100 text-green-600 border-none font-black text-[8px] animate-pulse">APPLIED: {activePromo.code}</Badge>
               ) : promocode && (
                 <span className="text-[8px] font-black text-red-500">INVALID CODE</span>
               )}
             </h4>
             <div className="relative">
               <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 text-primary w-4 h-4" />
               <Input 
                 placeholder="Search active promocodes..." 
                 value={promocode} 
                 onChange={e => setPromocode(e.target.value.toUpperCase())} 
                 className={cn(
                   "rounded-2xl h-14 pl-12 bg-white border-2 font-bold transition-all",
                   activePromo ? "border-green-500/20 text-green-600" : "border-primary/5"
                 )} 
               />
             </div>
             {promoRegistry && !activePromo && promocode.length > 0 && (
               <div className="flex flex-wrap gap-2 pt-2">
                 {promoRegistry.slice(0, 3).map(p => (
                   <button key={p.id} onClick={() => setPromocode(p.code)} className="text-[8px] font-black px-3 py-1.5 rounded-full bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all">Apply {p.code}</button>
                 ))}
               </div>
             )}
          </div>

          <div className="bg-primary/5 p-6 rounded-[32px] border border-primary/10 space-y-4">
             <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest"><span>Summary</span><span>Amount</span></div>
             <div className="flex justify-between text-sm font-bold"><span>Total MRP</span><span>₹{totals.mrp.toFixed(2)}</span></div>
             <div className="flex justify-between text-sm font-bold text-green-600"><span>Total Product Discount</span><span>-₹{totals.discount.toFixed(2)}</span></div>
             <div className="flex justify-between text-sm font-bold text-blue-600"><span>Total Promocode</span><span>-₹{totals.promo.toFixed(2)}</span></div>
             <div className="flex justify-between items-center pt-4 border-t border-primary/20">
               <div><p className="text-base font-black text-primary">Payable</p><p className="text-[8px] font-black text-green-600 uppercase">You saved ₹{totals.discount.toFixed(0)} ({((totals.discount/totals.mrp)*100 || 0).toFixed(0)}%)</p></div>
               <p className="text-2xl font-black text-primary">₹{totals.total.toFixed(2)}</p>
             </div>
          </div>
          
          <div className="bg-white p-6 rounded-[32px] border shadow-sm space-y-4">
             <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Payment Method</h4>
             <div className="flex gap-4">
               <button 
                 onClick={() => setPaymentType('COD')}
                 className={cn("flex-1 p-4 rounded-2xl border-2 font-black text-xs transition-all", paymentType === 'COD' ? "border-primary bg-primary/5 text-primary" : "border-gray-100 text-gray-400")}
               >
                 Cash on Delivery
               </button>
               <button 
                 onClick={() => setPaymentType('PREPAID')}
                 className={cn("flex-1 p-4 rounded-2xl border-2 font-black text-xs transition-all", paymentType === 'PREPAID' ? "border-primary bg-primary/5 text-primary" : "border-gray-100 text-gray-400")}
               >
                 Prepaid (Paytm SMS)
               </button>
             </div>
          </div>
          
          <Button disabled={isSubmitting || items.length === 0} onClick={handleSubmit} className="w-full h-16 rounded-full font-black bg-primary text-white shadow-xl shadow-primary/20 disabled:grayscale">
            {isSubmitting ? <Loader2 className="animate-spin" /> : (paymentType === 'PREPAID' ? "Send Payment Link (SMS)" : "Confirm Order (COD)")}
          </Button>
        </div>
      </div>
    </div>
  );
}
