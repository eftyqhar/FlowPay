import { create } from 'zustand';
import { AttendanceRecord, LeaveRequest } from '@/lib/types';
import { generateId, getLocalDateString } from '@/lib/utils';
import { useEmployeeStore } from './employeeStore';
import { supabase } from '@/lib/supabase';
import {
  rowToAttendance,
  attendanceToRow,
  rowToLeave,
  leaveToRow,
} from '@/lib/dbMappers';
import { toast } from 'sonner';

interface AttendanceState {
  attendanceRecords: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  isLoading: boolean;
  fetchAttendanceAndLeaves: () => Promise<void>;
  recordAttendance: (record: Omit<AttendanceRecord, 'id'>) => Promise<void>;
  bulkRecordAttendance: (records: Omit<AttendanceRecord, 'id'>[]) => Promise<void>;
  correctAttendance: (
    id: string,
    updates: Partial<AttendanceRecord>,
    correctedBy: string
  ) => Promise<void>;
  checkIn: (employeeId: string, employeeName: string) => Promise<void>;
  checkOut: (employeeId: string) => Promise<void>;
  applyLeave: (leave: Omit<LeaveRequest, 'id' | 'appliedAt' | 'status'>) => Promise<void>;
  approveLeave: (id: string, approvedBy: string) => Promise<void>;
  rejectLeave: (id: string, rejectionReason: string, rejectedBy: string) => Promise<void>;
  getAttendanceByDate: (date: string) => AttendanceRecord[];
  getAttendanceByEmployee: (employeeId: string) => AttendanceRecord[];
  getMonthlyEmployeeSummary: (employeeId: string, month: number, year: number) => {
    present: number;
    absent: number;
    late: number;
    earlyCheckout: number;
    halfDay: number;
    onLeave: number;
    unpaidLeaveDays: number;
    overtimeHours: number;
  };
}

function parseLocalDateOnly(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
    return new Date(y, m - 1, d, 0, 0, 0, 0);
  }
  const parsed = new Date(dateStr);
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 0, 0, 0, 0);
}

export const useAttendanceStore = create<AttendanceState>((set, get) => ({
  attendanceRecords: [],
  leaveRequests: [],
  isLoading: false,

  fetchAttendanceAndLeaves: async () => {
    try {
      set({ isLoading: true });
      const [attRes, leaveRes] = await Promise.all([
        supabase.from('attendance_records').select('*').order('date', { ascending: false }),
        supabase.from('leave_requests').select('*').order('applied_at', { ascending: false }),
      ]);

      if (attRes.error) throw attRes.error;
      if (leaveRes.error) throw leaveRes.error;

      set({
        attendanceRecords: (attRes.data || []).map(rowToAttendance),
        leaveRequests: (leaveRes.data || []).map(rowToLeave),
        isLoading: false,
      });
    } catch (err: any) {
      console.error('Error fetching attendance & leaves:', err);
      toast.error(err?.message || 'Failed to load attendance and leave records');
      set({ isLoading: false });
    }
  },

  recordAttendance: async (recordData) => {
    const previousRecords = get().attendanceRecords;
    const existing = previousRecords.find(
      (r) => r.employeeId === recordData.employeeId && r.date === recordData.date
    );

    const recordId = existing ? existing.id : generateId();
    const fullRecord: AttendanceRecord = { ...recordData, id: recordId };

    set((state) => ({
      attendanceRecords: existing
        ? state.attendanceRecords.map((r) => (r.id === existing.id ? fullRecord : r))
        : [fullRecord, ...state.attendanceRecords],
    }));

    const { error } = await supabase
      .from('attendance_records')
      .upsert(attendanceToRow(fullRecord));

    if (error) {
      set({ attendanceRecords: previousRecords });
      toast.error(`Failed to save attendance record: ${error.message}`);
      throw new Error(error.message);
    }
  },

  bulkRecordAttendance: async (records) => {
    const previousRecords = get().attendanceRecords;
    const fullRecords: AttendanceRecord[] = records.map((r) => {
      const match = previousRecords.find(
        (e) => e.employeeId === r.employeeId && e.date === r.date
      );
      return { ...r, id: match ? match.id : generateId() };
    });

    const fullRecordIds = new Set(fullRecords.map((r) => r.id));
    const filteredExisting = previousRecords.filter((r) => !fullRecordIds.has(r.id));

    set({
      attendanceRecords: [...fullRecords, ...filteredExisting],
    });

    const { error } = await supabase
      .from('attendance_records')
      .upsert(fullRecords.map(attendanceToRow));

    if (error) {
      set({ attendanceRecords: previousRecords });
      toast.error(`Failed to save bulk attendance: ${error.message}`);
      throw new Error(error.message);
    }
  },

  correctAttendance: async (id, updates, correctedBy) => {
    const previousRecords = get().attendanceRecords;
    const existing = previousRecords.find((r) => r.id === id);
    if (!existing) return;

    const updatedRecord: AttendanceRecord = {
      ...existing,
      ...updates,
      manualCorrection: true,
      correctedBy,
    };

    set((state) => ({
      attendanceRecords: state.attendanceRecords.map((r) =>
        r.id === id ? updatedRecord : r
      ),
    }));

    const { error } = await supabase
      .from('attendance_records')
      .update(attendanceToRow(updatedRecord))
      .eq('id', id);

    if (error) {
      set({ attendanceRecords: previousRecords });
      toast.error(`Failed to update attendance record: ${error.message}`);
      throw new Error(error.message);
    }
  },

  checkIn: async (employeeId, employeeName) => {
    const today = getLocalDateString();
    const now = new Date();
    const hours = now.getHours();
    const mins = now.getMinutes();
    const nowTime = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;

    // Mark as late if checked in after 09:15 (09:00 office baseline + 15m grace)
    const isLate = hours > 9 || (hours === 9 && mins > 15);

    await get().recordAttendance({
      employeeId,
      employeeName,
      date: today,
      checkIn: nowTime,
      status: isLate ? 'late' : 'present',
      lateCheckIn: isLate,
    });
  },

  checkOut: async (employeeId) => {
    const today = getLocalDateString();
    const existing = get().attendanceRecords.find(
      (r) => r.employeeId === employeeId && r.date === today
    );

    if (!existing) return;

    const now = new Date();
    const hours = now.getHours();
    const mins = now.getMinutes();
    const nowTime = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;

    // Early check-out if before standard working hours (before 17:00 / 5:00 PM for standard 8h day)
    const isEarly = hours < 17;

    await get().correctAttendance(
      existing.id,
      {
        checkOut: nowTime,
        earlyCheckOut: isEarly,
        status: existing.status === 'present' && isEarly ? 'early_checkout' : existing.status,
      },
      'System'
    );
  },

  applyLeave: async (leave) => {
    const previousLeaves = get().leaveRequests;
    const newLeave: LeaveRequest = {
      ...leave,
      id: generateId(),
      appliedAt: new Date().toISOString(),
      status: 'pending',
    };

    set((state) => ({
      leaveRequests: [newLeave, ...state.leaveRequests],
    }));

    const { error } = await supabase.from('leave_requests').insert(leaveToRow(newLeave));
    if (error) {
      set({ leaveRequests: previousLeaves });
      toast.error(`Failed to submit leave request: ${error.message}`);
      throw new Error(error.message);
    }
  },

  approveLeave: async (id, approvedBy) => {
    const previousLeaves = get().leaveRequests;
    const leave = previousLeaves.find((l) => l.id === id);
    if (!leave) return;

    const approvedAt = new Date().toISOString();
    set((state) => ({
      leaveRequests: state.leaveRequests.map((l) =>
        l.id === id ? { ...l, status: 'approved', approvedBy, approvedAt } : l
      ),
    }));

    const { error } = await supabase
      .from('leave_requests')
      .update({
        status: 'approved',
        approved_by: approvedBy,
        approved_at: approvedAt,
      })
      .eq('id', id);

    if (error) {
      set({ leaveRequests: previousLeaves });
      toast.error(`Failed to approve leave request: ${error.message}`);
      throw new Error(error.message);
    }

    if (leave.leaveType !== 'unpaid') {
      await useEmployeeStore
        .getState()
        .deductLeaveBalance(leave.employeeId, leave.leaveType as 'casual' | 'sick' | 'annual', leave.daysCount);
    }
  },

  rejectLeave: async (id, rejectionReason, rejectedBy) => {
    const previousLeaves = get().leaveRequests;

    set((state) => ({
      leaveRequests: state.leaveRequests.map((l) =>
        l.id === id ? { ...l, status: 'rejected', rejectionReason, approvedBy: rejectedBy } : l
      ),
    }));

    const { error } = await supabase
      .from('leave_requests')
      .update({
        status: 'rejected',
        rejection_reason: rejectionReason,
        approved_by: rejectedBy,
      })
      .eq('id', id);

    if (error) {
      set({ leaveRequests: previousLeaves });
      toast.error(`Failed to reject leave request: ${error.message}`);
      throw new Error(error.message);
    }
  },

  getAttendanceByDate: (date) => {
    return get().attendanceRecords.filter((r) => r.date === date);
  },

  getAttendanceByEmployee: (employeeId) => {
    return get().attendanceRecords.filter((r) => r.employeeId === employeeId);
  },

  getMonthlyEmployeeSummary: (employeeId, month, year) => {
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    const employeeRecords = get().attendanceRecords.filter(
      (r) => r.employeeId === employeeId && r.date.startsWith(prefix)
    );

    const summary = {
      present: 0,
      absent: 0,
      late: 0,
      earlyCheckout: 0,
      halfDay: 0,
      onLeave: 0,
      unpaidLeaveDays: 0,
      overtimeHours: 0,
    };

    const standardDailyHours = 8;

    employeeRecords.forEach((r) => {
      if (r.status === 'present') summary.present++;
      else if (r.status === 'absent') summary.absent++;
      else if (r.status === 'late') summary.late++;
      else if (r.status === 'early_checkout') {
        summary.present++;
        summary.earlyCheckout++;
      } else if (r.status === 'half_day') summary.halfDay++;
      else if (r.status === 'on_leave') summary.onLeave++;

      if (r.lateCheckIn && r.status !== 'late') summary.late++;
      if (r.earlyCheckOut && r.status !== 'early_checkout') summary.earlyCheckout++;

      if (r.checkIn && r.checkOut) {
        const [inH, inM] = r.checkIn.split(':').map(Number);
        const [outH, outM] = r.checkOut.split(':').map(Number);
        if (!isNaN(inH) && !isNaN(outH)) {
          const totalDurationHours = (outH * 60 + outM - (inH * 60 + inM)) / 60;
          if (totalDurationHours > standardDailyHours) {
            summary.overtimeHours += Math.round((totalDurationHours - standardDailyHours) * 10) / 10;
          }
        }
      }
    });

    // Calculate unpaid leave days for this month using midnight-aligned local dates
    const monthStart = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const monthEnd = new Date(year, month, 0, 0, 0, 0, 0);

    const approvedUnpaidLeaves = get().leaveRequests.filter(
      (l) => l.employeeId === employeeId && l.status === 'approved' && l.leaveType === 'unpaid'
    );

    approvedUnpaidLeaves.forEach((l) => {
      const lStart = parseLocalDateOnly(l.startDate);
      const lEnd = parseLocalDateOnly(l.endDate);

      const overlapStart = lStart > monthStart ? lStart : monthStart;
      const overlapEnd = lEnd < monthEnd ? lEnd : monthEnd;

      if (overlapStart <= overlapEnd) {
        const diffDays =
          Math.round((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        summary.unpaidLeaveDays += Math.min(diffDays, l.daysCount);
      }
    });

    return summary;
  },
}));
