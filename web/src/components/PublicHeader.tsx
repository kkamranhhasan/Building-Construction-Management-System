import Link from 'next/link';

export default function PublicHeader({ companyName }: { companyName?: string }) {
  return (
    <header className="flex items-center justify-between px-6 lg:px-12 py-4 border-b border-border bg-card/95 backdrop-blur-xl sticky top-0 z-50 transition-all duration-300 shadow-sm">
      <Link href="/" className="flex items-center gap-3 group">
        <div className="w-10 h-10 bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform animate-float">
          🏗️
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-black text-foreground tracking-tight group-hover:text-amber-600 transition-colors">
            {companyName || 'S Islam ERP'}
          </span>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Construction Suite</span>
        </div>
      </Link>
      <nav className="flex gap-6 lg:gap-8 items-center text-xs font-bold">
        <Link href="/" className="text-muted-foreground hover:text-amber-600 transition-all duration-200 hover:-translate-y-0.5">Home</Link>
        <Link href="/about" className="text-muted-foreground hover:text-amber-600 transition-all duration-200 hover:-translate-y-0.5">About Us</Link>
        <Link href="/projects" className="text-muted-foreground hover:text-amber-600 transition-all duration-200 hover:-translate-y-0.5">Projects</Link>
        <Link href="/contact" className="text-muted-foreground hover:text-amber-600 transition-all duration-200 hover:-translate-y-0.5">Contact</Link>
        <div className="w-px h-5 bg-border mx-1 hidden sm:block"></div>
        <a href="http://localhost:5173/login" className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-4 py-2.5 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-md shadow-amber-500/20 font-bold hidden sm:block">
          Personnel Login →
        </a>
      </nav>
    </header>
  );
}

