'use client';

import * as React from 'react';
import { ShieldAlert, FileText, X } from 'lucide-react';
import Link from 'next/link';

export default function RxDisclaimerBanner() {
  const [dismissed, setDismissed] = React.useState(false);

  if (dismissed) return null;

  return (
    <div className="w-full bg-emerald-900 text-white text-[11px] font-medium py-1.5 px-4 flex items-center justify-between gap-3 border-b border-emerald-800 relative z-30">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 flex-wrap text-center sm:text-left">
        <span className="inline-flex items-center gap-1 font-bold bg-emerald-800 text-emerald-100 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider shrink-0">
          <ShieldAlert className="w-3 h-3 text-emerald-300" />
          Rx Prescription Required
        </span>
        <span className="text-emerald-100/90 leading-tight">
          As per Indian Drugs & Cosmetics Rules, a valid prescription from a registered medical practitioner is mandatory for all Rx medicines.
        </span>
        <Link
          href="/prescription"
          className="inline-flex items-center gap-1 text-emerald-300 hover:text-white font-semibold underline underline-offset-2 ml-1 shrink-0 transition-colors"
        >
          <FileText className="w-3 h-3" />
          Upload Rx
        </Link>
      </div>

      <button
        onClick={() => setDismissed(true)}
        className="text-emerald-300 hover:text-white transition-colors p-0.5 rounded hover:bg-emerald-800 shrink-0"
        title="Dismiss notice"
        aria-label="Dismiss prescription notice"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
