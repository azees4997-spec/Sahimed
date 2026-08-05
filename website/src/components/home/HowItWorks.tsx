'use client';

import * as React from 'react';
import { Search, FileText, PackageCheck, Truck } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const STEPS = [
  {
    icon: Search,
    title: "Search Medicines",
    desc: "Find 50,000+ authentic products",
    emoji: "🔍",
    badge: "STEP 01",
    bg: "linear-gradient(135deg,#ecfdf5,#d1fae5)",
    border: "#6ee7b7",
    color: "#059669",
  },
  {
    icon: FileText,
    title: "Upload Prescription",
    desc: "Fast verification by pharmacists",
    emoji: "📋",
    badge: "STEP 02",
    bg: "linear-gradient(135deg,#f5f3ff,#ede9fe)",
    border: "#a78bfa",
    color: "#7c3aed",
  },
  {
    icon: PackageCheck,
    title: "Quality Check",
    desc: "Multi-layer authenticity check",
    emoji: "✅",
    badge: "STEP 03",
    bg: "linear-gradient(135deg,#fff0f7,#fce7f3)",
    border: "#f9a8d4",
    color: "#db2777",
  },
  {
    icon: Truck,
    title: "Safe Delivery",
    desc: "Express doorstep delivery",
    emoji: "🚚",
    badge: "STEP 04",
    bg: "linear-gradient(135deg,#fffbeb,#fef9c3)",
    border: "#fde68a",
    color: "#d97706",
  }
];

export default function HowItWorks() {
  return (
    <section className="space-y-3 my-2 sm:my-4">
      {/* ── 4 Pastel Steps Cards — Matching Free Delivery & Long Expiry Section ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STEPS.map((card, i) => (
          <div
            key={i}
            className="flex flex-col gap-3 p-4 sm:p-5 rounded-2xl hover:-translate-y-1 transition-all duration-300 cursor-default"
            style={{ background: card.bg, border: `1.5px solid ${card.border}60`, boxShadow: `0 4px 20px ${card.border}30` }}
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center text-xl shadow-sm">
                {card.emoji}
              </div>
              <span className="text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-white/70 shadow-2xs"
                style={{ color: card.color }}
              >
                {card.badge}
              </span>
            </div>
            <div>
              <p className="text-sm font-black text-slate-900 leading-tight">{card.title}</p>
              <p className="text-[10px] font-medium text-slate-500 mt-0.5 leading-snug">{card.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
