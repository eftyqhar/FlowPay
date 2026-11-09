import { create } from 'zustand';
import { AuditLogEntry } from '@/lib/types';
import { generateId } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { rowToAudit, auditToRow } from '@/lib/dbMappers';

interface AuditState {
  logs: AuditLogEntry[];
  isLoading: boolean;
  fetchLogs: () => Promise<void>;
  addLog: (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;
  getLogsByModule: (module: string) => AuditLogEntry[];
}

export const useAuditStore = create<AuditState>((set, get) => ({
  logs: [],
  isLoading: false,

  fetchLogs: async () => {
    try {
      set({ isLoading: true });
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      set({ logs: (data || []).map(rowToAudit), isLoading: false });
    } catch (err) {
      console.error('Error fetching audit logs from Supabase:', err);
      set({ isLoading: false });
    }
  },

  addLog: (entryData) => {
    const newEntry: AuditLogEntry = {
      ...entryData,
      id: generateId(),
      timestamp: new Date().toISOString(),
    };

    set((state) => ({
      logs: [newEntry, ...state.logs].slice(0, 500),
    }));

    supabase
      .from('audit_logs')
      .insert(auditToRow(newEntry))
      .then(({ error }) => {
        if (error) console.error('Failed to sync audit log to Supabase:', error);
      });
  },

  clearLogs: () => {
    set({ logs: [] });
    supabase
      .from('audit_logs')
      .delete()
      .neq('id', 'keep_all')
      .then(({ error }) => {
        if (error) console.error('Failed to clear audit logs in Supabase:', error);
      });
  },

  getLogsByModule: (module) => get().logs.filter((l) => l.module === module),
}));
