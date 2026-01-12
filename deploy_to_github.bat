@echo off
echo [Deploying to GitHub]
echo =====================
echo 1. Adding all changes...
git add .
echo.
echo 2. Committing changes...
git commit -m "feat: Finalizing Mission Distributor overhaul and UI updates"
echo.
echo 3. Pushing to origin main...
git push origin main
echo.
echo =====================
echo Deployment Triggered. Check Vercel Dashboard for build status.
pause
.