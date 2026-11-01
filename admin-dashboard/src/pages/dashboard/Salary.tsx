import { useEffect, useState } from 'react';
import { API } from '../../config/api';
import { 
  Clock, 
  DollarSign, 
  FileText, 
  CheckCircle2, 
  Printer, 
  ShieldCheck,
  Calendar
} from 'lucide-react';

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

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 bg-card border border-border rounded-3xl">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground text-xs font-semibold">Calculating monthly payroll...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-card p-8 rounded-3xl border border-border shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Worker Payroll Portal</span>
          </div>
          <h1 className="text-3xl font-black text-foreground">My Salary & Logged Hours</h1>
          <p className="text-muted-foreground text-xs mt-1">Review verified attendance hours, monthly earned wages, and generated payslips.</p>
        </div>
        <div className="bg-emerald-500/10 text-emerald-400 px-5 py-2.5 rounded-2xl border border-emerald-500/20 text-center flex items-center gap-2 font-bold text-xs">
          <CheckCircle2 className="w-4 h-4" />
          <span>Active Worker Account</span>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Hours */}
        <div className="bg-card border border-border p-6 rounded-3xl shadow-xl flex flex-col justify-between group hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Logged Hours</span>
            <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary-foreground">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-4xl font-black text-foreground">
              {report ? report.totalHours.toFixed(1) : '0.0'} <span className="text-sm text-muted-foreground font-semibold">hrs</span>
            </div>
            <p className="text-muted-foreground text-xs mt-2">Recorded by site attendance check-ins</p>
          </div>
        </div>

        {/* Amount Earned */}
        <div className="bg-card border border-border p-6 rounded-3xl shadow-xl flex flex-col justify-between group hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Earned Wages</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-4xl font-black text-emerald-400">
              ${report ? report.amountPaid.toFixed(2) : '0.00'}
            </div>
            <p className="text-muted-foreground text-xs mt-2">Calculated by hourly rate x hours</p>
          </div>
        </div>

        {/* Status */}
        <div className="bg-card border border-border p-6 rounded-3xl shadow-xl flex flex-col justify-between group hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Disbursement Status</span>
            <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className={`text-2xl font-black uppercase ${report?.status === 'PAID' ? 'text-emerald-400' : 'text-primary'}`}>
              {report ? report.status : 'PENDING'}
            </div>
            <p className="text-muted-foreground text-xs mt-2">Current payroll settlement cycle</p>
          </div>
        </div>
      </div>

      {/* Payslip Details Card */}
      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-xl mt-2">
        <div className="p-6 border-b border-border bg-muted/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h3 className="text-base font-black text-foreground">Monthly Payslip Statement</h3>
          </div>
          {report && (
            <button 
              onClick={handlePrint}
              className="bg-secondary hover:bg-muted text-foreground/70 hover:text-foreground px-4 py-2 rounded-xl text-xs font-bold transition-all border border-border flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </button>
          )}
        </div>

        <div className="p-6">
          {report ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-muted/80 border border-border rounded-2xl gap-4 hover:border-primary/30 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary-foreground text-2xl flex-shrink-0">
                  📄
                </div>
                <div>
                  <h4 className="text-foreground font-black text-base">
                    Salary Statement — Month {report.month}, {report.year}
                  </h4>
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mt-1">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    <span>Generated on {new Date(report.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-2xl font-black text-emerald-400">${report.amountPaid.toFixed(2)}</div>
                  <div className="text-xs font-bold uppercase text-primary tracking-wider mt-0.5">{report.status}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground flex flex-col items-center gap-2">
              <FileText className="w-12 h-12 opacity-20" />
              <p className="text-sm font-semibold">No salary reports generated yet for this period.</p>
              <p className="text-xs text-slate-600">Hours will be calculated and settled by the site supervisor at month-end.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

