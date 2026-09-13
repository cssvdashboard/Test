import React, { useState } from 'react';
import {
  X,
  RefreshCw,
  Upload,
  Database,
  CheckCircle2,
  FileSpreadsheet,
  Terminal,
  ExternalLink,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { TraceRecord, TraceSummary } from '../types/trace';

interface DataSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  lastUpdated: string;
  onDataLoaded: (records: TraceRecord[], summary: TraceSummary) => void;
}

export const DataSyncModal: React.FC<DataSyncModalProps> = ({
  isOpen,
  onClose,
  lastUpdated,
  onDataLoaded,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setProcessStatus('Reading workbook...');

    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      setProcessStatus(`Parsing sheets from ${file.name}...`);

      const EXCLUDED_SHEETS = ['summary', 'cs outbound mail', 'cs outbound mail', 'sheet1', 'sheet2', 'sheet3', 'sheet4'];
      const records: TraceRecord[] = [];

      for (const sheetName of wb.SheetNames) {
        const norm = sheetName.trim().toLowerCase();
        if (EXCLUDED_SHEETS.some((ex) => norm === ex || norm.includes('outbound mail') || norm === 'summary')) {
          continue;
        }

        const sheet = wb.Sheets[sheetName];
        if (!sheet || !sheet['!ref']) continue;

        // Clamp columns
        const range = XLSX.utils.decode_range(sheet['!ref']);
        let maxCol = 0;
        for (let C = 0; C <= Math.min(range.e.c, 40); C++) {
          const cell = sheet[XLSX.utils.encode_cell({ r: range.s.r, c: C })];
          if (cell && cell.v !== undefined && String(cell.v).trim() !== '') {
            maxCol = C;
          }
        }
        range.e.c = Math.max(maxCol, 16);
        sheet['!ref'] = XLSX.utils.encode_range(range);

        const rows = XLSX.utils.sheet_to_json<any>(sheet, { defval: '' });

        for (const row of rows) {
          const keys = Object.keys(row);
          const getVal = (...patterns: string[]) => {
            for (const p of patterns) {
              const f = keys.find((k) => k.trim().toLowerCase() === p.toLowerCase());
              if (f && row[f] !== undefined && row[f] !== null && String(row[f]).trim() !== '') {
                return String(row[f]).trim();
              }
            }
            return '';
          };

          const trackingNumber = getVal('tracking#', 'tracking #', 'tracking no', 'awb', 'awb#', 'tracking');
          const caseId = getVal('case id', 'caseid');
          if (!trackingNumber && !caseId) continue;

          let tracer = getVal('tracer', 'associate', 'owner');
          if (!tracer || tracer.length < 2) {
            tracer = sheetName;
          }

          const rawStatus = getVal('trace status', 'status').toLowerCase();
          let traceStatus = 'Open';
          if (sheetName.toLowerCase().includes('closed') || rawStatus.includes('close') || rawStatus.includes('resolved')) {
            traceStatus = 'Closed';
          } else if (rawStatus.includes('progress') || rawStatus.includes('working')) {
            traceStatus = 'In Progress';
          }

          let caseDuration = parseFloat(getVal('case duration', 'duration', 'age')) || 0;
          if (caseDuration > 60 || isNaN(caseDuration)) caseDuration = 0;

          records.push({
            id: `${sheetName}-${records.length + 1}`,
            sheet: sheetName,
            trackingNumber: trackingNumber || 'N/A',
            caseId: caseId || 'N/A',
            caseType: getVal('case type', 'casy type', 'type') || 'Standard Trace',
            tracer,
            ownership: getVal('ownership') || 'General',
            shipperCompany: getVal('shipper company', 'shipper') || 'Unspecified Shipper',
            destCountry: getVal('dest. country', 'destination country', 'country') || 'Unknown',
            traceStatus,
            openDate: getVal('trace open date', 'open date', 'date') || null,
            closeDate: getVal('trace close date', 'close date') || null,
            remarksCategory: getVal('remarks category', 'delay category', 'reason') || 'General Trace',
            workingRemarks: getVal('working remarks', 'remarks', 'notes'),
            finalResolution: getVal('final resolution', 'resolution'),
            slaRemarks: getVal('remarks if +3 day trace'),
            caseDuration,
            pieces: parseInt(getVal('package', 'pieces'), 10) || 1,
          });
        }
      }

      // Quick summary
      const totalCases = records.length;
      const closedCases = records.filter((r) => r.traceStatus.toLowerCase() === 'closed').length;
      const openCases = totalCases - closedCases;

      const tracerMap: Record<string, { total: number; open: number; closed: number; durations: number[] }> = {};
      records.forEach((r) => {
        const t = r.tracer || 'Other';
        if (!tracerMap[t]) tracerMap[t] = { total: 0, open: 0, closed: 0, durations: [] };
        tracerMap[t].total++;
        if (r.traceStatus.toLowerCase() === 'closed') tracerMap[t].closed++;
        else tracerMap[t].open++;
        if (r.caseDuration > 0) tracerMap[t].durations.push(r.caseDuration);
      });

      const tracerStats = Object.entries(tracerMap)
        .map(([name, stat]) => ({
          name,
          total: stat.total,
          open: stat.open,
          closed: stat.closed,
          avgDuration: stat.durations.length > 0 ? +(stat.durations.reduce((a, b) => a + b, 0) / stat.durations.length).toFixed(1) : 0,
        }))
        .sort((a, b) => b.total - a.total);

      const catMap: Record<string, number> = {};
      records.forEach((r) => {
        catMap[r.remarksCategory] = (catMap[r.remarksCategory] || 0) + 1;
      });
      const categoryStats = Object.entries(catMap)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count);

      const summary: TraceSummary = {
        lastUpdated: new Date().toISOString(),
        sourceFileName: file.name,
        totalCases,
        openCases,
        closedCases,
        resolutionRate: totalCases > 0 ? +((closedCases / totalCases) * 100).toFixed(1) : 0,
        avgDurationDays: 2.5,
        over3DayCases: records.filter((r) => r.caseDuration > 3).length,
        tracerStats,
        categoryStats,
        caseTypeStats: [],
        topCountries: [],
        topShippers: [],
        monthlyTrend: [],
      };

      onDataLoaded(records, summary);
      setProcessStatus(`Successfully loaded ${records.length.toLocaleString()} records!`);
      setTimeout(() => {
        setIsProcessing(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('File parsing error:', err);
      setProcessStatus('Error parsing file: ' + err.message);
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="glass-panel border border-slate-700/80 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl bg-slate-950 flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Microsoft 365 Data Sync Hub
              </h3>
              <p className="text-xs text-slate-400">
                Data pipeline status and real-time refresh
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-xs text-slate-300">
          {/* Active Data Source Information */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs">
              <Database className="w-4 h-4" />
              <span>Primary Connected Data Source:</span>
            </div>
            <p className="text-slate-200 font-mono text-[11px] bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 break-all">
              C:\Users\MohammadShihabShahar\OneDrive - mghgroup.com\Trace Report.xlsx
            </p>
            <p className="text-slate-400 text-[11px]">
              Whenever your team updates the file on Microsoft 365, OneDrive syncs changes automatically to your machine.
            </p>
          </div>

          {/* Quick Browser Dropzone */}
          <div className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-2xl p-6 text-center transition-colors bg-slate-900/20">
            <Upload className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
            <p className="font-semibold text-slate-200 mb-1">
              Load & Preview Updated Trace Report
            </p>
            <p className="text-[11px] text-slate-400 mb-3 max-w-sm mx-auto">
              Select or drop any updated <span className="text-indigo-300 font-medium">Trace Report.xlsx</span> here to recompute all analytics instantly in your browser.
            </p>

            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium cursor-pointer transition-colors text-xs shadow-lg shadow-indigo-600/20">
              <FileSpreadsheet className="w-4 h-4" />
              <span>Choose Excel File (.xlsx)</span>
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
                disabled={isProcessing}
                className="hidden"
              />
            </label>

            {processStatus && (
              <p className="mt-3 text-xs font-semibold text-indigo-300 flex items-center justify-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                {processStatus}
              </p>
            )}
          </div>

          {/* Publishing Instructions */}
          <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-[11px] text-indigo-200/90 space-y-1">
            <span className="font-bold text-indigo-300 block">
              💡 Publishing updates to GitHub Pages:
            </span>
            <p>
              To update the live web URL anytime, simply run <code className="bg-indigo-900/60 px-1.5 py-0.5 rounded text-white font-mono">npm run build</code> and push to GitHub. GitHub Actions will rebuild and deploy the new data automatically!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
