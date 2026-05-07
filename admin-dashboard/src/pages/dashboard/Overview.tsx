import { useEffect, useState } from 'react';
import { API } from '../../config/api';
import { Link } from 'react-router-dom';

export default function Overview() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    siteCount: 0,
    workerCount: 0,
    attendanceToday: 0,
    pendingSalary: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (userData) setUser(JSON.parse(userData));
    
    if (token) {
      const fetchData = async () => {
        try {
          const [sitesRes, usersRes, attRes] = await Promise.all([
            fetch(API.sites, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(API.users, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(API.attendance, { headers: { Authorization: `Bearer ${token}` } })
          ]);

          const sites = await sitesRes.json();
          const users = await usersRes.json();
          const attendances = await attRes.json();

          // Today's attendance count
          const today = new Date().toISOString().split('T')[0];
          const todayAtt = Array.isArray(attendances) 
            ? attendances.filter((a: any) => a.date.startsWith(today)).length 
            : 0;

          setStats({
            siteCount: Array.isArray(sites) ? sites.length : 0,
            workerCount: Array.isArray(users) ? users.filter((u: any) => u.role === 'WORKER').length : 0,
            attendanceToday: todayAtt,
            pendingSalary: 0 // Placeholder
          });
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, []);

  if (!user || loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-slate-400 animate-pulse font-medium italic">Loading dashboard statistics...</div>
    </div>
  );

  // Role: OWNER or MANAGER
  if (user.role === 'OWNER' || user.role === 'MANAGER') {
    return (
      <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-surface border border-border rounded-3xl p-8 shadow-xl relative overflow-hidden group">
            <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary text-2xl mb-4">🏗️</div>
            <h3 className="text-slate-400 font-bold mb-1">Active Sites</h3>
            <div className="text-4xl font-black text-white">{stats.siteCount}</div>
          </div>
          
          <div className="bg-surface border border-border rounded-3xl p-8 shadow-xl relative overflow-hidden group">
            <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 text-2xl mb-4">👷</div>
            <h3 className="text-slate-400 font-bold mb-1">Total Workers</h3>
            <div className="text-4xl font-black text-white">{stats.workerCount}</div>
          </div>
          
          <div className="bg-surface border border-border rounded-3xl p-8 shadow-xl relative overflow-hidden group">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 text-2xl mb-4">✅</div>
            <h3 className="text-slate-400 font-bold mb-1">Present Today</h3>
            <div className="text-4xl font-black text-emerald-400">{stats.attendanceToday}</div>
          </div>
          
          <div className="bg-surface border border-border rounded-3xl p-8 shadow-xl relative overflow-hidden group">
            <div className="w-12 h-12 bg-rose-500/20 rounded-2xl flex items-center justify-center text-rose-400 text-2xl mb-4">📊</div>
            <h3 className="text-slate-400 font-bold mb-1">System Health</h3>
            <div className="text-2xl font-black text-rose-400 uppercase">Operational</div>
          </div>
        </div>

        <div className="bg-surface border border-border p-8 rounded-3xl shadow-xl flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Quick Actions</h2>
            <p className="text-slate-400">Common management tasks for administrative roles.</p>
          </div>
          <div className="flex gap-4">
             <Link to="/dashboard/sites" className="bg-primary text-white px-6 py-3 rounded-xl font-bold transition-all hover:scale-105 active:scale-95">Manage Sites</Link>
             <Link to="/dashboard/workers" className="bg-slate-800 text-white border border-slate-700 px-6 py-3 rounded-xl font-bold transition-all hover:scale-105 active:scale-95">Manage Staff</Link>
          </div>
        </div>
      </div>
    );
  }

  // Role: SITE MANAGER
  if (user.role === 'SITE_MANAGER') {
    return (
      <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-surface border border-border p-8 rounded-3xl shadow-xl">
          <h2 className="text-2xl font-bold text-white mb-4">Site Manager Overview</h2>
          <p className="text-slate-400 mb-8">Manage your assigned construction sites and record field worker attendance.</p>
          <div className="flex flex-wrap gap-4">
            <Link to="/dashboard/attendance" className="bg-primary hover:bg-primary-hover text-white px-6 py-4 rounded-xl font-bold transition-all shadow-lg hover:scale-105 active:scale-95 flex items-center gap-3">
              <span className="text-2xl">📸</span> Capture Attendance
            </Link>
            <Link to="/dashboard/my-workers" className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 px-6 py-4 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-3">
              <span className="text-2xl">👷</span> My Workers
            </Link>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-surface border border-border p-8 rounded-3xl shadow-xl flex items-center justify-between">
             <div>
               <h3 className="text-slate-400 font-bold mb-1 uppercase text-xs tracking-widest">My Sites</h3>
               <div className="text-4xl font-black text-white">{stats.siteCount}</div>
             </div>
             <div className="text-4xl opacity-20">🏗️</div>
          </div>
          <div className="bg-surface border border-border p-8 rounded-3xl shadow-xl flex items-center justify-between">
             <div>
               <h3 className="text-slate-400 font-bold mb-1 uppercase text-xs tracking-widest">Recorded Today</h3>
               <div className="text-4xl font-black text-emerald-400">{stats.attendanceToday}</div>
             </div>
             <div className="text-4xl opacity-20">✅</div>
          </div>
        </div>
      </div>
    );
  }

  // Role: WORKER
  if (user.role === 'WORKER') {
    return (
      <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-surface border border-border p-8 rounded-3xl shadow-xl">
          <h2 className="text-2xl font-bold text-white mb-4">Worker Portal</h2>
          <p className="text-slate-400 mb-8">View your logged hours, attendance history, and generated payslips.</p>
          <Link to="/dashboard/salary" className="bg-primary hover:bg-primary-hover text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg hover:scale-105 active:scale-95 inline-flex items-center gap-3">
            <span className="text-2xl">🧾</span> My Salary Reports
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-surface border border-border p-8 rounded-3xl shadow-xl">
             <h3 className="text-slate-400 font-bold mb-2 uppercase text-xs tracking-widest">Payday Status</h3>
             <div className="text-4xl font-black text-emerald-400">Monthly</div>
          </div>
          <div className="bg-surface border border-border p-8 rounded-3xl shadow-xl">
             <h3 className="text-slate-400 font-bold mb-2 uppercase text-xs tracking-widest">Profile Status</h3>
             <div className="text-4xl font-black text-primary">Active</div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
