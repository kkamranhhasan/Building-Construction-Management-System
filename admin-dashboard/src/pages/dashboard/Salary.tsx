'use client';

import { useEffect, useState } from 'react';
import { API } from '../../config/api';

type SalaryReport = {
  totalHours: number;
  amountPaid: number;
  status: string;
  month: number;
  year: number;
  createdAt: string;
};

export default function SalaryDashboard() {
  const [report, setReport] = useState<SalaryReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      const u = JSON.parse(localStorage.getItem('user') || '{}') as { id?: string };
      
      if (!u.id) return;

      try {
        const res = await fetch(API.salary(u.id), {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          // Assume the API returns an array of reports, we take the latest
          if (data && data.length > 0) {
            setReport(data[data.length - 1]);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  if (loading) return <div className="text-slate-400">Loading your data...</div>;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      <div className="bg-surface p-8 rounded-3xl border border-border shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">My Salary & Hours</h1>
          <p className="text-slate-400">Review your worked hours and generated payslips.</p>
        </div>
        <div className="bg-primary/10 text-primary px-6 py-3 rounded-2xl border border-primary/20 text-center">
          <div className="text-sm font-semibold uppercase tracking-wider mb-1">Current Status</div>
          <div className="text-xl font-bold">Active Worker</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl shadow-xl flex flex-col justify-center items-center text-center group hover:border-indigo-500/50 transition-colors">
          <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">⏱️</div>
          <h3 className="text-slate-400 font-medium mb-1">Total Hours Logged</h3>
          <div className="text-3xl font-extrabold text-white">{report ? report.totalHours.toFixed(1) : '0.0'} <span className="text-lg text-slate-500 font-normal">hrs</span></div>
        </div>

        <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl shadow-xl flex flex-col justify-center items-center text-center group hover:border-emerald-500/50 transition-colors">
          <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">💵</div>
          <h3 className="text-slate-400 font-medium mb-1">Earned This Month</h3>
          <div className="text-3xl font-extrabold text-emerald-400">${report ? report.amountPaid.toFixed(2) : '0.00'}</div>
        </div>

        <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl shadow-xl flex flex-col justify-center items-center text-center group hover:border-amber-500/50 transition-colors">
          <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">📋</div>
          <h3 className="text-slate-400 font-medium mb-1">Payment Status</h3>
          <div className="text-2xl font-bold text-amber-400">{report ? report.status : 'N/A'}</div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl overflow-hidden mt-4">
        <div className="p-6 border-b border-border bg-slate-800/50">
          <h3 className="text-xl font-bold text-white">Recent Payslips</h3>
        </div>
        <div className="p-6">
          {report ? (
            <div className="flex items-center justify-between p-4 bg-slate-900 border border-slate-700 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/20 text-primary rounded-xl flex items-center justify-center text-xl">📄</div>
                <div>
                  <h4 className="text-white font-bold text-lg">Payslip - Month {report.month}, {report.year}</h4>
                  <p className="text-slate-400 text-sm">Generated on {new Date(report.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-white font-bold text-lg">${report.amountPaid.toFixed(2)}</div>
                  <div className="text-emerald-400 text-sm font-semibold">{report.status}</div>
                </div>
                <button className="text-slate-400 hover:text-primary transition-colors p-2 bg-surface rounded-lg group-hover:bg-primary/10">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <div className="text-4xl mb-4">📭</div>
              <p>No salary reports generated yet for this month.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
