import { useEffect, useRef, useState } from 'react';
import { API } from '../../config/api';
import { 
  Users, 
  UserPlus, 
  Search, 
  Pencil, 
  Trash2, 
  DollarSign, 
  X, 
  Phone, 
  IdCard,
  Camera,
  ShieldCheck,
  Sparkles,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { detectFaceInCanvasAsync, loadFaceModels, averageDescriptors, findBestFaceMatch } from '../../utils/faceRecognition';

export default function WorkerManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  
  // Create Modal state
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ 
    name: '', 
    username: '', 
    password: '', 
    role: 'WORKER', 
    hourlyRate: '',
    idNumber: '',
    phone: '',
    avatarUrl: '',
    trade: 'General Laborer'
  });

  // Edit Modal state
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editData, setEditData] = useState({ 
    name: '', 
    username: '', 
    role: '', 
    hourlyRate: '',
    idNumber: '',
    phone: '',
    avatarUrl: '',
    trade: '',
    password: ''
  });

  // Face Enrollment Modal state for Worker
  const [enrollTargetUser, setEnrollTargetUser] = useState<any | null>(null);
  const [enrollCameraActive, setEnrollCameraActive] = useState(false);
  const [enrollModelLoading, setEnrollModelLoading] = useState(false);
  const [enrollError, setEnrollError] = useState('');
  const [faceDetected, setFaceDetected] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollProgress, setEnrollProgress] = useState(0);
  const [enrollStatusText, setEnrollStatusText] = useState('');
  const [toast, setToast] = useState({ show: false, type: '', text: '' });

  const enrollVideoRef = useRef<HTMLVideoElement>(null);
  const enrollCanvasRef = useRef<HTMLCanvasElement>(null);
  const enrollOverlayRef = useRef<HTMLCanvasElement>(null);
  const enrollStreamRef = useRef<MediaStream | null>(null);
  const isLoopRunningRef = useRef<boolean>(false);
  const isDetectingRef = useRef<boolean>(false);

  const showToast = (type: string, text: string) => {
    setToast({ show: true, type, text });
    setTimeout(() => setToast({ show: false, type: '', text: '' }), 4000);
  };

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
    loadFaceModels().catch(() => {});
    return () => {
      stopEnrollCamera();
    };
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
        setFormData({ 
          name: '', 
          username: '', 
          password: '', 
          role: 'WORKER', 
          hourlyRate: '',
          idNumber: '',
          phone: '',
          avatarUrl: '',
          trade: 'General Laborer'
        });
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

  // ─── Direct Admin Face Enrollment for Worker ───
  const stopEnrollCamera = () => {
    isLoopRunningRef.current = false;
    enrollStreamRef.current?.getTracks().forEach(t => t.stop());
    enrollStreamRef.current = null;
    setEnrollCameraActive(false);
    setFaceDetected(false);
  };

  const startEnrollCamera = async () => {
    setEnrollError('');
    setEnrollModelLoading(true);
    setEnrollProgress(0);
    setEnrollStatusText('');
    try {
      await loadFaceModels();
      setEnrollModelLoading(false);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
      enrollStreamRef.current = stream;
      setEnrollCameraActive(true);
      isLoopRunningRef.current = true;

      setTimeout(() => {
        if (enrollVideoRef.current) {
          enrollVideoRef.current.srcObject = stream;
          enrollVideoRef.current.play().then(() => {
            runEnrollDetectionLoop();
          }).catch(() => {});
        }
      }, 150);
    } catch (err: any) {
      setEnrollModelLoading(false);
      setEnrollError(err.message || 'Camera access error');
    }
  };

  const runEnrollDetectionLoop = async () => {
    if (!isLoopRunningRef.current) return;
    const video = enrollVideoRef.current;
    const canvas = enrollCanvasRef.current;
    const overlay = enrollOverlayRef.current;
    if (!video || !canvas || !overlay || video.paused || video.ended) {
      if (isLoopRunningRef.current) {
        requestAnimationFrame(runEnrollDetectionLoop);
      }
      return;
    }

    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    canvas.width = w;
    canvas.height = h;
    overlay.width = w;
    overlay.height = h;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const octx = overlay.getContext('2d');

    if (ctx && octx && !isDetectingRef.current) {
      isDetectingRef.current = true;
      try {
        ctx.drawImage(video, 0, 0, w, h);
        const detection = await detectFaceInCanvasAsync(canvas, 416);

        octx.clearRect(0, 0, w, h);

        if (detection && detection.score >= 0.32) {
          setFaceDetected(true);
          const { box, landmarks } = detection;

          octx.lineWidth = 2.5;
          octx.strokeStyle = '#10b981';
          octx.fillStyle = 'rgba(16, 185, 129, 0.1)';
          octx.strokeRect(box.x, box.y, box.width, box.height);
          octx.fillRect(box.x, box.y, box.width, box.height);

          // Corner brackets
          const cSize = 16;
          octx.lineWidth = 3.5;
          octx.strokeStyle = '#34d399';

          octx.beginPath();
          octx.moveTo(box.x, box.y + cSize);
          octx.lineTo(box.x, box.y);
          octx.lineTo(box.x + cSize, box.y);
          octx.stroke();

          octx.beginPath();
          octx.moveTo(box.x + box.width - cSize, box.y);
          octx.lineTo(box.x + box.width, box.y);
          octx.lineTo(box.x + box.width, box.y + cSize);
          octx.stroke();

          octx.beginPath();
          octx.moveTo(box.x, box.y + box.height - cSize);
          octx.lineTo(box.x, box.y + box.height);
          octx.lineTo(box.x + cSize, box.y + box.height);
          octx.stroke();

          octx.beginPath();
          octx.moveTo(box.x + box.width - cSize, box.y + box.height);
          octx.lineTo(box.x + box.width, box.y + box.height);
          octx.lineTo(box.x + box.width, box.y + box.height - cSize);
          octx.stroke();

          if (landmarks?.positions) {
            octx.fillStyle = '#38bdf8';
            for (let i = 0; i < landmarks.positions.length; i += 3) {
              const pt = landmarks.positions[i];
              octx.beginPath();
              octx.arc(pt.x, pt.y, 2, 0, Math.PI * 2);
              octx.fill();
            }
          }

          octx.fillStyle = '#059669';
          octx.fillRect(box.x, Math.max(0, box.y - 24), 130, 22);
          octx.fillStyle = '#ffffff';
          octx.font = 'bold 11px sans-serif';
          octx.fillText('✓ Face Detected', box.x + 6, Math.max(15, box.y - 8));
        } else {
          setFaceDetected(false);
        }
      } catch (err) {
        console.error('[FaceAI Loop Error]', err);
      } finally {
        isDetectingRef.current = false;
      }
    }

    if (isLoopRunningRef.current) {
      requestAnimationFrame(runEnrollDetectionLoop);
    }
  };

  const handleCaptureAndSaveWorkerFace = async () => {
    if (!enrollTargetUser) return;
    const video = enrollVideoRef.current;
    const canvas = enrollCanvasRef.current;
    if (!video || !canvas) return;

    setEnrolling(true);
    setEnrollProgress(10);
    setEnrollStatusText('Capturing biometric samples...');

    try {
      const descriptors: number[][] = [];
      const totalSamples = 3;
      let snapshot = '';

      for (let i = 1; i <= totalSamples; i++) {
        setEnrollProgress(Math.round((i / totalSamples) * 80));
        setEnrollStatusText(`Extracting frame ${i} of ${totalSamples}...`);

        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

        const detection = await detectFaceInCanvasAsync(canvas, 416);
        if (detection && detection.descriptor && detection.descriptor.length === 128) {
          descriptors.push(detection.descriptor);
          if (i === 1 || !snapshot) {
            snapshot = canvas.toDataURL('image/jpeg', 0.88);
          }
        }
        await new Promise(r => setTimeout(r, 200));
      }

      if (descriptors.length === 0) {
        setEnrollError('No clear face detected. Ensure the worker is facing the camera directly.');
        setEnrolling(false);
        return;
      }

      setEnrollProgress(95);
      setEnrollStatusText('Saving biometric template...');

      const averaged = averageDescriptors(descriptors);

      // Prevent enrolling the same face for two different workers (Duplicate Face Check)
      const otherEnrolledWorkers: any[] = [];
      for (const u of users) {
        if (u.id === enrollTargetUser.id || !u.isFaceEnrolled || !u.faceDescriptor) continue;
        try {
          const parsed = typeof u.faceDescriptor === 'string' ? JSON.parse(u.faceDescriptor) : u.faceDescriptor;
          if (Array.isArray(parsed) && parsed.length === 128) {
            otherEnrolledWorkers.push({
              id: u.id,
              name: u.name,
              username: u.username,
              idNumber: u.idNumber,
              phone: u.phone,
              avatarUrl: u.avatarUrl,
              isFaceEnrolled: true,
              faceDescriptor: parsed,
            });
          }
        } catch {}
      }

      const duplicate = findBestFaceMatch(averaged, otherEnrolledWorkers, 60, 0.52);
      if (duplicate) {
        setEnrollError(
          `⚠️ Duplicate Face Detected: This exact face is already enrolled for "${duplicate.worker.name}" (ID: #${duplicate.worker.idNumber || duplicate.worker.username}) with ${duplicate.confidence}% similarity. Two workers cannot share the same face biometrics!`
        );
        setEnrolling(false);
        return;
      }

      const token = localStorage.getItem('token');
      const res = await fetch(API.user(enrollTargetUser.id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          avatarUrl: snapshot || enrollTargetUser.avatarUrl,
          faceDescriptor: JSON.stringify(averaged),
        }),
      });

      if (res.ok) {
        stopEnrollCamera();
        setEnrollTargetUser(null);
        showToast('success', `🎉 Face Biometrics enrolled for ${enrollTargetUser.name}!`);
        fetchUsers();
      } else {
        const err = await res.json();
        setEnrollError(err.error || 'Failed to save biometric enrollment');
      }
    } catch {
      setEnrollError('Network error while saving biometrics');
    } finally {
      setEnrolling(false);
      setEnrollProgress(0);
      setEnrollStatusText('');
    }
  };

  const handleResetFaceBiometrics = async (targetUser: any) => {
    if (!confirm(`Are you sure you want to reset/remove enrolled face biometrics for "${targetUser.name}"? They will need to re-enroll before taking auto face attendance.`)) {
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API.user(targetUser.id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ faceDescriptor: '' }),
      });
      if (res.ok) {
        showToast('success', `Face biometrics cleared for ${targetUser.name}`);
        fetchUsers();
      } else {
        const err = await res.json();
        showToast('error', err.error || 'Failed to clear face biometrics');
      }
    } catch {
      showToast('error', 'Network error while clearing face biometrics');
    }
  };

  const filteredUsers = users.filter(u => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      (u.name && u.name.toLowerCase().includes(term)) || 
      (u.username && u.username.toLowerCase().includes(term)) ||
      (u.idNumber && u.idNumber.toLowerCase().includes(term)) ||
      (u.phone && u.phone.toLowerCase().includes(term));
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'MANAGER':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'SITE_MANAGER':
        return 'bg-primary/10 text-primary border-primary/30';
      default:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 bg-card border border-border rounded-3xl">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground text-xs font-semibold">Syncing workforce records...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      {/* Toast Alert */}
      {toast.show && (
        <div className="fixed top-6 right-6 z-50 px-5 py-3.5 rounded-2xl font-bold text-xs shadow-2xl border bg-emerald-500 text-slate-950 border-emerald-400 animate-in slide-in-from-top-2 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toast.text}</span>
        </div>
      )}

      {/* Header, Search & Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 rounded-3xl border border-border shadow-xl">
        <div>
          <h1 className="text-2xl font-black text-foreground">Staff & Workforce</h1>
          <p className="text-muted-foreground text-xs mt-0.5">Manage personnel, face biometrics, credentials, and wages.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Role Filter */}
          <select 
            value={roleFilter} 
            onChange={e => setRoleFilter(e.target.value)}
            className="bg-muted border border-border text-foreground px-3.5 py-2.5 rounded-2xl text-xs outline-none focus:border-primary transition-all font-semibold"
          >
            <option value="ALL">All Roles ({users.length})</option>
            <option value="WORKER">Workers</option>
            <option value="SITE_MANAGER">Site Managers</option>
            <option value="MANAGER">Managers</option>
            <option value="OWNER">Owners</option>
          </select>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search by name, ID, phone..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-muted border border-border text-foreground pl-9 pr-4 py-2.5 rounded-2xl text-xs outline-none focus:border-primary transition-all w-52 sm:w-64"
            />
          </div>

          <button 
            className="bg-primary hover:bg-primary/90 text-foreground px-5 py-2.5 rounded-2xl font-bold text-xs transition-all shadow-lg shadow-primary/25 flex items-center gap-1.5 hover:scale-105 active:scale-95 flex-shrink-0 btn-interactive"
            onClick={() => setShowModal(true)}
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Personnel</span>
          </button>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/80 border-b border-border">
                <th className="p-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-6">Personnel & ID</th>
                <th className="p-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Face Biometrics</th>
                <th className="p-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Contact Phone</th>
                <th className="p-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Role</th>
                <th className="p-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Status</th>
                <th className="p-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.map(u => (
                <tr key={u.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3.5">
                      {/* Avatar Image or Initial Fallback */}
                      <div className="w-11 h-11 rounded-2xl overflow-hidden border border-border bg-gradient-to-tr from-muted to-secondary flex items-center justify-center flex-shrink-0 shadow-sm relative group">
                        {u.avatarUrl ? (
                          <img 
                            src={u.avatarUrl} 
                            alt={u.name} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <span className="font-black text-foreground text-sm">
                            {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground text-sm">{u.name}</span>
                          <span className="text-[10px] font-black font-mono text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-lg flex items-center gap-1">
                            <IdCard className="w-3 h-3" />
                            <span>{u.idNumber || 'NO ID'}</span>
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground font-medium flex items-center gap-2 mt-0.5 flex-wrap">
                          <span>@{u.username}</span>
                          {u.trade && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-secondary text-foreground border border-border">
                              {u.trade}
                            </span>
                          )}
                          {u.role === 'WORKER' && (
                            <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-0.5">
                              <DollarSign className="w-3 h-3" />
                              <span>{u.hourlyRate ? `${u.hourlyRate.toFixed(2)}/hr` : 'Rate Not Set'}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Face Biometrics Status Pill + Direct Enrollment Trigger */}
                  <td className="p-4">
                    {u.isFaceEnrolled ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEnrollTargetUser(u);
                            startEnrollCamera();
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all cursor-pointer"
                          title="Face template active. Click to re-scan."
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Enrolled ✓</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResetFaceBiometrics(u)}
                          className="p-1 rounded-lg text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Clear / Remove Enrolled Face"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setEnrollTargetUser(u);
                          startEnrollCamera();
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-all active:scale-95 cursor-pointer"
                        title="Click to scan and register face biometrics"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Enroll Face</span>
                      </button>
                    )}
                  </td>

                  <td className="p-4">
                    {u.phone ? (
                      <a 
                        href={`tel:${u.phone}`} 
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground hover:text-primary transition-colors bg-muted px-3 py-1.5 rounded-xl border border-border hover:border-primary/40"
                      >
                        <Phone className="w-3.5 h-3.5 text-primary" />
                        <span>{u.phone}</span>
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground/60 italic">No phone</span>
                    )}
                  </td>

                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border ${getRoleBadge(u.role)}`}>
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>

                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase border inline-flex items-center gap-1.5 ${
                      u.isApproved 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : 'bg-primary/10 text-primary border-primary/20'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${u.isApproved ? 'bg-emerald-400' : 'bg-primary animate-pulse'}`} />
                      <span>{u.isApproved ? 'Approved' : 'Pending Approval'}</span>
                    </span>
                  </td>

                  <td className="p-4 pr-6 text-right">
                    <div className="flex justify-end gap-2 items-center">
                      {!u.isApproved && (
                        <button 
                          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all shadow-md shadow-emerald-500/20 hover:scale-105 active:scale-95 flex items-center gap-1 cursor-pointer" 
                          onClick={() => handleApprove(u.id)}
                          title="Approve Worker"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                      )}

                      <button 
                        className="px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-foreground border border-primary/30 flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95 cursor-pointer" 
                        onClick={() => { 
                          setEditingUser(u); 
                          setEditData({ 
                            name: u.name, 
                            username: u.username, 
                            role: u.role, 
                            hourlyRate: u.hourlyRate || '',
                            idNumber: u.idNumber || '',
                            phone: u.phone || '',
                            avatarUrl: u.avatarUrl || '',
                            trade: u.trade || '',
                            password: ''
                          }); 
                        }}
                        title="Edit User Profile"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      <button 
                        className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-600 text-rose-600 dark:text-rose-400 hover:text-white border border-rose-500/30 hover:border-rose-600 flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm" 
                        onClick={() => handleDelete(u.id)}
                        title="Delete User"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto opacity-20 mb-3" />
                    <p className="text-sm font-semibold">No personnel found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl p-8 w-full max-w-lg shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black text-foreground">Create New Personnel</h2>
                <p className="text-muted-foreground text-xs">Register worker or manager with role-based ID and trade details.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Full Name</label>
                  <input className="w-full bg-muted border border-border text-foreground px-4 py-3 rounded-2xl text-sm outline-none focus:border-primary transition-colors" type="text" placeholder="e.g. Md. Rahim" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">
                    ID / Card Number
                    <span className="text-[10px] text-primary ml-1 font-normal">
                      {formData.role === 'WORKER' ? '(8 Digits: 11XXXXXX)' : formData.role === 'SITE_MANAGER' ? '(8 Digits: 22XXXXXX)' : '(8 Digits: 33XXXXXX)'}
                    </span>
                  </label>
                  <input 
                    className="w-full bg-muted border border-border text-foreground px-4 py-3 rounded-2xl text-sm outline-none focus:border-primary transition-colors font-mono" 
                    type="text" 
                    placeholder={formData.role === 'WORKER' ? 'e.g. 11000001 (Blank for auto)' : formData.role === 'SITE_MANAGER' ? 'e.g. 22000001 (Blank for auto)' : 'e.g. 33000001 (Blank for auto)'} 
                    value={formData.idNumber} 
                    onChange={e => setFormData({...formData, idNumber: e.target.value})} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">
                    Username / Login ID
                    <span className="text-[10px] text-primary ml-1 font-normal">(Defaults to ID Number)</span>
                  </label>
                  <input 
                    className="w-full bg-muted border border-border text-foreground px-4 py-3 rounded-2xl text-sm outline-none focus:border-primary transition-colors font-mono" 
                    type="text" 
                    placeholder="e.g. 11000001 (Blank = same as ID)" 
                    value={formData.username} 
                    onChange={e => setFormData({...formData, username: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Contact Phone Number</label>
                  <input className="w-full bg-muted border border-border text-foreground px-4 py-3 rounded-2xl text-sm outline-none focus:border-primary transition-colors" type="text" placeholder="e.g. +880 1712-345678" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>

              {/* Trade / Work Assignment (কার কি কাজ) */}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">
                  Work / Trade / Designation (কার কি কাজ)
                </label>
                <div className="flex gap-2">
                  <select 
                    className="w-1/2 bg-muted border border-border text-foreground px-3 py-3 rounded-2xl text-xs outline-none focus:border-primary font-semibold"
                    value={formData.trade}
                    onChange={e => setFormData({...formData, trade: e.target.value})}
                  >
                    <option value="General Laborer">General Laborer (সাধারণ শ্রমিক)</option>
                    <option value="Mason (রাজমিস্ত্রি)">Mason (রাজমিস্ত্রি)</option>
                    <option value="Electrician (ইলেকট্রিশিয়ান)">Electrician (ইলেকট্রিশিয়ান)</option>
                    <option value="Rod Binder (রড মিস্ত্রি)">Rod Binder (রড মিস্ত্রি)</option>
                    <option value="Carpenter (কাঠমিস্ত্রি)">Carpenter (কাঠমিস্ত্রি)</option>
                    <option value="Tile Setter (টাইলস মিস্ত্রি)">Tile Setter (টাইলস মিস্ত্রি)</option>
                    <option value="Plumber (প্লাম্বার)">Plumber (প্লাম্বার)</option>
                    <option value="Painter (পেইন্টার)">Painter (পেইন্টার)</option>
                    <option value="Welder (ওয়েল্ডার)">Welder (ওয়েল্ডার)</option>
                    <option value="Equipment Operator">Equipment Operator (অপারেটর)</option>
                    <option value="Foreman / Supervisor">Foreman / Supervisor (ফোরম্যান)</option>
                    <option value="Site Manager & Engineer">Site Manager & Engineer</option>
                  </select>
                  <input 
                    className="w-1/2 bg-muted border border-border text-foreground px-3 py-3 rounded-2xl text-xs outline-none focus:border-primary font-semibold"
                    type="text"
                    placeholder="Or type custom trade..."
                    value={formData.trade}
                    onChange={e => setFormData({...formData, trade: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Profile Picture (Image URL)</label>
                <div className="flex gap-3 items-center">
                  <input className="flex-1 bg-muted border border-border text-foreground px-4 py-3 rounded-2xl text-sm outline-none focus:border-primary transition-colors" type="url" placeholder="https://images.unsplash.com/..." value={formData.avatarUrl} onChange={e => setFormData({...formData, avatarUrl: e.target.value})} />
                  {formData.avatarUrl && (
                    <div className="w-11 h-11 rounded-2xl overflow-hidden border border-border flex-shrink-0 bg-muted">
                      <img src={formData.avatarUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Role</label>
                  <select className="w-full bg-muted border border-border text-foreground px-4 py-3 rounded-2xl text-sm outline-none focus:border-primary transition-colors font-semibold" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                    <option value="WORKER">Worker (ID: 11XXXX)</option>
                    <option value="SITE_MANAGER">Site Manager (ID: 22XXX)</option>
                    <option value="MANAGER">General Manager (ID: 33XX)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Initial Password</label>
                  <input className="w-full bg-muted border border-border text-foreground px-4 py-3 rounded-2xl text-sm outline-none focus:border-primary transition-colors" type="password" placeholder="••••••••" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
                </div>
              </div>

              {formData.role === 'WORKER' && (
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Hourly Wage Rate ($ / hr)</label>
                  <input className="w-full bg-muted border border-border text-foreground px-4 py-3 rounded-2xl text-sm outline-none focus:border-primary transition-colors" type="number" step="0.01" placeholder="e.g. 15.00" value={formData.hourlyRate} onChange={e => setFormData({...formData, hourlyRate: e.target.value})} required />
                </div>
              )}

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border">
                <button type="button" className="px-5 py-2.5 text-xs font-bold text-muted-foreground hover:text-foreground" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="bg-primary hover:bg-primary/90 px-6 py-2.5 rounded-2xl font-bold text-xs text-foreground shadow-lg shadow-primary/25 btn-interactive">Create Personnel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl p-8 w-full max-w-lg shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black text-foreground">Edit Personnel Profile</h2>
                <p className="text-muted-foreground text-xs">Update identification, photo, phone, trade, and role assignments.</p>
              </div>
              <button onClick={() => setEditingUser(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Full Name</label>
                  <input className="w-full bg-muted border border-border text-foreground px-4 py-3 rounded-2xl text-sm outline-none focus:border-primary transition-colors" type="text" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} required />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">
                    ID / Card Number
                    <span className="text-[10px] text-primary ml-1 font-normal">
                      {editData.role === 'WORKER' ? '(8 Digits: 11XXXXXX)' : editData.role === 'SITE_MANAGER' ? '(8 Digits: 22XXXXXX)' : '(8 Digits: 33XXXXXX)'}
                    </span>
                  </label>
                  <input 
                    className="w-full bg-muted border border-border text-foreground px-4 py-3 rounded-2xl text-sm outline-none focus:border-primary transition-colors font-mono" 
                    type="text" 
                    placeholder={editData.role === 'WORKER' ? 'e.g. 11000001' : editData.role === 'SITE_MANAGER' ? 'e.g. 22000001' : 'e.g. 33000001'} 
                    value={editData.idNumber} 
                    onChange={e => setEditData({...editData, idNumber: e.target.value})} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Username</label>
                  <input className="w-full bg-muted border border-border text-foreground px-4 py-3 rounded-2xl text-sm outline-none focus:border-primary transition-colors" type="text" value={editData.username} onChange={e => setEditData({...editData, username: e.target.value})} required />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Contact Phone Number</label>
                  <input className="w-full bg-muted border border-border text-foreground px-4 py-3 rounded-2xl text-sm outline-none focus:border-primary transition-colors" type="text" placeholder="e.g. +880 1712-345678" value={editData.phone} onChange={e => setEditData({...editData, phone: e.target.value})} />
                </div>
              </div>

              {/* Trade / Work Assignment (কার কি কাজ) */}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">
                  Work / Trade / Designation (কার কি কাজ)
                </label>
                <div className="flex gap-2">
                  <select 
                    className="w-1/2 bg-muted border border-border text-foreground px-3 py-3 rounded-2xl text-xs outline-none focus:border-primary font-semibold"
                    value={editData.trade}
                    onChange={e => setEditData({...editData, trade: e.target.value})}
                  >
                    <option value="General Laborer">General Laborer (সাধারণ শ্রমিক)</option>
                    <option value="Mason (রাজমিস্ত্রি)">Mason (রাজমিস্ত্রি)</option>
                    <option value="Electrician (ইলেকট্রিশিয়ান)">Electrician (ইলেকট্রিশিয়ান)</option>
                    <option value="Rod Binder (রড মিস্ত্রি)">Rod Binder (রড মিস্ত্রি)</option>
                    <option value="Carpenter (কাঠমিস্ত্রি)">Carpenter (কাঠমিস্ত্রি)</option>
                    <option value="Tile Setter (টাইলস মিস্ত্রি)">Tile Setter (টাইলস মিস্ত্রি)</option>
                    <option value="Plumber (প্লাম্বার)">Plumber (প্লাম্বার)</option>
                    <option value="Painter (পেইন্টার)">Painter (পেইন্টার)</option>
                    <option value="Welder (ওয়েল্ডার)">Welder (ওয়েল্ডার)</option>
                    <option value="Equipment Operator">Equipment Operator (অপারেটর)</option>
                    <option value="Foreman / Supervisor">Foreman / Supervisor (ফোরম্যান)</option>
                    <option value="Site Manager & Engineer">Site Manager & Engineer</option>
                  </select>
                  <input 
                    className="w-1/2 bg-muted border border-border text-foreground px-3 py-3 rounded-2xl text-xs outline-none focus:border-primary font-semibold"
                    type="text"
                    placeholder="Or type custom trade..."
                    value={editData.trade}
                    onChange={e => setEditData({...editData, trade: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Profile Picture (Image URL)</label>
                <div className="flex gap-3 items-center">
                  <input className="flex-1 bg-muted border border-border text-foreground px-4 py-3 rounded-2xl text-sm outline-none focus:border-primary transition-colors" type="url" placeholder="https://images.unsplash.com/..." value={editData.avatarUrl} onChange={e => setEditData({...editData, avatarUrl: e.target.value})} />
                  {editData.avatarUrl && (
                    <div className="w-11 h-11 rounded-2xl overflow-hidden border border-border flex-shrink-0 bg-muted">
                      <img src={editData.avatarUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Role</label>
                  <select className="w-full bg-muted border border-border text-foreground px-4 py-3 rounded-2xl text-sm outline-none focus:border-primary transition-colors font-semibold" value={editData.role} onChange={e => setEditData({...editData, role: e.target.value})}>
                    <option value="WORKER">Worker</option>
                    <option value="SITE_MANAGER">Site Manager</option>
                    <option value="MANAGER">General Manager</option>
                    <option value="OWNER">Owner</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Change Password (Leave blank to keep)</label>
                  <input className="w-full bg-muted border border-border text-foreground px-4 py-3 rounded-2xl text-sm outline-none focus:border-primary transition-colors" type="password" placeholder="New Password" value={editData.password} onChange={e => setEditData({...editData, password: e.target.value})} />
                </div>
              </div>

              {editData.role === 'WORKER' && (
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Hourly Wage Rate ($ / hr)</label>
                  <input className="w-full bg-muted border border-border text-foreground px-4 py-3 rounded-2xl text-sm outline-none focus:border-primary transition-colors" type="number" step="0.01" value={editData.hourlyRate} onChange={e => setEditData({...editData, hourlyRate: e.target.value})} required />
                </div>
              )}

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border">
                <button type="button" className="px-5 py-2.5 text-xs font-bold text-muted-foreground hover:text-foreground" onClick={() => setEditingUser(null)}>Cancel</button>
                <button type="submit" className="bg-primary hover:bg-primary/90 px-6 py-2.5 rounded-2xl font-bold text-xs text-foreground shadow-lg shadow-primary/25 btn-interactive">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DIRECT FACE ENROLLMENT MODAL */}
      {enrollTargetUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl animate-scale-in flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-black text-primary uppercase tracking-widest mb-0.5">
                  <Camera className="w-4 h-4" />
                  <span>Biometric Scanner</span>
                </div>
                <h2 className="text-xl font-black text-foreground">Enroll Face for {enrollTargetUser.name}</h2>
                <p className="text-muted-foreground text-xs">@{enrollTargetUser.username} · #{enrollTargetUser.idNumber || 'NO ID'}</p>
              </div>
              <button 
                onClick={() => { stopEnrollCamera(); setEnrollTargetUser(null); }} 
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Preview Box */}
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black/95 border border-border flex items-center justify-center shadow-inner">
              {enrollCameraActive ? (
                <>
                  <video ref={enrollVideoRef} playsInline muted className="w-full h-full object-cover" />
                  <canvas ref={enrollCanvasRef} className="hidden" />
                  <canvas ref={enrollOverlayRef} className="absolute inset-0 w-full h-full pointer-events-none" />

                  {/* Face Guide Oval */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className={`w-36 h-48 rounded-[50%] border-2 ${
                      faceDetected ? 'border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.4)]' : 'border-primary/60 border-dashed animate-pulse'
                    } transition-all duration-300 relative flex items-center justify-center`}>
                      <div className="absolute top-2 text-[9px] font-black uppercase text-foreground bg-black/70 px-2 py-0.5 rounded-full">
                        {faceDetected ? 'Face Aligned ✓' : 'Center Face in Frame'}
                      </div>
                    </div>
                  </div>

                  {enrolling && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2.5 p-6 text-center animate-in fade-in">
                      <Loader2 className="w-8 h-8 text-primary animate-spin" />
                      <div className="w-44 bg-muted rounded-full h-2 overflow-hidden border border-border">
                        <div className="bg-primary h-full transition-all duration-300" style={{ width: `${enrollProgress}%` }} />
                      </div>
                      <p className="text-xs font-bold text-foreground">{enrollStatusText}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 text-center p-6">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xl">
                    📸
                  </div>
                  <p className="text-foreground font-bold text-xs">Camera Offline</p>
                  <p className="text-muted-foreground text-[11px] max-w-xs">
                    Activate camera to capture and compute this worker's 128D neural facial descriptor.
                  </p>
                </div>
              )}
            </div>

            {enrollError && (
              <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-semibold">
                {enrollError}
              </div>
            )}

            <div className="flex gap-2.5 pt-2">
              {!enrollCameraActive ? (
                <button
                  type="button"
                  onClick={startEnrollCamera}
                  disabled={enrollModelLoading}
                  className="w-full bg-primary hover:bg-primary/90 text-foreground py-3 rounded-2xl font-bold text-xs transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
                >
                  {enrollModelLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  <span>{enrollModelLoading ? 'Loading AI Engine...' : 'Open Camera & Scan'}</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => { stopEnrollCamera(); setEnrollTargetUser(null); }}
                    className="px-4 py-3 bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground rounded-2xl font-bold text-xs border border-border"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCaptureAndSaveWorkerFace}
                    disabled={enrolling || !faceDetected}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 py-3 rounded-2xl font-black text-xs transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{enrolling ? 'Enrolling Biometrics...' : 'Capture & Save Biometrics'}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
