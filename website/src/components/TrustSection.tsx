'use client';

import * as React from 'react';
import { Star, CheckCircle2, Quote } from 'lucide-react';
import { motion } from 'framer-motion';

const REVIEWS = [
  {
    name: "Arjun Sharma",
    location: "Bangalore",
    text: "Excellent service! Got my medicines delivered quickly and safely. The pharmacist was very helpful with my prescription questions. Highly authentic stock.",
    rating: 5,
    date: "2 days ago"
  },
  {
    name: "Priya Patel",
    location: "Mumbai",
    text: "Best price I've found online for chronic medicines. The packaging was discreet and the delivery was prompt. Highly recommend Sahimed for authentic healthcare!",
    rating: 5,
    date: "1 week ago"
  },
  {
    name: "Rahul Verma",
    location: "Delhi",
    text: "Very easy to upload prescriptions. I usually worry about authenticity, but Sahimed provides only genuine products. A trusted partner for long-term health needs.",
    rating: 5,
    date: "3 days ago"
  }
];

export default function TrustSection() {
  return (
    <section className="py-20 sm:py-32 relative overflow-hidden">
      {/* Background Accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl px-4 pointer-events-none -z-10">
         <div className="absolute top-20 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
         <div className="absolute bottom-20 right-10 w-64 h-64 bg-rose-100/30 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center space-y-4 mb-20">
          <div className="flex items-center justify-center gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-[#FACC15] text-[#FACC15]" />
            ))}
            <span className="ml-2 text-slate-900 font-black text-sm uppercase tracking-tighter">4.9/5 on Google</span>
          </div>
          <h2 className="text-4xl sm:text-6xl font-black tracking-tighter text-slate-900 font-outfit uppercase leading-none">
            Trusted by <span className="text-primary italic">Thousands</span> <br/> of Happy Indians
          </h2>
          <p className="text-slate-500 text-lg font-medium max-w-2xl mx-auto">
            Real stories from real customers who switched to Sahimed for authentic and affordable healthcare.
          </p>
        </div>

        {/* Horizontal Slider Container */}
        <div className="relative group">
            <div className="flex flex-nowrap overflow-x-auto gap-3 sm:gap-6 pb-12 pt-4 px-4 -mx-4 scrollbar-hide snap-x snap-mandatory cursor-grab active:cursor-grabbing">
            {[...REVIEWS, ...REVIEWS].map((review, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i % 3) * 0.1, duration: 0.8 }}
                className="min-w-[145px] sm:min-w-[400px] bg-white rounded-[20px] sm:rounded-[40px] p-3.5 sm:p-10 border border-slate-100 shadow-xl shadow-slate-200/50 relative group snap-center hover:-translate-y-2 transition-transform duration-500"
              >
                <div className="space-y-4 sm:space-y-6 relative z-10">
                  <div className="flex gap-0.5 sm:gap-1">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} className="w-2.5 h-2.5 sm:w-4 sm:h-4 fill-[#FACC15] text-[#FACC15]" />
                    ))}
                  </div>

                  <p className="text-slate-700 text-[10px] sm:text-lg leading-relaxed font-bold sm:font-medium italic min-h-[80px] sm:min-h-[120px]">
                    "{review.text}"
                  </p>

                  <div className="pt-4 sm:pt-6 border-t border-slate-50">
                    <h4 className="text-slate-900 font-black uppercase text-[9px] sm:text-sm tracking-tight flex items-center gap-1 sm:gap-2">
                      {review.name}
                      <CheckCircle2 className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-blue-500" />
                    </h4>
                    <p className="text-slate-600 font-black text-[7px] sm:text-[10px] uppercase tracking-widest mt-1">{review.location} • {review.date}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* Scroll Indicators (Optional/Subtle) */}
          <div className="flex justify-center gap-2 mt-4">
            {REVIEWS.map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-primary/20 transition-colors" />
            ))}
          </div>
        </div>

        <style jsx global>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>

        {/* Google Stats Bar */}
        <div className="mt-20 flex flex-wrap items-center justify-center gap-8 sm:gap-16 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-700">
           <div className="flex items-center gap-3">
             <div className="w-8 h-8">
               <svg viewBox="0 0 24 24" className="w-full h-full">
                 <path
                   fill="#4285F4"
                   d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                 />
                 <path
                   fill="#34A853"
                   d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                 />
                 <path
                   fill="#FBBC05"
                   d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                 />
                 <path
                   fill="#EA4335"
                   d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                 />
               </svg>
             </div>
             <div className="text-left">
                <p className="text-slate-900 font-black text-xs uppercase leading-none">Google Verified</p>
                <p className="text-slate-500 font-bold text-[9px] uppercase tracking-widest">Business Partner</p>
             </div>
           </div>
           <div className="flex items-center gap-3">
             <div className="bg-primary/10 p-2 rounded-xl">
               <ShieldCheck className="w-6 h-6 text-primary" />
             </div>
             <div className="text-left">
                <p className="text-slate-900 font-black text-xs uppercase leading-none">Safe & Secure</p>
                <p className="text-slate-500 font-bold text-[9px] uppercase tracking-widest">SSL Certified</p>
             </div>
           </div>
        </div>
      </div>
    </section>
  );
}

function ShieldCheck(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
