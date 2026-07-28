"use client"

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Tag, Users, Dna, ArrowLeft } from 'lucide-react';
import { ItemMasterTab } from './ItemMasterTab';
import { CategoriesTab } from './CategoriesTab';
import { MarketersTab } from './MarketersTab';
import { MoleculeMasterTab } from './MoleculeMasterTab';

export function MastersTab({ db, isVerified, onBack }: { db: any, isVerified: boolean, onBack: () => void }) {
  const [activeSubTab, setActiveSubTab] = useState<'products' | 'categories' | 'marketers' | 'molecules'>('products');

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2">
      <div className="flex items-center gap-6">
        <button 
          onClick={onBack}
          className="w-14 h-14 rounded-full bg-white hover:bg-slate-50 flex items-center justify-center shadow-lg hover:shadow-xl transition-all active:scale-90"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase font-outfit leading-none">Catalog Masters</h2>
          <p className="text-[10px] font-black text-slate-500 tracking-[0.4em] uppercase mt-2">Manage store dataset masters</p>
        </div>
      </div>

      <Tabs 
        value={activeSubTab} 
        onValueChange={(v: any) => setActiveSubTab(v)} 
        className="space-y-8"
      >
        <TabsList className="bg-white/80 backdrop-blur-md p-2 rounded-[32px] h-20 shadow-lg border border-white flex gap-2 w-full max-w-2xl">
          <TabsTrigger 
            value="products"
            className="flex-1 rounded-[24px] font-black text-xs uppercase tracking-wider gap-2 data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-300"
          >
            <Package className="w-4 h-4" /> Products
          </TabsTrigger>
          <TabsTrigger 
            value="categories"
            className="flex-1 rounded-[24px] font-black text-xs uppercase tracking-wider gap-2 data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-300"
          >
            <Tag className="w-4 h-4" /> Categories
          </TabsTrigger>
          <TabsTrigger 
            value="marketers"
            className="flex-1 rounded-[24px] font-black text-xs uppercase tracking-wider gap-2 data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-300"
          >
            <Users className="w-4 h-4" /> Marketers
          </TabsTrigger>
          <TabsTrigger 
            value="molecules"
            className="flex-1 rounded-[24px] font-black text-xs uppercase tracking-wider gap-2 data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-300"
          >
            <Dna className="w-4 h-4" /> Molecules
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="outline-none">
          <ItemMasterTab db={db} isVerified={isVerified} onBack={onBack} />
        </TabsContent>
        <TabsContent value="categories" className="outline-none">
          <CategoriesTab db={db} isVerified={isVerified} onBack={onBack} />
        </TabsContent>
        <TabsContent value="marketers" className="outline-none">
          <MarketersTab db={db} isVerified={isVerified} onBack={onBack} />
        </TabsContent>
        <TabsContent value="molecules" className="outline-none">
          <MoleculeMasterTab db={db} isVerified={isVerified} onBack={onBack} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
