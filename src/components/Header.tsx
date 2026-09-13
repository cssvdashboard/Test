import React from 'react';
import { RefreshCw, Download, ExternalLink, ShieldCheck, Database, Calendar } from 'lucide-react';
import { TraceSummary } from '../types/trace';

interface HeaderProps {
  summary: TraceSummary | null;
  filteredCount: number;
  totalCount: number;
  onOpenSyncModal: () => void;
  onExportData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  summary,
  filteredCount,
  totalCount,
  onOpenSyncModal,
  onExportData,
}) => {
  const formattedDate = summary?.lastUpdated
    ? new Date(summary.lastUpdated).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Live Synced';

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Left: Brand & Status */}
        <div className="flex items-center space-x-3.5">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
            <Database className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Trace & Delay Intelligence
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Live 365
                </span>
              </h1>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Connected to Microsoft 365
              </span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Updated: {formattedDate}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-300">
            <span className="text-slate-400 mr-1.5">Viewing:</span>
            <span className="font-semibold text-white">{filteredCount.toLocaleString()}</span>
            <span className="text-slate-500 mx-1">/</span>
            <span className="text-slate-400">{totalCount.toLocaleString()} Traces</span>
          </div>

          <button
            onClick={onOpenSyncModal}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-200 transition-colors shadow-sm"
            title="View sync source & import options"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline">Sync Data</span>
          </button>

          <button
            onClick={onExportData}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white transition-colors shadow-lg shadow-indigo-600/20"
            title="Export filtered records to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>
    </header>
  );
};
