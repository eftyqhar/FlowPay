import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuthStore } from '@/stores/authStore';
import { useEmployeeStore } from '@/stores/employeeStore';
import { useDepartmentStore } from '@/stores/departmentStore';
import { useAttendanceStore } from '@/stores/attendanceStore';
import { useLoanStore } from '@/stores/loanStore';
import { usePayrollStore } from '@/stores/payrollStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useAuditStore } from '@/stores/auditStore';

export function MainLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated, currentUser } = useAuthStore();

  const currentUserId = currentUser?.id;

  // Fetch domain data only after authentication session is verified
  useEffect(() => {
    if (!isAuthenticated || !currentUserId) return;

    useAuthStore.getState().fetchUsers();
    useEmployeeStore.getState().fetchEmployees();
    useDepartmentStore.getState().fetchDepartments();
    useAttendanceStore.getState().fetchAttendanceAndLeaves();
    useLoanStore.getState().fetchLoans();
    usePayrollStore.getState().fetchPayroll();
    useSettingsStore.getState().fetchSettings();
    useNotificationStore.getState().fetchNotifications();
    useAuditStore.getState().fetchLogs();
  }, [isAuthenticated, currentUserId]);

  // Automatically close mobile menu on page navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <Sidebar mobileOpen={mobileMenuOpen} onCloseMobile={() => setMobileMenuOpen(false)} />
      <div className="flex flex-1 flex-col w-full md:ml-64 min-w-0 transition-all duration-200">
        <Header onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)} />
        <main className="flex-1 p-3 sm:p-5 md:p-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
