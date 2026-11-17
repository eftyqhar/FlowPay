import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function main() {
  const docsDir = path.resolve('docs');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  console.log('Launching Edge via puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

  // 1. Login Page
  console.log('Navigating to Login...');
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.join(docsDir, '01_login.png') });
  console.log('Captured 01_login.png');

  // Fill credentials
  console.log('Filling credentials...');
  await page.type('#signin-email', 'hrownok5@gmail.com');
  await page.type('#signin-password', 'admin123');
  
  // Click submit
  console.log('Submitting login form...');
  const submitBtn = await page.$('button[type="submit"]');
  if (submitBtn) {
    await submitBtn.click();
  }

  // Wait for login to complete and dashboard to load
  await new Promise(r => setTimeout(r, 4000));

  // 2. Dashboard
  console.log('Capturing Dashboard...');
  await page.screenshot({ path: path.join(docsDir, '02_dashboard.png') });
  console.log('Captured 02_dashboard.png');

  // 3. Employees
  console.log('Navigating to Employees...');
  await page.goto('http://localhost:5173/employees', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(docsDir, '03_employees.png') });
  console.log('Captured 03_employees.png');

  // 4. Attendance
  console.log('Navigating to Attendance...');
  await page.goto('http://localhost:5173/attendance', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(docsDir, '04_attendance.png') });
  console.log('Captured 04_attendance.png');

  // 5. Payroll
  console.log('Navigating to Payroll...');
  await page.goto('http://localhost:5173/payroll', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(docsDir, '05_payroll.png') });
  console.log('Captured 05_payroll.png');

  // 6. Payslips
  console.log('Navigating to Payslips...');
  await page.goto('http://localhost:5173/payslips', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(docsDir, '06_payslips.png') });
  console.log('Captured 06_payslips.png');

  // 7. Loans
  console.log('Navigating to Loans...');
  await page.goto('http://localhost:5173/loans', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(docsDir, '07_loans.png') });
  console.log('Captured 07_loans.png');

  // 8. Reports
  console.log('Navigating to Reports...');
  await page.goto('http://localhost:5173/reports/salary', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(docsDir, '08_reports.png') });
  console.log('Captured 08_reports.png');

  await browser.close();
  console.log('All screenshots captured successfully!');
}

main().catch(err => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});
