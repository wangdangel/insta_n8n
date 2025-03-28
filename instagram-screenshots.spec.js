// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');

// Test parameters will be passed from environment variables
test('Instagram profile screenshot workflow', async ({ page }) => {
    // Get parameters from environment variables
    const username = process.env.INSTAGRAM_USERNAME;
    const password = process.env.INSTAGRAM_PASSWORD;
    const targetUsername = process.env.TARGET_USERNAME;
    const numScreenshots = parseInt(process.env.NUM_SCREENSHOTS || '5'); // Default to 5 screenshots
    const scrollPercent = parseFloat(process.env.SCROLL_PERCENT || '0.8'); // Default to 80% of viewport height
    const waitTime = parseInt(process.env.WAIT_TIME || '3000'); // Default to 3 seconds wait between scrolls

    console.log(`Starting Instagram screenshot automation for target: ${targetUsername}`);
    console.log(`Will capture ${numScreenshots} screenshots with ${waitTime}ms wait time`);

    // Create a directory for this run's screenshots
    const runId = Date.now();
    const screenshotDir = `/tmp/instagram-${runId}`;
    
    try {
        fs.mkdirSync(screenshotDir, { recursive: true });
        console.log(`Created screenshot directory: ${screenshotDir}`);
    } catch (e) {
        console.error(`Error creating screenshot directory: ${e.message}`);
        throw e;
    }

    // Step 1: Navigate to Instagram
    await page.goto('https://www.instagram.com/', { waitUntil: 'domcontentloaded' });
    console.log('Navigated to Instagram');

    // Wait for the page to fully load
    await page.waitForTimeout(5000);

    // Step 2: Login - reusing your existing login logic
    try {
        // Try different selectors for username
        const usernameSelectors = [
            'input[name="username"]',
            'input[aria-label="Phone number, username, or email"]',
            '[placeholder="Phone number, username, or email"]',
        ];

        let usernameField = null;
        for (const selector of usernameSelectors) {
            try {
                usernameField = await page.$(selector);
                if (usernameField) {
                    console.log(`Found username field with selector: ${selector}`);
                    break;
                }
            } catch (e) {}
        }

        if (!usernameField) {
            throw new Error('Username field not found with any selector');
        }

        // Clear and enter username
        await usernameField.click({ clickCount: 3 });
        await usernameField.fill(username);
        console.log('Entered username');

        // Try different selectors for password
        const passwordSelectors = [
            'input[name="password"]',
            'input[aria-label="Password"]',
            'input[type="password"]',
            '[placeholder="Password"]',
        ];

        let passwordField = null;
        for (const selector of passwordSelectors) {
            try {
                passwordField = await page.$(selector);
                if (passwordField) {
                    console.log(`Found password field with selector: ${selector}`);
                    break;
                }
            } catch (e) {}
        }

        if (!passwordField) {
            throw new Error('Password field not found with any selector');
        }

        // Clear and enter password
        await passwordField.click({ clickCount: 3 });
        await passwordField.fill(password);
        console.log('Entered password');

        // Try different selectors for login button
        const loginButtonSelectors = [
            'button[type="submit"]',
            'button:has-text("Log In")',
            'button:has-text("Log in")',
        ];

        let loginButton = null;
        for (const selector of loginButtonSelectors) {
            try {
                loginButton = await page.$(selector);
                if (loginButton) {
                    console.log(`Found login button with selector: ${selector}`);
                    break;
                }
            } catch (e) {}
        }

        if (!loginButton) {
            throw new Error('Login button not found with any selector');
        }

        // Click login button
        await loginButton.click();
        console.log('Clicked login button');

        // Wait for login to complete
        await page.waitForTimeout(10000);

        // Check if we're on a challenge page
        const challengeExists = await page
            .$$eval('form[id*="challenge"]', (elements) => elements.length > 0)
            .catch(() => false);
        if (challengeExists) {
            console.log('SECURITY CHALLENGE DETECTED - manual intervention required');
            throw new Error('Instagram security challenge detected');
        }
    } catch (e) {
        console.error('Login failed:', e.message);
        throw e;
    }

    // Step 3: Handle dialogs that might appear
    try {
        // Look for the "Save Your Login Info" dialog
        const saveLoginButton = await page.$('button:has-text("Not Now")');
        if (saveLoginButton) {
            await saveLoginButton.click();
            console.log('Clicked "Not Now" on save login dialog');
            await page.waitForTimeout(2000);
        }
    } catch (e) {
        console.log('No save login dialog found, continuing');
    }

    try {
        // Look for the notifications dialog
        const notificationsButton = await page.$('button:has-text("Not Now")');
        if (notificationsButton) {
            await notificationsButton.click();
            console.log('Clicked "Not Now" on notifications dialog');
            await page.waitForTimeout(2000);
        }
    } catch (e) {
        console.log('No notifications dialog found, continuing');
    }

    // Step 4: Navigate to user profile
    try {
        // Navigate directly to the user's profile
        await page.goto(`https://www.instagram.com/${targetUsername}/`, { waitUntil: 'domcontentloaded' });
        console.log(`Navigated to profile: ${targetUsername}`);
        await page.waitForTimeout(5000);
    } catch (e) {
        console.error('Profile navigation failed:', e.message);
        throw e;
    }

    // Step 5: Take sequential screenshots
    try {
        // Get viewport height for scroll calculations
        const viewportHeight = await page.evaluate(() => window.innerHeight);
        const scrollAmount = Math.floor(viewportHeight * scrollPercent);
        
        console.log(`Taking ${numScreenshots} screenshots with scroll amount of ${scrollAmount}px`);
        
        const screenshotPaths = [];
        
        for (let i = 0; i < numScreenshots; i++) {
            console.log(`Taking screenshot ${i + 1} of ${numScreenshots}`);
            
            // Take screenshot
            const screenshotPath = `${screenshotDir}/instagram-${targetUsername}-${i+1}.png`;
            await page.screenshot({ 
                fullPage: false,
                type: 'png',
                path: screenshotPath
            });
            
            screenshotPaths.push(screenshotPath);
            console.log(`Saved screenshot ${i+1} to ${screenshotPath}`);
            
            // If this is not the last screenshot, scroll down
            if (i < numScreenshots - 1) {
                await page.evaluate((scrollPixels) => {
                    window.scrollBy(0, scrollPixels);
                }, scrollAmount);
                
                // Wait for content to load
                await page.waitForTimeout(waitTime);
                
                // Try to wait for new content to be visible
                try {
                    // Wait for any new images that might load
                    await page.waitForFunction(() => {
                        const images = document.querySelectorAll('img');
                        return Array.from(images).some(img => !img.complete);
                    }, { timeout: 2000 }).catch(() => {
                        // It's okay if this times out, it might mean all images are already loaded
                    });
                    
                    // Then wait for them to finish loading
                    await page.waitForFunction(() => {
                        const images = document.querySelectorAll('img');
                        return Array.from(images).every(img => img.complete);
                    }, { timeout: 3000 }).catch(() => {
                        // It's okay if this times out too
                    });
                } catch (e) {
                    console.log('Waiting for new content timed out, continuing anyway');
                }
            }
        }
        
        console.log(`Successfully captured ${screenshotPaths.length} screenshots`);
        
        // Build the data object and encode screenshots to base64
        const data = {
            success: true,
            targetUsername: targetUsername,
            screenshots: []
        };
        
        for (let i = 0; i < screenshotPaths.length; i++) {
            const path = screenshotPaths[i];
            try {
                const imageBuffer = fs.readFileSync(path);
                const base64Image = imageBuffer.toString('base64');
                
                data.screenshots.push({
                    id: i + 1,
                    position: i === 0 ? 'top' : `scroll-${i}`,
                    base64: `data:image/png;base64,${base64Image}`
                });
                
                // Delete the file after encoding
                fs.unlinkSync(path);
            } catch (error) {
                console.error(`Error processing screenshot ${path}: ${error.message}`);
            }
        }
        
        // Write the data to a result file
        const resultPath = `${screenshotDir}/result.json`;
        fs.writeFileSync(resultPath, JSON.stringify(data));
        
        // Output the marker that the API server will look for
        console.log(`INSTAGRAM_SCREENSHOTS_RESULT:${resultPath}`);
        
    } catch (e) {
        console.error('Screenshot capture failed:', e.message);
        throw e;
    }

    // Log out using direct URL approach
    try {
        console.log('Logging out using direct URL');
        await page.goto('https://www.instagram.com/accounts/logout/');
        await page.waitForTimeout(3000);
    } catch (e) {
        console.log('Logout failed:', e.message);
    }
    
    // Try to clean up the screenshot directory if empty
    try {
        fs.rmdirSync(screenshotDir);
    } catch (e) {
        // It's okay if this fails, it might not be empty
        console.log(`Could not remove screenshot directory: ${e.message}`);
    }
});
