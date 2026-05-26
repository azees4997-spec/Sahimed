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
  Rocket,
  Package, 
  Dna, 
  ArrowRight,
  Shield,
  FileCode,
  LineChart,
  Database,
  Zap
} from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { AdminTab } from '../types';
import { containerVariants, itemVariants } from '../constants';

export function OverviewTab({ setTab, role }: { setTab: (t: AdminTab) => void, role: string }) {
  const allStats = [
    { label: 'Prescriptions', icon: FileText, desc: 'Process uploaded Rx', tab: 'enquiries', color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Orders', icon: ShoppingBag, desc: 'Manage fulfillment', tab: 'fulfillment', color: 'text-sky-500', bg: 'bg-sky-50' },
    { label: 'Marketing', icon: Rocket, desc: 'AI SEO & Video Suite', tab: 'marketing', color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Coupons', icon: Ticket, desc: 'Manage discounts', tab: 'promocodes', color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: 'Fees', icon: Receipt, desc: 'Delivery & packing', tab: 'fees', color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'Banners', icon: ImageIcon, desc: 'Home promotions', tab: 'banners', color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Categories', icon: Tag, desc: 'Manage shop sections', tab: 'categories', color: 'text-rose-500', bg: 'bg-rose-50' },
    { label: 'Customers', icon: Users, desc: 'Manage registrations', tab: 'customers', color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { label: 'Alerts', icon: Megaphone, desc: 'App notifications', tab: 'stockAlerts', color: 'text-red-500', bg: 'bg-red-50' },
    { label: 'Inventory', icon: Package, desc: 'Products & stock', tab: 'itemMaster', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Molecules', icon: Dna, desc: 'Generic salt database', tab: 'moleculeMaster', color: 'text-teal-500', bg: 'bg-teal-50' },
    { label: 'Analytics', icon: LineChart, desc: 'Search insights', tab: 'searchAnalytics', color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Pages', icon: FileCode, desc: 'Website content', tab: 'pages', color: 'text-fuchsia-600', bg: 'bg-fuchsia-50' },
    { label: 'Inventory Update', icon: Zap, desc: 'Quick Price & Stock', tab: 'inventory', color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Staff', icon: Shield, desc: 'Team permissions', tab: 'admins', color: 'text-indigo-600', bg: 'bg-indigo-50', restricted: true },
    { label: 'Maintenance', icon: Database, desc: 'DB Sync & Integrity', tab: 'maintenance', color: 'text-slate-600', bg: 'bg-slate-100', restricted: true }
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
            <div className="space-y-1">
              <CardTitle className="text-sm font-black text-slate-900 tracking-tight uppercase font-outfit">{card.label}</CardTitle>
              <p className="text-[9px] font-black text-slate-400 tracking-[0.2em] uppercase opacity-60">{card.desc}</p>
            </div>
            <div className="mt-6 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
               <span className="text-[9px] font-black text-primary tracking-widest uppercase flex items-center gap-2">Open Section <ArrowRight className="w-3 h-3" /></span>
            </div>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}
