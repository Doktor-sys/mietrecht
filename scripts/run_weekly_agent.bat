@echo off
REM Weekly Update Agent Prototype Batch File
REM This script runs the weekly update agent prototype

echo Weekly Update Agent Prototype
echo =============================
echo This script will demonstrate the weekly update agent functionality
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

echo Running Weekly Update Agent Prototype...
echo.
node weekly_update_agent_prototype.js

echo.
echo Weekly Update Agent Prototype completed.
pause