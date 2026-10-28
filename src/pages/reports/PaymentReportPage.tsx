import React, { useState, useMemo } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Download, CreditCard, CheckCircle2, Clock } from 'lucide-react';
import { usePayrollStore } from '@/stores/payrollStore';
import { useEmployeeStore } from '@/stores/employeeStore';
import { formatCurrency, getMonthName, formatDate } from '@/lib/utils';
import { DataTable } from '@/components/shared/DataTable';
import { exportToExcel } from '@/lib/export';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/shared/StatusBadge';

const STATUS_COLORS = { paid: '#10b981', pending: '#f59e0b', draft: '#64748b' };
const METHOD_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6'];

export default function PaymentReportPage() {
  const { payrollRecords: payrolls } = usePayrollStore();
  const { employees } = useEmployeeStore();

  const [month, setMonth] = useState<string>('all');
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [methodFilter, setMethodFilter] = useState('all');

  const filteredData = useMemo(() => {
    return payrolls.filter((p) => {
      const matchMonth = month === 'all' || p.month.toString() === month;
      const matchYear = p.year.toString() === year;
      const matchMethod = methodFilter === 'all' || p.paymentMethod === methodFilter;
      return matchMonth && matchYear && matchMethod;
    });
  }, [payrolls, month, year, methodFilter]);

  const summary = useMemo(() => {
    const s = { paid: 0, approved: 0, draft: 0, total: 0 };
    filteredData.forEach((p) => {
      if (p.status === 'paid') s.paid += p.netSalary;
      else if (p.status === 'approved') s.approved += p.netSalary;
      else if (p.status === 'draft') s.draft += p.netSalary;
      s.total += p.netSalary;
    });
    return s;
  }, [filteredData]);

  const methodSummary = useMemo(() => {
    const m: Record<string, number> = {};
    filteredData
      .filter((p) => p.status === 'paid')
      .forEach((p) => {
        const method = p.paymentMethod
          ? p.paymentMethod.replace('_', ' ').toUpperCase()
          : 'UNKNOWN';
        m[method] = (m[method] || 0) + p.netSalary;
      });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  const tableData = useMemo(() => {
    return filteredData.map((p) => {
      return {
        id: p.id,
        name: p.employeeName,
        month: `${getMonthName(p.month)} ${p.year}`,
        net: p.netSalary,
        status: p.status,
        method: p.paymentMethod ? p.paymentMethod.replace('_', ' ').toUpperCase() : 'PENDING',
        ref: p.transactionRef || '-',
        date: p.paymentDate ? formatDate(p.paymentDate) : '-',
      };
    });
  }, [filteredData]);

  const columns = [
    { header: 'Employee', key: 'name' },
    { header: 'Pay Period', key: 'month' },
    {
      header: 'Net Payable',
      key: 'net',
      cell: (item: any) => (
        <span className="font-bold tabular-nums text-slate-900">{formatCurrency(item.net)}</span>
      ),
    },
    {
      header: 'Disbursement Status',
      key: 'status',
      cell: (item: any) => <StatusBadge status={item.status} />,
    },
    { header: 'Payment Method', key: 'method' },
    {
      header: 'Transaction Ref',
      key: 'ref',
      cell: (item: any) => <span className="font-mono text-xs text-slate-500">{item.ref}</span>,
    },
    { header: 'Disbursed On', key: 'date' },
  ];

  const uniqueYears = Array.from(new Set(payrolls.map((p) => p.year))).sort((a, b) => b - a);
  if (!uniqueYears.includes(new Date().getFullYear())) {
    uniqueYears.push(new Date().getFullYear());
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader
          title="Payment & Disbursement Report"
          description="Detailed breakdown of paid vs pending payouts and payment reconciliation"
        />
        <Button variant="outline" size="sm" onClick={() => exportToExcel(tableData, 'payment_report')}>
          <Download className="w-4 h-4 mr-2" /> Export Excel
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 flex flex-wrap gap-3">
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-[160px] bg-white">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Months</SelectItem>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <SelectItem key={m} value={m.toString()}>
                  {getMonthName(m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-[140px] bg-white">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {uniqueYears.map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={methodFilter} onValueChange={setMethodFilter}>
            <SelectTrigger className="w-[180px] bg-white">
              <SelectValue placeholder="Payment Method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              <SelectItem value="mobile_banking">Mobile Banking</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="check">Check</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-emerald-50 border-emerald-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-emerald-800 flex items-center justify-between">
              <span>Disbursed & Paid</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-700 tabular-nums">
              {formatCurrency(summary.paid)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-amber-50 border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-amber-800 flex items-center justify-between">
              <span>Approved (Awaiting Payout)</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-700 tabular-nums">
              {formatCurrency(summary.approved)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-50 border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-800 flex items-center justify-between">
              <span>Draft Amount</span>
              <CreditCard className="w-4 h-4 text-slate-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-700 tabular-nums">
              {formatCurrency(summary.draft)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Payment Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Disbursed', value: summary.paid },
                    { name: 'Approved', value: summary.approved },
                    { name: 'Draft', value: summary.draft },
                  ]}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={4}
                >
                  <Cell fill={STATUS_COLORS.paid} />
                  <Cell fill={STATUS_COLORS.pending} />
                  <Cell fill={STATUS_COLORS.draft} />
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Disbursement Channels</CardTitle>
          </CardHeader>
          <CardContent className="h-[240px]">
            {methodSummary.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={methodSummary}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                  >
                    {methodSummary.map((_, idx) => (
                      <Cell key={`cell-${idx}`} fill={METHOD_COLORS[idx % METHOD_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400 text-sm">
                No disbursed payments in this range.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Payment Ledger & Reconciliation ({tableData.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable data={tableData} columns={columns} />
        </CardContent>
      </Card>
    </div>
  );
}
