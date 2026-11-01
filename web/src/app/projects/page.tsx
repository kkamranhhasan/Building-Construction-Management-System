'use client';

import { useEffect, useState } from 'react';
import PublicHeader from '../../components/PublicHeader';
import PublicFooter from '../../components/PublicFooter';

export default function ProjectsPage() {
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
        if (projRes.ok) setProjects(await projRes.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center text-zinc-400 font-semibold text-sm">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p>Loading Projects Portfolio...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans">
      <PublicHeader companyName={info.name} />

      <main className="flex-1 flex flex-col items-center px-6 py-20 lg:py-28 bg-card border-b border-border animate-fade-in-up">
        <div className="w-full max-w-7xl text-center">
          <span className="text-amber-400 font-black tracking-widest uppercase text-xs mb-3 block">Engineering Portfolio</span>
          <h1 className="text-4xl lg:text-6xl font-black text-foreground mb-4">Featured Construction Projects</h1>
          <div className="h-1.5 w-20 bg-amber-500 mx-auto rounded-full mb-6"></div>
          <p className="text-base text-zinc-400 leading-relaxed max-w-2xl mx-auto mb-16">
            Explore our comprehensive portfolio of ongoing and delivered architectural builds across commercial and residential sectors.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
            {projects.map(p => (
              <div key={p.id} className="bg-background border border-border rounded-3xl overflow-hidden card-lift group relative flex flex-col justify-between hover:border-primary/40">
                
                {/* Image Showcase */}
                <div className="h-60 bg-muted relative group-hover:bg-muted/80 transition-colors flex items-center justify-center text-6xl overflow-hidden">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    "🏗️"
                  )}
                  <div className={`absolute top-4 right-4 backdrop-blur-md px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-md border ${
                    p.status === 'COMPLETED' ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black' : 'bg-primary text-foreground border-primary/40 font-black'
                  }`}>
                    {p.status}
                  </div>
                </div>

                <div className="p-8">
                  <h3 className="text-xl font-black mb-2 text-foreground group-hover:text-primary transition-colors line-clamp-1">{p.title}</h3>
                  <p className="text-muted-foreground leading-relaxed line-clamp-3 text-xs mb-6">
                    {p.description}
                  </p>
                  <div className="text-primary font-bold text-xs flex items-center gap-1.5">
                    <span>Active Field Infrastructure</span>
                  </div>
                </div>
              </div>
            ))}
            {projects.length === 0 && (
              <div className="col-span-full text-center py-20 bg-background border border-dashed border-border rounded-3xl">
                <div className="text-5xl mb-3 animate-float">🏗️</div>
                <h3 className="text-xl font-bold text-foreground mb-1">No Projects Found</h3>
                <p className="text-muted-foreground text-xs">We are currently updating our portfolio. Check back soon!</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <PublicFooter companyName={info.name} />
    </div>
  );
}

