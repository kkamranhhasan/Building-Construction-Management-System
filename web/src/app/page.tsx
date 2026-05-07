'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import PublicHeader from '../components/PublicHeader';

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

  if (loading) return <div className="min-h-screen bg-surface flex items-center justify-center text-slate-500 font-medium">Loading...</div>;

  return (
    <div className="min-h-screen flex flex-col bg-background text-slate-900 font-sans">
      <PublicHeader companyName={info.name} />

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-32 bg-gradient-to-b from-surface to-background animate-in fade-in duration-1000">
        <div className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-bold tracking-wide mb-8 border border-primary/20 shadow-sm inline-block">
          RELIABLE CONSTRUCTION SERVICES
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight max-w-5xl tracking-tight text-slate-900">
          {info.heroTitle || 'Construct The Future'} <br />
          <span className="text-primary drop-shadow-sm">{info.heroSub || 'Manage With Precision.'}</span>
        </h1>
        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-12 leading-relaxed">
          {info.mission || 'The complete ERP solution for modern construction companies. Track attendance, manage sites, and handle payroll all in one unified platform.'}
        </p>
        <div className="flex gap-4">
          <Link href="/projects" className="bg-primary hover:bg-primary-hover text-white px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl shadow-primary/30 ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
            Explore Our Work
          </Link>
          <Link href="/contact" className="bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 hover:scale-105 active:scale-95 shadow-md">
            Contact Us
          </Link>
        </div>
      </main>

      {/* Services/Features Section */}
      <section className="px-8 lg:px-24 py-24 bg-surface border-t border-slate-100">
        <div className="text-center mb-16">
          <span className="text-primary font-bold tracking-wider uppercase text-sm mb-2 block">Our Expertise</span>
          <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Smart Services To Help Build Your Dream</h2>
          <div className="h-1 w-24 bg-primary mx-auto rounded-full"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white border border-slate-200 p-10 rounded-2xl transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:border-primary/50 group">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
              🏢
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-900">Multi-Site Management</h3>
            <p className="text-slate-600 leading-relaxed">
              Oversee multiple construction sites simultaneously. Assign managers and track real-time progress for every project.
            </p>
            <div className="mt-6 flex items-center text-primary font-bold group-hover:gap-2 transition-all">
              Learn More <span>→</span>
            </div>
          </div>
          <div className="bg-white border border-slate-200 p-10 rounded-2xl transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:border-primary/50 group">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
              📸
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-900">Live Attendance</h3>
            <p className="text-slate-600 leading-relaxed">
              Site managers can capture live worker attendance using mobile cameras with geographic tagging to ensure authenticity.
            </p>
            <div className="mt-6 flex items-center text-primary font-bold group-hover:gap-2 transition-all">
              Learn More <span>→</span>
            </div>
          </div>
          <div className="bg-white border border-slate-200 p-10 rounded-2xl transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:border-primary/50 group">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
              💰
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-900">Automated Payroll</h3>
            <p className="text-slate-600 leading-relaxed">
              Automatically calculate monthly salaries based on exact working hours and daily wages. Generate payslips instantly.
            </p>
            <div className="mt-6 flex items-center text-primary font-bold group-hover:gap-2 transition-all">
              Learn More <span>→</span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Projects Section */}
      <section className="px-8 lg:px-24 py-24 bg-background">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12">
          <div>
            <span className="text-primary font-bold tracking-wider uppercase text-sm mb-2 block">Our Portfolio</span>
            <h2 className="text-4xl font-extrabold text-slate-900">Latest Featured Projects</h2>
          </div>
          <Link href="/projects" className="hidden md:inline-block bg-surface hover:bg-slate-100 text-slate-900 border border-slate-200 px-6 py-3 rounded-full font-bold transition-all shadow-sm">
            View All Projects
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {projects.map(p => (
            <div key={p.id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:border-primary/30 group">
              <div className="h-64 bg-slate-100 relative group-hover:bg-slate-200 transition-colors flex items-center justify-center text-5xl">
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" />
                ) : (
                  "🏗️"
                )}
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-slate-900 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
                  {p.status}
                </div>
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-extrabold mb-3 text-slate-900 group-hover:text-primary transition-colors line-clamp-1">{p.title}</h3>
                <p className="text-slate-600 leading-relaxed line-clamp-3">
                  {p.description}
                </p>
                <Link href="/projects" className="inline-block mt-6 text-primary font-bold border-b-2 border-primary/0 hover:border-primary transition-all">
                  View Details
                </Link>
              </div>
            </div>
          ))}
          {projects.length === 0 && (
            <div className="col-span-full text-center text-slate-500 py-16 bg-surface rounded-3xl border border-dashed border-slate-300">
              <div className="text-4xl mb-4">📭</div>
              No projects showcased yet. Check back soon!
            </div>
          )}
        </div>
        <div className="mt-8 text-center md:hidden">
          <Link href="/projects" className="inline-block bg-surface hover:bg-slate-100 text-slate-900 border border-slate-200 px-8 py-3 rounded-full font-bold transition-all shadow-sm">
            View All Projects
          </Link>
        </div>
      </section>
    </div>
  );
}
