import { useEffect, useState } from 'react';
import { API } from '../../config/api';

interface Worker {
  id: string;
  name: string;
  username: string;
  hourlyRate: number | null;
  isApproved: boolean;
  createdAt: string;
}

interface SiteWithWorkers {
  id: string;
  name: string;
  location: string;
  workers: Worker[];
}

export default function MySiteWorkers() {
  const [siteGroups, setSiteGroups] = useState<SiteWithWorkers[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSite, setSelectedSite] = useState<string>('all');
  const [expandedWorker, setExpandedWorker] = useState<string | null>(null);

  const fetchWorkers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API.myWorkers, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSiteGroups(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  // Flatten workers filtered by site and search
  const filteredGroups = siteGroups
    .filter(sg => selectedSite === 'all' || sg.id === selectedSite)
    .map(sg => ({
      ...sg,
      workers: sg.workers.filter(
        w =>
          w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          w.username.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    }))
    .filter(sg => sg.workers.length > 0);

  const totalWorkers = siteGroups.reduce((acc, sg) => acc + sg.workers.length, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400 flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span>Loading your workers...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="bg-surface border border-border p-6 rounded-2xl shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">👷 My Workers</h1>
            <p className="text-slate-400 text-sm">
              Workers assigned to your sites —{' '}
              <span className="text-primary font-bold">{totalWorkers} total</span> across{' '}
              <span className="text-primary font-bold">{siteGroups.length}</span> site(s)
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Site Filter */}
            <select
              className="bg-slate-900 border border-slate-700 text-white px-4 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all"
              value={selectedSite}
              onChange={e => setSelectedSite(e.target.value)}
            >
              <option value="all">All Sites</option>
              {siteGroups.map(sg => (
                <option key={sg.id} value={sg.id}>
                  {sg.name} ({sg.workers.length})
                </option>
              ))}
            </select>
            {/* Search */}
            <input
              type="text"
              placeholder="Search workers..."
              className="bg-slate-900 border border-slate-700 text-white px-4 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all w-full sm:w-56"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Total Sites</p>
          <p className="text-3xl font-black text-white">{siteGroups.length}</p>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Total Workers</p>
          <p className="text-3xl font-black text-primary">{totalWorkers}</p>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Approved</p>
          <p className="text-3xl font-black text-emerald-400">
            {siteGroups.reduce((acc, sg) => acc + sg.workers.filter(w => w.isApproved).length, 0)}
          </p>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Pending</p>
          <p className="text-3xl font-black text-amber-400">
            {siteGroups.reduce((acc, sg) => acc + sg.workers.filter(w => !w.isApproved).length, 0)}
          </p>
        </div>
      </div>

      {/* Worker Groups */}
      {filteredGroups.length === 0 ? (
        <div className="bg-surface border border-dashed border-slate-700 rounded-2xl p-12 text-center">
          <div className="text-4xl mb-4">👷</div>
          <h3 className="text-xl font-bold text-white mb-2">No workers found</h3>
          <p className="text-slate-400">
            {totalWorkers === 0
              ? 'No workers have been assigned to your sites yet. Ask your manager to assign workers.'
              : 'No workers match your search. Try a different name or filter.'}
          </p>
        </div>
      ) : (
        filteredGroups.map(sg => (
          <div key={sg.id} className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
            {/* Site Header */}
            <div className="bg-slate-800/60 border-b border-border px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary/20 rounded-xl flex items-center justify-center text-primary font-bold text-sm">
                  🏗️
                </div>
                <div>
                  <h2 className="text-white font-bold">{sg.name}</h2>
                  <p className="text-slate-400 text-xs">📍 {sg.location}</p>
                </div>
              </div>
              <span className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-xs font-bold">
                {sg.workers.length} Worker{sg.workers.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Workers Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Worker</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Username</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Hourly Rate</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {sg.workers.map(worker => (
                    <>
                      <tr
                        key={worker.id}
                        className="hover:bg-slate-800/30 transition-colors cursor-pointer"
                        onClick={() => setExpandedWorker(expandedWorker === worker.id ? null : worker.id)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                              {worker.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-semibold text-white">{worker.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-400 text-sm">@{worker.username}</td>
                        <td className="px-6 py-4">
                          {worker.hourlyRate != null ? (
                            <span className="text-emerald-400 font-bold">${worker.hourlyRate.toFixed(2)}/hr</span>
                          ) : (
                            <span className="text-slate-500 text-sm">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              worker.isApproved
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            {worker.isApproved ? '✅ Approved' : '⏳ Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400 text-sm">
                          {new Date(worker.createdAt).toLocaleDateString('en-US', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-primary hover:text-indigo-400 text-xs font-bold transition-colors">
                            {expandedWorker === worker.id ? '▲ Hide' : '▼ View'}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Worker Details Row */}
                      {expandedWorker === worker.id && (
                        <tr key={`${worker.id}-expanded`} className="bg-slate-900/60">
                          <td colSpan={6} className="px-6 py-5">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Full Name</p>
                                <p className="text-white font-semibold">{worker.name}</p>
                              </div>
                              <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Username</p>
                                <p className="text-white font-semibold">@{worker.username}</p>
                              </div>
                              <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Hourly Rate</p>
                                <p className="text-emerald-400 font-bold text-lg">
                                  {worker.hourlyRate != null ? `$${worker.hourlyRate.toFixed(2)}/hr` : 'Not set'}
                                </p>
                              </div>
                              <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Approval Status</p>
                                <p className={`font-bold ${worker.isApproved ? 'text-emerald-400' : 'text-amber-400'}`}>
                                  {worker.isApproved ? '✅ Approved' : '⏳ Pending Approval'}
                                </p>
                              </div>
                              <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Site</p>
                                <p className="text-white font-semibold">{sg.name}</p>
                              </div>
                              <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Joined On</p>
                                <p className="text-white font-semibold">
                                  {new Date(worker.createdAt).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                  })}
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
