import Link from 'next/link';

export default function PublicHeader({ companyName }: { companyName: string }) {
  return (
    <header className="flex items-center justify-between px-8 py-5 border-b border-border bg-white/90 backdrop-blur-md sticky top-0 z-50 transition-all duration-300 shadow-sm">
      <Link href="/" className="flex items-center gap-3 group">
        <div className="w-10 h-10 bg-primary text-white rounded-lg flex items-center justify-center font-bold text-xl shadow-md group-hover:scale-105 transition-transform">
          {companyName ? companyName.charAt(0) : 'S'}
        </div>
        <span className="text-2xl font-extrabold text-slate-900 tracking-tight group-hover:text-primary transition-colors">
          {companyName || 'S Islam'}
        </span>
      </Link>
      <nav className="flex gap-8 items-center">
        <Link href="/" className="text-slate-600 font-semibold hover:text-primary transition-colors duration-200">Home</Link>
        <Link href="/about" className="text-slate-600 font-semibold hover:text-primary transition-colors duration-200">About Us</Link>
        <Link href="/projects" className="text-slate-600 font-semibold hover:text-primary transition-colors duration-200">Projects</Link>
        <Link href="/contact" className="text-slate-600 font-semibold hover:text-primary transition-colors duration-200">Contact</Link>
        <div className="w-px h-6 bg-slate-200 mx-2"></div>
        <a href="http://localhost:5173/login" className="text-slate-700 font-bold hover:text-primary transition-colors duration-200">
          Login
        </a>
        <a href="http://localhost:5173/signup" className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-full font-bold transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-primary/30">
          Get in touch
        </a>
      </nav>
    </header>
  );
}
