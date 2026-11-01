'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';

export default function LandingPage() {
  const [info, setInfo] = useState<any>({});
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [infoRes, projRes] = await Promise.all([
          fetch('http://localhost:5001/api/cms/info'),
          fetch('http://localhost:5001/api/cms/projects')
        ]);
        if (infoRes.ok) setInfo(await infoRes.json());
        if (projRes.ok) setProjects((await projRes.json()).slice(0, 3)); // Only show top 3 on home
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
      <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-muted-foreground font-semibold text-sm animate-pulse">Loading Construction Suite...</p>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans">
      <PublicHeader companyName={info.name} />

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-28 md:py-36 bg-gradient-to-b from-amber-500/5 via-background to-background relative overflow-hidden animate-fade-in-up">
        {/* Subtle Gold Ambient Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[650px] h-[320px] bg-amber-500/10 blur-[130px] rounded-full pointer-events-none -z-10 animate-pulse" />

        <div className="bg-amber-50 text-amber-800 px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase mb-6 border border-amber-200/80 shadow-sm inline-flex items-center gap-2 animate-float">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span>Modern Construction Excellence</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight max-w-5xl tracking-tight text-slate-900 transition-all duration-300">
          {info.heroTitle || 'Construct The Future'} <br />
          <span className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 bg-clip-text text-transparent">{info.heroSub || 'Manage With Precision.'}</span>
        </h1>

        <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
          {info.mission || 'The complete ERP solution for modern construction companies. Track attendance, manage sites, and handle payroll all in one unified platform.'}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/projects" className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-8 py-4 rounded-2xl font-black text-sm transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl shadow-amber-500/25 btn-hover-glow">
            Explore Projects
          </Link>
          <Link href="/contact" className="bg-card hover:bg-slate-50 text-foreground border border-border hover:border-amber-500/40 px-8 py-4 rounded-2xl font-black text-sm transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm">
            Get a Quote
          </Link>
        </div>
      </main>

      {/* Services/Features Section */}
      <section className="px-6 lg:px-24 py-24 bg-card border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 animate-fade-in-down">
            <span className="text-primary font-black tracking-widest uppercase text-xs mb-2 block">Our Capabilities</span>
            <h2 className="text-3xl md:text-4xl font-black text-foreground mb-3">Enterprise Construction Management</h2>
            <div className="h-1 w-16 bg-primary mx-auto rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-background border border-border p-8 rounded-3xl card-lift group flex flex-col justify-between hover:border-primary/40">
              <div>
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  🏢
                </div>
                <h3 className="text-xl font-bold mb-2 text-foreground group-hover:text-primary transition-colors">Multi-Site Supervision</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Seamlessly allocate workforce, assign field supervisors, and monitor progress across all active projects simultaneously.
                </p>
              </div>
            </div>
            <div className="bg-background border border-border p-8 rounded-3xl card-lift group flex flex-col justify-between hover:border-emerald-500/40">
              <div>
                <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  📸
                </div>
                <h3 className="text-xl font-bold mb-2 text-foreground group-hover:text-emerald-500 transition-colors">Photo Proof Attendance</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Live facial capture attendance ensuring real-time workforce authenticity and verified timestamp logging.
                </p>
              </div>
            </div>
            <div className="bg-background border border-border p-8 rounded-3xl card-lift group flex flex-col justify-between hover:border-indigo-500/40">
              <div>
                <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  💰
                </div>
                <h3 className="text-xl font-bold mb-2 text-foreground group-hover:text-indigo-500 transition-colors">Automated Hourly Payroll</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Automatic monthly wage calculation directly multiplying tracked hours by worker rates, generating instant payslips.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Projects Section */}
      <section className="px-6 lg:px-24 py-24 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
            <div>
              <span className="text-primary font-black tracking-widest uppercase text-xs mb-2 block">Our Portfolio</span>
              <h2 className="text-3xl md:text-4xl font-black text-foreground">Featured Construction Projects</h2>
            </div>
            <Link href="/projects" className="bg-card hover:bg-accent text-foreground border border-border px-6 py-3 rounded-2xl font-bold text-xs transition-all duration-300 shadow-sm hover:scale-105 active:scale-95">
              View All Projects →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {projects.map(p => (
              <div key={p.id} className="bg-card border border-border rounded-3xl overflow-hidden card-lift group flex flex-col justify-between hover:border-primary/40">
                <div className="h-56 bg-muted relative group-hover:bg-muted/80 transition-colors flex items-center justify-center text-5xl overflow-hidden">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    "🏗️"
                  )}
                  <div className="absolute top-4 right-4 bg-card/90 backdrop-blur-sm text-foreground px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm transition-transform duration-300 group-hover:scale-105 border border-border">
                    {p.status}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-black mb-2 text-foreground group-hover:text-primary transition-colors line-clamp-1">{p.title}</h3>
                  <p className="text-muted-foreground text-xs leading-relaxed line-clamp-3">
                    {p.description}
                  </p>
                  <Link href="/projects" className="inline-block mt-4 text-primary font-bold text-xs hover:underline transition-all group-hover:translate-x-1">
                    View Project Overview →
                  </Link>
                </div>
              </div>
            ))}
            {projects.length === 0 && (
              <div className="col-span-full text-center text-muted-foreground py-16 bg-card rounded-3xl border border-dashed border-border animate-scale-in">
                <div className="text-4xl mb-3 animate-float">🏗️</div>
                <p className="font-semibold text-sm">No projects showcased yet.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <PublicFooter companyName={info.name} />
    </div>
  );
}

