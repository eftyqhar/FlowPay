-- Migration 002: Relational Integrity (FKs), Normalized Loan Repayments,
-- Native Date/Check Types, Performance Indexes, and Atomic Employee ID Sequence

-- 1. [FUNC-04] Atomic Employee ID Sequence & Trigger
CREATE SEQUENCE IF NOT EXISTS public.emp_id_seq START 1;

DO $$
DECLARE
  v_max_num BIGINT;
BEGIN
  SELECT COALESCE(MAX(NULLIF(regexp_replace(employee_id, '^EMP-', '', 'i'), '')::BIGINT), 0)
  INTO v_max_num
  FROM public.employees
  WHERE employee_id ~* '^EMP-[0-9]+$';

  IF v_max_num > 0 THEN
    PERFORM setval('public.emp_id_seq', v_max_num, true);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.generate_employee_id_trigger()
RETURNS trigger AS $$
BEGIN
  IF NEW.employee_id IS NULL OR trim(NEW.employee_id) = '' THEN
    NEW.employee_id := 'EMP-' || lpad(nextval('public.emp_id_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_generate_employee_id ON public.employees;
CREATE TRIGGER trg_generate_employee_id
  BEFORE INSERT ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.generate_employee_id_trigger();

-- Ensure handle_new_user_employee_assign uses atomic sequence & removes dummy bank defaults
CREATE OR REPLACE FUNCTION public.handle_new_user_employee_assign()
RETURNS trigger AS $$
DECLARE
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
    v_next_id := 'EMP-' || lpad(nextval('public.emp_id_seq')::TEXT, 4, '0');

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
      CURRENT_DATE,
      CASE WHEN NEW.role = 'owner' THEN 50000 ELSE 30000 END,
      0, 0, 0, 0, 0,
      NULL,
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

-- 2. [ARCH-02] Normalize legacy employee_id references and add Foreign Key Constraints
UPDATE public.payroll_records pr
SET employee_id = e.id
FROM public.employees e
WHERE pr.employee_id = e.employee_id
  AND NOT EXISTS (SELECT 1 FROM public.employees emp WHERE emp.id = pr.employee_id);

UPDATE public.loans l
SET employee_id = e.id
FROM public.employees e
WHERE l.employee_id = e.employee_id
  AND NOT EXISTS (SELECT 1 FROM public.employees emp WHERE emp.id = l.employee_id);

UPDATE public.leave_requests lr
SET employee_id = e.id
FROM public.employees e
WHERE lr.employee_id = e.employee_id
  AND NOT EXISTS (SELECT 1 FROM public.employees emp WHERE emp.id = lr.employee_id);

UPDATE public.attendance_records ar
SET employee_id = e.id
FROM public.employees e
WHERE ar.employee_id = e.employee_id
  AND NOT EXISTS (SELECT 1 FROM public.employees emp WHERE emp.id = ar.employee_id);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_payroll_employee') THEN
    ALTER TABLE public.payroll_records
      ADD CONSTRAINT fk_payroll_employee
      FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_loans_employee') THEN
    ALTER TABLE public.loans
      ADD CONSTRAINT fk_loans_employee
      FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_leave_requests_employee') THEN
    ALTER TABLE public.leave_requests
      ADD CONSTRAINT fk_leave_requests_employee
      FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_attendance_employee') THEN
    ALTER TABLE public.attendance_records
      ADD CONSTRAINT fk_attendance_employee
      FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 3. [ARCH-03] Normalized Loan Repayments Table & Data Migration
CREATE TABLE IF NOT EXISTS public.loan_repayments (
  id TEXT PRIMARY KEY,
  loan_id TEXT NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  payroll_record_id TEXT,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  month INTEGER,
  year INTEGER,
  date TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_loan_repayments_loan_month_year
  ON public.loan_repayments (loan_id, month, year)
  WHERE month IS NOT NULL AND year IS NOT NULL;

ALTER TABLE public.loan_repayments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Loan repayments viewable by authorized or own" ON public.loan_repayments;
CREATE POLICY "Loan repayments viewable by authorized or own"
  ON public.loan_repayments FOR SELECT
  TO authenticated
  USING (
    public.current_user_role() IN ('owner', 'admin', 'accountant')
    OR loan_id IN (
      SELECT l.id FROM public.loans l
      WHERE l.employee_id = public.current_user_employee_id()
         OR l.employee_id IN (SELECT id FROM public.employees WHERE lower(email) = lower(auth.jwt()->>'email'))
    )
  );

DROP POLICY IF EXISTS "Loan repayments manageable by owner admin accountant" ON public.loan_repayments;
CREATE POLICY "Loan repayments manageable by owner admin accountant"
  ON public.loan_repayments FOR ALL
  TO authenticated
  USING (public.current_user_role() IN ('owner', 'admin', 'accountant'))
  WITH CHECK (public.current_user_role() IN ('owner', 'admin', 'accountant'));

-- Backfill existing JSONB repayments into loan_repayments safely
INSERT INTO public.loan_repayments (id, loan_id, payroll_record_id, amount, month, year, date)
SELECT
  COALESCE(NULLIF(rep->>'id', ''), l.id || '-rep-' || row_number() OVER (PARTITION BY l.id)),
  l.id,
  NULLIF(rep->>'payrollRecordId', ''),
  COALESCE((rep->>'amount')::NUMERIC, 0),
  NULLIF(rep->>'month', '')::INTEGER,
  NULLIF(rep->>'year', '')::INTEGER,
  COALESCE(NULLIF(rep->>'date', '')::TIMESTAMPTZ, now())
FROM public.loans l,
     jsonb_array_elements(
       CASE WHEN jsonb_typeof(l.repayments) = 'array' THEN l.repayments ELSE '[]'::jsonb END
     ) AS rep
ON CONFLICT DO NOTHING;

-- 4. [ARCH-04] Migrate TEXT Date Columns to DATE & Enforce Status CHECK Constraints
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'employees'
      AND column_name = 'joining_date' AND data_type = 'text'
  ) THEN
    ALTER TABLE public.employees
      ALTER COLUMN joining_date TYPE DATE
      USING COALESCE(NULLIF(trim(joining_date), '')::DATE, CURRENT_DATE);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'attendance_records'
      AND column_name = 'date' AND data_type = 'text'
  ) THEN
    ALTER TABLE public.attendance_records
      ALTER COLUMN date TYPE DATE
      USING NULLIF(trim(date), '')::DATE;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'leave_requests'
      AND column_name = 'start_date' AND data_type = 'text'
  ) THEN
    ALTER TABLE public.leave_requests
      ALTER COLUMN start_date TYPE DATE
      USING NULLIF(trim(start_date), '')::DATE;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'leave_requests'
      AND column_name = 'end_date' AND data_type = 'text'
  ) THEN
    ALTER TABLE public.leave_requests
      ALTER COLUMN end_date TYPE DATE
      USING NULLIF(trim(end_date), '')::DATE;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payroll_records'
      AND column_name = 'payment_date' AND data_type = 'text'
  ) THEN
    ALTER TABLE public.payroll_records
      ALTER COLUMN payment_date TYPE DATE
      USING NULLIF(trim(payment_date), '')::DATE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_employees_status') THEN
    ALTER TABLE public.employees ADD CONSTRAINT chk_employees_status CHECK (status IN ('active', 'inactive'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_attendance_status') THEN
    ALTER TABLE public.attendance_records ADD CONSTRAINT chk_attendance_status CHECK (status IN ('present', 'absent', 'late', 'early_checkout', 'half_day', 'on_leave'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_leave_status') THEN
    ALTER TABLE public.leave_requests ADD CONSTRAINT chk_leave_status CHECK (status IN ('pending', 'approved', 'rejected'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_leave_type') THEN
    ALTER TABLE public.leave_requests ADD CONSTRAINT chk_leave_type CHECK (leave_type IN ('casual', 'sick', 'annual', 'unpaid'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_loans_status') THEN
    ALTER TABLE public.loans ADD CONSTRAINT chk_loans_status CHECK (status IN ('pending', 'approved', 'rejected', 'active', 'completed'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_loans_type') THEN
    ALTER TABLE public.loans ADD CONSTRAINT chk_loans_type CHECK (type IN ('loan', 'advance'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_payroll_status') THEN
    ALTER TABLE public.payroll_records ADD CONSTRAINT chk_payroll_status CHECK (status IN ('draft', 'approved', 'paid'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_users_role') THEN
    ALTER TABLE public.users ADD CONSTRAINT chk_users_role CHECK (role IN ('owner', 'admin', 'accountant', 'hr', 'employee'));
  END IF;
END $$;

-- 5. [ARCH-05] Performance Indexes
CREATE INDEX IF NOT EXISTS idx_attendance_emp_date ON public.attendance_records (employee_id, date);
CREATE INDEX IF NOT EXISTS idx_leave_emp_status ON public.leave_requests (employee_id, status);
CREATE INDEX IF NOT EXISTS idx_loans_emp_status ON public.loans (employee_id, status);
CREATE INDEX IF NOT EXISTS idx_payroll_status ON public.payroll_records (status);
CREATE INDEX IF NOT EXISTS idx_loan_repayments_loan_id ON public.loan_repayments (loan_id);

GRANT ALL ON public.loan_repayments TO authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE public.emp_id_seq TO authenticated, service_role;
