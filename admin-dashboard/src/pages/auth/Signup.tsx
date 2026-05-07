import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../../config/api';

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
    <div className="min-h-screen flex items-center justify-center bg-surface relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md bg-white border border-slate-200 p-10 rounded-3xl shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
            S Islam ERP
          </h1>
          <p className="text-slate-500 font-medium">Create your account</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-bold text-center animate-in slide-in-from-top-2">
            {error}
          </div>
        )}

        {success ? (
          <div className="mb-6 p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center animate-in zoom-in">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 shadow-sm">
              ✓
            </div>
            <h3 className="text-xl font-bold text-emerald-700 mb-2">Registration Successful!</h3>
            <p className="text-emerald-600 font-medium text-sm">
              Your account is pending approval by a manager. You will be redirected to the login page shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSignup} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-slate-50 border border-slate-200 text-slate-900 px-5 py-3.5 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all font-medium"
                placeholder="John Doe"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="bg-slate-50 border border-slate-200 text-slate-900 px-5 py-3.5 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all font-medium"
                placeholder="Choose a username"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="bg-slate-50 border border-slate-200 text-slate-900 px-5 py-3.5 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all font-medium"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="bg-slate-50 border border-slate-200 text-slate-900 px-5 py-3.5 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all font-medium appearance-none"
              >
                <option value="WORKER">Worker</option>
                <option value="SITE_MANAGER">Site Manager</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full bg-primary hover:bg-primary-hover text-white font-extrabold py-4 rounded-xl transition-all shadow-xl shadow-primary/30 disabled:opacity-70 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? 'Creating Account...' : 'Register'}
            </button>
          </form>
        )}

        <div className="mt-8 text-center text-slate-500 font-medium">
          Already have an account?{' '}
          <a href="/login" className="text-primary font-bold hover:underline">
            Sign in
          </a>
        </div>
      </div>
    </div>
  );
}
