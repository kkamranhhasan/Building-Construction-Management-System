import { useEffect, useRef, useState } from 'react';
import { API } from '../../config/api';
import { 
  Camera,
  RefreshCw, 
  CheckCircle2, 
  Building2, 
  User, 
  Eye, 
  X, 
  Compass, 
  Scan, 
  Zap, 
  Loader2,
  LogIn,
  LogOut,
  Clock,
  Sparkles,
  AlertTriangle,
  MapPinOff,
  MapPin
} from 'lucide-react';
import { 
  detectFaceInCanvasAsync, 
  findBestFaceMatch, 
  loadFaceModels, 
  STRICT_MAX_DISTANCE, 
  STRICT_MIN_CONFIDENCE,
  type EnrolledWorker, 
  type MatchResult 
} from '../../utils/faceRecognition';

interface SiteWithWorkers {
  id: string;
  name: string;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  radiusMeters?: number | null;
  workers: EnrolledWorker[];
}

interface AttendanceRecord {
  id: string;
  date: string;
  checkInTime: string;
  checkOutTime: string | null;
  status: string;
  imageProofUrl: string | null;
  checkOutImageProofUrl?: string | null;
  checkOutMethod?: string | null;
  locationLat?: number | null;
  locationLng?: number | null;
  distanceMeters?: number | null;
  verificationMethod?: string | null;
  confidenceScore?: number | null;
  totalHours?: number | null;
  worker: { 
    id: string; 
    name: string; 
    username?: string; 
    idNumber?: string | null; 
    phone?: string | null; 
    avatarUrl?: string | null 
  };
  site: { id: string; name: string; location?: string };
}

interface PhotoModalData {
  url: string;
  title: string;
  type: 'CHECK_IN' | 'CHECK_OUT';
  workerName: string;
  time?: string;
  method?: string | null;
}

function calculateDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Radius of the Earth in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function formatShiftDuration(checkInTime: string, checkOutTime: string | null): string {
  if (!checkOutTime) {
    const diffMs = Date.now() - new Date(checkInTime).getTime();
    if (diffMs <= 0) return 'Just started';
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return hours > 0 ? `${hours}h ${mins}m active` : `${mins}m active`;
  }
  const diffMs = new Date(checkOutTime).getTime() - new Date(checkInTime).getTime();
  if (diffMs <= 0) return '0m';
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

export default function AttendanceCapture() {
  const [assignedSites, setAssignedSites] = useState<SiteWithWorkers[]>([]);
  const [allEnrolledWorkers, setAllEnrolledWorkers] = useState<EnrolledWorker[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [dataLoading, setDataLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [viewPhotoModal, setViewPhotoModal] = useState<PhotoModalData | null>(null);
  const [toast, setToast] = useState({ show: false, type: '', text: '' });
  const [modelLoading, setModelLoading] = useState(false);
  const [autoCheckinEnabled, setAutoCheckinEnabled] = useState(true);

  // Scanner Action: 'SMART_AUTO' | 'CHECK_IN' | 'CHECK_OUT'
  const [scannerAction, setScannerAction] = useState<'SMART_AUTO' | 'CHECK_IN' | 'CHECK_OUT'>('SMART_AUTO');
  const scannerActionRef = useRef<'SMART_AUTO' | 'CHECK_IN' | 'CHECK_OUT'>('SMART_AUTO');
  useEffect(() => {
    scannerActionRef.current = scannerAction;
  }, [scannerAction]);

  // Keep attendances ref fresh for RAF scanner loop
  const attendancesRef = useRef<AttendanceRecord[]>([]);
  useEffect(() => {
    attendancesRef.current = attendances;
  }, [attendances]);

  // GPS Geolocation state
  const [currentGPS, setCurrentGPS] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');

  // Live Camera & Face Matching State
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [currentMatch, setCurrentMatch] = useState<MatchResult | null>(null);
  const [detectionStatus, setDetectionStatus] = useState<{
    status: 'AWAITING' | 'MATCHED' | 'SITE_MISMATCH' | 'UNRECOGNIZED';
    mismatchWorker?: EnrolledWorker | null;
    verificationFrames?: number;
    score?: number;
  }>({ status: 'AWAITING' });
  const [autoCooldown, setAutoCooldown] = useState(false);
  const [lastActionSuccess, setLastActionSuccess] = useState<{
    name: string;
    type: 'CHECK_IN' | 'CHECK_OUT';
    hours?: number | null;
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isDetectingRef = useRef<boolean>(false);
  const isLoopRunningRef = useRef<boolean>(false);
  const matchHoldCounterRef = useRef<{ workerId: string; count: number }>({ workerId: '', count: 0 });
  const autoCooldownRef = useRef<boolean>(false);

  const activeSite = assignedSites.find(s => s.id === selectedSiteId);
  const workersForSite = activeSite?.workers ?? [];

  // ─── STRICT GPS GEOFENCING ENFORCEMENT ───
  let siteDistance: number | null = null;
  let isWithinGeofence = true;
  let geofenceMessage = '';
  let maxRadius = activeSite?.radiusMeters || 300;

  if (activeSite && activeSite.latitude != null && activeSite.longitude != null) {
    if (currentGPS) {
      siteDistance = calculateDistanceInMeters(
        activeSite.latitude,
        activeSite.longitude,
        currentGPS.lat,
        currentGPS.lng
      );
      isWithinGeofence = siteDistance <= maxRadius;
      if (isWithinGeofence) {
        geofenceMessage = `✓ On-Site Verified: ${siteDistance}m from project boundary (Allowed: ±${maxRadius}m)`;
      } else {
        geofenceMessage = `🚫 Outside Site Boundary: You are ${siteDistance}m away (Max allowed: ${maxRadius}m). Attendance is blocked.`;
      }
    } else {
      isWithinGeofence = false;
      geofenceMessage = gpsLoading 
        ? 'Acquiring high-accuracy GPS coordinates...'
        : gpsError 
        ? `GPS Error: ${gpsError}. Location is required to verify site presence.`
        : 'Acquiring GPS location to verify on-site presence...';
    }
  } else if (activeSite) {
    // Site has no GPS coordinates set
    isWithinGeofence = true;
    geofenceMessage = `⚠️ Site GPS not configured for "${activeSite.name}". Geofence check skipped.`;
  }

  const isWithinGeofenceRef = useRef<boolean>(true);
  useEffect(() => {
    isWithinGeofenceRef.current = isWithinGeofence;
  }, [isWithinGeofence]);

  const showToast = (type: string, text: string) => {
    setToast({ show: true, type, text });
    setTimeout(() => setToast({ show: false, type: '', text: '' }), 4500);
  };

  // Get GPS Location
  const requestGPS = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation not supported by this browser.');
      showToast('error', 'Geolocation not supported by this browser.');
      return;
    }
    setGpsLoading(true);
    setGpsError('');
    navigator.geolocation.getCurrentPosition(
      pos => {
        setCurrentGPS({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsLoading(false);
      },
      err => {
        setGpsLoading(false);
        setGpsError(err.message);
        showToast('error', 'GPS Error: ' + err.message);
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [sitesRes, attRes, usersRes] = await Promise.all([
        fetch(API.sites, { headers }),
        fetch(API.attendance, { headers }),
        fetch(API.users, { headers }).catch(() => null),
      ]);

      if (sitesRes.ok) {
        const data = await sitesRes.json();
        const mySites = data.filter((s: any) => s.isAssigned === true);
        const effectiveSites = mySites.length > 0 ? mySites : data;
        setAssignedSites(effectiveSites);
        
        if (effectiveSites.length > 0 && !selectedSiteId) {
          setSelectedSiteId(effectiveSites[0].id);
        }
      }

      if (usersRes && usersRes.ok) {
        const usersData = await usersRes.json();
        if (Array.isArray(usersData)) {
          const enrolled = usersData.filter((u: any) => u.isFaceEnrolled && u.faceDescriptor);
          setAllEnrolledWorkers(enrolled);
        }
      }

      if (attRes.ok) {
        const attData = await attRes.json();
        const today = new Date().toISOString().split('T')[0];
        const todayAtt = Array.isArray(attData) ? attData.filter((a: AttendanceRecord) => a.date?.startsWith(today)) : [];
        setAttendances(todayAtt);
        attendancesRef.current = todayAtt;
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    requestGPS();
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
    setCurrentMatch(null);
    matchHoldCounterRef.current = { workerId: '', count: 0 };
  };

  const startCamera = async () => {
    if (!isWithinGeofence) {
      showToast('error', 'Location Blocked: You must be physically on-site to start attendance camera.');
      return;
    }

    setCameraError('');
    setCurrentMatch(null);
    setLastActionSuccess(null);
    matchHoldCounterRef.current = { workerId: '', count: 0 };
    setModelLoading(true);
    try {
      await loadFaceModels();
      setModelLoading(false);

      const constraints = {
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'environment' },
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setCameraActive(true);
      isLoopRunningRef.current = true;

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().then(() => {
            runLiveFaceScanner();
          }).catch(() => {});
        }
      }, 150);
    } catch (err: any) {
      setModelLoading(false);
      if (err.name === 'NotAllowedError') setCameraError('Camera permission denied. Please allow camera access.');
      else if (err.name === 'NotFoundError') setCameraError('No camera found on this device.');
      else setCameraError('Camera error: ' + (err.message || 'Unable to open camera'));
    }
  };

  // Live video scanner loop with AI landmark detection & worker matching
  const runLiveFaceScanner = async () => {
    if (!isLoopRunningRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const overlay = overlayCanvasRef.current;

    if (!video || !canvas || !overlay || video.paused || video.ended) {
      if (isLoopRunningRef.current) {
        requestAnimationFrame(runLiveFaceScanner);
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

        // Strict Geofence live alert on video frame
        if (!isWithinGeofenceRef.current) {
          octx.clearRect(0, 0, w, h);
          octx.fillStyle = 'rgba(239, 68, 68, 0.85)';
          octx.fillRect(0, 0, w, 40);
          octx.font = 'bold 13px sans-serif';
          octx.fillStyle = '#ffffff';
          octx.textAlign = 'center';
          octx.fillText('🚫 OUTSIDE SITE LOCATION BOUNDARY — ATTENDANCE BLOCKED', w / 2, 25);
          octx.textAlign = 'left';
          return;
        }

        const detection = await detectFaceInCanvasAsync(canvas, 416);

        octx.clearRect(0, 0, w, h);

        if (detection && detection.score >= 0.35) {
          const { box, landmarks } = detection;

          // Candidate pool: site workers first
          const currentSite = assignedSites.find(s => s.id === selectedSiteId);
          const siteWorkers = currentSite?.workers || [];
          const enrolledSiteWorkers = siteWorkers.filter(w => w.isFaceEnrolled);

          // 1. Strict biometric search among workers assigned to this site
          let match = findBestFaceMatch(detection.descriptor, enrolledSiteWorkers, STRICT_MIN_CONFIDENCE, STRICT_MAX_DISTANCE);
          let foreignMatch: MatchResult | null = null;

          // 2. If no match in this site, check if this face belongs to an enrolled worker of another site
          if (!match && allEnrolledWorkers.length > 0) {
            foreignMatch = findBestFaceMatch(detection.descriptor, allEnrolledWorkers, STRICT_MIN_CONFIDENCE, STRICT_MAX_DISTANCE);
          }

          if (match) {
            setCurrentMatch(match);

            // Determine target action: Check-In vs Check-Out vs Shift Done
            const activeRecord = attendancesRef.current.find(
              a => a.worker.id === match!.worker.id && !a.checkOutTime
            );
            const completedRecord = attendancesRef.current.find(
              a => a.worker.id === match!.worker.id && a.checkOutTime
            );

            let currentTarget: 'CHECK_IN' | 'CHECK_OUT' | 'SHIFT_COMPLETED' = 'CHECK_IN';
            if (scannerActionRef.current === 'CHECK_IN') {
              currentTarget = 'CHECK_IN';
            } else if (scannerActionRef.current === 'CHECK_OUT') {
              currentTarget = 'CHECK_OUT';
            } else {
              // SMART_AUTO mode
              if (activeRecord) {
                currentTarget = 'CHECK_OUT';
              } else if (completedRecord) {
                currentTarget = 'SHIFT_COMPLETED';
              } else {
                currentTarget = 'CHECK_IN';
              }
            }

            // Track continuous frame stability (requires 4 consecutive frames = ~0.6s)
            if (matchHoldCounterRef.current.workerId === match.worker.id) {
              matchHoldCounterRef.current.count += 1;
            } else {
              matchHoldCounterRef.current = { workerId: match.worker.id, count: 1 };
            }
            const holdCount = Math.min(4, matchHoldCounterRef.current.count);

            setDetectionStatus({
              status: 'MATCHED',
              verificationFrames: holdCount,
              score: match.confidence,
            });

            // HUD Styling
            let strokeColor = '#10b981'; // Emerald
            let fillColor = 'rgba(16, 185, 129, 0.14)';
            let cornerColor = '#34d399';
            let bannerColor = '#059669';
            const actionText = currentTarget === 'CHECK_OUT' ? '⎋ CHECK-OUT' : currentTarget === 'SHIFT_COMPLETED' ? '✓ SHIFT DONE' : '✓ CHECK-IN';
            const bannerText = `${actionText}: ${match.worker.name} (${match.confidence}%) [${holdCount}/4]`;

            if (currentTarget === 'CHECK_OUT') {
              strokeColor = '#f43f5e';
              fillColor = 'rgba(244, 63, 94, 0.16)';
              cornerColor = '#fb7185';
              bannerColor = '#e11d48';
            } else if (currentTarget === 'SHIFT_COMPLETED') {
              strokeColor = '#0284c7';
              fillColor = 'rgba(2, 132, 199, 0.14)';
              cornerColor = '#38bdf8';
              bannerColor = '#0284c7';
            }

            // Bounding box
            octx.lineWidth = 3;
            octx.strokeStyle = strokeColor;
            octx.fillStyle = fillColor;
            octx.strokeRect(box.x, box.y, box.width, box.height);
            octx.fillRect(box.x, box.y, box.width, box.height);

            // Corner brackets
            const cornerSize = 20;
            octx.lineWidth = 4;
            octx.strokeStyle = cornerColor;

            // Top-left
            octx.beginPath();
            octx.moveTo(box.x, box.y + cornerSize);
            octx.lineTo(box.x, box.y);
            octx.lineTo(box.x + cornerSize, box.y);
            octx.stroke();

            // Top-right
            octx.beginPath();
            octx.moveTo(box.x + box.width - cornerSize, box.y);
            octx.lineTo(box.x + box.width, box.y);
            octx.lineTo(box.x + box.width, box.y + cornerSize);
            octx.stroke();

            // Bottom-left
            octx.beginPath();
            octx.moveTo(box.x, box.y + box.height - cornerSize);
            octx.lineTo(box.x, box.y + box.height);
            octx.lineTo(box.x + cornerSize, box.y + box.height);
            octx.stroke();

            // Bottom-right
            octx.beginPath();
            octx.moveTo(box.x + box.width - cornerSize, box.y + box.height);
            octx.lineTo(box.x + box.width, box.y + box.height);
            octx.lineTo(box.x + box.width, box.y + box.height - cornerSize);
            octx.stroke();

            // Facial landmarks
            if (landmarks?.positions) {
              octx.fillStyle = cornerColor;
              for (let i = 0; i < landmarks.positions.length; i += 4) {
                const pt = landmarks.positions[i];
                octx.beginPath();
                octx.arc(pt.x, pt.y, 2, 0, Math.PI * 2);
                octx.fill();
              }
            }

            // Banner above head
            const bannerWidth = Math.max(260, box.width);
            octx.fillStyle = bannerColor;
            octx.fillRect(box.x, Math.max(0, box.y - 34), bannerWidth, 30);

            octx.font = 'bold 12px sans-serif';
            octx.fillStyle = '#ffffff';
            octx.fillText(bannerText, box.x + 8, Math.max(20, box.y - 14));

            // Auto-Attendance Trigger: Requires sustained 4 frames (about 0.6 seconds)
            if (autoCheckinEnabled && !autoCooldownRef.current && !submitting && isWithinGeofenceRef.current && currentTarget !== 'SHIFT_COMPLETED') {
              if (matchHoldCounterRef.current.count >= 4) {
                matchHoldCounterRef.current = { workerId: '', count: 0 };
                if (currentTarget === 'CHECK_OUT') {
                  handleAutoCheckout(match.worker.id, match.confidence, match.worker.name);
                } else {
                  handleAutoCheckin(match.worker.id, match.confidence, match.worker.name);
                }
              }
            }
          } else if (foreignMatch) {
            // Worker is enrolled in company, but assigned to a DIFFERENT site
            setCurrentMatch(null);
            matchHoldCounterRef.current = { workerId: '', count: 0 };
            setDetectionStatus({
              status: 'SITE_MISMATCH',
              mismatchWorker: foreignMatch.worker,
              score: foreignMatch.confidence,
            });

            // Amber Alert HUD
            octx.lineWidth = 3;
            octx.strokeStyle = '#f59e0b';
            octx.fillStyle = 'rgba(245, 158, 11, 0.15)';
            octx.strokeRect(box.x, box.y, box.width, box.height);
            octx.fillRect(box.x, box.y, box.width, box.height);

            const cornerSize = 18;
            octx.lineWidth = 4;
            octx.strokeStyle = '#fbbf24';

            octx.beginPath();
            octx.moveTo(box.x, box.y + cornerSize);
            octx.lineTo(box.x, box.y);
            octx.lineTo(box.x + cornerSize, box.y);
            octx.stroke();

            octx.beginPath();
            octx.moveTo(box.x + box.width - cornerSize, box.y);
            octx.lineTo(box.x + box.width, box.y);
            octx.lineTo(box.x + box.width, box.y + cornerSize);
            octx.stroke();

            octx.beginPath();
            octx.moveTo(box.x, box.y + box.height - cornerSize);
            octx.lineTo(box.x, box.y + box.height);
            octx.lineTo(box.x + cornerSize, box.y + box.height);
            octx.stroke();

            octx.beginPath();
            octx.moveTo(box.x + box.width - cornerSize, box.y + box.height);
            octx.lineTo(box.x + box.width, box.y + box.height);
            octx.lineTo(box.x + box.width, box.y + box.height - cornerSize);
            octx.stroke();

            const bannerWidth = Math.max(260, box.width);
            octx.fillStyle = '#d97706';
            octx.fillRect(box.x, Math.max(0, box.y - 34), bannerWidth, 30);
            octx.font = 'bold 12px sans-serif';
            octx.fillStyle = '#ffffff';
            octx.fillText(`⚠️ ${foreignMatch.worker.name}: NOT ON THIS SITE`, box.x + 8, Math.max(20, box.y - 14));
          } else {
            // UNRECOGNIZED FACE (Stranger / random face / distance > 0.44)
            setCurrentMatch(null);
            matchHoldCounterRef.current = { workerId: '', count: 0 };
            setDetectionStatus({
              status: 'UNRECOGNIZED',
              score: Math.round(detection.score * 100),
            });

            // Red Warning HUD: Distinctly shows unknown person
            octx.lineWidth = 2.5;
            octx.strokeStyle = '#f43f5e';
            octx.fillStyle = 'rgba(244, 63, 94, 0.12)';
            octx.strokeRect(box.x, box.y, box.width, box.height);
            octx.fillRect(box.x, box.y, box.width, box.height);

            const cornerSize = 16;
            octx.lineWidth = 3.5;
            octx.strokeStyle = '#fb7185';

            octx.beginPath();
            octx.moveTo(box.x, box.y + cornerSize);
            octx.lineTo(box.x, box.y);
            octx.lineTo(box.x + cornerSize, box.y);
            octx.stroke();

            octx.beginPath();
            octx.moveTo(box.x + box.width - cornerSize, box.y);
            octx.lineTo(box.x + box.width, box.y);
            octx.lineTo(box.x + box.width, box.y + cornerSize);
            octx.stroke();

            octx.beginPath();
            octx.moveTo(box.x, box.y + box.height - cornerSize);
            octx.lineTo(box.x, box.y + box.height);
            octx.lineTo(box.x + cornerSize, box.y + box.height);
            octx.stroke();

            octx.beginPath();
            octx.moveTo(box.x + box.width - cornerSize, box.y + box.height);
            octx.lineTo(box.x + box.width, box.y + box.height);
            octx.lineTo(box.x + box.width, box.y + box.height - cornerSize);
            octx.stroke();

            // Banner above head
            const bannerWidth = Math.max(260, box.width);
            octx.fillStyle = 'rgba(225, 29, 72, 0.9)';
            octx.fillRect(box.x, Math.max(0, box.y - 34), bannerWidth, 30);
            octx.font = 'bold 11px sans-serif';
            octx.fillStyle = '#ffffff';
            octx.fillText('❌ UNRECOGNIZED PERSON / অপরিচিত মুখ', box.x + 8, Math.max(20, box.y - 14));
          }
        } else {
          setCurrentMatch(null);
          matchHoldCounterRef.current = { workerId: '', count: 0 };
          setDetectionStatus({ status: 'AWAITING' });
        }
      } catch (err) {
        console.error('[FaceAI Scan Error]', err);
      } finally {
        isDetectingRef.current = false;
      }
    }

    if (isLoopRunningRef.current) {
      requestAnimationFrame(runLiveFaceScanner);
    }
  };

  // Submit AI Face Check-In
  const handleAutoCheckin = async (workerId: string, confidence: number, workerName?: string) => {
    if (!selectedSiteId) return;

    if (!isWithinGeofence) {
      showToast('error', 'Location Blocked: You must be physically on-site to record Check-In.');
      return;
    }

    if (autoCooldownRef.current) return;

    // Capture current frame from canvas as image proof
    const canvas = canvasRef.current;
    let photoData = '';
    if (canvas) {
      photoData = canvas.toDataURL('image/jpeg', 0.85);
    }

    setSubmitting(true);
    setAutoCooldown(true);
    autoCooldownRef.current = true;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API.checkin, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          workerId,
          siteId: selectedSiteId,
          imageProofUrl: photoData || undefined,
          locationLat: currentGPS?.lat,
          locationLng: currentGPS?.lng,
          verificationMethod: 'FACE_AI_AUTO',
          confidenceScore: confidence,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const name = data.worker?.name || workerName || 'Worker';
        setLastActionSuccess({ name, type: 'CHECK_IN' });
        showToast('success', `🎉 Face Verified: Check-In marked for ${name}!`);
        fetchData();
      } else {
        const err = await res.json();
        showToast('error', err.error || 'Failed to record check-in');
      }
    } catch {
      showToast('error', 'Network error while recording check-in');
    } finally {
      setSubmitting(false);
      setTimeout(() => {
        setAutoCooldown(false);
        autoCooldownRef.current = false;
      }, 4500);
    }
  };

  // Submit AI Face Check-Out
  const handleAutoCheckout = async (workerId: string, confidence: number, workerName?: string) => {
    if (!selectedSiteId) return;

    if (!isWithinGeofence) {
      showToast('error', 'Location Blocked: You must be physically on-site to record Check-Out.');
      return;
    }

    if (autoCooldownRef.current) return;

    const canvas = canvasRef.current;
    let photoData = '';
    if (canvas) {
      photoData = canvas.toDataURL('image/jpeg', 0.85);
    }

    setSubmitting(true);
    setAutoCooldown(true);
    autoCooldownRef.current = true;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API.checkout, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          workerId,
          siteId: selectedSiteId,
          imageProofUrl: photoData || undefined,
          locationLat: currentGPS?.lat,
          locationLng: currentGPS?.lng,
          verificationMethod: 'FACE_AI_AUTO',
          confidenceScore: confidence,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const name = data.worker?.name || workerName || 'Worker';
        const hoursWorked = data.totalHours != null ? `${data.totalHours} hrs` : '';
        setLastActionSuccess({ name, type: 'CHECK_OUT', hours: data.totalHours });
        showToast('success', `👋 Check-Out Verified: Goodbye ${name}! ${hoursWorked ? `Total: ${hoursWorked}` : ''}`);
        fetchData();
      } else {
        const err = await res.json();
        showToast('error', err.error || 'Failed to record check-out');
      }
    } catch {
      showToast('error', 'Network error while recording check-out');
    } finally {
      setSubmitting(false);
      setTimeout(() => {
        setAutoCooldown(false);
        autoCooldownRef.current = false;
      }, 4500);
    }
  };

  // Quick One-Click Checkout for Admin/Manager
  const handleQuickCheckout = async (attendanceId: string) => {
    if (!isWithinGeofence) {
      showToast('error', 'Location Blocked: You must be physically on-site to check out.');
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(API.checkout, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          attendanceId,
          locationLat: currentGPS?.lat,
          locationLng: currentGPS?.lng,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const durationMsg = data.totalHours != null ? ` (${data.totalHours} hrs)` : '';
        showToast('success', `Check-out recorded successfully${durationMsg}`);
        fetchData();
      } else {
        const err = await res.json();
        showToast('error', err.error || 'Failed to check out');
      }
    } catch {
      showToast('error', 'Failed to check out');
    }
  };

  if (dataLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 bg-card border border-border rounded-3xl">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground text-xs font-semibold">Loading biometric attendance system...</p>
      </div>
    );
  }

  // Helper to determine matched worker's today status
  const matchedActiveRecord = currentMatch ? attendances.find(a => a.worker.id === currentMatch.worker.id && !a.checkOutTime) : null;
  const matchedCompletedRecord = currentMatch ? attendances.find(a => a.worker.id === currentMatch.worker.id && a.checkOutTime) : null;

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

      {/* Header & Site Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 rounded-3xl border border-border shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-foreground">Biometric Attendance</h1>
            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
              <Zap className="w-3 h-3" />
              <span>Live AI Camera Only</span>
            </span>
          </div>
          <p className="text-muted-foreground text-xs mt-0.5">
            Strict on-site location verified live face recognition for instant Check-In and Check-Out.
          </p>
        </div>

        {/* Site Selector Dropdown */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Building2 className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <select
              value={selectedSiteId}
              onChange={e => {
                setSelectedSiteId(e.target.value);
                stopCamera();
              }}
              className="bg-muted border border-border text-foreground pl-9 pr-8 py-2.5 rounded-2xl text-xs outline-none focus:border-primary transition-all font-semibold appearance-none"
            >
              {assignedSites.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.workers.length} workers)
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={fetchData}
            className="text-xs bg-muted hover:bg-secondary text-muted-foreground hover:text-foreground flex items-center gap-1.5 px-3 py-2 rounded-2xl border border-border transition-colors font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Geofence & GPS Status Banner (Strict Enforcement) */}
      <div className={`border rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs transition-colors ${
        !isWithinGeofence
          ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
      }`}>
        <div className="flex items-center gap-2.5">
          {gpsLoading ? (
            <Compass className="w-4 h-4 animate-spin text-primary" />
          ) : isWithinGeofence ? (
            <MapPin className="w-4 h-4 text-emerald-400" />
          ) : (
            <MapPinOff className="w-4 h-4 text-rose-400" />
          )}
          <span className="font-semibold text-foreground">{geofenceMessage}</span>
        </div>

        <div className="flex items-center gap-2">
          {!isWithinGeofence && (
            <button
              type="button"
              onClick={requestGPS}
              disabled={gpsLoading}
              className="px-3 py-1 rounded-xl font-black text-[11px] bg-rose-500 hover:bg-rose-600 text-foreground transition-all flex items-center gap-1 shadow-md shadow-rose-500/20"
            >
              <Compass className={`w-3 h-3 ${gpsLoading ? 'animate-spin' : ''}`} />
              <span>Retry GPS</span>
            </button>
          )}

          {/* Auto check-in toggle */}
          <button
            type="button"
            onClick={() => setAutoCheckinEnabled(!autoCheckinEnabled)}
            className={`px-3 py-1.5 rounded-xl font-bold text-[11px] border transition-all flex items-center gap-1.5 ${
              autoCheckinEnabled
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-muted text-muted-foreground border-border'
            }`}
          >
            <Zap className="w-3 h-3" />
            <span>Auto-Mark: {autoCheckinEnabled ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* ─── LIVE AI FACE SCANNER (CAMERA ONLY) ─── */}
      <div className="flex flex-col gap-4">
        {/* Scanner Action Selector Bar: Smart Auto, Force In, Force Out */}
        <div className="bg-card border border-border p-3.5 rounded-2xl shadow-md flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-foreground flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Camera Action:</span>
            </span>
            <span className="text-[11px] text-muted-foreground hidden sm:inline">
              {scannerAction === 'SMART_AUTO'
                ? '⚡ Auto detects arrival (Check-In) or departure (Check-Out)'
                : scannerAction === 'CHECK_IN'
                ? '🟢 Force Check-In mode only'
                : '🔴 Force Check-Out mode only'}
            </span>
          </div>

          <div className="flex items-center gap-1 bg-muted p-1 rounded-xl border border-border w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setScannerAction('SMART_AUTO')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                scannerAction === 'SMART_AUTO'
                  ? 'bg-primary text-foreground shadow-md'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>⚡ Smart Auto</span>
            </button>
            <button
              type="button"
              onClick={() => setScannerAction('CHECK_IN')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                scannerAction === 'CHECK_IN'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Check-In</span>
            </button>
            <button
              type="button"
              onClick={() => setScannerAction('CHECK_OUT')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                scannerAction === 'CHECK_OUT'
                  ? 'bg-rose-500 text-foreground shadow-md'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Check-Out</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Live Camera Viewport */}
          <div className="lg:col-span-8 bg-card border border-border p-6 rounded-3xl shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black text-foreground flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${cameraActive ? 'bg-emerald-400 animate-ping' : 'bg-muted-foreground'}`} />
                  <span>{cameraActive ? 'Live Camera Face Scanner Active' : 'Camera Standby'}</span>
                </span>
                <span className="text-[11px] font-semibold text-muted-foreground">
                  {workersForSite.filter(w => w.isFaceEnrolled).length} of {workersForSite.length} workers enrolled
                </span>
              </div>

              {/* Viewport with HUD Canvas */}
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black/90 border border-border flex items-center justify-center shadow-2xl mb-4">
                {cameraActive ? (
                  <>
                    <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
                    <canvas ref={canvasRef} className="hidden" />
                    <canvas ref={overlayCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

                    {/* Celebration banner on successful check-in or check-out */}
                    {lastActionSuccess && autoCooldown && (
                      <div className={`absolute top-4 inset-x-4 px-4 py-2.5 rounded-2xl font-black text-xs flex items-center justify-center gap-2 backdrop-blur-md shadow-2xl animate-in zoom-in-95 ${
                        lastActionSuccess.type === 'CHECK_IN'
                          ? 'bg-emerald-500/95 text-slate-950 border border-emerald-400'
                          : 'bg-rose-500/95 text-foreground border border-rose-400'
                      }`}>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>
                          {lastActionSuccess.type === 'CHECK_IN'
                            ? `✓ Check-In Verified: Attendance Marked for ${lastActionSuccess.name}!`
                            : `👋 Check-Out Verified: Goodbye ${lastActionSuccess.name}! ${lastActionSuccess.hours != null ? `(${lastActionSuccess.hours} hrs)` : ''}`}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-3 text-center p-6">
                    <div className={`w-16 h-16 rounded-3xl flex items-center justify-center text-3xl shadow-xl animate-float ${
                      isWithinGeofence
                        ? 'bg-primary/10 border border-primary/20 text-primary'
                        : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                    }`}>
                      {isWithinGeofence ? '🤖' : '📍'}
                    </div>
                    <h3 className="text-foreground font-black text-base">
                      {isWithinGeofence ? 'Live AI Biometrics Ready' : 'On-Site Location Required'}
                    </h3>
                    <p className="text-muted-foreground text-xs max-w-sm">
                      {isWithinGeofence
                        ? 'Start the camera on-site. Workers standing in front of the lens will be automatically identified to Check-In or Check-Out.'
                        : 'Attendance can only be taken physically on-site. Please ensure you are within the site boundary and device GPS is enabled.'}
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

            {/* Camera Controls */}
            <div className="pt-2">
              {!cameraActive ? (
                <button
                  type="button"
                  onClick={startCamera}
                  disabled={!isWithinGeofence || modelLoading}
                  className={`w-full py-4 rounded-2xl font-black text-sm transition-all shadow-xl flex items-center justify-center gap-2 ${
                    !isWithinGeofence
                      ? 'bg-muted text-muted-foreground border border-border cursor-not-allowed opacity-60'
                      : 'bg-primary hover:bg-primary/90 text-foreground shadow-primary/25 hover:scale-[1.01] active:scale-[0.99] btn-interactive'
                  }`}
                >
                  {modelLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Loading Neural AI Models...</span>
                    </>
                  ) : !isWithinGeofence ? (
                    <>
                      <MapPinOff className="w-5 h-5 text-rose-400" />
                      <span>Outside Site Location — Attendance Blocked</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-5 h-5" />
                      <span>Start Live AI Biometric Camera</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopCamera}
                  className="w-full bg-secondary hover:bg-muted text-foreground py-3.5 rounded-2xl font-bold text-xs transition-colors border border-border flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  <span>Stop Camera</span>
                </button>
              )}
            </div>
          </div>

          {/* Real-time Recognition Result Sidebar Card */}
          <div className="lg:col-span-4 bg-card border border-border p-6 rounded-3xl shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-black text-primary uppercase tracking-widest mb-1">
                <Scan className="w-4 h-4" />
                <span>Detection Match</span>
              </div>
              <h2 className="text-lg font-black text-foreground mb-4">Identified Personnel</h2>

              {currentMatch ? (
                <div className={`bg-muted/80 border rounded-3xl p-5 shadow-lg flex flex-col gap-4 animate-in zoom-in-95 duration-200 ${
                  matchedActiveRecord
                    ? 'border-rose-500/40'
                    : matchedCompletedRecord
                    ? 'border-sky-500/40'
                    : 'border-emerald-500/40'
                }`}>
                  <div className="flex items-center gap-3.5">
                    <div className={`w-14 h-14 rounded-2xl overflow-hidden border-2 bg-muted flex items-center justify-center text-xl font-black text-foreground shadow-md flex-shrink-0 ${
                      matchedActiveRecord ? 'border-rose-400' : 'border-emerald-400'
                    }`}>
                      {currentMatch.worker.avatarUrl ? (
                        <img src={currentMatch.worker.avatarUrl} alt={currentMatch.worker.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{currentMatch.worker.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-black text-foreground text-base leading-tight truncate">{currentMatch.worker.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-mono font-black text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-lg">
                          #{currentMatch.worker.idNumber || 'NO ID'}
                        </span>
                        <span className="text-xs font-black text-emerald-500 dark:text-emerald-400">{currentMatch.confidence}% Match</span>
                      </div>
                    </div>
                  </div>

                  {/* Verification Hold Progress Indicator */}
                  {detectionStatus.status === 'MATCHED' && (detectionStatus.verificationFrames ?? 0) < 4 && (
                    <div className="bg-primary/10 border border-primary/20 rounded-2xl p-3 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-primary">
                        <span>Verifying Face Stability...</span>
                        <span>{detectionStatus.verificationFrames || 1}/4</span>
                      </div>
                      <div className="w-full bg-primary/20 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-primary h-full transition-all duration-150"
                          style={{ width: `${((detectionStatus.verificationFrames || 1) / 4) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    {matchedActiveRecord ? (
                      <span className="px-2.5 py-1 rounded-xl text-[11px] font-black bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>On Duty (In: {new Date(matchedActiveRecord.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
                      </span>
                    ) : matchedCompletedRecord ? (
                      <span className="px-2.5 py-1 rounded-xl text-[11px] font-black bg-sky-500/10 text-sky-500 dark:text-sky-400 border border-sky-500/20 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Shift Completed Today ✓</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-xl text-[11px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                        <LogIn className="w-3 h-3" />
                        <span>Ready for Check-In</span>
                      </span>
                    )}
                  </div>

                  <div className="bg-secondary/60 rounded-2xl p-3 border border-border text-xs flex flex-col gap-1">
                    <div className="text-muted-foreground flex justify-between">
                      <span>User ID:</span>
                      <span className="text-foreground font-mono font-bold">#{currentMatch.worker.idNumber || currentMatch.worker.username}</span>
                    </div>
                    {currentMatch.worker.phone && (
                      <div className="text-muted-foreground flex justify-between">
                        <span>Phone:</span>
                        <span className="text-foreground font-semibold">{currentMatch.worker.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Interactive Action Button for Matched Worker */}
                  {!isWithinGeofence ? (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-[11px] text-rose-600 dark:text-rose-300 font-bold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>Attendance Blocked: Outside site location</span>
                    </div>
                  ) : matchedActiveRecord ? (
                    <button
                      type="button"
                      onClick={() => handleAutoCheckout(currentMatch.worker.id, currentMatch.confidence, currentMatch.worker.name)}
                      disabled={submitting || autoCooldown}
                      className="w-full bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white py-3.5 rounded-2xl font-black text-xs transition-all shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{submitting ? 'Recording Check-Out...' : autoCooldown ? 'Recorded ✓' : 'Confirm & Mark Check-Out'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleAutoCheckin(currentMatch.worker.id, currentMatch.confidence, currentMatch.worker.name)}
                      disabled={submitting || autoCooldown}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white py-3.5 rounded-2xl font-black text-xs transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>{submitting ? 'Recording Check-In...' : autoCooldown ? 'Recorded ✓' : 'Confirm & Mark Check-In'}</span>
                    </button>
                  )}
                </div>
              ) : detectionStatus.status === 'SITE_MISMATCH' && detectionStatus.mismatchWorker ? (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-6 text-center flex flex-col items-center gap-3 animate-in fade-in">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-amber-700 dark:text-amber-400">⚠️ Site Assignment Mismatch</h3>
                    <p className="text-xs font-black text-foreground mt-0.5">{detectionStatus.mismatchWorker.name}</p>
                    <span className="text-[10px] font-mono text-muted-foreground font-semibold">#{detectionStatus.mismatchWorker.idNumber || detectionStatus.mismatchWorker.username}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    This worker is enrolled, but is <strong>NOT assigned</strong> to this project site. Attendance is strictly blocked.
                  </p>
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full">
                    Site Unauthorized
                  </span>
                </div>
              ) : detectionStatus.status === 'UNRECOGNIZED' ? (
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-3xl p-6 text-center flex flex-col items-center gap-3 animate-in fade-in">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-black text-rose-600 dark:text-rose-400">❌ Unrecognized Person / অপরিচিত মুখ</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Face detected, but does not match any enrolled personnel with required biometric confidence (70%+). Attendance is blocked.
                  </p>
                  <div className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-full">
                    Not Registered In System
                  </div>
                </div>
              ) : (
                <div className="bg-muted/40 border border-dashed border-border rounded-3xl p-8 text-center flex flex-col items-center gap-2">
                  <User className="w-10 h-10 opacity-20 text-foreground" />
                  <p className="text-foreground font-bold text-xs">Awaiting Face in Frame</p>
                  <p className="text-muted-foreground text-[11px]">
                    Position an enrolled worker in front of the camera to check-in or check-out.
                  </p>
                </div>
              )}
            </div>

            {/* Quick Enrolled Personnel Roster */}
            <div className="mt-4 pt-4 border-t border-border text-[11px] text-muted-foreground flex flex-col gap-1.5">
              <span className="font-bold text-foreground flex items-center justify-between">
                <span>Site Workforce Biometrics:</span>
                <span className="text-emerald-400 font-mono">
                  {workersForSite.filter(w => w.isFaceEnrolled).length}/{workersForSite.length} Ready
                </span>
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {workersForSite.map(w => (
                  <span
                    key={w.id}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border flex items-center gap-1 ${
                      w.isFaceEnrolled
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-muted text-muted-foreground border-border'
                    }`}
                  >
                    {w.isFaceEnrolled ? '✓' : '⚠️'} {w.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── TODAY'S ATTENDANCE LOG TABLE ─── */}
      <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-foreground">Today's Attendance Roster</h2>
            <p className="text-xs text-muted-foreground">Live camera verified check-ins, check-outs, and real-time photo proofs.</p>
          </div>
          <span className="text-xs font-black bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-xl">
            {attendances.length} Records
          </span>
        </div>

        {attendances.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-xs font-semibold bg-muted/30 rounded-2xl border border-dashed border-border">
            No attendance recorded today yet for this site.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border text-muted-foreground font-bold">
                  <th className="py-3 px-3">Worker</th>
                  <th className="py-3 px-3">Check-In</th>
                  <th className="py-3 px-3">Check-Out</th>
                  <th className="py-3 px-3">Shift Duration</th>
                  <th className="py-3 px-3">Camera Proofs</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {attendances.map(a => {
                  const durationStr = formatShiftDuration(a.checkInTime, a.checkOutTime);
                  return (
                    <tr key={a.id} className="hover:bg-secondary/20 transition-colors">
                      {/* Worker Info */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-muted border border-border overflow-hidden flex items-center justify-center font-bold flex-shrink-0">
                            {a.worker.avatarUrl ? (
                              <img src={a.worker.avatarUrl} alt={a.worker.name} className="w-full h-full object-cover" />
                            ) : (
                              <span>{a.worker.name.charAt(0)}</span>
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-foreground">{a.worker.name}</div>
                            <div className="text-[10px] text-muted-foreground font-mono">#{a.worker.idNumber || 'NO ID'}</div>
                          </div>
                        </div>
                      </td>

                      {/* Check-In Details */}
                      <td className="py-3.5 px-3">
                        <div className="flex flex-col gap-1">
                          <span className="font-mono font-bold text-foreground">
                            {new Date(a.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-md w-fit">
                            <Zap className="w-2.5 h-2.5" />
                            <span>AI Face ({a.confidenceScore || 90}%)</span>
                          </span>
                        </div>
                      </td>

                      {/* Check-Out Details */}
                      <td className="py-3.5 px-3">
                        {a.checkOutTime ? (
                          <div className="flex flex-col gap-1">
                            <span className="font-mono font-bold text-foreground">
                              {new Date(a.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[9px] font-black text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded-md w-fit">
                              <Zap className="w-2.5 h-2.5" />
                              <span>AI Face Out</span>
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            <span>On Duty</span>
                          </span>
                        )}
                      </td>

                      {/* Shift Duration */}
                      <td className="py-3.5 px-3">
                        <span className={`text-[11px] font-bold font-mono px-2 py-0.5 rounded-lg border ${
                          a.checkOutTime 
                            ? 'bg-secondary/60 text-foreground border-border'
                            : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                        }`}>
                          {durationStr}
                        </span>
                      </td>

                      {/* Photo Proofs (Check-In & Check-Out) */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          {a.imageProofUrl ? (
                            <button
                              type="button"
                              onClick={() => setViewPhotoModal({
                                url: a.imageProofUrl!,
                                title: 'Check-In Camera Proof',
                                type: 'CHECK_IN',
                                workerName: a.worker.name,
                                time: new Date(a.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                method: a.verificationMethod,
                              })}
                              className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[10px] font-black flex items-center gap-1 transition-all"
                            >
                              <Eye className="w-3 h-3" />
                              <span>In Proof</span>
                            </button>
                          ) : (
                            <span className="text-muted-foreground/40 text-[10px]">—</span>
                          )}

                          {a.checkOutImageProofUrl ? (
                            <button
                              type="button"
                              onClick={() => setViewPhotoModal({
                                url: a.checkOutImageProofUrl!,
                                title: 'Check-Out Camera Proof',
                                type: 'CHECK_OUT',
                                workerName: a.worker.name,
                                time: a.checkOutTime ? new Date(a.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
                                method: a.checkOutMethod,
                              })}
                              className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-[10px] font-black flex items-center gap-1 transition-all"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Out Proof</span>
                            </button>
                          ) : a.checkOutTime ? (
                            <span className="text-muted-foreground/40 text-[10px]">—</span>
                          ) : null}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3 text-right">
                        {!a.checkOutTime ? (
                          <button
                            type="button"
                            onClick={() => handleQuickCheckout(a.id)}
                            disabled={!isWithinGeofence}
                            className="bg-rose-500/10 hover:bg-rose-500/20 disabled:opacity-40 text-rose-400 border border-rose-500/30 px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ml-auto"
                          >
                            <LogOut className="w-3 h-3" />
                            <span>Check Out</span>
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-400">Completed ✓</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Photo Proof Modal with Meta Information */}
      {viewPhotoModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setViewPhotoModal(null)}
        >
          <div 
            className="relative max-w-md w-full bg-card p-5 rounded-3xl border border-border shadow-2xl flex flex-col gap-3" 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-sm font-black text-foreground">{viewPhotoModal.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {viewPhotoModal.workerName} • {viewPhotoModal.time}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewPhotoModal(null)}
                className="bg-muted text-foreground p-1.5 rounded-full hover:bg-secondary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden border border-border bg-black aspect-video flex items-center justify-center">
              <img src={viewPhotoModal.url} alt="Proof" className="w-full h-full object-cover" />
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
              <span>Verification: <strong className="text-foreground">Live AI Camera</strong></span>
              <span className={`font-black uppercase px-2 py-0.5 rounded-md text-[10px] ${
                viewPhotoModal.type === 'CHECK_IN' 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}>
                {viewPhotoModal.type === 'CHECK_IN' ? 'Check-In' : 'Check-Out'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
