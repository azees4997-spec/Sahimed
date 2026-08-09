"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ShoppingBag, Sparkles, X } from 'lucide-react';

const RECENT_ACTIVITIES = [
  { name: 'Ramesh K.', city: 'Bengaluru', item: 'Dolo 650mg Tablet', savings: '₹84', time: '1 min ago' },
  { name: 'Priya M.', city: 'Vijayapura', item: 'Augmentin 625 Duo', savings: '₹145', time: '2 mins ago' },
  { name: 'Suresh B.', city: 'Mysuru', item: 'Telma 40mg Tablet', savings: '₹92', time: '4 mins ago' },
  { name: 'Ananya S.', city: 'Hubballi', item: 'Pantocid D SR Capsule', savings: '₹68', time: '5 mins ago' },
  { name: 'Vikram R.', city: 'Mangaluru', item: 'Glycomet GP 2 Tablet', savings: '₹110', time: '7 mins ago' },
  { name: 'Sunita P.', city: 'Belagavi', item: 'Shelcal 500 Tablet', savings: '₹55', time: '9 mins ago' }
];

export default function LiveSocialProofToast() {
  const [index, setIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Initial delay before first toast appears
    const timer = setTimeout(() => {
      if (!dismissed) setIsVisible(true);
    }, 4000);

    return () => clearTimeout(timer);
  }, [dismissed]);

  useEffect(() => {
    if (dismissed) return;

    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % RECENT_ACTIVITIES.length);
        setIsVisible(true);
      }, 800);
    }, 12000);

    return () => clearInterval(interval);
  }, [dismissed]);

  if (dismissed) return null;

  const current = RECENT_ACTIVITIES[index];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 50, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="fixed bottom-20 left-4 z-40 max-w-[320px] bg-white/95 backdrop-blur-md border border-emerald-100 shadow-xl rounded-2xl p-3.5 flex items-center gap-3 hidden sm:flex pointer-events-auto"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-black text-slate-800 truncate">
                {current.name} from <span className="text-teal-700">{current.city}</span>
              </span>
              <span className="text-[8px] font-bold text-slate-400 shrink-0">{current.time}</span>
            </div>
            
            <p className="text-[11px] font-extrabold text-slate-900 truncate leading-tight mt-0.5">
              Ordered {current.item}
            </p>

            <div className="flex items-center gap-2 mt-1">
              <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5" /> Saved {current.savings}
              </span>
              <span className="text-[9px] font-semibold text-slate-500 flex items-center gap-0.5">
                <ShieldCheck className="w-3 h-3 text-teal-600" /> Verified
              </span>
            </div>
          </div>

          <button
            onClick={() => setDismissed(true)}
            className="text-slate-300 hover:text-slate-500 p-1 shrink-0 transition-colors"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
