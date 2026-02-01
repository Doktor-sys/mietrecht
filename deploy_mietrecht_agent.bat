@echo off
REM Mietrecht Agent Heroku Deployment Script
REM This script deploys the Mietrecht Agent to Heroku

echo ========================================
echo Mietrecht Agent Deployment
echo ========================================
echo.

echo Step 1: Checking prerequisites...
echo ----------------------------------------
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Git is not installed or not in PATH
    echo Please install Git from https://git-scm.com/
    echo.
    pause
    exit /b 1
) else (
    echo ✅ Git is installed
)

heroku --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Heroku CLI is not installed or not in PATH
    echo Please install Heroku CLI from https://devcenter.heroku.com/articles/heroku-cli
    echo.
    pause
    exit /b 1
) else (
    echo ✅ Heroku CLI is installed
)

echo.
echo Step 2: Initializing Git repository...
echo ----------------------------------------
git init >nul 2>&1
git add . >nul 2>&1
git commit -m "Initial commit for Mietrecht Agent" >nul 2>&1
echo ✅ Git repository initialized and files committed

echo.
echo Step 3: Creating Heroku app...
echo ----------------------------------------
echo Please log in to Heroku when prompted (browser will open)
heroku login
set /p app_name="Enter Heroku app name (or press Enter for default 'mietrecht-agent'): "
if "%app_name%"=="" set app_name=mietrecht-agent
heroku create %app_name%
if %errorlevel% neq 0 (
    echo ❌ Failed to create Heroku app
    echo.
    pause
    exit /b 1
) else (
    echo ✅ Heroku app created successfully
)

echo.
echo Step 4: Setting environment variables...
echo ----------------------------------------
echo Please enter your email configuration:
set /p email_user="Email user (e.g., your-email@gmail.com): "
heroku config:set EMAIL_USER=%email_user% --app %app_name%

set /p email_pass="Email password or app password: "
heroku config:set EMAIL_PASS=%email_pass% --app %app_name%

set /p email_from="Email from address (e.g., your-email@gmail.com): "
heroku config:set EMAIL_FROM=%email_from% --app %app_name%

echo Please enter your data source configuration (optional, press Enter to skip):
set /p bgh_max_results="BGH max results (default 10): "
if defined bgh_max_results (
    heroku config:set BGH_MAX_RESULTS=%bgh_max_results% --app %app_name%
)

set /p landgerichte_max_results="Landgerichte max results (default 15): "
if defined landgerichte_max_results (
    heroku config:set LANDGERICHTE_MAX_RESULTS=%landgerichte_max_results% --app %app_name%
)

set /p beckonline_max_results="BeckOnline max results (default 10): "
if defined beckonline_max_results (
    heroku config:set BECKONLINE_MAX_RESULTS=%beckonline_max_results% --app %app_name%
)

echo.
echo Step 5: Setting up database...
echo ----------------------------------------
echo Adding Heroku Postgres addon...
heroku addons:create heroku-postgresql:hobby-dev --app %app_name%
if %errorlevel% neq 0 (
    echo ⚠ Warning: Failed to add Postgres addon. You may need to add it manually.
) else (
    echo ✅ Postgres addon added successfully
)

echo.
echo Step 6: Deploying to Heroku...
echo ----------------------------------------
git push heroku main
if %errorlevel% neq 0 (
    echo ❌ Deployment failed
    echo.
    pause
    exit /b 1
) else (
    echo ✅ Deployment successful!
)

echo.
echo Step 7: Running database migrations...
echo ----------------------------------------
echo Running database initialization...
heroku run "node scripts/database/init.js" --app %app_name%
if %errorlevel% neq 0 (
    echo ⚠ Warning: Database initialization failed. You may need to run it manually.
) else (
    echo ✅ Database initialized successfully
)

echo.
echo ========================================
echo Deployment completed successfully!
echo ========================================
echo.
echo Your Mietrecht Agent is now deployed!
echo.
echo Web interface URL:
echo https://%app_name%.herokuapp.com
echo.
echo To run the agent manually:
echo heroku run "node scripts/mietrecht_agent_real_data.js" --app %app_name%
echo.
echo To check logs:
echo heroku logs --tail --app %app_name%
echo.
echo To scale the worker process (for automatic execution):
echo heroku ps:scale worker=1 --app %app_name%
echo.
pause