import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../../config/api';
import {
  Eye, EyeOff, AlertCircle, CheckCircle2, RefreshCw, ArrowRight, X, Sparkles
} from 'lucide-react';

/* ─── Floating 3D Abstract Shapes ────────────────────────────────────────── */
function ShapeLightningLeft() {
  return (
    <svg viewBox="0 0 120 160" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <defs>
        <linearGradient id="lgBolt1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <filter id="glowBolt">
          <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#f59e0b" floodOpacity="0.6" />
          <feDropShadow dx="4" dy="8" stdDeviation="6" floodColor="#92400e" floodOpacity="0.4" />
        </filter>
      </defs>
      <path d="M70 10 L35 75 L60 75 L30 150 L90 60 L62 60 Z" fill="url(#lgBolt1)" filter="url(#glowBolt)" opacity="0.95" />
    </svg>
  );
}

function ShapeLightningSmall() {
  return (
    <svg viewBox="0 0 80 110" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <defs>
        <linearGradient id="lgBolt2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
        <filter id="glowBolt2">
          <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#fbbf24" floodOpacity="0.5" />
        </filter>
      </defs>
      <path d="M50 5 L22 55 L42 55 L18 105 L65 45 L42 45 Z" fill="url(#lgBolt2)" filter="url(#glowBolt2)" opacity="0.85" />
    </svg>
  );
}

function ShapeCrescent() {
  return (
    <svg viewBox="0 0 110 110" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <defs>
        <linearGradient id="lgCrescent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fcd34d" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <filter id="glowCrescent">
          <feDropShadow dx="0" dy="0" stdDeviation="10" floodColor="#f59e0b" floodOpacity="0.55" />
        </filter>
      </defs>
      <path d="M85 15 C105 35 105 75 85 95 C75 105 60 108 48 103 C68 98 80 82 80 55 C80 28 68 12 48 7 C60 2 75 5 85 15 Z" fill="url(#lgCrescent)" filter="url(#glowCrescent)" opacity="0.9" />
    </svg>
  );
}

function ShapeHook() {
  return (
    <svg viewBox="0 0 100 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <defs>
        <linearGradient id="lgHook" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#292524" />
          <stop offset="100%" stopColor="#44403c" />
        </linearGradient>
        <filter id="glowHook">
          <feDropShadow dx="3" dy="6" stdDeviation="8" floodColor="#f59e0b" floodOpacity="0.25" />
        </filter>
      </defs>
      <path d="M65 10 C90 10 90 50 65 60 L65 140 C65 165 45 180 25 170 C5 160 5 135 25 130 C35 127 40 130 40 140 C40 145 35 148 30 145 C55 148 50 160 40 155 C30 150 38 130 50 130 L50 60 C25 50 25 10 50 10 Z" fill="url(#lgHook)" filter="url(#glowHook)" opacity="0.75" stroke="#f59e0b" strokeWidth="1.5" strokeOpacity="0.4" />
    </svg>
  );
}

function ShapeWave() {
  return (
    <svg viewBox="0 0 200 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <defs>
        <linearGradient id="lgWave" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.4" />
        </linearGradient>
        <filter id="glowWave">
          <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#fbbf24" floodOpacity="0.35" />
        </filter>
      </defs>
      <path d="M10 40 C30 15 50 65 80 40 C110 15 130 65 160 40 C175 27 185 32 195 40" stroke="url(#lgWave)" strokeWidth="13" strokeLinecap="round" fill="none" filter="url(#glowWave)" />
    </svg>
  );
}

function ShapeWaveSmall() {
  return (
    <svg viewBox="0 0 120 50" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <defs>
        <linearGradient id="lgWaveS" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#fcd34d" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      <path d="M5 25 C20 8 35 42 55 25 C75 8 90 42 115 25" stroke="url(#lgWaveS)" strokeWidth="10" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function ShapeBigBlob() {
  return (
    <svg viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <defs>
        <radialGradient id="lgBlob" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#292524" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#1c1917" stopOpacity="0.2" />
        </radialGradient>
      </defs>
      <path d="M150 30 C210 20 270 60 280 120 C295 185 250 250 185 270 C120 290 50 255 25 190 C0 125 35 55 95 35 C115 28 130 33 150 30 Z" fill="url(#lgBlob)" />
    </svg>
  );
}

function ShapeGoldRing() {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <defs>
        <linearGradient id="lgRing" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fcd34d" stopOpacity="0.6" />
          <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#92400e" stopOpacity="0.3" />
        </linearGradient>
        <filter id="glowRing">
          <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#f59e0b" floodOpacity="0.5" />
        </filter>
      </defs>
      <circle cx="60" cy="60" r="48" stroke="url(#lgRing)" strokeWidth="12" fill="none" filter="url(#glowRing)" strokeDasharray="80 220" strokeLinecap="round" />
    </svg>
  );
}

function ShapeGoldRingLarge() {
  return (
    <svg viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <defs>
        <linearGradient id="lgRingL" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.15" />
          <stop offset="50%" stopColor="#d97706" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#92400e" stopOpacity="0.08" />
        </linearGradient>
      </defs>
      <circle cx="120" cy="120" r="105" stroke="url(#lgRingL)" strokeWidth="18" fill="none" strokeDasharray="140 520" strokeLinecap="round" />
    </svg>
  );
}

/* ─── Gold particle dots ─────────────────────────────────────────────────── */
function GoldDots() {
  return (
    <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      {[
        [20,20],[60,10],[120,30],[10,80],[50,65],[100,55],[140,80],
        [30,130],[80,120],[135,140],[160,50],[70,155]
      ].map(([cx,cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={i % 3 === 0 ? 3.5 : i % 2 === 0 ? 2.5 : 1.8}
          fill="#f59e0b" opacity={0.15 + (i % 5) * 0.07} />
      ))}
    </svg>
  );
}

/* ─── Main Login Component ────────────────────────────────────────────────── */
export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState<'REQUEST_OTP' | 'VERIFY_OTP' | 'NEW_PASSWORD'>('REQUEST_OTP');
  const [resetPhone, setResetPhone] = useState('');
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [receivedOtpDisplay, setReceivedOtpDisplay] = useState('');
  const [targetAccountName, setTargetAccountName] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch(API.login, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/dashboard');
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const openForgotModal = () => {
    setShowForgotModal(true); setForgotStep('REQUEST_OTP');
    setResetPhone(''); setResetIdentifier(username || '');
    setResetOtp(''); setNewPassword(''); setConfirmPassword('');
    setForgotError(''); setForgotSuccess('');
    setReceivedOtpDisplay(''); setTargetAccountName('');
  };

  const closeForgotModal = () => {
    setShowForgotModal(false);
    setForgotError(''); setForgotSuccess(''); setReceivedOtpDisplay('');
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault(); setForgotLoading(true); setForgotError(''); setForgotSuccess('');
    try {
      const res = await fetch(API.forgotPasswordOtp, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: resetPhone, identifier: resetIdentifier || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
      setForgotSuccess(data.message || 'OTP sent!');
      if (data.otpCode) setReceivedOtpDisplay(data.otpCode);
      if (data.user?.name) setTargetAccountName(data.user.name);
      setForgotStep('VERIFY_OTP');
    } catch (err: any) { setForgotError(err.message); }
    finally { setForgotLoading(false); }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault(); setForgotLoading(true); setForgotError('');
    try {
      const res = await fetch(API.forgotPasswordVerify, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: resetPhone, otp: resetOtp, identifier: resetIdentifier || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid OTP');
      setForgotSuccess('OTP verified! Set your new password.');
      setForgotStep('NEW_PASSWORD');
    } catch (err: any) { setForgotError(err.message); }
    finally { setForgotLoading(false); }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setForgotError('Passwords do not match.'); return; }
    if (newPassword.length < 6) { setForgotError('Password must be at least 6 characters.'); return; }
    setForgotLoading(true); setForgotError('');
    try {
      const res = await fetch(API.forgotPasswordReset, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: resetPhone, otp: resetOtp, newPassword, identifier: resetIdentifier || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reset failed');
      if (data.user?.idNumber) setUsername(data.user.idNumber);
      else if (data.user?.username) setUsername(data.user.username);
      closeForgotModal();
      alert('🎉 Password reset successfully! Please log in.');
    } catch (err: any) { setForgotError(err.message); }
    finally { setForgotLoading(false); }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        .lp-root {
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Inter', sans-serif;
          /* Midnight Black gradient */
          background:
            radial-gradient(ellipse at 20% 10%, #292116 0%, transparent 55%),
            radial-gradient(ellipse at 80% 90%, #1a1208 0%, transparent 55%),
            radial-gradient(ellipse at 50% 50%, #0f0e0b 0%, #070604 100%);
          overflow: hidden;
          position: relative;
        }

        /* subtle golden texture overlay */
        .lp-root::before {
          content: '';
          position: absolute; inset: 0;
          background-image:
            radial-gradient(ellipse at 15% 50%, rgba(245,158,11,0.07) 0%, transparent 50%),
            radial-gradient(ellipse at 85% 30%, rgba(251,191,36,0.05) 0%, transparent 45%);
          pointer-events: none;
        }

        /* ── Floating shapes ── */
        .fl { position: absolute; pointer-events: none; }
        .fl-bolt-l    { top: 20%; left: 5%;  width: 75px; height: 105px; animation: floatA 5.5s ease-in-out infinite; }
        .fl-bolt-s    { top: 50%; left: 10%; width: 48px; height: 68px;  animation: floatB 7s ease-in-out infinite; }
        .fl-crescent  { top: 2%;  left: 43%; width: 68px; height: 68px;  animation: floatC 6.5s ease-in-out infinite; }
        .fl-hook      { top: 5%;  right: 3%; width: 85px; height: 175px; animation: floatA 8.5s ease-in-out infinite reverse; }
        .fl-wave      { bottom: 12%; right: 3%; width: 170px; height: 65px; animation: floatB 6s ease-in-out infinite; }
        .fl-wave-s    { top: 58%; right: 8%; width: 105px; height: 42px;  animation: floatC 5.5s ease-in-out infinite reverse; }
        .fl-blob      { bottom: -8%; left: -4%; width: 300px; height: 300px; animation: floatD 10s ease-in-out infinite; }
        .fl-ring-sm   { top: 28%; right: 16%; width: 90px; height: 90px; animation: floatA 9s ease-in-out infinite; }
        .fl-ring-lg   { bottom: 5%; left: 18%; width: 200px; height: 200px; animation: floatD 12s ease-in-out infinite reverse; }
        .fl-dots      { top: 8%; left: 20%; width: 160px; height: 160px; animation: floatC 15s ease-in-out infinite; opacity: 0.8; }
        .fl-dots2     { bottom: 12%; right: 18%; width: 120px; height: 120px; animation: floatB 13s ease-in-out infinite reverse; opacity: 0.6; }

        @keyframes floatA {
          0%,100% { transform: translateY(0px) rotate(0deg); }
          50%      { transform: translateY(-20px) rotate(4deg); }
        }
        @keyframes floatB {
          0%,100% { transform: translateY(0px) rotate(0deg); }
          50%      { transform: translateY(-14px) rotate(-5deg); }
        }
        @keyframes floatC {
          0%,100% { transform: translateY(0px) scale(1); }
          50%      { transform: translateY(-10px) scale(1.06); }
        }
        @keyframes floatD {
          0%,100% { transform: translateY(0px) rotate(0deg); }
          33%      { transform: translateY(-9px) rotate(2deg); }
          66%      { transform: translateY(7px) rotate(-2deg); }
        }

        /* ── Card ── */
        .lp-card {
          position: relative; z-index: 10;
          width: 100%; max-width: 420px;
          background: linear-gradient(145deg, #1a1812 0%, #141210 100%);
          border: 1px solid rgba(245,158,11,0.2);
          border-radius: 28px;
          padding: 40px 38px 36px;
          box-shadow:
            0 0 0 1px rgba(245,158,11,0.08),
            0 32px 80px rgba(0,0,0,0.8),
            0 8px 32px rgba(0,0,0,0.6),
            inset 0 1px 0 rgba(245,158,11,0.15),
            inset 0 -1px 0 rgba(0,0,0,0.5);
        }

        /* gold shimmer top edge */
        .lp-card::before {
          content: '';
          position: absolute; top: 0; left: 10%; right: 10%; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(251,191,36,0.6), rgba(245,158,11,0.8), rgba(251,191,36,0.6), transparent);
          border-radius: 100%;
        }

        /* ── Logo ── */
        .lp-logo-wrap {
          display: flex; flex-direction: column; align-items: center;
          margin-bottom: 28px; gap: 8px;
        }
        .lp-logo-icon {
          width: 60px; height: 60px; border-radius: 16px;
          background: linear-gradient(135deg, #1a1208 0%, #292116 100%);
          border: 1.5px solid rgba(245,158,11,0.4);
          display: flex; align-items: center; justify-content: center;
          font-size: 28px; margin-bottom: 2px;
          box-shadow: 0 0 24px rgba(245,158,11,0.2), 0 4px 16px rgba(0,0,0,0.5);
        }
        .lp-company-name {
          font-size: 20px; font-weight: 800; letter-spacing: -0.5px; text-align: center;
          background: linear-gradient(135deg, #fcd34d 0%, #f59e0b 50%, #d97706 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .lp-company-sub {
          font-size: 10.5px; font-weight: 600; text-transform: uppercase;
          letter-spacing: 1.8px; text-align: center; color: rgba(245,158,11,0.45);
        }

        .lp-title {
          font-size: 26px; font-weight: 800; color: #f9f6f0;
          margin-bottom: 22px; letter-spacing: -0.5px;
        }

        /* ── Input ── */
        .lp-group { margin-bottom: 16px; }
        .lp-label {
          display: block; font-size: 11px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 1px; margin-bottom: 7px; color: rgba(251,191,36,0.6);
        }
        .lp-input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1.5px solid rgba(245,158,11,0.18);
          color: #f9f6f0;
          padding: 12px 16px; border-radius: 12px;
          font-size: 14px; font-weight: 500; font-family: 'Inter', sans-serif;
          outline: none; transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
        }
        .lp-input::placeholder { color: rgba(255,255,255,0.2); font-weight: 400; }
        .lp-input:focus {
          border-color: rgba(245,158,11,0.6);
          background: rgba(245,158,11,0.05);
          box-shadow: 0 0 0 3px rgba(245,158,11,0.1), 0 0 16px rgba(245,158,11,0.06);
        }
        .lp-input-wrap { position: relative; }
        .lp-input-wrap .lp-input { padding-right: 44px; }
        .lp-eye {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: rgba(245,158,11,0.4); padding: 4px;
          display: flex; align-items: center; transition: color 0.2s;
        }
        .lp-eye:hover { color: rgba(245,158,11,0.8); }

        /* ── Forgot row ── */
        .lp-forgot-row {
          display: flex; align-items: center; justify-content: space-between; margin-bottom: 7px;
        }
        .lp-forgot-btn {
          background: none; border: none; cursor: pointer; padding: 0;
          font-size: 12px; font-weight: 700; font-family: 'Inter', sans-serif;
          color: rgba(245,158,11,0.7); transition: color 0.2s;
        }
        .lp-forgot-btn:hover { color: #f59e0b; text-decoration: underline; }

        /* ── Error ── */
        .lp-error {
          background: rgba(239,68,68,0.08); border: 1.5px solid rgba(239,68,68,0.3);
          color: #f87171; border-radius: 12px; padding: 11px 14px;
          font-size: 12.5px; font-weight: 600;
          display: flex; align-items: center; gap: 8px; margin-bottom: 16px;
        }

        /* ── Sign In btn ── */
        .lp-btn {
          width: 100%; border: none; border-radius: 12px;
          padding: 14px 0; font-size: 14.5px; font-weight: 800;
          font-family: 'Inter', sans-serif; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          margin-top: 8px; letter-spacing: 0.3px;
          background: linear-gradient(135deg, #d97706 0%, #f59e0b 40%, #fbbf24 100%);
          color: #0f0e0b;
          box-shadow: 0 4px 24px rgba(245,158,11,0.4), 0 0 40px rgba(245,158,11,0.15);
          transition: transform 0.15s, box-shadow 0.2s;
          position: relative; overflow: hidden;
        }
        .lp-btn::before {
          content: '';
          position: absolute; top: 0; left: -100%; width: 60%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
          transform: skewX(-20deg);
          animation: shimmer 3s ease-in-out infinite;
        }
        @keyframes shimmer {
          0%   { left: -100%; }
          60%,100% { left: 150%; }
        }
        .lp-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(245,158,11,0.55), 0 0 48px rgba(245,158,11,0.2);
        }
        .lp-btn:active:not(:disabled) { transform: translateY(0); }
        .lp-btn:disabled { opacity: 0.55; cursor: not-allowed; }

        /* divider */
        .lp-divider {
          display: flex; align-items: center; gap: 12px;
          margin: 20px 0 0; color: rgba(245,158,11,0.25); font-size: 11px;
        }
        .lp-divider::before,.lp-divider::after {
          content: ''; flex: 1; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(245,158,11,0.2), transparent);
        }

        /* footer */
        .lp-footer {
          margin-top: 20px; text-align: center; font-size: 11.5px;
          color: rgba(245,158,11,0.3); font-weight: 500;
          display: flex; align-items: center; justify-content: center; gap: 6px;
        }

        /* ─── MODAL ─── */
        .m-overlay {
          position: fixed; inset: 0; z-index: 100;
          background: rgba(0,0,0,0.88); backdrop-filter: blur(12px);
          display: flex; align-items: center; justify-content: center; padding: 16px;
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn  { from { opacity: 0; }            to { opacity: 1; } }
        @keyframes zoomIn  { from { opacity: 0; transform: scale(0.93); } to { opacity: 1; transform: scale(1); } }

        .m-card {
          background: linear-gradient(145deg, #1a1812 0%, #141210 100%);
          border: 1px solid rgba(245,158,11,0.25);
          border-radius: 24px; padding: 30px 28px 26px;
          width: 100%; max-width: 400px;
          box-shadow:
            0 0 0 1px rgba(245,158,11,0.08),
            0 32px 80px rgba(0,0,0,0.9),
            inset 0 1px 0 rgba(245,158,11,0.15);
          display: flex; flex-direction: column; gap: 16px;
          animation: zoomIn 0.22s ease; position: relative;
        }
        .m-card::before {
          content: '';
          position: absolute; top: 0; left: 10%; right: 10%; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(251,191,36,0.5), rgba(245,158,11,0.7), rgba(251,191,36,0.5), transparent);
        }

        .m-header {
          display: flex; align-items: center; justify-content: space-between;
          padding-bottom: 14px; border-bottom: 1px solid rgba(245,158,11,0.1);
        }
        .m-hd-left { display: flex; align-items: center; gap: 12px; }
        .m-icon {
          width: 44px; height: 44px; border-radius: 12px;
          background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.2);
          display: flex; align-items: center; justify-content: center; font-size: 20px;
        }
        .m-title   { font-size: 16px; font-weight: 800; color: #f9f6f0; }
        .m-sub     { font-size: 11px; color: rgba(245,158,11,0.4); margin-top: 1px; }
        .m-close {
          background: rgba(255,255,255,0.04); border: 1px solid rgba(245,158,11,0.15);
          border-radius: 8px; width: 32px; height: 32px;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          color: rgba(245,158,11,0.5); transition: all 0.15s;
        }
        .m-close:hover { background: rgba(239,68,68,0.1); color: #f87171; border-color: rgba(239,68,68,0.3); }

        .m-error {
          background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.25);
          color: #f87171; border-radius: 10px; padding: 10px 13px;
          font-size: 12px; font-weight: 600;
          display: flex; align-items: center; gap: 8px;
        }
        .m-success {
          background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.25);
          color: #34d399; border-radius: 10px; padding: 10px 13px;
          font-size: 12px; font-weight: 600;
          display: flex; align-items: center; gap: 8px;
        }
        .m-otp-preview {
          background: linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.05));
          border: 1px solid rgba(245,158,11,0.25);
          border-radius: 12px; padding: 14px 16px;
          display: flex; flex-direction: column; gap: 4px;
        }
        .m-otp-label { font-size: 11px; font-weight: 700; color: #f59e0b; text-transform: uppercase; letter-spacing: 0.8px; }
        .m-otp-code {
          font-size: 28px; font-weight: 900; letter-spacing: 0.45em;
          background: linear-gradient(135deg,#fcd34d,#f59e0b);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
          font-family: monospace; margin-top: 2px;
        }
        .m-otp-note { font-size: 10px; color: rgba(245,158,11,0.35); }

        .m-label {
          display: block; font-size: 11px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 1px; margin-bottom: 7px; color: rgba(251,191,36,0.55);
        }
        .m-input {
          width: 100%; background: rgba(255,255,255,0.04);
          border: 1.5px solid rgba(245,158,11,0.18); color: #f9f6f0;
          padding: 12px 16px; border-radius: 12px;
          font-size: 14px; font-weight: 500; font-family: 'Inter', sans-serif;
          outline: none; transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
        }
        .m-input::placeholder { color: rgba(255,255,255,0.18); }
        .m-input:focus {
          border-color: rgba(245,158,11,0.55);
          background: rgba(245,158,11,0.04);
          box-shadow: 0 0 0 3px rgba(245,158,11,0.09);
        }
        .m-input-wrap { position: relative; }
        .m-input-wrap .m-input { padding-right: 44px; }

        .m-btn {
          width: 100%; border: none; border-radius: 12px;
          padding: 13px 0; font-size: 13.5px; font-weight: 800;
          font-family: 'Inter', sans-serif; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: transform 0.15s, box-shadow 0.2s;
          position: relative; overflow: hidden;
        }
        .m-btn-gold {
          background: linear-gradient(135deg,#d97706,#f59e0b,#fbbf24);
          color: #0f0e0b;
          box-shadow: 0 4px 20px rgba(245,158,11,0.35);
        }
        .m-btn-gold::before {
          content: '';
          position: absolute; top: 0; left: -100%; width: 60%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
          transform: skewX(-20deg);
          animation: shimmer 3s ease-in-out infinite;
        }
        .m-btn-gold:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 28px rgba(245,158,11,0.5); }
        .m-btn-green {
          background: linear-gradient(135deg,#065f46,#059669,#34d399);
          color: #f0fdf4;
          box-shadow: 0 4px 16px rgba(16,185,129,0.3);
        }
        .m-btn-green:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(16,185,129,0.45); }
        .m-btn:disabled { opacity: 0.55; cursor: not-allowed; }

        .m-sub-row {
          display: flex; align-items: center; justify-content: space-between; margin-top: -6px;
        }
        .m-link { background: none; border: none; cursor: pointer; padding: 0; font-family: 'Inter', sans-serif; font-size: 11.5px; font-weight: 600; transition: color 0.2s; }
        .m-link-muted { color: rgba(255,255,255,0.3); }
        .m-link-muted:hover { color: rgba(255,255,255,0.6); }
        .m-link-gold  { color: #f59e0b; }
        .m-link-gold:hover { color: #fbbf24; text-decoration: underline; }

        .otp-center { text-align: center; font-size: 28px; font-weight: 900; letter-spacing: 0.45em; font-family: monospace; }

        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      <div className="lp-root">
        {/* ── Floating Shapes ── */}
        <div className="fl fl-bolt-l"><ShapeLightningLeft /></div>
        <div className="fl fl-bolt-s"><ShapeLightningSmall /></div>
        <div className="fl fl-crescent"><ShapeCrescent /></div>
        <div className="fl fl-hook"><ShapeHook /></div>
        <div className="fl fl-wave"><ShapeWave /></div>
        <div className="fl fl-wave-s"><ShapeWaveSmall /></div>
        <div className="fl fl-blob"><ShapeBigBlob /></div>
        <div className="fl fl-ring-sm"><ShapeGoldRing /></div>
        <div className="fl fl-ring-lg"><ShapeGoldRingLarge /></div>
        <div className="fl fl-dots"><GoldDots /></div>
        <div className="fl fl-dots2"><GoldDots /></div>

        {/* ── Login Card ── */}
        <div className="lp-card">
          {/* Logo */}
          <div className="lp-logo-wrap">
            <div className="lp-logo-icon">🏗️</div>
            <div className="lp-company-name">S Islam Construction</div>
            <div className="lp-company-sub">Enterprise Management System</div>
          </div>

          <div className="lp-title">Login</div>

          {error && (
            <div className="lp-error">
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="lp-group">
              <label className="lp-label">User ID / ID Number</label>
              <input id="login-username" className="lp-input" type="text"
                value={username} onChange={e => setUsername(e.target.value)}
                placeholder="Enter 8-digit ID or username" required autoComplete="username" />
            </div>

            <div className="lp-group">
              <div className="lp-forgot-row">
                <label className="lp-label" style={{ marginBottom: 0 }}>Password</label>
                <button type="button" className="lp-forgot-btn" onClick={openForgotModal}>Forgot Password?</button>
              </div>
              <div className="lp-input-wrap" style={{ marginTop: 7 }}>
                <input id="login-password" className="lp-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Password" required autoComplete="current-password" />
                <button type="button" className="lp-eye" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="lp-btn" disabled={loading}>
              {loading
                ? <><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /><span>Signing in...</span></>
                : <><span>Sign in</span><ArrowRight size={16} /></>
              }
            </button>
          </form>

          <div className="lp-divider">SECURED PORTAL</div>

          <div className="lp-footer">
            <span>🔐</span>
            <span>Biometric-protected enterprise access</span>
          </div>
        </div>
      </div>

      {/* ─── FORGOT PASSWORD MODAL ─── */}
      {showForgotModal && (
        <div className="m-overlay" onClick={closeForgotModal}>
          <div className="m-card" onClick={e => e.stopPropagation()}>

            <div className="m-header">
              <div className="m-hd-left">
                <div className="m-icon">📱</div>
                <div>
                  <div className="m-title">Password Recovery</div>
                  <div className="m-sub">Reset via registered mobile number</div>
                </div>
              </div>
              <button className="m-close" onClick={closeForgotModal}><X size={15} /></button>
            </div>

            {forgotError && (
              <div className="m-error"><AlertCircle size={14} style={{ flexShrink: 0 }} /><span>{forgotError}</span></div>
            )}
            {forgotSuccess && (
              <div className="m-success"><CheckCircle2 size={14} style={{ flexShrink: 0 }} /><span>{forgotSuccess}</span></div>
            )}
            {receivedOtpDisplay && (
              <div className="m-otp-preview">
                <span className="m-otp-label">
                  <Sparkles size={11} style={{ display: 'inline', marginRight: 4 }} />SMS Dispatched — Your OTP
                </span>
                <span className="m-otp-code">{receivedOtpDisplay}</span>
                <span className="m-otp-note">Valid 10 minutes. Do not share.</span>
              </div>
            )}

            {forgotStep === 'REQUEST_OTP' && (
              <form onSubmit={handleRequestOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label className="m-label">Registered Mobile Number</label>
                  <input className="m-input" type="tel" value={resetPhone}
                    onChange={e => setResetPhone(e.target.value)}
                    placeholder="e.g. 01711-000001" required autoFocus />
                  <div style={{ fontSize: 11, color: 'rgba(245,158,11,0.35)', marginTop: 5 }}>
                    Enter the phone number registered with your profile.
                  </div>
                </div>
                <div>
                  <label className="m-label">User ID / Username (Optional)</label>
                  <input className="m-input" type="text" value={resetIdentifier}
                    onChange={e => setResetIdentifier(e.target.value)}
                    placeholder="e.g. 11000003 (optional)" />
                </div>
                <button type="submit" className="m-btn m-btn-gold" disabled={forgotLoading || !resetPhone.trim()}>
                  {forgotLoading
                    ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /><span>Sending OTP...</span></>
                    : <><span>Send 6-Digit OTP Code</span><ArrowRight size={14} /></>}
                </button>
              </form>
            )}

            {forgotStep === 'VERIFY_OTP' && (
              <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {targetAccountName && (
                  <div style={{ fontSize: 12, color: 'rgba(245,158,11,0.5)' }}>
                    Account: <strong style={{ color: '#f9f6f0' }}>{targetAccountName}</strong>
                  </div>
                )}
                <div>
                  <label className="m-label">Enter 6-Digit OTP Code</label>
                  <input className={`m-input otp-center`} type="text" maxLength={6}
                    value={resetOtp} onChange={e => setResetOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000" required autoFocus />
                </div>
                <div className="m-sub-row">
                  <button type="button" className="m-link m-link-muted" onClick={() => setForgotStep('REQUEST_OTP')}>← Change Number</button>
                  <button type="button" className="m-link m-link-gold" onClick={handleRequestOtp as any} disabled={forgotLoading}>Resend Code</button>
                </div>
                <button type="submit" className="m-btn m-btn-gold" disabled={forgotLoading || resetOtp.length < 6}>
                  {forgotLoading
                    ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /><span>Verifying...</span></>
                    : <><span>Verify & Continue</span><ArrowRight size={14} /></>}
                </button>
              </form>
            )}

            {forgotStep === 'NEW_PASSWORD' && (
              <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label className="m-label">New Password</label>
                  <div className="m-input-wrap">
                    <input className="m-input" type={showNewPassword ? 'text' : 'password'}
                      value={newPassword} onChange={e => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters" required autoFocus />
                    <button type="button" className="lp-eye" onClick={() => setShowNewPassword(!showNewPassword)} tabIndex={-1}>
                      {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="m-label">Confirm New Password</label>
                  <input className="m-input" type={showNewPassword ? 'text' : 'password'}
                    value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password" required />
                </div>
                <button type="submit" className="m-btn m-btn-green" disabled={forgotLoading || !newPassword || !confirmPassword}>
                  {forgotLoading
                    ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /><span>Saving...</span></>
                    : <><CheckCircle2 size={14} /><span>Save New Password</span></>}
                </button>
              </form>
            )}

          </div>
        </div>
      )}
    </>
  );
}
