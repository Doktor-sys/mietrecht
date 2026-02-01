@echo off
cd services\backend
echo [INFO] Installing basic types dependencies just in case...
call npm install --save-dev typescript @types/node @types/express @types/cors
echo [INFO] Running TypeScript Build...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Build failed!
    exit /b %errorlevel%
)
echo [SUCCESS] Build successful!
