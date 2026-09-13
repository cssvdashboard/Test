export interface TraceRecord {
  id: string;
  sheet: string;
  trackingNumber: string;
  caseId: string;
  caseType: string;
  tracer: string;
  ownership: string;
  shipperCompany: string;
  destCountry: string;
  traceStatus: string;
  openDate: string | null;
  closeDate: string | null;
  remarksCategory: string;
  workingRemarks: string;
  finalResolution: string;
  slaRemarks: string;
  caseDuration: number;
  pieces: number;
}

export interface TracerStat {
  name: string;
  total: number;
  open: number;
  closed: number;
  avgDuration: number;
}

export interface CategoryStat {
  category: string;
  count: number;
}

export interface CaseTypeStat {
  caseType: string;
  count: number;
}

export interface EntityCount {
  country?: string;
  shipper?: string;
  count: number;
}

export interface MonthlyTrend {
  month: string;
  opened: number;
  closed: number;
}

export interface TraceSummary {
  lastUpdated: string;
  sourceFileName: string;
  totalCases: number;
  openCases: number;
  closedCases: number;
  resolutionRate: number;
  avgDurationDays: number;
  over3DayCases: number;
  tracerStats: TracerStat[];
  categoryStats: CategoryStat[];
  caseTypeStats: CaseTypeStat[];
  topCountries: { country: string; count: number }[];
  topShippers: { shipper: string; count: number }[];
  monthlyTrend: MonthlyTrend[];
}

export interface TraceFilters {
  searchQuery: string;
  selectedTracer: string;
  selectedStatus: string;
  selectedCategory: string;
  selectedCaseType: string;
  selectedCountry: string;
  startDate: string;
  endDate: string;
}
