import { useEffect, useState } from 'react';
import { API } from '../../config/api';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  CheckCircle2, 
  Activity, 
  ArrowUpRight, 
  Camera, 
  HardHat, 
  FileText,
  Sparkles
} from 'lucide-react';

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
          const currentUser = localStorage.getItem('user');
          const role = currentUser ? JSON.parse(currentUser).role : '';
          const headers = { Authorization: `Bearer ${token}` };

          // WORKER only needs basic attendance data (no site/user list permissions)
          if (role === 'WORKER') {
            setLoading(false);
            return;
          }

          // Fetch sites and attendance for all authorized roles
          const requests: Promise<Response>[] = [
            fetch(API.sites, { headers }),
            fetch(API.attendance, { headers }),
          ];

          // Only OWNER and MANAGER can fetch the full user list
          if (role === 'OWNER' || role === 'MANAGER') {
            requests.push(fetch(API.users, { headers }));
          }

          const results = await Promise.all(requests);
          const [sitesRes, attRes, usersRes] = results;

          const sites = sitesRes?.ok ? await sitesRes.json() : [];
          const attendances = attRes?.ok ? await attRes.json() : [];
          const users = usersRes?.ok ? await usersRes.json() : [];

          const today = new Date().toISOString().split('T')[0];
          const todayAtt = Array.isArray(attendances) 
            ? attendances.filter((a: any) => a.date?.startsWith(today)).length 
            : 0;

          // For SITE_MANAGER count only their assigned sites
          const siteList = Array.isArray(sites) ? sites : [];
          const mySiteCount = role === 'SITE_MANAGER'
            ? siteList.filter((s: any) => s.isAssigned).length
            : siteList.length;

          setStats({
            siteCount: mySiteCount,
            workerCount: Array.isArray(users) ? users.filter((u: any) => u.role === 'WORKER').length : 0,
            attendanceToday: todayAtt,
            pendingSalary: 0
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

  if (!user || loading) {
    return (
      <div className="flex flex-col items-center justify-center h-72 gap-3">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <div className="text-muted-foreground font-semibold text-sm">Aggregating live project analytics...</div>
      </div>
    );
  }

  const kpiCard = (label: string, value: string | number, icon: any, colorClass: string, badge: any, delayClass: string = '') => (
    <div className={`bg-card border border-border rounded-2xl p-6 shadow-sm card-hover-effect animate-fade-in-up ${delayClass}`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl ${colorClass} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
          {icon}
        </div>
        {badge}
      </div>
      <h3 className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-1">{label}</h3>
      <div className="text-4xl font-black text-foreground tracking-tight">{value}</div>
    </div>
  );

  // Role: OWNER or MANAGER
  if (user.role === 'OWNER' || user.role === 'MANAGER') {
    return (
      <div className="flex flex-col gap-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpiCard('Active Sites', stats.siteCount,
            <Building2 className="w-6 h-6 text-primary" />,
            'bg-primary/10',
            <span className="text-xs font-black text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full">Active</span>,
            'stagger-1'
          )}
          {kpiCard('Total Workers', stats.workerCount,
            <Users className="w-6 h-6 text-indigo-400" />,
            'bg-indigo-500/10',
            <span className="text-xs font-black text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full">Workforce</span>,
            'stagger-2'
          )}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm card-hover-effect animate-fade-in-up stagger-3">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
              <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Live
              </span>
            </div>
            <h3 className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-1">Present Today</h3>
            <div className="text-4xl font-black text-emerald-400 tracking-tight">{stats.attendanceToday}</div>
          </div>
          {kpiCard('System Health', 'OPERATIONAL',
            <Activity className="w-6 h-6 text-emerald-500 animate-pulse" />,
            'bg-emerald-500/10',
            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full">Status</span>,
            'stagger-4'
          )}
        </div>

        {/* Quick Actions Banner */}
        <div className="bg-card border border-border p-8 rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 card-hover-effect animate-fade-in-up stagger-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest mb-1">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              <span>Administrative Tools</span>
            </div>
            <h2 className="text-2xl font-black text-foreground">Management Quick Actions</h2>
            <p className="text-muted-foreground text-sm mt-1">Quickly access site assignments, register new staff, and review field records.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link 
              to="/dashboard/sites" 
              className="bg-primary hover:bg-primary/90 text-foreground px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary/25 hover:scale-105 active:scale-95 flex items-center gap-2 text-sm btn-interactive"
            >
              <Building2 className="w-4 h-4" />
              <span>Manage Sites</span>
              <ArrowUpRight className="w-4 h-4 opacity-70 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
            <Link 
              to="/dashboard/workers" 
              className="bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border px-6 py-3 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-2 text-sm btn-interactive"
            >
              <Users className="w-4 h-4" />
              <span>Manage Staff</span>
              <ArrowUpRight className="w-4 h-4 opacity-70 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Role: SITE MANAGER
  if (user.role === 'SITE_MANAGER') {
    return (
      <div className="flex flex-col gap-6 animate-in fade-in duration-500">
        <div className="bg-card border border-border p-8 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest mb-2">
            <HardHat className="w-4 h-4" />
            <span>Field Supervisor Portal</span>
          </div>
          <h2 className="text-2xl font-black text-foreground mb-2">Site Manager Operations</h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-2xl">Manage your assigned construction sites, supervise assigned workers, and capture live worker check-ins with photo proof.</p>
          
          <div className="flex flex-wrap gap-4">
            <Link 
              to="/dashboard/attendance" 
              className="bg-primary hover:bg-primary/90 text-foreground px-6 py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-primary/25 hover:scale-105 active:scale-95 flex items-center gap-2 text-sm"
            >
              <Camera className="w-5 h-5" />
              <span>Capture Worker Attendance</span>
            </Link>
            <Link 
              to="/dashboard/my-workers" 
              className="bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border px-6 py-3.5 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-2 text-sm"
            >
              <HardHat className="w-5 h-5" />
              <span>View My Workers</span>
            </Link>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-muted-foreground font-bold mb-1 uppercase text-xs tracking-widest">My Assigned Sites</h3>
              <div className="text-4xl font-black text-foreground">{stats.siteCount}</div>
              <p className="text-muted-foreground text-xs mt-2">Active construction projects</p>
            </div>
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Building2 className="w-7 h-7" />
            </div>
          </div>
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-muted-foreground font-bold mb-1 uppercase text-xs tracking-widest">Logged Today</h3>
              <div className="text-4xl font-black text-emerald-400">{stats.attendanceToday}</div>
              <p className="text-muted-foreground text-xs mt-2">Attendance entries recorded</p>
            </div>
            <div className="w-14 h-14 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-7 h-7" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Role: WORKER
  if (user.role === 'WORKER') {
    return (
      <div className="flex flex-col gap-6 animate-in fade-in duration-500">
        <div className="bg-card border border-border p-8 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest mb-2">
            <Users className="w-4 h-4" />
            <span>Worker Portal</span>
          </div>
          <h2 className="text-2xl font-black text-foreground mb-2">Worker Self-Service Dashboard</h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-2xl">Check your daily recorded hours, approval status, and monthly salary reports anytime.</p>
          <Link 
            to="/dashboard/salary" 
            className="bg-primary hover:bg-primary/90 text-foreground px-8 py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-primary/25 hover:scale-105 active:scale-95 inline-flex items-center gap-2 text-sm"
          >
            <FileText className="w-5 h-5" />
            <span>View My Salary & Hours</span>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
            <h3 className="text-muted-foreground font-bold mb-2 uppercase text-xs tracking-widest">Account Status</h3>
            <div className="text-3xl font-black text-emerald-400">Active & Verified</div>
            <p className="text-muted-foreground text-xs mt-2">Eligible for daily site attendance</p>
          </div>
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
            <h3 className="text-muted-foreground font-bold mb-2 uppercase text-xs tracking-widest">Payroll Schedule</h3>
            <div className="text-3xl font-black text-primary">Monthly Calculation</div>
            <p className="text-muted-foreground text-xs mt-2">Calculated by total approved hours</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
