import { useEffect, useRef, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  Camera, 
  FileText, 
  Globe, 
  HardHat, 
  LogOut,
  Clock,
  ShieldCheck,
  UserCheck,
  ChevronDown,
  Phone,
  Zap
} from 'lucide-react';
import { API } from '../config/api';

export default function DashboardLayout() {
  const [user, setUser] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(API.me, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
    } catch {
      // Use cached user if network fails
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      navigate('/login');
      return;
    }

    setUser(JSON.parse(userData));
    fetchCurrentUser();

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [navigate]);

  // Close dropdown on route change or outside click
  useEffect(() => {
    setProfileDropdownOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setProfileDropdownOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground font-medium text-sm">Loading workspace...</p>
        </div>
      </div>
    );
  }

  const pathname = location.pathname;

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/40 shadow-sm shadow-amber-500/10';
      case 'MANAGER':
        return 'bg-amber-400/10 text-amber-300 border-amber-400/30';
      case 'SITE_MANAGER':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      default:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    }
  };

  const navLink = (to: string, label: string, Icon: any) => {
    const active = pathname === to || (to !== '/dashboard' && pathname.startsWith(to));
    return (
      <Link
        to={to}
        className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-300 font-bold text-sm group transform active:scale-95 ${
          active
            ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/25 scale-[1.02] font-black'
            : 'text-slate-600 hover:bg-amber-50/80 hover:text-amber-800 hover:translate-x-1 border border-transparent'
        }`}
      >
        <Icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${active ? 'text-white' : 'text-slate-500 group-hover:text-amber-700'}`} />
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex antialiased">
      {/* Sidebar */}
      <aside className="w-72 bg-sidebar border-r border-sidebar-border flex flex-col fixed inset-y-0 z-30 shadow-lg shadow-slate-200/50 transition-all duration-300">
        {/* Brand Header */}
        <div className="p-6 border-b border-sidebar-border flex items-center gap-3 bg-slate-50/70">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 flex items-center justify-center text-white shadow-md shadow-amber-500/25 font-black text-xl animate-float">
            🏗️
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 tracking-tight">
              S Islam ERP
            </div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Construction Suite
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col py-6 px-4 gap-1.5 flex-1 overflow-y-auto">
          <div className="px-3 mb-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">General</div>
          {navLink('/dashboard', 'Dashboard Overview', LayoutDashboard)}

          {/* Profile & Biometrics */}
          <div className="mt-6 px-3 mb-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Account & Biometrics</div>
          {navLink('/dashboard/profile', 'My Profile & Face Setup', UserCheck)}

          {(user.role === 'OWNER' || user.role === 'MANAGER') && (
            <>
              <div className="mt-6 px-3 mb-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Management</div>
              {navLink('/dashboard/sites', 'Site Management', Building2)}
              {navLink('/dashboard/workers', 'Staff & Workforce', Users)}
              {navLink('/dashboard/attendance', 'Biometric Attendance', Camera)}
              {navLink('/dashboard/devices', 'Site Devices & IoT', HardHat)}

              <div className="mt-6 px-3 mb-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Public Site</div>
              {navLink('/dashboard/cms', 'Website CMS', Globe)}
            </>
          )}

          {user.role === 'SITE_MANAGER' && (
            <>
              <div className="mt-6 px-3 mb-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Field Operations</div>
              {navLink('/dashboard/sites', 'My Assigned Sites', Building2)}
              {navLink('/dashboard/my-workers', 'Site Workforce', HardHat)}
              {navLink('/dashboard/attendance', 'Biometric Attendance', Camera)}
            </>
          )}

          {user.role === 'WORKER' && (
            <>
              <div className="mt-6 px-3 mb-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Self Service</div>
              {navLink('/dashboard/salary', 'My Salary & Hours', FileText)}
            </>
          )}
        </nav>

        {/* Sidebar Footer System Status */}
        <div className="p-4 border-t border-sidebar-border bg-sidebar/80 flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-2 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>ERP v2.4 Online</span>
          </div>
          <span className="font-mono text-[10px] opacity-60">AI Connected</span>
        </div>
      </aside>

      {/* Right Area: Docked Title Bar + Main Content */}
      <div className="flex-1 ml-72 flex flex-col min-h-screen">
        {/* Top Bar Header (Docked, matching sidebar style and border) */}
        <header className="sticky top-0 z-20 h-20 bg-sidebar shadow-sm shadow-slate-200/50 border-b border-sidebar-border px-8 flex items-center justify-between transition-all duration-300">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>Enterprise Portal</span>
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">Welcome back, {user.name}</h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Clock Widget */}
            <div className="hidden md:flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 shadow-xs">
              <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
              <span>
                {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* ─── TOP-RIGHT PROFILE POPUP / DROPDOWN ─── */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className={`flex items-center gap-3 p-1.5 pr-3.5 rounded-2xl border transition-all duration-200 cursor-pointer shadow-xs ${
                  profileDropdownOpen
                    ? 'bg-amber-50/80 border-amber-400/60 shadow-amber-500/10 scale-[1.02]'
                    : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 hover:border-amber-400/40'
                }`}
                aria-expanded={profileDropdownOpen}
                aria-label="Toggle user profile menu"
              >
                {/* User Avatar with Status Pip */}
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-tr from-amber-500 via-amber-600 to-amber-700 flex items-center justify-center text-white font-black text-sm shadow-md flex-shrink-0">
                    {user.avatarUrl ? (
                      <img 
                        src={user.avatarUrl} 
                        alt={user.name} 
                        className="w-full h-full object-cover" 
                        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                      />
                    ) : (
                      <span>{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
                    )}
                  </div>
                  {user.isFaceEnrolled && (
                    <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white" title="Face Biometrics Enrolled" />
                  )}
                </div>

                {/* Name & Role Text */}
                <div className="flex flex-col text-left">
                  <span className="text-xs font-black text-foreground truncate max-w-[130px] leading-tight">
                    {user.name}
                  </span>
                  <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-md border w-fit mt-0.5 ${getRoleBadge(user.role)}`}>
                    {user.role?.replace('_', ' ')}
                  </span>
                </div>

                <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ml-1 ${profileDropdownOpen ? 'rotate-180 text-amber-600' : ''}`} />
              </button>

              {/* ─── DROPDOWN POPUP MENU ─── */}
              {profileDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-3xl shadow-2xl p-4 flex flex-col gap-3 animate-fade-in z-50">
                  {/* User Header Profile Card */}
                  <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-secondary/50 border border-border">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-tr from-amber-500 via-amber-600 to-amber-700 flex items-center justify-center text-white font-black text-xl shadow-md flex-shrink-0">
                      {user.avatarUrl ? (
                        <img 
                          src={user.avatarUrl} 
                          alt={user.name} 
                          className="w-full h-full object-cover" 
                          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                        />
                      ) : (
                        <span>{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
                      )}
                    </div>

                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-sm font-black text-foreground truncate">{user.name}</span>
                      <span className="text-xs text-muted-foreground font-semibold truncate">@{user.username}</span>
                      
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border ${getRoleBadge(user.role)}`}>
                          {user.role?.replace('_', ' ')}
                        </span>
                        {user.idNumber && (
                          <span className="text-[10px] font-black font-mono text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-lg truncate">
                            #{user.idNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Biometrics & ID Details */}
                  <div className="bg-muted/60 rounded-2xl p-3 border border-border flex flex-col gap-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground font-semibold flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-primary" />
                        <span>Face Biometrics:</span>
                      </span>
                      {user.isFaceEnrolled ? (
                        <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                          ✓ Ready
                        </span>
                      ) : (
                        <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                          ⚠️ Not Enrolled
                        </span>
                      )}
                    </div>

                    {user.phone && (
                      <div className="flex items-center justify-between pt-1.5 border-t border-border/60">
                        <span className="text-muted-foreground font-semibold flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-primary" />
                          <span>Contact:</span>
                        </span>
                        <span className="font-semibold text-foreground">{user.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Navigation Quick Links inside Popup */}
                  <div className="flex flex-col gap-1 pt-1">
                    <Link
                      to="/dashboard/profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-foreground hover:bg-accent transition-colors group"
                    >
                      <span className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                        <span>My Profile & Face Setup</span>
                      </span>
                      <span className="text-[10px] text-muted-foreground group-hover:text-primary transition-colors">Edit →</span>
                    </Link>

                    {(user.role === 'OWNER' || user.role === 'MANAGER') && (
                      <Link
                        to="/dashboard/workers"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-foreground hover:bg-accent transition-colors group"
                      >
                        <span className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                          <span>Staff & Workforce</span>
                        </span>
                        <span className="text-[10px] text-muted-foreground group-hover:text-primary transition-colors">Manage →</span>
                      </Link>
                    )}

                    {user.role === 'SITE_MANAGER' && (
                      <Link
                        to="/dashboard/my-workers"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-foreground hover:bg-accent transition-colors group"
                      >
                        <span className="flex items-center gap-2">
                          <HardHat className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                          <span>My Site Workers</span>
                        </span>
                        <span className="text-[10px] text-muted-foreground group-hover:text-primary transition-colors">View →</span>
                      </Link>
                    )}
                  </div>

                  {/* Sign Out Action Button */}
                  <div className="pt-2 border-t border-border">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full px-4 py-2.5 text-xs font-black text-rose-600 dark:text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-600 rounded-2xl transition-all duration-200 border border-rose-500/30 hover:border-rose-600 flex items-center justify-center gap-2 shadow-sm active:scale-95 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto flex flex-col gap-6">
            <div key={pathname}>
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
