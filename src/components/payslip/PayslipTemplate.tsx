import { PayrollRecord } from '@/lib/types';
import { useSettingsStore } from '@/stores/settingsStore';
import { getMonthName, formatDate } from '@/lib/utils';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';

interface PayslipTemplateProps {
  payrollRecord: PayrollRecord;
  idSuffix?: string;
}

export function PayslipTemplate({ payrollRecord, idSuffix = '' }: PayslipTemplateProps) {
  const { settings } = useSettingsStore();

  const allowances = payrollRecord.allowances || 0;
  const houseRent = payrollRecord.breakdown?.houseRent ?? allowances * 0.5;
  const medical = payrollRecord.breakdown?.medical ?? allowances * 0.3;
  const transport = payrollRecord.breakdown?.transport ?? allowances * 0.2;

  const elementId = idSuffix ? `payslip-content-${idSuffix}` : 'payslip-content';

  return (
    <div
      id={elementId}
      className="bg-white p-8 text-slate-900 w-full max-w-3xl mx-auto font-sans border rounded-lg shadow-sm"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 bg-indigo-600 rounded-md flex items-center justify-center text-white font-bold text-sm">
              FP
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {settings.name || 'FlowPay Enterprise'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 max-w-sm">{settings.address}</p>
          <p className="text-xs text-slate-500">
            {settings.phone} • {settings.email}
          </p>
        </div>
        <div className="text-right">
          <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 font-bold text-sm rounded border border-indigo-100 uppercase tracking-wider mb-1">
            Official Payslip
          </span>
          <p className="text-sm font-semibold text-slate-700">
            {getMonthName(payrollRecord.month)} {payrollRecord.year}
          </p>
          <p className="text-xs text-slate-400">
            Issued: {formatDate(payrollRecord.paidAt || payrollRecord.createdAt)}
          </p>
        </div>
      </div>

      <hr className="border-slate-200 mb-6" />

      {/* Employee Info Box */}
      <div className="grid grid-cols-2 gap-4 mb-6 bg-slate-50 p-4 rounded-md border text-sm">
        <div className="space-y-1">
          <p>
            <span className="text-slate-500 text-xs uppercase tracking-wider font-semibold block">
              Employee Name:
            </span>
            <strong className="text-slate-900 text-base">{payrollRecord.employeeName}</strong>
          </p>
          <p className="text-slate-600 text-xs font-mono">
            ID: {payrollRecord.employeeId}
          </p>
        </div>
        <div className="space-y-1">
          <p>
            <span className="text-slate-500 text-xs uppercase tracking-wider font-semibold block">
              Department & Role:
            </span>
            <span className="text-slate-900 font-medium">
              {payrollRecord.department} — {payrollRecord.designation}
            </span>
          </p>
          <p className="text-slate-600 text-xs">
            Pay Period: {getMonthName(payrollRecord.month)} 1 – {getMonthName(payrollRecord.month)}{' '}
            {payrollRecord.year}
          </p>
        </div>
      </div>

      {/* Salary Details */}
      <div className="grid grid-cols-2 gap-8 mb-6">
        {/* Earnings */}
        <div>
          <h3 className="font-bold text-slate-800 mb-3 border-b pb-2 flex justify-between items-center text-sm">
            <span>Earnings</span>
            <span className="text-xs font-normal text-slate-500">Amount (৳)</span>
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Basic Salary</span>
              <span className="tabular-nums font-medium">
                <CurrencyDisplay amount={payrollRecord.basicSalary} />
              </span>
            </div>
            <div className="flex justify-between text-xs text-slate-500 pl-2">
              <span>• House Rent Allowance</span>
              <span className="tabular-nums">
                <CurrencyDisplay amount={houseRent} />
              </span>
            </div>
            <div className="flex justify-between text-xs text-slate-500 pl-2">
              <span>• Medical Allowance</span>
              <span className="tabular-nums">
                <CurrencyDisplay amount={medical} />
              </span>
            </div>
            <div className="flex justify-between text-xs text-slate-500 pl-2">
              <span>• Conveyance / Transport</span>
              <span className="tabular-nums">
                <CurrencyDisplay amount={transport} />
              </span>
            </div>

            {payrollRecord.bonus > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Festival / Performance Bonus</span>
                <span className="tabular-nums font-medium">
                  +<CurrencyDisplay amount={payrollRecord.bonus} />
                </span>
              </div>
            )}
            {payrollRecord.overtime > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Overtime Payment</span>
                <span className="tabular-nums font-medium">
                  +<CurrencyDisplay amount={payrollRecord.overtime} />
                </span>
              </div>
            )}
            <div className="flex justify-between font-bold pt-2 border-t mt-3 text-slate-900">
              <span>Gross Earnings</span>
              <span className="tabular-nums">
                <CurrencyDisplay amount={payrollRecord.grossSalary} />
              </span>
            </div>
          </div>
        </div>

        {/* Deductions */}
        <div>
          <h3 className="font-bold text-slate-800 mb-3 border-b pb-2 flex justify-between items-center text-sm">
            <span>Deductions</span>
            <span className="text-xs font-normal text-slate-500">Amount (৳)</span>
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Tax Withholding</span>
              <span className="tabular-nums text-red-600 font-medium">
                {payrollRecord.tax > 0 ? (
                  <>-<CurrencyDisplay amount={payrollRecord.tax} /></>
                ) : (
                  '৳0.00'
                )}
              </span>
            </div>

            {(payrollRecord.absentDays || payrollRecord.unpaidLeaveDays) &&
            ((payrollRecord.absentDays || 0) > 0 || (payrollRecord.unpaidLeaveDays || 0) > 0) ? (
              <div className="flex justify-between text-red-600">
                <span>
                  Absent / Unpaid Days ({payrollRecord.absentDays ?? payrollRecord.unpaidLeaveDays} days)
                </span>
                <span className="tabular-nums font-medium">
                  -<CurrencyDisplay amount={payrollRecord.absenceDeduction ?? payrollRecord.leaveDeduction ?? 0} />
                </span>
              </div>
            ) : null}

            {payrollRecord.loanDeduction && payrollRecord.loanDeduction > 0 ? (
              <div className="flex justify-between text-red-600">
                <span>Loan / Advance Installment</span>
                <span className="tabular-nums font-medium">
                  -<CurrencyDisplay amount={payrollRecord.loanDeduction} />
                </span>
              </div>
            ) : null}

            {payrollRecord.pfEmployeeDeduction && payrollRecord.pfEmployeeDeduction > 0 ? (
              <div className="flex justify-between text-red-600">
                <span>Provident Fund (Employee 8.33%)</span>
                <span className="tabular-nums font-medium">
                  -<CurrencyDisplay amount={payrollRecord.pfEmployeeDeduction} />
                </span>
              </div>
            ) : null}

            {payrollRecord.deductions > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Other Deductions</span>
                <span className="tabular-nums font-medium">
                  -<CurrencyDisplay amount={payrollRecord.deductions} />
                </span>
              </div>
            )}

            <div className="flex justify-between font-bold pt-2 border-t mt-3 text-red-700">
              <span>Total Deductions</span>
              <span className="tabular-nums">
                -<CurrencyDisplay amount={payrollRecord.totalDeductions} />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Net Salary Box */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-5 mb-6 flex justify-between items-center">
        <div>
          <h4 className="text-indigo-950 font-bold text-lg">Net Payable Amount</h4>
          <p className="text-xs text-indigo-700">Disbursed net salary for this month</p>
        </div>
        <div className="text-3xl font-bold text-indigo-700 tabular-nums">
          <CurrencyDisplay amount={payrollRecord.netSalary} />
        </div>
      </div>

      {/* Payment Voucher & Audit Info */}
      <div className="grid grid-cols-2 gap-4 text-xs text-slate-600 bg-slate-50 p-3 rounded-md border mb-8">
        <div>
          <p>
            <strong className="text-slate-700">Payment Status:</strong>{' '}
            <span className="capitalize">{payrollRecord.status}</span>
          </p>
          <p>
            <strong className="text-slate-700">Payment Method:</strong>{' '}
            {payrollRecord.paymentMethod?.replace('_', ' ').toUpperCase() || 'BANK TRANSFER'}
          </p>
        </div>
        <div>
          <p>
            <strong className="text-slate-700">Disbursement Date:</strong>{' '}
            {payrollRecord.paymentDate ? formatDate(payrollRecord.paymentDate) : 'Pending'}
          </p>
          {payrollRecord.transactionRef && (
            <p className="font-mono">
              <strong className="text-slate-700">Transaction Ref:</strong> {payrollRecord.transactionRef}
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[11px] text-slate-400 pt-4 border-t space-y-1">
        <p>This is a computer-generated payslip authenticated by FlowPay Enterprise Payroll System.</p>
        <p>For discrepancies, please reach out to HR & Finance within 7 business days.</p>
      </div>
    </div>
  );
}
