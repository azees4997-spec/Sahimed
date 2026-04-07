"use client"

import { 
  FileText, 
  ShoppingBag, 
  Ticket, 
  Receipt, 
  ImageIcon, 
  Tag, 
  Users, 
  Megaphone, 
  Package, 
  Dna, 
  ArrowRight,
  Shield,
  FileCode,
  LineChart
} from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { AdminTab } from '../types';
import { containerVariants, itemVariants } from '../constants';

export function OverviewTab({ setTab, role }: { setTab: (t: AdminTab) => void, role: string }) {
  const allStats = [
    { label: 'Digitize', icon: FileText, desc: 'Prescription processing', tab: 'enquiries', color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Orders', icon: ShoppingBag, desc: 'Fulfillment & logistics', tab: 'fulfillment', color: 'text-sky-500', bg: 'bg-sky-50' },
    { label: 'Coupons', icon: Ticket, desc: 'Marketing campaigns', tab: 'promocodes', color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: 'Fees', icon: Receipt, desc: 'Billing adjustments', tab: 'fees', color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'Banners', icon: ImageIcon, desc: 'Storefront promotions', tab: 'banners', color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Categories', icon: Tag, desc: 'Shop categories', tab: 'categories', color: 'text-rose-500', bg: 'bg-rose-50' },
    { label: 'Customers', icon: Users, desc: 'Customer directory', tab: 'customers', color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { label: 'Alerts', icon: Megaphone, desc: 'Store broadcasts', tab: 'stockAlerts', color: 'text-red-500', bg: 'bg-red-50' },
    { label: 'Products', icon: Package, desc: 'Inventory management', tab: 'itemMaster', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Ingredients', icon: Dna, desc: 'Molecule database', tab: 'moleculeMaster', color: 'text-teal-500', bg: 'bg-teal-50' },
    { label: 'Analytics', icon: LineChart, desc: 'Search insights', tab: 'searchAnalytics', color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Pages', icon: FileCode, desc: 'Content & Legal', tab: 'pages', color: 'text-fuchsia-600', bg: 'bg-fuchsia-50' },
    { label: 'Staff', icon: Shield, desc: 'Team permissions', tab: 'admins', color: 'text-indigo-600', bg: 'bg-indigo-50', restricted: true }
  ];

  const filteredStats = allStats.filter(card => {
    if (role === 'sub-admin') {
      return !['promocodes', 'fees', 'categories', 'admins'].includes(card.tab);
    }
    if (role === 'admin') return true;
    if (role === 'pharmacist') return card.tab !== 'admins';
    return true;
  });

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
    >
      {filteredStats.map(card => (
        <motion.div key={card.label} variants={itemVariants}>
          <Card 
            className="rounded-[56px] p-10 border-none shadow-xl hover:shadow-3xl transition-all cursor-pointer bg-white/60 backdrop-blur-md group text-center flex flex-col items-center justify-center min-h-[280px] border border-white active:scale-95" 
            onClick={() => setTab(card.tab as AdminTab)}
          >
            <div className={cn("w-20 h-20 rounded-[32px] flex items-center justify-center mb-8 group-hover:scale-110 transition-all duration-500 shadow-inner", card.bg, card.color)}>
               <card.icon className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-[10px] font-black text-slate-400 tracking-[0.4em] mb-2 uppercase opacity-60 group-hover:opacity-100 transition-opacity">{card.label}</CardTitle>
              <p className="text-xs font-black text-slate-900 tracking-tight uppercase font-outfit">Control Protocol</p>
            </div>
            <div className="mt-6 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
               <span className="text-[9px] font-black text-primary tracking-widest uppercase flex items-center gap-2">Access Portal <ArrowRight className="w-3 h-3" /></span>
            </div>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}
