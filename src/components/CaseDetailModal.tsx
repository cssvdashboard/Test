import React from 'react';
import {
  X,
  Copy,
  Check,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Building,
  User,
  Package,
  FileText,
  ShieldAlert,
} from 'lucide-react';
import { TraceRecord } from '../types/trace';

interface CaseDetailModalProps {
  record: TraceRecord | null;
  onClose: () => void;
}

export const CaseDetailModal: React.FC<CaseDetailModalProps> = ({ record, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  if (!record) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const isClosed = record.traceStatus.toLowerCase() === 'closed';
  const isOver3 = record.caseDuration > 3;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-panel border border-slate-700/80 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl bg-slate-950 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-mono">
                  AWB {record.trackingNumber}
                </h3>
                <button
                  onClick={() => handleCopy(record.trackingNumber)}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  title="Copy tracking number"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-xs text-slate-400">
                Case ID: <span className="text-slate-200 font-mono">{record.caseId}</span> • Sheet: {record.sheet}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isClosed ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Closed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Clock className="w-3.5 h-3.5" />
                Open
              </span>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Top Attributes Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/50 p-4 rounded-xl border border-slate-800/80">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
                Tracer / Owner
              </span>
              <span className="font-semibold text-slate-100 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                {record.tracer}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
                Case Type
              </span>
              <span className="font-semibold text-slate-200">
                {record.caseType}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
                Turnaround Time
              </span>
              <span className={`font-semibold flex items-center gap-1 ${isOver3 ? 'text-rose-400' : 'text-slate-200'}`}>
                {isOver3 && <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />}
                {record.caseDuration > 0 ? `${record.caseDuration} Days` : '0 Days'}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
                Pieces / Pcs
              </span>
              <span className="font-semibold text-slate-200">
                {record.pieces} pcs
              </span>
            </div>
          </div>

          {/* Logistics Routing Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-900/30 border border-slate-800">
              <span className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
                <Building className="w-3.5 h-3.5 text-purple-400" />
                Shipper Account
              </span>
              <p className="font-medium text-slate-200 text-sm">
                {record.shipperCompany || 'Unspecified Shipper'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/30 border border-slate-800">
              <span className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                Destination Country
              </span>
              <p className="font-medium text-slate-200 text-sm">
                {record.destCountry || 'Unknown Destination'}
              </p>
            </div>
          </div>

          {/* Dates & Timeline */}
          <div className="p-3.5 rounded-xl bg-slate-900/30 border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <div>
                <span className="text-slate-400">Opened: </span>
                <span className="font-semibold text-slate-200">
                  {record.openDate || 'Not specified'}
                </span>
              </div>
            </div>
            <div className="text-slate-600">→</div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <div>
                <span className="text-slate-400">Closed: </span>
                <span className="font-semibold text-slate-200">
                  {record.closeDate || 'Ongoing'}
                </span>
              </div>
            </div>
          </div>

          {/* Delay Category Badge */}
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Assigned Delay / Issue Category
            </span>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 font-semibold text-xs">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              {record.remarksCategory}
            </div>
          </div>

          {/* Working Remarks & Notes */}
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Working Remarks & Case Notes
            </span>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800/90 text-slate-200 whitespace-pre-wrap leading-relaxed text-xs sm:text-sm font-sans">
              {record.workingRemarks || 'No detailed working remarks recorded for this case.'}
            </div>
          </div>

          {/* Final Resolution & SLA remarks */}
          {(record.finalResolution || record.slaRemarks) && (
            <div className="space-y-3 pt-2">
              {record.finalResolution && (
                <div>
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block mb-1">
                    Final Resolution
                  </span>
                  <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-emerald-200 text-xs sm:text-sm">
                    {record.finalResolution}
                  </div>
                </div>
              )}

              {record.slaRemarks && (
                <div>
                  <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider block mb-1">
                    Over +3 Day SLA Justification
                  </span>
                  <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/20 text-rose-200 text-xs sm:text-sm">
                    {record.slaRemarks}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Source: Microsoft 365 Trace Report
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
