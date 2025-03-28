# Instagram Automation with n8n and Playwright

This project provides a minimal setup for running Instagram automation workflows using n8n and Playwright.

## Components

- **n8n**: Workflow automation platform where the Instagram workflows run
- **Playwright API**: Custom API server for running Instagram automation scripts
- **PostgreSQL**: Database for n8n workflow storage

## Setup Instructions

### 1. Clone this repository
```bash
git clone https://github.com/yourusername/instagram-automation.git
cd instagram-automation
```

### 2. Set up the directory structure
```bash
# Create necessary directories
mkdir -p playwright screenshots workflows
```

### 3. Set up the environment
You have two options for setting up the environment:

#### Option A: Using the setup script (recommended)
The setup script will automatically:
- Create all necessary directories
- Copy the Playwright scripts to the appropriate locations
- Copy workflow files to the workflows directory
- Start the Docker containers
- Install all required dependencies in the Playwright container

```bash
chmod +x setup.sh
./setup.sh
```

#### Option B: Manual setup
If you prefer to set things up manually:

1. Create necessary directories:
```bash
mkdir -p playwright screenshots workflows
```

2. Copy the Playwright scripts:
```bash
cp playwright.config.js instagram.spec.js instagram-screenshots.spec.js api-server.js playwright/
```

3. Start the containers:
```bash
docker-compose up -d
```

4. Set up the Playwright container:
```bash
docker exec playwright-api bash -c "apt-get update && apt-get install -y nodejs npm && npm init -y && npm install express cors child_process fs path"
docker exec playwright-api bash -c "npx playwright install"
docker exec playwright-api bash -c "npx playwright install-deps"
docker exec playwright-api bash -c "chmod +x /app/*.js"
```

### 5. Access n8n
Open your browser and navigate to:
```
http://localhost:5678
```

### 6. Import your workflow
In the n8n interface, import any of the following workflow files:
- `basic_working_instagram_msg.json`
- `instgram_v2 (working).json`

## Project Files

### Playwright Scripts
- `instagram.spec.js`: Main script for Instagram login, profile viewing, following, and messaging
- `instagram-screenshots.spec.js`: Script for capturing screenshots of Instagram profiles
- `playwright.config.js`: Configuration for Playwright

### API Server
- `api-server.js`: Express server that allows n8n to trigger Playwright scripts via HTTP requests

### n8n Workflows
- `basic_working_instagram_msg.json`: Basic workflow for sending messages on Instagram
- `instgram_v2 (working).json`: Advanced workflow with profile analysis and personalized messaging

## Usage
1. Set up your Instagram credentials in the n8n workflow
2. Configure target usernames and message text
3. Trigger the workflow in n8n

## Notes
- This setup uses headless browsers, so no UI will be visible during execution
- All screenshots will be saved to the `screenshots` directory
- Workflows are stored in PostgreSQL and can be exported/imported through the n8n interface

## Troubleshooting

### Windows-specific issues:

1. **WSL2 Installation**
   If you're using Docker Desktop on Windows, make sure WSL2 is properly installed. Docker Desktop will guide you through this process during installation.

2. **Line Ending Issues**
   If you encounter errors related to line endings in scripts when copied from Windows to Linux containers:
   ```
   sed -i 's/\r$//' /app/*.js
   ```

3. **Docker Desktop Settings**
   Ensure that your Docker Desktop has adequate resources allocated:
   - Go to Settings > Resources
   - Recommended: At least 4GB RAM, 2 CPUs

4. **File Sharing Issues**
   If you encounter problems with volume mounts:
   - Make sure Docker Desktop has permission to access the drive where your project is located
   - In Docker Desktop, go to Settings > Resources > File Sharing and add your project directory

### General issues:

1. **Playwright Installation**
   If the Playwright installation fails, you can manually run:
   ```
   docker exec -it playwright-api bash
   cd /app
   npm install
   npx playwright install
   npx playwright install-deps
   ```

2. **n8n Can't Connect to Playwright**
   Check that the API server is running:
   ```
   docker logs playwright-api
   ```
   Ensure the API is listening on port 3333 and that n8n can reach it.

## Cleanup

### For Linux/macOS:
When you're done with the project, you can use the provided cleanup script:

```bash
chmod +x cleanup.sh
./cleanup.sh
```

### For Windows:
Double-click `cleanup.bat` or run it from Command Prompt.

The cleanup script will:
- Stop all running containers
- Ask if you want to remove volumes (this will delete all data including workflows and settings)
- Clean up the Docker environment
