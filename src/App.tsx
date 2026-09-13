import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { KPIRibbon } from './components/KPIRibbon';
import { TracerLeaderboard } from './components/TracerLeaderboard';
import { DelayCategoryChart } from './components/DelayCategoryChart';
import { CountryAndShipperStats } from './components/CountryAndShipperStats';
import { TraceTable } from './components/TraceTable';
import { CaseDetailModal } from './components/CaseDetailModal';
import { DataSyncModal } from './components/DataSyncModal';
import { TraceRecord, TraceSummary, TraceFilters } from './types/trace';
import { Loader2, Database, AlertCircle } from 'lucide-react';

export function App() {
  const [summary, setSummary] = useState<TraceSummary | null>(null);
  const [allRecords, setAllRecords] = useState<TraceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Modals state
  const [selectedRecord, setSelectedRecord] = useState<TraceRecord | null>(null);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // Filters state
  const [filters, setFilters] = useState<TraceFilters>({
    searchQuery: '',
    selectedTracer: '',
    selectedStatus: '',
    selectedCategory: '',
    selectedCaseType: '',
    selectedCountry: '',
    startDate: '',
    endDate: '',
  });

  // Load initial data
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        // Load summary
        const summaryRes = await fetch('./data/trace_summary.json');
        if (!summaryRes.ok) throw new Error('Failed to load trace summary data');
        const summaryData: TraceSummary = await summaryRes.json();
        setSummary(summaryData);

        // Load records
        const recordsRes = await fetch('./data/trace_records.json');
        if (!recordsRes.ok) throw new Error('Failed to load trace records data');
        const recordsData: TraceRecord[] = await recordsRes.json();
        setAllRecords(recordsData);
      } catch (err: any) {
        console.error('Error loading initial data:', err);
        setLoadError(err.message || 'Error loading dashboard dataset');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  // Filter option lists
  const allTracers = useMemo(() => {
    if (summary?.tracerStats) {
      return summary.tracerStats.map((t) => t.name).filter(Boolean);
    }
    const set = new Set<string>();
    allRecords.forEach((r) => {
      if (r.tracer) set.add(r.tracer);
    });
    return Array.from(set).sort();
  }, [summary, allRecords]);

  const allCategories = useMemo(() => {
    if (summary?.categoryStats) {
      return summary.categoryStats.map((c) => c.category).filter(Boolean);
    }
    const set = new Set<string>();
    allRecords.forEach((r) => {
      if (r.remarksCategory) set.add(r.remarksCategory);
    });
    return Array.from(set).sort();
  }, [summary, allRecords]);

  const allCountries = useMemo(() => {
    if (summary?.topCountries) {
      return summary.topCountries.map((c) => c.country).filter(Boolean);
    }
    const set = new Set<string>();
    allRecords.forEach((r) => {
      if (r.destCountry) set.add(r.destCountry);
    });
    return Array.from(set).sort();
  }, [summary, allRecords]);

  // Filter records
  const filteredRecords = useMemo(() => {
    let result = allRecords;

    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.trackingNumber.toLowerCase().includes(q) ||
          r.caseId.toLowerCase().includes(q) ||
          r.shipperCompany.toLowerCase().includes(q) ||
          r.tracer.toLowerCase().includes(q) ||
          r.destCountry.toLowerCase().includes(q) ||
          r.remarksCategory.toLowerCase().includes(q) ||
          r.workingRemarks.toLowerCase().includes(q)
      );
    }

    if (filters.selectedTracer) {
      result = result.filter(
        (r) => r.tracer.toLowerCase() === filters.selectedTracer.toLowerCase()
      );
    }

    if (filters.selectedStatus) {
      const s = filters.selectedStatus.toLowerCase();
      result = result.filter((r) => {
        if (s === 'closed') return r.traceStatus.toLowerCase() === 'closed';
        if (s === 'in progress') return r.traceStatus.toLowerCase().includes('progress');
        if (s === 'open') return r.traceStatus.toLowerCase() === 'open';
        return true;
      });
    }

    if (filters.selectedCategory) {
      result = result.filter(
        (r) => r.remarksCategory.toLowerCase() === filters.selectedCategory.toLowerCase()
      );
    }

    if (filters.selectedCountry) {
      result = result.filter(
        (r) => r.destCountry.toLowerCase() === filters.selectedCountry.toLowerCase()
      );
    }

    return result;
  }, [allRecords, filters]);

  // Export CSV
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) return;
    const headers = [
      'Tracking Number',
      'Case ID',
      'Tracer',
      'Case Type',
      'Shipper Company',
      'Destination Country',
      'Status',
      'Open Date',
      'Close Date',
      'Turnaround Days',
      'Delay Category',
      'Working Remarks',
      'Final Resolution',
    ];

    const rows = filteredRecords.map((r) => [
      `"${r.trackingNumber}"`,
      `"${r.caseId}"`,
      `"${r.tracer}"`,
      `"${r.caseType}"`,
      `"${r.shipperCompany.replace(/"/g, '""')}"`,
      `"${r.destCountry.replace(/"/g, '""')}"`,
      `"${r.traceStatus}"`,
      `"${r.openDate || ''}"`,
      `"${r.closeDate || ''}"`,
      r.caseDuration,
      `"${r.remarksCategory.replace(/"/g, '""')}"`,
      `"${(r.workingRemarks || '').replace(/"/g, '""')}"`,
      `"${(r.finalResolution || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `trace_delay_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleResetFilters = () => {
    setFilters({
      searchQuery: '',
      selectedTracer: '',
      selectedStatus: '',
      selectedCategory: '',
      selectedCaseType: '',
      selectedCountry: '',
      startDate: '',
      endDate: '',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="h-16 w-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4 animate-bounce">
          <Database className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">
          Loading Microsoft 365 Trace Dataset
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-sm">
          Consolidating 18 tracer sheets, normalizing delay reasons, and calculating SLA performance...
        </p>
        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin mt-6" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 mb-4">
          <AlertCircle className="w-10 h-10 mx-auto" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">
          Unable to Load Trace Data
        </h2>
        <p className="text-sm text-slate-400 max-w-md mb-6">{loadError}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-lg shadow-indigo-600/20"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* App Header */}
      <Header
        summary={summary}
        filteredCount={filteredRecords.length}
        totalCount={allRecords.length}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onExportData={handleExportCSV}
      />

      {/* Main Dashboard Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Top KPI Ribbon */}
        <KPIRibbon summary={summary} filteredCount={filteredRecords.length} />

        {/* Tracer Leaderboard */}
        {summary?.tracerStats && summary.tracerStats.length > 0 && (
          <TracerLeaderboard
            tracers={summary.tracerStats}
            selectedTracer={filters.selectedTracer}
            onSelectTracer={(tracer) => setFilters((prev) => ({ ...prev, selectedTracer: tracer }))}
          />
        )}

        {/* Analytics Breakdown Grid: Delay Categories & Country/Shipper Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 1/3: Top Delay Categories */}
          <div className="lg:col-span-1">
            {summary?.categoryStats && (
              <DelayCategoryChart
                categories={summary.categoryStats}
                selectedCategory={filters.selectedCategory}
                onSelectCategory={(category) =>
                  setFilters((prev) => ({ ...prev, selectedCategory: category }))
                }
              />
            )}
          </div>

          {/* Right 2/3: Top Countries & Shippers */}
          <div className="lg:col-span-2">
            {summary && (
              <CountryAndShipperStats
                topCountries={summary.topCountries || []}
                topShippers={summary.topShippers || []}
                selectedCountry={filters.selectedCountry}
                onSelectCountry={(country) =>
                  setFilters((prev) => ({ ...prev, selectedCountry: country }))
                }
                onSearchShipper={(shipper) =>
                  setFilters((prev) => ({ ...prev, searchQuery: shipper }))
                }
              />
            )}
          </div>
        </div>

        {/* Central Interactive Trace Records Table */}
        <TraceTable
          records={filteredRecords}
          filters={filters}
          onFilterChange={(newF) => setFilters((prev) => ({ ...prev, ...newF }))}
          onResetFilters={handleResetFilters}
          onSelectRecord={(r) => setSelectedRecord(r)}
          allTracers={allTracers}
          allCategories={allCategories}
          allCountries={allCountries}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-4 text-center text-xs text-slate-500">
        MGH Logistics Trace Intelligence Hub • Powered by Microsoft 365 & GitHub Pages
      </footer>

      {/* Case Details Modal */}
      <CaseDetailModal
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />

      {/* Data Sync & Reload Modal */}
      <DataSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        lastUpdated={summary?.lastUpdated || ''}
        onDataLoaded={(newRecords, newSummary) => {
          setAllRecords(newRecords);
          setSummary(newSummary);
        }}
      />
    </div>
  );
}

export default App;
