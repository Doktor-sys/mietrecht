@echo off
REM Mietrecht Court Decisions Agent Batch File
REM This script runs the Mietrecht Court Decisions Agent prototype

echo Mietrecht Court Decisions Agent Prototype
echo =======================================
echo This script will demonstrate the Mietrecht Court Decisions Agent functionality
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

echo Running Mietrecht Court Decisions Agent Prototype...
echo.
node mietrecht_agent_prototype.js

echo.
echo Mietrecht Court Decisions Agent Prototype completed.
pause