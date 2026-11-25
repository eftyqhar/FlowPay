import { useState, useMemo, useEffect } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FileText, Download, Search } from 'lucide-react';
import { usePayrollStore } from '@/stores/payrollStore';
import { useAuthStore } from '@/stores/authStore';
import { useEmployeeStore } from '@/stores/employeeStore';
import { PayrollRecord } from '@/lib/types';
import { getMonthName } from '@/lib/utils';
import { exportToPDF } from '@/lib/export';
import { PayslipPreviewDialog } from '@/components/payslip/PayslipPreviewDialog';
import { PayslipTemplate } from '@/components/payslip/PayslipTemplate';
import { toast } from 'sonner';

export default function AllPayslipsPage() {
  const { payrollRecords: payrolls } = usePayrollStore();
  const { currentUser } = useAuthStore();
  const { employees } = useEmployeeStore();

  const [search, setSearch] = useState('');
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterYear, setFilterYear] = useState('all');

  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [pdfTargetRecord, setPdfTargetRecord] = useState<PayrollRecord | null>(null);

  const isEmployee = currentUser?.role === 'employee';
  const myEmployee = isEmployee
    ? employees.find(
        (e) =>
          e.employeeId === currentUser?.employeeId ||
          e.email.toLowerCase() === currentUser?.email.toLowerCase()
      )
    : null;

  // Paid records generate payslips
  const paidPayrolls = useMemo(
    () => payrolls.filter((p) => p.status === 'paid'),
    [payrolls]
  );

  const filteredPayrolls = useMemo(() => {
    return paidPayrolls
      .filter((p) => {
        // Enforce employee sees only own payslips
        if (isEmployee) {
          if (!myEmployee || p.employeeId !== myEmployee.id) return false;
        }

        const matchSearch =
          p.employeeName.toLowerCase().includes(search.toLowerCase()) ||
          p.employeeId.toLowerCase().includes(search.toLowerCase());
        const matchMonth = filterMonth === 'all' || p.month.toString() === filterMonth;
        const matchYear = filterYear === 'all' || p.year.toString() === filterYear;

        return matchSearch && matchMonth && matchYear;
      })
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        if (a.month !== b.month) return b.month - a.month;
        return a.employeeName.localeCompare(b.employeeName);
      });
  }, [paidPayrolls, search, filterMonth, filterYear, isEmployee, myEmployee]);

  const uniqueYears = Array.from(new Set(paidPayrolls.map((p) => p.year))).sort((a, b) => b - a);

  const handlePreview = (record: PayrollRecord) => {
    setSelectedRecord(record);
    setPreviewOpen(true);
  };

  useEffect(() => {
    if (!pdfTargetRecord) return;

    let cancelled = false;
    const runExport = async () => {
      // Wait for React commit + browser layout frame
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      if (cancelled) return;

      const elementId = `payslip-content-pdf-${pdfTargetRecord.id}`;
      try {
        toast.info(`Generating PDF for ${pdfTargetRecord.employeeName}...`);
        const filename = `Payslip_${pdfTargetRecord.employeeName.replace(/\s+/g, '_')}_${getMonthName(pdfTargetRecord.month)}_${pdfTargetRecord.year}`;
        await exportToPDF(elementId, filename);
        toast.success('Payslip downloaded successfully');
      } catch (err) {
        console.error(err);
        toast.error('Failed to export PDF');
      } finally {
        if (!cancelled) {
          setDownloadingId(null);
          setPdfTargetRecord(null);
        }
      }
    };

    runExport();
    return () => {
      cancelled = true;
    };
  }, [pdfTargetRecord]);

  const handleDownloadPdf = (record: PayrollRecord) => {
    if (downloadingId) return;
    setDownloadingId(record.id);
    setPdfTargetRecord(record);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEmployee ? 'My Payslips' : 'Payslips Directory'}
        description={
          isEmployee
            ? 'View and download your monthly official payslips'
            : 'Access and download finalized salary payslips across the organization'
        }
      />

      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search employee or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={filterMonth} onValueChange={setFilterMonth}>
            <SelectTrigger>
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
          <Select value={filterYear} onValueChange={setFilterYear}>
            <SelectTrigger>
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {uniqueYears.map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead>Employee</TableHead>
                <TableHead>Pay Period</TableHead>
                <TableHead className="text-right">Net Payable</TableHead>
                <TableHead>Payment Method & Ref</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayrolls.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                    No finalized payslips found matching your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayrolls.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="font-semibold text-slate-900">{record.employeeName}</div>
                      <div className="text-xs text-slate-500">
                        {record.employeeId} • {record.department}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-slate-800">
                        {getMonthName(record.month)} {record.year}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-bold text-slate-900">
                      <CurrencyDisplay amount={record.netSalary} />
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      <p className="font-medium uppercase">
                        {record.paymentMethod?.replace('_', ' ') || 'BANK TRANSFER'}
                      </p>
                      {record.transactionRef && (
                        <p className="font-mono text-slate-400">{record.transactionRef}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handlePreview(record)}>
                        <FileText className="h-4 w-4 mr-1.5 text-indigo-600" /> Preview
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={downloadingId === record.id}
                        onClick={() => handleDownloadPdf(record)}
                      >
                        <Download className="h-4 w-4 mr-1.5" /> PDF
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Dedicated off-screen render container for direct 1-click PDF download */}
      {pdfTargetRecord && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            left: '-10000px',
            top: 0,
            width: '800px',
            pointerEvents: 'none',
            zIndex: -1,
          }}
        >
          <PayslipTemplate
            payrollRecord={pdfTargetRecord}
            idSuffix={`pdf-${pdfTargetRecord.id}`}
          />
        </div>
      )}

      {previewOpen && selectedRecord && (
        <PayslipPreviewDialog
          payrollRecord={selectedRecord}
          open={previewOpen}
          onOpenChange={setPreviewOpen}
        />
      )}
    </div>
  );
}
