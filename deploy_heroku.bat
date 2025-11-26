@echo off
REM GitHub-Asana Integration Heroku Deployment Script
REM This script helps with the manual deployment process

echo ========================================
echo GitHub-Asana Integration Deployment
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
git commit -m "Initial commit for GitHub-Asana integration" >nul 2>&1
echo ✅ Git repository initialized and files committed

echo.
echo Step 3: Creating Heroku app...
echo ----------------------------------------
echo Please log in to Heroku when prompted (browser will open)
heroku login
heroku create github-asana-integration-smartlaw
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
echo Please enter your Asana personal access token:
set /p asana_token="Token: "
heroku config:set ASANA_ACCESS_TOKEN=%asana_token%

echo Please enter your GitHub webhook secret:
set /p github_secret="Secret: "
heroku config:set GITHUB_WEBHOOK_SECRET=%github_secret%

echo Please enter your Asana workspace ID (optional, press Enter to skip):
set /p workspace_id="Workspace ID: "
if defined workspace_id (
    heroku config:set ASANA_WORKSPACE_ID=%workspace_id%
)

echo ✅ Environment variables set

echo.
echo Step 5: Deploying to Heroku...
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
echo ========================================
echo Deployment completed successfully!
echo ========================================
echo.
echo Next steps:
echo 1. Configure the GitHub webhook with the URL:
echo    https://github-asana-integration-smartlaw.herokuapp.com/webhook/github
echo.
echo 2. Test the integration by making a commit with a task ID
echo.
echo 3. Check the application logs with: heroku logs --tail
echo.
echo 4. View the health endpoint at:
echo    https://github-asana-integration-smartlaw.herokuapp.com/health
echo.
pause