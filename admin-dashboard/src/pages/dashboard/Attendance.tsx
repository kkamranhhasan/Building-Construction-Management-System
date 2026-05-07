'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { API } from '../../config/api';

interface SiteWithWorkers {
  id: string;
  name: string;
  location: string;
  workers: { id: string; name: string; username: string }[];
}

interface AttendanceRecord {
  id: string;
  date: string;
  checkInTime: string;
  checkOutTime: string | null;
  status: string;
  imageProofUrl: string | null;
  worker: { id: string; name: string };
  site: { id: string; name: string };
}

type Step = 'form' | 'camera' | 'preview' | 'done';

export default function AttendanceCapture() {
  const [assignedSites, setAssignedSites] = useState<SiteWithWorkers[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [selectedWorker, setSelectedWorker] = useState('');
  const [dataLoading, setDataLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<Step>('form');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState('');
  const [toast, setToast] = useState({ show: false, type: '', text: '' });
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [attLoading, setAttLoading] = useState(false);
  const [viewPhoto, setViewPhoto] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const workersForSite = assignedSites.find(s => s.id === selectedSiteId)?.workers ?? [];

  const showToast = (type: string, text: string) => {
    setToast({ show: true, type, text });
    setTimeout(() => setToast({ show: false, type: '', text: '' }), 4000);
  };

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [sitesRes, attRes] = await Promise.all([
        fetch(API.sites, { headers }),
        fetch(API.attendance, { headers }),
      ]);
      if (sitesRes.ok) {
        const data = await sitesRes.json();
        const mySites = data.filter((s: any) => s.isAssigned === true);
        setAssignedSites(mySites);
        if (mySites.length === 1) setSelectedSiteId(mySites[0].id);
      }
      if (attRes.ok) {
        const attData = await attRes.json();
        const today = new Date().toISOString().split('T')[0];
        const todayAtt = attData.filter((a: AttendanceRecord) => a.date?.startsWith(today));
        setAttendances(todayAtt);
      }
    } catch (e) { console.error(e); }
    finally { setDataLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { return () => stopCamera(); }, []);

  // ─── Camera helpers ───────────────────────────────────────────────────────

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  const openCamera = async () => {
    setCameraError('');
    try {
      const constraints = {
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'environment' },
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setStep('camera');
      // Attach stream to video after React has rendered the video element
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {
            // autoplay may be blocked; try muted
          });
        }
      }, 100);
    } catch (err: any) {
      if (err.name === 'NotAllowedError') setCameraError('Camera access denied. Please allow camera in browser settings.');
      else if (err.name === 'NotFoundError') setCameraError('No camera detected on this device.');
      else setCameraError('Camera error: ' + err.message);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // Compress: max 640px wide to keep payload small
    const MAX_WIDTH = 640;
    const ratio = Math.min(1, MAX_WIDTH / (video.videoWidth || 640));
    canvas.width = (video.videoWidth || 640) * ratio;
    canvas.height = (video.videoHeight || 480) * ratio;

    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Quality 0.6 → keeps file well under 100KB
    const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
    setCapturedPhoto(dataUrl);
    stopCamera();
    setStep('preview');
  };

  const retake = () => {
    setCapturedPhoto(null);
    openCamera();
  };

  const handleSubmit = async () => {
    if (!capturedPhoto || !selectedWorker || !selectedSiteId) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API.checkin, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ workerId: selectedWorker, siteId: selectedSiteId, imageProofUrl: capturedPhoto }),
      });
      if (res.ok) {
        const data = await res.json();
        showToast('success', `✅ Attendance recorded for ${data.worker?.name}`);
        setSelectedWorker('');
        setCapturedPhoto(null);
        setStep('form');
        fetchData(); // refresh attendance list
      } else {
        const data = await res.json();
        showToast('error', data.error || 'Failed to record attendance');
        setStep('preview');
      }
    } catch {
      showToast('error', 'Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckout = async (attendanceId: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(API.checkout, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ attendanceId }),
      });
      if (res.ok) {
        showToast('success', 'Check-out recorded successfully');
        fetchData();
      }
    } catch { showToast('error', 'Failed to check out'); }
  };

  if (dataLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (assignedSites.length === 0) return (
    <div className="max-w-xl mx-auto pt-16 text-center">
      <div className="text-6xl mb-4">🏗️</div>
      <h2 className="text-2xl font-bold text-white mb-3">No Sites Assigned</h2>
      <p className="text-slate-400">Contact your manager to get assigned to a site.</p>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6 pt-2 pb-12">

      {/* Toast */}
      {toast.show && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-2xl font-bold text-sm shadow-2xl border ${
          toast.type === 'success'
            ? 'bg-emerald-500 text-white border-emerald-400'
            : 'bg-rose-500 text-white border-rose-400'
        } animate-in slide-in-from-top-2`}>
          {toast.text}
        </div>
      )}

      {/* ─── STEP 1: FORM ─── */}
      {step === 'form' && (
        <div className="flex flex-col gap-5 animate-in fade-in duration-300">
          <div className="text-center pt-2">
            <h1 className="text-2xl font-black text-white">Capture Attendance</h1>
            <p className="text-slate-400 text-sm mt-1">Select site & worker, then take a photo.</p>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Construction Site</label>
              <select
                className="bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl outline-none focus:border-primary transition-colors"
                value={selectedSiteId}
                onChange={e => { setSelectedSiteId(e.target.value); setSelectedWorker(''); }}
                required
              >
                <option value="" disabled>— Select site —</option>
                {assignedSites.map(s => (
                  <option key={s.id} value={s.id}>{s.name} · {s.location}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Worker</label>
              <select
                className="bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl outline-none focus:border-primary transition-colors disabled:opacity-40"
                value={selectedWorker}
                onChange={e => setSelectedWorker(e.target.value)}
                disabled={!selectedSiteId}
              >
                <option value="" disabled>
                  {!selectedSiteId ? '— Select a site first —' : workersForSite.length ? '— Select worker —' : 'No workers assigned'}
                </option>
                {workersForSite.map(w => (
                  <option key={w.id} value={w.id}>{w.name} · @{w.username}</option>
                ))}
              </select>
            </div>
          </div>

          {cameraError && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl text-sm">
              ⚠️ {cameraError}
            </div>
          )}

          <button
            onClick={openCamera}
            disabled={!selectedWorker || !selectedSiteId}
            className={`w-full py-4 rounded-2xl font-black text-base transition-all ${
              selectedWorker && selectedSiteId
                ? 'bg-primary hover:bg-primary-hover text-white shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-[0.98]'
                : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'
            }`}
          >
            {selectedWorker && selectedSiteId ? '📷 Open Camera to Capture' : 'Select site & worker first'}
          </button>
        </div>
      )}

      {/* ─── STEP 2: LIVE CAMERA ─── */}
      {step === 'camera' && (
        <div className="flex flex-col gap-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between px-1">
            <button onClick={() => { stopCamera(); setStep('form'); }} className="text-slate-400 hover:text-white text-sm font-bold flex items-center gap-1">
              ← Back
            </button>
            <span className="text-white font-black text-sm">Live Camera</span>
            <div className="w-16" />
          </div>

          <div className="relative bg-black rounded-2xl overflow-hidden border border-border">
            {/* LIVE badge */}
            <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-black/60 backdrop-blur px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
              <span className="text-white text-[10px] font-black uppercase tracking-wider">Live</span>
            </div>

            {/* Video element */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '360px',
                display: 'block',
                objectFit: 'cover',
                backgroundColor: '#111',
              }}
            />

            {/* Viewfinder corner brackets */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="relative w-52 h-40">
                <span className="absolute top-0 left-0 w-6 h-6 border-t-[3px] border-l-[3px] border-white/80 rounded-tl" />
                <span className="absolute top-0 right-0 w-6 h-6 border-t-[3px] border-r-[3px] border-white/80 rounded-tr" />
                <span className="absolute bottom-0 left-0 w-6 h-6 border-b-[3px] border-l-[3px] border-white/80 rounded-bl" />
                <span className="absolute bottom-0 right-0 w-6 h-6 border-b-[3px] border-r-[3px] border-white/80 rounded-br" />
              </div>
            </div>

            {/* Bottom bar with shutter */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent py-6 flex justify-center z-20">
              <button
                type="button"
                onClick={capturePhoto}
                className="relative flex items-center justify-center"
                title="Capture Photo"
              >
                <span className="absolute w-[72px] h-[72px] rounded-full border-[3px] border-white/70" />
                <span className="w-[56px] h-[56px] rounded-full bg-white hover:scale-95 active:scale-90 transition-transform shadow-2xl flex items-center justify-center text-2xl">
                  📸
                </span>
              </button>
            </div>
          </div>

          <p className="text-center text-slate-500 text-sm">Press the button to capture the photo</p>
        </div>
      )}

      {/* ─── STEP 3: PREVIEW & SUBMIT ─── */}
      {step === 'preview' && capturedPhoto && (
        <div className="flex flex-col gap-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between px-1">
            <button onClick={retake} className="text-slate-400 hover:text-white text-sm font-bold flex items-center gap-1">
              ← Retake
            </button>
            <span className="text-white font-black text-sm">Review & Submit</span>
            <div className="w-16" />
          </div>

          {/* Photo Preview */}
          <div className="relative rounded-2xl overflow-hidden border border-emerald-500/30">
            <img src={capturedPhoto} alt="Captured" className="w-full object-cover" style={{ maxHeight: '360px' }} />
            <div className="absolute top-3 left-3 bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase">
              ✓ Photo Ready
            </div>
          </div>

          {/* Worker summary */}
          <div className="bg-surface border border-border rounded-2xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-xl">👷</div>
            <div>
              <div className="text-white font-bold">
                {workersForSite.find(w => w.id === selectedWorker)?.name ?? 'Worker'}
              </div>
              <div className="text-slate-400 text-sm">
                {assignedSites.find(s => s.id === selectedSiteId)?.name ?? 'Site'} · {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </div>
            </div>
            <div className="ml-auto text-emerald-400 font-black text-sm bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
              CHECK-IN
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-4 rounded-2xl font-black text-lg bg-emerald-500 hover:bg-emerald-400 text-white shadow-xl shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70"
          >
            {submitting ? '⏳ Submitting...' : '✅ Confirm & Submit Attendance'}
          </button>
        </div>
      )}

      {/* Hidden canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* ─── TODAY'S ATTENDANCE LIST ─── */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden mt-2">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-white font-black">Today's Attendance</h2>
            <p className="text-slate-500 text-xs mt-0.5">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
          <span className="text-xs font-black text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
            {attendances.length} Records
          </span>
        </div>

        {attendances.length === 0 ? (
          <div className="py-12 text-center text-slate-500 flex flex-col items-center gap-3">
            <div className="text-4xl opacity-30">📋</div>
            <p className="text-sm">No attendance records for today yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {attendances.map(att => (
              <div key={att.id} className="px-4 py-3.5 flex items-center gap-3 hover:bg-slate-800/30 transition-colors">

                {/* Photo thumbnail */}
                {att.imageProofUrl ? (
                  <button
                    type="button"
                    onClick={() => setViewPhoto(att.imageProofUrl)}
                    className="flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden border-2 border-slate-700 hover:border-primary transition-colors"
                    title="View photo"
                  >
                    <img
                      src={att.imageProofUrl}
                      alt="proof"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ) : (
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl">
                    👤
                  </div>
                )}

                {/* Status dot */}
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${att.checkOutTime ? 'bg-slate-500' : 'bg-emerald-400 animate-pulse'}`} />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-white font-bold text-sm truncate">{att.worker?.name}</div>
                  <div className="text-slate-500 text-xs flex items-center gap-2 mt-0.5 flex-wrap">
                    <span>🏗️ {att.site?.name}</span>
                    <span>·</span>
                    <span>In: {new Date(att.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                    {att.checkOutTime && (
                      <>
                        <span>·</span>
                        <span>Out: {new Date(att.checkOutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                    att.checkOutTime
                      ? 'bg-slate-700 text-slate-400'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {att.checkOutTime ? 'Done' : 'Active'}
                  </span>
                  {!att.checkOutTime && (
                    <button
                      onClick={() => handleCheckout(att.id)}
                      className="text-[10px] font-black text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full hover:bg-rose-500 hover:text-white transition-all uppercase"
                    >
                      Check Out
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Photo viewer modal */}
      {viewPhoto && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setViewPhoto(null)}
        >
          <div className="relative max-w-xl w-full" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setViewPhoto(null)}
              className="absolute -top-10 right-0 text-white/70 hover:text-white font-bold text-sm flex items-center gap-1"
            >
              ✕ Close
            </button>
            <img
              src={viewPhoto}
              alt="Attendance proof"
              className="w-full rounded-2xl shadow-2xl border border-white/10"
            />
            <p className="text-center text-slate-400 text-xs mt-3">Photo proof of attendance</p>
          </div>
        </div>
      )}
    </div>
  );
}
