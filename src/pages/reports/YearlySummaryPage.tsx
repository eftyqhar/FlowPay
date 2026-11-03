import React, { useState, useMemo } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, Wallet, Users, TrendingUp, BarChart3 } from 'lucide-react';
import { usePayrollStore } from '@/stores/payrollStore';
import { formatCurrency, getMonthName } from '@/lib/utils';
import { DataTable } from '@/components/shared/DataTable';
import { exportToExcel } from '@/lib/export';

export default function YearlySummaryPage() {
  const { payrollRecords: payrolls } = usePayrollStore();
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());

  const uniqueYears = useMemo(() => {
    const set = new Set(payrolls.map((p) => p.year));
    set.add(new Date().getFullYear());
    return Array.from(set).sort((a, b) => b - a);
  }, [payrolls]);

  const yearData = useMemo(() => {
    return payrolls.filter(p => p.year.toString() === year);
  }, [payrolls, year]);

  const kpi = useMemo(() => {
    let gross = 0;
    let net = 0;
    const emps = new Set<string>();
    yearData.forEach(p => {
      gross += p.grossSalary;
      net += p.netSalary;
      emps.add(p.employeeId);
    });
    return {
      totalPayroll: net,
      totalGross: gross,
      totalEmployees: emps.size,
      avgMonthly: net / 12,
      avgSalary: emps.size ? net / (emps.size * 12) : 0
    };
  }, [yearData]);

  const monthlyData = useMemo(() => {
    const mData = Array.from({length: 12}, (_, i) => ({
      month: i + 1,
      monthName: getMonthName(i + 1),
      employees: 0,
      totalGross: 0,
      totalDeductions: 0,
      totalNet: 0,
      paid: 0,
      pending: 0
    }));

    yearData.forEach(p => {
      const idx = p.month - 1;
      if (idx >= 0 && idx < 12) {
        mData[idx].employees += 1;
        mData[idx].totalGross += p.grossSalary;
        mData[idx].totalDeductions += p.totalDeductions;
        mData[idx].totalNet += p.netSalary;
        if (p.status === 'paid') mData[idx].paid += p.netSalary;
        if (p.status !== 'paid') mData[idx].pending += p.netSalary;
      }
    });

    return mData;
  }, [yearData]);

  const quarters = useMemo(() => {
    const q = [0, 0, 0, 0];
    monthlyData.forEach((m, i) => {
      const qIdx = Math.floor(i / 3);
      q[qIdx] += m.totalNet;
    });
    return q;
  }, [monthlyData]);

  const columns = [
    { header: 'Month', key: 'monthName' },
    { header: 'Employees', key: 'employees' },
    { header: 'Total Gross', key: 'totalGross', cell: (item: any) => formatCurrency(item.totalGross) },
    { header: 'Total Deductions', key: 'totalDeductions', cell: (item: any) => formatCurrency(item.totalDeductions) },
    { header: 'Total Net', key: 'totalNet', cell: (item: any) => formatCurrency(item.totalNet) },
    { header: 'Paid', key: 'paid', cell: (item: any) => formatCurrency(item.paid) },
    { header: 'Pending', key: 'pending', cell: (item: any) => formatCurrency(item.pending) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader title="Yearly Summary" description={`Payroll summary for ${year}`} />
        <div className="flex gap-4">
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-[120px] bg-white"><SelectValue placeholder="Year" /></SelectTrigger>
            <SelectContent>
              {uniqueYears.map(y => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => exportToExcel(monthlyData, `yearly-summary-${year}`)}><Download className="w-4 h-4 mr-2"/> Export</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Payroll Expenditure" value={formatCurrency(kpi.totalPayroll)} icon={Wallet} />
        <StatCard title="Total Employees" value={kpi.totalEmployees.toString()} icon={Users} />
        <StatCard title="Avg Monthly Payroll" value={formatCurrency(kpi.avgMonthly)} icon={TrendingUp} />
        <StatCard title="Avg Salary" value={formatCurrency(kpi.avgSalary)} icon={BarChart3} />
      </div>

      <Card>
        <CardHeader><CardTitle>Monthly Trend</CardTitle></CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="monthName" />
              <YAxis />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Line type="monotone" dataKey="totalGross" stroke="#8884d8" name="Gross Salary" />
              <Line type="monotone" dataKey="totalNet" stroke="#82ca9d" name="Net Salary" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {quarters.map((amt, i) => (
          <Card key={i}>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Q{i+1} Total</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{formatCurrency(amt)}</p></CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Monthly Breakdown</CardTitle></CardHeader>
        <CardContent>
          <DataTable data={monthlyData} columns={columns} />
        </CardContent>
      </Card>
    </div>
  );
}
