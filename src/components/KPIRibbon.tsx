import React from 'react';
import { Layers, CheckCircle2, Clock, AlertTriangle, TrendingUp, Sparkles } from 'lucide-react';
import { TraceSummary } from '../types/trace';

interface KPIRibbonProps {
  summary: TraceSummary | null;
  filteredCount: number;
}

export const KPIRibbon: React.FC<KPIRibbonProps> = ({ summary, filteredCount }) => {
  if (!summary) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 animate-pulse">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-slate-900 border border-slate-800" />
        ))}
      </div>
    );
  }

  const {
    totalCases,
    openCases,
    closedCases,
    resolutionRate,
    avgDurationDays,
    over3DayCases,
  } = summary;

  const openRate = totalCases > 0 ? ((openCases / totalCases) * 100).toFixed(1) : '0';

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* 1. Total Cases */}
      <div className="glass-panel-interactive rounded-2xl p-4 relative overflow-hidden group">
        <div className="absolute -right-4 -top-4 w-20 h-20 bg-indigo-500/10 rounded-full blur-xl group-hover:bg-indigo-500/20 transition-all duration-300 pointer-events-none" />
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Traces
          </span>
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Layers className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {totalCases.toLocaleString()}
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-indigo-400" />
          Across 18 Tracer Workbooks
        </p>
      </div>

      {/* 2. Open / Active Cases */}
      <div className="glass-panel-interactive rounded-2xl p-4 relative overflow-hidden group">
        <div className="absolute -right-4 -top-4 w-20 h-20 bg-amber-500/10 rounded-full blur-xl group-hover:bg-amber-500/20 transition-all duration-300 pointer-events-none" />
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Active / Open
          </span>
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-amber-400 tracking-tight">
            {openCases.toLocaleString()}
          </span>
          <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
            {openRate}%
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-2">Currently being investigated</p>
      </div>

      {/* 3. Resolved / Closed */}
      <div className="glass-panel-interactive rounded-2xl p-4 relative overflow-hidden group">
        <div className="absolute -right-4 -top-4 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all duration-300 pointer-events-none" />
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Closed / Resolved
          </span>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 tracking-tight">
            {closedCases.toLocaleString()}
          </span>
          <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            {resolutionRate}%
          </span>
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
          <div
            className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, resolutionRate)}%` }}
          />
        </div>
      </div>

      {/* 4. Avg Case Duration */}
      <div className="glass-panel-interactive rounded-2xl p-4 relative overflow-hidden group">
        <div className="absolute -right-4 -top-4 w-20 h-20 bg-cyan-500/10 rounded-full blur-xl group-hover:bg-cyan-500/20 transition-all duration-300 pointer-events-none" />
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Avg Turnaround
          </span>
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-extrabold text-cyan-300 tracking-tight">
            {avgDurationDays}
          </span>
          <span className="text-sm font-medium text-slate-400">Days</span>
        </div>
        <p className="text-xs text-slate-400 mt-2">Average time from open to close</p>
      </div>

      {/* 5. SLA / Over 3-Day Traces */}
      <div className="glass-panel-interactive rounded-2xl p-4 relative overflow-hidden group">
        <div className="absolute -right-4 -top-4 w-20 h-20 bg-rose-500/10 rounded-full blur-xl group-hover:bg-rose-500/20 transition-all duration-300 pointer-events-none" />
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Over 3-Day Traces
          </span>
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-rose-400 tracking-tight">
            {over3DayCases.toLocaleString()}
          </span>
          <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20">
            SLA Watch
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-2">Exceeding standard 72h window</p>
      </div>
    </section>
  );
};
