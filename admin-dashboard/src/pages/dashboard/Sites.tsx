import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { API } from '../../config/api';
import { 
  Building2, 
  MapPin, 
  Users, 
  UserCheck, 
  Plus, 
  Search, 
  Pencil, 
  Trash2, 
  Eye, 
  X, 
  UserPlus, 
  ArrowRight, 
  Compass, 
  Navigation, 
  Phone, 
  IdCard, 
  Briefcase, 
  DollarSign, 
  ShieldCheck, 
  UserMinus, 
  Info, 
  Map as MapIcon,
  Activity,
  Layers
} from 'lucide-react';
import MapLocationPicker, { type MapLocationResult } from '../../components/MapLocationPicker';
import SiteMiniMap from '../../components/SiteMiniMap';

interface SiteWorker {
  id: string;
  name: string;
  username: string;
  idNumber?: string;
  phone?: string;
  avatarUrl?: string;
  trade?: string;
  hourlyRate?: number | null;
  isFaceEnrolled?: boolean;
}

interface SiteManager {
  id: string;
  name: string;
  username: string;
  idNumber?: string;
  phone?: string;
  avatarUrl?: string;
  trade?: string;
}

interface Site {
  id: string;
  name: string;
  description?: string;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  radiusMeters?: number | null;
  createdAt?: string;
  updatedAt?: string;
  managers: SiteManager[];
  workers: SiteWorker[];
  isAssigned?: boolean;
}

type User = {
  id: string;
  name: string;
  username: string;
  role: string;
  idNumber?: string;
  phone?: string;
  trade?: string;
};

export default function SiteManagement() {
  const [sites, setSites] = useState<Site[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [gettingLocation, setGettingLocation] = useState(false);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<Site | null>(null);
  const [showAssignModal, setShowAssignModal] = useState<string | null>(null);
  const [viewDetailsSite, setViewDetailsSite] = useState<Site | null>(null);
  const [detailsActiveTab, setDetailsActiveTab] = useState<'MAP' | 'WORKERS' | 'ACTIONS'>('MAP');
  const [workerFilterQuery, setWorkerFilterQuery] = useState('');

  // Google Maps Picker state
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [mapPickerTarget, setMapPickerTarget] = useState<'CREATE' | 'EDIT'>('CREATE');

  // Forms state
  const [createData, setCreateData] = useState({ 
    name: '', 
    location: '', 
    description: '',
    latitude: '',
    longitude: '',
    radiusMeters: '300'
  });
  const [editData, setEditData] = useState({ 
    name: '', 
    location: '', 
    description: '',
    latitude: '',
    longitude: '',
    radiusMeters: '300'
  });
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

      if (sitesRes.ok) {
        const fetchedSites = await sitesRes.json();
        setSites(fetchedSites);
        // Refresh viewDetailsSite if currently open
        if (viewDetailsSite) {
          const updated = fetchedSites.find((s: Site) => s.id === viewDetailsSite.id);
          if (updated) setViewDetailsSite(updated);
        }
      }
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

  const handleGetCurrentGPS = (isEdit: boolean = false) => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setGettingLocation(false);
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        if (isEdit) {
          setEditData(prev => ({ ...prev, latitude: lat, longitude: lng }));
        } else {
          setCreateData(prev => ({ ...prev, latitude: lat, longitude: lng }));
        }
      },
      err => {
        setGettingLocation(false);
        alert('Could not get GPS location: ' + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleMapLocationSelected = (res: MapLocationResult) => {
    if (mapPickerTarget === 'CREATE') {
      setCreateData(prev => ({
        ...prev,
        location: res.address || prev.location,
        latitude: String(res.latitude),
        longitude: String(res.longitude),
        radiusMeters: String(res.radiusMeters),
      }));
    } else {
      setEditData(prev => ({
        ...prev,
        location: res.address || prev.location,
        latitude: String(res.latitude),
        longitude: String(res.longitude),
        radiusMeters: String(res.radiusMeters),
      }));
    }
    setShowMapPicker(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API.sites, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...createData,
          latitude: createData.latitude ? parseFloat(createData.latitude) : null,
          longitude: createData.longitude ? parseFloat(createData.longitude) : null,
          radiusMeters: createData.radiusMeters ? parseFloat(createData.radiusMeters) : 300,
        }),
      });
      if (res.ok) {
        setShowCreateModal(false);
        setCreateData({ name: '', location: '', description: '', latitude: '', longitude: '', radiusMeters: '300' });
        fetchData();
      } else {
        const err = await res.json().catch(() => null);
        alert(err?.error || 'Failed to create site');
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
        body: JSON.stringify({
          ...editData,
          latitude: editData.latitude ? parseFloat(editData.latitude) : null,
          longitude: editData.longitude ? parseFloat(editData.longitude) : null,
          radiusMeters: editData.radiusMeters ? parseFloat(editData.radiusMeters) : 300,
        }),
      });
      if (res.ok) {
        setShowEditModal(null);
        fetchData();
      } else {
        const err = await res.json().catch(() => null);
        alert(err?.error || 'Failed to update site');
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
        if (viewDetailsSite?.id === siteId) setViewDetailsSite(null);
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
        const err = await res.json().catch(() => null);
        alert(err?.error || 'Assignment failed');
      }
    } catch (e) { console.error(e); }
  };

  const handleUnassignUser = async (siteId: string, userId: string, type: 'WORKER' | 'MANAGER') => {
    if (!confirm(`Are you sure you want to remove this ${type === 'MANAGER' ? 'manager' : 'worker'} from this site?`)) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API.removeSite(siteId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId, type }),
      });
      if (res.ok) {
        fetchData();
        if (viewDetailsSite && viewDetailsSite.id === siteId) {
          setViewDetailsSite(prev => {
            if (!prev) return null;
            return {
              ...prev,
              managers: type === 'MANAGER' ? prev.managers.filter(m => m.id !== userId) : prev.managers,
              workers: type === 'WORKER' ? prev.workers.filter(w => w.id !== userId) : prev.workers,
            };
          });
        }
      } else {
        const err = await res.json().catch(() => null);
        alert(err?.error || 'Failed to remove user from site');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const isAdmin = userRole === 'OWNER' || userRole === 'MANAGER';
  const isSiteManager = userRole === 'SITE_MANAGER';

  const filteredSites = sites.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const mySites = filteredSites.filter(s => s.isAssigned);
  const otherSites = filteredSites.filter(s => !s.isAssigned);

  const availableUsers = users.filter(u => {
    if (assignData.type === 'MANAGER') return u.role === 'SITE_MANAGER';
    if (assignData.type === 'WORKER') return u.role === 'WORKER';
    return false;
  });

  const getTradeBadgeStyle = (trade?: string) => {
    const t = (trade || '').toLowerCase();
    if (t.includes('mason') || t.includes('রাজমিস্ত্রি')) return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
    if (t.includes('electric') || t.includes('ইলেকট্রিশিয়ান')) return 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30';
    if (t.includes('rod') || t.includes('রড')) return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30';
    if (t.includes('carpenter') || t.includes('কাঠমিস্ত্রি')) return 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30';
    if (t.includes('plumb') || t.includes('প্লাম্বার')) return 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30';
    if (t.includes('paint') || t.includes('পেইন্টার')) return 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30';
    if (t.includes('tile') || t.includes('টাইলস')) return 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30';
    if (t.includes('engineer') || t.includes('manager')) return 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30';
    return 'bg-primary/10 text-primary border-primary/20';
  };

  const SiteCard = ({ site, readOnly = false }: { site: Site; readOnly?: boolean }) => (
    <div 
      onClick={() => {
        setViewDetailsSite(site);
        setDetailsActiveTab('MAP');
      }}
      className={`group bg-card border rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:border-primary/50 cursor-pointer card-lift ${
        site.isAssigned ? 'border-primary/40 shadow-lg shadow-primary/5' : 'border-border'
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary/20 to-primary/10 border border-primary/20 flex items-center justify-center text-foreground font-black text-lg group-hover:scale-105 transition-transform">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-black text-foreground text-base tracking-tight group-hover:text-primary transition-colors">
                {site.name}
              </h3>
              <p className="text-muted-foreground text-xs flex items-center gap-1 mt-0.5 font-semibold">
                <MapPin className="w-3 h-3 text-primary shrink-0" />
                <span className="line-clamp-1">{site.location}</span>
              </p>
            </div>
          </div>
          {site.isAssigned && (
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Assigned</span>
            </span>
          )}
        </div>

        <p className="text-muted-foreground text-xs line-clamp-2 leading-relaxed mb-4 font-medium">
          {site.description || 'Active construction site in the project directory.'}
        </p>

        {/* GPS Geofence Pill */}
        <div className="mb-4">
          {site.latitude && site.longitude ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
              <Compass className="w-3.5 h-3.5" />
              <span>Google Maps ({site.latitude.toFixed(4)}, {site.longitude.toFixed(4)} · ±{site.radiusMeters || 300}m)</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-medium bg-muted text-muted-foreground border border-border">
              <MapPin className="w-3.5 h-3.5" />
              <span>Manual Address Set</span>
            </span>
          )}
        </div>
        
        {/* Staff Badges */}
        <div className="mb-6 flex flex-wrap gap-2">
          {site.managers?.length > 0 ? (
            site.managers.map(m => (
              <span key={m.id} className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5" />
                <span>{m.name} {m.idNumber ? `(#${m.idNumber})` : ''}</span>
              </span>
            ))
          ) : (
            <span className="text-muted-foreground text-xs italic bg-muted/60 border border-border px-2.5 py-1 rounded-xl">
              No Manager Assigned
            </span>
          )}
          <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            <span>{site.workers?.length || 0} Workers</span>
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div 
        className="flex items-center justify-between border-t border-border pt-4 mt-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex gap-2">
          {isAdmin && (
            <>
              <button 
                onClick={(e) => { 
                  e.stopPropagation();
                  setShowEditModal(site); 
                  setEditData({ 
                    name: site.name, 
                    location: site.location, 
                    description: site.description || '',
                    latitude: site.latitude ? String(site.latitude) : '',
                    longitude: site.longitude ? String(site.longitude) : '',
                    radiusMeters: site.radiusMeters ? String(site.radiusMeters) : '300'
                  }); 
                }}
                className="px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-foreground border border-primary/30 flex items-center gap-1 text-xs font-bold transition-all cursor-pointer"
                title="Edit Site & Location"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(site.id);
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-600 text-rose-600 dark:text-rose-400 hover:text-white border border-rose-500/30 hover:border-rose-600 flex items-center gap-1 text-xs font-bold transition-all cursor-pointer shadow-sm"
                title="Delete Site"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button 
            type="button"
            className="px-3 py-1.5 rounded-xl bg-secondary hover:bg-muted text-foreground text-xs font-bold flex items-center gap-1.5 transition-colors border border-border cursor-pointer shadow-sm"
            onClick={(e) => {
              e.stopPropagation();
              setViewDetailsSite(site);
              setDetailsActiveTab('MAP');
            }}
          >
            <Eye className="w-3.5 h-3.5 text-primary" />
            <span>View Details</span>
          </button>

          {!readOnly && (
            isSiteManager ? (
              <Link 
                to="/dashboard/attendance" 
                onClick={e => e.stopPropagation()}
                className="text-primary hover:text-primary/80 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <span>Live Attendance</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : isAdmin ? (
              <button 
                type="button"
                className="text-primary hover:text-primary/80 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer" 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAssignModal(site.id);
                }}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Assign Staff</span>
              </button>
            ) : null
          )}
        </div>
      </div>
    </div>
  );

  // Filter workers in details view
  const siteWorkersFiltered = (viewDetailsSite?.workers || []).filter(w => 
    w.name.toLowerCase().includes(workerFilterQuery.toLowerCase()) ||
    (w.trade && w.trade.toLowerCase().includes(workerFilterQuery.toLowerCase())) ||
    (w.idNumber && w.idNumber.toLowerCase().includes(workerFilterQuery.toLowerCase())) ||
    w.username.toLowerCase().includes(workerFilterQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 rounded-3xl border border-border shadow-xl">
        <div>
          <h1 className="text-2xl font-black text-foreground">Construction Sites</h1>
          <p className="text-muted-foreground text-xs mt-0.5 font-medium">
            {isSiteManager ? `You manage ${mySites.length} site(s). Click any site to view live Google Maps view, manager, and workers with their tasks.` : 'Manage active construction projects, select locations directly on Google Maps, and allocate workforce.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search site or location..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-muted border border-border text-foreground pl-9 pr-4 py-2.5 rounded-2xl text-xs outline-none focus:border-primary transition-all w-52 sm:w-64 font-medium shadow-inner"
            />
          </div>
          {isAdmin && (
            <button
              className="bg-primary hover:bg-primary/90 text-foreground px-5 py-2.5 rounded-2xl font-bold text-xs transition-all shadow-lg shadow-primary/25 flex items-center gap-1.5 flex-shrink-0 hover:scale-105 active:scale-95 btn-interactive cursor-pointer"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="w-4 h-4" />
              <span>New Site</span>
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center h-64 gap-3 bg-card border border-border rounded-3xl">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-xs font-semibold">Loading construction sites...</p>
        </div>
      )}

      {/* Grid Rendering */}
      {!loading && (
        isSiteManager ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {mySites.map(s => <SiteCard key={s.id} site={s} />)}
            </div>
            {otherSites.length > 0 && (
              <div className="mt-6">
                <h2 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4">Other Sites in System</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {otherSites.map(s => <SiteCard key={s.id} site={s} readOnly />)}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredSites.map(s => <SiteCard key={s.id} site={s} />)}
            {filteredSites.length === 0 && (
              <div className="col-span-full py-16 text-center text-muted-foreground bg-card border border-dashed border-border rounded-3xl">
                <Building2 className="w-12 h-12 mx-auto opacity-20 mb-3" />
                <p className="text-sm font-semibold">No sites matching "{searchTerm}"</p>
              </div>
            )}
          </div>
        )
      )}

      {/* ========================================================================= */}
      {/* 🌟 LUXURY REDESIGNED SITE DETAILS POPUP MODAL (সুদৃশ্য পপআপ) 🌟 */}
      {/* ========================================================================= */}
      {viewDetailsSite && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xl flex items-center justify-center z-50 p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-card border border-border/80 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scale-in">
            
            {/* 1. HERO GRADIENT BANNER */}
            <div className="relative bg-gradient-to-r from-blue-600/20 via-primary/15 to-indigo-600/20 border-b border-border/80 p-6 sm:p-8 shrink-0 overflow-hidden">
              {/* Background ambient glow circle */}
              <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
              <div className="absolute left-1/3 -bottom-10 w-44 h-44 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />

              <div className="relative z-10 flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-blue-600 text-white flex items-center justify-center shadow-xl shadow-primary/25 shrink-0">
                    <Building2 className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                        {viewDetailsSite.name}
                      </h2>
                      <span className="bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border border-emerald-500/30 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        <span>Active Project</span>
                      </span>
                    </div>

                    <p className="text-muted-foreground text-xs sm:text-sm font-semibold flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-primary shrink-0" />
                      <span>{viewDetailsSite.location}</span>
                    </p>

                    {/* Quick Stats Bar in Header */}
                    <div className="flex items-center gap-3 mt-3 flex-wrap text-xs">
                      <div className="bg-card/70 backdrop-blur-md px-3 py-1 rounded-xl border border-border/70 flex items-center gap-1.5 font-bold text-foreground">
                        <Users className="w-3.5 h-3.5 text-primary" />
                        <span>{viewDetailsSite.workers?.length || 0} Workers</span>
                      </div>
                      <div className="bg-card/70 backdrop-blur-md px-3 py-1 rounded-xl border border-border/70 flex items-center gap-1.5 font-bold text-foreground">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{viewDetailsSite.managers?.length > 0 ? viewDetailsSite.managers[0].name : 'No Manager'}</span>
                      </div>
                      {viewDetailsSite.latitude && viewDetailsSite.longitude && (
                        <div className="bg-card/70 backdrop-blur-md px-3 py-1 rounded-xl border border-border/70 flex items-center gap-1.5 font-bold text-foreground font-mono">
                          <Compass className="w-3.5 h-3.5 text-primary" />
                          <span>±{viewDetailsSite.radiusMeters || 300}m Radius</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setViewDetailsSite(null)}
                    className="w-10 h-10 rounded-2xl bg-card/80 hover:bg-card text-muted-foreground hover:text-foreground flex items-center justify-center transition-all border border-border/80 shadow-md cursor-pointer hover:scale-105 active:scale-95"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* 2. POPUP NAVIGATION TABS */}
              <div className="relative z-10 flex items-center gap-2 mt-6 pt-4 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setDetailsActiveTab('MAP')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                    detailsActiveTab === 'MAP'
                      ? 'bg-primary text-foreground shadow-lg shadow-primary/25 scale-[1.02]'
                      : 'bg-card/70 hover:bg-card text-muted-foreground hover:text-foreground border border-border/60'
                  }`}
                >
                  <MapIcon className="w-3.5 h-3.5" />
                  <span>Overview & Google Map</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDetailsActiveTab('WORKERS')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                    detailsActiveTab === 'WORKERS'
                      ? 'bg-primary text-foreground shadow-lg shadow-primary/25 scale-[1.02]'
                      : 'bg-card/70 hover:bg-card text-muted-foreground hover:text-foreground border border-border/60'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Workforce & Duties ({viewDetailsSite.workers?.length || 0})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDetailsActiveTab('ACTIONS')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                    detailsActiveTab === 'ACTIONS'
                      ? 'bg-primary text-foreground shadow-lg shadow-primary/25 scale-[1.02]'
                      : 'bg-card/70 hover:bg-card text-muted-foreground hover:text-foreground border border-border/60'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Actions & Settings</span>
                </button>
              </div>
            </div>

            {/* 3. POPUP BODY / SCROLLABLE CONTENT */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 flex flex-col gap-6">

              {/* TAB 1: OVERVIEW & GOOGLE MAP */}
              {detailsActiveTab === 'MAP' && (
                <div className="flex flex-col gap-6 animate-in fade-in duration-200">
                  {/* Embedded Live Google Map */}
                  {viewDetailsSite.latitude && viewDetailsSite.longitude ? (
                    <div className="bg-card border border-border/80 rounded-3xl p-5 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-xs font-black text-primary uppercase tracking-wider">
                          <Compass className="w-4 h-4" />
                          <span>Interactive Google Map & Geofence Area</span>
                        </div>
                        <span className="text-xs font-mono font-bold text-muted-foreground">
                          {viewDetailsSite.latitude.toFixed(5)}, {viewDetailsSite.longitude.toFixed(5)}
                        </span>
                      </div>

                      <SiteMiniMap
                        latitude={viewDetailsSite.latitude}
                        longitude={viewDetailsSite.longitude}
                        radiusMeters={viewDetailsSite.radiusMeters}
                        siteName={viewDetailsSite.name}
                      />
                    </div>
                  ) : (
                    <div className="bg-muted/40 border border-dashed border-border rounded-3xl p-8 text-center flex flex-col items-center justify-center gap-3">
                      <MapPin className="w-12 h-12 text-muted-foreground/40" />
                      <div>
                        <h4 className="text-sm font-bold text-foreground">No Google Map Coordinates Configured</h4>
                        <p className="text-xs text-muted-foreground mt-1">This site currently only has a manual address text: "{viewDetailsSite.location}"</p>
                      </div>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowEditModal(viewDetailsSite);
                            setEditData({
                              name: viewDetailsSite.name,
                              location: viewDetailsSite.location,
                              description: viewDetailsSite.description || '',
                              latitude: '',
                              longitude: '',
                              radiusMeters: '300',
                            });
                            setMapPickerTarget('EDIT');
                            setShowMapPicker(true);
                          }}
                          className="mt-2 bg-primary hover:bg-primary/90 text-foreground px-5 py-2 rounded-2xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer hover:scale-105"
                        >
                          <MapIcon className="w-3.5 h-3.5" />
                          <span>Pin Location on Google Map</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Project Description & Specs */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 bg-muted/40 border border-border/80 rounded-3xl p-5 flex flex-col justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
                          <Info className="w-3.5 h-3.5 text-primary" />
                          <span>Project Scope & Description</span>
                        </span>
                        <p className="text-xs leading-relaxed text-foreground font-medium">
                          {viewDetailsSite.description || 'No detailed scope written for this construction project yet.'}
                        </p>
                      </div>
                    </div>

                    <div className="bg-muted/40 border border-border/80 rounded-3xl p-5 flex flex-col justify-between gap-2">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-primary" />
                        <span>Site Verification Status</span>
                      </span>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground font-semibold">Geofence:</span>
                          <span className="font-bold text-foreground">
                            {viewDetailsSite.latitude ? 'Active (GPS)' : 'Manual Only'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground font-semibold">Manager:</span>
                          <span className="font-bold text-emerald-400">
                            {viewDetailsSite.managers?.length > 0 ? 'Assigned' : 'Unassigned'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground font-semibold">Workforce:</span>
                          <span className="font-bold text-primary">
                            {viewDetailsSite.workers?.length || 0} Persons
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: WORKFORCE & DUTIES ("কার কি কাজ") */}
              {detailsActiveTab === 'WORKERS' && (
                <div className="flex flex-col gap-6 animate-in fade-in duration-200">
                  {/* Site Manager Spotlight Card */}
                  <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/25 rounded-3xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-emerald-400" />
                        <h4 className="text-xs font-black text-foreground uppercase tracking-wider">
                          Site Manager / Project In-Charge
                        </h4>
                      </div>
                      {isAdmin && (viewDetailsSite.managers || []).length === 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setAssignData({ userId: '', type: 'MANAGER' });
                            setShowAssignModal(viewDetailsSite.id);
                          }}
                          className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Assign Site Manager</span>
                        </button>
                      )}
                    </div>

                    {(viewDetailsSite.managers || []).length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {viewDetailsSite.managers.map(m => (
                          <div key={m.id} className="bg-card border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm">
                            <div className="flex items-center gap-3">
                              <div className="w-13 h-13 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 overflow-hidden flex items-center justify-center shrink-0">
                                {m.avatarUrl ? (
                                  <img src={m.avatarUrl} alt={m.name} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-lg font-black text-emerald-400">{m.name.charAt(0).toUpperCase()}</span>
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-foreground text-sm">{m.name}</span>
                                  <span className="text-[10px] font-black font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg flex items-center gap-0.5">
                                    <IdCard className="w-3 h-3" />
                                    <span>#{m.idNumber || 'NO ID'}</span>
                                  </span>
                                </div>
                                <div className="text-xs text-muted-foreground flex items-center gap-3 mt-1">
                                  <span>@{m.username}</span>
                                  {m.phone && (
                                    <a href={`tel:${m.phone}`} className="text-foreground hover:text-primary flex items-center gap-1 font-semibold">
                                      <Phone className="w-3 h-3 text-primary" />
                                      <span>{m.phone}</span>
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>

                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => handleUnassignUser(viewDetailsSite.id, m.id, 'MANAGER')}
                                className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-600 text-rose-600 dark:text-rose-400 hover:text-white border border-rose-500/30 transition-all cursor-pointer"
                                title="Remove manager from site"
                              >
                                <UserMinus className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">No manager assigned yet.</p>
                    )}
                  </div>

                  {/* Workers List Section */}
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary" />
                        <h4 className="text-xs font-black text-foreground uppercase tracking-wider">
                          Assigned Workers & Tasks / কার কি কাজ ({viewDetailsSite.workers?.length || 0})
                        </h4>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Search Workers */}
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Filter by name, ID or duty..."
                            value={workerFilterQuery}
                            onChange={e => setWorkerFilterQuery(e.target.value)}
                            className="bg-muted border border-border text-foreground pl-8 pr-3 py-1.5 rounded-xl text-xs outline-none focus:border-primary w-48 font-medium shadow-inner"
                          />
                        </div>

                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => {
                              setAssignData({ userId: '', type: 'WORKER' });
                              setShowAssignModal(viewDetailsSite.id);
                            }}
                            className="bg-primary/10 hover:bg-primary text-primary hover:text-foreground border border-primary/30 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Worker</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {(viewDetailsSite.workers || []).length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {siteWorkersFiltered.map(w => (
                          <div 
                            key={w.id} 
                            className="bg-card hover:bg-muted/40 border border-border/80 hover:border-primary/40 rounded-3xl p-4 flex items-center justify-between gap-3 transition-all shadow-sm group"
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className="w-12 h-12 rounded-2xl bg-secondary border border-border overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
                                {w.avatarUrl ? (
                                  <img src={w.avatarUrl} alt={w.name} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="font-black text-foreground text-sm">{w.name.charAt(0).toUpperCase()}</span>
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-foreground text-xs sm:text-sm truncate">{w.name}</span>
                                  <span className="text-[10px] font-black font-mono text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-lg flex items-center gap-0.5">
                                    <IdCard className="w-2.5 h-2.5" />
                                    <span>#{w.idNumber || 'NO ID'}</span>
                                  </span>
                                </div>

                                {/* "কার কি কাজ" / Trade Badge */}
                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xl text-[10px] font-bold border ${getTradeBadgeStyle(w.trade)}`}>
                                    <Briefcase className="w-3 h-3" />
                                    <span>{w.trade || 'General Laborer'}</span>
                                  </span>

                                  {w.hourlyRate != null && (
                                    <span className="text-[10px] text-emerald-400 font-black flex items-center gap-0.5 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-xl">
                                      <DollarSign className="w-2.5 h-2.5" />
                                      <span>${w.hourlyRate.toFixed(2)}/hr</span>
                                    </span>
                                  )}

                                  {w.isFaceEnrolled && (
                                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5" title="Face Biometric Enrolled">
                                      <ShieldCheck className="w-3.5 h-3.5" />
                                    </span>
                                  )}
                                </div>

                                {w.phone && (
                                  <div className="mt-1">
                                    <a href={`tel:${w.phone}`} className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 font-medium">
                                      <Phone className="w-2.5 h-2.5 text-primary" />
                                      <span>{w.phone}</span>
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>

                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => handleUnassignUser(viewDetailsSite.id, w.id, 'WORKER')}
                                className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-600 text-rose-600 dark:text-rose-400 hover:text-white border border-rose-500/30 transition-all cursor-pointer shrink-0"
                                title="Remove worker from site"
                              >
                                <UserMinus className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}

                        {siteWorkersFiltered.length === 0 && (
                          <div className="col-span-full py-8 text-center text-muted-foreground text-xs italic bg-muted/20 rounded-3xl border border-dashed border-border">
                            No worker matches "{workerFilterQuery}"
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-muted/30 border border-dashed border-border rounded-3xl p-8 text-center">
                        <Users className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
                        <p className="text-xs font-semibold text-muted-foreground">No workers assigned to this site yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: ACTIONS & SETTINGS */}
              {detailsActiveTab === 'ACTIONS' && (
                <div className="flex flex-col gap-6 animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Live Attendance Launch */}
                    <div className="bg-card border border-border/80 rounded-3xl p-6 flex flex-col justify-between gap-4 shadow-sm">
                      <div>
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-3">
                          <Activity className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold text-foreground text-sm">Automated Attendance Scanner</h4>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          Open camera scanner for real-time AI face recognition & GPS distance validation for this site.
                        </p>
                      </div>
                      <Link 
                        to="/dashboard/attendance"
                        className="bg-primary hover:bg-primary/90 text-foreground py-2.5 px-4 rounded-2xl text-xs font-bold transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2"
                      >
                        <span>Open Attendance Scanner</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                    {/* Edit Project Settings */}
                    {isAdmin && (
                      <div className="bg-card border border-border/80 rounded-3xl p-6 flex flex-col justify-between gap-4 shadow-sm">
                        <div>
                          <div className="w-10 h-10 rounded-2xl bg-secondary border border-border flex items-center justify-center text-foreground mb-3">
                            <Pencil className="w-5 h-5" />
                          </div>
                          <h4 className="font-bold text-foreground text-sm">Site Settings & Location</h4>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            Modify site title, description, manual address or change Google Maps pin coordinates.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setShowEditModal(viewDetailsSite);
                            setEditData({
                              name: viewDetailsSite.name,
                              location: viewDetailsSite.location,
                              description: viewDetailsSite.description || '',
                              latitude: viewDetailsSite.latitude ? String(viewDetailsSite.latitude) : '',
                              longitude: viewDetailsSite.longitude ? String(viewDetailsSite.longitude) : '',
                              radiusMeters: viewDetailsSite.radiusMeters ? String(viewDetailsSite.radiusMeters) : '300'
                            });
                          }}
                          className="bg-secondary hover:bg-muted text-foreground border border-border py-2.5 px-4 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Edit Site Info</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 4. POPUP FOOTER */}
            <div className="p-4 sm:px-8 bg-muted/40 border-t border-border/80 flex items-center justify-between gap-4 shrink-0">
              <div className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                <span>Site ID:</span>
                <span className="font-mono font-bold text-foreground">{viewDetailsSite.id.slice(0, 8)}...</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewDetailsSite(null)}
                  className="px-6 py-2.5 rounded-2xl bg-primary hover:bg-primary/90 text-foreground text-xs font-bold transition-all shadow-md shadow-primary/20 cursor-pointer hover:scale-105 active:scale-95"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🌟 CREATE SITE MODAL (With Google Map Picker & Glassmorphism) 🌟 */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xl flex items-center justify-center z-50 p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl animate-scale-in max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-foreground">Create New Site</h2>
                  <p className="text-muted-foreground text-xs font-medium">Add project with Google Maps location and details.</p>
                </div>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="w-9 h-9 rounded-2xl bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Site Project Name</label>
                <input 
                  className="w-full bg-muted border border-border text-foreground px-4 py-3 rounded-2xl text-sm outline-none focus:border-primary transition-colors font-semibold" 
                  type="text" 
                  placeholder="e.g. Padma Bridge Connector Tower" 
                  value={createData.name} 
                  onChange={e => setCreateData({...createData, name: e.target.value})} 
                  required 
                />
              </div>

              {/* GOOGLE MAPS DIRECT PICKER HERO BUTTON */}
              <div className="bg-gradient-to-tr from-primary/15 via-blue-500/10 to-primary/5 border border-primary/30 p-4 rounded-3xl flex flex-col gap-2.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-primary font-black text-xs uppercase tracking-wider">
                    <MapIcon className="w-4 h-4" />
                    <span>Google Maps Pinpoint</span>
                  </div>
                  {createData.latitude && createData.longitude && (
                    <span className="text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-lg">
                      Location Picked ✓
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMapPickerTarget('CREATE');
                    setShowMapPicker(true);
                  }}
                  className="w-full bg-primary hover:bg-primary/90 text-foreground py-3 rounded-2xl text-xs font-bold transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 cursor-pointer"
                >
                  <MapPin className="w-4 h-4" />
                  <span>{createData.latitude ? '🗺️ Change Location on Google Map' : '🗺️ Select Location on Google Map'}</span>
                </button>

                {createData.latitude && createData.longitude && (
                  <div className="text-[11px] text-muted-foreground flex items-center justify-between font-mono bg-card/70 px-3 py-2 rounded-xl border border-border">
                    <span>GPS: {Number(createData.latitude).toFixed(5)}, {Number(createData.longitude).toFixed(5)}</span>
                    <span className="text-primary font-bold">±{createData.radiusMeters || 300}m</span>
                  </div>
                )}
              </div>

              {/* Location Address Input */}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">
                  Location / Address
                </label>
                <input 
                  className="w-full bg-muted border border-border text-foreground px-4 py-3 rounded-2xl text-sm outline-none focus:border-primary transition-colors font-semibold" 
                  type="text" 
                  placeholder="e.g. Plot 42, Road 11, Block D, Banani, Dhaka" 
                  value={createData.location} 
                  onChange={e => setCreateData({...createData, location: e.target.value})} 
                  required 
                />
              </div>

              {/* Coordinates Section */}
              <div className="bg-muted/60 border border-border p-4 rounded-2xl flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Coordinates & Geofence Boundary</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleGetCurrentGPS(false)}
                    disabled={gettingLocation}
                    className="text-xs font-bold text-foreground bg-primary/20 hover:bg-primary/30 border border-primary/30 px-3 py-1 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>{gettingLocation ? 'Acquiring...' : '📍 Use GPS'}</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 23.8103"
                      value={createData.latitude}
                      onChange={e => setCreateData({ ...createData, latitude: e.target.value })}
                      className="w-full bg-background border border-border text-foreground px-3 py-2 rounded-xl text-xs outline-none focus:border-primary font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 90.4125"
                      value={createData.longitude}
                      onChange={e => setCreateData({ ...createData, longitude: e.target.value })}
                      className="w-full bg-background border border-border text-foreground px-3 py-2 rounded-xl text-xs outline-none focus:border-primary font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Allowed Geofence Radius (meters)</label>
                  <input
                    type="number"
                    placeholder="300"
                    value={createData.radiusMeters}
                    onChange={e => setCreateData({ ...createData, radiusMeters: e.target.value })}
                    className="w-full bg-background border border-border text-foreground px-3 py-2 rounded-xl text-xs outline-none focus:border-primary font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Project Scope / Description</label>
                <textarea 
                  className="w-full bg-muted border border-border text-foreground px-4 py-3 rounded-2xl text-sm outline-none focus:border-primary transition-colors min-h-[80px]" 
                  placeholder="Scope of work, structural details, project deadlines..." 
                  value={createData.description} 
                  onChange={e => setCreateData({...createData, description: e.target.value})} 
                />
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border">
                <button type="button" className="px-5 py-2.5 text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="bg-primary hover:bg-primary/90 px-6 py-2.5 rounded-2xl font-bold text-xs text-foreground shadow-lg shadow-primary/25 btn-interactive cursor-pointer">Create Site</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🌟 EDIT SITE MODAL (With Google Map Picker & Glassmorphism) 🌟 */}
      {/* ========================================================================= */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xl flex items-center justify-center z-50 p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl animate-scale-in max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Pencil className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-foreground">Edit Site & Location</h2>
                  <p className="text-muted-foreground text-xs font-medium">Update parameters or choose new Google Map location.</p>
                </div>
              </div>
              <button onClick={() => setShowEditModal(null)} className="w-9 h-9 rounded-2xl bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Site Name</label>
                <input className="w-full bg-muted border border-border text-foreground px-4 py-3 rounded-2xl text-sm outline-none focus:border-primary transition-colors font-semibold" type="text" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} required />
              </div>

              {/* GOOGLE MAPS DIRECT PICKER HERO BUTTON */}
              <div className="bg-gradient-to-tr from-primary/15 via-blue-500/10 to-primary/5 border border-primary/30 p-4 rounded-3xl flex flex-col gap-2.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-primary font-black text-xs uppercase tracking-wider">
                    <MapIcon className="w-4 h-4" />
                    <span>Google Maps Pinpoint</span>
                  </div>
                  {editData.latitude && editData.longitude && (
                    <span className="text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-lg">
                      Location Picked ✓
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMapPickerTarget('EDIT');
                    setShowMapPicker(true);
                  }}
                  className="w-full bg-primary hover:bg-primary/90 text-foreground py-3 rounded-2xl text-xs font-bold transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 cursor-pointer"
                >
                  <MapPin className="w-4 h-4" />
                  <span>🗺️ Select Location on Google Map</span>
                </button>

                {editData.latitude && editData.longitude && (
                  <div className="text-[11px] text-muted-foreground flex items-center justify-between font-mono bg-card/70 px-3 py-2 rounded-xl border border-border">
                    <span>GPS: {Number(editData.latitude).toFixed(5)}, {Number(editData.longitude).toFixed(5)}</span>
                    <span className="text-primary font-bold">±{editData.radiusMeters || 300}m</span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Location / Address</label>
                <input className="w-full bg-muted border border-border text-foreground px-4 py-3 rounded-2xl text-sm outline-none focus:border-primary transition-colors font-semibold" type="text" value={editData.location} onChange={e => setEditData({...editData, location: e.target.value})} required />
              </div>

              {/* Coordinates Section */}
              <div className="bg-muted/60 border border-border p-4 rounded-2xl flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Coordinates & Geofence Boundary</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleGetCurrentGPS(true)}
                    disabled={gettingLocation}
                    className="text-xs font-bold text-foreground bg-primary/20 hover:bg-primary/30 border border-primary/30 px-3 py-1 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>{gettingLocation ? 'Acquiring...' : '📍 Use GPS'}</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 23.8103"
                      value={editData.latitude}
                      onChange={e => setEditData({ ...editData, latitude: e.target.value })}
                      className="w-full bg-background border border-border text-foreground px-3 py-2 rounded-xl text-xs outline-none focus:border-primary font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 90.4125"
                      value={editData.longitude}
                      onChange={e => setEditData({ ...editData, longitude: e.target.value })}
                      className="w-full bg-background border border-border text-foreground px-3 py-2 rounded-xl text-xs outline-none focus:border-primary font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Allowed Geofence Radius (meters)</label>
                  <input
                    type="number"
                    placeholder="300"
                    value={editData.radiusMeters}
                    onChange={e => setEditData({ ...editData, radiusMeters: e.target.value })}
                    className="w-full bg-background border border-border text-foreground px-3 py-2 rounded-xl text-xs outline-none focus:border-primary font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Project Scope / Description</label>
                <textarea className="w-full bg-muted border border-border text-foreground px-4 py-3 rounded-2xl text-sm outline-none focus:border-primary transition-colors min-h-[80px]" value={editData.description} onChange={e => setEditData({...editData, description: e.target.value})} />
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border">
                <button type="button" className="px-5 py-2.5 text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer" onClick={() => setShowEditModal(null)}>Cancel</button>
                <button type="submit" className="bg-primary hover:bg-primary/90 px-6 py-2.5 rounded-2xl font-bold text-xs text-foreground shadow-lg shadow-primary/25 btn-interactive cursor-pointer">Update Site</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🌟 INTERACTIVE GOOGLE MAP LOCATION PICKER MODAL 🌟 */}
      {/* ========================================================================= */}
      {showMapPicker && (
        <MapLocationPicker
          initialLat={mapPickerTarget === 'CREATE' ? (createData.latitude ? parseFloat(createData.latitude) : null) : (editData.latitude ? parseFloat(editData.latitude) : null)}
          initialLng={mapPickerTarget === 'CREATE' ? (createData.longitude ? parseFloat(createData.longitude) : null) : (editData.longitude ? parseFloat(editData.longitude) : null)}
          initialRadius={mapPickerTarget === 'CREATE' ? (createData.radiusMeters ? parseFloat(createData.radiusMeters) : 300) : (editData.radiusMeters ? parseFloat(editData.radiusMeters) : 300)}
          initialAddress={mapPickerTarget === 'CREATE' ? createData.location : editData.location}
          onSelect={handleMapLocationSelected}
          onClose={() => setShowMapPicker(false)}
        />
      )}

      {/* ========================================================================= */}
      {/* 🌟 ASSIGN STAFF MODAL 🌟 */}
      {/* ========================================================================= */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xl flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border/80 rounded-3xl p-8 w-full max-w-md shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black text-foreground">Assign Personnel</h2>
                <p className="text-muted-foreground text-xs font-medium">Allocate Site Manager or Workers to this project.</p>
              </div>
              <button onClick={() => setShowAssignModal(null)} className="w-9 h-9 rounded-2xl bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAssign} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Role Type</label>
                <select className="w-full bg-muted border border-border text-foreground px-4 py-3 rounded-2xl text-sm outline-none focus:border-primary transition-colors font-semibold" value={assignData.type} onChange={e => setAssignData({...assignData, type: e.target.value, userId: ''})}>
                  <option value="MANAGER">Site Manager (Replaces current manager)</option>
                  <option value="WORKER">Worker (Adds to site workforce)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Select Personnel</label>
                <select className="w-full bg-muted border border-border text-foreground px-4 py-3 rounded-2xl text-sm outline-none focus:border-primary transition-colors font-semibold" value={assignData.userId} onChange={e => setAssignData({...assignData, userId: e.target.value})} required>
                  <option value="">— Select personnel —</option>
                  {availableUsers.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} {u.idNumber ? `(#${u.idNumber})` : ''} {u.trade ? `[${u.trade}]` : ''} (@{u.username})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" className="px-5 py-2.5 text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer" onClick={() => setShowAssignModal(null)}>Cancel</button>
                <button type="submit" className="bg-primary hover:bg-primary/90 px-6 py-2.5 rounded-2xl font-bold text-xs text-foreground shadow-lg shadow-primary/25 btn-interactive cursor-pointer">Confirm Assignment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
