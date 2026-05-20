'use client';

import * as React from 'react';
import { Star, CheckCircle2, Quote } from 'lucide-react';
import { motion } from 'framer-motion';

const REVIEWS = [
  {
    name: "Arjun Sharma",
    location: "Bangalore",
    text: "Excellent service! Got my medicines delivered in just 20 minutes. The pharmacist was very helpful with my prescription questions.",
    rating: 5,
    date: "2 days ago"
  },
  {
    name: "Priya Patel",
    location: "Mumbai",
    text: "Best price I've found online for chronic medicines. The packaging was discreet and the delivery was on time. Highly recommend Sahimed!",
    rating: 5,
    date: "1 week ago"
  },
  {
    name: "Rahul Verma",
    location: "Delhi",
    text: "Very easy to upload prescriptions. I usually worry about authenticity, but Sahimed provides only genuine products. A trusted partner for health.",
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {REVIEWS.map((review, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.8 }}
              className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-xl shadow-slate-200/50 relative group hover:-translate-y-2 transition-transform duration-500"
            >
              <div className="absolute top-8 right-10 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity">
                <Quote className="w-16 h-16 text-primary" />
              </div>

              <div className="space-y-6 relative z-10">
                <div className="flex gap-1">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#FACC15] text-[#FACC15]" />
                  ))}
                </div>

                <p className="text-slate-600 text-lg leading-relaxed font-medium italic">
                  "{review.text}"
                </p>

                <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                  <div>
                    <h4 className="text-slate-900 font-black uppercase text-sm tracking-tight flex items-center gap-2">
                      {review.name}
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                    </h4>
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">{review.location} • {review.date}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_Color_Icon.svg" alt="Google" className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Google Stats Bar */}
        <div className="mt-20 flex flex-wrap items-center justify-center gap-8 sm:gap-16 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-700">
           <div className="flex items-center gap-3">
             <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_Color_Icon.svg" alt="Google" className="w-8 h-8" />
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
