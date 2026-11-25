-- Migration 001: FlowPay Baseline Idempotent Schema, Triggers & Hardened RLS Policies
-- Safe for both fresh initialization and existing databases (non-destructive).

-- 1. Departments
CREATE TABLE IF NOT EXISTS public.departments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  head TEXT,
  head_id TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Employees
CREATE TABLE IF NOT EXISTS public.employees (
  id TEXT PRIMARY KEY,
  employee_id TEXT UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  photo TEXT,
  department TEXT NOT NULL,
  designation TEXT NOT NULL,
  joining_date DATE NOT NULL,
  basic_salary NUMERIC NOT NULL DEFAULT 0,
  allowances NUMERIC NOT NULL DEFAULT 0,
  house_rent_allowance NUMERIC DEFAULT 0,
  medical_allowance NUMERIC DEFAULT 0,
  transport_allowance NUMERIC DEFAULT 0,
  bonus NUMERIC NOT NULL DEFAULT 0,
  overtime NUMERIC NOT NULL DEFAULT 0,
  deductions NUMERIC NOT NULL DEFAULT 0,
  tax NUMERIC NOT NULL DEFAULT 0,
  bank_info JSONB,
  payment_method TEXT,
  mobile_banking_info JSONB,
  status TEXT NOT NULL DEFAULT 'active',
  pf_eligible BOOLEAN DEFAULT true,
  leave_balance JSONB DEFAULT '{"casual": 10, "sick": 14, "annual": 15}'::jsonb,
  emergency_contact JSONB,
  documents JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Attendance Records
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  date DATE NOT NULL,
  check_in TEXT,
  check_out TEXT,
  status TEXT NOT NULL,
  notes TEXT,
  manual_correction BOOLEAN DEFAULT false,
  corrected_by TEXT,
  late_check_in BOOLEAN DEFAULT false,
  early_check_out BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Leave Requests
CREATE TABLE IF NOT EXISTS public.leave_requests (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  department TEXT,
  leave_type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_count INTEGER NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  applied_at TIMESTAMPTZ DEFAULT now(),
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT
);

-- 5. Loans & Advances
CREATE TABLE IF NOT EXISTS public.loans (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  department TEXT,
  type TEXT NOT NULL DEFAULT 'loan',
  principal_amount NUMERIC NOT NULL,
  monthly_installment NUMERIC NOT NULL,
  remaining_balance NUMERIC NOT NULL,
  term_months INTEGER NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  applied_at TIMESTAMPTZ DEFAULT now(),
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  repayments JSONB DEFAULT '[]'::jsonb
);

-- 6. Payroll Records
CREATE TABLE IF NOT EXISTS public.payroll_records (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  department TEXT NOT NULL,
  designation TEXT NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  basic_salary NUMERIC NOT NULL,
  allowances NUMERIC NOT NULL DEFAULT 0,
  bonus NUMERIC NOT NULL DEFAULT 0,
  overtime NUMERIC NOT NULL DEFAULT 0,
  gross_salary NUMERIC NOT NULL,
  deductions NUMERIC NOT NULL DEFAULT 0,
  tax NUMERIC NOT NULL DEFAULT 0,
  unpaid_leave_days INTEGER DEFAULT 0,
  leave_deduction NUMERIC DEFAULT 0,
  absent_days INTEGER DEFAULT 0,
  absence_deduction NUMERIC DEFAULT 0,
  loan_deduction NUMERIC DEFAULT 0,
  pf_employee_deduction NUMERIC DEFAULT 0,
  pf_employer_contribution NUMERIC DEFAULT 0,
  total_deductions NUMERIC NOT NULL,
  net_salary NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  payment_method TEXT,
  payment_date DATE,
  transaction_ref TEXT,
  created_by TEXT DEFAULT 'Admin',
  created_at TIMESTAMPTZ DEFAULT now(),
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  paid_by TEXT,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  breakdown JSONB
);

-- 7. Company Settings
CREATE TABLE IF NOT EXISTS public.company_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  name TEXT NOT NULL DEFAULT 'FlowPay Inc.',
  logo TEXT,
  address TEXT DEFAULT 'Dhaka, Bangladesh',
  phone TEXT DEFAULT '+880 1700-000000',
  email TEXT DEFAULT 'contact@flowpay.com',
  website TEXT DEFAULT 'https://flowpay.com',
  tax_id TEXT DEFAULT 'TIN-0123456789',
  currency TEXT DEFAULT 'BDT',
  currency_symbol TEXT DEFAULT '৳',
  financial_year_start TEXT DEFAULT '01-01',
  pay_day INTEGER DEFAULT 1,
  minimum_wage NUMERIC DEFAULT 12000,
  overtime_multiplier NUMERIC DEFAULT 1.5,
  pf_employee_percent NUMERIC DEFAULT 10,
  pf_employer_percent NUMERIC DEFAULT 10,
  tax_free_threshold NUMERIC DEFAULT 350000,
  standard_working_days INTEGER DEFAULT 22,
  auto_deduct_absence_days BOOLEAN DEFAULT true,
  rules_config JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.company_settings (id, name, currency, currency_symbol, standard_working_days, overtime_multiplier, auto_deduct_absence_days)
VALUES ('default', 'FlowPay Inc.', 'BDT', '৳', 22, 1.5, true)
ON CONFLICT (id) DO NOTHING;

-- 8. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  link TEXT,
  target_roles TEXT[] DEFAULT '{}',
  target_user_id TEXT,
  target_employee_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  details TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Users Table (for app roles / RBAC profiles)
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'employee',
  avatar TEXT,
  is_active BOOLEAN DEFAULT true,
  employee_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Unique Constraints to prevent duplicate payroll drafts & attendance
CREATE UNIQUE INDEX IF NOT EXISTS uq_payroll_emp_month_year ON public.payroll_records (employee_id, month, year);
CREATE UNIQUE INDEX IF NOT EXISTS uq_attendance_emp_date ON public.attendance_records (employee_id, date);

-- Helper functions
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text AS $$
DECLARE
  v_role text;
BEGIN
  SELECT role INTO v_role
  FROM public.users
  WHERE lower(email) = lower(auth.jwt()->>'email')
  LIMIT 1;
  RETURN COALESCE(v_role, 'employee');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.current_user_employee_id()
RETURNS text AS $$
DECLARE
  v_emp_id text;
BEGIN
  SELECT employee_id INTO v_emp_id
  FROM public.users
  WHERE lower(email) = lower(auth.jwt()->>'email')
  LIMIT 1;
  RETURN v_emp_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_first_user()
RETURNS boolean AS $$
BEGIN
  RETURN NOT EXISTS (SELECT 1 FROM public.users LIMIT 1);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Enforce secure signup role assignment on INSERT
CREATE OR REPLACE FUNCTION public.enforce_signup_role_security()
RETURNS trigger AS $$
DECLARE
  v_caller_role TEXT;
  v_caller_email TEXT;
  v_jwt_role TEXT;
BEGIN
  v_jwt_role := current_setting('request.jwt.claim.role', true);
  IF v_jwt_role IS NULL OR v_jwt_role = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.users LIMIT 1) THEN
    NEW.role := 'owner';
    RETURN NEW;
  END IF;

  v_caller_email := auth.jwt()->>'email';
  IF v_caller_email IS NOT NULL THEN
    SELECT role INTO v_caller_role FROM public.users WHERE lower(email) = lower(v_caller_email) LIMIT 1;
  END IF;

  IF v_caller_role IS NULL OR v_caller_role <> 'owner' THEN
    NEW.role := 'employee';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_enforce_signup_role ON public.users;
CREATE TRIGGER trg_enforce_signup_role
  BEFORE INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.enforce_signup_role_security();

-- Prevent Unauthorized Role Escalation Trigger
CREATE OR REPLACE FUNCTION public.prevent_unauthorized_role_change()
RETURNS trigger AS $$
DECLARE
  v_caller_role TEXT;
  v_caller_email TEXT;
  v_jwt_role TEXT;
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    v_jwt_role := current_setting('request.jwt.claim.role', true);
    IF v_jwt_role IS NULL OR v_jwt_role = 'service_role' THEN
      RETURN NEW;
    END IF;

    v_caller_email := auth.jwt()->>'email';
    IF v_caller_email IS NULL THEN
      RAISE EXCEPTION 'Unauthorized: Missing caller identity for role change.';
    END IF;

    SELECT role INTO v_caller_role FROM public.users WHERE lower(email) = lower(v_caller_email) LIMIT 1;
    IF v_caller_role IS NULL OR v_caller_role <> 'owner' THEN
      RAISE EXCEPTION 'Unauthorized: Only the Super Admin / Owner can change user roles.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_role_escalation ON public.users;
CREATE TRIGGER trg_prevent_role_escalation
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.prevent_unauthorized_role_change();

-- Enable RLS across all public tables
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Public access policy" ON public.%I;', tbl);
  END LOOP;
END $$;

-- Company Settings Policies
DROP POLICY IF EXISTS "Settings viewable by authenticated and anon" ON public.company_settings;
CREATE POLICY "Settings viewable by authenticated and anon"
  ON public.company_settings FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Settings modifiable by owner and admin" ON public.company_settings;
CREATE POLICY "Settings modifiable by owner and admin"
  ON public.company_settings FOR ALL
  TO authenticated
  USING (public.current_user_role() IN ('owner', 'admin'))
  WITH CHECK (public.current_user_role() IN ('owner', 'admin'));

-- Users Policies (No anon access)
DROP POLICY IF EXISTS "Users viewable by authenticated" ON public.users;
DROP POLICY IF EXISTS "Users viewable by self or admins" ON public.users;
CREATE POLICY "Users viewable by self or admins"
  ON public.users FOR SELECT
  TO authenticated
  USING (
    auth.uid()::text = id
    OR lower(email) = lower(auth.jwt()->>'email')
    OR public.current_user_role() IN ('owner', 'admin')
  );

DROP POLICY IF EXISTS "Users self insert" ON public.users;
DROP POLICY IF EXISTS "Users insert own profile or admin" ON public.users;
CREATE POLICY "Users insert own profile or admin"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid()::text = id
    OR lower(email) = lower(auth.jwt()->>'email')
    OR public.current_user_role() IN ('owner', 'admin')
  );

DROP POLICY IF EXISTS "Users update policy" ON public.users;
CREATE POLICY "Users update policy"
  ON public.users FOR UPDATE
  TO authenticated
  USING (
    id = auth.uid()::text
    OR lower(email) = lower(auth.jwt()->>'email')
    OR public.current_user_role() IN ('owner', 'admin')
  )
  WITH CHECK (
    id = auth.uid()::text
    OR lower(email) = lower(auth.jwt()->>'email')
    OR public.current_user_role() IN ('owner', 'admin')
  );

-- Employees Policies
DROP POLICY IF EXISTS "Employees viewable by authenticated" ON public.employees;
CREATE POLICY "Employees viewable by authenticated"
  ON public.employees FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Employees modifiable by owner admin hr" ON public.employees;
CREATE POLICY "Employees modifiable by owner admin hr"
  ON public.employees FOR ALL
  TO authenticated
  USING (public.current_user_role() IN ('owner', 'admin', 'hr'))
  WITH CHECK (public.current_user_role() IN ('owner', 'admin', 'hr'));

-- Payroll Records Policies
DROP POLICY IF EXISTS "Payroll viewable by authorized or owner of payslip" ON public.payroll_records;
CREATE POLICY "Payroll viewable by authorized or owner of payslip"
  ON public.payroll_records FOR SELECT
  TO authenticated
  USING (
    public.current_user_role() IN ('owner', 'admin', 'accountant')
    OR employee_id = public.current_user_employee_id()
    OR employee_id IN (SELECT id FROM public.employees WHERE lower(email) = lower(auth.jwt()->>'email'))
  );

DROP POLICY IF EXISTS "Payroll manageable by owner admin accountant" ON public.payroll_records;
CREATE POLICY "Payroll manageable by owner admin accountant"
  ON public.payroll_records FOR ALL
  TO authenticated
  USING (public.current_user_role() IN ('owner', 'admin', 'accountant'))
  WITH CHECK (public.current_user_role() IN ('owner', 'admin', 'accountant'));

-- Attendance Records Policies
DROP POLICY IF EXISTS "Attendance viewable by authorized or own" ON public.attendance_records;
CREATE POLICY "Attendance viewable by authorized or own"
  ON public.attendance_records FOR SELECT
  TO authenticated
  USING (
    public.current_user_role() IN ('owner', 'admin', 'hr', 'accountant')
    OR employee_id = public.current_user_employee_id()
    OR employee_id IN (SELECT id FROM public.employees WHERE lower(email) = lower(auth.jwt()->>'email'))
  );

DROP POLICY IF EXISTS "Attendance recordable by authenticated" ON public.attendance_records;
CREATE POLICY "Attendance recordable by authenticated"
  ON public.attendance_records FOR INSERT
  TO authenticated
  WITH CHECK (
    public.current_user_role() IN ('owner', 'admin', 'hr')
    OR employee_id = public.current_user_employee_id()
    OR employee_id IN (SELECT id FROM public.employees WHERE lower(email) = lower(auth.jwt()->>'email'))
  );

DROP POLICY IF EXISTS "Attendance modifiable by owner admin hr" ON public.attendance_records;
CREATE POLICY "Attendance modifiable by owner admin hr"
  ON public.attendance_records FOR UPDATE
  TO authenticated
  USING (
    public.current_user_role() IN ('owner', 'admin', 'hr')
    OR employee_id = public.current_user_employee_id()
    OR employee_id IN (SELECT id FROM public.employees WHERE lower(email) = lower(auth.jwt()->>'email'))
  )
  WITH CHECK (
    public.current_user_role() IN ('owner', 'admin', 'hr')
    OR employee_id = public.current_user_employee_id()
    OR employee_id IN (SELECT id FROM public.employees WHERE lower(email) = lower(auth.jwt()->>'email'))
  );

-- Leave Requests Policies
DROP POLICY IF EXISTS "Leave requests viewable by authorized or own" ON public.leave_requests;
CREATE POLICY "Leave requests viewable by authorized or own"
  ON public.leave_requests FOR SELECT
  TO authenticated
  USING (
    public.current_user_role() IN ('owner', 'admin', 'hr')
    OR employee_id = public.current_user_employee_id()
    OR employee_id IN (SELECT id FROM public.employees WHERE lower(email) = lower(auth.jwt()->>'email'))
  );

DROP POLICY IF EXISTS "Leave requests insert by authenticated" ON public.leave_requests;
CREATE POLICY "Leave requests insert by authenticated"
  ON public.leave_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    public.current_user_role() IN ('owner', 'admin', 'hr')
    OR employee_id = public.current_user_employee_id()
    OR employee_id IN (SELECT id FROM public.employees WHERE lower(email) = lower(auth.jwt()->>'email'))
  );

DROP POLICY IF EXISTS "Leave requests reviewable by owner admin hr" ON public.leave_requests;
CREATE POLICY "Leave requests reviewable by owner admin hr"
  ON public.leave_requests FOR UPDATE
  TO authenticated
  USING (public.current_user_role() IN ('owner', 'admin', 'hr'))
  WITH CHECK (public.current_user_role() IN ('owner', 'admin', 'hr'));

-- Loans Policies
DROP POLICY IF EXISTS "Loans viewable by authorized or own" ON public.loans;
CREATE POLICY "Loans viewable by authorized or own"
  ON public.loans FOR SELECT
  TO authenticated
  USING (
    public.current_user_role() IN ('owner', 'admin', 'accountant')
    OR employee_id = public.current_user_employee_id()
    OR employee_id IN (SELECT id FROM public.employees WHERE lower(email) = lower(auth.jwt()->>'email'))
  );

DROP POLICY IF EXISTS "Loans apply by authenticated" ON public.loans;
CREATE POLICY "Loans apply by authenticated"
  ON public.loans FOR INSERT
  TO authenticated
  WITH CHECK (
    public.current_user_role() IN ('owner', 'admin', 'hr')
    OR employee_id = public.current_user_employee_id()
    OR employee_id IN (SELECT id FROM public.employees WHERE lower(email) = lower(auth.jwt()->>'email'))
  );

DROP POLICY IF EXISTS "Loans manageable by owner admin accountant" ON public.loans;
CREATE POLICY "Loans manageable by owner admin accountant"
  ON public.loans FOR UPDATE
  TO authenticated
  USING (public.current_user_role() IN ('owner', 'admin', 'accountant'))
  WITH CHECK (public.current_user_role() IN ('owner', 'admin', 'accountant'));

-- Audit Logs Policies
DROP POLICY IF EXISTS "Audit logs viewable by authorized" ON public.audit_logs;
CREATE POLICY "Audit logs viewable by authorized"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.current_user_role() IN ('owner', 'admin', 'accountant'));

DROP POLICY IF EXISTS "Audit logs insert by authenticated" ON public.audit_logs;
CREATE POLICY "Audit logs insert by authenticated"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Departments Policies
DROP POLICY IF EXISTS "Departments viewable by authenticated" ON public.departments;
CREATE POLICY "Departments viewable by authenticated"
  ON public.departments FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Departments manageable by owner admin hr" ON public.departments;
CREATE POLICY "Departments manageable by owner admin hr"
  ON public.departments FOR ALL
  TO authenticated
  USING (public.current_user_role() IN ('owner', 'admin', 'hr'))
  WITH CHECK (public.current_user_role() IN ('owner', 'admin', 'hr'));

-- Notifications Policies
DROP POLICY IF EXISTS "Notifications viewable by target or role" ON public.notifications;
CREATE POLICY "Notifications viewable by target or role"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (
    target_roles IS NULL
    OR array_length(target_roles, 1) = 0
    OR public.current_user_role() = ANY(target_roles)
    OR target_user_id = auth.uid()::text
    OR target_employee_id = public.current_user_employee_id()
  );

DROP POLICY IF EXISTS "Notifications manageable by authenticated" ON public.notifications;
CREATE POLICY "Notifications manageable by authenticated"
  ON public.notifications FOR ALL
  TO authenticated
  USING (
    target_user_id = auth.uid()::text
    OR public.current_user_role() IN ('owner', 'admin')
  )
  WITH CHECK (
    target_user_id = auth.uid()::text
    OR public.current_user_role() IN ('owner', 'admin')
  );

-- Grants
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
GRANT SELECT ON public.company_settings TO anon;
GRANT EXECUTE ON FUNCTION public.is_first_user() TO anon, authenticated, service_role;
