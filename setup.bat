@echo off
echo Instagram Automation Setup for Windows
echo =====================================

REM Create necessary directories
echo Creating directories...
mkdir playwright 2>nul
mkdir screenshots 2>nul
mkdir workflows 2>nul

REM Copy Playwright scripts to the appropriate directory
echo Copying Playwright scripts...
if exist "playwright.config.js" (
  copy playwright.config.js playwright\
  echo - Copied playwright.config.js
)

if exist "instagram.spec.js" (
  copy instagram.spec.js playwright\
  echo - Copied instagram.spec.js
)

if exist "instagram-screenshots.spec.js" (
  copy instagram-screenshots.spec.js playwright\
  echo - Copied instagram-screenshots.spec.js
)

if exist "api-server.js" (
  copy api-server.js playwright\
  echo - Copied api-server.js
)

REM Copy workflow files to workflows directory
echo Copying workflow files...
if exist "basic_working_instagram_msg.json" (
  copy basic_working_instagram_msg.json workflows\
  echo - Copied basic_working_instagram_msg.json
)

if exist "instgram_v2 (working).json" (
  copy "instgram_v2 (working).json" workflows\
  echo - Copied instgram_v2 (working).json
)

REM Create a default Caddyfile if needed for future expansion
if not exist "Caddyfile" (
  echo Creating simple Caddyfile for future use...
  echo :80 { > Caddyfile
  echo   respond "Instagram Automation Setup" >> Caddyfile
  echo } >> Caddyfile
  echo - Created Caddyfile
)

echo Setup complete! Starting containers...

REM Run docker-compose
docker-compose up -d

echo Containers are starting up. Please wait...
timeout /t 10 /nobreak > nul

REM Run setup commands inside the Playwright container
echo Setting up the Playwright container...
docker exec playwright-api bash -c "apt-get update && apt-get install -y nodejs npm && npm init -y && npm install express cors child_process fs path"
docker exec playwright-api bash -c "npx playwright install"
docker exec playwright-api bash -c "npx playwright install-deps"
docker exec playwright-api bash -c "chmod +x /app/*.js"

echo Testing Playwright API...
docker exec playwright-api bash -c "node -e \"console.log('Playwright API is operational');\""

echo ✅ Setup complete! You can access n8n at http://localhost:5678
echo 📋 Import the workflow files from the n8n interface to get started

pause
