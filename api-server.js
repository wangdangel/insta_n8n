const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const app = express();
const port = process.env.PORT || 3333;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send({ status: 'ok' });
});

// Run test endpoint
app.post('/run-test', (req, res) => {
  const { testFile, params } = req.body;
  
  if (!testFile) {
    return res.status(400).send({ error: 'Test file is required' });
  }
  
  // Create a temporary script to set environment variables
  const scriptPath = path.join('/tmp', `playwright-run-${Date.now()}.sh`);
  let scriptContent = '#!/bin/bash\n\n';
  
  // Add environment variables
  if (params && params.environmentVariables) {
    Object.entries(params.environmentVariables).forEach(([key, value]) => {
      // Escape special characters for shell
      const escapedValue = String(value).replace(/"/g, '\\"');
      scriptContent += `export ${key}="${escapedValue}"\n`;
    });
  }
  
  // Add the playwright command
  scriptContent += `npx playwright test ${testFile}`;
  
  // Add any other parameters (except environmentVariables)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (key !== 'environmentVariables' && key !== 'env') {
        if (value === true) {
          scriptContent += ` --${key}`;
        } else if (value !== null && value !== undefined) {
          scriptContent += ` --${key}=${value}`;
        }
      }
    });
  }
  
  // Write the script to a file
  fs.writeFileSync(scriptPath, scriptContent);
  fs.chmodSync(scriptPath, '755'); // Make it executable
  
  console.log(`Running script: ${scriptPath}`);
  console.log(`Script content:\n${scriptContent}`);
  
  // Execute the script and capture output in real-time
  const child = exec(scriptPath);
  let stdoutData = '';
  let stderrData = '';
  
  // Collect stdout data
  child.stdout.on('data', (data) => {
    stdoutData += data;
    console.log(`STDOUT: ${data}`);
    
    // Check for result file marker in real-time
    if (data.includes('INSTAGRAM_SCREENSHOTS_RESULT:')) {
      const match = data.match(/INSTAGRAM_SCREENSHOTS_RESULT:([^\s\n]+)/);
      if (match && match[1]) {
        console.log(`REAL-TIME: Found result marker with path ${match[1]}`);
      }
    }
  });
  
  // Collect stderr data
  child.stderr.on('data', (data) => {
    stderrData += data;
    console.error(`STDERR: ${data}`);
  });
  
  // Process completes
  child.on('close', (code) => {
    console.log(`Child process exited with code ${code}`);
    
    // Clean up the temporary script
    try {
      fs.unlinkSync(scriptPath);
    } catch (e) {
      console.error(`Error removing temp file: ${e.message}`);
    }
    
    if (code !== 0) {
      return res.status(500).send({
        success: false,
        error: `Process exited with code ${code}`,
        stdout: stdoutData,
        stderr: stderrData
      });
    }
    
    // Look for the result file marker in the collected output
    const resultMatch = stdoutData.match(/INSTAGRAM_SCREENSHOTS_RESULT:([^\s\n]+)/);
    console.log(`Checking for result marker in output (${stdoutData.length} bytes)`);
    
    if (resultMatch && resultMatch[1]) {
      const resultFilePath = resultMatch[1].trim();
      console.log(`Found screenshot result file: ${resultFilePath}`);
      
      // Check file exists with fs.access instead of fs.existsSync
      fs.access(resultFilePath, fs.constants.R_OK, (err) => {
        if (err) {
          console.error(`Cannot access result file: ${err.message}`);
          return res.status(500).send({
            success: false,
            error: `Cannot access screenshot result file: ${err.message}`,
            output: stdoutData
          });
        }
        
        // Read the result file
        fs.readFile(resultFilePath, 'utf8', (readErr, data) => {
          if (readErr) {
            console.error(`Error reading result file: ${readErr.message}`);
            return res.status(500).send({
              success: false,
              error: `Error reading screenshot result file: ${readErr.message}`,
              output: stdoutData
            });
          }
          
          console.log(`Successfully read result file (${data.length} bytes)`);
          
          try {
            // Parse JSON
            const resultData = JSON.parse(data);
            console.log(`Successfully parsed JSON with ${resultData.screenshots?.length || 0} screenshots`);
            
            // Clean up files
            fs.unlink(resultFilePath, (unlinkErr) => {
              if (unlinkErr) {
                console.error(`Error removing result file: ${unlinkErr.message}`);
              }
            });
            
            // Send the screenshot data
            console.log('Sending screenshot data to client');
            return res.status(200).send(resultData);
          } catch (parseErr) {
            console.error(`Error parsing JSON: ${parseErr.message}`);
            return res.status(500).send({
              success: false,
              error: `Error parsing JSON result: ${parseErr.message}`,
              output: stdoutData
            });
          }
        });
      });
    } else {
      console.log('No result file marker found in output');
      return res.status(200).send({
        success: true,
        output: stdoutData
      });
    }
  });
});

// List available tests
app.get('/list-tests', (req, res) => {
  exec('find /app -name "*.spec.js" -o -name "*.test.js"', (error, stdout, stderr) => {
    if (error) {
      return res.status(500).send({ error: error.message });
    }
    
    const tests = stdout.split('\n').filter(Boolean).map(path => path.replace('/app/', ''));
    res.status(200).send({ tests });
  });
});

app.listen(port, () => {
  console.log(`Playwright API server listening on port ${port}`);
});
