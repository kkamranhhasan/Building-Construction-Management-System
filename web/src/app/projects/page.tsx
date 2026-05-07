'use client';

import { useEffect, useState } from 'react';
import PublicHeader from '../../components/PublicHeader';

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

  if (loading) return <div className="min-h-screen bg-surface flex items-center justify-center text-slate-500 font-medium">Loading...</div>;

  return (
    <div className="min-h-screen flex flex-col bg-background text-slate-900 font-sans">
      <PublicHeader companyName={info.name} />

      <main className="flex-1 flex flex-col items-center px-6 py-24 bg-surface border-b border-slate-100 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="w-full max-w-7xl text-center">
          <span className="text-primary font-bold tracking-wider uppercase text-sm mb-4 block">Our Best Work</span>
          <h1 className="text-5xl lg:text-6xl font-extrabold text-slate-900 mb-6">Latest Projects</h1>
          <div className="h-1 w-24 bg-primary mx-auto rounded-full mb-8"></div>
          <p className="text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto mb-16">
            Explore our comprehensive portfolio of ongoing and completed construction projects. We build while you rest.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
            {projects.map(p => (
              <div key={p.id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:border-primary/50 group relative">
                
                {/* Image Placeholder */}
                <div className="h-64 bg-slate-100 relative group-hover:bg-slate-200 transition-colors flex items-center justify-center text-5xl">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" />
                  ) : (
                    "🏗️"
                  )}
                  <div className={`absolute top-4 right-4 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm border ${
                    p.status === 'COMPLETED' ? 'bg-emerald-500/90 text-white border-emerald-400' : 'bg-primary/90 text-white border-primary-hover'
                  }`}>
                    {p.status}
                  </div>
                </div>

                <div className="p-8">
                  <h3 className="text-2xl font-extrabold mb-3 text-slate-900 group-hover:text-primary transition-colors line-clamp-1">{p.title}</h3>
                  <p className="text-slate-600 leading-relaxed line-clamp-3 mb-6">
                    {p.description}
                  </p>
                  <button className="text-primary font-bold hover:text-primary-hover transition-colors flex items-center gap-2 group-hover:gap-3">
                    View Details <span>→</span>
                  </button>
                </div>
              </div>
            ))}
            {projects.length === 0 && (
              <div className="col-span-full text-center py-20 bg-white border border-dashed border-slate-300 rounded-3xl">
                <div className="text-5xl mb-4">📭</div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">No Projects Found</h3>
                <p className="text-slate-500">We are currently updating our portfolio. Check back soon!</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
