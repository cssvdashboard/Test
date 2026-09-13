@echo off
title Trace & Delay Dashboard - Live Auto-Sync
cd /d "%~dp0"
echo ========================================================
echo   MGH Logistics - Live Auto-Sync to GitHub Pages
echo ========================================================
echo Starting auto-sync watcher...
echo.
node scripts\auto_sync.cjs
pause
