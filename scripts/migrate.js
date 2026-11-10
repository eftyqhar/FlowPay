import pg from 'pg';

const schemaSql = `
-- Drop existing tables to ensure clean schema matching TypeScript interfaces
DROP TABLE IF EXISTS public.payroll_records CASCADE;
DROP TABLE IF EXISTS public.loans CASCADE;
DROP TABLE IF EXISTS public.leave_requests CASCADE;
DROP TABLE IF EXISTS public.attendance_records CASCADE;
DROP TABLE IF EXISTS public.employees CASCADE;
DROP TABLE IF EXISTS public.departments CASCADE;
DROP TABLE IF EXISTS public.company_settings CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- 1. Departments
CREATE TABLE public.departments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  head TEXT,
  head_id TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Employees
CREATE TABLE public.employees (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  photo TEXT,
  department TEXT NOT NULL,
  designation TEXT NOT NULL,
  joining_date TEXT NOT NULL,
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
CREATE TABLE public.attendance_records (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  date TEXT NOT NULL,
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
CREATE TABLE public.leave_requests (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  department TEXT,
  leave_type TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  days_count INTEGER NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  applied_at TIMESTAMPTZ DEFAULT now(),
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT
);

-- 5. Loans & Advances
CREATE TABLE public.loans (
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
CREATE TABLE public.payroll_records (
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
  payment_date TEXT,
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
CREATE TABLE public.company_settings (
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
CREATE TABLE public.notifications (
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
CREATE TABLE public.audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  details TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Users Table (for app roles / RBAC profiles)
CREATE TABLE public.users (
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

-- 1. Helper function to get caller role from JWT email
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

-- 2. Helper function to get caller employee_id from JWT email
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

-- 3. Prevent Unauthorized Role Escalation Trigger
CREATE OR REPLACE FUNCTION public.prevent_unauthorized_role_change()
RETURNS trigger AS $$
DECLARE
  v_caller_role TEXT;
  v_caller_email TEXT;
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    v_caller_email := auth.jwt()->>'email';
    IF v_caller_email IS NOT NULL THEN
      SELECT role INTO v_caller_role FROM public.users WHERE lower(email) = lower(v_caller_email);
      IF v_caller_role IS NULL OR v_caller_role <> 'owner' THEN
        RAISE EXCEPTION 'Unauthorized: Only the Super Admin / Owner can change user roles.';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_role_escalation ON public.users;
CREATE TRIGGER trg_prevent_role_escalation
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.prevent_unauthorized_role_change();

-- 4. Enable RLS and setup fine-grained policies
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Public access policy" ON public.%I;', tbl);
  END LOOP;
END $$;

-- Policies for public.company_settings
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

-- Policies for public.users
DROP POLICY IF EXISTS "Users viewable by authenticated" ON public.users;
CREATE POLICY "Users viewable by authenticated"
  ON public.users FOR SELECT
  TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "Users self insert" ON public.users;
CREATE POLICY "Users self insert"
  ON public.users FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

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

-- Policies for public.employees
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

-- Policies for public.payroll_records
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

-- Policies for public.attendance_records
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
  WITH CHECK (true);

DROP POLICY IF EXISTS "Attendance modifiable by owner admin hr" ON public.attendance_records;
CREATE POLICY "Attendance modifiable by owner admin hr"
  ON public.attendance_records FOR UPDATE
  TO authenticated
  USING (public.current_user_role() IN ('owner', 'admin', 'hr'))
  WITH CHECK (public.current_user_role() IN ('owner', 'admin', 'hr'));

-- Policies for public.leave_requests
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
  WITH CHECK (true);

DROP POLICY IF EXISTS "Leave requests reviewable by owner admin hr" ON public.leave_requests;
CREATE POLICY "Leave requests reviewable by owner admin hr"
  ON public.leave_requests FOR UPDATE
  TO authenticated
  USING (public.current_user_role() IN ('owner', 'admin', 'hr'))
  WITH CHECK (public.current_user_role() IN ('owner', 'admin', 'hr'));

-- Policies for public.loans
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
  WITH CHECK (true);

DROP POLICY IF EXISTS "Loans manageable by owner admin accountant" ON public.loans;
CREATE POLICY "Loans manageable by owner admin accountant"
  ON public.loans FOR UPDATE
  TO authenticated
  USING (public.current_user_role() IN ('owner', 'admin', 'accountant'))
  WITH CHECK (public.current_user_role() IN ('owner', 'admin', 'accountant'));

-- Policies for public.audit_logs
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

-- Policies for public.departments
DROP POLICY IF EXISTS "Departments viewable by authenticated" ON public.departments;
CREATE POLICY "Departments viewable by authenticated"
  ON public.departments FOR SELECT
  TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "Departments manageable by owner admin hr" ON public.departments;
CREATE POLICY "Departments manageable by owner admin hr"
  ON public.departments FOR ALL
  TO authenticated
  USING (public.current_user_role() IN ('owner', 'admin', 'hr'))
  WITH CHECK (public.current_user_role() IN ('owner', 'admin', 'hr'));

-- Policies for public.notifications
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
  USING (true)
  WITH CHECK (true);

-- Grant permissions to PostgREST roles (anon, authenticated, service_role)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- Auto-confirm any new user signups (Bypass email verification)
CREATE OR REPLACE FUNCTION public.auto_confirm_new_user()
RETURNS trigger AS $$
BEGIN
  NEW.email_confirmed_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_auto_confirm ON auth.users;
CREATE TRIGGER on_auth_user_created_auto_confirm
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_confirm_new_user();

UPDATE auth.users SET email_confirmed_at = now() WHERE email_confirmed_at IS NULL;

-- Automatically assign any newly registered user to employees directory
CREATE OR REPLACE FUNCTION public.handle_new_user_employee_assign()
RETURNS trigger AS $$
DECLARE
  v_next_num INT;
  v_next_id TEXT;
  v_existing_emp_id TEXT;
BEGIN
  SELECT employee_id INTO v_existing_emp_id 
  FROM public.employees 
  WHERE lower(email) = lower(NEW.email) 
  LIMIT 1;

  IF v_existing_emp_id IS NOT NULL THEN
    NEW.employee_id := v_existing_emp_id;
  ELSIF NEW.employee_id IS NULL THEN
    SELECT COALESCE(MAX(NULLIF(regexp_replace(employee_id, '^EMP-', '', 'i'), '')::INT), 0) + 1
    INTO v_next_num
    FROM public.employees
    WHERE employee_id ~* '^EMP-[0-9]+$';

    v_next_id := 'EMP-' || lpad(v_next_num::TEXT, 3, '0');

    INSERT INTO public.employees (
      id, employee_id, full_name, email, phone, photo, department, designation,
      joining_date, basic_salary, allowances, bonus, overtime, deductions, tax,
      bank_info, payment_method, status, pf_eligible, leave_balance, documents
    ) VALUES (
      'emp-' || substr(NEW.id, 1, 13),
      v_next_id,
      NEW.name,
      lower(NEW.email),
      '',
      COALESCE(NEW.avatar, 'https://ui-avatars.com/api/?name=' || replace(NEW.name, ' ', '+') || '&background=random'),
      'Operations',
      CASE WHEN NEW.role = 'owner' THEN 'Managing Director / Owner' ELSE 'Employee' END,
      to_char(CURRENT_DATE, 'YYYY-MM-DD'),
      CASE WHEN NEW.role = 'owner' THEN 50000 ELSE 30000 END,
      0, 0, 0, 0, 0,
      '{"bankName": "Dutch-Bangla Bank", "accountNumber": "1000000000", "routingNumber": "090270001", "accountType": "savings"}'::jsonb,
      'bank_transfer',
      'active',
      true,
      '{"casual": 10, "sick": 14, "annual": 15}'::jsonb,
      '[]'::jsonb
    ) ON CONFLICT (id) DO NOTHING;

    NEW.employee_id := v_next_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_user_created_assign_employee ON public.users;
CREATE TRIGGER on_user_created_assign_employee
  BEFORE INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_employee_assign();
`;

async function runMigration() {
  const client = new pg.Client({
    host: 'aws-0-ap-southeast-1.pooler.supabase.com',
    port: 5432,
    database: 'postgres',
    user: 'postgres.hvjzwytvljmnnwqahpky',
    password: 'floqpay2026',
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Running FlowPay Schema Migration on Supabase...');
    await client.query(schemaSql);
    console.log('Migration successfully completed!');

    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log('Created tables in public schema:', tables.rows.map(r => r.table_name));

    await client.end();
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

runMigration();
