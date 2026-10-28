import React, { useState, useMemo } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserCheck,
  Plus,
  Edit2,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { useAttendanceStore } from '@/stores/attendanceStore';
import { useEmployeeStore } from '@/stores/employeeStore';
import { useAuthStore } from '@/stores/authStore';
import { useAuditStore } from '@/stores/auditStore';
import { ATTENDANCE_STATUSES, LEAVE_STATUSES } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import { AttendanceStatus, LeaveType } from '@/lib/types';
import { toast } from 'sonner';

export default function AttendancePage() {
  const {
    attendanceRecords,
    leaveRequests,
    checkIn,
    checkOut,
    correctAttendance,
    applyLeave,
    approveLeave,
    rejectLeave,
  } = useAttendanceStore();
  const { employees } = useEmployeeStore();
  const { currentUser } = useAuthStore();
  const { addLog } = useAuditStore();

  const userRole = (currentUser?.role || '').toLowerCase();
  const isEmployee = userRole === 'employee';
  const canManageAttendance = ['owner', 'admin', 'hr'].includes(userRole);
  const canApproveLeaves = ['owner', 'admin', 'hr'].includes(userRole);

  const myEmployee = useMemo(() => {
    return employees.find(
      (e) =>
        e.employeeId === currentUser?.employeeId ||
        e.email.toLowerCase() === currentUser?.email.toLowerCase()
    );
  }, [employees, currentUser]);

  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);

  // Today's record for currently logged-in user
  const myTodayRecord = useMemo(() => {
    if (!myEmployee) return null;
    return attendanceRecords.find(
      (r) => r.employeeId === myEmployee.id && r.date === today
    );
  }, [attendanceRecords, myEmployee, today]);

  // Leave Modal
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [leaveEmployeeId, setLeaveEmployeeId] = useState(myEmployee?.id || '');
  const [leaveType, setLeaveType] = useState<LeaveType>('casual');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [daysCount, setDaysCount] = useState(1);
  const [reason, setReason] = useState('');

  // Attendance Correction Modal
  const [correctModalOpen, setCorrectModalOpen] = useState(false);
  const [selectedAttRecord, setSelectedAttRecord] = useState<any>(null);
  const [newStatus, setNewStatus] = useState<AttendanceStatus>('present');
  const [newCheckIn, setNewCheckIn] = useState('');
  const [newCheckOut, setNewCheckOut] = useState('');
  const [correctionNote, setCorrectionNote] = useState('');

  // Filtered attendance records for selected date
  const dateRecords = useMemo(() => {
    if (isEmployee && myEmployee) {
      return attendanceRecords.filter((r) => r.employeeId === myEmployee.id);
    }
    return attendanceRecords.filter((r) => r.date === selectedDate);
  }, [attendanceRecords, selectedDate, isEmployee, myEmployee]);

  // Daily stats for selected date
  const stats = useMemo(() => {
    const records = attendanceRecords.filter((r) => r.date === selectedDate);
    const present = records.filter((r) => r.status === 'present').length;
    const late = records.filter((r) => r.status === 'late').length;
    const onLeave = records.filter((r) => r.status === 'on_leave').length;
    const explicitlyAbsent = records.filter((r) => r.status === 'absent').length;
    const unrecorded = Math.max(0, employees.filter((e) => e.status === 'active').length - records.length);
    const absent = explicitlyAbsent + unrecorded;
    return { present, late, onLeave, absent };
  }, [attendanceRecords, selectedDate, employees]);

  const handleCheckIn = () => {
    if (!myEmployee) {
      toast.error('No employee profile linked to this user account');
      return;
    }
    checkIn(myEmployee.id, myEmployee.fullName);
    toast.success(`Check-in recorded at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
  };

  const handleCheckOut = () => {
    if (!myEmployee) return;
    checkOut(myEmployee.id);
    toast.success(`Check-out recorded at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
  };

  const handleApplyLeave = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((e) => e.id === leaveEmployeeId) || myEmployee;
    if (!emp) {
      toast.error('Please select an employee');
      return;
    }
    if (!reason.trim()) {
      toast.error('Please provide a reason for the leave');
      return;
    }

    applyLeave({
      employeeId: emp.id,
      employeeName: emp.fullName,
      department: emp.department,
      leaveType,
      startDate,
      endDate,
      daysCount: Math.max(1, daysCount),
      reason: reason.trim(),
    });

    addLog({
      userId: currentUser?.id || 'USR-005',
      userName: currentUser?.name || 'Employee',
      action: 'Apply for Leave',
      module: 'Attendance',
      details: `${emp.fullName} applied for ${daysCount} day(s) ${leaveType.toUpperCase()} leave (${startDate} to ${endDate})`,
    });

    toast.success('Leave application submitted for approval');
    setReason('');
    setLeaveModalOpen(false);
  };

  const handleOpenCorrection = (rec: any) => {
    setSelectedAttRecord(rec);
    setNewStatus(rec.status);
    setNewCheckIn(rec.checkIn || '09:00');
    setNewCheckOut(rec.checkOut || '17:30');
    setCorrectionNote(rec.notes || '');
    setCorrectModalOpen(true);
  };

  const handleSaveCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAttRecord) return;

    correctAttendance(
      selectedAttRecord.id,
      {
        status: newStatus,
        checkIn: newCheckIn,
        checkOut: newCheckOut,
        notes: correctionNote ? `Correction: ${correctionNote}` : 'Manually corrected by HR/Admin',
      },
      currentUser?.name || 'Admin'
    );

    addLog({
      userId: currentUser?.id || 'USR-002',
      userName: currentUser?.name || 'Admin',
      action: 'Correct Attendance',
      module: 'Attendance',
      details: `Corrected attendance for ${selectedAttRecord.employeeName} on ${selectedAttRecord.date} to ${newStatus.toUpperCase()}`,
    });

    toast.success('Attendance record updated and logged');
    setCorrectModalOpen(false);
  };

  const handleApproveLeave = (req: any) => {
    approveLeave(req.id, currentUser?.name || 'HR Manager');
    addLog({
      userId: currentUser?.id || 'USR-004',
      userName: currentUser?.name || 'HR Manager',
      action: 'Approve Leave Request',
      module: 'Attendance',
      details: `Approved ${req.leaveType} leave for ${req.employeeName} (${req.daysCount} days)`,
    });
    toast.success(`Leave request approved for ${req.employeeName}`);
  };

  const handleRejectLeave = (req: any) => {
    const rejectionReason = window.prompt('Enter reason for leave rejection:');
    if (rejectionReason === null) return;

    rejectLeave(req.id, rejectionReason || 'Operational workload constraints', currentUser?.name || 'HR Manager');
    addLog({
      userId: currentUser?.id || 'USR-004',
      userName: currentUser?.name || 'HR Manager',
      action: 'Reject Leave Request',
      module: 'Attendance',
      details: `Rejected leave for ${req.employeeName}. Reason: ${rejectionReason}`,
    });
    toast.info(`Leave request rejected for ${req.employeeName}`);
  };

  const visibleLeaves = isEmployee && myEmployee
    ? leaveRequests.filter((l) => l.employeeId === myEmployee.id)
    : leaveRequests;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader
          title="Attendance & Leave Management"
          description="Daily employee check-in tracking, attendance audit, and leave approval workflows"
        />
        <div className="flex gap-2">
          <Dialog open={leaveModalOpen} onOpenChange={setLeaveModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4 mr-2" /> Apply for Leave
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Leave Application</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleApplyLeave} className="space-y-4 pt-2">
                {canApproveLeaves && (
                  <div className="space-y-2">
                    <Label htmlFor="empSelect">Employee *</Label>
                    <Select
                      value={leaveEmployeeId || employees[0]?.id}
                      onValueChange={setLeaveEmployeeId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.fullName} ({emp.department})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="leaveType">Leave Type *</Label>
                  <Select
                    value={leaveType}
                    onValueChange={(v) => setLeaveType(v as LeaveType)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="casual">Casual Leave (Paid)</SelectItem>
                      <SelectItem value="sick">Sick Leave (Medical Certificate)</SelectItem>
                      <SelectItem value="annual">Annual / Earned Leave</SelectItem>
                      <SelectItem value="unpaid">Unpaid Leave (Salary Deductible)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="daysCount">Number of Days</Label>
                  <Input
                    id="daysCount"
                    type="number"
                    min="1"
                    max="60"
                    value={daysCount}
                    onChange={(e) => setDaysCount(parseInt(e.target.value) || 1)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason / Notes *</Label>
                  <Input
                    id="reason"
                    placeholder="Brief explanation for leave request..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                  />
                </div>

                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" onClick={() => setLeaveModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                    Submit Application
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Check-In / Check-Out Widget for current employee */}
      {myEmployee && (
        <Card className="bg-gradient-to-r from-indigo-50 via-white to-slate-50 border-indigo-100 shadow-sm">
          <CardContent className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Today's Attendance: {myEmployee.fullName}
                </h3>
                <p className="text-xs text-slate-500">
                  Date: {formatDate(today)} • Status:{' '}
                  <span className="font-semibold text-slate-800">
                    {myTodayRecord ? myTodayRecord.status.toUpperCase() : 'NOT CHECKED IN'}
                  </span>
                  {myTodayRecord?.checkIn && ` • In: ${myTodayRecord.checkIn}`}
                  {myTodayRecord?.checkOut && ` • Out: ${myTodayRecord.checkOut}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={myTodayRecord ? 'outline' : 'default'}
                disabled={!!myTodayRecord}
                className={!myTodayRecord ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
                onClick={handleCheckIn}
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" /> Check In
              </Button>
              <Button
                variant="secondary"
                disabled={!myTodayRecord || !!myTodayRecord.checkOut}
                onClick={handleCheckOut}
              >
                <Clock className="w-4 h-4 mr-1.5" /> Check Out
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Daily Metrics */}
      {!isEmployee && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Present Today"
            value={stats.present.toString()}
            icon={CheckCircle2}
          />
          <StatCard
            title="Late Arrivals"
            value={stats.late.toString()}
            icon={AlertTriangle}
          />
          <StatCard
            title="On Approved Leave"
            value={stats.onLeave.toString()}
            icon={Calendar}
          />
          <StatCard
            title="Unreported / Absent"
            value={stats.absent.toString()}
            icon={XCircle}
          />
        </div>
      )}

      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="daily">
            {isEmployee ? 'My Attendance History' : 'Daily Attendance Ledger'}
          </TabsTrigger>
          <TabsTrigger value="leaves">
            Leave Requests ({visibleLeaves.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4">
              <div>
                <CardTitle className="text-base font-semibold">
                  {isEmployee ? 'Attendance Record' : `Attendance for ${formatDate(selectedDate)}`}
                </CardTitle>
                <CardDescription>
                  Showing {dateRecords.length} recorded entries
                </CardDescription>
              </div>

              {!isEmployee && (
                <div className="flex items-center gap-2">
                  <Label htmlFor="dateSelect" className="text-xs text-slate-500 whitespace-nowrap">
                    Filter Date:
                  </Label>
                  <Input
                    id="dateSelect"
                    type="date"
                    className="w-44 bg-white"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50">
                      <TableHead>Employee</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Check-In</TableHead>
                      <TableHead>Check-Out</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Notes & Audit</TableHead>
                      {canManageAttendance && <TableHead className="w-[80px] text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dateRecords.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-slate-500 text-sm">
                          No attendance records found for this date.
                        </TableCell>
                      </TableRow>
                    ) : (
                      dateRecords.map((rec) => (
                        <TableRow key={rec.id}>
                          <TableCell className="font-medium text-slate-900">
                            {rec.employeeName}
                          </TableCell>
                          <TableCell className="text-sm text-slate-600">
                            {formatDate(rec.date)}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {rec.checkIn || '-'}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {rec.checkOut || '-'}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${
                                ATTENDANCE_STATUSES[rec.status]?.color || 'bg-slate-100'
                              }`}
                            >
                              {ATTENDANCE_STATUSES[rec.status]?.label || rec.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs text-slate-500">
                            {rec.manualCorrection ? (
                              <span className="text-indigo-600 font-medium">
                                Corrected: {rec.notes || 'By Admin'}
                              </span>
                            ) : (
                              rec.notes || '-'
                            )}
                          </TableCell>
                          {canManageAttendance && (
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenCorrection(rec)}
                              >
                                <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaves" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                {isEmployee ? 'My Leave Applications' : 'Leave Applications & Approvals Queue'}
              </CardTitle>
              <CardDescription>
                Submitted leave requests subject to approval by Department Manager and HR
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50">
                      <TableHead>Employee</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      {canApproveLeaves && <TableHead className="text-right">Decision</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleLeaves.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-slate-500 text-sm">
                          No leave applications on record.
                        </TableCell>
                      </TableRow>
                    ) : (
                      visibleLeaves.map((req) => (
                        <TableRow key={req.id}>
                          <TableCell>
                            <div className="font-medium text-slate-900">{req.employeeName}</div>
                            <div className="text-xs text-slate-500">{req.department}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {req.leaveType}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-slate-600">
                            {formatDate(req.startDate)} – {formatDate(req.endDate)}
                          </TableCell>
                          <TableCell className="font-semibold text-slate-800">
                            {req.daysCount} day(s)
                          </TableCell>
                          <TableCell className="text-xs text-slate-600 max-w-xs truncate">
                            {req.reason}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${
                                LEAVE_STATUSES[req.status]?.color || 'bg-slate-100'
                              }`}
                            >
                              {LEAVE_STATUSES[req.status]?.label || req.status}
                            </span>
                          </TableCell>
                          {canApproveLeaves && (
                            <TableCell className="text-right">
                              {req.status === 'pending' ? (
                                <div className="flex gap-1 justify-end">
                                  <Button
                                    size="sm"
                                    className="bg-emerald-600 hover:bg-emerald-700 h-8"
                                    onClick={() => handleApproveLeave(req)}
                                  >
                                    <ThumbsUp className="w-3.5 h-3.5 mr-1" /> Approve
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 hover:bg-red-50 h-8"
                                    onClick={() => handleRejectLeave(req)}
                                  >
                                    <ThumbsDown className="w-3.5 h-3.5 mr-1" /> Reject
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400">
                                  {req.approvedBy ? `Reviewed by ${req.approvedBy}` : 'Completed'}
                                </span>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Attendance Correction Dialog */}
      <Dialog open={correctModalOpen} onOpenChange={setCorrectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manual Attendance Correction</DialogTitle>
          </DialogHeader>
          {selectedAttRecord && (
            <form onSubmit={handleSaveCorrection} className="space-y-4 pt-2">
              <p className="text-xs text-slate-500">
                Updating attendance for <strong>{selectedAttRecord.employeeName}</strong> on{' '}
                <strong>{formatDate(selectedAttRecord.date)}</strong>. An audit log entry will be created.
              </p>

              <div className="space-y-2">
                <Label>Attendance Status</Label>
                <Select
                  value={newStatus}
                  onValueChange={(v) => setNewStatus(v as AttendanceStatus)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present">Present (On Time)</SelectItem>
                    <SelectItem value="late">Late Arrival</SelectItem>
                    <SelectItem value="half_day">Half Day</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="on_leave">On Approved Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Check-In (HH:mm)</Label>
                  <Input
                    value={newCheckIn}
                    onChange={(e) => setNewCheckIn(e.target.value)}
                    placeholder="09:00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Check-Out (HH:mm)</Label>
                  <Input
                    value={newCheckOut}
                    onChange={(e) => setNewCheckOut(e.target.value)}
                    placeholder="17:30"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Audit Correction Reason</Label>
                <Input
                  value={correctionNote}
                  onChange={(e) => setCorrectionNote(e.target.value)}
                  placeholder="e.g. Card scanner hardware malfunction"
                  required
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCorrectModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                  Save & Log Correction
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
