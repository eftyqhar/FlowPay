import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AttendanceRecord, LeaveRequest, AttendanceStatus } from '@/lib/types';
import { generateId, getLocalDateString } from '@/lib/utils';
import { useEmployeeStore } from './employeeStore';

interface AttendanceState {
  attendanceRecords: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
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
    halfDay: number;
    onLeave: number;
    unpaidLeaveDays: number;
  };
}

export const useAttendanceStore = create<AttendanceState>()(
  persist(
    (set, get) => ({
      attendanceRecords: [],
      leaveRequests: [],
      recordAttendance: (recordData) =>
        set((state) => {
          // Check if already exists for employee and date
          const existing = state.attendanceRecords.find(
            (r) => r.employeeId === recordData.employeeId && r.date === recordData.date
          );
          if (existing) {
            return {
              attendanceRecords: state.attendanceRecords.map((r) =>
                r.id === existing.id ? { ...r, ...recordData } : r
              ),
            };
          }
          return {
            attendanceRecords: [
              ...state.attendanceRecords,
              { ...recordData, id: generateId() },
            ],
          };
        }),
      bulkRecordAttendance: (records) =>
        set((state) => {
          const newRecords = records.map((r) => ({ ...r, id: generateId() }));
          return {
            attendanceRecords: [...state.attendanceRecords, ...newRecords],
          };
        }),
      correctAttendance: (id, updates, correctedBy) =>
        set((state) => ({
          attendanceRecords: state.attendanceRecords.map((r) =>
            r.id === id
              ? {
                  ...r,
                  ...updates,
                  manualCorrection: true,
                  correctedBy,
                }
              : r
          ),
        })),
      checkIn: (employeeId, employeeName) => {
        const today = getLocalDateString();
        const nowTime = new Date().toTimeString().substring(0, 5); // HH:mm
        const isLate = parseInt(nowTime.split(':')[0]) >= 9 && parseInt(nowTime.split(':')[1]) > 30; // 9:30 AM threshold

        get().recordAttendance({
          employeeId,
          employeeName,
          date: today,
          checkIn: nowTime,
          status: isLate ? 'late' : 'present',
        });
      },
      checkOut: (employeeId) => {
        const today = getLocalDateString();
        const nowTime = new Date().toTimeString().substring(0, 5);

        set((state) => ({
          attendanceRecords: state.attendanceRecords.map((r) =>
            r.employeeId === employeeId && r.date === today
              ? { ...r, checkOut: nowTime }
              : r
          ),
        }));
      },
      applyLeave: (leaveData) => {
        const newLeave: LeaveRequest = {
          ...leaveData,
          id: generateId(),
          status: 'pending',
          appliedAt: new Date().toISOString(),
        };
        set((state) => ({
          leaveRequests: [newLeave, ...state.leaveRequests],
        }));
      },
      approveLeave: (id, approvedBy) => {
        const targetLeave = get().leaveRequests.find((l) => l.id === id);
        if (targetLeave && ['casual', 'sick', 'annual'].includes(targetLeave.leaveType)) {
          useEmployeeStore.getState().deductLeaveBalance(
            targetLeave.employeeId,
            targetLeave.leaveType as 'casual' | 'sick' | 'annual',
            targetLeave.daysCount
          );
        }

        // Record on_leave attendance record for leave start date
        if (targetLeave) {
          const leaveDate = targetLeave.startDate;
          const existing = get().attendanceRecords.find(
            (r) => r.employeeId === targetLeave.employeeId && r.date === leaveDate
          );
          if (!existing) {
            get().recordAttendance({
              employeeId: targetLeave.employeeId,
              employeeName: targetLeave.employeeName,
              date: leaveDate,
              status: 'on_leave',
              notes: `Approved ${targetLeave.leaveType} leave`,
            });
          }
        }

        set((state) => ({
          leaveRequests: state.leaveRequests.map((l) =>
            l.id === id
              ? {
                  ...l,
                  status: 'approved',
                  approvedBy,
                  approvedAt: new Date().toISOString(),
                }
              : l
          ),
        }));
      },
      rejectLeave: (id, rejectionReason, rejectedBy) => {
        set((state) => ({
          leaveRequests: state.leaveRequests.map((l) =>
            l.id === id
              ? {
                  ...l,
                  status: 'rejected',
                  approvedBy: rejectedBy,
                  rejectionReason,
                  approvedAt: new Date().toISOString(),
                }
              : l
          ),
        }));
      },
      getAttendanceByDate: (date) => {
        return get().attendanceRecords.filter((r) => r.date === date);
      },
      getAttendanceByEmployee: (employeeId) => {
        return get().attendanceRecords.filter((r) => r.employeeId === employeeId);
      },
      getMonthlyEmployeeSummary: (employeeId, month, year) => {
        const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
        const records = get().attendanceRecords.filter(
          (r) => r.employeeId === employeeId && r.date.startsWith(monthPrefix)
        );

        let present = 0;
        let absent = 0;
        let late = 0;
        let halfDay = 0;
        let onLeave = 0;

        records.forEach((r) => {
          if (r.status === 'present') present++;
          else if (r.status === 'absent') absent++;
          else if (r.status === 'late') late++;
          else if (r.status === 'half_day') halfDay++;
          else if (r.status === 'on_leave') onLeave++;
        });

        // Check approved unpaid leaves overlapping this specific month
        const targetMonthStart = new Date(year, month - 1, 1);
        const targetMonthEnd = new Date(year, month, 0, 23, 59, 59, 999);

        let unpaidLeaveDays = 0;
        const approvedUnpaid = get().leaveRequests.filter(
          (l) => l.employeeId === employeeId && l.status === 'approved' && l.leaveType === 'unpaid'
        );

        approvedUnpaid.forEach((l) => {
          const start = new Date(l.startDate);
          const end = new Date(l.endDate);
          if (start <= targetMonthEnd && end >= targetMonthStart) {
            const effectiveStart = start > targetMonthStart ? start : targetMonthStart;
            const effectiveEnd = end < targetMonthEnd ? end : targetMonthEnd;
            const diffTime = effectiveEnd.getTime() - effectiveStart.getTime();
            const days = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
            unpaidLeaveDays += Math.max(0, Math.min(days, l.daysCount));
          }
        });

        return {
          present,
          absent,
          late,
          halfDay,
          onLeave,
          unpaidLeaveDays,
        };
      },
    }),
    {
      name: 'flowpay-attendance',
    }
  )
);
