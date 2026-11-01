import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API } from '../../config/api';
import { User, Lock, ArrowRight, AlertCircle, CheckCircle2, Shield } from 'lucide-react';

export default function Signup() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'WORKER',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(API.signup, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden p-6">
      {/* Decorative Elements */}
      <div className="absolute top-[-15%] right-[-10%] w-[50%] h-[50%] bg-primary/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-md bg-card/95 backdrop-blur-2xl border border-border p-8 sm:p-10 rounded-3xl shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-foreground text-2xl mx-auto shadow-lg shadow-primary/25 mb-4">
            🏗️
          </div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent tracking-tight">
            Join S Islam ERP
          </h1>
          <p className="text-muted-foreground text-xs font-semibold uppercase tracking-widest mt-1">Create Personnel Account</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="mb-6 p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center animate-in zoom-in">
            <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-black text-foreground mb-1">Registration Submitted!</h3>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Your account has been created and is pending approval by management. Redirecting to login...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-primary" />
                <span>Full Name</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-input border border-border text-foreground px-4 py-3.5 rounded-2xl focus:border-primary outline-none transition-all text-sm font-semibold"
                placeholder="e.g. Zahid Hasan"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-primary" />
                <span>Username</span>
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="bg-input border border-border text-foreground px-4 py-3.5 rounded-2xl focus:border-primary outline-none transition-all text-sm font-semibold"
                placeholder="e.g. zahid_site"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-primary" />
                <span>Password</span>
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="bg-input border border-border text-foreground px-4 py-3.5 rounded-2xl focus:border-primary outline-none transition-all text-sm font-semibold"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-primary" />
                <span>Account Role</span>
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="bg-input border border-border text-foreground px-4 py-3.5 rounded-2xl focus:border-primary outline-none transition-all text-sm font-semibold"
              >
                <option value="WORKER">Worker (Field Staff)</option>
                <option value="SITE_MANAGER">Site Manager (Field Supervisor)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full bg-primary hover:bg-primary/90 text-foreground font-black py-4 rounded-2xl transition-all shadow-xl shadow-primary/25 disabled:opacity-60 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
            >
              <span>{loading ? 'Submitting Registration...' : 'Create Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        <div className="mt-8 text-center text-muted-foreground text-xs font-medium border-t border-border pt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-bold hover:underline">
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
}

