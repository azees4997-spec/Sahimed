import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
      {/* Illustration */}
      <div className="w-48 h-48 mb-8 select-none">
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="100" r="90" fill="#EFF6FF" />
          {/* Magnifier */}
          <circle cx="88" cy="88" r="36" stroke="#3B82F6" strokeWidth="6" fill="white"/>
          <line x1="115" y1="115" x2="138" y2="138" stroke="#3B82F6" strokeWidth="8" strokeLinecap="round"/>
          {/* "?" inside magnifier */}
          <text x="79" y="100" fontFamily="Arial" fontWeight="900" fontSize="32" fill="#3B82F6">?</text>
          {/* Dots */}
          <circle cx="50" cy="155" r="5" fill="#BFDBFE" opacity="0.8"/>
          <circle cx="66" cy="163" r="3" fill="#BFDBFE" opacity="0.6"/>
          <circle cx="150" cy="148" r="4" fill="#BFDBFE" opacity="0.7"/>
        </svg>
      </div>

      <p className="text-[11px] font-black text-primary uppercase tracking-[0.3em] mb-3">404 · Page Not Found</p>
      <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-slate-900 uppercase font-outfit mb-3">
        Lost in the<br className="sm:hidden" /> Medicine Aisle
      </h1>
      <p className="text-sm font-medium text-slate-400 mb-10 max-w-sm mx-auto leading-relaxed">
        The page you're looking for doesn't exist or has moved. Let us help you find what you need.
      </p>

      {/* Primary Action */}
      <Link
        href="/"
        className="inline-flex items-center gap-3 h-16 px-10 rounded-full bg-primary text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all mb-6"
      >
        Go to Home
      </Link>

      {/* Support Row */}
      <div className="flex items-center gap-4 mb-10">
        <a
          href="https://wa.me/917349499898"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 px-5 py-3 rounded-full bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] font-black text-[11px] uppercase tracking-widest hover:bg-[#25D366]/20 transition-all"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.118 1.531 5.845L0 24l6.335-1.511A11.933 11.933 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.013-1.374l-.36-.213-3.731.89.926-3.626-.233-.373A9.786 9.786 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182c5.43 0 9.818 4.388 9.818 9.818 0 5.43-4.388 9.818-9.818 9.818z"/>
          </svg>
          WhatsApp Support
        </a>
        <a
          href="tel:+917349499898"
          className="flex items-center gap-2.5 px-5 py-3 rounded-full bg-primary/10 border border-primary/20 text-primary font-black text-[11px] uppercase tracking-widest hover:bg-primary/20 transition-all"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 11a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.72 6.72l1.1-1.1a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7a2 2 0 011.72 2.04z"/>
          </svg>
          Direct Call
        </a>
      </div>

      {/* Quick search link */}
      <Link
        href="/search"
        className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] hover:text-primary transition-colors"
      >
        Search medicines instead →
      </Link>
    </div>
  );
}
