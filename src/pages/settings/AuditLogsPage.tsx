import React, { useState, useMemo } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Download, ShieldCheck, Search, Filter } from 'lucide-react';
import { useAuditStore } from '@/stores/auditStore';
import { formatDate } from '@/lib/utils';
import { exportToExcel, exportToCSV } from '@/lib/export';
import { AuditLogEntry } from '@/lib/types';

export default function AuditLogsPage() {
  const { logs } = useAuditStore();
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');

  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      const matchSearch =
        l.userName.toLowerCase().includes(search.toLowerCase()) ||
        l.action.toLowerCase().includes(search.toLowerCase()) ||
        l.details.toLowerCase().includes(search.toLowerCase());
      const matchModule = moduleFilter === 'all' || l.module === moduleFilter;
      return matchSearch && matchModule;
    });
  }, [logs, search, moduleFilter]);

  const uniqueModules = Array.from(new Set(logs.map((l) => l.module)));

  const handleExportCSV = () => {
    exportToCSV(filteredLogs as unknown as Record<string, unknown>[], 'flowpay_audit_log');
  };

  const handleExportExcel = () => {
    exportToExcel(filteredLogs as unknown as Record<string, unknown>[], 'flowpay_audit_log');
  };

  const columns = [
    {
      header: 'Timestamp',
      key: 'timestamp',
      cell: (item: AuditLogEntry) => (
        <span className="font-mono text-xs text-slate-500">{formatDate(item.timestamp)}</span>
      ),
    },
    {
      header: 'Authorized User',
      key: 'userName',
      cell: (item: AuditLogEntry) => (
        <span className="font-semibold text-slate-900">{item.userName}</span>
      ),
    },
    {
      header: 'Action',
      key: 'action',
      cell: (item: AuditLogEntry) => (
        <span className="font-medium text-slate-800">{item.action}</span>
      ),
    },
    {
      header: 'Module',
      key: 'module',
      cell: (item: AuditLogEntry) => (
        <Badge variant="outline" className="bg-slate-50 text-slate-700">
          {item.module}
        </Badge>
      ),
    },
    {
      header: 'Audit Event Details',
      key: 'details',
      cell: (item: AuditLogEntry) => (
        <span className="text-xs text-slate-600 max-w-md block">{item.details}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader
          title="System Audit & Security Logs"
          description="Traceable, tamper-evident record of sensitive financial, salary, and permission activities"
        />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-1.5" /> Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel}>
            <Download className="w-4 h-4 mr-1.5" /> Export Excel
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search user, action, or details..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>

          <Select value={moduleFilter} onValueChange={setModuleFilter}>
            <SelectTrigger className="w-full sm:w-[180px] bg-white">
              <SelectValue placeholder="Filter Module" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modules</SelectItem>
              {uniqueModules.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" /> Audit Log Entries ({filteredLogs.length})
          </CardTitle>
          <CardDescription>
            Chronological audit stream preserving user identifiers and action parameters.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable data={filteredLogs} columns={columns} />
        </CardContent>
      </Card>
    </div>
  );
}
