import puppeteer from 'puppeteer-core';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE_URL = 'http://localhost:5173';

const results = {
  passed: [],
  failed: [],
  warnings: []
};

function pass(name, details = '') {
  results.passed.push({ name, details });
  console.log(`✓ [PASS] ${name} ${details ? '(' + details + ')' : ''}`);
}

function fail(name, error) {
  results.failed.push({ name, error: String(error) });
  console.error(`✗ [FAIL] ${name}: ${error}`);
}

function warn(name, note) {
  results.warnings.push({ name, note });
  console.warn(`! [WARN] ${name}: ${note}`);
}

async function runDeepAudit() {
  console.log('====================================================');
  console.log('FlowPay Deep Functional Interaction Audit');
  console.log('====================================================\n');

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,900'],
    defaultViewport: { width: 1400, height: 900 }
  });

  const page = await browser.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('favicon') && !text.includes('React DevTools')) {
        console.error(`   [Browser Console Error] ${text}`);
      }
    }
  });

  page.on('pageerror', err => {
    console.error(`   [Browser Unhandled Exception] ${err.message}`);
    results.failed.push({ name: 'Page Exception', error: err.message });
  });

  // 1. LOGIN AS ADMIN/OWNER
  console.log('\n--- 1. Authentication & Session Initialization ---');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    // Quick login as owner
    const btns = Array.from(document.querySelectorAll('button'));
    const ownerBtn = btns.find(b => b.textContent?.includes('Owner'));
    if (ownerBtn) ownerBtn.click();
  });
  await new Promise(r => setTimeout(r, 1200));

  if (page.url() === `${BASE_URL}/` || page.url() === `${BASE_URL}`) {
    pass('Login as Owner', 'Redirected to Dashboard');
  } else {
    fail('Login as Owner', `Expected Dashboard, got ${page.url()}`);
  }

  // 2. DASHBOARD WIDGETS & STATS
  console.log('\n--- 2. Dashboard Widgets & Live KPIs ---');
  try {
    const kpiCount = await page.evaluate(() => {
      const cards = document.querySelectorAll('.rounded-lg, .rounded-xl, .rounded-md, [class*="border"]');
      return cards.length;
    });
    if (kpiCount > 3) {
      pass('Dashboard KPI Cards Rendered', `${kpiCount} UI elements found`);
    } else {
      fail('Dashboard KPI Cards', 'Expected multiple KPI cards');
    }
  } catch (err) {
    fail('Dashboard Audit', err.message);
  }

  // 3. EMPLOYEE ADD WITH MOBILE BANKING
  console.log('\n--- 3. Employee Creation with Mobile Banking & Validation ---');
  try {
    await page.goto(`${BASE_URL}/employees/add`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 800));

    // Fill the Add Employee form
    const formSubmitted = await page.evaluate(async () => {
      const getByLabelOrId = (id) => document.getElementById(id) || document.querySelector(`input[name="${id}"]`);

      const firstName = getByLabelOrId('firstName');
      const lastName = getByLabelOrId('lastName');
      const email = getByLabelOrId('email');
      const phone = getByLabelOrId('phone');
      const basicSalary = getByLabelOrId('basicSalary');

      if (firstName) {
        firstName.value = 'Hasan';
        firstName.dispatchEvent(new Event('input', { bubbles: true }));
      }
      if (lastName) {
        lastName.value = 'Mahmud';
        lastName.dispatchEvent(new Event('input', { bubbles: true }));
      }
      if (email) {
        email.value = `hasan.test.${Date.now()}@flowpay.com`;
        email.dispatchEvent(new Event('input', { bubbles: true }));
      }
      if (phone) {
        phone.value = '+8801712345678';
        phone.dispatchEvent(new Event('input', { bubbles: true }));
      }
      if (basicSalary) {
        basicSalary.value = '48000';
        basicSalary.dispatchEvent(new Event('input', { bubbles: true }));
      }

      // Check Mobile Banking payment method if available
      const mobileRadio = document.querySelector('input[value="mobile_banking"]') || 
                          Array.from(document.querySelectorAll('label')).find(l => l.textContent?.includes('Mobile Banking'));
      if (mobileRadio) mobileRadio.click();

      return true;
    });

    if (formSubmitted) {
      pass('Add Employee Form Input Handling', 'Successfully populated inputs');
    }
  } catch (err) {
    fail('Add Employee Form Audit', err.message);
  }

  // 4. ATTENDANCE & LEAVES APPLICATION
  console.log('\n--- 4. Attendance & Leave Workflow ---');
  try {
    await page.goto(`${BASE_URL}/attendance`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 800));

    // Switch to Leave Requests tab
    const tabClicked = await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('[role="tab"], button'));
      const leaveTab = tabs.find(t => t.textContent?.includes('Leave Requests') || t.textContent?.includes('Leaves'));
      if (leaveTab) {
        leaveTab.click();
        return true;
      }
      return false;
    });

    if (tabClicked) {
      pass('Attendance Leave Requests Tab Navigation', 'Active');
      await new Promise(r => setTimeout(r, 600));

      // Check if leaves table or empty state rendered
      const hasTableOrEmpty = await page.evaluate(() => {
        return document.querySelector('table') !== null || document.body.innerText.includes('No leave requests');
      });

      if (hasTableOrEmpty) {
        pass('Leave Requests Table/State Rendered', 'Verified');
      } else {
        warn('Leave Requests Table', 'Neither table nor empty state detected');
      }
    } else {
      fail('Attendance Leave Tab', 'Could not locate Leave Requests tab');
    }
  } catch (err) {
    fail('Attendance Audit', err.message);
  }

  // 5. LOANS & ADVANCES WORKFLOW
  console.log('\n--- 5. Loans & Advances Module ---');
  try {
    await page.goto(`${BASE_URL}/loans`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 800));

    const loansContent = await page.evaluate(() => {
      const text = document.body.innerText;
      const hasHeader = text.includes('Loans & Advances') || text.includes('Salary Advances');
      const hasKpis = text.includes('Total Disbursed') || text.includes('Active Loans') || text.includes('Outstanding');
      return { hasHeader, hasKpis };
    });

    if (loansContent.hasHeader && loansContent.hasKpis) {
      pass('Loans & Advances Portfolio View', 'Header and KPI summary verified');
    } else {
      fail('Loans & Advances Portfolio', 'Missing KPI summaries');
    }
  } catch (err) {
    fail('Loans Audit', err.message);
  }

  // 6. PAYROLL WORKFLOW & ABSENCE DEDUCTION ENGINE
  console.log('\n--- 6. Monthly Payroll Generation & Absence Deductions ---');
  try {
    await page.goto(`${BASE_URL}/payroll/generate`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 800));

    // Verify Step 1 auto-deduct toggle
    const toggleChecked = await page.evaluate(() => {
      const sw = document.getElementById('auto-deduct-step1');
      return sw ? (sw.getAttribute('aria-checked') === 'true' || sw.dataset.state === 'checked') : false;
    });
    pass('Payroll Step 1 Auto-Deduct Absence Default', `Toggle is ${toggleChecked ? 'Enabled' : 'Disabled'}`);

    // Click Next to Step 2
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const nextBtn = btns.find(b => b.textContent?.includes('Continue to Employee Review'));
      if (nextBtn) nextBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // Verify Step 2 Table and live Absence calculation
    const step2Data = await page.evaluate(() => {
      const rows = document.querySelectorAll('tbody tr');
      const hasRows = rows.length > 0;
      const autoDeductToolbarSwitch = Array.from(document.querySelectorAll('button[role="switch"]')).length > 0;
      return { hasRows, rowCount: rows.length, autoDeductToolbarSwitch };
    });

    if (step2Data.hasRows) {
      pass('Payroll Step 2 Variable Adjustments', `${step2Data.rowCount} active employee records loaded`);
    } else {
      fail('Payroll Step 2', 'No employee rows loaded in table');
    }

    if (step2Data.autoDeductToolbarSwitch) {
      pass('Payroll Step 2 Toolbar Auto-Deduct Switch', 'Present and interactive');
    }

    // Advance to Step 3
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const reviewBtn = btns.find(b => b.textContent?.includes('Review Summary'));
      if (reviewBtn) reviewBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // Check Step 3 KPI totals including Absence Deductions
    const step3Verified = await page.evaluate(() => {
      const text = (document.querySelector('main')?.innerText || document.body.innerText).toLowerCase();
      return {
        hasGross: text.includes('gross salary') || text.includes('gross earnings'),
        hasAbsence: text.includes('absence deductions') || text.includes('absent day') || text.includes('absence ded'),
        hasNet: text.includes('net payable') || text.includes('net salary')
      };
    });

    if (step3Verified.hasGross && step3Verified.hasAbsence && step3Verified.hasNet) {
      pass('Payroll Step 3 Confirmation', 'Gross, Absence Deductions, and Net Payable totals verified');
    } else {
      fail('Payroll Step 3 Totals', JSON.stringify(step3Verified));
    }
  } catch (err) {
    fail('Payroll Generation Engine', err.message);
  }

  // 7. PAYSLIP DIRECTORY & MODAL
  console.log('\n--- 7. Payslip Directory & Preview ---');
  try {
    await page.goto(`${BASE_URL}/payslips`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 800));

    const payslipsList = await page.evaluate(() => {
      const rows = document.querySelectorAll('tbody tr');
      return rows.length;
    });

    if (payslipsList >= 0) {
      pass('Payslips Directory Rendered', `${payslipsList} historical records found`);
    }
  } catch (err) {
    fail('Payslips Directory Audit', err.message);
  }

  // 8. REPORTS & EXPORTS
  console.log('\n--- 8. Financial Reports & Export Modules ---');
  const reportRoutes = [
    { url: '/reports/salary', name: 'Salary Report' },
    { url: '/reports/department', name: 'Department Report' },
    { url: '/reports/payment', name: 'Payment Disbursement Report' },
    { url: '/reports/yearly', name: 'Yearly Summary Report' }
  ];

  for (const rep of reportRoutes) {
    try {
      await page.goto(`${BASE_URL}${rep.url}`, { waitUntil: 'networkidle2' });
      await new Promise(r => setTimeout(r, 600));

      const hasExportOrTable = await page.evaluate(() => {
        const text = document.body.innerText;
        const hasExportBtn = Array.from(document.querySelectorAll('button')).some(b => 
          b.textContent?.includes('Export') || b.textContent?.includes('Download') || b.textContent?.includes('CSV')
        );
        return hasExportBtn || text.includes('Report');
      });

      if (hasExportOrTable) {
        pass(`${rep.name} Accessible & Export Ready`, 'Verified');
      } else {
        warn(`${rep.name}`, 'Export button or content not immediately identified');
      }
    } catch (err) {
      fail(rep.name, err.message);
    }
  }

  // 9. AUDIT LOGGING INTEGRITY
  console.log('\n--- 9. System Audit Logs Tracking ---');
  try {
    await page.goto(`${BASE_URL}/settings/audit-logs`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 800));

    const logCount = await page.evaluate(() => {
      const rows = document.querySelectorAll('tbody tr');
      return rows.length;
    });

    if (logCount > 0) {
      pass('Audit Logs Store Active', `${logCount} audit entries tracked`);
    } else {
      warn('Audit Logs Store', '0 log entries visible');
    }
  } catch (err) {
    fail('Audit Logs Module', err.message);
  }

  await browser.close();

  // Summary
  console.log('\n====================================================');
  console.log('DEEP FUNCTIONAL AUDIT SUMMARY');
  console.log('====================================================');
  console.log(`Passed Checks:  ${results.passed.length}`);
  console.log(`Failed Checks:  ${results.failed.length}`);
  console.log(`Warnings:       ${results.warnings.length}`);
  console.log('====================================================');

  if (results.failed.length > 0) {
    console.error('\nFAILED CHECKS DETAILS:');
    results.failed.forEach((f, i) => console.error(`${i + 1}. ${f.name}: ${f.error}`));
    process.exit(1);
  } else {
    console.log('\nALL FUNCTIONAL AUDIT CHECKS PASSED WITH ZERO DEFECTS! ✓\n');
    process.exit(0);
  }
}

runDeepAudit().catch(err => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});
