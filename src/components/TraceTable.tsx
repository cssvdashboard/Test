import React, { useState } from 'react';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  RotateCcw,
} from 'lucide-react';
import { TraceRecord, TraceFilters } from '../types/trace';

interface TraceTableProps {
  records: TraceRecord[];
  filters: TraceFilters;
  onFilterChange: (newFilters: Partial<TraceFilters>) => void;
  onResetFilters: () => void;
  onSelectRecord: (record: TraceRecord) => void;
  allTracers: string[];
  allCategories: string[];
  allCountries: string[];
}

export const TraceTable: React.FC<TraceTableProps> = ({
  records,
  filters,
  onFilterChange,
  onResetFilters,
  onSelectRecord,
  allTracers,
  allCategories,
  allCountries,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Pagination calculation
  const totalPages = Math.ceil(records.length / pageSize) || 1;
  const validPage = Math.min(currentPage, totalPages);
  const startIndex = (validPage - 1) * pageSize;
  const currentRecords = records.slice(startIndex, startIndex + pageSize);

  const isFiltered =
    Boolean(filters.searchQuery) ||
    Boolean(filters.selectedTracer) ||
    Boolean(filters.selectedStatus) ||
    Boolean(filters.selectedCategory) ||
    Boolean(filters.selectedCountry);

  return (
    <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden flex flex-col">
      {/* Table Controls / Filters Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => {
                onFilterChange({ searchQuery: e.target.value });
                setCurrentPage(1);
              }}
              placeholder="Search AWB Tracking#, Case ID, Shipper, or Remarks..."
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            {isFiltered && (
              <button
                onClick={onResetFilters}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}

            <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="font-semibold text-white">{records.length.toLocaleString()}</span>
              <span>matches</span>
            </div>
          </div>
        </div>

        {/* Filter Dropdowns Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          {/* 1. Tracer Filter */}
          <select
            value={filters.selectedTracer}
            onChange={(e) => {
              onFilterChange({ selectedTracer: e.target.value });
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Tracers ({allTracers.length})</option>
            {allTracers.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {/* 2. Status Filter */}
          <select
            value={filters.selectedStatus}
            onChange={(e) => {
              onFilterChange({ selectedStatus: e.target.value });
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Closed">Closed / Resolved</option>
          </select>

          {/* 3. Delay / Remarks Category Filter */}
          <select
            value={filters.selectedCategory}
            onChange={(e) => {
              onFilterChange({ selectedCategory: e.target.value });
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500 truncate"
          >
            <option value="">All Categories ({allCategories.length})</option>
            {allCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* 4. Country Filter */}
          <select
            value={filters.selectedCountry}
            onChange={(e) => {
              onFilterChange({ selectedCountry: e.target.value });
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500 truncate"
          >
            <option value="">All Countries ({allCountries.length})</option>
            {allCountries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto min-h-[400px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/40 text-[11px] uppercase tracking-wider font-semibold text-slate-400">
              <th className="py-3 px-4">Tracking# / AWB</th>
              <th className="py-3 px-4">Case ID</th>
              <th className="py-3 px-4">Tracer</th>
              <th className="py-3 px-4">Shipper Company</th>
              <th className="py-3 px-4">Destination</th>
              <th className="py-3 px-4">Delay Reason</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-center">TAT</th>
              <th className="py-3 px-4 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {currentRecords.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-400">
                  <div className="max-w-xs mx-auto space-y-2">
                    <p className="font-semibold text-slate-300">No matching traces found</p>
                    <p className="text-xs text-slate-500">
                      Try adjusting your search criteria or resetting the active filters.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              currentRecords.map((r) => {
                const isOver3 = r.caseDuration > 3;
                const isClosed = r.traceStatus.toLowerCase() === 'closed';
                const isInProgress = r.traceStatus.toLowerCase().includes('progress');

                return (
                  <tr
                    key={r.id}
                    onClick={() => onSelectRecord(r)}
                    className="hover:bg-slate-900/60 transition-colors cursor-pointer group"
                  >
                    {/* AWB Tracking# */}
                    <td className="py-3 px-4 font-mono font-bold text-indigo-300 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span>{r.trackingNumber}</span>
                        <button
                          onClick={(e) => handleCopy(r.trackingNumber, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
                          title="Copy tracking number"
                        >
                          {copiedId === r.trackingNumber ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Case ID */}
                    <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                      {r.caseId}
                    </td>

                    {/* Tracer */}
                    <td className="py-3 px-4 font-medium text-slate-200 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-[11px]">
                        {r.tracer}
                      </span>
                    </td>

                    {/* Shipper */}
                    <td className="py-3 px-4 text-slate-300 max-w-[160px] truncate" title={r.shipperCompany}>
                      {r.shipperCompany}
                    </td>

                    {/* Destination */}
                    <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                      {r.destCountry}
                    </td>

                    {/* Delay Category */}
                    <td className="py-3 px-4 max-w-[180px] truncate text-slate-300" title={r.remarksCategory}>
                      <span className="text-rose-300/90 font-medium">
                        {r.remarksCategory}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {isClosed ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          Closed
                        </span>
                      ) : isInProgress ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                          <Clock className="w-3 h-3" />
                          Working
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Clock className="w-3 h-3" />
                          Open
                        </span>
                      )}
                    </td>

                    {/* Duration / TAT */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {isOver3 ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          <AlertTriangle className="w-3 h-3" />
                          {r.caseDuration}d
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono">
                          {r.caseDuration > 0 ? `${r.caseDuration}d` : '0d'}
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => onSelectRecord(r)}
                        className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-indigo-600 text-slate-400 hover:text-white transition-colors"
                        title="Inspect trace details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-2 py-1 bg-slate-900 border border-slate-800 rounded text-slate-200"
          >
            <option value={15}>15</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-slate-500">•</span>
          <span>
            Showing {records.length > 0 ? startIndex + 1 : 0} to{' '}
            {Math.min(startIndex + pageSize, records.length)} of {records.length.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={validPage === 1}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-semibold text-slate-200">
            Page {validPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={validPage === totalPages}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
