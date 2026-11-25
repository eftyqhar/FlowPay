-- Migration 003: Atomic Batch Payroll Disbursement RPC
-- Executes payroll payout updates, loan repayment insertions, loan balance decrements,
-- and audit logging inside a single ACID PostgreSQL transaction.

CREATE OR REPLACE FUNCTION public.disburse_payroll_batch(
  p_record_ids TEXT[],
  p_paid_by TEXT,
  p_method TEXT,
  p_ref TEXT
)
RETURNS SETOF public.payroll_records AS $$
DECLARE
  v_caller_role TEXT;
  v_rec public.payroll_records%ROWTYPE;
  v_loan public.loans%ROWTYPE;
  v_deduction NUMERIC;
  v_new_balance NUMERIC;
  v_new_status TEXT;
  v_count INTEGER := 0;
  v_total_net NUMERIC := 0;
  v_updated public.payroll_records%ROWTYPE;
BEGIN
  v_caller_role := public.current_user_role();
  IF v_caller_role NOT IN ('owner', 'admin', 'accountant') THEN
    RAISE EXCEPTION 'Unauthorized: Only Owner, Admin, or Accountant can disburse payroll.';
  END IF;

  IF p_record_ids IS NULL OR array_length(p_record_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'No payroll record IDs provided for disbursement.';
  END IF;

  FOR v_rec IN
    SELECT *
    FROM public.payroll_records
    WHERE id = ANY(p_record_ids)
      AND status = 'approved'
    FOR UPDATE
  LOOP
    -- Handle loan deduction atomically inside this transaction
    IF COALESCE(v_rec.loan_deduction, 0) > 0 THEN
      SELECT *
      INTO v_loan
      FROM public.loans
      WHERE employee_id = v_rec.employee_id
        AND status = 'active'
        AND remaining_balance > 0
      ORDER BY applied_at ASC
      LIMIT 1
      FOR UPDATE;

      IF FOUND THEN
        IF NOT EXISTS (
          SELECT 1
          FROM public.loan_repayments
          WHERE loan_id = v_loan.id
            AND month = v_rec.month
            AND year = v_rec.year
        ) THEN
          v_deduction := LEAST(v_rec.loan_deduction, v_loan.remaining_balance);
          v_new_balance := GREATEST(0, v_loan.remaining_balance - v_deduction);
          v_new_status := CASE WHEN v_new_balance <= 0 THEN 'completed' ELSE 'active' END;

          INSERT INTO public.loan_repayments (
            id, loan_id, payroll_record_id, amount, month, year, date
          ) VALUES (
            'rep-' || md5(v_loan.id || '-' || v_rec.id || '-' || clock_timestamp()::text),
            v_loan.id,
            v_rec.id,
            v_deduction,
            v_rec.month,
            v_rec.year,
            now()
          );

          UPDATE public.loans
          SET remaining_balance = v_new_balance,
              status = v_new_status
          WHERE id = v_loan.id;
        END IF;
      END IF;
    END IF;

    UPDATE public.payroll_records
    SET status = 'paid',
        paid_by = p_paid_by,
        paid_at = now(),
        payment_date = CURRENT_DATE,
        payment_method = p_method,
        transaction_ref = p_ref
    WHERE id = v_rec.id
    RETURNING * INTO v_updated;

    v_count := v_count + 1;
    v_total_net := v_total_net + COALESCE(v_updated.net_salary, 0);

    RETURN NEXT v_updated;
  END LOOP;

  IF v_count = 0 THEN
    RAISE EXCEPTION 'No approved payroll records found matching the selected IDs.';
  END IF;

  INSERT INTO public.audit_logs (
    id, user_id, user_name, action, module, details, created_at
  ) VALUES (
    'aud-' || md5(p_ref || '-' || clock_timestamp()::text),
    COALESCE(auth.uid()::text, p_paid_by),
    p_paid_by,
    'Disburse Salary Batch',
    'Payroll',
    format('Atomically disbursed %s payroll record(s) totaling %s via %s (Ref: %s)', v_count, v_total_net, upper(p_method), p_ref),
    now()
  );

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.disburse_payroll_batch(TEXT[], TEXT, TEXT, TEXT) TO authenticated, service_role;
