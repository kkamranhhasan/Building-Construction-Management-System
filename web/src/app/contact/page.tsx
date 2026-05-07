'use client';

import { useEffect, useState } from 'react';
import PublicHeader from '../../components/PublicHeader';

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
      .then(data => { setInfo(data); setLoading(false); });
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
        setStatus({ type: 'success', text: 'Thank you! Your message has been sent.' });
        setFormData({ name: '', email: '', message: '' });
      } else {
        setStatus({ type: 'error', text: 'Failed to send message. Please try again later.' });
      }
    } catch {
      setStatus({ type: 'error', text: 'An unexpected error occurred.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-surface flex items-center justify-center text-slate-500 font-medium">Loading...</div>;

  return (
    <div className="min-h-screen flex flex-col bg-background text-slate-900 font-sans">
      <PublicHeader companyName={info.name} />

      <main className="flex-1 flex flex-col items-center px-6 py-24 bg-surface animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="w-full max-w-6xl">
          <div className="text-center mb-16">
            <span className="text-primary font-bold tracking-wider uppercase text-sm mb-4 block">Get In Touch</span>
            <h1 className="text-5xl font-extrabold text-slate-900 mb-6">Contact Us</h1>
            <div className="h-1 w-24 bg-primary mx-auto rounded-full mb-8"></div>
            <p className="text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Ready to start your next project? Get in touch with our team for inquiries, proposals, or support.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            
            {/* Contact Info */}
            <div className="flex flex-col gap-8">
              <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-lg flex items-start gap-6 hover:border-primary/30 hover:-translate-y-1 transition-all">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-2xl shrink-0">📞</div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1">Phone Number</h3>
                  <p className="text-slate-500 text-lg font-medium">{info.phone || '+1 (555) 123-4567'}</p>
                </div>
              </div>
              <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-lg flex items-start gap-6 hover:border-primary/30 hover:-translate-y-1 transition-all">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-2xl shrink-0">✉️</div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1">Email Address</h3>
                  <p className="text-slate-500 text-lg font-medium">{info.email || 'contact@example.com'}</p>
                </div>
              </div>
              <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-lg flex items-start gap-6 hover:border-primary/30 hover:-translate-y-1 transition-all">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-2xl shrink-0">📍</div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1">Office Location</h3>
                  <p className="text-slate-500 text-lg font-medium leading-relaxed">{info.address || '123 Construction Blvd, City, Country'}</p>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white border border-slate-200 p-10 rounded-3xl shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-primary" />
              <h2 className="text-3xl font-extrabold text-slate-900 mb-8">Send us a message</h2>
              
              {status.text && (
                <div className={`p-4 rounded-xl mb-6 font-bold animate-in slide-in-from-top-2 shadow-sm ${status.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                  {status.text}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-slate-700">Your Name</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="bg-slate-50 border border-slate-200 text-slate-900 px-5 py-3.5 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all font-medium" placeholder="John Doe" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-slate-700">Email Address</label>
                  <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="bg-slate-50 border border-slate-200 text-slate-900 px-5 py-3.5 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all font-medium" placeholder="john@example.com" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-slate-700">Message</label>
                  <textarea required value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} className="bg-slate-50 border border-slate-200 text-slate-900 px-5 py-3.5 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all min-h-[150px] font-medium resize-y" placeholder="How can we help you build your dream?" />
                </div>
                <button type="submit" disabled={submitting} className="w-full bg-primary hover:bg-primary-hover text-white py-4 rounded-xl font-extrabold text-lg transition-all shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 mt-4">
                  {submitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
