const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const WATCH_FILE = 'C:/Users/MohammadShihabShahar/OneDrive - mghgroup.com/Trace Report.xlsx';
const COMPILE_SCRIPT = path.resolve(__dirname, 'compile_data.cjs');
const PROJECT_ROOT = path.resolve(__dirname, '..');

if (!fs.existsSync(WATCH_FILE)) {
  console.error(`[ERROR] File not found to watch at: ${WATCH_FILE}`);
  process.exit(1);
}

console.log('========================================================');
console.log('  Trace & Delay Dashboard — Automated Sync Watcher');
console.log('========================================================');
console.log(`[STATUS] Watching: ${WATCH_FILE}`);
console.log('[INFO] Whenever your team edits the online Excel file,');
console.log('       this watcher will recompile and update GitHub Pages.');
console.log('--------------------------------------------------------');

let lastMtime = fs.statSync(WATCH_FILE).mtimeMs;
let isSyncing = false;
let debounceTimer = null;

function performSync() {
  if (isSyncing) return;
  isSyncing = true;

  const now = new Date().toLocaleTimeString();
  console.log(`\n[${now}] 🔄 Detected change in Trace Report.xlsx! Starting sync...`);

  try {
    // 1. Recompile dataset
    console.log(`[${now}] Compiling sheets and updating KPI analytics...`);
    execSync(`node "${COMPILE_SCRIPT}"`, { cwd: PROJECT_ROOT, stdio: 'inherit' });

    // 2. Check for git diff in public/data
    const status = execSync('git status --porcelain public/data/', { cwd: PROJECT_ROOT, encoding: 'utf-8' }).trim();

    if (!status) {
      console.log(`[${now}] ℹ️ No data changes detected in dataset. Skipping push.`);
      isSyncing = false;
      return;
    }

    // 3. Stage, commit and push
    console.log(`[${now}] Changes detected. Pushing to GitHub Pages...`);
    execSync('git add public/data/', { cwd: PROJECT_ROOT, stdio: 'inherit' });
    
    const commitMsg = `Auto-sync: update trace data from Microsoft 365 [${new Date().toISOString().replace('T', ' ').substring(0, 19)}]`;
    execSync(`git commit -m "${commitMsg}"`, { cwd: PROJECT_ROOT, stdio: 'inherit' });
    
    execSync('git push origin main', { cwd: PROJECT_ROOT, stdio: 'inherit' });

    console.log(`[${now}] ✅ Successfully published updates to GitHub Pages!`);
    console.log(`[${now}] Live URL updating: https://cssvdashboard.github.io/Test/`);
  } catch (err) {
    console.error(`[${now}] ❌ Sync error:`, err.message);
  } finally {
    isSyncing = false;
  }
}

// Poll file modification every 5 seconds (avoids Windows lock / handle issues with Excel Online)
setInterval(() => {
  try {
    if (!fs.existsSync(WATCH_FILE)) return;
    const currentMtime = fs.statSync(WATCH_FILE).mtimeMs;

    if (currentMtime !== lastMtime) {
      lastMtime = currentMtime;
      console.log(`[${new Date().toLocaleTimeString()}] File update detected. Waiting 6s for OneDrive to finish writing...`);

      // Debounce to allow OneDrive to finish file writing
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        performSync();
      }, 6000);
    }
  } catch (err) {
    // Ignore temporary read locks while OneDrive writes
  }
}, 5000);

console.log('[READY] Active & waiting for team changes... (Press Ctrl+C to stop)\n');
