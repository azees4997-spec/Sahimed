
"use client"

import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { User, Package, MapPin, Heart, LogOut, ChevronRight, Settings, Smartphone } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-[#F8F8F8] pb-32">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8 md:py-16">
        
        {/* User Intro */}
        <div className="flex flex-col md:flex-row items-center gap-8 mb-12 bg-white p-10 rounded-[40px] shadow-sm border">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center border-4 border-white shadow-lg shrink-0">
             <User className="w-12 h-12 text-primary" />
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-black text-gray-900 mb-1">John Doe</h1>
            <p className="text-gray-400 font-bold text-sm flex items-center justify-center md:justify-start gap-2">
              <Smartphone className="w-4 h-4" /> +91 9876543210
            </p>
          </div>
          <div className="md:ml-auto">
            <Link href="/login">
              <Button variant="outline" className="rounded-full h-12 px-8 font-bold text-red-500 hover:bg-red-50 border-red-100 gap-2">
                <LogOut className="w-4 h-4" /> Logout
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           
           {/* Section 1 */}
           <div className="space-y-6">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 ml-4">Account Settings</h2>
              
              <Link href="/orders" className="block">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 flex items-center justify-between group hover:shadow-xl transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Package className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Your Orders</h3>
                      <p className="text-xs text-gray-400 font-medium">Track and reorder medicines</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300" />
                </div>
              </Link>

              <Link href="/checkout" className="block">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 flex items-center justify-between group hover:shadow-xl transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Manage Addresses</h3>
                      <p className="text-xs text-gray-400 font-medium">Home, Office & other locations</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300" />
                </div>
              </Link>
           </div>

           {/* Section 2 */}
           <div className="space-y-6">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 ml-4">Preferences</h2>
              
              <Link href="#" className="block">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 flex items-center justify-between group hover:shadow-xl transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Heart className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Wishlist</h3>
                      <p className="text-xs text-gray-400 font-medium">Save for later</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300" />
                </div>
              </Link>

              <Link href="#" className="block">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 flex items-center justify-between group hover:shadow-xl transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-50 text-gray-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Settings className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Account Security</h3>
                      <p className="text-xs text-gray-400 font-medium">Login & data permissions</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300" />
                </div>
              </Link>
           </div>

        </div>
      </main>
    </div>
  );
}
