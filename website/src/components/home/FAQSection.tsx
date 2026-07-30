'use client';

import * as React from 'react';
import { Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const FAQS = [
  {
    q: "Are the medicines sold 100% authentic?",
    a: "Absolutely. Every product on Sahimed is sourced directly from licensed pharmaceutical manufacturers or their authorized distributors. We hold Drug License No. KA-B51-286602 and have a strict multi-layer quality-check protocol. Only genuine, unexpired medicines reach your doorstep — guaranteed."
  },
  {
    q: "Is a prescription required for medicines?",
    a: "For all Rx (prescription-only) medicines, a valid prescription from a registered medical practitioner is mandatory. Simply upload a photo or PDF during checkout — our certified pharmacists review and approve it within minutes, ensuring your complete safety."
  },
  {
    q: "How long does delivery take?",
    a: "24–48 hours in major metros (Bengaluru, Mumbai, Delhi, Hyderabad, Chennai). 3–5 working days across all other pin codes in India. You get real-time tracking via SMS and WhatsApp from dispatch to delivery."
  },
  {
    q: "Can I order via WhatsApp or phone?",
    a: "Yes! WhatsApp us at +91 73494 99898 with your prescription photo and medicine list — our pharmacist replies within 5 minutes and places the order for you. You can also call us anytime between 9 AM – 9 PM."
  },
  {
    q: "Why are Sahimed's prices so affordable?",
    a: "We follow 'Sahi Dawai, Sahi Daam Pe'. By cutting intermediaries and sourcing directly from manufacturers, we pass savings directly to you — up to 61% OFF MRP on branded generics. No hidden charges."
  },
  {
    q: "How do I track my order?",
    a: "After dispatch you receive a tracking link via SMS and WhatsApp. You can also visit our Order Tracking page anytime or reach out on WhatsApp for a live update."
  }
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = React.useState<number | null>(0);

  return (
    <section className="py-10 sm:py-16 max-w-3xl mx-auto px-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8 sm:mb-12"
      >
        <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 border border-primary/10 px-3 py-1 rounded-full mb-3">
          Got Questions?
        </span>
        <h2 className="text-xl sm:text-3xl font-black tracking-tight text-slate-900 leading-tight">
          Frequently Asked <span className="text-primary">Questions</span>
        </h2>
        <p className="text-slate-500 text-sm font-medium mt-2">
          Everything you need to know about Sahimed's pharmacy services.
        </p>
      </motion.div>

      {/* FAQ List */}
      <div className="space-y-2.5 sm:space-y-3">
        {FAQS.map((faq, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05, duration: 0.4 }}
            className={`rounded-xl sm:rounded-2xl border overflow-hidden transition-all duration-300 ${
              openIndex === i
                ? 'border-primary/30 shadow-lg shadow-primary/5 bg-white'
                : 'border-slate-100 bg-white hover:border-slate-200'
            }`}
          >
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full px-4 py-4 sm:px-6 sm:py-5 flex items-center justify-between text-left gap-3"
            >
              <span className={`flex-1 text-sm sm:text-base font-semibold leading-snug pr-2 transition-colors ${
                openIndex === i ? 'text-primary' : 'text-slate-900'
              }`}>
                {faq.q}
              </span>
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                openIndex === i ? 'bg-primary text-white rotate-0' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
              }`}>
                {openIndex === i
                  ? <Minus className="w-3.5 h-3.5" />
                  : <Plus className="w-3.5 h-3.5" />
                }
              </div>
            </button>
            <AnimatePresence initial={false}>
              {openIndex === i && (
                <motion.div
                  key="content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: 'easeInOut' }}
                >
                  <div className="px-4 pb-4 sm:px-6 sm:pb-5 text-slate-600 text-sm leading-relaxed border-t border-slate-50 pt-3">
                    {faq.a}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Bottom CTA */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mt-8 sm:mt-10 text-center p-5 sm:p-7 bg-gradient-to-br from-primary/5 to-violet-50 border border-primary/10 rounded-2xl"
      >
        <p className="text-sm font-bold text-slate-700 mb-3">Still have questions? We're here to help.</p>
        <div className="flex items-center gap-3 justify-center flex-wrap">
          <Link
            href="https://wa.me/917349499898"
            target="_blank"
            className="flex items-center gap-2 bg-[#25D366] text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-[#22c55e] transition-all active:scale-95"
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
            Chat on WhatsApp
          </Link>
          <Link
            href="tel:+917349499898"
            className="flex items-center gap-2 border border-slate-200 text-slate-700 bg-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider hover:border-slate-300 transition-all"
          >
            📞 Call Us
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
