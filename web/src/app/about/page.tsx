'use client';

import { useEffect, useState } from 'react';
import PublicHeader from '../../components/PublicHeader';
import PublicFooter from '../../components/PublicFooter';
import Link from 'next/link';

type CmsInfo = {
  name?: string;
  aboutText?: string;
  mission?: string;
  vision?: string;
};

export default function AboutPage() {
  const [info, setInfo] = useState<CmsInfo>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5001/api/cms/info')
      .then(res => res.json())
      .then(data => { setInfo(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center text-zinc-400 font-semibold text-sm">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p>Loading Company Details...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans">
      <PublicHeader companyName={info.name} />

      {/* Hero Section */}
      <main className="flex-1 py-20 lg:py-28 px-6 bg-card border-b border-border animate-fade-in-up">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-amber-400 font-black tracking-widest uppercase text-xs mb-3 block">About Our Enterprise</span>
            <h1 className="text-4xl lg:text-6xl font-black text-foreground mb-6 leading-tight">
              Solid Foundations For Every Milestone
            </h1>
            <div className="h-1.5 w-20 bg-amber-500 rounded-full mb-8"></div>
            <p className="text-base text-zinc-400 leading-relaxed mb-8">
              {info.aboutText || 'We build, design, and construct with the highest architectural standards. Rooted in craftsmanship and driven by technological innovation.'}
            </p>
            <ul className="flex flex-col gap-4 mb-10">
              <li className="flex items-center gap-3 text-foreground font-bold text-sm">
                <div className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center text-xs font-black border border-amber-500/20">✓</div>
                Rigorous safety compliance and continuous field supervision
              </li>
              <li className="flex items-center gap-3 text-foreground font-bold text-sm">
                <div className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center text-xs font-black border border-amber-500/20">✓</div>
                Camera-verified workforce attendance & instant payroll
              </li>
              <li className="flex items-center gap-3 text-foreground font-bold text-sm">
                <div className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center text-xs font-black border border-amber-500/20">✓</div>
                On-time project milestones with zero structural compromise
              </li>
            </ul>
            <Link href="/contact" className="inline-block bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-black px-8 py-4 rounded-2xl font-black text-sm transition-all duration-300 shadow-xl shadow-amber-500/25 hover:scale-105 active:scale-95 btn-hover-glow border border-amber-300/30">
              Contact Engineering Team
            </Link>
          </div>
          
          <div className="relative animate-fade-in-down">
            <div className="h-[460px] w-full bg-muted rounded-3xl overflow-hidden relative z-10 border border-border shadow-2xl flex items-center justify-center text-7xl card-lift">
              🏗️
            </div>
            
            {/* Floating Stats Card */}
            <div className="absolute -bottom-6 -left-6 bg-card p-6 rounded-3xl shadow-2xl border border-border z-20 flex gap-6 items-center animate-float">
              <div className="text-primary text-5xl font-black">15+</div>
              <div>
                <div className="font-black text-foreground text-base">Years of</div>
                <div className="text-muted-foreground text-xs font-semibold">Excellence</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mission & Vision */}
      <section className="py-24 px-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="bg-card border border-border p-10 rounded-3xl shadow-lg hover:border-primary/40 card-lift group">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform duration-300">🎯</div>
            <h2 className="text-2xl font-black text-foreground mb-4 group-hover:text-primary transition-colors">Our Mission</h2>
            <p className="text-muted-foreground leading-relaxed text-sm">
              {info.mission || 'To deliver high-quality, cost-effective infrastructure projects on schedule by employing and supporting motivated, flexible, and focused engineering teams.'}
            </p>
          </div>
          <div className="bg-card border border-border p-10 rounded-3xl shadow-lg hover:border-emerald-500/40 card-lift group">
            <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform duration-300">👁️</div>
            <h2 className="text-2xl font-black text-foreground mb-4 group-hover:text-emerald-500 transition-colors">Our Vision</h2>
            <p className="text-muted-foreground leading-relaxed text-sm">
              {info.vision || 'To be the highest value provider of sustainable construction services, advanced technical management, and client satisfaction.'}
            </p>
          </div>
        </div>
      </section>

      <PublicFooter companyName={info.name} />
    </div>
  );
}

