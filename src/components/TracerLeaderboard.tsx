import React from 'react';
import { Users, CheckCircle2, Clock, Filter, ArrowUpRight } from 'lucide-react';
import { TracerStat } from '../types/trace';

interface TracerLeaderboardProps {
  tracers: TracerStat[];
  selectedTracer: string;
  onSelectTracer: (tracer: string) => void;
}

export const TracerLeaderboard: React.FC<TracerLeaderboardProps> = ({
  tracers,
  selectedTracer,
  onSelectTracer,
}) => {
  // Sort tracers: active tracers with highest volume
  const topTracers = tracers.slice(0, 10);

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Tracer Workload & SLA Performance
            </h3>
            <p className="text-xs text-slate-400">
              Breakdown of cases handled per team member
            </p>
          </div>
        </div>

        {selectedTracer && (
          <button
            onClick={() => onSelectTracer('')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-xs font-semibold text-indigo-300 transition-colors"
          >
            <Filter className="w-3 h-3" />
            Reset ({selectedTracer})
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {topTracers.map((t) => {
          const isSelected = selectedTracer.toLowerCase() === t.name.toLowerCase();
          const resolutionRate = t.total > 0 ? Math.round((t.closed / t.total) * 100) : 0;

          return (
            <div
              key={t.name}
              onClick={() => onSelectTracer(isSelected ? '' : t.name)}
              className={`p-3.5 rounded-xl cursor-pointer transition-all duration-200 border ${
                isSelected
                  ? 'bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/30 shadow-lg shadow-indigo-500/10'
                  : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-200 truncate max-w-[120px]">
                  {t.name}
                </span>
                <span className="text-xs font-extrabold text-indigo-400">
                  {t.total.toLocaleString()}
                </span>
              </div>

              {/* Progress Bar: Open vs Closed */}
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-2">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${resolutionRate}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3 h-3" />
                  {t.closed} ({resolutionRate}%)
                </span>
                <span className="flex items-center gap-1 text-amber-400 font-medium">
                  <Clock className="w-3 h-3" />
                  {t.open}
                </span>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                <span>Avg TAT:</span>
                <span className="font-semibold text-slate-300">{t.avgDuration}d</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
