'use client';

import { useEffect, useState } from 'react';
import PublicHeader from '../../components/PublicHeader';
import PublicFooter from '../../components/PublicFooter';

type CmsInfo = {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
};

export default function ContactPage() {
  const [info, setInfo] = useState<CmsInfo>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState({ type: '', text: '' });

  useEffect(() => {
    fetch('http://localhost:5001/api/cms/info')
      .then(res => res.json())
      .then(data => { setInfo(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatus({ type: '', text: '' });

    try {
      const res = await fetch('http://localhost:5001/api/cms/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setStatus({ type: 'success', text: 'Thank you! Your message has been sent successfully to our engineering team.' });
        setFormData({ name: '', email: '', message: '' });
      } else {
        setStatus({ type: 'error', text: 'Failed to send message. Please try again later.' });
      }
    } catch {
      setStatus({ type: 'error', text: 'An unexpected network error occurred.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center text-zinc-400 font-semibold text-sm">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p>Loading Contact Information...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans">
      <PublicHeader companyName={info.name} />

      <main className="flex-1 flex flex-col items-center px-6 py-20 lg:py-28 bg-card border-b border-border animate-fade-in-up">
        <div className="w-full max-w-6xl">
          <div className="text-center mb-16">
            <span className="text-amber-400 font-black tracking-widest uppercase text-xs mb-3 block">Get In Touch</span>
            <h1 className="text-4xl lg:text-6xl font-black text-foreground mb-4">Contact Our Team</h1>
            <div className="h-1.5 w-20 bg-amber-500 mx-auto rounded-full mb-6"></div>
            <p className="text-base text-zinc-400 leading-relaxed max-w-2xl mx-auto">
              Ready to start your next construction project? Reach out to our engineering and management team for consultations, tender proposals, or site inspections.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            
            {/* Contact Info */}
            <div className="flex flex-col gap-6">
              <div className="bg-background border border-border p-8 rounded-3xl shadow-lg flex items-start gap-6 card-lift hover:border-amber-500/40">
                <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center text-2xl shrink-0 animate-float border border-amber-500/20">📞</div>
                <div>
                  <h3 className="text-lg font-black text-foreground mb-1">Direct Phone Line</h3>
                  <p className="text-zinc-400 text-sm font-semibold">{info.phone || '+880 1700-000000'}</p>
                </div>
              </div>
              <div className="bg-background border border-border p-8 rounded-3xl shadow-lg flex items-start gap-6 card-lift hover:border-amber-500/40">
                <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center text-2xl shrink-0 animate-float border border-amber-500/20" style={{ animationDelay: '0.5s' }}>✉️</div>
                <div>
                  <h3 className="text-lg font-black text-foreground mb-1">Official Email</h3>
                  <p className="text-zinc-400 text-sm font-semibold">{info.email || 'info@sislamconstruction.com'}</p>
                </div>
              </div>
              <div className="bg-background border border-border p-8 rounded-3xl shadow-lg flex items-start gap-6 card-lift hover:border-amber-500/40">
                <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center text-2xl shrink-0 animate-float border border-amber-500/20" style={{ animationDelay: '1s' }}>📍</div>
                <div>
                  <h3 className="text-lg font-black text-foreground mb-1">Headquarters</h3>
                  <p className="text-zinc-400 text-sm font-medium leading-relaxed">{info.address || 'Dhaka, Bangladesh'}</p>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-background border border-border p-8 sm:p-10 rounded-3xl shadow-2xl relative overflow-hidden card-lift">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600" />
              <h2 className="text-2xl font-black text-foreground mb-2">Send Us an Inquiry</h2>
              <p className="text-zinc-400 text-xs mb-8">We will review your message and respond within 24 business hours.</p>
              
              {status.text && (
                <div className={`p-4 rounded-2xl mb-6 font-bold text-xs animate-fade-in-down shadow-sm ${status.type === 'success' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'}`}>
                  {status.text}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Your Full Name</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="bg-input border border-border text-foreground px-4 py-3.5 rounded-2xl focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all text-sm font-semibold" placeholder="e.g. John Doe" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Email Address</label>
                  <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="bg-input border border-border text-foreground px-4 py-3.5 rounded-2xl focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all text-sm font-semibold" placeholder="e.g. john@example.com" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Message or Project Scope</label>
                  <textarea required value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} className="bg-input border border-border text-foreground px-4 py-3.5 rounded-2xl focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all min-h-[130px] text-sm font-medium resize-y" placeholder="Describe your project requirements or site inquiry..." />
                </div>
                <button type="submit" disabled={submitting} className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-black py-4 rounded-2xl font-black text-sm transition-all duration-300 shadow-xl shadow-amber-500/25 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 mt-2 btn-hover-glow border border-amber-300/30">
                  {submitting ? 'Transmitting Message...' : 'Send Inquiry Message'}
                </button>
              </form>
            </div>

          </div>
        </div>
      </main>

      <PublicFooter companyName={info.name} />
    </div>
  );
}

