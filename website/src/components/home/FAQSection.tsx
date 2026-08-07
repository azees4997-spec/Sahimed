'use client';

import * as React from 'react';
import { Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const FAQS = [
  {
    q: "Are the medicines sold 100% authentic?",
    a: "Absolutely. Every product on Sahimed is sourced directly from licensed pharmaceutical manufacturers or authorized distributors. Drug License No. KA-B51-286602."
  },
  {
    q: "Is a prescription required for medicines?",
    a: "For Rx medicines, a valid prescription is mandatory. Upload a photo during checkout — our certified pharmacists review and approve it within minutes."
  },
  {
    q: "How long does delivery take?",
    a: "24–48 hours in major metros (Bengaluru, Mumbai, Delhi, Hyderabad, Chennai). 3–5 days for other regions with real-time tracking."
  },
  {
    q: "Can I order via WhatsApp?",
    a: "Yes! WhatsApp us at +91 73494 99898 with your prescription photo — our pharmacist replies within 5 minutes."
  },
  {
    q: "Why are Sahimed's prices so affordable?",
    a: "We cut intermediaries and source directly from manufacturers, passing savings directly to you — up to 61% OFF MRP on branded generics."
  }
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = React.useState<number | null>(0);

  return (
    <section className="py-4 sm:py-6 max-w-4xl mx-auto px-4 my-2 sm:my-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-1 mb-4 pb-2 border-b border-slate-100">
        <div>
          <h2 className="text-base sm:text-xl font-black text-slate-900 tracking-tight">
            Frequently Asked <span className="text-primary">Questions</span>
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-500 font-medium">Clear answers about SahiMed products & orders</p>
        </div>
        <Link href="https://wa.me/917349499898" target="_blank" className="text-[11px] font-black text-[#25D366] uppercase tracking-wider hover:underline shrink-0">
          Have Questions? Chat on WhatsApp →
        </Link>
      </div>

      {/* FAQ Accordions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
        {FAQS.map((faq, i) => (
          <div
            key={i}
            className={`rounded-xl border transition-all duration-200 ${
              openIndex === i
                ? 'border-primary/30 bg-white shadow-2xs'
                : 'border-slate-200/70 bg-white hover:border-slate-300'
            }`}
          >
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full px-3.5 py-3 flex items-center justify-between text-left gap-2"
            >
              <span className={`text-xs font-bold leading-snug transition-colors ${
                openIndex === i ? 'text-primary' : 'text-slate-800'
              }`}>
                {faq.q}
              </span>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${
                openIndex === i ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'
              }`}>
                {openIndex === i ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
              </div>
            </button>
            <AnimatePresence initial={false}>
              {openIndex === i && (
                <motion.div
                  key="content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="px-3.5 pb-3 text-slate-600 text-[11px] leading-relaxed border-t border-slate-100 pt-2 font-medium">
                    {faq.a}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </section>
  );
}
