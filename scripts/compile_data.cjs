const fs = require('fs');
const path = require('path');
let xlsx;
try {
  xlsx = require('xlsx');
} catch (e) {
  xlsx = require('../../Outbound_Shipment_Report/node_modules/xlsx');
}

const DEFAULT_SOURCE_PATH = 'C:/Users/MohammadShihabShahar/OneDrive - mghgroup.com/Trace Report.xlsx';
const FALLBACK_SOURCE_PATH = path.resolve(__dirname, '../Trace Report.xlsx');

const sourceFile = fs.existsSync(DEFAULT_SOURCE_PATH) ? DEFAULT_SOURCE_PATH : FALLBACK_SOURCE_PATH;

if (!fs.existsSync(sourceFile)) {
  console.error(`Error: Trace Report file not found at ${DEFAULT_SOURCE_PATH} or ${FALLBACK_SOURCE_PATH}`);
  process.exit(1);
}

console.log(`Reading source workbook: ${sourceFile}`);
const startTime = Date.now();
const wb = xlsx.readFile(sourceFile, { cellDates: false });
console.log(`Workbook loaded in ${((Date.now() - startTime) / 1000).toFixed(2)}s. Sheets: ${wb.SheetNames.length}`);

const EXCLUDED_SHEETS = [
  'summary',
  'cs outbound mail',
  'cs outbound mail',
  'sheet1',
  'sheet2',
  'sheet3',
  'sheet4'
];

function isExcluded(sheetName) {
  const norm = sheetName.trim().toLowerCase();
  return EXCLUDED_SHEETS.some(ex => norm === ex || norm.includes('outbound mail') || norm === 'summary');
}

function parseExcelDate(val) {
  if (!val) return null;
  if (typeof val === 'number') {
    // Excel base date is Dec 30 1899
    if (val < 10000 || val > 70000) return null; // not a sensible date serial
    const date = new Date((val - 25569) * 86400 * 1000);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().split('T')[0];
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return null;
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 2000 && parsed.getFullYear() < 2035) {
      return parsed.toISOString().split('T')[0];
    }
  }
  return null;
}

function cleanString(val) {
  if (val === undefined || val === null) return '';
  return String(val).replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function cleanCountry(val) {
  const s = cleanString(val);
  if (!s) return 'Unknown';
  // Common format: "GB - United Kingdom" -> keep "United Kingdom" or code
  const parts = s.split('-');
  if (parts.length > 1) {
    const code = parts[0].trim().toUpperCase();
    const name = parts.slice(1).join('-').trim();
    return `${code} - ${name}`;
  }
  return s;
}

const records = [];
let totalRowsParsed = 0;

for (const sheetName of wb.SheetNames) {
  if (isExcluded(sheetName)) {
    console.log(`Skipping excluded sheet: ${sheetName}`);
    continue;
  }

  const sheet = wb.Sheets[sheetName];
  if (!sheet || !sheet['!ref']) continue;

  // Clamp range to actual columns present in header row to avoid sheets with phantom columns (e.g. A1:XEY3736)
  const range = xlsx.utils.decode_range(sheet['!ref']);
  let maxHeaderCol = 0;
  for (let C = 0; C <= Math.min(range.e.c, 40); C++) {
    const cell = sheet[xlsx.utils.encode_cell({ r: range.s.r, c: C })];
    if (cell && cell.v !== undefined && String(cell.v).trim() !== '') {
      maxHeaderCol = C;
    }
  }
  range.e.c = Math.max(maxHeaderCol, 16);
  sheet['!ref'] = xlsx.utils.encode_range(range);

  const rawRows = xlsx.utils.sheet_to_json(sheet, { defval: '', raw: true });
  if (!rawRows || rawRows.length === 0) continue;

  console.log(`Processing sheet "${sheetName}": ${rawRows.length} rows`);

  for (const row of rawRows) {
    totalRowsParsed++;

    // Find keys case-insensitively
    const keys = Object.keys(row);
    const getVal = (...fieldPatterns) => {
      for (const pattern of fieldPatterns) {
        const found = keys.find(k => k.trim().toLowerCase() === pattern.toLowerCase());
        if (found && row[found] !== undefined && row[found] !== null && String(row[found]).trim() !== '') {
          return row[found];
        }
      }
      return '';
    };

    const trackingRaw = getVal('tracking#', 'tracking #', 'tracking no', 'awb', 'awb#', 'tracking');
    const caseIdRaw = getVal('case id', 'caseid', 'case_id');

    // Skip blank or invalid rows
    if (!trackingRaw && !caseIdRaw) continue;

    const trackingNumber = cleanString(trackingRaw);
    const caseId = cleanString(caseIdRaw);
    if (!trackingNumber && !caseId) continue;

    const tracerRaw = getVal('tracer', 'associate', 'owner');
    let tracer = cleanString(tracerRaw);
    if (!tracer || tracer.length < 2) {
      // Default to sheet name if sheet name looks like a person's name
      if (!['rpi', 'rpi closed case', 'bso', 'closed cases', 'service change & billing', 'dv'].includes(sheetName.toLowerCase())) {
        tracer = sheetName;
      } else {
        tracer = tracer || 'Operations / CS';
      }
    }

    const caseType = cleanString(getVal('case type', 'casy type', 'casetype', 'type')) || 'Standard Trace';
    const ownership = cleanString(getVal('ownership', 'owner_type')) || 'General';
    const shipperCompany = cleanString(getVal('shipper company', 'shipper', 'customer', 'shipper name')) || 'Unspecified Shipper';
    const destCountry = cleanCountry(getVal('dest. country', 'destination country', 'dest country', 'country'));
    
    // Status resolution
    let rawStatus = cleanString(getVal('trace status', 'status')).toLowerCase();
    let traceStatus = 'Open';
    if (
      sheetName.toLowerCase().includes('closed') ||
      rawStatus.includes('close') ||
      rawStatus.includes('resolved') ||
      rawStatus.includes('delivered')
    ) {
      traceStatus = 'Closed';
    } else if (rawStatus.includes('progress') || rawStatus.includes('working') || rawStatus.includes('pending')) {
      traceStatus = 'In Progress';
    } else if (rawStatus) {
      traceStatus = cleanString(getVal('trace status', 'status'));
    }

    const openDateRaw = getVal('trace open date', 'open date', 'date');
    const closeDateRaw = getVal('trace close date', 'trace closing date', 'closing date', 'close date');
    const openDate = parseExcelDate(openDateRaw);
    const closeDate = parseExcelDate(closeDateRaw);

    const remarksCategory = cleanString(getVal('remarks category', 'delay reason', 'category', 'delay category', 'reason')) || 'General Trace';
    const workingRemarks = cleanString(getVal('working remarks', 'remarks', 'notes', 'comment', 'description'));
    const finalResolution = cleanString(getVal('final resolution', 'resolution', 'closing remarks'));
    const slaRemarks = cleanString(getVal('remarks if +3 day trace', '+3 day remarks', 'sla remarks'));
    
    // Duration calculation: prefer actual date diff if both dates exist
    let caseDuration = 0;
    if (openDate && closeDate) {
      const d1 = new Date(openDate);
      const d2 = new Date(closeDate);
      const diffDays = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays < 90) {
        caseDuration = diffDays;
      }
    }
    
    if (caseDuration === 0) {
      const rawDur = parseFloat(getVal('case duration', 'duration'));
      if (!isNaN(rawDur) && rawDur > 0 && rawDur < 60) {
        caseDuration = Math.round(rawDur * 10) / 10;
      } else {
        const rawAge = parseFloat(getVal('age'));
        if (!isNaN(rawAge) && rawAge > 0 && rawAge < 60) {
          caseDuration = Math.round(rawAge * 10) / 10;
        }
      }
    }

    const pieces = parseInt(getVal('package', 'number of pieces', 'pieces', 'pcs'), 10) || 1;

    records.push({
      id: `${sheetName}-${records.length + 1}`,
      sheet: sheetName,
      trackingNumber,
      caseId: caseId || 'N/A',
      caseType,
      tracer,
      ownership,
      shipperCompany,
      destCountry,
      traceStatus,
      openDate,
      closeDate,
      remarksCategory,
      workingRemarks,
      finalResolution,
      slaRemarks,
      caseDuration,
      pieces
    });
  }
}

console.log(`\nCompilation complete! Total valid records extracted: ${records.length} (from ${totalRowsParsed} raw rows)`);

// Precalculate KPI Analytics
const totalCases = records.length;
const closedCases = records.filter(r => r.traceStatus.toLowerCase() === 'closed').length;
const openCases = totalCases - closedCases;

let totalDuration = 0;
let durationCount = 0;
records.forEach(r => {
  if (r.caseDuration > 0) {
    totalDuration += r.caseDuration;
    durationCount++;
  }
});
const avgDurationDays = durationCount > 0 ? +(totalDuration / durationCount).toFixed(1) : 0;
const over3DayCases = records.filter(r => r.caseDuration > 3 || (r.slaRemarks && r.slaRemarks.length > 2)).length;

// Tracer Workload Breakdown
const tracerMap = {};
records.forEach(r => {
  const t = r.tracer || 'Other';
  if (!tracerMap[t]) {
    tracerMap[t] = { name: t, total: 0, open: 0, closed: 0, durations: [] };
  }
  tracerMap[t].total++;
  if (r.traceStatus.toLowerCase() === 'closed') tracerMap[t].closed++;
  else tracerMap[t].open++;
  if (r.caseDuration > 0) tracerMap[t].durations.push(r.caseDuration);
});

const tracerStats = Object.values(tracerMap).map(t => ({
  name: t.name,
  total: t.total,
  open: t.open,
  closed: t.closed,
  avgDuration: t.durations.length > 0 ? +(t.durations.reduce((a, b) => a + b, 0) / t.durations.length).toFixed(1) : 0
})).sort((a, b) => b.total - a.total);

// Delay / Remarks Category breakdown
const categoryMap = {};
records.forEach(r => {
  const cat = r.remarksCategory || 'Uncategorized';
  categoryMap[cat] = (categoryMap[cat] || 0) + 1;
});
const categoryStats = Object.entries(categoryMap)
  .map(([category, count]) => ({ category, count }))
  .sort((a, b) => b.count - a.count);

// Case Type breakdown
const caseTypeMap = {};
records.forEach(r => {
  const type = r.caseType || 'Standard';
  caseTypeMap[type] = (caseTypeMap[type] || 0) + 1;
});
const caseTypeStats = Object.entries(caseTypeMap)
  .map(([caseType, count]) => ({ caseType, count }))
  .sort((a, b) => b.count - a.count);

// Top Countries
const countryMap = {};
records.forEach(r => {
  const c = r.destCountry || 'Unknown';
  countryMap[c] = (countryMap[c] || 0) + 1;
});
const topCountries = Object.entries(countryMap)
  .map(([country, count]) => ({ country, count }))
  .sort((a, b) => b.count - a.count)
  .slice(0, 15);

// Top Shippers
const shipperMap = {};
records.forEach(r => {
  const s = r.shipperCompany || 'Unknown';
  shipperMap[s] = (shipperMap[s] || 0) + 1;
});
const topShippers = Object.entries(shipperMap)
  .map(([shipper, count]) => ({ shipper, count }))
  .sort((a, b) => b.count - a.count)
  .slice(0, 15);

// Monthly Trend
const monthlyMap = {};
records.forEach(r => {
  if (r.openDate) {
    const month = r.openDate.substring(0, 7);
    if (!monthlyMap[month]) monthlyMap[month] = { month, opened: 0, closed: 0 };
    monthlyMap[month].opened++;
  }
  if (r.closeDate) {
    const month = r.closeDate.substring(0, 7);
    if (!monthlyMap[month]) monthlyMap[month] = { month, opened: 0, closed: 0 };
    monthlyMap[month].closed++;
  }
});
const monthlyTrend = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));

const summary = {
  lastUpdated: new Date().toISOString(),
  sourceFileName: path.basename(sourceFile),
  totalCases,
  openCases,
  closedCases,
  resolutionRate: totalCases > 0 ? +((closedCases / totalCases) * 100).toFixed(1) : 0,
  avgDurationDays,
  over3DayCases,
  tracerStats,
  categoryStats,
  caseTypeStats,
  topCountries,
  topShippers,
  monthlyTrend
};

const outputDir = path.resolve(__dirname, '../public/data');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(path.join(outputDir, 'trace_summary.json'), JSON.stringify(summary, null, 2));
fs.writeFileSync(path.join(outputDir, 'trace_records.json'), JSON.stringify(records));

console.log(`Summary written to public/data/trace_summary.json (${(fs.statSync(path.join(outputDir, 'trace_summary.json')).size / 1024).toFixed(1)} KB)`);
console.log(`Records written to public/data/trace_records.json (${(fs.statSync(path.join(outputDir, 'trace_records.json')).size / 1024 / 1024).toFixed(2)} MB)`);
