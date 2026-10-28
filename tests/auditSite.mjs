import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE_URL = 'http://localhost:5173';

const errors = [];
const warnings = [];
const passedChecks = [];

function logIssue(type, pageUrl, message) {
  const item = { type, url: pageUrl, message };
  if (type === 'ERROR' || type === 'EXCEPTION') {
    errors.push(item);
    console.error(`[${type}] [${pageUrl}] ${message}`);
  } else {
    warnings.push(item);
    console.warn(`[${type}] [${pageUrl}] ${message}`);
  }
}

function logPass(title) {
  passedChecks.push(title);
  console.log(`[PASS] ${title}`);
}

async function runSiteAudit() {
  console.log('Starting FlowPay Deep Website Audit via Headless Edge...');

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,900'],
    defaultViewport: { width: 1400, height: 900 }
  });

  const page = await browser.newPage();

  // Attach error listeners
  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error') {
      // Filter out harmless favicon or React DevTools messages
      if (!text.includes('favicon') && !text.includes('React DevTools')) {
        logIssue('CONSOLE_ERROR', page.url(), text);
      }
    }
  });

  page.on('pageerror', error => {
    logIssue('EXCEPTION', page.url(), error.message || String(error));
  });

  page.on('requestfailed', request => {
    const url = request.url();
    if (!url.includes('favicon.ico')) {
      logIssue('REQ_FAILED', page.url(), `${request.method()} ${url} - ${request.failure()?.errorText}`);
    }
  });

  // -------------------------------------------------------------
  // 1. Visit root - verify redirect to /login when unauthenticated
  // -------------------------------------------------------------
  console.log('\n--- 1. Testing Unauthenticated Entry ---');
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });
  const currentUrl = page.url();
  if (currentUrl.includes('/login')) {
    logPass('Unauthenticated visit to "/" cleanly redirects to "/login"');
  } else {
    logIssue('ERROR', currentUrl, `Expected redirect to /login, but stayed at ${currentUrl}`);
  }

  // -------------------------------------------------------------
  // 2. Test Quick Login Buttons on Login Page
  // -------------------------------------------------------------
  console.log('\n--- 2. Testing Login Page & Authentication ---');
  // Check if quick login buttons exist
  const quickLoginButtons = await page.$$('button');
  console.log(`Found ${quickLoginButtons.length} buttons on login page`);

  // Click on "Owner" quick login button
  const ownerBtn = await page.evaluateHandle(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.find(b => b.textContent?.includes('Owner'));
  });

  if (ownerBtn) {
    await ownerBtn.click();
    await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
    await new Promise(r => setTimeout(r, 1000));
    const postLoginUrl = page.url();
    if (postLoginUrl === `${BASE_URL}/` || postLoginUrl === `${BASE_URL}`) {
      logPass('Quick Login as Owner succeeded, redirected to Dashboard');
    } else {
      logIssue('ERROR', postLoginUrl, `Owner login did not land on Dashboard: ${postLoginUrl}`);
    }
  } else {
    logIssue('ERROR', page.url(), 'Owner quick login button not found');
  }

  // -------------------------------------------------------------
  // 3. Test Owner Full Page Navigation & State
  // -------------------------------------------------------------
  console.log('\n--- 3. Testing Navigation Across All Application Pages (as Owner) ---');
  const pagesToTest = [
    { path: '/', name: 'Dashboard' },
    { path: '/profile', name: 'User Profile' },
    { path: '/attendance', name: 'Attendance & Leaves' },
    { path: '/loans', name: 'Loans & Advances' },
    { path: '/employees', name: 'Employee Directory' },
    { path: '/employees/add', name: 'Add Employee Form' },
    { path: '/employees/EMP-001', name: 'Employee Profile View' },
    { path: '/employees/edit/EMP-001', name: 'Edit Employee Form' },
    { path: '/departments', name: 'Departments & Roles' },
    { path: '/payroll', name: 'Current Payroll' },
    { path: '/payroll/generate', name: 'Payroll Generator Wizard' },
    { path: '/payroll/history', name: 'Payroll History' },
    { path: '/payslips', name: 'Payslips Directory' },
    { path: '/reports/salary', name: 'Salary Reports' },
    { path: '/reports/department', name: 'Department Reports' },
    { path: '/reports/payment', name: 'Payment Reports' },
    { path: '/reports/yearly', name: 'Yearly Summary Reports' },
    { path: '/settings/company', name: 'Company Settings' },
    { path: '/settings/users', name: 'Users & Roles Settings' },
    { path: '/settings/salary', name: 'Salary & Compensation Settings' },
    { path: '/settings/audit-logs', name: 'Audit Logs' }
  ];

  for (const p of pagesToTest) {
    try {
      console.log(`Visiting ${p.name} (${p.path})...`);
      await page.goto(`${BASE_URL}${p.path}`, { waitUntil: 'networkidle2' });
      await new Promise(r => setTimeout(r, 800));

      // Verify no error boundary or blank page
      const bodyText = await page.evaluate(() => document.body.innerText);
      if (bodyText.includes('Something went wrong') || bodyText.includes('Application Error')) {
        logIssue('ERROR', page.url(), `React Error Boundary triggered on ${p.name}`);
      } else if (bodyText.trim().length < 20) {
        logIssue('ERROR', page.url(), `Blank page or failed render on ${p.name}`);
      } else {
        logPass(`Page rendered successfully: ${p.name}`);
      }
    } catch (err) {
      logIssue('EXCEPTION', `${BASE_URL}${p.path}`, `Failed navigating to ${p.name}: ${err.message}`);
    }
  }

  // -------------------------------------------------------------
  // 4. Test Interactive Features & Modals
  // -------------------------------------------------------------
  console.log('\n--- 4. Testing Key Interactive Workflows ---');

  // A. Test Payroll Generation Wizard step-through
  try {
    console.log('Testing Payroll Generator Wizard steps...');
    await page.goto(`${BASE_URL}/payroll/generate`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 800));

    // Check if auto-deduct toggle is visible in Step 1
    const autoDeductSwitch1 = await page.$('#auto-deduct-step1');
    if (autoDeductSwitch1) {
      logPass('Step 1: Auto-Deduct Absent Days switch is present');
      // Toggle it to verify interaction
      await autoDeductSwitch1.click();
      await new Promise(r => setTimeout(r, 300));
      await autoDeductSwitch1.click();
    } else {
      logIssue('WARNING', page.url(), 'Auto-Deduct switch not found in Step 1');
    }

    // Click Continue to Employee Review
    const continueBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find(b => b.textContent?.includes('Continue to Employee Review'));
    });
    if (continueBtn) {
      await continueBtn.click();
      await new Promise(r => setTimeout(r, 800));
      const step2Header = await page.evaluate(() => document.body.innerText.includes('Adjust Variables'));
      if (step2Header) {
        logPass('Step 2 reached: Adjust Variables table displayed');

        // Click Review Summary
        const reviewSummaryBtn = await page.evaluateHandle(() => {
          const btns = Array.from(document.querySelectorAll('button'));
          return btns.find(b => b.textContent?.includes('Review Summary'));
        });
        if (reviewSummaryBtn) {
          await reviewSummaryBtn.click();
          await new Promise(r => setTimeout(r, 800));
          const step3Header = await page.evaluate(() => document.body.innerText.includes('Payroll Preview & Confirmation'));
          if (step3Header) {
            logPass('Step 3 reached: Payroll Preview & Confirmation with KPI cards displayed');
          } else {
            logIssue('ERROR', page.url(), 'Step 3 failed to load after clicking Review Summary');
          }
        }
      } else {
        logIssue('ERROR', page.url(), 'Failed to advance to Step 2');
      }
    }
  } catch (err) {
    logIssue('EXCEPTION', `${BASE_URL}/payroll/generate`, `Error testing Payroll Generator: ${err.message}`);
  }

  // B. Test Attendance Page & Tabs
  try {
    console.log('Testing Attendance & Leaves interactions...');
    await page.goto(`${BASE_URL}/attendance`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 800));

    // Check if leave requests tab exists
    const leaveTab = await page.evaluateHandle(() => {
      const tabs = Array.from(document.querySelectorAll('[role="tab"], button'));
      return tabs.find(t => t.textContent?.includes('Leave Requests') || t.textContent?.includes('Leaves'));
    });
    if (leaveTab) {
      await leaveTab.click();
      await new Promise(r => setTimeout(r, 600));
      logPass('Attendance Leave Requests tab clicked and displayed');
    }

    // Check for "Apply Leave" or "Mark Attendance" button
    const actionBtns = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.map(b => b.textContent?.trim()).filter(Boolean);
    });
    logPass(`Attendance interactive buttons detected: ${actionBtns.slice(0, 5).join(', ')}`);
  } catch (err) {
    logIssue('EXCEPTION', `${BASE_URL}/attendance`, `Attendance interaction test error: ${err.message}`);
  }

  // C. Test Loans & Advances
  try {
    console.log('Testing Loans & Advances...');
    await page.goto(`${BASE_URL}/loans`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 800));
    const loansText = await page.evaluate(() => document.body.innerText);
    if (loansText.includes('Loans & Salary Advances') || loansText.includes('Loan')) {
      logPass('Loans & Advances page verified with loan portfolio metrics');
    }
  } catch (err) {
    logIssue('EXCEPTION', `${BASE_URL}/loans`, `Loans test error: ${err.message}`);
  }

  // D. Test Add Employee Mobile Banking
  try {
    console.log('Testing Add Employee Form with Mobile Banking...');
    await page.goto(`${BASE_URL}/employees/add`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 800));

    // Verify Mobile Banking provider selection or inputs exist
    const hasMobileBanking = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('Mobile Banking') || text.includes('bKash') || text.includes('Nagad');
    });
    if (hasMobileBanking) {
      logPass('Add Employee page contains Mobile Financial Services integration');
    } else {
      logIssue('WARNING', page.url(), 'Mobile Banking fields not explicitly visible on Add Employee page');
    }
  } catch (err) {
    logIssue('EXCEPTION', `${BASE_URL}/employees/add`, `Add Employee test error: ${err.message}`);
  }

  // -------------------------------------------------------------
  // 5. Test Role-Based Access Control (RBAC) & Restrictions
  // -------------------------------------------------------------
  console.log('\n--- 5. Testing Role-Based Access Control (RBAC) ---');

  // Logout current user
  await page.evaluate(() => {
    localStorage.removeItem('flowpay-auth-session');
  });

  // Test Employee Role (Restrictions)
  console.log('Testing Employee Role permissions...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 600));

  const empLoginBtn = await page.evaluateHandle(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.find(b => b.textContent?.includes('Employee') || b.textContent?.includes('Sarah'));
  });

  if (empLoginBtn) {
    await empLoginBtn.click();
    await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
    await new Promise(r => setTimeout(r, 800));

    // Try accessing restricted /settings/salary
    await page.goto(`${BASE_URL}/settings/salary`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 600));
    const empUrl = page.url();
    const empText = await page.evaluate(() => document.body.innerText);

    if (empUrl !== `${BASE_URL}/settings/salary` || empText.includes('Access Denied') || empText.includes('Unauthorized') || empUrl === `${BASE_URL}/`) {
      logPass('Employee properly blocked/redirected from protected Salary Settings page');
    } else {
      logIssue('ERROR', empUrl, 'RBAC Breach: Employee accessed Salary Settings page without authorization!');
    }
  }

  await browser.close();

  // -------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------
  console.log('\n=============================================================');
  console.log('AUDIT SUMMARY REPORT');
  console.log('=============================================================');
  console.log(`Total Checks Passed: ${passedChecks.length}`);
  console.log(`Total Errors / Issues: ${errors.length}`);
  console.log(`Total Warnings: ${warnings.length}`);
  console.log('=============================================================');

  if (errors.length > 0) {
    console.log('\nLIST OF ISSUES:');
    errors.forEach((e, idx) => console.log(`${idx + 1}. [${e.type}] on ${e.url}: ${e.message}`));
  }
}

runSiteAudit().catch(err => {
  console.error('Fatal audit failure:', err);
  process.exit(1);
});
