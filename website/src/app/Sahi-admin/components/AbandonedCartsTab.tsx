"use client"

import { useState, useEffect } from 'react';
import { 
  Search, 
  Trash2, 
  MessageSquare, 
  Loader2, 
  Eye, 
  ShoppingCart, 
  Calendar,
  X,
  RefreshCw,
  User,
  ShoppingBag,
  Download
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader,
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/firebase';
import { SectionHeader } from './SectionHeader';

interface CartItem {
  id: string;
  _id?: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

interface AbandonedCart {
  userId: string;
  email: string | null;
  phoneNumber: string | null;
  patientName: string;
  items: CartItem[];
  totalPrice: number;
  updatedAt: string;
}

export function AbandonedCartsTab({ onBack }: { db?: any, isVerified?: boolean, onBack: () => void }) {
  const auth = useAuth();
  const { toast } = useToast();

  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCart, setSelectedCart] = useState<AbandonedCart | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const fetchCarts = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("No admin session found");

      const response = await fetch(`/api/abandoned-carts?search=${encodeURIComponent(searchTerm)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch abandoned carts');
      }

      const data = await response.json();
      if (data.success) {
        setCarts(data.carts || []);
      } else {
        throw new Error(data.error || 'Failed to fetch carts');
      }
    } catch (err: any) {
      console.error(err);
      toast({
        variant: 'destructive',
        title: 'Error Fetching Carts',
        description: err.message || 'Could not load abandoned carts from database.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (auth.currentUser) {
      const delayDebounce = setTimeout(() => {
        fetchCarts();
      }, 300);
      return () => clearTimeout(delayDebounce);
    }
  }, [searchTerm, auth.currentUser]);

  const filteredCarts = carts.filter(cart => {
    if (!cart.updatedAt) return true;
    const cartDate = new Date(cart.updatedAt);
    
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      if (cartDate < start) return false;
    }
    
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (cartDate > end) return false;
    }
    
    return true;
  });

  const downloadCSV = () => {
    if (filteredCarts.length === 0) return;
    
    const headers = ["Patient Name", "Email", "Phone Number", "Last Active", "Total Price", "Item Count", "Cart Items Details"];
    
    const csvRows = filteredCarts.map(cart => {
      const name = cart.patientName || 'Anonymous Member';
      const email = cart.email || '';
      const phone = cart.phoneNumber || '';
      const date = formatDate(cart.updatedAt);
      const total = cart.totalPrice;
      const count = cart.items.reduce((acc, item) => acc + item.quantity, 0);
      
      const itemsDetail = cart.items
        .map(item => `${item.name} (Qty: ${item.quantity}, Price: ₹${item.price})`)
        .join(' | ')
        .replace(/"/g, '""');
        
      return `"${name}","${email}","${phone}","${date}","₹${total}","${count}","${itemsDetail}"`;
    });
    
    const csvContent = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Sahimed_AbandonedCarts_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({ title: "Report Exported", description: "Abandoned carts data has been successfully downloaded." });
  };

  const handleDeleteCart = async (userId: string) => {
    setIsDeleting(userId);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) throw new Error("No admin session found");

      const response = await fetch(`/api/abandoned-carts?userId=${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to dismiss abandoned cart');
      }

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Cart Dismissed',
          description: 'The abandoned cart entry has been removed successfully.'
        });
        setCarts(prev => prev.filter(c => c.userId !== userId));
        if (selectedCart?.userId === userId) {
          setSelectedCart(null);
        }
      } else {
        throw new Error(data.error || 'Failed to delete');
      }
    } catch (err: any) {
      console.error(err);
      toast({
        variant: 'destructive',
        title: 'Action Failed',
        description: err.message || 'Could not delete the abandoned cart.'
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const getWhatsAppLink = (cart: AbandonedCart) => {
    if (!cart.phoneNumber) return '#';
    
    // Clean phone number (keep only digits)
    let cleanPhone = cart.phoneNumber.replace(/\D/g, '');
    
    // Default to Indian country code if 10 digits
    if (cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone;
    }

    const itemsText = cart.items
      .map(item => `- ${item.name} (Qty: ${item.quantity})`)
      .join('\n');

    // Create the recovery shareCart code
    const recoveryCode = cart.items
      .map(item => `${item._id || item.id}:${item.quantity}`)
      .join(',');

    const domain = typeof window !== 'undefined' ? window.location.origin : 'https://sahimed.com';
    const recoveryLink = `${domain}/?shareCart=${recoveryCode}`;

    const message = `Hello ${cart.patientName || 'there'},\n\nWe noticed you left some items in your SahiMed cart:\n${itemsText}\nTotal: ₹${cart.totalPrice}\n\nYou can restore your cart and complete checkout instantly using this link:\n${recoveryLink}\n\nLet us know if you need any assistance!\nBest regards,\nSahiMed Team`;

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
      <SectionHeader 
        title="Abandoned Carts" 
        subtitle="Recover pending checkouts and re-engage customers" 
        onBack={onBack} 
      />

      <div className="flex flex-col xl:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto items-center">
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input 
              placeholder="Search by name, email, or phone..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className="pl-10 rounded-2xl h-12 bg-white border-none font-bold text-xs shadow-sm focus-visible:ring-primary/20" 
            />
          </div>
          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            <div className="flex items-center">
              <span className="text-[10px] font-black uppercase text-slate-400 mr-2 shrink-0">From:</span>
              <Input 
                type="date" 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)} 
                className="rounded-2xl h-12 bg-white border-none font-bold text-xs shadow-sm focus-visible:ring-primary/20 w-36" 
              />
            </div>
            <div className="flex items-center">
              <span className="text-[10px] font-black uppercase text-slate-400 mr-2 shrink-0">To:</span>
              <Input 
                type="date" 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)} 
                className="rounded-2xl h-12 bg-white border-none font-bold text-xs shadow-sm focus-visible:ring-primary/20 w-36" 
              />
            </div>
            {(startDate || endDate) && (
              <Button 
                variant="ghost" 
                onClick={() => { setStartDate(''); setEndDate(''); }}
                className="text-[10px] font-black text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-full h-12 px-4 uppercase"
              >
                Clear Dates
              </Button>
            )}
          </div>
        </div>

        <div className="flex gap-3 w-full xl:w-auto justify-end">
          <Button 
            onClick={downloadCSV} 
            disabled={filteredCarts.length === 0} 
            className="rounded-full h-12 px-6 font-black uppercase text-[10px] tracking-widest bg-primary text-white hover:scale-105 transition-all shadow-lg active:scale-95 disabled:opacity-50 gap-2 border-2 border-white"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </Button>
          <Button 
            variant="outline" 
            onClick={() => fetchCarts()} 
            className="rounded-full h-12 px-6 font-black uppercase text-[10px] tracking-widest bg-white hover:bg-slate-50 border-none shadow-sm gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      <Card className="rounded-[40px] overflow-hidden border-none shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 border-b">
              <tr>
                <th className="px-10 py-6">Customer</th>
                <th className="px-10 py-6">Contact Info</th>
                <th className="px-10 py-6">Last Active</th>
                <th className="px-10 py-6">Cart Total</th>
                <th className="px-10 py-6">Items</th>
                <th className="px-10 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td className="px-10 py-6"><div className="w-32 h-4 bg-slate-100 animate-pulse rounded-full" /></td>
                    <td className="px-10 py-6"><div className="w-24 h-4 bg-slate-100 animate-pulse rounded-full" /></td>
                    <td className="px-10 py-6"><div className="w-24 h-4 bg-slate-100 animate-pulse rounded-full" /></td>
                    <td className="px-10 py-6"><div className="w-16 h-4 bg-slate-100 animate-pulse rounded-full" /></td>
                    <td className="px-10 py-6"><div className="w-12 h-4 bg-slate-100 animate-pulse rounded-full" /></td>
                    <td className="px-10 py-6 text-right"><div className="flex justify-end gap-2"><div className="w-8 h-8 bg-slate-50 animate-pulse rounded-full" /></div></td>
                  </tr>
                ))
              ) : filteredCarts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-10 py-16 text-center text-slate-400 font-bold text-sm">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-16 h-16 bg-slate-50 rounded-[20px] flex items-center justify-center">
                        <ShoppingCart className="w-8 h-8 text-slate-300" />
                      </div>
                      <span>No active abandoned carts found</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCarts.map(cart => (
                  <tr key={cart.userId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-10 py-6 font-black text-sm text-slate-800 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xs font-black">
                        {cart.patientName?.[0]?.toUpperCase() || 'P'}
                      </div>
                      <div>
                        <p>{cart.patientName || 'Anonymous Member'}</p>
                        <p className="text-[10px] text-slate-400 font-bold tracking-tight">ID: {cart.userId.substring(0, 8)}...</p>
                      </div>
                    </td>
                    <td className="px-10 py-6 text-sm">
                      <div className="space-y-0.5 font-bold">
                        {cart.phoneNumber && <p className="text-slate-700">{cart.phoneNumber}</p>}
                        {cart.email && <p className="text-slate-500 text-xs">{cart.email}</p>}
                        {!cart.phoneNumber && !cart.email && <span className="text-slate-300 italic text-xs">No contact details</span>}
                      </div>
                    </td>
                    <td className="px-10 py-6 text-xs text-slate-500 font-bold">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {formatDate(cart.updatedAt)}
                      </div>
                    </td>
                    <td className="px-10 py-6 font-black text-sm text-primary">
                      ₹{cart.totalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-10 py-6 text-sm">
                      <Badge className="bg-slate-100 text-slate-600 border-none font-bold text-[10px] px-2.5 py-1">
                        {cart.items.reduce((acc, item) => acc + item.quantity, 0)} items
                      </Badge>
                    </td>
                    <td className="px-10 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setSelectedCart(cart)}
                          className="w-10 h-10 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-900"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {cart.phoneNumber && (
                          <a 
                            href={getWhatsAppLink(cart)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="w-10 h-10 rounded-full hover:bg-green-50 text-green-500 hover:text-green-600"
                              title="Send WhatsApp recovery message"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </Button>
                          </a>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          disabled={isDeleting === cart.userId}
                          onClick={() => handleDeleteCart(cart.userId)}
                          className="w-10 h-10 rounded-full hover:bg-red-50 text-red-500 hover:text-red-600"
                        >
                          {isDeleting === cart.userId ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={!!selectedCart} onOpenChange={open => !open && setSelectedCart(null)}>
        <DialogContent className="rounded-[40px] max-w-xl border-none p-0 overflow-hidden bg-white">
          <DialogHeader className="bg-primary p-8 text-white space-y-2 relative">
            <button 
              onClick={() => setSelectedCart(null)}
              className="absolute right-6 top-6 p-2 rounded-full hover:bg-white/10 text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black text-white font-outfit">Cart Details</DialogTitle>
                <DialogDescription className="text-[10px] font-black text-white/60 tracking-widest uppercase">
                  Inspecting items for {selectedCart?.patientName || 'Anonymous Patient'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-8 space-y-6">
            <div className="max-h-[300px] overflow-y-auto space-y-3 custom-scrollbar pr-1">
              {selectedCart?.items.map((item, idx) => (
                <div 
                  key={item.id || idx}
                  className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-xl border border-slate-100 flex items-center justify-center text-slate-400 font-bold shrink-0">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain p-1 rounded-xl" />
                      ) : (
                        <ShoppingCart className="w-5 h-5 text-slate-300" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-800 line-clamp-1">{item.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold">₹{item.price.toFixed(2)} × {item.quantity}</p>
                    </div>
                  </div>
                  <div className="text-right font-black text-xs text-slate-700">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-100 pt-6 flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Value</p>
                <p className="text-2xl font-black text-primary font-outfit">
                  ₹{selectedCart?.totalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedCart(null)}
                  className="rounded-full h-12 px-6 font-black uppercase text-[10px] tracking-widest border border-slate-100 hover:bg-slate-50"
                >
                  Close
                </Button>
                {selectedCart?.phoneNumber && (
                  <a 
                    href={getWhatsAppLink(selectedCart)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setSelectedCart(null)}
                  >
                    <Button 
                      className="rounded-full h-12 px-6 font-black uppercase text-[10px] tracking-widest bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20 gap-2"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Recover Cart
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
