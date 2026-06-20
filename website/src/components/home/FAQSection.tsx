'use client';

import * as React from 'react';
import { Plus, Minus, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FAQS = [
  {
    question: "Are the medicines sold 100% authentic?",
    answer: "Yes, absolutely. Every product on Sahimed is sourced directly from licensed pharmaceutical manufacturers or their authorized distributors. We have a strict quality-check protocol to ensure that only genuine, unexpired medicines reach your doorstep."
  },
  {
    question: "Is a prescription required for medicines?",
    answer: "For all prescription-only (Rx) medicines, a valid prescription from a registered medical practitioner is mandatory. You can easily upload a photo or PDF of your prescription during checkout. Our certified pharmacists verify every prescription for your safety."
  },
  {
    question: "How long does delivery usually take?",
    answer: "We offer fast and safe delivery across India. Delivery times typically range from 24-48 hours in major cities like Bangalore, Mumbai, and Delhi, and 3-5 days for other regions. We focus on ensuring the medicines are transported safely and securely."
  },
  {
    question: "Can I order via WhatsApp or phone call?",
    answer: "Yes! We understand that some customers prefer a more personal touch. You can reach out to our team at +91 7349499898 via WhatsApp or call us to place your order directly. Our experts will help you with the process."
  },
  {
    question: "Why are Sahimed's prices so affordable?",
    answer: "Our motto is 'Sahi Dawai, Sahi Daam Pe'. We achieve this by optimizing our supply chain, removing unnecessary intermediaries, and passing those savings directly to you. We aim to make chronic healthcare affordable for every Indian household."
  }
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);

  return (
    <section className="py-8 sm:py-32 max-w-4xl mx-auto px-4 sm:px-6">
      <div className="text-center space-y-1.5 sm:space-y-4 mb-8 sm:mb-16">
        <div className="flex justify-center">
          <div className="w-8 h-8 sm:w-12 sm:h-12 bg-primary/10 rounded-lg sm:rounded-2xl flex items-center justify-center">
            <HelpCircle className="w-4 h-4 sm:w-6 sm:h-6 text-primary" />
          </div>
        </div>
        <h2 className="text-sm sm:text-4xl font-black tracking-tighter text-slate-900 font-outfit uppercase leading-none px-4">
          Frequently Asked <span className="text-primary italic">Questions</span>
        </h2>
        <p className="text-slate-500 text-[10px] sm:text-base font-medium">Everything you need to know about Sahimed's authentic healthcare services.</p>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {FAQS.map((faq, i) => (
          <div 
            key={i} 
            className={`bg-white rounded-[24px] sm:rounded-[32px] border ${openIndex === i ? 'border-primary shadow-lg shadow-primary/5' : 'border-slate-100'} transition-all duration-300 overflow-hidden`}
          >
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full px-3 py-4 sm:px-8 sm:py-7 flex items-center justify-between text-left group gap-2"
            >
              <span className={`flex-1 text-[13px] sm:text-[17px] font-semibold tracking-tight font-outfit pr-2 ${openIndex === i ? 'text-primary' : 'text-slate-900'}`}>
                {faq.question}
              </span>
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all shrink-0 ${openIndex === i ? 'bg-primary text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'}`}>
                {openIndex === i ? <Minus className="w-3 h-3 sm:w-4 sm:h-4" /> : <Plus className="w-3 h-3 sm:w-4 sm:h-4" />}
              </div>
            </button>
            <AnimatePresence>
              {openIndex === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="px-5 pb-5 sm:px-8 sm:pb-8 text-slate-600 text-xs sm:text-[15px] font-normal leading-relaxed">
                    {faq.answer}
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
