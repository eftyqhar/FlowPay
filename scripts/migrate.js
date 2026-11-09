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

-- Enable RLS and setup permissive policies for all tables
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Public access policy" ON public.%I;', tbl);
    EXECUTE format('CREATE POLICY "Public access policy" ON public.%I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);', tbl);
  END LOOP;
END $$;

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
