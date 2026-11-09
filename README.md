# 💼 FlowPay — Enterprise Salary & Payroll Management System

<p align="center">
  <img src="public/logo.svg" alt="FlowPay Logo" width="80" height="80" />
</p>

<p align="center">
  A modern, high-performance, enterprise-grade company <strong>Salary & Payroll Management Web Application</strong> built for HR teams, accountants, managers, and business owners.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black" alt="React 18" />
  <img src="https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Zustand-4.5-orange" alt="Zustand" />
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License" />
</p>

---

> 📖 **Full System Documentation:** For an exhaustive architectural, mathematical, and operational guide covering every feature and algorithm, check out [DOCUMENTATION.md](DOCUMENTATION.md).

---

## 📸 Dashboard Preview

![FlowPay Dashboard](docs/dashboard.png)

---

## 🌟 Key Modules & Capabilities

### 1. 📊 Financial Overview Dashboard
- **KPI Metrics**: Real-time tracking of Total Employees, Total Monthly Payroll, Disbursed Salary, and Pending Payouts.
- **Visual Analytics**: Interactive salary expenditure trends (monthly bar/line charts) and department-wise cost distribution.
- **Paid vs. Pending Visualization**: Quick glance at payout completion rates.
- **Audit Activity Feed**: Timestamped stream of recent approvals, drafts, and disbursements.
- **Period Filter**: Filter metrics across any month and year.

### 2. 👥 Employee Management
- **Employee Directory**: Searchable, filterable, and paginated table with department and status filters.
- **Full Employee Profiles**: Complete records including collision-free monotonic `EMP-xxx` ID, designation, joining date, contact details, bank/routing information, and employment status.
- **Mobile Financial Services (MFS)**: Dedicated support for **bKash**, **Nagad**, **Rocket**, and **Upay** account numbers and account types.
- **Salary Structure**: Fine-grained tracking of Basic Salary, Allowances, Bonuses, Overtime, Deductions, and Tax withholdings.
- **Department Setup**: Dedicated department management with cost allocation.

### 3. 🕒 Attendance & Leave Management
- **Daily Attendance**: Employee self check-in and check-out with automatic daily hours tracking.
- **Leave Application Workflow**: Casual, Sick, Annual, and Unpaid leave requests with HR approval workflows.
- **Multi-Month Leave Overlap**: Exact date interval overlap algorithm preventing double-deduction across month boundaries.
- **Automated Absent Day Deductions**: Optional automatic wage deduction for unpaid absences based on monthly working days.

### 4. 💳 Loan & Salary Advance Management
- **Dual Facility Support**: Short-term **Salary Advance** (1-3 months recovery) and long-term **Company Personal Loan** (3-36 months recovery).
- **Payroll Deduction Engine**: Automatic installment deductions during monthly payroll disbursement.
- **Repayment Ledger**: Historical ledger tracking every deduction cycle with early settlement support.
- **Duplicate Prevention**: Guard against duplicate pending requests and alerts for active balances.

### 5. 💰 Payroll Management & Processing
- **Automated Calculation Engine**:
  $$\text{Gross Salary} = \text{Basic} + \text{Allowances} + \text{Bonus} + \text{Overtime}$$
  $$\text{Total Deductions} = \text{Deductions} + \text{Tax} + \text{Absent Deduction} + \text{Loan Installment}$$
  $$\text{Net Salary} = \max(0, \text{Gross Salary} - \text{Total Deductions})$$
- **Negative Salary Safeguard**: Strict calculation validation preventing negative net salaries.
- **Batch Processing**: One-click batch approval and disbursement for selected departments or employees.
- **Status Workflow**: Clear transitions from `Draft` $\rightarrow$ `Approved` $\rightarrow$ `Paid`.
- **Payroll History**: Searchable archive of all historical payroll runs with granular detail views.

### 6. 📄 Interactive Payslips & PDF Generation
- **Branded Templates**: Clean, professional printable payslips with company header, employee details, earnings, and deductions.
- **Client-Side PDF Export**: High-fidelity PDF generation via `jsPDF` and `html2canvas` for download or print.
- **Employee Self-Service**: Employees can securely access and download their historical payslips.

### 7. 📈 Financial & Tax Reports
- **Salary Report**: Detailed breakdowns of gross, net, deductions, and tax withholdings.
- **Department Cost Center**: Expense distribution and headcount analysis by organizational unit.
- **Payment Reconciliation**: Breakdown across Bank Transfer, Mobile Banking, Cash, and Checks.
- **Yearly Summary**: Quarterly aggregations and year-over-year expenditure patterns.
- **Export Formats**: One-click exports to **Excel (`.xlsx`)** and **CSV**.

### 8. 🔔 Role-Isolated Notification System
- **Security Boundary**: Strict separation ensuring administrative approval requests never leak into employee self-service accounts.
- **Real-Time Triggers**: Automated notifications dispatched for leave approvals, loan decisions, and salary disbursement events.

### 9. 🔐 Role-Based Access Control (RBAC) & Security
- **Multi-Role Support**: Tailored interfaces and permissions for `Owner`, `Admin`, `Accountant`, `HR`, and `Employee`.
- **1-Click Demo Login**: Switch roles instantly from the login screen for testing and evaluation.
- **Data Persistence**: Robust client-side state persistence via `localStorage` with seed data pre-loaded (~25 employees, 6 months historical payroll).
- **LocalStorage Ring-Buffer**: Bounded 500-entry audit log defending against storage quota exceptions.

---

## 👥 Demo Accounts (Role-Based Access)

FlowPay comes pre-seeded with 5 accounts accessible with **1-click buttons** on the login screen or via credentials:

| Role | Email / Shortcut | Password | Key Permissions |
| :--- | :--- | :--- | :--- |
| **Owner** | `owner@flowpay.com` (or `owner`) | `password123` | Full system access, company settings, and user administration |
| **Admin** | `admin@flowpay.com` (or `admin`) | `password123` | Payroll generation, employee management, reports, and approvals |
| **Accountant** | `accountant@flowpay.com` (or `accountant`) | `password123` | Payment disbursements, tax reports, and salary reconciliations |
| **HR** | `hr@flowpay.com` (or `hr`) | `password123` | Employee lifecycle, allowances, departments, and attendance |
| **Employee** | `employee@flowpay.com` (or `employee`) | `password123` | Personal profile, attendance punch, loan application, and payslips |

---

## 🛠️ Tech Stack & Architecture

- **Framework**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict typing with 0 compiler errors)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with enterprise neutral/indigo theme
- **UI Primitives**: [Radix UI](https://www.radix-ui.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Recharts](https://recharts.org/)
- **Forms & Validation**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) with persistence middleware
- **Reporting & Export**: [XLSX](https://github.com/SheetJS/sheetjs), [jsPDF](https://github.com/parallax/jsPDF), and [html2canvas](https://html2canvas.hertzen.com/)
- **Notifications**: [Sonner](https://sonner.emilkowal.ski/)
- **Deployment**: Zero-config [Vercel](https://vercel.com/) SPA deployment (`vercel.json`)

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (`v18.0.0` or higher recommended)
- `npm` or `pnpm` or `yarn`

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/eftyqhar/FlowPay.git
   cd FlowPay
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open in browser**:
   Navigate to [http://localhost:5173/](http://localhost:5173/) to access the application.

### Production Build

To build the application for production:
```bash
npm run build
```

---

## 📜 Full Documentation
For the complete technical breakdown, algorithmic formulas, data schema, and Vercel hosting instructions, refer to **[DOCUMENTATION.md](DOCUMENTATION.md)**.

## 📜 License
This project is licensed under the MIT License.
