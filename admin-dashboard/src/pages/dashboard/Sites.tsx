import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { API } from '../../config/api';

interface Site {
  id: string;
  name: string;
  description?: string;
  location: string;
  managers: { id: string; name: string; username: string }[];
  workers: { id: string; name: string; username: string }[];
  isAssigned?: boolean;
}

type User = {
  id: string;
  name: string;
  username: string;
  role: string;
};

export default function SiteManagement() {
  const [sites, setSites] = useState<Site[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<Site | null>(null);
  const [showAssignModal, setShowAssignModal] = useState<string | null>(null);
  const [viewDetailsSite, setViewDetailsSite] = useState<Site | null>(null);

  // Forms state
  const [createData, setCreateData] = useState({ name: '', location: '', description: '' });
  const [editData, setEditData] = useState({ name: '', location: '', description: '' });
  const [assignData, setAssignData] = useState({ userId: '', type: 'MANAGER' });

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      if (userData) setUserRole(JSON.parse(userData).role);

      const headers = { Authorization: `Bearer ${token}` };

      const [sitesRes, usersRes] = await Promise.all([
        fetch(API.sites, { headers }),
        fetch(API.users, { headers }),
      ]);

      if (sitesRes.ok) setSites(await sitesRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API.sites, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(createData),
      });
      if (res.ok) {
        setShowCreateModal(false);
        setCreateData({ name: '', location: '', description: '' });
        fetchData();
      }
    } catch (e) { console.error(e); }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditModal) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API.site(showEditModal.id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(editData),
      });
      if (res.ok) {
        setShowEditModal(null);
        fetchData();
      }
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (siteId: string) => {
    if (!confirm('Are you sure you want to delete this site? All attendance records will be affected.')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API.site(siteId), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json().catch(() => null);
        alert(data?.error || data?.details || 'Failed to delete site');
      }
    } catch (e) { console.error(e); }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAssignModal || !assignData.userId) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API.assignSite(showAssignModal), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(assignData),
      });
      if (res.ok) {
        setShowAssignModal(null);
        setAssignData({ userId: '', type: 'MANAGER' });
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to assign user');
      }
    } catch (e) { console.error(e); }
  };

  const availableUsers = users.filter(
    u => u.role === (assignData.type === 'MANAGER' ? 'SITE_MANAGER' : 'WORKER')
  );

  const isSiteManager = userRole === 'SITE_MANAGER';
  const isAdmin = userRole === 'OWNER' || userRole === 'MANAGER';

  const mySites = isSiteManager ? sites.filter(s => s.isAssigned) : sites;
  const otherSites = isSiteManager ? sites.filter(s => !s.isAssigned) : [];

  const SiteCard = ({ site, readOnly = false }: { site: Site; readOnly?: boolean }) => (
    <div className={`bg-surface border p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 relative group flex flex-col h-full ${readOnly ? 'border-slate-700/50 opacity-75' : 'border-border'}`}>
      
      {/* Header Info */}
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-xl font-bold text-white pr-2">{site.name}</h3>
        {readOnly && <span className="bg-slate-700 text-slate-400 px-2 py-0.5 rounded text-[10px] font-bold">👁️ VIEW ONLY</span>}
        {!readOnly && isSiteManager && <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold">✅ MY SITE</span>}
      </div>

      <p className="text-slate-400 text-sm mb-4 line-clamp-2">{site.description || 'No description provided.'}</p>
      
      <div className="flex items-center gap-2 text-slate-300 text-sm mb-4">
        <span>📍</span> {site.location}
      </div>

      {/* Staff Badges */}
      <div className="mb-6 flex flex-wrap gap-2">
        {site.managers?.length > 0 ? (
          site.managers.map(m => (
            <span key={m.id} className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
              👔 {m.name}
            </span>
          ))
        ) : (
          <span className="text-slate-500 text-xs italic">No Manager Assigned</span>
        )}
        <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-1 rounded text-xs font-bold">
          👷 {site.workers?.length || 0} Workers
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between border-t border-border pt-4 mt-auto">
        <div className="flex gap-3">
          {isAdmin && (
            <>
              <button 
                onClick={() => { setShowEditModal(site); setEditData({ name: site.name, location: site.location, description: site.description || '' }); }}
                className="text-slate-400 hover:text-white transition-colors p-1"
                title="Edit Site"
              >
                ✏️
              </button>
              <button 
                onClick={() => handleDelete(site.id)}
                className="text-slate-400 hover:text-rose-400 transition-colors p-1"
                title="Delete Site"
              >
                🗑️
              </button>
            </>
          )}
        </div>

        {readOnly ? (
          <button className="text-slate-500 hover:text-slate-300 text-sm font-bold" onClick={() => setViewDetailsSite(site)}>
            View Details →
          </button>
        ) : isSiteManager ? (
          <Link to="/dashboard/attendance" className="text-primary hover:text-indigo-400 text-sm font-bold">
            Take Attendance →
          </Link>
        ) : (
          <button className="text-primary hover:text-indigo-400 text-sm font-bold" onClick={() => setShowAssignModal(site.id)}>
            Assign Staff →
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      {loading && (
        <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm text-slate-400 font-semibold">
          Loading sites...
        </div>
      )}
      {/* Header */}
      <div className="flex justify-between items-center bg-surface p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Construction Sites</h1>
          <p className="text-slate-400 text-sm">
            {isSiteManager ? `You manage ${mySites.length} site(s).` : 'Manage active projects and assign staff.'}
          </p>
        </div>
        {isAdmin && (
          <button
            className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-primary/25"
            onClick={() => setShowCreateModal(true)}
          >
            + New Site
          </button>
        )}
      </div>

      {/* Grid Rendering */}
      {isSiteManager ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {mySites.map(s => <SiteCard key={s.id} site={s} />)}
          </div>
          {otherSites.length > 0 && (
            <div className="mt-8">
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Other Sites</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {otherSites.map(s => <SiteCard key={s.id} site={s} readOnly />)}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {sites.map(s => <SiteCard key={s.id} site={s} />)}
        </div>
      )}

      {/* MODALS */}
      {/* DETAILS MODAL */}
      {viewDetailsSite && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-2xl p-8 w-full max-w-xl shadow-2xl">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">{viewDetailsSite.name}</h2>
                <p className="text-slate-400 mt-1">📍 {viewDetailsSite.location}</p>
              </div>
              <button
                type="button"
                className="text-slate-400 hover:text-white transition-colors font-bold"
                onClick={() => setViewDetailsSite(null)}
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 mb-4">
              <div className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Description</div>
              <div className="text-slate-200">{viewDetailsSite.description || 'No description provided.'}</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
                <div className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-3">Managers</div>
                <div className="flex flex-col gap-2">
                  {(viewDetailsSite.managers || []).length > 0 ? (
                    viewDetailsSite.managers.map(m => (
                      <div key={m.id} className="text-slate-200 font-semibold">👔 {m.name} <span className="text-slate-500 font-medium">@{m.username}</span></div>
                    ))
                  ) : (
                    <div className="text-slate-500 italic">No manager assigned.</div>
                  )}
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
                <div className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-3">Workers</div>
                <div className="flex flex-col gap-2 max-h-56 overflow-auto pr-2">
                  {(viewDetailsSite.workers || []).length > 0 ? (
                    viewDetailsSite.workers.map(w => (
                      <div key={w.id} className="text-slate-200 font-semibold">👷 {w.name} <span className="text-slate-500 font-medium">@{w.username}</span></div>
                    ))
                  ) : (
                    <div className="text-slate-500 italic">No workers assigned.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6">Create New Site</h2>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <input className="bg-slate-900 border border-slate-700 text-white px-4 py-2.5 rounded-xl outline-none" type="text" placeholder="Site Name" value={createData.name} onChange={e => setCreateData({...createData, name: e.target.value})} required />
              <input className="bg-slate-900 border border-slate-700 text-white px-4 py-2.5 rounded-xl outline-none" type="text" placeholder="Location" value={createData.location} onChange={e => setCreateData({...createData, location: e.target.value})} required />
              <textarea className="bg-slate-900 border border-slate-700 text-white px-4 py-2.5 rounded-xl outline-none min-h-[100px]" placeholder="Description" value={createData.description} onChange={e => setCreateData({...createData, description: e.target.value})} />
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" className="text-slate-400" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="bg-primary px-6 py-2 rounded-xl font-bold text-white">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6">Edit Site</h2>
            <form onSubmit={handleUpdate} className="flex flex-col gap-4">
              <input className="bg-slate-900 border border-slate-700 text-white px-4 py-2.5 rounded-xl" type="text" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} required />
              <input className="bg-slate-900 border border-slate-700 text-white px-4 py-2.5 rounded-xl" type="text" value={editData.location} onChange={e => setEditData({...editData, location: e.target.value})} required />
              <textarea className="bg-slate-900 border border-slate-700 text-white px-4 py-2.5 rounded-xl min-h-[100px]" value={editData.description} onChange={e => setEditData({...editData, description: e.target.value})} />
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" className="text-slate-400" onClick={() => setShowEditModal(null)}>Cancel</button>
                <button type="submit" className="bg-primary px-6 py-2 rounded-xl font-bold text-white">Update</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN MODAL */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6">Assign Staff</h2>
            <form onSubmit={handleAssign} className="flex flex-col gap-4">
              <select className="bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl" value={assignData.type} onChange={e => setAssignData({...assignData, type: e.target.value, userId: ''})}>
                <option value="MANAGER">Site Manager (Replaces current)</option>
                <option value="WORKER">Worker (Adds to list)</option>
              </select>
              <select className="bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl" value={assignData.userId} onChange={e => setAssignData({...assignData, userId: e.target.value})} required>
                <option value="">-- Select --</option>
                {availableUsers.map(u => <option key={u.id} value={u.id}>{u.name} (@{u.username})</option>)}
              </select>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" className="text-slate-400" onClick={() => setShowAssignModal(null)}>Cancel</button>
                <button type="submit" className="bg-primary px-6 py-2 rounded-xl font-bold text-white">Assign</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
