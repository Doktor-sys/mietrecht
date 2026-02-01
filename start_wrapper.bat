@echo off
REM Wrapper script to start the local environment from PowerShell
REM This ensures the batch script runs in CMD, not PowerShell

echo Starting SmartLaw Mietrecht Local Environment...
echo.

REM Start in a new CMD window
start "SmartLaw Setup" cmd /k "cd /d %~dp0 && start_local_simple.bat"

echo.
echo Setup script started in a new window.
echo Please check the new CMD window for progress.
pause
