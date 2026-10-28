import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuditLogEntry } from '@/lib/types';
import { generateId } from '@/lib/utils';

interface AuditState {
  logs: AuditLogEntry[];
  addLog: (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;
  getLogsByModule: (module: string) => AuditLogEntry[];
}

export const useAuditStore = create<AuditState>()(
  persist(
    (set, get) => ({
      logs: [
        {
          id: 'log-001',
          timestamp: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
          userId: 'USR-002',
          userName: 'Fatima Khan (Admin)',
          action: 'Approve Payroll',
          module: 'Payroll',
          details: 'Approved September 2026 payroll batch for 16 employees',
        },
        {
          id: 'log-002',
          timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
          userId: 'USR-003',
          userName: 'Karim Islam (Accountant)',
          action: 'Disburse Salary',
          module: 'Payments',
          details: 'Executed bank transfer disbursement for 9 employees',
        },
      ],
      addLog: (entryData) =>
        set((state) => ({
          logs: [
            {
              ...entryData,
              id: generateId(),
              timestamp: new Date().toISOString(),
            },
            ...state.logs,
          ],
        })),
      clearLogs: () => set({ logs: [] }),
      getLogsByModule: (module) => get().logs.filter((l) => l.module === module),
    }),
    {
      name: 'flowpay-audit-logs',
    }
  )
);
