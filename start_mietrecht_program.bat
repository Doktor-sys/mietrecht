@echo off
echo Starting Mietrecht Program...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Python is not installed or not in PATH.
    echo Please install Python first.
    pause
    exit /b 1
)

REM Check if required packages are installed
echo Checking for required packages...
python -c "import flask" >nul 2>&1
if %errorlevel% neq 0 (
    echo Flask is not installed. Installing...
    pip install flask
)

echo.
echo Starting Mietrecht application...
echo.

REM Start the Flask application
start cmd /c "python mietrecht_full.py"

REM Wait for application to start
timeout /t 10 /nobreak >nul

echo.
echo Mietrecht Program is now running!
echo.
echo Application:
echo - Mietrecht App: http://localhost:5000
echo.
echo The application is accessible in your browser at http://localhost:5000
echo Press any key to exit...
pause >nul