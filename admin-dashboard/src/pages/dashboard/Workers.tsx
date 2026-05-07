'use client';

import { useEffect, useState } from 'react';
import { API } from '../../config/api';

export default function WorkerManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create Modal state
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', username: '', password: '', role: 'WORKER', hourlyRate: '' });

  // Edit Modal state
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editData, setEditData] = useState({ name: '', username: '', role: '', hourlyRate: '' });

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API.users, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API.approveUser(id), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchUsers();
    } catch (e) { console.error(e); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API.users, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowModal(false);
        setFormData({ name: '', username: '', password: '', role: 'WORKER', hourlyRate: '' });
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create user');
      }
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user? All related attendance and salary records will be cleared.')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API.user(id), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchUsers();
      else {
        const data = await res.json();
        alert(data.error || 'Failed to delete user');
      }
    } catch (e) { console.error(e); }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API.user(editingUser.id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(editData)
      });
      if (res.ok) {
        setEditingUser(null);
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update user');
      }
    } catch (e) { console.error(e); }
  };

  if (loading) return <div className="text-slate-400 p-8 font-medium italic">Syncing staff data...</div>;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-surface p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Staff & Worker Management</h1>
          <p className="text-slate-400 text-sm">Manage roles, approvals, and onboarding.</p>
        </div>
        <button 
          className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-primary/25"
          onClick={() => setShowModal(true)}
        >
          + Add New Staff
        </button>
      </div>

      <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/50 border-b border-border">
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Name</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Username</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Role</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-white">{u.name}</div>
                    {u.role === 'WORKER' && <div className="text-[10px] text-primary font-bold mt-0.5">RATE: ${u.hourlyRate}/HR</div>}
                  </td>
                  <td className="p-4 text-slate-400 text-sm">{u.username}</td>
                  <td className="p-4">
                    <span className="bg-slate-700 text-slate-300 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                      u.isApproved 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {u.isApproved ? 'Approved' : 'Pending'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-3 items-center">
                      {!u.isApproved && (
                        <button className="bg-emerald-500 text-emerald-950 px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all hover:scale-105" onClick={() => handleApprove(u.id)}>Approve</button>
                      )}

                      <button className="text-slate-500 hover:text-white transition-colors" onClick={() => { setEditingUser(u); setEditData({ name: u.name, username: u.username, role: u.role, hourlyRate: u.hourlyRate || '' }); }}>✏️</button>
                      <button className="text-slate-500 hover:text-rose-400 transition-colors" onClick={() => handleDelete(u.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALS */}

      {/* CREATE MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6">Create New Staff</h2>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <input className="bg-slate-900 border border-slate-700 text-white px-4 py-2.5 rounded-xl outline-none focus:border-primary" type="text" placeholder="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              <input className="bg-slate-900 border border-slate-700 text-white px-4 py-2.5 rounded-xl outline-none focus:border-primary" type="text" placeholder="Username" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} required />
              <input className="bg-slate-900 border border-slate-700 text-white px-4 py-2.5 rounded-xl outline-none focus:border-primary" type="password" placeholder="Password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
              <select className="bg-slate-900 border border-slate-700 text-white px-4 py-2.5 rounded-xl outline-none focus:border-primary" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                <option value="WORKER">Worker</option>
                <option value="SITE_MANAGER">Site Manager</option>
                <option value="MANAGER">General Manager</option>
              </select>
              {formData.role === 'WORKER' && (
                <input className="bg-slate-900 border border-slate-700 text-white px-4 py-2.5 rounded-xl outline-none focus:border-primary" type="number" step="0.01" placeholder="Hourly Rate ($)" value={formData.hourlyRate} onChange={e => setFormData({...formData, hourlyRate: e.target.value})} required />
              )}
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" className="text-slate-400 font-bold" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="bg-primary px-6 py-2 rounded-xl font-bold text-white">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6">Edit User</h2>
            <form onSubmit={handleUpdate} className="flex flex-col gap-4">
              <input className="bg-slate-900 border border-slate-700 text-white px-4 py-2.5 rounded-xl outline-none focus:border-primary" type="text" placeholder="Full Name" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} required />
              <input className="bg-slate-900 border border-slate-700 text-white px-4 py-2.5 rounded-xl outline-none focus:border-primary" type="text" placeholder="Username" value={editData.username} onChange={e => setEditData({...editData, username: e.target.value})} required />
              <select className="bg-slate-900 border border-slate-700 text-white px-4 py-2.5 rounded-xl outline-none focus:border-primary" value={editData.role} onChange={e => setEditData({...editData, role: e.target.value})}>
                <option value="WORKER">Worker</option>
                <option value="SITE_MANAGER">Site Manager</option>
                <option value="MANAGER">General Manager</option>
                <option value="OWNER">Owner</option>
              </select>
              {editData.role === 'WORKER' && (
                <input className="bg-slate-900 border border-slate-700 text-white px-4 py-2.5 rounded-xl outline-none focus:border-primary" type="number" step="0.01" placeholder="Hourly Rate ($)" value={editData.hourlyRate} onChange={e => setEditData({...editData, hourlyRate: e.target.value})} required />
              )}
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" className="text-slate-400 font-bold" onClick={() => setEditingUser(null)}>Cancel</button>
                <button type="submit" className="bg-primary px-6 py-2 rounded-xl font-bold text-white">Update</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
