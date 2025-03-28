// @ts-check
const { test, expect } = require('@playwright/test');

// Test parameters will be passed from environment variables
test('Instagram automation workflow', async ({ page }) => {
    // Get parameters from environment variables
    const username = process.env.INSTAGRAM_USERNAME;
    const password = process.env.INSTAGRAM_PASSWORD;
    const searchTerm = process.env.SEARCH_TERM;
    const targetUsername = process.env.TARGET_USERNAME;
    const message = process.env.MESSAGE;

    console.log(`Starting Instagram automation for target: ${targetUsername}`);

    // Step 1: Navigate to Instagram
    await page.goto('https://www.instagram.com/', { waitUntil: 'domcontentloaded' });
    console.log('Navigated to Instagram');

    // Take screenshot of initial page
    await page.screenshot({ path: 'initial-page.png' });

    // Wait for the page to fully load
    await page.waitForTimeout(5000);

    // Step 2: Login - with improved handling
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

        // Take screenshot before login
        await page.screenshot({ path: 'before-login.png' });

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
        await page.screenshot({ path: 'after-login.png' });

        // Check if we're on a challenge page
        const challengeExists = await page
            .$$eval('form[id*="challenge"]', (elements) => elements.length > 0)
            .catch(() => false);
        if (challengeExists) {
            console.log('SECURITY CHALLENGE DETECTED - manual intervention required');
            await page.screenshot({ path: 'security-challenge.png' });
            throw new Error('Instagram security challenge detected');
        }
    } catch (e) {
        console.error('Login failed:', e.message);
        await page.screenshot({ path: 'login-error.png' });
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

    // Step 4: Search for user
    try {
        // Try different selectors for search
        const searchButtonSelectors = [
            'a[href="/explore/search/"]',
            '[aria-label="Search"]',
            'a:has-text("Search")',
        ];

        let searchButton = null;
        for (const selector of searchButtonSelectors) {
            try {
                searchButton = await page.$(selector);
                if (searchButton) {
                    console.log(`Found search button with selector: ${selector}`);
                    break;
                }
            } catch (e) {}
        }

        if (!searchButton) {
            throw new Error('Search button not found with any selector');
        }

        await searchButton.click();
        console.log('Clicked search button');
        await page.waitForTimeout(3000);

        // Try to locate the search input
        const searchInputSelectors = [
            'input[placeholder="Search"]',
            '[aria-label="Search input"]',
            'input[type="text"]',
        ];

        let searchInput = null;
        for (const selector of searchInputSelectors) {
            try {
                searchInput = await page.$(selector);
                if (searchInput) {
                    console.log(`Found search input with selector: ${selector}`);
                    break;
                }
            } catch (e) {}
        }

        if (!searchInput) {
            throw new Error('Search input not found with any selector');
        }

        // Clear and type search term
        await searchInput.click({ clickCount: 3 });
        await searchInput.fill(searchTerm);
        await page.keyboard.press('Enter');
        console.log(`Searched for: ${searchTerm}`);

        // Wait for search results
        await page.waitForTimeout(5000);
        await page.screenshot({ path: 'search-results.png' });
    } catch (e) {
        console.error('Search failed:', e.message);
        await page.screenshot({ path: 'search-error.png' });
        throw e;
    }

    // Step 5: Navigate to user profile
    try {
        // Try different strategies to find the user
        const userSelectors = [
            `a[href="/${targetUsername}/"]`,
            `a[href*="/${targetUsername}"]`,
            `a:has-text("${targetUsername}")`,
        ];

        let userLink = null;
        for (const selector of userSelectors) {
            try {
                const links = await page.$$(selector);
                if (links.length > 0) {
                    userLink = links[0];
                    console.log(`Found user link with selector: ${selector}`);
                    break;
                }
            } catch (e) {}
        }

        if (!userLink) {
            // Fall back to clicking the first result
            const firstResult = await page.$('a >> nth=1');
            if (firstResult) {
                userLink = firstResult;
                console.log('Could not find exact match, clicking first result');
            } else {
                throw new Error('No user found in search results');
            }
        }

        await userLink.click();
        console.log('Clicked on user profile');
        await page.waitForTimeout(5000);
        await page.screenshot({ path: 'user-profile.png' });
    } catch (e) {
        console.error('Profile navigation failed:', e.message);
        await page.screenshot({ path: 'profile-error.png' });
        throw e;
    }

    // Step 6: Follow the user (improved version that handles already-following dialog)
    try {
        // First check if there's an "Already Following" or "Following" button
        const alreadyFollowingSelectors = [
            'button:has-text("Following")',
            '[role="button"]:has-text("Following")',
        ];

        let alreadyFollowing = false;
        for (const selector of alreadyFollowingSelectors) {
            try {
                const followingButton = await page.$(selector);
                if (followingButton) {
                    console.log(`Already following this user (found selector: ${selector})`);
                    alreadyFollowing = true;
                    break;
                }
            } catch (e) {}
        }

        // Only try to follow if we're not already following
        if (!alreadyFollowing) {
            // Try to find and click the Follow button
            const followButtonSelectors = [
                'button:has-text("Follow")',
                '[role="button"]:has-text("Follow")',
            ];

            let followButton = null;
            for (const selector of followButtonSelectors) {
                try {
                    followButton = await page.$(selector);
                    if (followButton) {
                        console.log(`Found follow button with selector: ${selector}`);
                        break;
                    }
                } catch (e) {}
            }

            if (followButton) {
                await followButton.click();
                console.log('Clicked follow button');
                await page.waitForTimeout(2000);

                // Handle any confirmation dialogs that may appear
                try {
                    const confirmButtons = [
                        'button:has-text("Confirm")',
                        'button:has-text("OK")',
                        'button:has-text("Yes")',
                    ];

                    for (const selector of confirmButtons) {
                        const confirmButton = await page.$(selector);
                        if (confirmButton) {
                            await confirmButton.click();
                            console.log(`Clicked confirmation button: ${selector}`);
                            await page.waitForTimeout(2000);
                            break;
                        }
                    }
                } catch (e) {
                    console.log('No confirmation dialog found');
                }
            } else {
                console.log('Follow button not found, may already be following');
            }
        }
    } catch (e) {
        console.log('Could not follow user:', e.message);
    }

    // Step 7: Send a message
    try {
        // Find message button
        const messageButtonSelectors = [
            'button:has-text("Message")',
            '[role="button"]:has-text("Message")',
        ];

        let messageButton = null;
        for (const selector of messageButtonSelectors) {
            try {
                messageButton = await page.$(selector);
                if (messageButton) {
                    console.log(`Found message button with selector: ${selector}`);
                    break;
                }
            } catch (e) {}
        }

        if (!messageButton) {
            throw new Error('Message button not found');
        }

        await messageButton.click();
        console.log('Clicked message button');
        await page.waitForTimeout(5000);
        await page.screenshot({ path: 'message-dialog.png' });

        // Find message input
        const messageInputSelectors = [
            'div[contenteditable="true"]',
            'textarea[placeholder="Message"]',
            '[aria-label="Message"]',
        ];

        let messageInput = null;
        for (const selector of messageInputSelectors) {
            try {
                messageInput = await page.$(selector);
                if (messageInput) {
                    console.log(`Found message input with selector: ${selector}`);
                    break;
                }
            } catch (e) {}
        }

        if (!messageInput) {
            throw new Error('Message input not found');
        }

        // Type message
        await messageInput.click();
        await messageInput.fill(message);
        console.log('Entered message');

        // Find send button
        const sendButtonSelectors = [
            'button:has-text("Send")',
            '[role="button"]:has-text("Send")',
        ];

        let sendButton = null;
        for (const selector of sendButtonSelectors) {
            try {
                sendButton = await page.$(selector);
                if (sendButton) {
                    console.log(`Found send button with selector: ${selector}`);
                    break;
                }
            } catch (e) {}
        }

        if (!sendButton) {
            throw new Error('Send button not found');
        }

        await sendButton.click();
        console.log('Clicked send button');
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'message-sent.png' });
    } catch (e) {
        console.error('Message failed:', e.message);
        await page.screenshot({ path: 'message-error.png' });
        throw e;
    }

    // Step 8: Go back home
    try {
        // Find home button
        const homeButtonSelectors = ['a[href="/"]', '[aria-label="Home"]'];

        let homeButton = null;
        for (const selector of homeButtonSelectors) {
            try {
                homeButton = await page.$(selector);
                if (homeButton) {
                    console.log(`Found home button with selector: ${selector}`);
                    break;
                }
            } catch (e) {}
        }

        if (!homeButton) {
            throw new Error('Home button not found');
        }

        await homeButton.click();
        console.log('Clicked home button');
        await page.waitForTimeout(3000);
    } catch (e) {
        console.log('Could not go back to home:', e.message);
    }

    // Step 9: Log out (using the working example)
    try {
        console.log('Attempting to log out...');

        // Click on Settings/More menu
        await page.locator('div').filter({ hasText: /^SettingsMore$/ }).first().click();
        console.log('Clicked on Settings/More menu');
        await page.waitForTimeout(2000);

        // Wait for settings page to appear
        await expect(page.getByText('SettingsSettingsYour')).toBeVisible();
        console.log('Settings page is visible');

        // Click the logout button
        await page.getByRole('button', { name: 'Log out' }).click();
        console.log('Clicked Log out button');
        await page.waitForTimeout(3000);

        // Check for confirmation dialog
        try {
            const confirmButton = page.getByRole('button', { name: 'Log out' });
            if (await confirmButton.isVisible().catch(() => false)) {
                await confirmButton.click();
                console.log('Clicked confirmation Log out button');
                await page.waitForTimeout(2000);
            }
        } catch (confirmError) {
            console.log('No confirmation dialog found');
        }

        console.log('Logged out successfully');
        await page.screenshot({ path: 'logged-out.png' });
    } catch (e) {
        console.error('Logout failed:', e.message);

        // Fallback to direct URL logout if the UI approach fails
        try {
            console.log('Trying direct logout URL as fallback');
            await page.goto('https://www.instagram.com/accounts/logout/');
            await page.waitForTimeout(3000);
            console.log('Used direct logout URL');
            await page.screenshot({ path: 'direct-logout.png' });
        } catch (directError) {
            console.log('Direct logout URL failed:', directError.message);

            try {
                await page.screenshot({ path: 'logout-error.png' });
            } catch (screenshotError) {
                console.log('Could not take error screenshot, page may be closed');
            }
        }
    }
});
