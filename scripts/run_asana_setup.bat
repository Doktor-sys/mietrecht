@echo off
REM Asana Setup Helper Batch File
REM This script runs the Asana setup helper

echo Asana Setup Helper
echo ==================
echo This script will display the Asana setup information
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js version: 
node --version
echo.

echo Running Asana Setup Helper...
echo.
node asana_setup_helper.js

echo.
echo Setup helper completed.
pause