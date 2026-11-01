import React, { useState } from 'react';
import { Switch } from '../../components/ui/switch';
import { 
  Laptop, 
  Thermometer, 
  Lightbulb, 
  Refrigerator, 
  Radio, 
  Zap, 
  Activity, 
  Power
} from 'lucide-react';

type Device = {
  id: number;
  name: string;
  room: string;
  icon: React.ComponentType<{ className?: string }>;
  on: boolean;
  powerUsage?: string;
};

const initialDevices: Device[] = [
  { id: 1, name: "Site Perimeter Lights", room: "Zone A - Site Entrance", icon: Lightbulb, on: true, powerUsage: "120W" },
  { id: 2, name: "Main Site Generator", room: "Power Station B", icon: Zap, on: true, powerUsage: "5.4kW" },
  { id: 3, name: "Site Office PC & Surveillance", room: "Control Room", icon: Laptop, on: false, powerUsage: "250W" },
  { id: 4, name: "Concrete Curing Temp Control", room: "Curing Chamber 1", icon: Thermometer, on: true, powerUsage: "1.2kW" },
  { id: 5, name: "Site Radio Communication Relay", room: "Tower Mast", icon: Radio, on: true, powerUsage: "80W" },
  { id: 6, name: "Worker Mess Refrigerator", room: "Mess Hall", icon: Refrigerator, on: true, powerUsage: "180W" },
];

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>(initialDevices);

  const activeCount = devices.filter(d => d.on).length;

  const toggleAll = (state: boolean) => {
    setDevices(prev => prev.map(d => ({ ...d, on: state })));
  };

  return (
    <div className="space-y-6">
      {/* Header Stat Card */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-card shadow-sm ring-1 ring-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Smart Devices & Site Equipment</h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Telemetry
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage all connected IoT site devices, machinery controllers, and smart sensors.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => toggleAll(true)}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-sm"
          >
            <Power className="w-3.5 h-3.5" /> Turn All ON
          </button>
          <button
            onClick={() => toggleAll(false)}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
          >
            Turn All OFF
          </button>
        </div>
      </div>

      {/* Metrics Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl bg-card p-4 ring-1 ring-border shadow-sm">
          <span className="text-xs font-medium text-muted-foreground">Total Devices</span>
          <p className="text-2xl font-bold text-foreground mt-1">{devices.length}</p>
        </div>
        <div className="rounded-xl bg-card p-4 ring-1 ring-border shadow-sm">
          <span className="text-xs font-medium text-muted-foreground">Active Now</span>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{activeCount}</p>
        </div>
        <div className="rounded-xl bg-card p-4 ring-1 ring-border shadow-sm">
          <span className="text-xs font-medium text-muted-foreground">Inactive / Standby</span>
          <p className="text-2xl font-bold text-muted-foreground mt-1">{devices.length - activeCount}</p>
        </div>
        <div className="rounded-xl bg-card p-4 ring-1 ring-border shadow-sm">
          <span className="text-xs font-medium text-muted-foreground">Status</span>
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1">
            <Activity className="w-4 h-4" /> Normal Grid
          </p>
        </div>
      </div>

      {/* Devices Grid */}
      <section className="rounded-2xl bg-card p-6 md:p-8 shadow-sm ring-1 ring-border">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Active Units</h2>
            <p className="text-xs text-muted-foreground">Toggle power switch to remotely control equipment.</p>
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            {activeCount}/{devices.length} Online
          </span>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {devices.map((d) => (
            <div 
              key={d.id} 
              className={`rounded-xl p-4 ring-1 transition-all duration-200 ${
                d.on 
                  ? 'bg-background ring-border shadow-sm' 
                  : 'bg-muted/40 ring-border/60 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className={`p-2.5 rounded-xl transition-colors ${
                    d.on 
                      ? 'bg-primary/10 text-primary' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    <d.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-foreground">{d.name}</p>
                    <p className="text-xs text-muted-foreground">{d.room}</p>
                    {d.powerUsage && (
                      <span className="text-[11px] font-mono text-muted-foreground/80 mt-0.5 block">
                        ⚡ {d.powerUsage}
                      </span>
                    )}
                  </div>
                </div>
                <Switch
                  checked={d.on}
                  onCheckedChange={(v) =>
                    setDevices((prev) =>
                      prev.map((x) => (x.id === d.id ? { ...x, on: v } : x))
                    )
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
