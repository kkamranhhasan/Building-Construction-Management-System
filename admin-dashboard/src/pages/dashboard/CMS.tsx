'use client';

import { useEffect, useState } from 'react';
import { API } from '../../config/api';

export default function CMSDashboard() {
  const [activeTab, setActiveTab] = useState('info'); // info, projects, messages
  const [info, setInfo] = useState<any>({});
  const [projects, setProjects] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
        alert('Company Info updated successfully!');
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="text-slate-400">Loading CMS...</div>;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      <div className="bg-surface p-8 rounded-3xl border border-border shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Content Management System</h1>
          <p className="text-slate-400">Control the public-facing website content directly from here.</p>
        </div>
      </div>

      <div className="flex gap-4 border-b border-border mb-4">
        <button className={`pb-3 font-semibold text-lg transition-colors ${activeTab === 'info' ? 'text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-white'}`} onClick={() => setActiveTab('info')}>Company Info</button>
        <button className={`pb-3 font-semibold text-lg transition-colors ${activeTab === 'projects' ? 'text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-white'}`} onClick={() => setActiveTab('projects')}>Projects Portfolio</button>
        <button className={`pb-3 font-semibold text-lg transition-colors ${activeTab === 'messages' ? 'text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-white'}`} onClick={() => setActiveTab('messages')}>Contact Messages</button>
      </div>

      {activeTab === 'info' && (
        <form onSubmit={handleInfoSubmit} className="bg-surface border border-border p-8 rounded-3xl flex flex-col gap-6 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-300">Company Name</label>
              <input type="text" className="bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary/50" value={info.name || ''} onChange={e => setInfo({...info, name: e.target.value})} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-300">Phone</label>
              <input type="text" className="bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary/50" value={info.phone || ''} onChange={e => setInfo({...info, phone: e.target.value})} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-300">Hero Title (Home Page)</label>
              <input type="text" className="bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary/50" value={info.heroTitle || ''} onChange={e => setInfo({...info, heroTitle: e.target.value})} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-300">Hero Subtitle</label>
              <input type="text" className="bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary/50" value={info.heroSub || ''} onChange={e => setInfo({...info, heroSub: e.target.value})} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-300">About Text</label>
            <textarea className="bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary/50 min-h-[100px]" value={info.aboutText || ''} onChange={e => setInfo({...info, aboutText: e.target.value})} />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-300">Mission Statement</label>
            <textarea className="bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary/50 min-h-[80px]" value={info.mission || ''} onChange={e => setInfo({...info, mission: e.target.value})} />
          </div>

          <button type="submit" className="bg-primary hover:bg-primary-hover text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] self-end px-8">Save Changes</button>
        </form>
      )}

      {activeTab === 'projects' && (
        <div className="bg-surface border border-border p-8 rounded-3xl shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Manage Projects</h2>
            <button className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg font-semibold text-sm transition-all shadow-lg">+ Add Project</button>
          </div>
          {projects.length === 0 ? (
            <div className="text-slate-400 text-center py-8">No projects created yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map(p => (
                <div key={p.id} className="bg-slate-900 p-4 rounded-xl border border-slate-700 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-white text-lg">{p.title}</h3>
                    <p className="text-slate-400 text-sm mt-1 line-clamp-2">{p.description}</p>
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">{p.status}</span>
                    <button className="text-red-400 hover:text-red-300 text-sm font-semibold">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'messages' && (
        <div className="bg-surface border border-border rounded-3xl shadow-xl overflow-hidden">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-bold text-white">Contact Inbox</h2>
          </div>
          {messages.length === 0 ? (
            <div className="text-slate-400 text-center py-12">No messages received.</div>
          ) : (
            <div className="divide-y divide-border">
              {messages.map(m => (
                <div key={m.id} className={`p-6 hover:bg-slate-800/50 transition-colors ${!m.isRead ? 'bg-slate-800/30' : ''}`}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className={`text-lg text-white ${!m.isRead ? 'font-bold' : 'font-medium'}`}>{m.name} <span className="text-sm font-normal text-slate-400 ml-2">({m.email})</span></h3>
                    <span className="text-xs text-slate-500">{new Date(m.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">{m.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
