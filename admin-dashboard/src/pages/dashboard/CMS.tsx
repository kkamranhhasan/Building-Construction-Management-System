import { useEffect, useState } from 'react';
import { API } from '../../config/api';
import { 
  Globe, 
  Building2, 
  Mail, 
  Save, 
  CheckCircle2, 
  Calendar
} from 'lucide-react';

export default function CMSDashboard() {
  const [activeTab, setActiveTab] = useState('info'); // info, projects, messages
  const [info, setInfo] = useState<any>({});
  const [projects, setProjects] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchCMSData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [infoRes, projectsRes, contactRes] = await Promise.all([
        fetch(API.cmsInfo),
        fetch(API.cmsProjects),
        fetch(API.cmsContact, { headers })
      ]);

      if (infoRes.ok) setInfo(await infoRes.json());
      if (projectsRes.ok) setProjects(await projectsRes.json());
      if (contactRes.ok) setMessages(await contactRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCMSData();
  }, []);

  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(API.cmsInfo, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(info)
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 bg-card border border-border rounded-3xl">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground text-xs font-semibold">Loading Content Management...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-card p-8 rounded-3xl border border-border shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest mb-1">
            <Globe className="w-4 h-4" />
            <span>Public Website CMS</span>
          </div>
          <h1 className="text-3xl font-black text-foreground">Content Management System</h1>
          <p className="text-muted-foreground text-xs mt-1">Control public website headlines, featured construction projects, and view client inquiry messages.</p>
        </div>
        {saveSuccess && (
          <div className="bg-emerald-500 text-slate-950 px-4 py-2 rounded-2xl text-xs font-black flex items-center gap-1.5 animate-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Saved Successfully!</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-card p-2 rounded-2xl border border-border w-fit">
        <button 
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'info' 
              ? 'bg-primary text-foreground shadow-lg shadow-primary/25' 
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`} 
          onClick={() => setActiveTab('info')}
        >
          <Globe className="w-4 h-4" />
          <span>Company Profile & Hero</span>
        </button>
        <button 
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'projects' 
              ? 'bg-primary text-foreground shadow-lg shadow-primary/25' 
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`} 
          onClick={() => setActiveTab('projects')}
        >
          <Building2 className="w-4 h-4" />
          <span>Projects Portfolio ({projects.length})</span>
        </button>
        <button 
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'messages' 
              ? 'bg-primary text-foreground shadow-lg shadow-primary/25' 
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`} 
          onClick={() => setActiveTab('messages')}
        >
          <Mail className="w-4 h-4" />
          <span>Client Inquiries ({messages.length})</span>
        </button>
      </div>

      {/* Company Info Tab */}
      {activeTab === 'info' && (
        <form onSubmit={handleInfoSubmit} className="bg-card border border-border p-8 rounded-3xl flex flex-col gap-6 shadow-xl animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Company Brand Name</label>
              <input type="text" className="bg-muted border border-border text-foreground px-4 py-3 rounded-2xl text-sm outline-none focus:border-primary transition-colors" value={info.name || ''} onChange={e => setInfo({...info, name: e.target.value})} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Contact Phone</label>
              <input type="text" className="bg-muted border border-border text-foreground px-4 py-3 rounded-2xl text-sm outline-none focus:border-primary transition-colors" value={info.phone || ''} onChange={e => setInfo({...info, phone: e.target.value})} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Hero Headline (Landing Page)</label>
              <input type="text" className="bg-muted border border-border text-foreground px-4 py-3 rounded-2xl text-sm outline-none focus:border-primary transition-colors" value={info.heroTitle || ''} onChange={e => setInfo({...info, heroTitle: e.target.value})} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Hero Subtitle</label>
              <input type="text" className="bg-muted border border-border text-foreground px-4 py-3 rounded-2xl text-sm outline-none focus:border-primary transition-colors" value={info.heroSub || ''} onChange={e => setInfo({...info, heroSub: e.target.value})} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">About Company Overview</label>
            <textarea className="bg-muted border border-border text-foreground px-4 py-3 rounded-2xl text-sm outline-none focus:border-primary transition-colors min-h-[100px]" value={info.aboutText || ''} onChange={e => setInfo({...info, aboutText: e.target.value})} />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Mission Statement</label>
            <textarea className="bg-muted border border-border text-foreground px-4 py-3 rounded-2xl text-sm outline-none focus:border-primary transition-colors min-h-[80px]" value={info.mission || ''} onChange={e => setInfo({...info, mission: e.target.value})} />
          </div>

          <button type="submit" className="bg-primary hover:bg-primary/90 text-foreground py-3 rounded-2xl font-bold transition-all shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] self-end px-8 flex items-center gap-2 text-sm">
            <Save className="w-4 h-4" />
            <span>Save Public Settings</span>
          </button>
        </form>
      )}

      {/* Projects Portfolio Tab */}
      {activeTab === 'projects' && (
        <div className="bg-card border border-border p-8 rounded-3xl shadow-xl animate-in fade-in duration-300">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-black text-foreground">Public Projects Showcase</h2>
              <p className="text-muted-foreground text-xs mt-0.5">Projects displayed to potential clients on the public website.</p>
            </div>
          </div>
          {projects.length === 0 ? (
            <div className="text-muted-foreground text-center py-16 bg-muted/40 rounded-2xl border border-dashed border-border">
              <Building2 className="w-12 h-12 mx-auto opacity-20 mb-2" />
              <p className="text-xs font-semibold">No featured projects in the public showcase yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.map(p => (
                <div key={p.id} className="bg-muted/80 p-6 rounded-2xl border border-border flex flex-col justify-between hover:border-primary/30 transition-all">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-black text-foreground text-lg">{p.title}</h3>
                      <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full uppercase">
                        {p.status}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-xs line-clamp-3 leading-relaxed">{p.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Contact Messages Tab */}
      {activeTab === 'messages' && (
        <div className="bg-card border border-border rounded-3xl shadow-xl overflow-hidden animate-in fade-in duration-300">
          <div className="p-6 border-b border-border bg-muted/40 flex items-center justify-between">
            <h2 className="text-base font-black text-foreground flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" />
              <span>Received Client Inquiries</span>
            </h2>
            <span className="text-xs font-black text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
              {messages.length} Messages
            </span>
          </div>
          {messages.length === 0 ? (
            <div className="text-muted-foreground text-center py-16">
              <Mail className="w-12 h-12 mx-auto opacity-20 mb-2" />
              <p className="text-xs font-semibold">No contact inquiries received from the public website yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {messages.map(m => (
                <div key={m.id} className="p-6 hover:bg-secondary/30 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-sm font-black text-foreground">{m.name}</h3>
                      <p className="text-xs text-primary font-medium">{m.email}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-semibold">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(m.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    </span>
                  </div>
                  <div className="mt-3 p-4 rounded-2xl bg-muted/80 border border-border text-xs text-foreground/70 leading-relaxed">
                    {m.message}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

