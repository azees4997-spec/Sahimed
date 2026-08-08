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
  Zap,
  Sparkles,
  ShoppingCart
} from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { AdminTab } from '../types';
import { containerVariants, itemVariants } from '../constants';

export function OverviewTab({ setTab, role }: { setTab: (t: AdminTab) => void, role: string }) {
  const allStats = [
    { label: 'Patient Savings', icon: Sparkles, desc: '₹ Saved & Generic Switch Rate', tab: 'analytics', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Prescriptions', icon: FileText, desc: 'Process uploaded Rx', tab: 'enquiries', color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Orders', icon: ShoppingBag, desc: 'Manage fulfillment', tab: 'fulfillment', color: 'text-sky-500', bg: 'bg-sky-50' },
    { label: 'Abandoned Carts', icon: ShoppingCart, desc: 'Track pending checkouts', tab: 'abandonedCarts', color: 'text-pink-500', bg: 'bg-pink-50' },
    { label: 'Marketing', icon: Rocket, desc: 'SEO Blogs', tab: 'marketing', color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Coupons', icon: Ticket, desc: 'Manage discounts', tab: 'promocodes', color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: 'Fees', icon: Receipt, desc: 'Delivery & packing', tab: 'fees', color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'Banners', icon: ImageIcon, desc: 'Home promotions', tab: 'banners', color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Customers', icon: Users, desc: 'Manage registrations', tab: 'customers', color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { label: 'Alerts', icon: Megaphone, desc: 'App notifications', tab: 'stockAlerts', color: 'text-red-500', bg: 'bg-red-50' },
    { label: 'Masters', icon: Database, desc: 'Products, Categories, Marketers, Molecules', tab: 'masters', color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Analytics', icon: LineChart, desc: 'Search insights', tab: 'searchAnalytics', color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Pages', icon: FileCode, desc: 'Website content', tab: 'pages', color: 'text-fuchsia-600', bg: 'bg-fuchsia-50' },
    { label: 'Inventory Update', icon: Zap, desc: 'Quick Price & Stock', tab: 'inventory', color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Staff', icon: Shield, desc: 'Team permissions', tab: 'admins', color: 'text-indigo-600', bg: 'bg-indigo-50', restricted: true },
    { label: 'Branding', icon: Sparkles, desc: 'Logo & visual styles', tab: 'branding', color: 'text-amber-500', bg: 'bg-amber-50', restricted: true },
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
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5"
    >
      {filteredStats.map(card => (
        <motion.div key={card.label} variants={itemVariants}>
          <Card 
            className="rounded-[24px] p-6 border-none shadow-sm hover:shadow-lg transition-all cursor-pointer bg-white/70 backdrop-blur-md group text-center flex flex-col items-center justify-center min-h-[190px] border border-white/20 active:scale-95 duration-300" 
            onClick={() => setTab(card.tab as AdminTab)}
          >
            <div className={cn("w-12 h-12 rounded-[14px] flex items-center justify-center mb-4 group-hover:scale-105 transition-all duration-300 shadow-sm", card.bg, card.color)}>
               <card.icon className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-xs font-black text-slate-800 tracking-tight uppercase font-outfit">{card.label}</CardTitle>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-relaxed px-1">{card.desc}</p>
            </div>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}
