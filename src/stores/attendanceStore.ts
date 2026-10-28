import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AttendanceRecord, LeaveRequest, AttendanceStatus } from '@/lib/types';
import { generateId } from '@/lib/utils';

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
        const today = new Date().toISOString().split('T')[0];
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
        const today = new Date().toISOString().split('T')[0];
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

        // Check approved unpaid leaves for this month
        const unpaidLeaves = get().leaveRequests.filter((l) => {
          if (l.employeeId !== employeeId || l.status !== 'approved' || l.leaveType !== 'unpaid') return false;
          return l.startDate.startsWith(monthPrefix) || l.endDate.startsWith(monthPrefix);
        });

        const unpaidLeaveDays = unpaidLeaves.reduce((sum, l) => sum + l.daysCount, 0);

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
