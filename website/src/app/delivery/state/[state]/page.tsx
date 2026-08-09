import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { INDIAN_STATES } from '@/lib/state-data';
import Navbar from '@/components/Navbar';
import { ShieldCheck, Truck, PackageCheck, MapPin, Award, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface Props {
  params: Promise<{ state: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const state = INDIAN_STATES.find(s => s.id === resolvedParams.state);
  if (!state) return { title: 'Not Found' };

  return {
    title: `Online Medicine Delivery in ${state.name} | Authentic Pharmacy - SahiMed`,
    description: `Get 100% authentic medicines delivered to your doorstep in ${state.name}. SahiMed offers certified pharmacist verification, transparent savings, and reliable courier shipping across all districts in ${state.name}.`,
    keywords: `medicine delivery ${state.name}, online pharmacy ${state.name}, buy medicines online ${state.name}, genuine medicines ${state.name}, pharmacy ${state.name}`,
    alternates: {
      canonical: `https://sahimed.com/delivery/state/${state.id}`
    }
  };
}

export async function generateStaticParams() {
  return INDIAN_STATES.map((state) => ({
    state: state.id,
  }));
}

export default async function StatePage({ params }: Props) {
  const resolvedParams = await params;
  const state = INDIAN_STATES.find(s => s.id === resolvedParams.state);
  if (!state) notFound();

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />
      
      <main className="pt-24 sm:pt-32">
        {/* Hero Section */}
        <section className="px-6 pb-16 sm:pb-24">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-xs font-black uppercase tracking-widest text-primary">Statewide Shipping: {state.name}</span>
              </div>
              <h1 className="text-2xl sm:text-7xl font-black tracking-tighter text-slate-900 font-outfit uppercase leading-tight">
                Authentic Medicine Delivery in <span className="text-primary italic">{state.name}</span>
              </h1>
              <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-xl">
                {state.description}
              </p>
              <div className="flex flex-wrap gap-4">
                <Link 
                  href="/search" 
                  className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-primary transition-all shadow-xl shadow-slate-200"
                >
                  Shop Medicines
                </Link>
                <Link 
                  href="/prescription" 
                  className="px-8 py-4 bg-white text-slate-900 border-2 border-slate-100 rounded-2xl font-black uppercase tracking-widest text-sm hover:border-primary transition-all shadow-xl shadow-slate-100"
                >
                  Upload Prescription
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent rounded-[40px] blur-2xl" />
              <div className="relative bg-white border border-slate-100 p-8 sm:p-12 rounded-[40px] shadow-2xl shadow-slate-200/50 space-y-8">
                <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-3xl">
                  <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                    <Truck className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 uppercase tracking-tight">Express Shipping</h3>
                    <p className="text-sm text-slate-500 font-medium italic">Standard delivery in 1-3 working days</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Pincode Status</p>
                    <p className="text-lg font-black text-slate-900">All Pincodes Served</p>
                  </div>
                  <div className="space-y-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Tracking Facility</p>
                    <p className="text-lg font-black text-slate-900">SMS & WhatsApp Alerts</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Sahimed in State */}
        <section className="py-24 bg-slate-900 text-white overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary rounded-full blur-[140px] -mr-64 -mt-64" />
          </div>
          
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center mb-20 space-y-4">
              <h2 className="text-3xl sm:text-5xl font-black tracking-tighter font-outfit uppercase">Secure Pharmacy Network in {state.name}</h2>
              <div className="h-1.5 w-24 bg-primary mx-auto rounded-full" />
            </div>

            <div className="grid sm:grid-cols-3 gap-8">
              {[
                {
                  icon: ShieldCheck,
                  title: "100% Genuine Stocks",
                  desc: "Direct shipping routes ensure every package sent to state is verified, tamper-proof, and fully original."
                },
                {
                  icon: Award,
                  title: "Pharmacist Checked",
                  desc: "Every order undergoes prescription evaluation and clinical checks by registered pharmacists."
                },
                {
                  icon: PackageCheck,
                  title: "Discreet Delivery",
                  desc: "Your medical files and dispatches are securely packaged to maintain complete user confidentiality."
                }
              ].map((feature, i) => (
                <div key={i} className="bg-white/5 border border-white/10 p-10 rounded-[40px] hover:bg-white/10 transition-colors group">
                  <feature.icon className="w-12 h-12 text-primary mb-8 group-hover:scale-110 transition-transform" />
                  <h3 className="text-xl font-black uppercase tracking-tight mb-4">{feature.title}</h3>
                  <p className="text-gray-400 font-medium leading-relaxed">{feature.desc.replace('state', state.name)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Regions Served Grid */}
        <section className="py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
              <div className="space-y-4">
                <h2 className="text-3xl sm:text-5xl font-black tracking-tighter font-outfit uppercase text-slate-900">
                  Major Delivery Zones in <span className="text-primary italic">{state.name}</span>
                </h2>
                <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs">Standard courier shipping across all districts</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {state.regions.map((region, i) => (
                <div key={i} className="bg-white border border-slate-100 p-6 rounded-3xl flex items-center gap-4 hover:border-primary transition-colors shadow-sm">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span className="text-sm font-black text-slate-700 uppercase tracking-tight">{region}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-12 p-8 bg-emerald-50 border border-emerald-100 rounded-[40px] flex flex-col sm:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200/50">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 uppercase tracking-tight">Pan-{state.name} Delivery Access</h4>
                  <p className="text-sm text-slate-500 font-medium italic">We service all post codes and municipalities across {state.name} via certified delivery channels.</p>
                </div>
              </div>
              <Link 
                href="/search" 
                className="w-full sm:w-auto px-8 py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-200/50 text-center"
              >
                Shop Now
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
