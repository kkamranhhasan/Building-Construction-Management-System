import { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';

export default function DashboardLayout() {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      navigate('/login');
      return;
    }

    setUser(JSON.parse(userData));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) return <div className="min-h-screen bg-background flex items-center justify-center text-slate-500">Loading...</div>;

  const pathname = location.pathname;

  return (
    <div className="min-h-screen bg-background text-slate-100 font-sans flex">
      {/* Sidebar */}
      <aside className="w-64 bg-surface border-r border-border flex flex-col fixed inset-y-0 z-10 shadow-2xl">
        <div className="p-8 text-3xl font-extrabold bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent border-b border-border">
          S Islam ERP
        </div>
        <nav className="flex flex-col py-6 gap-2 px-4 flex-1 overflow-y-auto">
          <Link 
            to="/dashboard" 
            className={`px-4 py-3 rounded-xl transition-all duration-200 font-bold ${pathname === '/dashboard' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            Dashboard Overview
          </Link>

          {(user.role === 'OWNER' || user.role === 'MANAGER') && (
            <>
              <div className="mt-4 mb-2 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Management</div>
              <Link 
                to="/dashboard/sites" 
                className={`px-4 py-3 rounded-xl transition-all duration-200 font-bold ${pathname === '/dashboard/sites' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              >
                Site Management
              </Link>
              <Link 
                to="/dashboard/workers" 
                className={`px-4 py-3 rounded-xl transition-all duration-200 font-bold ${pathname === '/dashboard/workers' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              >
                Worker Management
              </Link>
              <Link 
                to="/dashboard/attendance" 
                className={`px-4 py-3 rounded-xl transition-all duration-200 font-bold ${pathname === '/dashboard/attendance' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              >
                Record Attendance
              </Link>
              <div className="mt-4 mb-2 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Public Site</div>
              <Link 
                to="/dashboard/cms" 
                className={`px-4 py-3 rounded-xl transition-all duration-200 font-bold ${pathname === '/dashboard/cms' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              >
                Website CMS
              </Link>
            </>
          )}

          {user.role === 'SITE_MANAGER' && (
            <>
              <div className="mt-4 mb-2 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Field Tools</div>
              <Link 
                to="/dashboard/sites" 
                className={`px-4 py-3 rounded-xl transition-all duration-200 font-bold ${pathname === '/dashboard/sites' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              >
                🏗️ Sites Overview
              </Link>
              <Link 
                to="/dashboard/my-workers" 
                className={`px-4 py-3 rounded-xl transition-all duration-200 font-bold ${pathname === '/dashboard/my-workers' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              >
                👷 My Workers
              </Link>
              <Link 
                to="/dashboard/attendance" 
                className={`px-4 py-3 rounded-xl transition-all duration-200 font-bold ${pathname === '/dashboard/attendance' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              >
                📸 Capture Attendance
              </Link>
            </>
          )}

          {user.role === 'WORKER' && (
            <>
              <div className="mt-4 mb-2 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">My Portal</div>
              <Link 
                to="/dashboard/salary" 
                className={`px-4 py-3 rounded-xl transition-all duration-200 font-bold ${pathname === '/dashboard/salary' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              >
                My Salary & Hours
              </Link>
            </>
          )}
        </nav>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-border bg-slate-900/50">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center text-white font-bold text-lg shadow-inner">
              {user.name.charAt(0)}
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-bold text-white truncate">{user.name}</span>
              <span className="text-xs font-medium text-primary uppercase tracking-wide truncate">{user.role}</span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full mt-3 px-4 py-2.5 text-sm font-bold text-red-400 hover:text-white hover:bg-red-500/20 rounded-xl transition-colors border border-red-500/20"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <header className="flex justify-between items-center mb-8 bg-surface p-6 rounded-2xl border border-border shadow-md">
            <div>
              <h2 className="text-2xl font-extrabold text-white">Welcome back, {user.name}</h2>
              <p className="text-slate-400 mt-1 font-medium text-sm">Here's what's happening today.</p>
            </div>
            <div className="hidden md:flex items-center gap-4">
               <div className="bg-slate-900 px-4 py-2 rounded-lg border border-slate-700 text-sm font-semibold text-slate-300">
                 {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
               </div>
            </div>
          </header>

          <Outlet />
        </div>
      </main>
    </div>
  );
}
