
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';
import { PRODUCTS, CATEGORIES } from '@/lib/data';
import { HeartPulse, Activity, Baby, ArrowRight, ShieldCheck, Truck, Clock } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

export default function Home() {
  const featuredProducts = PRODUCTS.slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col pb-20">
      <Navbar />

      <main className="flex-1">
        {/* Hero Slider Area */}
        <section className="bg-white py-8 md:py-12 border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative rounded-2xl overflow-hidden aspect-[21/9] md:aspect-[3/1] bg-primary group">
              <Image 
                src="https://picsum.photos/seed/healthhero/1200/400" 
                alt="HealthLink Hero" 
                fill 
                className="object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-primary/60 to-transparent flex items-center p-8 md:p-16">
                <div className="max-w-lg text-white">
                  <span className="inline-block bg-accent/90 text-white text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-widest">Mega Savings Event</span>
                  <h1 className="text-3xl md:text-5xl font-bold font-headline mb-4 leading-tight">Your Health, <br/>Our Commitment.</h1>
                  <p className="text-white/90 mb-8 text-lg hidden md:block">Get medicines delivered in 15 minutes with generic alternatives that save you up to 80% on every order.</p>
                  <Button size="lg" className="rounded-full bg-white text-primary hover:bg-white/90 font-bold px-8">Shop Now</Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Search Bar Mobile Only */}
        <div className="md:hidden px-4 mt-6">
           <Link href="/search" className="block w-full bg-white border rounded-full py-3 px-4 text-muted-foreground flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Search for medicines...
           </Link>
        </div>

        {/* Featured Categories */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="text-2xl font-bold font-headline text-gray-900">Shop by Category</h2>
                <p className="text-muted-foreground">Tailored care for every need</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {CATEGORIES.map((cat) => (
                <Link key={cat.name} href={`/search?c=${cat.name}`} className="group relative bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                    {cat.name === 'Chronic' && <HeartPulse className="w-8 h-8" />}
                    {cat.name === 'Wellness' && <Activity className="w-8 h-8" />}
                    {cat.name === 'Baby Care' && <Baby className="w-8 h-8" />}
                  </div>
                  <h3 className="font-bold text-lg mb-2">{cat.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{cat.description}</p>
                  <span className="text-primary text-xs font-bold flex items-center gap-1 group-hover:gap-2 transition-all">Explore <ArrowRight className="w-3 h-3" /></span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Top Deals */}
        <section className="py-12 bg-white border-y">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="text-2xl font-bold font-headline text-gray-900">Top Deals</h2>
                <p className="text-muted-foreground">Most popular medicines at best prices</p>
              </div>
              <Link href="/search" className="text-primary font-bold flex items-center gap-1 hover:underline">View All <ArrowRight className="w-4 h-4" /></Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {featuredProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>

        {/* Trust Features */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex gap-4">
                <div className="bg-primary/10 p-3 rounded-xl h-fit">
                  <ShieldCheck className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold mb-1">100% Genuine</h4>
                  <p className="text-sm text-muted-foreground">Directly sourced from certified labs and manufacturers.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="bg-primary/10 p-3 rounded-xl h-fit">
                  <Truck className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold mb-1">Free & Fast Delivery</h4>
                  <p className="text-sm text-muted-foreground">On orders above ₹500, with 15-minute express slots available.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="bg-primary/10 p-3 rounded-xl h-fit">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold mb-1">Expert Consultation</h4>
                  <p className="text-sm text-muted-foreground">24/7 pharmacist support for all your medicine queries.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-white py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <div className="bg-primary p-1.5 rounded-lg">
                  <div className="text-white font-bold text-xl tracking-tighter">HL</div>
                </div>
                <span className="font-bold text-xl font-headline tracking-tight">
                  HealthLink
                </span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Empowering your health journey with affordable, accessible, and high-quality medicines since 2024.
              </p>
            </div>
            <div>
              <h5 className="font-bold mb-4 uppercase text-xs tracking-widest text-gray-500">Shop</h5>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/search?c=Chronic" className="hover:text-white transition-colors">Chronic Care</Link></li>
                <li><Link href="/search?c=Wellness" className="hover:text-white transition-colors">Wellness</Link></li>
                <li><Link href="/search?c=Baby Care" className="hover:text-white transition-colors">Baby Care</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold mb-4 uppercase text-xs tracking-widest text-gray-500">Support</h5>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/prescription" className="hover:text-white transition-colors">Upload Prescription</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link href="/faq" className="hover:text-white transition-colors">FAQs</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold mb-4 uppercase text-xs tracking-widest text-gray-500">Admin</h5>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/admin" className="hover:text-white transition-colors">Pharmacist Login</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-800 text-center text-xs text-gray-500">
            &copy; {new Date().getFullYear()} HealthLink Pharmacy. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
