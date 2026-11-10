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

interface AttendanceState {
  attendanceRecords: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  isLoading: boolean;
  fetchAttendanceAndLeaves: () => Promise<void>;
  recordAttendance: (record: Omit<AttendanceRecord, 'id'>) => void;
  bulkRecordAttendance: (records: Omit<AttendanceRecord, 'id'>[]) => void;
  correctAttendance: (id: string, updates: Partial<AttendanceRecord>, correctedBy: string) => void;
  checkIn: (employeeId: string, employeeName: string) => void;
  checkOut: (employeeId: string) => void;
  applyLeave: (leave: Omit<LeaveRequest, 'id' | 'appliedAt' | 'status'>) => void;
  approveLeave: (id: string, approvedBy: string) => void;
  rejectLeave: (id: string, rejectionReason: string, rejectedBy: string) => void;
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

      set({
        attendanceRecords: (attRes.data || []).map(rowToAttendance),
        leaveRequests: (leaveRes.data || []).map(rowToLeave),
        isLoading: false,
      });
    } catch (err) {
      console.error('Error fetching attendance & leaves:', err);
      set({ isLoading: false });
    }
  },

  recordAttendance: (recordData) => {
    const existing = get().attendanceRecords.find(
      (r) => r.employeeId === recordData.employeeId && r.date === recordData.date
    );

    const recordId = existing ? existing.id : generateId();
    const fullRecord: AttendanceRecord = { ...recordData, id: recordId };

    set((state) => ({
      attendanceRecords: existing
        ? state.attendanceRecords.map((r) => (r.id === existing.id ? fullRecord : r))
        : [fullRecord, ...state.attendanceRecords],
    }));

    supabase
      .from('attendance_records')
      .upsert(attendanceToRow(fullRecord))
      .then(({ error }) => {
        if (error) console.error('Failed to sync attendance to Supabase:', error);
      });
  },

  bulkRecordAttendance: (records) => {
    const existing = get().attendanceRecords;
    const fullRecords: AttendanceRecord[] = records.map((r) => {
      const match = existing.find((e) => e.employeeId === r.employeeId && e.date === r.date);
      return { ...r, id: match ? match.id : generateId() };
    });

    const fullRecordIds = new Set(fullRecords.map((r) => r.id));
    const filteredExisting = existing.filter((r) => !fullRecordIds.has(r.id));

    set({
      attendanceRecords: [...fullRecords, ...filteredExisting],
    });

    supabase
      .from('attendance_records')
      .upsert(fullRecords.map(attendanceToRow))
      .then(({ error }) => {
        if (error) console.error('Failed to sync bulk attendance to Supabase:', error);
      });
  },

  correctAttendance: (id, updates, correctedBy) => {
    set((state) => ({
      attendanceRecords: state.attendanceRecords.map((r) =>
        r.id === id ? { ...r, ...updates, manualCorrection: true, correctedBy } : r
      ),
    }));

    const rec = get().attendanceRecords.find((r) => r.id === id);
    if (rec) {
      supabase
        .from('attendance_records')
        .update(attendanceToRow(rec))
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.error('Failed to update attendance correction in Supabase:', error);
        });
    }
  },

  checkIn: (employeeId, employeeName) => {
    const today = getLocalDateString();
    const now = new Date();
    const hours = now.getHours();
    const mins = now.getMinutes();
    const nowTime = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;

    // Mark as late if checked in after 09:15 (09:00 office baseline + 15m grace)
    const isLate = hours > 9 || (hours === 9 && mins > 15);

    get().recordAttendance({
      employeeId,
      employeeName,
      date: today,
      checkIn: nowTime,
      status: isLate ? 'late' : 'present',
      lateCheckIn: isLate,
    });
  },

  checkOut: (employeeId) => {
    const today = getLocalDateString();
    const existing = get().attendanceRecords.find(
      (r) => r.employeeId === employeeId && r.date === today
    );

    if (existing) {
      const now = new Date();
      const hours = now.getHours();
      const mins = now.getMinutes();
      const nowTime = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;

      // Early check-out if before standard working hours (before 17:00 / 5:00 PM for standard 8h day)
      const isEarly = hours < 17;

      get().correctAttendance(
        existing.id,
        {
          checkOut: nowTime,
          earlyCheckOut: isEarly,
          status: existing.status === 'present' && isEarly ? 'early_checkout' : existing.status,
        },
        'System'
      );
    }
  },

  applyLeave: (leave) => {
    const newLeave: LeaveRequest = {
      ...leave,
      id: generateId(),
      appliedAt: new Date().toISOString(),
      status: 'pending',
    };

    set((state) => ({
      leaveRequests: [newLeave, ...state.leaveRequests],
    }));

    supabase
      .from('leave_requests')
      .insert(leaveToRow(newLeave))
      .then(({ error }) => {
        if (error) console.error('Failed to sync leave request to Supabase:', error);
      });
  },

  approveLeave: (id, approvedBy) => {
    const leave = get().leaveRequests.find((l) => l.id === id);
    if (!leave) return;

    const approvedAt = new Date().toISOString();
    set((state) => ({
      leaveRequests: state.leaveRequests.map((l) =>
        l.id === id ? { ...l, status: 'approved', approvedBy, approvedAt } : l
      ),
    }));

    supabase
      .from('leave_requests')
      .update({
        status: 'approved',
        approved_by: approvedBy,
        approved_at: approvedAt,
      })
      .eq('id', id)
      .then(({ error }) => {
        if (error) console.error('Failed to update leave approval in Supabase:', error);
      });

    // Deduct leave balance if paid leave
    if (leave.leaveType !== 'unpaid') {
      useEmployeeStore
        .getState()
        .deductLeaveBalance(leave.employeeId, leave.leaveType as any, leave.daysCount);
    }
  },

  rejectLeave: (id, rejectionReason, rejectedBy) => {
    set((state) => ({
      leaveRequests: state.leaveRequests.map((l) =>
        l.id === id ? { ...l, status: 'rejected', rejectionReason, approvedBy: rejectedBy } : l
      ),
    }));

    supabase
      .from('leave_requests')
      .update({
        status: 'rejected',
        rejection_reason: rejectionReason,
        approved_by: rejectedBy,
      })
      .eq('id', id)
      .then(({ error }) => {
        if (error) console.error('Failed to update leave rejection in Supabase:', error);
      });
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
      }
      else if (r.status === 'half_day') summary.halfDay++;
      else if (r.status === 'on_leave') summary.onLeave++;

      if (r.lateCheckIn && r.status !== 'late') summary.late++;
      if (r.earlyCheckOut && r.status !== 'early_checkout') summary.earlyCheckout++;

      // Detect overtime based on Daily Working Hours (default 8h)
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

    // Calculate unpaid leave days for this month
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

    const approvedUnpaidLeaves = get().leaveRequests.filter(
      (l) => l.employeeId === employeeId && l.status === 'approved' && l.leaveType === 'unpaid'
    );

    approvedUnpaidLeaves.forEach((l) => {
      const lStart = new Date(l.startDate);
      const lEnd = new Date(l.endDate);

      const overlapStart = lStart > monthStart ? lStart : monthStart;
      const overlapEnd = lEnd < monthEnd ? lEnd : monthEnd;

      if (overlapStart <= overlapEnd) {
        const diffTime = Math.abs(overlapEnd.getTime() - overlapStart.getTime());
        const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        summary.unpaidLeaveDays += Math.min(days, l.daysCount);
      }
    });

    return summary;
  },
}));
