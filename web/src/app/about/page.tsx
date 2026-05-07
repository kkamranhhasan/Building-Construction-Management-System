'use client';

import { useEffect, useState } from 'react';
import PublicHeader from '../../components/PublicHeader';
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
      .then(data => { setInfo(data); setLoading(false); });
  }, []);

  if (loading) return <div className="min-h-screen bg-surface flex items-center justify-center text-slate-500 font-medium">Loading...</div>;

  return (
    <div className="min-h-screen flex flex-col bg-background text-slate-900 font-sans">
      <PublicHeader companyName={info.name} />

      {/* Hero Section */}
      <main className="bg-surface py-20 lg:py-32 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="animate-in fade-in slide-in-from-left-8 duration-700">
            <span className="text-primary font-bold tracking-wider uppercase text-sm mb-4 block">About Us</span>
            <h1 className="text-5xl lg:text-6xl font-extrabold text-slate-900 mb-6 leading-tight">
              Strong Foundations For Every Great Build
            </h1>
            <div className="h-1 w-24 bg-primary rounded-full mb-8"></div>
            <p className="text-lg text-slate-600 leading-relaxed mb-8">
              {info.aboutText || 'Domestic confined any but son bachelor advanced remember. How proceed offered her offence shy forming. We build, design, and construct with the highest standards in mind.'}
            </p>
            <ul className="flex flex-col gap-4 mb-10">
              <li className="flex items-center gap-3 text-slate-700 font-semibold">
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm">✓</div>
                Rooted in craftsmanship, driven by innovation.
              </li>
              <li className="flex items-center gap-3 text-slate-700 font-semibold">
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm">✓</div>
                Turning blueprints into solid, lasting impact.
              </li>
              <li className="flex items-center gap-3 text-slate-700 font-semibold">
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm">✓</div>
                Built on legacy, focused on what&apos;s next.
              </li>
            </ul>
            <Link href="/contact" className="inline-block bg-primary hover:bg-primary-hover text-white px-8 py-4 rounded-full font-bold transition-all shadow-xl shadow-primary/30 hover:scale-105 active:scale-95">
              Read More
            </Link>
          </div>
          
          <div className="relative animate-in fade-in slide-in-from-right-8 duration-700">
            <div className="absolute inset-0 bg-primary/10 rounded-3xl transform translate-x-6 translate-y-6"></div>
            <div className="h-[500px] w-full bg-slate-200 rounded-3xl overflow-hidden relative z-10 border border-slate-200 shadow-2xl flex items-center justify-center text-6xl">
              🏗️
              {/* Optional: Add actual placeholder image logic if you want */}
            </div>
            
            {/* Floating Stats Card */}
            <div className="absolute -bottom-8 -left-8 bg-white p-6 rounded-2xl shadow-2xl border border-slate-100 z-20 flex gap-6 items-center">
              <div className="text-primary text-5xl font-black">20+</div>
              <div>
                <div className="font-bold text-slate-900">Years of</div>
                <div className="text-slate-500 font-medium">Experience</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mission & Vision */}
      <section className="py-24 px-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="bg-white border border-slate-200 p-12 rounded-3xl shadow-xl hover:border-primary/50 transition-colors group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-10 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-4xl mb-8 group-hover:scale-110 transition-transform">🎯</div>
            <h2 className="text-3xl font-extrabold text-slate-900 mb-6">Our Mission</h2>
            <p className="text-slate-600 leading-relaxed text-lg">
              {info.mission || 'To deliver high-quality, cost-effective projects on schedule by employing and supporting motivated, flexible, and focused teams.'}
            </p>
          </div>
          <div className="bg-white border border-slate-200 p-12 rounded-3xl shadow-xl hover:border-primary/50 transition-colors group relative overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-br-full -z-10 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-4xl mb-8 group-hover:scale-110 transition-transform">👁️</div>
            <h2 className="text-3xl font-extrabold text-slate-900 mb-6">Our Vision</h2>
            <p className="text-slate-600 leading-relaxed text-lg">
              {info.vision || 'To be the highest value provider of global construction services and technical expertise.'}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
