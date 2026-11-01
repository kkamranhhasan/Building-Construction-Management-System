import { useEffect, useState } from 'react';
import { API } from '../../config/api';
import { 
  Building2, 
  HardHat, 
  Search, 
  MapPin, 
  ChevronDown, 
  ChevronUp,
  Phone,
  IdCard
} from 'lucide-react';

interface Worker {
  id: string;
  name: string;
  username: string;
  idNumber: string | null;
  phone: string | null;
  avatarUrl: string | null;
  hourlyRate: number | null;
  isApproved: boolean;
  isFaceEnrolled?: boolean;
  faceDescriptor?: string | null;
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

  const filteredGroups = siteGroups
    .filter(sg => selectedSite === 'all' || sg.id === selectedSite)
    .map(sg => ({
      ...sg,
      workers: sg.workers.filter(w => {
        const term = searchTerm.toLowerCase();
        return (
          (w.name && w.name.toLowerCase().includes(term)) ||
          (w.username && w.username.toLowerCase().includes(term)) ||
          (w.idNumber && w.idNumber.toLowerCase().includes(term)) ||
          (w.phone && w.phone.toLowerCase().includes(term))
        );
      }),
    }))
    .filter(sg => sg.workers.length > 0);

  const totalWorkers = siteGroups.reduce((acc, sg) => acc + sg.workers.length, 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 bg-card border border-border rounded-3xl">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground text-xs font-semibold">Loading assigned workforce...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="bg-card border border-border p-6 rounded-3xl shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest mb-1">
              <HardHat className="w-4 h-4" />
              <span>Field Workforce Overview</span>
            </div>
            <h1 className="text-2xl font-black text-foreground">My Site Workers</h1>
            <p className="text-muted-foreground text-xs mt-0.5">
              Supervising <span className="text-primary font-bold">{totalWorkers} worker(s)</span> across <span className="text-primary font-bold">{siteGroups.length} assigned site(s)</span>.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Site Filter */}
            <select
              className="bg-muted border border-border text-foreground px-4 py-2.5 rounded-2xl text-xs outline-none focus:border-primary transition-all font-semibold"
              value={selectedSite}
              onChange={e => setSelectedSite(e.target.value)}
            >
              <option value="all">All Assigned Sites</option>
              {siteGroups.map(sg => (
                <option key={sg.id} value={sg.id}>
                  {sg.name} ({sg.workers.length} workers)
                </option>
              ))}
            </select>
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, ID, phone..."
                className="bg-muted border border-border text-foreground pl-9 pr-4 py-2.5 rounded-2xl text-xs outline-none focus:border-primary transition-all w-full sm:w-60"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-3xl p-5 shadow-xl">
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-1">Assigned Sites</p>
          <p className="text-3xl font-black text-foreground">{siteGroups.length}</p>
        </div>
        <div className="bg-card border border-border rounded-3xl p-5 shadow-xl">
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-1">Total Workers</p>
          <p className="text-3xl font-black text-primary">{totalWorkers}</p>
        </div>
        <div className="bg-card border border-border rounded-3xl p-5 shadow-xl">
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-1">Approved</p>
          <p className="text-3xl font-black text-emerald-400">
            {siteGroups.reduce((acc, sg) => acc + sg.workers.filter(w => w.isApproved).length, 0)}
          </p>
        </div>
        <div className="bg-card border border-border rounded-3xl p-5 shadow-xl">
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider mb-1">Pending</p>
          <p className="text-3xl font-black text-primary">
            {siteGroups.reduce((acc, sg) => acc + sg.workers.filter(w => !w.isApproved).length, 0)}
          </p>
        </div>
      </div>

      {/* Worker Groups */}
      {filteredGroups.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-3xl p-14 text-center">
          <HardHat className="w-12 h-12 mx-auto opacity-20 mb-3" />
          <h3 className="text-lg font-bold text-foreground mb-1">No workers found</h3>
          <p className="text-muted-foreground text-xs max-w-md mx-auto">
            {totalWorkers === 0
              ? 'No workers have been allocated to your sites yet. Request management to assign workers to your site.'
              : 'No workers match your current search query.'}
          </p>
        </div>
      ) : (
        filteredGroups.map(sg => (
          <div key={sg.id} className="bg-card border border-border rounded-3xl overflow-hidden shadow-xl">
            {/* Site Header */}
            <div className="bg-muted/70 border-b border-border px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center text-primary font-bold text-sm">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-foreground font-black text-sm">{sg.name}</h2>
                  <p className="text-muted-foreground text-xs flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-primary" />
                    <span>{sg.location}</span>
                  </p>
                </div>
              </div>
              <span className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-xs font-bold">
                {sg.workers.length} Worker{sg.workers.length !== 1 ? 's' : ''} Assigned
              </span>
            </div>

            {/* Workers Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/40">
                    <th className="px-6 py-3.5 text-[10px] font-black text-muted-foreground uppercase tracking-wider">Worker & ID</th>
                    <th className="px-6 py-3.5 text-[10px] font-black text-muted-foreground uppercase tracking-wider">Face Biometrics</th>
                    <th className="px-6 py-3.5 text-[10px] font-black text-muted-foreground uppercase tracking-wider">Contact Phone</th>
                    <th className="px-6 py-3.5 text-[10px] font-black text-muted-foreground uppercase tracking-wider">Hourly Rate</th>
                    <th className="px-6 py-3.5 text-[10px] font-black text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3.5 text-[10px] font-black text-muted-foreground uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-3.5 text-[10px] font-black text-muted-foreground uppercase tracking-wider text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sg.workers.map(worker => (
                    <>
                      <tr
                        key={worker.id}
                        className="hover:bg-secondary/30 transition-colors cursor-pointer"
                        onClick={() => setExpandedWorker(expandedWorker === worker.id ? null : worker.id)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {/* Avatar */}
                            <div className="w-10 h-10 rounded-xl overflow-hidden border border-border bg-gradient-to-tr from-muted to-secondary flex items-center justify-center text-foreground font-bold text-sm flex-shrink-0">
                              {worker.avatarUrl ? (
                                <img src={worker.avatarUrl} alt={worker.name} className="w-full h-full object-cover" />
                              ) : (
                                <span>{worker.name.charAt(0).toUpperCase()}</span>
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-foreground text-sm">{worker.name}</span>
                              <span className="text-[10px] font-black font-mono text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-lg inline-flex items-center gap-1 mt-0.5 w-fit">
                                <IdCard className="w-3 h-3" />
                                <span>{worker.idNumber || '—'}</span>
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          {worker.isFaceEnrolled ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              <span>✓ Face Ready</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold bg-muted text-muted-foreground border border-border">
                              <span>⚠️ Not Enrolled</span>
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          {worker.phone ? (
                            <a
                              href={`tel:${worker.phone}`}
                              onClick={e => e.stopPropagation()}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground hover:text-primary transition-colors bg-muted px-3 py-1.5 rounded-xl border border-border hover:border-primary/40"
                            >
                              <Phone className="w-3.5 h-3.5 text-primary" />
                              <span>{worker.phone}</span>
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground/60 italic">No phone</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {worker.hourlyRate != null ? (
                            <span className="text-emerald-400 font-black text-xs">${worker.hourlyRate.toFixed(2)}/hr</span>
                          ) : (
                            <span className="text-muted-foreground text-xs">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase border ${
                              worker.isApproved
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-primary/10 text-primary border-primary/20'
                            }`}
                          >
                            {worker.isApproved ? 'Approved' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground text-xs">
                          {new Date(worker.createdAt).toLocaleDateString('en-US', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-primary hover:text-primary/80 text-xs font-bold inline-flex items-center gap-1">
                            <span>{expandedWorker === worker.id ? 'Hide' : 'View'}</span>
                            {expandedWorker === worker.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Worker Details */}
                      {expandedWorker === worker.id && (
                        <tr key={`${worker.id}-expanded`} className="bg-muted/60">
                          <td colSpan={6} className="px-6 py-5">
                            <div className="flex gap-5 items-start">
                              {/* Large Avatar */}
                              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-primary/30 flex-shrink-0 bg-muted flex items-center justify-center text-3xl font-black text-foreground shadow-lg">
                                {worker.avatarUrl ? (
                                  <img src={worker.avatarUrl} alt={worker.name} className="w-full h-full object-cover" />
                                ) : (
                                  <span>{worker.name.charAt(0).toUpperCase()}</span>
                                )}
                              </div>
                              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="bg-secondary/80 rounded-2xl p-4 border border-border">
                                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Employee ID</p>
                                  <p className="text-primary font-black text-sm font-mono">{worker.idNumber || '—'}</p>
                                </div>
                                <div className="bg-secondary/80 rounded-2xl p-4 border border-border">
                                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Contact Phone</p>
                                  {worker.phone ? (
                                    <a href={`tel:${worker.phone}`} className="text-foreground hover:text-primary font-semibold text-sm flex items-center gap-1.5">
                                      <Phone className="w-3.5 h-3.5 text-primary" />
                                      {worker.phone}
                                    </a>
                                  ) : (
                                    <p className="text-muted-foreground text-xs italic">No phone registered</p>
                                  )}
                                </div>
                                <div className="bg-secondary/80 rounded-2xl p-4 border border-border">
                                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Hourly Wage</p>
                                  <p className="text-emerald-400 font-black text-base">
                                    {worker.hourlyRate != null ? `$${worker.hourlyRate.toFixed(2)}/hr` : 'Not set'}
                                  </p>
                                </div>
                                <div className="bg-secondary/80 rounded-2xl p-4 border border-border">
                                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Approval Status</p>
                                  <p className={`text-xs font-black uppercase ${worker.isApproved ? 'text-emerald-400' : 'text-primary'}`}>
                                    {worker.isApproved ? 'Approved for Site' : 'Pending Verification'}
                                  </p>
                                </div>
                                <div className="bg-secondary/80 rounded-2xl p-4 border border-border">
                                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Assigned Site</p>
                                  <p className="text-foreground font-semibold text-sm">{sg.name}</p>
                                </div>
                                <div className="bg-secondary/80 rounded-2xl p-4 border border-border">
                                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Joined</p>
                                  <p className="text-foreground font-semibold text-xs">
                                    {new Date(worker.createdAt).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                    })}
                                  </p>
                                </div>
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

