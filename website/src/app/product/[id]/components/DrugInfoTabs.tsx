"use client"

import { useState } from 'react';
import {
  HeartPulse, Stethoscope, ShieldCheck, Package,
  AlertTriangle, FlaskConical, BookOpen, CheckCircle2,
  ClipboardList, ShieldAlert, Building2, Tag, Globe, Pill
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Helpers ────────────────────────────────────────────────────────────────
function stripHtml(raw?: string | null): string {
  if (!raw) return '';
  return raw
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/\|/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function SectionLabel({ children, accent }: { children: React.ReactNode; accent?: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span className={cn("text-[10px] font-black uppercase tracking-[0.2em]", accent || "text-primary")}>{children}</span>
      <div className="flex-1 h-px bg-gradient-to-r from-primary/20 to-transparent" />
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a?: string | null }) {
  const [open, setOpen] = useState(false);
  if (!a) return null;
  return (
    <div className="border border-slate-100 rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors">
        <span className="text-xs font-bold text-slate-700 pr-4">{q}</span>
        <svg className={cn("w-4 h-4 text-slate-400 shrink-0 transition-transform", open && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>
      {open && (
        <div className="px-4 pb-4 bg-slate-50/50 border-t border-slate-100">
          <p className="text-[11px] font-medium text-slate-600 leading-relaxed pt-3">{a}</p>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value, icon: Icon, accent }: { label: string; value?: string | null; icon?: any; accent?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0">
      {Icon && (
        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5", accent || "bg-slate-100 text-slate-500")}>
          <Icon className="w-3.5 h-3.5" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{label}</p>
        <p className="text-xs font-semibold text-slate-800 leading-snug">{value}</p>
      </div>
    </div>
  );
}

// ─── Safety severity helper ──────────────────────────────────────────────────
function getSeverity(text?: string | null): { label: string; cls: string } {
  if (!text) return { label: '', cls: '' };
  const t = text.toLowerCase();
  if (t.includes('unsafe') || t.includes('not recommended') || t.includes('avoid'))
    return { label: 'UNSAFE', cls: 'bg-rose-100 text-rose-700' };
  if (t.includes('caution') || t.includes('with caution') || t.includes('dose adjustment'))
    return { label: 'CAUTION', cls: 'bg-orange-100 text-orange-700' };
  if (t.includes('consult') || t.includes('ask your doctor') || t.includes('tell your doctor'))
    return { label: 'CONSULT YOUR DOCTOR', cls: 'bg-teal-100 text-teal-700' };
  if (t.includes('safe') || t.includes('generally safe') || t.includes('no risk'))
    return { label: 'SAFE', cls: 'bg-emerald-100 text-emerald-700' };
  return { label: 'INFO', cls: 'bg-slate-100 text-slate-600' };
}

// ─── Props ───────────────────────────────────────────────────────────────────
interface DrugInfoTabsProps {
  product: any;
  molData: any;
  activeTab: 'overview' | 'usage' | 'safety' | 'info';
  onTabChange: (tab: 'overview' | 'usage' | 'safety' | 'info') => void;
}

const TABS = [
  { key: 'overview', label: 'Overview',    icon: HeartPulse },
  { key: 'usage',    label: 'How to Use',  icon: Stethoscope },
  { key: 'safety',   label: 'Safety',      icon: ShieldCheck },
  { key: 'info',     label: 'Product Info',icon: Package },
] as const;

export default function DrugInfoTabs({ product, molData, activeTab, onTabChange }: DrugInfoTabsProps) {
  const safetyAdviseClean = stripHtml(product?.safetyAdvise || product?.safety_warnings?.interactions?.safety_advise);
  const [showFullDesc, setShowFullDesc] = useState(false);

  function extractFromAdvise(key: string) {
    if (!safetyAdviseClean) return undefined;
    const regex = new RegExp(`(?:-|\\s|^)${key}\\s*:\\s*(.*?)(?=\\n\\s*-|\\n\\s*[A-Z][a-z]+\\s*:|$)`, 'i');
    const match = safetyAdviseClean.match(regex);
    return match ? match[1].trim() : undefined;
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Tab Bar — always visible */}
      <div className="flex border-b border-slate-100 overflow-x-auto">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => onTabChange(t.key)}
              className={cn(
                "flex-1 min-w-[90px] py-4 px-5 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex flex-col items-center gap-1.5",
                activeTab === t.key
                  ? "text-primary border-b-2 border-primary bg-primary/[0.03]"
                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              )}
            >
              <Icon className="w-4 h-4" />{t.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content — lazy loaded (this entire component is loaded on tab click) */}
      <div className="p-6 sm:p-8">

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {(product?.composition || molData?.molecule || molData?.name) && (
              <div className="flex items-center gap-4 bg-[#2f3542] rounded-xl px-5 py-4">
                <div className="shrink-0 w-10 h-10">
                  <svg viewBox="0 0 40 60" fill="none" className="w-full h-full">
                    <path d="M8 4 Q20 15 32 4" stroke="#a78bfa" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                    <path d="M8 14 Q20 25 32 14" stroke="#6ee7b7" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                    <path d="M8 24 Q20 35 32 24" stroke="#a78bfa" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                    <path d="M8 34 Q20 45 32 34" stroke="#6ee7b7" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                    <path d="M8 44 Q20 55 32 44" stroke="#a78bfa" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                    <line x1="8" y1="4" x2="8" y2="44" stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="2 3"/>
                    <line x1="32" y1="4" x2="32" y2="44" stroke="#6ee7b7" strokeWidth="1.5" strokeDasharray="2 3"/>
                    <circle cx="8" cy="4" r="2.5" fill="#a78bfa"/><circle cx="32" cy="4" r="2.5" fill="#6ee7b7"/>
                    <circle cx="8" cy="14" r="2" fill="#6ee7b7"/><circle cx="32" cy="14" r="2" fill="#a78bfa"/>
                    <circle cx="8" cy="24" r="2.5" fill="#a78bfa"/><circle cx="32" cy="24" r="2.5" fill="#6ee7b7"/>
                    <circle cx="8" cy="34" r="2" fill="#6ee7b7"/><circle cx="32" cy="34" r="2" fill="#a78bfa"/>
                    <circle cx="8" cy="44" r="2.5" fill="#a78bfa"/><circle cx="32" cy="44" r="2.5" fill="#6ee7b7"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Active Composition</p>
                  <p className="text-sm font-black text-white leading-snug truncate">{product?.composition || molData?.molecule || molData?.name}</p>
                  {(product?.primaryUse || product?.medical_info?.primary_use) && (
                    <p className="text-[10px] text-slate-400 font-medium mt-1">Used for: <span className="text-emerald-400 font-semibold">{product.primaryUse || product.medical_info?.primary_use}</span></p>
                  )}
                </div>
              </div>
            )}

            {(product?.description || product?.introduction) && (() => {
              const desc = product.description || product.introduction || '';
              const parts = desc.split(/(?<=\.)\s+/).filter(Boolean);
              const isLong = parts.length > 2;
              const visibleParts = showFullDesc ? parts : parts.slice(0, 2);
              return (
                <div>
                  <SectionLabel>About this Medicine</SectionLabel>
                  <div className="space-y-3 bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-xs">
                    {visibleParts.map((p: string, i: number) => (
                      <p key={i} className="text-xs sm:text-sm font-medium text-slate-600 leading-relaxed">{p}</p>
                    ))}
                    {isLong && (
                      <button onClick={() => setShowFullDesc(!showFullDesc)} className="mt-2 text-xs font-black text-primary hover:underline flex items-center gap-1 transition-all">
                        {showFullDesc ? 'Show Less ▲' : 'Read Full Description ▾'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            {(product?.treatment || product?.uses) && (
              <div><SectionLabel>Treatment &amp; Uses</SectionLabel>
                <div className="bg-sky-50 border border-sky-100 rounded-2xl p-5">
                  <p className="text-sm font-medium text-sky-900 leading-relaxed">{product.treatment || product.uses}</p>
                </div>
              </div>
            )}

            {(product?.benefits || product?.medical_info?.benefits) && (() => {
              const benefitList = stripHtml(product.benefits || product.medical_info?.benefits)
                .split(/(?:\n|\|(?<=\.)\s+)/).map((b: string) => b.trim()).filter((b: string) => b.length > 4);
              if (!benefitList.length) return null;
              return (
                <div><SectionLabel>Key Benefits</SectionLabel>
                  <div className="space-y-2 sm:space-y-3">
                    {benefitList.map((b: string, i: number) => (
                      <div key={i} className="flex items-start gap-2.5 sm:gap-3 bg-emerald-50/70 border border-emerald-100 rounded-xl px-3.5 sm:px-4 py-2.5 sm:py-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <p className="text-xs sm:text-sm font-semibold text-emerald-900 leading-relaxed">{b}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {((product?.sideEffectsArray?.length > 0) || product?.sideEffects) && (() => {
              const effects: string[] = product.sideEffectsArray?.length > 0
                ? product.sideEffectsArray
                : (product.sideEffects?.split(/\n|\|/).filter(Boolean) || []);
              if (!effects.length) return null;
              return (
                <div>
                  <SectionLabel>Possible Side Effects</SectionLabel>
                  <div className="relative overflow-hidden bg-[#fffbeb] border border-[#fef3c7] rounded-xl p-4 sm:p-5">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none"><AlertTriangle className="w-40 h-40" /></div>
                    <div className="flex items-center gap-2 mb-3 relative z-10">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <h4 className="text-xs font-black uppercase tracking-widest text-amber-800">Common Side Effects</h4>
                    </div>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 relative z-10">
                      {effects.map((s: string, i: number) => (
                        <span key={i} className="bg-white border border-amber-200 text-amber-900 text-xs font-semibold px-3 py-1.5 rounded-full shadow-xs">{s.trim()}</span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}

            {(product?.howItWorks || product?.medical_info?.how_it_works) && (
              <div><SectionLabel>How it Works</SectionLabel>
                <div className="relative overflow-hidden bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-100 rounded-2xl p-4 sm:p-5">
                  <div className="absolute top-3 right-3 opacity-10"><FlaskConical className="w-16 h-16 text-violet-500" /></div>
                  <div className="flex gap-3 relative z-10">
                    <FlaskConical className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
                    <p className="text-xs sm:text-sm font-medium text-violet-900 leading-relaxed">{product.howItWorks || product.medical_info?.how_it_works}</p>
                  </div>
                </div>
              </div>
            )}

            {(product?.factBox || product?.medical_info?.fact_box) && (() => {
              const raw: string = product.factBox || product.medical_info?.fact_box || '';
              const pairs = raw.split('|').map((s: string) => s.trim()).filter(Boolean).map((s: string) => {
                const [k, ...v] = s.split('::');
                let cleanV = (v.join('::') || '').trim();
                cleanV = cleanV.replace(/\d+-[A-Za-z0-9\-/\s&]+besomartks/gi, '').replace(/\s+/g, ' ').trim();
                return { key: k?.trim(), val: cleanV };
              }).filter((p: any) => p.key && p.val && p.val.length > 0);
              if (!pairs.length) return null;
              return (
                <div><SectionLabel>Quick Facts</SectionLabel>
                  <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 space-y-1">
                    {pairs.map((p: any, i: number) => (
                      <div key={i} className="flex justify-between items-start gap-4 border-b border-slate-100/80 py-2.5 last:border-0">
                        <span className="text-xs font-bold text-slate-500 w-1/3">{p.key}</span>
                        <span className="text-xs font-extrabold text-slate-900 w-2/3 text-right leading-snug">{p.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {(product?.marketerName || product?.manufacturer || product?.marketerAddress) && (
              <div><SectionLabel>Manufacturer Details</SectionLabel>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                  <p className="text-xs font-black text-slate-800 mb-1">{product?.marketerName || product?.manufacturer}</p>
                  {product?.marketerAddress && <p className="text-xs font-medium text-slate-500">{product.marketerAddress}</p>}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── HOW TO USE ── */}
        {activeTab === 'usage' && (
          <div className="space-y-8">
            {product?.howToUse ? (
              <div><SectionLabel>Directions for Use</SectionLabel>
                <div className="relative overflow-hidden bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-100 rounded-2xl p-6">
                  <div className="absolute top-3 right-3 opacity-10"><Stethoscope className="w-16 h-16 text-sky-500" /></div>
                  <div className="flex gap-3 relative z-10"><Stethoscope className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" /><p className="text-sm font-medium text-sky-900 leading-relaxed">{product.howToUse}</p></div>
                </div>
              </div>
            ) : (
              <div className="text-center py-10"><BookOpen className="w-10 h-10 text-slate-200 mx-auto mb-3" /><p className="text-sm text-slate-400 font-medium">Usage directions not available. Consult your doctor.</p></div>
            )}
            {product?.storage_instructions && (
              <div><SectionLabel>Storage Instructions</SectionLabel>
                <div className="bg-teal-50 border border-teal-100 rounded-2xl p-5 flex gap-3"><Package className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" /><p className="text-sm font-medium text-teal-900 leading-relaxed">{product.storage_instructions}</p></div>
              </div>
            )}
            {((product?.qaList?.length > 0) || product?.medical_info?.q_a?.length > 0) && (
              <div className="space-y-3"><SectionLabel>Frequently Asked Questions</SectionLabel>
                {(product.qaList || product.medical_info?.q_a || []).map((item: any, i: number) => (
                  <FaqItem key={i} q={item.question} a={item.answer} />
                ))}
                {!product?.ifMiss && <FaqItem q="What should I do if I miss a dose?" a="Take the missed dose as soon as you remember. If the next dose is close, skip it. Never double-dose." />}
                {(product?.ifOverdose || product?.medical_info?.if_overdose) && <FaqItem q="What if I overdose?" a={product.ifOverdose || product.medical_info?.if_overdose} />}
                {(product?.stopAdvice || product?.medical_info?.stop_advice) && <FaqItem q="Can I stop this medicine suddenly?" a={product.stopAdvice || product.medical_info?.stop_advice} />}
              </div>
            )}
            {!(product?.qaList?.length > 0) && !(product?.medical_info?.q_a?.length > 0) && (
              <div className="space-y-3"><SectionLabel>Common Questions</SectionLabel>
                <FaqItem q="What should I do if I miss a dose?" a={product?.ifMiss || product?.medical_info?.if_miss || "Take the missed dose as soon as you remember. If the next scheduled dose is close, skip it. Never double-dose."} />
                <FaqItem q="What happens if I overdose?" a={product?.ifOverdose || product?.medical_info?.if_overdose || "Seek immediate emergency medical attention."} />
                <FaqItem q="Can I stop taking this medicine suddenly?" a={product?.stopAdvice || product?.medical_info?.stop_advice || "Do not stop without consulting your doctor."} />
              </div>
            )}
          </div>
        )}

        {/* ── SAFETY ── */}
        {activeTab === 'safety' && (() => {
          const rows = [
            { key: 'alcohol', label: 'Alcohol', value: product?.alcoholInteraction || product?.safety_warnings?.interactions?.alcohol || extractFromAdvise('Alcohol'), svg: <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10"><rect x="16" y="4" width="16" height="6" rx="3" fill="#fca5a5" stroke="#f87171" strokeWidth="1.5"/><path d="M18 10 L14 40 Q14 44 24 44 Q34 44 34 40 L30 10Z" fill="#fee2e2" stroke="#f87171" strokeWidth="1.5"/><path d="M20 20 Q24 24 28 20" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round" fill="none"/><circle cx="24" cy="30" r="3" fill="#fca5a5"/></svg> },
            { key: 'pregnancy', label: 'Pregnancy', value: product?.pregnancyInteraction || product?.safety_warnings?.interactions?.pregnancy || extractFromAdvise('Pregnancy'), svg: <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10"><circle cx="24" cy="10" r="6" fill="#fca5a5" stroke="#f87171" strokeWidth="1.5"/><ellipse cx="24" cy="32" rx="12" ry="14" fill="#fee2e2" stroke="#f87171" strokeWidth="1.5"/><ellipse cx="24" cy="34" rx="7" ry="8" fill="#fca5a5" opacity="0.5"/><path d="M14 24 Q12 20 16 18" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round"/><path d="M34 24 Q36 20 32 18" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round"/></svg> },
            { key: 'lactation', label: 'Breast Feeding', value: product?.lactationInteraction || product?.safety_warnings?.interactions?.lactation || extractFromAdvise('Breast feeding') || extractFromAdvise('Lactation'), svg: <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10"><circle cx="24" cy="10" r="6" fill="#fca5a5" stroke="#f87171" strokeWidth="1.5"/><path d="M14 22 Q10 30 14 38 Q18 44 24 44 Q32 44 34 36 L36 26 Q30 20 24 20 Q18 20 14 22Z" fill="#fee2e2" stroke="#f87171" strokeWidth="1.5"/><circle cx="32" cy="28" r="4" fill="#fca5a5" stroke="#f87171" strokeWidth="1"/><circle cx="33" cy="27" r="1.5" fill="#f87171"/></svg> },
            { key: 'driving', label: 'Driving', value: product?.drivingInteraction || product?.safety_warnings?.interactions?.driving || extractFromAdvise('Driving'), svg: <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10"><circle cx="24" cy="24" r="18" fill="#fee2e2" stroke="#f87171" strokeWidth="1.5"/><circle cx="24" cy="24" r="10" fill="none" stroke="#f87171" strokeWidth="1.5"/><circle cx="24" cy="24" r="3" fill="#f87171"/><line x1="24" y1="6" x2="24" y2="14" stroke="#f87171" strokeWidth="2" strokeLinecap="round"/><line x1="24" y1="34" x2="24" y2="42" stroke="#f87171" strokeWidth="2" strokeLinecap="round"/><line x1="6" y1="24" x2="14" y2="24" stroke="#f87171" strokeWidth="2" strokeLinecap="round"/><line x1="34" y1="24" x2="42" y2="24" stroke="#f87171" strokeWidth="2" strokeLinecap="round"/><line x1="24" y1="24" x2="18" y2="16" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round"/></svg> },
            { key: 'kidney', label: 'Kidney', value: product?.kidneyInteraction || product?.safety_warnings?.interactions?.kidney || extractFromAdvise('Kidney'), svg: <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10"><path d="M18 8 C10 8 8 18 10 26 C12 34 16 42 22 42 C26 42 26 36 24 30 C22 24 24 20 28 18 C34 14 36 8 30 6 C26 4 22 8 18 8Z" fill="#fee2e2" stroke="#f87171" strokeWidth="1.5"/><path d="M30 8 C38 8 40 18 38 26 C36 34 32 42 26 42" stroke="#fca5a5" strokeWidth="1.5" strokeLinecap="round" fill="none"/></svg> },
            { key: 'liver', label: 'Liver', value: product?.liverInteraction || product?.safety_warnings?.interactions?.liver || extractFromAdvise('Liver'), svg: <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10"><path d="M8 20 C8 10 16 6 24 8 C32 6 42 12 40 24 C38 36 30 44 20 40 C12 36 8 30 8 20Z" fill="#fee2e2" stroke="#f87171" strokeWidth="1.5"/><path d="M16 20 Q20 16 26 20 Q32 24 30 32" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round" fill="none"/><circle cx="22" cy="26" r="3" fill="#fca5a5"/></svg> },
          ].filter(r => !!r.value);

          if (rows.length === 0) {
            return (
              <div className="text-center py-14">
                <ShieldCheck className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-400 font-medium">No specific interaction warnings listed. Always consult a doctor.</p>
              </div>
            );
          }
          return (
            <div className="space-y-6">
              <div className="divide-y divide-slate-100">
                {rows.map((row) => {
                  const { label: sevLabel, cls: sevCls } = getSeverity(row.value);
                  return (
                    <div key={row.key} className="flex items-start gap-5 py-5 first:pt-0 last:pb-0">
                      <div className="shrink-0 w-11 flex items-center justify-center mt-0.5">{row.svg}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <p className="text-sm font-black text-slate-800">{row.label}</p>
                          {sevLabel && <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${sevCls}`}>{sevLabel}</span>}
                        </div>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">{row.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <div className={cn("flex-1 rounded-2xl p-4 flex items-center gap-4 border", product?.prescriptionRequired ? "bg-rose-50 border-rose-100" : "bg-emerald-50 border-emerald-100")}>
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", product?.prescriptionRequired ? "bg-rose-100" : "bg-emerald-100")}>
                    <ClipboardList className={cn("w-4 h-4", product?.prescriptionRequired ? "text-rose-600" : "text-emerald-600")} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Prescription Status</p>
                    <p className={cn("text-xs font-bold", product?.prescriptionRequired ? "text-rose-700" : "text-emerald-700")}>
                      {product?.prescriptionRequired ? "Prescription required (Rx only)" : "Over-the-counter (OTC)"}
                    </p>
                  </div>
                </div>
                {(product?.isControlledSubstance !== undefined || product?.safety_warnings?.is_controlled_substance !== undefined) && (
                  <div className={cn("flex-1 rounded-2xl p-4 flex items-center gap-4 border", (product?.isControlledSubstance || product?.safety_warnings?.is_controlled_substance) ? "bg-red-50 border-red-100" : "bg-slate-50 border-slate-100")}>
                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", (product?.isControlledSubstance || product?.safety_warnings?.is_controlled_substance) ? "bg-red-100" : "bg-slate-100")}>
                      <ShieldAlert className={cn("w-4 h-4", (product?.isControlledSubstance || product?.safety_warnings?.is_controlled_substance) ? "text-red-600" : "text-slate-400")} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Controlled Substance</p>
                      <p className={cn("text-xs font-bold", (product?.isControlledSubstance || product?.safety_warnings?.is_controlled_substance) ? "text-red-700" : "text-slate-500")}>
                        {(product?.isControlledSubstance || product?.safety_warnings?.is_controlled_substance) ? "Scheduled / Controlled substance" : "Not a controlled substance"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* ── PRODUCT INFO ── */}
        {activeTab === 'info' && (
          <div className="space-y-8">
            <div><SectionLabel>Manufacturer &amp; Classification</SectionLabel>
              <div className="divide-y divide-slate-50">
                <InfoRow label="Marketer Name" value={product?.marketerName || product?.taxonomy?.marketer_name} icon={Building2} accent="bg-primary/10 text-primary" />
                <InfoRow label="Category" value={product?.categoryName || product?.taxonomy?.category_name} icon={Tag} accent="bg-amber-100 text-amber-600" />
                <InfoRow label="Sub-Category" value={product?.subCategory || product?.taxonomy?.sub_category} icon={Tag} accent="bg-amber-50 text-amber-500" />
                <InfoRow label="Medicine Type" value={product?.medicineType || product?.medicine_type} icon={Pill} accent="bg-sky-100 text-sky-600" />
                <InfoRow label="Molecule Code" value={product?.moleculeCode || product?.molecule_code} icon={FlaskConical} accent="bg-violet-100 text-violet-600" />
              </div>
            </div>
            <div><SectionLabel>Packaging Details</SectionLabel>
              <div className="divide-y divide-slate-50">
                <InfoRow label="Product Form" value={product?.productForm || product?.packaging?.product_form} icon={Pill} accent="bg-sky-100 text-sky-600" />
                <InfoRow label="Package Type" value={product?.packageType || product?.packaging?.package_type} icon={Package} accent="bg-indigo-100 text-indigo-600" />
                <InfoRow label="Package Quantity" value={product?.packageQuantity?.toString() || product?.packaging?.package_quantity?.toString()} icon={Tag} accent="bg-slate-100 text-slate-500" />
                <InfoRow label="Storage" value={product?.storage_instructions || product?.packaging?.storage} icon={Package} accent="bg-teal-100 text-teal-600" />
                <InfoRow label="Country of Origin" value={product?.countryOfOrigin || product?.country_of_origin} icon={Globe} accent="bg-amber-100 text-amber-600" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
