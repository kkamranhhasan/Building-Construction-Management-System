import { useEffect, useRef, useState } from 'react';
import { API } from '../../config/api';
import { 
  User, 
  Camera, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  IdCard, 
  Sparkles, 
  KeyRound, 
  Loader2, 
  Check,
  X
} from 'lucide-react';
import { detectFaceInCanvasAsync, loadFaceModels, averageDescriptors } from '../../utils/faceRecognition';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, type: '', text: '' });
  const [modelLoading, setModelLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    avatarUrl: '',
    password: '',
    confirmPassword: '',
  });

  // Face Enrollment Camera State
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [faceDetected, setFaceDetected] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollProgress, setEnrollProgress] = useState(0);
  const [enrollStepText, setEnrollStepText] = useState('');
  const [capturedFaceSnapshot, setCapturedFaceSnapshot] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isDetectingRef = useRef<boolean>(false);
  const isLoopRunningRef = useRef<boolean>(false);
  const latestDetectionRef = useRef<any>(null);

  const showToast = (type: string, text: string) => {
    setToast({ show: true, type, text });
    setTimeout(() => setToast({ show: false, type: '', text: '' }), 4000);
  };

  const fetchProfile = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(API.me, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setFormData({
          name: data.user.name || '',
          phone: data.user.phone || '',
          avatarUrl: data.user.avatarUrl || '',
          password: '',
          confirmPassword: '',
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    // Preload neural models in background
    loadFaceModels().catch(() => {});
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    isLoopRunningRef.current = false;
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraActive(false);
    setFaceDetected(false);
    latestDetectionRef.current = null;
  };

  const startCamera = async () => {
    setCameraError('');
    setCapturedFaceSnapshot(null);
    setEnrollProgress(0);
    setEnrollStepText('');
    setModelLoading(true);
    try {
      await loadFaceModels();
      setModelLoading(false);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
      isLoopRunningRef.current = true;

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().then(() => {
            runFaceDetectionLoop();
          }).catch(() => {});
        }
      }, 150);
    } catch (err: any) {
      setModelLoading(false);
      if (err.name === 'NotAllowedError') setCameraError('Camera permission denied. Please allow camera access in your browser.');
      else if (err.name === 'NotFoundError') setCameraError('No camera found on this device.');
      else setCameraError('Camera error: ' + (err.message || 'Unable to open camera'));
    }
  };

  const runFaceDetectionLoop = async () => {
    if (!isLoopRunningRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    if (!video || !canvas || !overlay || video.paused || video.ended) {
      if (isLoopRunningRef.current) {
        requestAnimationFrame(runFaceDetectionLoop);
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
        latestDetectionRef.current = detection;

        octx.clearRect(0, 0, w, h);

        if (detection && detection.score >= 0.32) {
          setFaceDetected(true);
          const { box, landmarks } = detection;

          // Draw HUD bounding reticle
          octx.lineWidth = 2.5;
          octx.strokeStyle = '#10b981'; // Emerald
          octx.fillStyle = 'rgba(16, 185, 129, 0.08)';
          octx.strokeRect(box.x, box.y, box.width, box.height);
          octx.fillRect(box.x, box.y, box.width, box.height);

          // Corner Brackets
          const cSize = 16;
          octx.lineWidth = 3.5;
          octx.strokeStyle = '#34d399';

          // Top Left
          octx.beginPath();
          octx.moveTo(box.x, box.y + cSize);
          octx.lineTo(box.x, box.y);
          octx.lineTo(box.x + cSize, box.y);
          octx.stroke();

          // Top Right
          octx.beginPath();
          octx.moveTo(box.x + box.width - cSize, box.y);
          octx.lineTo(box.x + box.width, box.y);
          octx.lineTo(box.x + box.width, box.y + cSize);
          octx.stroke();

          // Bottom Left
          octx.beginPath();
          octx.moveTo(box.x, box.y + box.height - cSize);
          octx.lineTo(box.x, box.y + box.height);
          octx.lineTo(box.x + cSize, box.y + box.height);
          octx.stroke();

          // Bottom Right
          octx.beginPath();
          octx.moveTo(box.x + box.width - cSize, box.y + box.height);
          octx.lineTo(box.x + box.width, box.y + box.height);
          octx.lineTo(box.x + box.width, box.y + box.height - cSize);
          octx.stroke();

          // Draw facial landmark points
          if (landmarks?.positions) {
            octx.fillStyle = '#38bdf8';
            for (let i = 0; i < landmarks.positions.length; i += 3) {
              const pt = landmarks.positions[i];
              octx.beginPath();
              octx.arc(pt.x, pt.y, 2, 0, Math.PI * 2);
              octx.fill();
            }
          }

          // Status tag above box
          octx.fillStyle = '#059669';
          octx.fillRect(box.x, Math.max(0, box.y - 24), Math.min(box.width, 140), 22);
          octx.fillStyle = '#ffffff';
          octx.font = 'bold 11px sans-serif';
          octx.fillText('✓ Face Ready', box.x + 6, Math.max(15, box.y - 8));
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
      requestAnimationFrame(runFaceDetectionLoop);
    }
  };

  // High-precision Multi-Sample Biometric Enrollment
  const handleCaptureAndEnrollFace = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    setEnrolling(true);
    setEnrollProgress(10);
    setEnrollStepText('Starting multi-frame biometric scan...');

    try {
      const descriptors: number[][] = [];
      const totalSamples = 3;
      let bestSnapshot = '';

      for (let i = 1; i <= totalSamples; i++) {
        setEnrollProgress(Math.round((i / totalSamples) * 80));
        setEnrollStepText(`Extracting biometric sample ${i} of ${totalSamples}... (Hold still)`);

        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

        const detection = await detectFaceInCanvasAsync(canvas, 416);
        if (detection && detection.descriptor && detection.descriptor.length === 128) {
          descriptors.push(detection.descriptor);
          if (i === 1 || !bestSnapshot) {
            bestSnapshot = canvas.toDataURL('image/jpeg', 0.88);
          }
        }

        // Brief delay between frame captures for variation in micro-movements
        await new Promise(r => setTimeout(r, 220));
      }

      if (descriptors.length === 0) {
        showToast('error', 'No clear face detected. Please ensure good lighting and look directly into the camera.');
        setEnrolling(false);
        setEnrollProgress(0);
        setEnrollStepText('');
        return;
      }

      setEnrollProgress(90);
      setEnrollStepText('Computing averaged neural face embedding...');

      // Average the 128D descriptors for maximum recognition accuracy
      const averagedDescriptor = averageDescriptors(descriptors);

      setCapturedFaceSnapshot(bestSnapshot);
      stopCamera();

      // Submit enrollment to backend
      const token = localStorage.getItem('token');
      const res = await fetch(API.profile, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          avatarUrl: bestSnapshot,
          faceDescriptor: JSON.stringify(averagedDescriptor),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setFormData(prev => ({ ...prev, avatarUrl: bestSnapshot }));
        showToast('success', '🎉 Face Biometrics enrolled successfully! You can now use Auto Attendance.');
      } else {
        const err = await res.json();
        showToast('error', err.error || 'Failed to save biometric enrollment');
      }
    } catch {
      showToast('error', 'Network error while saving face enrollment');
    } finally {
      setEnrolling(false);
      setEnrollProgress(0);
      setEnrollStepText('');
    }
  };

  const handleClearFaceBiometrics = async () => {
    if (!confirm('Are you sure you want to remove your enrolled face biometrics? You will not be able to use automatic face attendance until re-enrolled.')) {
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API.profile, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ faceDescriptor: '' }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setCapturedFaceSnapshot(null);
        showToast('success', 'Face biometrics removed successfully.');
      } else {
        const err = await res.json();
        showToast('error', err.error || 'Failed to remove face biometrics');
      }
    } catch {
      showToast('error', 'Network error while removing face biometrics');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password && formData.password !== formData.confirmPassword) {
      showToast('error', 'Passwords do not match');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API.profile, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          avatarUrl: formData.avatarUrl,
          password: formData.password || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        showToast('success', 'Profile updated successfully');
        setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
      } else {
        const err = await res.json();
        showToast('error', err.error || 'Failed to update profile');
      }
    } catch {
      showToast('error', 'Network error while updating profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 bg-card border border-border rounded-3xl">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground text-xs font-semibold">Loading profile information...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6 pt-2 pb-12 animate-in fade-in duration-500">
      {/* Toast Alert */}
      {toast.show && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-2xl font-bold text-xs shadow-2xl border ${
          toast.type === 'success'
            ? 'bg-emerald-500 text-slate-950 border-emerald-400'
            : 'bg-rose-500 text-foreground border-rose-400'
        } animate-in slide-in-from-top-2 flex items-center gap-2`}>
          <CheckCircle2 className="w-4 h-4" />
          <span>{toast.text}</span>
        </div>
      )}

      {/* Header Profile Hero Card */}
      <div className="bg-card border border-border p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left z-10">
          <div className="relative group">
            <div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-primary/40 bg-muted flex items-center justify-center text-3xl font-black text-foreground shadow-xl">
              {formData.avatarUrl ? (
                <img 
                  src={formData.avatarUrl} 
                  alt={user?.name} 
                  className="w-full h-full object-cover" 
                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                />
              ) : (
                <span>{user?.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
              )}
            </div>
            {user?.isFaceEnrolled && (
              <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-slate-950 p-1.5 rounded-xl border-2 border-card shadow-md">
                <ShieldCheck className="w-4 h-4" />
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2.5">
              <h1 className="text-2xl font-black text-foreground">{user?.name || 'My Profile'}</h1>
              <span className="text-xs font-black font-mono text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-xl inline-flex items-center gap-1">
                <IdCard className="w-3.5 h-3.5" />
                <span>{user?.idNumber || 'NO ID'}</span>
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-semibold">@{user?.username} · {user?.role?.replace('_', ' ')}</p>
            
            {/* Status Pills */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
              {user?.isFaceEnrolled ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Face Biometrics Enrolled ✓</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-primary/10 text-primary border border-primary/30 animate-pulse">
                  <AlertCircle className="w-4 h-4" />
                  <span>Face Not Enrolled (Required for Auto Attendance)</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick ID Badge Box */}
        <div className="bg-secondary/60 border border-border p-4 rounded-2xl text-center sm:text-right flex flex-col gap-1 w-full sm:w-auto z-10">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Biometric Status</span>
          <span className="text-xs font-black text-emerald-400">{user?.isFaceEnrolled ? 'Ready for Auto-Scan' : 'Enrollment Pending'}</span>
          <span className="text-[11px] text-muted-foreground">{user?.phone || 'No phone registered'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* ─── SECTION 1: BIOMETRIC FACE ENROLLMENT ─── */}
        <div className="bg-card border border-border p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-black text-primary uppercase tracking-widest mb-1">
              <Camera className="w-4 h-4" />
              <span>Biometric Setup</span>
            </div>
            <h2 className="text-xl font-black text-foreground">Face Recognition Enrollment</h2>
            <p className="text-muted-foreground text-xs mt-1 mb-6">
              Register your face template with our AI neural engine. When you stand in front of the camera on-site, you will be recognized and checked in instantly.
            </p>

            {/* Video / Camera Viewport */}
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black/90 border border-border flex items-center justify-center shadow-inner mb-4">
              {cameraActive ? (
                <>
                  <video 
                    ref={videoRef} 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover" 
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  <canvas ref={overlayRef} className="absolute inset-0 w-full h-full pointer-events-none" />
                  
                  {/* Face Guide Oval */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className={`w-44 h-56 rounded-[50%] border-2 ${
                      faceDetected ? 'border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.4)]' : 'border-primary/60 border-dashed animate-pulse'
                    } transition-all duration-300 relative flex items-center justify-center`}>
                      <div className="absolute top-2 text-[10px] font-black uppercase text-foreground bg-black/70 px-2.5 py-0.5 rounded-full backdrop-blur-sm border border-border">
                        {faceDetected ? 'Face Aligned ✓' : 'Center Your Face'}
                      </div>
                    </div>
                  </div>

                  {/* Multi-sample Enrollment Progress Overlay */}
                  {enrolling && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-6 text-center animate-in fade-in">
                      <Loader2 className="w-8 h-8 text-primary animate-spin" />
                      <div className="w-48 bg-muted rounded-full h-2 overflow-hidden border border-border">
                        <div 
                          className="bg-primary h-full transition-all duration-300"
                          style={{ width: `${enrollProgress}%` }}
                        />
                      </div>
                      <p className="text-xs font-bold text-foreground">{enrollStepText}</p>
                    </div>
                  )}
                </>
              ) : capturedFaceSnapshot ? (
                <div className="w-full h-full relative">
                  <img src={capturedFaceSnapshot} alt="Enrolled Face" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                    <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Biometric Template Stored</span>
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-center p-6">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-2xl">
                    📸
                  </div>
                  <p className="text-foreground font-bold text-sm">Camera Offline</p>
                  <p className="text-muted-foreground text-xs max-w-xs">
                    Click the button below to activate your webcam and enroll your biometric face template.
                  </p>
                </div>
              )}
            </div>

            {cameraError && (
              <div className="p-3.5 rounded-xl mb-4 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-semibold">
                {cameraError}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {!cameraActive ? (
              <div className="flex flex-col sm:flex-row gap-2.5 w-full">
                <button
                  type="button"
                  onClick={startCamera}
                  disabled={modelLoading}
                  className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-50 text-foreground py-3.5 rounded-2xl font-bold text-xs transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] btn-interactive cursor-pointer"
                >
                  {modelLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Loading Neural AI Models...</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4" />
                      <span>{user?.isFaceEnrolled ? 'Re-scan & Update Face' : 'Start Face Scanner'}</span>
                    </>
                  )}
                </button>
                {user?.isFaceEnrolled && (
                  <button
                    type="button"
                    onClick={handleClearFaceBiometrics}
                    className="px-4 py-3.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-2xl font-bold text-xs transition-colors border border-rose-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                    title="Remove enrolled face biometrics"
                  >
                    <X className="w-4 h-4" />
                    <span>Clear Face</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="flex gap-2 w-full">
                <button
                  type="button"
                  onClick={stopCamera}
                  disabled={enrolling}
                  className="px-5 py-3.5 bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground rounded-2xl font-bold text-xs transition-colors border border-border"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCaptureAndEnrollFace}
                  disabled={enrolling || !faceDetected}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 py-3.5 rounded-2xl font-black text-xs transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 active:scale-95"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{enrolling ? 'Extracting Biometrics...' : 'Enroll & Verify Face'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ─── SECTION 2: EDIT ACCOUNT INFORMATION ─── */}
        <div className="bg-card border border-border p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col justify-between">
          <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-black text-primary uppercase tracking-widest mb-1">
                <User className="w-4 h-4" />
                <span>Account Details</span>
              </div>
              <h2 className="text-xl font-black text-foreground">Personal Information</h2>
              <p className="text-muted-foreground text-xs mt-1 mb-4">
                Keep your contact info and login credentials up to date.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-black text-muted-foreground uppercase tracking-widest block mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full bg-muted border border-border text-foreground px-4 py-3 rounded-2xl outline-none focus:border-primary text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-black text-muted-foreground uppercase tracking-widest block mb-1.5">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. +1 (555) 019-2834"
                  className="w-full bg-muted border border-border text-foreground px-4 py-3 rounded-2xl outline-none focus:border-primary text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-black text-muted-foreground uppercase tracking-widest block mb-1.5">
                  Profile Photo URL (Optional)
                </label>
                <input
                  type="url"
                  value={formData.avatarUrl}
                  onChange={e => setFormData({ ...formData, avatarUrl: e.target.value })}
                  placeholder="https://example.com/photo.jpg"
                  className="w-full bg-muted border border-border text-foreground px-4 py-3 rounded-2xl outline-none focus:border-primary text-xs font-semibold"
                />
              </div>

              <div className="pt-2 border-t border-border mt-1">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Change Password (Leave blank to keep unchanged)</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="password"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    placeholder="New Password"
                    className="w-full bg-muted border border-border text-foreground px-4 py-2.5 rounded-2xl outline-none focus:border-primary text-xs font-semibold"
                  />
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Confirm Password"
                    className="w-full bg-muted border border-border text-foreground px-4 py-2.5 rounded-2xl outline-none focus:border-primary text-xs font-semibold"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-4 w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-foreground py-3.5 rounded-2xl font-bold text-xs transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] btn-interactive"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Profile Updates</span>
                </>
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
