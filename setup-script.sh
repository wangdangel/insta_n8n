#!/bin/bash

# Create necessary directories
mkdir -p playwright screenshots workflows

# Copy Playwright scripts to the appropriate directory
echo "Copying Playwright scripts..."
if [ -f "playwright.config.js" ]; then
  cp playwright.config.js playwright/
  echo "- Copied playwright.config.js"
fi

if [ -f "instagram.spec.js" ]; then
  cp instagram.spec.js playwright/
  echo "- Copied instagram.spec.js"
fi

if [ -f "instagram-screenshots.spec.js" ]; then
  cp instagram-screenshots.spec.js playwright/
  echo "- Copied instagram-screenshots.spec.js"
fi

if [ -f "api-server.js" ]; then
  cp api-server.js playwright/
  echo "- Copied api-server.js"
fi

# Copy workflow files to workflows directory
echo "Copying workflow files..."
if [ -f "basic_working_instagram_msg.json" ]; then
  cp basic_working_instagram_msg.json workflows/
  echo "- Copied basic_working_instagram_msg.json"
fi

if [ -f "instgram_v2 (working).json" ]; then
  cp "instgram_v2 (working).json" workflows/
  echo "- Copied instgram_v2 (working).json"
fi

# Create a default Caddyfile if needed for future expansion
if [ ! -f "Caddyfile" ]; then
  echo "Creating simple Caddyfile for future use..."
  cat > Caddyfile << EOF
:80 {
  respond "Instagram Automation Setup"
}
EOF
  echo "- Created Caddyfile"
fi

echo "Setup complete! Starting containers..."

# Run docker-compose
docker-compose up -d

echo "Containers are starting up. Please wait..."
sleep 10  # Give containers some time to start

# Run setup commands inside the Playwright container
echo "Setting up the Playwright container..."
docker exec playwright-api bash -c "apt-get update && apt-get install -y nodejs npm && npm init -y && npm install express cors child_process fs path"
docker exec playwright-api bash -c "npx playwright install"
docker exec playwright-api bash -c "npx playwright install-deps"
docker exec playwright-api bash -c "chmod +x /app/*.js"

echo "Testing Playwright API..."
docker exec playwright-api bash -c "node -e \"console.log('Playwright API is operational');\""

echo "✅ Setup complete! You can access n8n at http://localhost:5678"
echo "📋 Import the workflow files from the n8n interface to get started"
