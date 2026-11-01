import Link from 'next/link';

export default function PublicFooter({ companyName }: { companyName?: string }) {
  return (
    <footer className="bg-card text-foreground border-t border-border">
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center text-black font-black text-xl shadow-lg shadow-amber-500/25 border border-amber-300/30">
              🏗️
            </div>
            <span className="text-xl font-black bg-gradient-to-r from-white via-amber-200 to-amber-400 bg-clip-text text-transparent tracking-tight">
              {companyName || 'S Islam ERP'}
            </span>
          </div>
          <p className="text-zinc-400 text-xs leading-relaxed">
            Delivering excellence in construction project management, field workforce tracking, and architectural innovation.
          </p>
        </div>

        <div>
          <h4 className="text-foreground font-bold text-sm uppercase tracking-wider mb-4 text-amber-400">Quick Links</h4>
          <ul className="flex flex-col gap-2.5 text-xs text-zinc-400">
            <li><Link href="/" className="hover:text-amber-400 transition-colors">Home Page</Link></li>
            <li><Link href="/about" className="hover:text-amber-400 transition-colors">About Company</Link></li>
            <li><Link href="/projects" className="hover:text-amber-400 transition-colors">Our Projects</Link></li>
            <li><Link href="/contact" className="hover:text-amber-400 transition-colors">Contact Us</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-foreground font-bold text-sm uppercase tracking-wider mb-4 text-amber-400">Portals</h4>
          <ul className="flex flex-col gap-2.5 text-xs text-zinc-400">
            <li><a href="http://localhost:5173/login" className="hover:text-amber-400 transition-colors">Employee & Admin Login</a></li>
            <li><a href="http://localhost:5173/login" className="hover:text-amber-400 transition-colors">Site Manager Portal</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-foreground font-bold text-sm uppercase tracking-wider mb-4">Enterprise ERP</h4>
          <p className="text-muted-foreground text-xs leading-relaxed mb-3">
            Equipped with camera facial check-ins, automated hourly wage calculation, and multi-site oversight.
          </p>
          <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>24/7 Field Connectivity</span>
          </div>
        </div>
      </div>

      <div className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {companyName || 'S Islam Construction ERP'}. All rights reserved.
      </div>
    </footer>
  );
}
