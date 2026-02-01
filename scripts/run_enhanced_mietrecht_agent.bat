@echo off
REM Enhanced Mietrecht Agent with KI/ML Capabilities
REM This script runs the enhanced Mietrecht Agent with advanced AI/ML features

echo Starting Enhanced Mietrecht Agent with KI/ML Capabilities...
echo Date: %date% %time%

REM Navigate to the scripts directory
cd /d "%~dp0"

REM Run the enhanced Mietrecht Agent
node mietrecht_agent_enhanced.js

echo.
echo Enhanced Mietrecht Agent execution completed.
echo.

REM Pause to allow user to see the output
pause