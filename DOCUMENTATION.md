# FlowPay Enterprise — Comprehensive Technical Architecture & System Documentation

FlowPay is an enterprise-grade Payroll, Compensation, and Workforce Management System built with a modern React, TypeScript, and Supabase PostgreSQL architecture. This document provides an exhaustive, function-by-function reference of the system's architecture, data flows, financial calculation engine, state management stores, user interface pages, security model, and technology stack.

---

## Table of Contents

1. [Executive Overview & Business Purpose](#1-executive-overview--business-purpose)
2. [Technology Stack & Dependencies](#2-technology-stack--dependencies)
3. [System Architecture & Core Patterns](#3-system-architecture--core-patterns)
4. [Database Architecture & Schema Specification](#4-database-architecture--schema-specification)
5. [State Management Layer (Zustand Stores)](#5-state-management-layer-zustand-stores)
   - [5.1 `authStore.ts`](#51-authstorets)
   - [5.2 `employeeStore.ts`](#52-employeestorets)
   - [5.3 `attendanceStore.ts`](#53-attendancestorets)
   - [5.4 `payrollStore.ts`](#54-payrollstorets)
   - [5.5 `loanStore.ts`](#55-loanstorets)
   - [5.6 `departmentStore.ts`](#56-departmentstorets)
   - [5.7 `settingsStore.ts`](#57-settingsstorets)
   - [5.8 `notificationStore.ts`](#58-notificationstorets)
   - [5.9 `auditStore.ts`](#59-auditstorets)
6. [Salary & Financial Calculation Engine (`src/lib/salary.ts`)](#6-salary--financial-calculation-engine-srclibsalaryts)
7. [Page-by-Page Functional & Architectural Breakdown](#7-page-by-page-functional--architectural-breakdown)
   - [7.1 Authentication (`LoginPage.tsx`)](#71-authentication-loginpagetsx)
   - [7.2 Executive Dashboard (`DashboardPage.tsx`)](#72-executive-dashboard-dashboardpagetsx)
   - [7.3 Employee Management Module](#73-employee-management-module)
   - [7.4 Attendance & Leave Management (`AttendancePage.tsx`)](#74-attendance--leave-management-attendancepagetsx)
   - [7.5 Payroll Management Module](#75-payroll-management-module)
   - [7.6 Payslip Center (`AllPayslipsPage.tsx`)](#76-payslip-center-allpayslipspagetsx)
   - [7.7 Loans & Salary Advances (`LoansPage.tsx`)](#77-loans--salary-advances-loanspagetsx)
   - [7.8 Analytics & Reporting Modules](#78-analytics--reporting-modules)
   - [7.9 System Settings & Administration](#79-system-settings--administration)
   - [7.10 User Profile (`ProfilePage.tsx`)](#710-user-profile-profilepagetsx)
8. [Role-Based Access Control (RBAC) & Security Architecture](#8-role-based-access-control-rbac--security-architecture)
9. [Utilities, Mappers, and Helper Modules](#9-utilities-mappers-and-helper-modules)
10. [Automated Test Suites & QA Verification](#10-automated-test-suites--qa-verification)
11. [Deployment, Environment & Operational Guide](#11-deployment-environment--operational-guide)

---

## 1. Executive Overview & Business Purpose

FlowPay is engineered to automate and govern the entire payroll and human resource lifecycle for modern enterprises, with native support for Bangladesh labor standards (currency in BDT `৳`, standard 22-day working cycles, overtime rates, and statutory Provident Fund contributions), as well as multi-currency flexibility for international organizations.

### Key Capabilities:
- **Employee Lifecycle Governance**: Onboarding, profile management, granular allowance breakdowns (House Rent, Medical, Transport), banking, and mobile financial services (bKash, Nagad, Rocket).
- **Time & Attendance Tracking**: Daily check-in/out logging with 24-hour precision, automated late check-in detection, early check-out detection, daily absence synthesis, and manual HR audit correction.
- **Leave Application & Approval Workflow**: Multi-tier leave requests (Casual, Sick, Annual, Unpaid), automated balance tracking, and salary deduction synchronization.
- **Salary Advances & Employee Loans**: Flexible disbursement, monthly installment deduction from payroll, early settlement, and deduction reversals.
- **Deterministic Payroll Calculation Engine**: Precision gross and net calculation, overtime pay computation based on daily working hours, absence penalty deduction, festival bonus automation, and tax slab management.
- **Disbursement & Payment Reconciliation**: Batch payroll approval, multi-channel payment disbursement (Bank Transfer, Mobile Banking, Cash, Check), transaction reference logging, and PDF payslip generation.
- **Enterprise Security & Audit**: Fine-grained Role-Based Access Control (RBAC), immutable audit trail logging, and Supabase PostgreSQL Row-Level Security (RLS).
- **Adaptive Responsive Design**: Desktop widescreen layout and a touch-friendly mobile card experience with sliding drawer navigation.

---

## 2. Technology Stack & Dependencies

```mermaid
flowchart TD
    subgraph Frontend_Client ["Frontend Client (React 18 + TypeScript 5)"]
        UI["UI Layer: Tailwind CSS + Radix UI Primitives + Lucide Icons"]
        Router["Routing: React Router DOM v6"]
        State["State Management: Zustand Stores (Optimistic UI)"]
        Charts["Analytics & Charts: Recharts"]
        Export["Document Generation: jsPDF + html2canvas + ExcelJS"]
        Forms["Validation & Forms: React Hook Form + Zod"]
        Toast["Notifications: Sonner Toast Engine"]
    end

    subgraph Backend_Cloud ["Backend as a Service & Database (Supabase)"]
        Auth["Supabase Authentication (JWT & Sessions)"]
        Edge["Supabase Edge Functions (create-user)"]
        Postgres[("PostgreSQL 15 Database (11 Normalized Tables)")]
        RLS["Row-Level Security Policies, Triggers & Atomic RPCs"]
        Storage["Supabase Storage (Employee Documents & Avatars)"]
    end

    UI --> State
    State --> Router
    State <--> |"@supabase/supabase-js"| Backend_Cloud
    Charts --> UI
    Export --> UI
```

### Core Stack Breakdown:

| Category | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Framework** | React | `^18.3.1` | Declarative UI rendering, hooks, component architecture |
| **Language** | TypeScript | `^5.5.0` | Strict static typing, interfaces, and compile-time correctness |
| **Bundler & Tooling** | Vite | `^5.3.2` | Fast HMR dev server and optimized Rollup production bundling |
| **Styling** | Tailwind CSS | `^3.4.4` | Utility-first responsive CSS, custom animations (`tailwindcss-animate`) |
| **UI Primitives** | Radix UI | Latest | Accessible unstyled primitives (Dialog, Select, Tabs, Dropdown) |
| **State Management**| Zustand | `^4.5.4` | Lightweight, scalable decentralized state with zero boilerplate |
| **Database** | PostgreSQL on Supabase | 15.x | 11 relational tables, foreign keys, `CHECK` constraints, triggers, atomic RPCs |
| **Backend & Auth** | Supabase JS & Edge Functions | `^2.119.0` | Client-side PostgreSQL interface, JWT session management, RLS, and Deno Edge Functions |
| **Charts** | Recharts | `^2.12.7` | Responsive SVG area, bar, and pie charts |
| **Excel Export** | ExcelJS (`exceljs`) | `^4.4.0` | Secure client-side `.xlsx` workbook generation + RFC-4180 UTF-8 BOM CSV export |
| **PDF Generation** | jsPDF + html2canvas | `^2.5.2` | DOM rasterization and vector PDF payslip rendering |
| **Icons** | Lucide React | `^0.400.0` | Consistent, accessible iconography |
| **Testing & Linting** | Vitest + ESLint | `^2.1.8` / `^10.15.0` | Automated unit/integration/store test runner (`48/48`) and static code quality checks |

---

## 3. System Architecture & Core Patterns

FlowPay employs a **Client-Side Single-Page Application (SPA)** architecture paired with a **Backend-as-a-Service (BaaS)** persistence layer.

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Admin
    participant UI as React Page Component
    participant Store as Zustand Store
    participant Mapper as DB Mapper (dbMappers.ts)
    participant Supabase as Supabase PostgreSQL

    User->>UI: Action (e.g. Generate Payroll, Clock In, Apply Leave)
    UI->>Store: Invoke Action (e.g. generatePayroll, checkIn)
    Note over Store: 1. Optimistic Update:<br/>Update in-memory state instantly
    Store-->>UI: State updated (UI re-renders immediately)
    Store->>Mapper: Transform CamelCase Model -> Snake_case Row
    Store->>Supabase: Async API Call (insert/update/delete)
    Supabase-->>Store: Response / Confirmation
    opt If Error occurs
        Store->>UI: Display Sonner error toast & rollback if needed
    end
```

### Architectural Tenets:

1. **Optimistic UI with Background Synchronization**:
   Every state modification (e.g., clocking in, approving leaves, updating settings) updates the in-memory Zustand store immediately so the interface feels instantaneous. Simultaneously, a mapped asynchronous query is dispatched to Supabase PostgreSQL.
2. **Data Transfer Object (DTO) Mapper Pattern (`dbMappers.ts`)**:
   PostgreSQL uses standard `snake_case` naming (e.g., `employee_id`, `basic_salary`), while the frontend uses idiomatic TypeScript `camelCase` (e.g., `employeeId`, `basicSalary`). Bidirectional mapper functions ensure clean separation between the database schema and application domain models.
3. **Decentralized Multi-Store Architecture**:
   State is separated by domain boundaries into independent Zustand stores (`authStore`, `employeeStore`, `attendanceStore`, `payrollStore`, `loanStore`, `departmentStore`, `settingsStore`, `notificationStore`, and `auditStore`). Stores interact through exported getter methods (`useStore.getState()`) to avoid circular dependency deadlocks.
4. **Deterministic Calculation Engine**:
   Financial logic is decoupled from UI components and isolated in pure functions inside `src/lib/salary.ts`. This allows 100% test coverage and eliminates double-deduction risks.
5. **Fail-Closed Security & Access Boundaries**:
   If an authenticated user's linked employee profile cannot be verified, self-service portals (Payslips, Attendance, Loans) fail closed with clear warnings instead of exposing unauthorized or incorrect corporate data.

---

## 4. Database Architecture & Schema Specification

FlowPay's database resides in PostgreSQL on Supabase (`aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`) under the `public` schema.

```mermaid
erDiagram
    USERS ||--o| EMPLOYEES : "links to employee_id"
    DEPARTMENTS ||--o{ EMPLOYEES : "categorizes"
    EMPLOYEES ||--o{ ATTENDANCE_RECORDS : "punches"
    EMPLOYEES ||--o{ LEAVE_REQUESTS : "submits"
    EMPLOYEES ||--o{ LOANS : "applies"
    LOANS ||--o{ LOAN_REPAYMENTS : "tracks"
    EMPLOYEES ||--o{ PAYROLL_RECORDS : "receives"
    USERS ||--o{ AUDIT_LOGS : "performed_by"
    USERS ||--o{ NOTIFICATIONS : "targeted_to"
```

### 4.1 Schema Tables Reference (11 PostgreSQL Tables)

#### 1. `public.users`
Stores user authentication profiles, application roles, and employee linkage.
- `id` (TEXT, PK): Matches Supabase Auth `auth.users.id`.
- `name` (TEXT, NOT NULL): User display name.
- `email` (TEXT, NOT NULL, UNIQUE): Corporate or personal email.
- `role` (TEXT, NOT NULL, DEFAULT `'employee'`): User role (`'owner'`, `'admin'`, `'accountant'`, `'hr'`, `'employee'`).
- `avatar` (TEXT): Base64 encoded or Supabase storage URL.
- `is_active` (BOOLEAN, DEFAULT `true`): Account status flag.
- `employee_id` (TEXT): Display ID (e.g., `EMP-001`) linking to `public.employees`.
- `created_at` (TIMESTAMPTZ, DEFAULT `now()`).

#### 2. `public.employees`
Master employee record holding profile, organizational placement, and salary structure.
- `id` (TEXT, PK): UUID format.
- `employee_id` (TEXT, NOT NULL, UNIQUE): Display identifier (e.g. `EMP-001`).
- `full_name` (TEXT, NOT NULL).
- `email` (TEXT, NOT NULL).
- `phone` (TEXT).
- `photo` (TEXT): Avatar image data or URL.
- `department` (TEXT, NOT NULL): Assigned department name.
- `designation` (TEXT, NOT NULL): Job title.
- `joining_date` (TEXT, NOT NULL): ISO date (`YYYY-MM-DD`).
- `basic_salary` (NUMERIC, NOT NULL, DEFAULT 0): Base monthly pay in BDT.
- `allowances` (NUMERIC, NOT NULL, DEFAULT 0): Aggregate total allowances.
- `house_rent_allowance` (NUMERIC, DEFAULT 0): Specific house rent component.
- `medical_allowance` (NUMERIC, DEFAULT 0): Specific medical component.
- `transport_allowance` (NUMERIC, DEFAULT 0): Specific conveyance component.
- `bonus` (NUMERIC, NOT NULL, DEFAULT 0): Standard recurring bonus.
- `overtime` (NUMERIC, NOT NULL, DEFAULT 0): Fixed or default overtime.
- `deductions` (NUMERIC, NOT NULL, DEFAULT 0): Recurring standard deductions.
- `tax` (NUMERIC, NOT NULL, DEFAULT 0): Monthly withholding tax.
- `bank_info` (JSONB): `{ bankName, accountNumber, routingNumber, accountType }`.
- `payment_method` (TEXT): `'bank_transfer'`, `'mobile_banking'`, `'cash'`, `'check'`.
- `mobile_banking_info` (JSONB): `{ provider, accountNumber, accountType }`.
- `status` (TEXT, NOT NULL, DEFAULT `'active'`): `'active'` | `'inactive'`.
- `pf_eligible` (BOOLEAN, DEFAULT `true`): Provident fund eligibility.
- `leave_balance` (JSONB): `{"casual": 10, "sick": 14, "annual": 15}`.
- `emergency_contact` (JSONB): `{ name, relation, phone }`.
- `documents` (JSONB): `[ { id, name, type, uploadDate, size, url } ]`.
- `created_at`, `updated_at` (TIMESTAMPTZ).

#### 3. `public.attendance_records`
Daily employee attendance and punch timestamps.
- `id` (TEXT, PK).
- `employee_id` (TEXT, NOT NULL).
- `employee_name` (TEXT, NOT NULL).
- `date` (TEXT, NOT NULL): Format `YYYY-MM-DD`.
- `check_in` (TEXT): 24-hour military timestamp (`HH:mm`).
- `check_out` (TEXT): 24-hour military timestamp (`HH:mm`).
- `status` (TEXT, NOT NULL): `'present'`, `'absent'`, `'late'`, `'early_checkout'`, `'half_day'`, `'on_leave'`.
- `late_check_in` (BOOLEAN, DEFAULT `false`): Flags arrival after 09:15 AM.
- `early_check_out` (BOOLEAN, DEFAULT `false`): Flags departure before 17:00 (5:00 PM).
- `manual_correction` (BOOLEAN, DEFAULT `false`): Flags HR/Admin overrides.
- `corrected_by` (TEXT): Name of user who made the manual adjustment.
- `notes` (TEXT): Audit explanation or punch notes.
- *Constraint*: `uq_attendance_emp_date` (`UNIQUE(employee_id, date)`).

#### 4. `public.leave_requests`
Employee leave applications and management approvals.
- `id` (TEXT, PK).
- `employee_id` (TEXT, NOT NULL).
- `employee_name` (TEXT, NOT NULL).
- `department` (TEXT).
- `leave_type` (TEXT, NOT NULL): `'casual'`, `'sick'`, `'annual'`, `'unpaid'`.
- `start_date` (TEXT, NOT NULL): Start date (`YYYY-MM-DD`).
- `end_date` (TEXT, NOT NULL): End date (`YYYY-MM-DD`).
- `days_count` (INTEGER, NOT NULL): Total business days.
- `reason` (TEXT, NOT NULL): Employee explanation.
- `status` (TEXT, NOT NULL, DEFAULT `'pending'`): `'pending'`, `'approved'`, `'rejected'`.
- `applied_at` (TIMESTAMPTZ, DEFAULT `now()`).
- `approved_by` (TEXT).
- `approved_at` (TIMESTAMPTZ).
- `rejection_reason` (TEXT).

#### 5. `public.loans`
Employee personal loans and salary advance accounts.
- `id` (TEXT, PK).
- `employee_id` (TEXT, NOT NULL).
- `employee_name` (TEXT, NOT NULL).
- `department` (TEXT).
- `type` (TEXT, NOT NULL, DEFAULT `'loan'`): `'loan'` | `'advance'`.
- `principal_amount` (NUMERIC, NOT NULL): Total borrowed amount.
- `monthly_installment` (NUMERIC, NOT NULL): Monthly recovery amount.
- `remaining_balance` (NUMERIC, NOT NULL): Current unrecovered balance.
- `term_months` (INTEGER, NOT NULL): Total repayment term in months.
- `reason` (TEXT).
- `status` (TEXT, NOT NULL, DEFAULT `'pending'`): `'pending'`, `'approved'`, `'rejected'`, `'active'`, `'completed'`.
- `applied_at`, `approved_at` (TIMESTAMPTZ).
- `approved_by` (TEXT).
- `repayments` (JSONB, DEFAULT `'[]'`): Legacy mirror; canonical repayment entries live in `public.loan_repayments`.

#### 5a. `public.loan_repayments`
Normalized child ledger tracking every payroll installment deduction and early settlement against a loan.
- `id` (TEXT, PK).
- `loan_id` (TEXT, NOT NULL, FK -> `public.loans(id) ON DELETE CASCADE`).
- `payroll_record_id` (TEXT): Linked payroll disbursement ID.
- `amount` (NUMERIC, NOT NULL, CHECK `amount >= 0`).
- `month` (INTEGER): Deduction month.
- `year` (INTEGER): Deduction year.
- `date` (TIMESTAMPTZ, DEFAULT `now()`).
- *Constraint*: `uq_loan_repayments_loan_month_year` (`UNIQUE(loan_id, month, year) WHERE month IS NOT NULL AND year IS NOT NULL`).

#### 6. `public.payroll_records`
Computed monthly salary records for employees.
- `id` (TEXT, PK).
- `employee_id` (TEXT, NOT NULL).
- `employee_name` (TEXT, NOT NULL).
- `department` (TEXT, NOT NULL).
- `designation` (TEXT, NOT NULL).
- `month` (INTEGER, NOT NULL): Month (1-12).
- `year` (INTEGER, NOT NULL): Year (e.g. 2026).
- `basic_salary` (NUMERIC, NOT NULL).
- `allowances` (NUMERIC, NOT NULL, DEFAULT 0).
- `bonus` (NUMERIC, NOT NULL, DEFAULT 0).
- `overtime` (NUMERIC, NOT NULL, DEFAULT 0).
- `gross_salary` (NUMERIC, NOT NULL): `Basic + Allowances + Bonus + Overtime`.
- `deductions` (NUMERIC, NOT NULL, DEFAULT 0): Standard recurring deductions.
- `tax` (NUMERIC, NOT NULL, DEFAULT 0).
- `unpaid_leave_days` (INTEGER, DEFAULT 0).
- `leave_deduction` (NUMERIC, DEFAULT 0).
- `absent_days` (INTEGER, DEFAULT 0).
- `absence_deduction` (NUMERIC, DEFAULT 0).
- `loan_deduction` (NUMERIC, DEFAULT 0).
- `pf_employee_deduction` (NUMERIC, DEFAULT 0).
- `pf_employer_contribution` (NUMERIC, DEFAULT 0).
- `total_deductions` (NUMERIC, NOT NULL).
- `net_salary` (NUMERIC, NOT NULL): `Gross - Total Deductions` (floored at 0).
- `status` (TEXT, NOT NULL, DEFAULT `'draft'`): `'draft'`, `'approved'`, `'paid'`.
- `payment_method` (TEXT): Payment disbursement mode.
- `payment_date` (TEXT): Date payment was completed (`YYYY-MM-DD`).
- `transaction_ref` (TEXT): Unique bank/MFS reference number.
- `created_by`, `approved_by`, `paid_by` (TEXT).
- `created_at`, `approved_at`, `paid_at` (TIMESTAMPTZ).
- `breakdown` (JSONB): `{ houseRent, medical, transport, otherAllowances }`.
- *Constraint*: `uq_payroll_emp_month_year` (`UNIQUE(employee_id, month, year)`).

#### 7. `public.departments`
Organizational departments.
- `id` (TEXT, PK).
- `name` (TEXT, NOT NULL, UNIQUE).
- `head` (TEXT): Department Manager Name.
- `head_id` (TEXT): Department Manager Employee ID.
- `description` (TEXT).

#### 8. `public.company_settings`
Global company profile and compensation rules.
- `id` (TEXT, PK, DEFAULT `'default'`).
- `name` (TEXT, DEFAULT `'FlowPay Inc.'`).
- `currency` (TEXT, DEFAULT `'BDT'`).
- `currency_symbol` (TEXT, DEFAULT `'৳'`).
- `standard_working_days` (INTEGER, DEFAULT 22).
- `overtime_multiplier` (NUMERIC, DEFAULT 1.5).
- `auto_deduct_absence_days` (BOOLEAN, DEFAULT true).
- `rules_config` (JSONB): Holds nested configuration:
  - `dailyWorkingHours` (default 8)
  - `weeklyHoliday` (`'friday'`, `'friday_saturday'`)
  - `halfDayDeduction` (boolean)
  - `lateDeductionRules` (`{ enabled, graceMinutes, lateDaysThreshold, deductionDays }`)
  - `festivalBonusConfig` (`{ enabled, type, value, frequencyPerYear }`)
  - `salaryAdvanceEnabled`, `loanDeductionEnabled` (boolean)
  - `salaryRoundingDecimals` (integer)

#### 9. `public.notifications`
Role-targeted and user-targeted notifications.
- `id` (TEXT, PK).
- `title` (TEXT, NOT NULL).
- `message` (TEXT, NOT NULL).
- `type` (TEXT, NOT NULL): `'info'`, `'success'`, `'warning'`, `'alert'`.
- `is_read` (BOOLEAN, DEFAULT `false`).
- `link` (TEXT): Optional navigation route.
- `target_roles` (TEXT[]): Array of roles permitted to view (e.g. `['admin', 'owner', 'hr']`).
- `target_user_id` (TEXT): Direct user recipient.
- `target_employee_id` (TEXT): Direct employee recipient.

#### 10. `public.audit_logs`
Immutable compliance and audit trail.
- `id` (TEXT, PK).
- `user_id` (TEXT, NOT NULL).
- `user_name` (TEXT, NOT NULL).
- `action` (TEXT, NOT NULL): e.g., `"Approve Payroll"`, `"Correct Attendance"`.
- `module` (TEXT, NOT NULL): e.g., `"Payroll"`, `"Attendance"`, `"Employees"`.
- `details` (TEXT, NOT NULL): Detailed context of what changed.
- `created_at` (TIMESTAMPTZ, DEFAULT `now()`).

---

## 5. State Management Layer (Zustand Stores)

FlowPay isolates application state into 9 specialized stores inside `src/stores/`. Below is a comprehensive reference of all stores and their functions.

```mermaid
flowchart LR
    subgraph Stores ["Zustand Store Ecosystem"]
        authStore["authStore<br/>(User & Session)"]
        employeeStore["employeeStore<br/>(Employees & Docs)"]
        attendanceStore["attendanceStore<br/>(Punches & Leaves)"]
        payrollStore["payrollStore<br/>(Payroll & History)"]
        loanStore["loanStore<br/>(Loans & Repayments)"]
        departmentStore["departmentStore<br/>(Org Units)"]
        settingsStore["settingsStore<br/>(Company Rules)"]
        notificationStore["notificationStore<br/>(Alerts & Queue)"]
        auditStore["auditStore<br/>(Security Trail)"]
    end
```

---

### 5.1 `authStore.ts`

Manages session authentication, user accounts, and self-registration policies.

| Function | Signature | Description & Behavior |
| :--- | :--- | :--- |
| `initAuth` | `() => Promise<void>` | Initializes session on app startup via `supabase.auth.getSession()`. Resolves linked `employee_id`, bootstraps missing profile in `public.users`, and registers `onAuthStateChange` listener. |
| `login` | `(email, password) => Promise<{ success, message }>` | Authenticates credentials with Supabase Auth. Queries `public.users` to load the profile and linked `employeeId`. |
| `signup` | `(email, password, name, role?) => Promise<{ success, message }>` | Registers a new account. Queries `is_first_user()` RPC to bootstrap the initial account as `'owner'`, while `enforce_signup_role_security` DB trigger locks all subsequent public signups to `'employee'` and auto-links employee profile. |
| `logout` | `() => Promise<void>` | Destroys Supabase session, resets `currentUser` and `isAuthenticated` to `false`. |
| `fetchUsers` | `() => Promise<void>` | Retrieves all user records from `public.users` ordered by creation date. |
| `addUser` | `(user, password?) => Promise<void>` | Owner/Admin function that invokes the `create-user` Supabase Edge Function (server-side `service_role` Admin API) so user creation preserves the admin's active session. |
| `updateUser` | `(id, updates) => Promise<void>` | Updates user properties (name, role, status, employeeId) in state and `public.users`. |
| `deleteUser` | `(id) => Promise<void>` | Removes user from state and deletes row from `public.users`. |
| `toggleUserStatus` | `(id) => Promise<void>` | Inverts `isActive` status (activates/deactivates access). |
| `updateProfile` | `(updates) => Promise<void>` | Updates `currentUser` profile details and avatar image data URL. |
| `changePassword` | `(userId, curPass, newPass?) => Promise<{ success, message }>` | Updates password via `supabase.auth.updateUser({ password })`. |
| `getUsersByRole` | `(role) => User[]` | Returns all users matching a specified role. |

---

### 5.2 `employeeStore.ts`

Manages employee records, document attachments, and leave balance deductions.

| Function | Signature | Description & Behavior |
| :--- | :--- | :--- |
| `fetchEmployees` | `() => Promise<void>` | Fetches all employees from `public.employees` and maps to `Employee[]`. |
| `addEmployee` | `(employeeData) => Employee` | Generates next sequential employee display ID (e.g. `EMP-005`), initializes leave balances, updates state optimistically, and inserts into Supabase. |
| `updateEmployee` | `(id, updates) => void` | Updates employee profile and compensation in state and syncs to Supabase. |
| `deleteEmployee` | `(id) => void` | Removes employee record from state and Supabase table. |
| `toggleEmployeeStatus` | `(id) => void` | Toggles status between `'active'` and `'inactive'`. |
| `addDocument` | `(employeeId, doc) => void` | Appends uploaded document metadata (`name`, `size`, `type`, `url`) to employee's `documents` array. |
| `deleteDocument` | `(employeeId, docId) => void` | Removes a document from the employee's document collection. |
| `deductLeaveBalance` | `(employeeId, leaveType, days) => void` | Decrements available casual, sick, or annual leave balance upon leave approval. |
| `updateDepartmentName` | `(oldName, newName) => void` | Cascades department name renames across all assigned employees. |
| `getEmployeeById` | `(id) => Employee \| undefined` | Lookups an employee by UUID or display ID. |
| `getActiveEmployees` | `() => Employee[]` | Returns all employees where `status === 'active'`. |
| `searchEmployees` | `(query) => Employee[]` | Searches employees across name, ID, and department (case-insensitive). |
| `getNextEmployeeId` | `() => string` | Computes the next display ID in sequence (`EMP-001`, `EMP-002`, etc.). |

---

### 5.3 `attendanceStore.ts`

Coordinates check-in/out timestamps, 24h military time detection, late arrivals, early departures, and leave applications.

| Function | Signature | Description & Behavior |
| :--- | :--- | :--- |
| `fetchAttendanceAndLeaves` | `() => Promise<void>` | Fetches all attendance records and leave applications from Supabase. |
| `recordAttendance` | `(record) => void` | Inserts or updates an attendance record; upserts to `public.attendance_records`. |
| `bulkRecordAttendance` | `(records) => void` | Deduplicates and batch upserts multiple records to Supabase. |
| `correctAttendance` | `(id, updates, correctedBy) => void` | Sets `manualCorrection: true`, records `correctedBy`, and updates attendance in Supabase. |
| `checkIn` | `(employeeId, employeeName) => void` | Formats current time in 24h (`HH:mm`). Detects late arrival: if check-in > 09:15 AM (09:00 + 15m grace), flags `status: 'late'` and `lateCheckIn: true`. |
| `checkOut` | `(employeeId) => void` | Formats current time in 24h (`HH:mm`). Detects early departure: if check-out < 17:00 (5:00 PM), flags `earlyCheckOut: true` and updates status to `'early_checkout'`. |
| `applyLeave` | `(leave) => void` | Creates a new leave application with `status: 'pending'` and syncs to Supabase. |
| `approveLeave` | `(id, approvedBy) => void` | Approves leave, stamps `approvedBy` and `approvedAt`, and calls `employeeStore.deductLeaveBalance` if paid. |
| `rejectLeave` | `(id, reason, rejectedBy) => void` | Rejects leave with documented rejection reason and logs to Supabase. |
| `getAttendanceByDate` | `(date) => AttendanceRecord[]` | Filters records matching a specific date (`YYYY-MM-DD`). |
| `getMonthlyEmployeeSummary` | `(employeeId, month, year) => Summary` | Aggregates monthly totals: present days, absent days, late days, early checkouts, half-days, approved leaves, unpaid leave days, and overtime hours (computed from total daily hours exceeding 8h). |

---

### 5.4 `payrollStore.ts`

Controls payroll generation wizards, batch approvals, salary disbursements, and analytical trends.

| Function | Signature | Description & Behavior |
| :--- | :--- | :--- |
| `fetchPayroll` | `() => Promise<void>` | Retrieves all payroll records from `public.payroll_records` ordered by year/month. |
| `generatePayroll` | `(month, year, employees, createdBy, replaceExisting?) => PayrollRecord[]` | Runs `calculateFullSalary` across all eligible employees, creates draft records, purges old drafts for the period, and syncs new drafts to Supabase. |
| `approvePayroll` | `(ids, approvedBy) => void` | Batch updates draft records to `'approved'`, updates Supabase via `.in('id', ids)`, and dispatches notifications to employees. |
| `markAsPaid` | `(ids, paidBy, paymentMethod, transactionRef?) => void` | Executes `disburse_payroll_batch` atomic PostgreSQL RPC (`FOR UPDATE` row locks) to mark approved records `'paid'`, insert normalized `loan_repayments`, decrement loan balances, auto-complete settled loans, and rollback client state on failure. |
| `updatePayrollRecord` | `(id, updates) => void` | Updates specific payroll adjustments (e.g., custom bonus or deduction) and recalculates totals. |
| `deletePayrollRecord` | `(id) => void` | Deletes a draft payroll record from state and Supabase. |
| `getPayrollByMonth` | `(month, year) => PayrollRecord[]` | Filters payroll records for a given month and year. |
| `getMonthlyStats` | `(month, year) => Stats` | Aggregates financial totals: `total`, `paid`, `pending`, and `draft` amounts. |
| `getSalaryTrends` | `(months) => SalaryTrend[]` | Computes historical gross and net disbursement trends for charts. |
| `getDepartmentSalary` | `(month, year) => DepartmentSalary[]` | Aggregates payroll disbursement by department. |

---

### 5.5 `loanStore.ts`

Governs personal loans, salary advances, automated monthly recoveries, and early settlements.

| Function | Signature | Description & Behavior |
| :--- | :--- | :--- |
| `fetchLoans` | `() => Promise<void>` | Loads loan accounts and repayment schedules from `public.loans`. |
| `applyLoan` | `(loanData) => LoanRecord` | Registers a loan/advance application with `status: 'pending'` and `remainingBalance = principalAmount`. |
| `approveLoan` | `(id, approvedBy) => void` | Approves a loan, activating repayment deduction from future payroll cycles. |
| `rejectLoan` | `(id) => void` | Sets loan status to `'rejected'`. |
| `recordInstallmentDeduction` | `(empId, month, year, payrollId, amount?) => number` | Deducts monthly installment from active loan's `remainingBalance`, appends repayment entry, and marks loan `'completed'` when balance reaches 0. |
| `reverseInstallmentDeduction` | `(empId, month, year, payrollId) => void` | Reverses an installment deduction if a paid payroll record is voided or audited. Restores remaining balance. |
| `settleEarly` | `(id) => void` | Allows early manual payoff of remaining balance, setting status to `'completed'`. |
| `getActiveLoan` | `(employeeId) => LoanRecord \| undefined` | Retrieves the active loan for an employee that is in repayment. |

---

### 5.6 `departmentStore.ts`

Manages enterprise departments and leadership assignments.
- `fetchDepartments()`: Loads departments or seeds standard departments (`Engineering`, `HR`, `Finance`, `Marketing`, `Sales`, `Operations`).
- `addDepartment(dept)`: Inserts a new department.
- `updateDepartment(id, updates)`: Modifies department name, head of department, or description.
- `deleteDepartment(id)`: Removes department record.

---

### 5.7 `settingsStore.ts`

Manages company parameters and compensation policy rules.
- `fetchSettings()`: Loads singleton row from `public.company_settings`.
- `updateSettings(partial)`: Modifies settings (working days, overtime multiplier, late penalty rules, festival bonuses) and syncs to Supabase.
- `resetSettings()`: Restores `DEFAULT_COMPANY_SETTINGS`.

---

### 5.8 `notificationStore.ts`

Role-based and user-targeted notification bus.
- `addNotification(item)`: Emits notification with target roles (e.g. `['admin', 'hr']`) or target employee ID.
- `markAsRead(id)`: Marks notification as read.
- `markAllAsRead(user, employeeId)`: Marks all relevant notifications for a specific user as read.
- `getUserNotifications(user, employeeId)`: Filters notifications matching the current user's role, user ID, or employee ID.
- `getUnreadCount(user, employeeId)`: Returns unread badge count.

---

### 5.9 `auditStore.ts`

Immutable system-wide compliance logging.
- `addLog(entryData)`: Inserts audit event (user ID, user name, action, module, details) into memory and `public.audit_logs`.
- `getLogsByModule(module)`: Filters audit logs by functional module.
- `clearLogs()`: Clears audit log table (restricted to Owner).

---

## 6. Salary & Financial Calculation Engine (`src/lib/salary.ts`)

FlowPay houses its financial formulas in pure, deterministic TypeScript functions.

```mermaid
flowchart TD
    Basic["Basic Salary"]
    Allowances["Allowances (House Rent + Medical + Transport)"]
    Bonus["Bonus (Standard or Festival)"]
    Overtime["Overtime Pay (Hours * Hourly Rate * 1.5)"]

    Gross["Gross Salary = Basic + Allowances + Bonus + Overtime"]

    Basic --> Gross
    Allowances --> Gross
    Bonus --> Gross
    Overtime --> Gross

    subgraph Deductions ["Total Deductions"]
        Tax["Withholding Tax (0% default)"]
        LeaveDed["Unpaid Leave Deduction"]
        AbsenceDed["Absence Deduction"]
        HalfDayDed["Half-Day Deduction"]
        LateDed["Late Arrival Penalties"]
        PF["Provident Fund (Employee Share)"]
        Loan["Loan Installment Deduction"]
        OtherDed["Other Standard Deductions"]
    end

    Gross --> Net["Net Salary = max(0, Gross - Total Deductions)"]
    Deductions --> Net
```

### Detailed Mathematical Formulas:

#### 1. Currency Rounding:
$$\text{roundCurrency}(x) = \frac{\lfloor (x + \epsilon) \cdot 100 + 0.5 \rfloor}{100}$$

#### 2. Gross Salary:
$$\text{Gross} = \text{Basic} + \text{Allowances} + \text{Bonus} + \text{Overtime}$$

#### 3. Hourly Overtime Pay:
$$\text{Hourly Rate} = \frac{\text{Basic Salary}}{\text{Standard Working Days} \times \text{Daily Working Hours}}$$
$$\text{Overtime Pay} = \text{Overtime Hours} \times \text{Hourly Rate} \times \text{Overtime Multiplier}$$

#### 4. Unpaid Leave & Absence Deductions:
$$\text{Daily Rate} = \frac{\text{Basic Salary}}{\text{Standard Working Days}}$$
$$\text{Unpaid Leave Deduction} = \text{Unpaid Days} \times \text{Daily Rate}$$
$$\text{Absence Deduction} = \text{Absent Days} \times \text{Daily Rate}$$
$$\text{Half-Day Deduction} = \text{Half Days} \times 0.5 \times \text{Daily Rate}$$

#### 5. Late Arrival Threshold Deduction:
$$\text{Penalty Units} = \lfloor \frac{\text{Late Days}}{\text{Threshold}} \rfloor$$
$$\text{Late Deduction} = \text{Penalty Units} \times \text{Deduction Days} \times \text{Daily Rate}$$

#### 6. Provident Fund (PF):
$$\text{Employee PF} = \frac{\text{Basic Salary} \times \text{PF Employee}\%}{100}$$
$$\text{Employer PF} = \frac{\text{Basic Salary} \times \text{PF Employer}\%}{100}$$

#### 7. Net Salary Floor Safeguard:
$$\text{Total Deductions} = \text{Tax} + \text{Leave/Absence Deductions} + \text{Loan Installment} + \text{Employee PF} + \text{Other Deductions}$$
$$\text{Net Salary} = \max(0, \text{Gross} - \text{Total Deductions})$$

---

## 7. Page-by-Page Functional & Architectural Breakdown

### 7.1 Authentication (`LoginPage.tsx`)
- **Route**: `/login`
- **Access**: Public
- **Features**: Dual-mode Sign In / Sign Up tabbed view with corporate credential persistence, password visibility toggles, and fail-closed Supabase session handling.
- **Security Rule**: Enforces first-user Super Admin ('owner') bootstrap via `is_first_user()` RPC and `enforce_signup_role_security` PostgreSQL trigger; all subsequent public signups are forced to `'employee'`.

---

### 7.2 Executive Dashboard (`DashboardPage.tsx`)
- **Route**: `/`
- **Access**: All Authenticated Roles (Adaptive content by role)
- **Features**:
  - Executive KPI Cards: Total Active Employees, Monthly Payroll Budget, Disbursed Amount, Pending Actions, and **Total Provident Fund (PF) Reserve** (Employee share + Employer match + Combined Fund across paid payroll runs).
  - Role-specific view: Employees see their linked personal payslip summary, year-to-date earnings, **My Total Provident Fund (PF)** breakdown (personal contribution, employer match, and contribution months via `calculateProvidentFundSummary`), and leave balances; Admins see company-wide metrics.
  - Interactive Charts: Monthly payroll expense trend (Area Chart) and Departmental budget allocation (Bar Chart).
  - Quick Action Queue: Pending leave applications and loan requests with 1-click review shortcuts.
  - Real-time Attendance Summary: Today's present, late, on-leave, and absent counts.

---

### 7.3 Employee Management Module

#### `AllEmployeesPage.tsx` (`/employees`)
- **Access**: Owner, Admin, HR, Accountant
- **Features**: Search bar, department filter, active/inactive status filter. Multi-format export to CSV, Excel (`.xlsx`), and printable directory. Renders responsive employee cards and directory table.

#### `AddEmployeePage.tsx` (`/employees/add`)
- **Access**: Owner, Admin, HR
- **Features**: Multi-section onboarding form:
  1. *Personal Details*: Full name, email, phone, profile photo picker with client-side canvas compression.
  2. *Employment Details*: Department, designation, joining date, initial leave balances.
  3. *Salary & Allowances Structure*: Basic salary input with real-time computation of House Rent (50%), Medical (30%), Transport (20%), and custom allowance override.
  4. *Banking & MFS*: Bank name, account number, routing number, bKash/Nagad mobile banking details.
  5. *Emergency Contact & Documents*: Contact person and document attachment.

#### `EditEmployeePage.tsx` (`/employees/:id/edit`)
- **Access**: Owner, Admin, HR
- **Features**: Pre-populates all existing data, handles allowance recalculations, and updates PostgreSQL records.

#### `EmployeeProfilePage.tsx` (`/employees/:id`)
- **Access**: All Roles (Employees can only view their own profile; Owner/Admin/HR can view all)
- **Features**: 5 tabbed sections:
  1. *Profile Overview*: Personal details, department, designation, emergency contacts, quick actions.
  2. *Salary Breakdown*: Card showing Basic, House Rent, Medical, Transport, Total Gross, and PF status.
  3. *Attendance History*: Monthly ledger of all check-in/out records for this employee.
  4. *Payslips History*: Chronological list of issued payslips with PDF preview and download.
  5. *Loans & Advances*: Active and completed loans with repayment schedules.
  6. *Document Vault*: Upload files (National ID, CV, Certificates) with automatic file size computation and instant downloads.

#### `DepartmentsPage.tsx` (`/departments`)
- **Access**: Owner, Admin, HR
- **Features**: Department grid, employee counts per department, assigning department heads, adding and editing organizational units.

---

### 7.4 Attendance & Leave Management (`AttendancePage.tsx`)
- **Route**: `/attendance`
- **Access**: All Authenticated Users
- **Features**:
  - **Employee Punch Widget**: Shows today's date, current status (`PRESENT`, `LATE`, `NOT CHECKED IN`), check-in time, and check-out time.
  - **Late Check-in Detection**: Check-in after 09:15 AM triggers `status: 'late'` and renders amber `Late` badges.
  - **Early Check-out Detection**: Check-out before 17:00 (5:00 PM) triggers `early_checkout` status and renders orange `Early` badges.
  - **Daily Attendance Ledger with Absent Synthesis**:
    - Select any calendar date (`selectedDate`).
    - The ledger maps across **all active employees**.
    - If an employee has no punch record and no approved leave, they are displayed with status **`Absent`** (red marker and badge).
    - Admins can click **`Mark / Edit`** on an absent employee to record attendance manually.
  - **Responsive Dual-View Architecture**:
    - *Desktop View (`hidden md:block`)*: Full 7-column data table.
    - *Mobile View (`md:hidden`)*: Touch-friendly cards showing status, punch times, and action buttons.
  - **Leave Management Tab**:
    - Leave Application dialog with day counter.
    - Leave Approval Queue with 1-click **Approve** and **Reject** buttons for Managers.

---

### 7.5 Payroll Management Module

#### `GeneratePayrollPage.tsx` (`/payroll/generate`)
- **Access**: Owner, Admin, Accountant
- **Features**: 2-step payroll generation wizard:
  1. *Period Selection & Discovery*: Pick month and year. Scans attendance records to auto-detect overtime hours and absence days; scans loans for active installments; checks festival bonus policy rules.
  2. *Review & Adjustments*: Previews gross, individual allowances, deductions, and net salary. Admins can tweak adjustments before saving.
  3. *Batch Creation*: Purges previous draft records for the period and creates fresh drafts in Supabase.

#### `CurrentPayrollPage.tsx` (`/payroll`)
- **Access**: Owner, Admin, Accountant
- **Features**: Displays active month payroll. Provides batch selection to **Batch Approve** drafts or **Batch Mark as Paid** with disbursement payment method assignment (`bank_transfer`, `mobile_banking`, `cash`, `check`).

#### `PayrollHistoryPage.tsx` (`/payroll/history`)
- **Access**: Owner, Admin, Accountant
- **Features**: Historical archive filtered by year and month. Displays gross pay, deductions, net salary totals, and export buttons.

#### `PayrollDetailPage.tsx` (`/payroll/:id`)
- **Access**: Owner, Admin, Accountant, Employee (own record only)
- **Features**: Full ledger breakdown of a payroll item: gross salary, allowances breakdown (House Rent, Medical, Transport), deductions breakdown (Tax, Leave, Loan, PF), transaction reference, and digital signature preview.

---

### 7.6 Payslip Center (`AllPayslipsPage.tsx`)
- **Route**: `/payslips`
- **Access**: All Roles (Employees view own payslips; Admins view all)
- **Features**: Monthly filter, payslip search, modal payslip preview, and instant client-side vector PDF download rendered via `PayslipTemplate.tsx`.

---

### 7.7 Loans & Salary Advances (`LoansPage.tsx`)
- **Route**: `/loans`
- **Access**: All Roles (Employees apply for loans; Admins approve/reject)
- **Features**:
  - Loan Application Modal: Principal amount, term in months, monthly installment preview, reason.
  - Active Loans Ledger: Principal, remaining balance, installment amount, status badge.
  - Repayment History: Schedule showing every deduction linked to specific payroll runs.
  - Early Settlement: Settle remaining balance manually.

---

### 7.8 Analytics & Reporting Modules
- `SalaryReportPage.tsx` (`/reports/salary`): Department-wise salary disbursements, average pay, total cost to company, export to Excel/PDF.
- `DepartmentReportPage.tsx` (`/reports/department`): Budget allocation and headcount per department.
- `PaymentReportPage.tsx` (`/reports/payment`): Disbursement channel breakdown (Bank Transfer, bKash, Nagad, Cash).
- `YearlySummaryPage.tsx` (`/reports/yearly`): Fiscal year summary with 12-month gross vs net comparison charts.

---

### 7.9 System Settings & Administration
- `CompanySettingsPage.tsx` (`/settings/company`): Corporate name, tax ID, currency, logo, working days.
- `SalarySettingsPage.tsx` (`/settings/salary`): Overtime multiplier, daily working hours, weekly holiday, half-day deduction toggle, late arrival threshold rules, festival bonus rules, **Provident Fund (PF) Employee & Employer contribution percentages (`pfEmployeePercent`, `pfEmployerPercent`, 0–50%)**, and decimal rounding configuration.
- `UsersRolesPage.tsx` (`/settings/users`): RBAC user management, assigning roles (`Owner`, `Admin`, `Accountant`, `HR`, `Employee`), activating/deactivating accounts.
- `AuditLogsPage.tsx` (`/settings/audit-logs`): Immutable audit trail search and filtering.

---

### 7.10 User Profile (`ProfilePage.tsx`)
- **Route**: `/profile`
- **Access**: All Users
- **Features**: Profile photo upload with client-side canvas crop/compression, password change, and banking information review.

---

## 8. Role-Based Access Control (RBAC) & Security Architecture

FlowPay enforces strict permissions across both the UI layer (`usePermissions.ts`, `ProtectedRoute.tsx`) and the database layer (PostgreSQL RLS).

### Permissions Matrix:

| Module / Action | Owner | Admin | Accountant | HR | Employee |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **View Dashboard** | Yes | Yes | Yes | Yes | Own Data |
| **Manage Employees (Add/Edit/Delete)** | Yes | Yes | View Only | Yes | No |
| **View Employee Salaries** | Yes | Yes | Yes | No | Own Only |
| **Attendance Punch (Check In / Out)** | Yes | Yes | Yes | Yes | Own Only |
| **Manage Attendance (Correct/Edit)** | Yes | Yes | No | Yes | No |
| **Apply for Leave** | Yes | Yes | Yes | Yes | Yes |
| **Approve / Reject Leaves** | Yes | Yes | No | Yes | No |
| **Apply for Loans / Advances** | Yes | Yes | Yes | Yes | Yes |
| **Approve / Settle Loans** | Yes | Yes | Yes | No | No |
| **Generate & Approve Payroll** | Yes | Yes | Yes | No | No |
| **Mark Payroll as Paid** | Yes | Yes | Yes | No | No |
| **View All Payslips** | Yes | Yes | Yes | No | Own Only |
| **Financial & Salary Reports** | Yes | Yes | Yes | Department Only | No |
| **Company & Salary Settings** | Yes | Yes | Salary Rules | No | No |
| **User Role Assignment** | Yes | Yes | No | No | No |
| **View Audit Logs** | Yes | Yes | Yes | No | No |

---

## 9. Utilities, Mappers, and Helper Modules

### 9.1 `src/lib/dbMappers.ts`
Provides bidirectional transformations between PostgreSQL `snake_case` database rows and domain `camelCase` models:
- `rowToUser` / `userToRow`
- `rowToEmployee` / `employeeToRow`
- `rowToAttendance` / `attendanceToRow`
- `rowToLeave` / `leaveToRow`
- `rowToLoan` / `loanToRow`
- `rowToPayroll` / `payrollToRow`
- `rowToSettings` / `settingsToRow`
- `rowToNotification` / `notificationToRow`
- `rowToAudit` / `auditToRow`

### 9.2 `src/lib/export.ts`
- `exportToCSV(data, filename)`: Converts JSON data to RFC-4180 escaped `.csv` with UTF-8 BOM (`\uFEFF`) so currency symbols (`৳`) render cleanly in Microsoft Excel.
- `exportToExcel(data, filename, sheetName)`: Asynchronously builds a styled `.xlsx` workbook via `ExcelJS` (`^4.4.0`).
- `exportToPDF(elementId, filename)`: Rasterizes an HTML DOM node via `html2canvas` at 2x scale and writes a vector `.pdf` file via `jsPDF`.

### 9.3 `src/lib/imageUtils.ts`
- `processImageFile(file, maxDimension, quality)`: Crops an uploaded image to a centered square, resizes to a max width of 320px on an HTML5 Canvas, and compresses to WebP/JPEG data URL (~15-30KB).
- `uploadAvatar(file, userId)`: Processes avatar and uploads to Supabase storage.

### 9.4 `src/lib/utils.ts`
- `formatCurrency(amount, currency, symbol)`: Formats numbers into locale-aware currency strings (e.g. `৳50,000.00`).
- `formatDate(dateString)`: Formats ISO dates into human-readable strings (e.g. `Nov 17, 2026`).
- `getLocalDateString()`: Returns local date string in `YYYY-MM-DD` without UTC drift.
- `generateId()`: Generates random collision-resistant unique identifiers.
- `cn(...inputs)`: Merges Tailwind CSS class names via `clsx` and `tailwind-merge`.

---

## 10. Automated Test Suites & QA Verification

FlowPay uses **Vitest** (`^2.1.8`) and **ESLint** (`^10.15.0`) to continuously validate salary math, security regressions, and Zustand store rollbacks:

```bash
# Run full automated Vitest suite (48 tests across 3 files)
npm test

# Run ESLint static analysis (0 errors, 0 warnings)
npm run lint
```

### Suite Breakdown (`48 / 48` Passing):
1. `tests/payrollCalculations.test.ts` (**33 tests**): Basic-only salary, statutory allowances, fractional overtime, single-deduction absence logic, half-day & late-threshold deductions, loan installment capping, configurable Provident Fund & `calculateProvidentFundSummary()` aggregation, negative net salary floor safeguard, and `roundCurrency()` precision.
2. `tests/auditValidation.test.ts` (**9 tests**): Audit regression checks (`AUDIT-BUG-01`, `AUDIT-CALC-02/03`, `AUDIT-LATE-01/02/03`, `AUDIT-HALF-01`, `AUDIT-LOAN-01`, `AUDIT-SAFE-01`).
3. `tests/stores.test.ts` (**6 tests**): Zustand store integration and optimistic rollback regression tests against mocked Supabase errors (`payrollStore`, `employeeStore`, `loanStore`).

---

## 11. Deployment, Environment & Operational Guide

### 11.1 Environment Configuration (`.env`)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 11.2 Database Migrations & Edge Functions
```bash
# Apply incremental timestamped migrations (supabase/migrations/*.sql) via DATABASE_URL
DATABASE_URL="postgres://postgres.[project]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres" node scripts/migrate.js

# Deploy secure user provisioning Edge Function
supabase functions deploy create-user
```

### 11.3 Production Build & Hosting
```bash
# Typecheck, split vendor bundles (vite.config.ts manualChunks), and build for Vercel
npm run build

# Preview production build locally
npm run preview
```
Vercel deployment (`vercel.json`) enforces strict security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, and `Permissions-Policy`) alongside SPA rewrites.

---
*FlowPay Enterprise Documentation • Updated November 2026*
