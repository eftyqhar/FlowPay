import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';

import { MainLayout } from '@/components/layout/MainLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { LoginPage } from '@/pages/auth/LoginPage';
import { initializeSeedData } from '@/lib/seedData';

// Dashboard
import DashboardPage from '@/pages/dashboard/DashboardPage';

// Employees
import AllEmployeesPage from '@/pages/employees/AllEmployeesPage';
import AddEmployeePage from '@/pages/employees/AddEmployeePage';
import EditEmployeePage from '@/pages/employees/EditEmployeePage';
import EmployeeProfilePage from '@/pages/employees/EmployeeProfilePage';
import DepartmentsPage from '@/pages/employees/DepartmentsPage';

// Attendance & Leaves
import AttendancePage from '@/pages/attendance/AttendancePage';

// Loans & Advances
import LoansPage from '@/pages/loans/LoansPage';

// Payroll
import CurrentPayrollPage from '@/pages/payroll/CurrentPayrollPage';
import GeneratePayrollPage from '@/pages/payroll/GeneratePayrollPage';
import PayrollHistoryPage from '@/pages/payroll/PayrollHistoryPage';
import PayrollDetailPage from '@/pages/payroll/PayrollDetailPage';

// Payslips
import AllPayslipsPage from '@/pages/payslips/AllPayslipsPage';

// Reports
import SalaryReportPage from '@/pages/reports/SalaryReportPage';
import DepartmentReportPage from '@/pages/reports/DepartmentReportPage';
import PaymentReportPage from '@/pages/reports/PaymentReportPage';
import YearlySummaryPage from '@/pages/reports/YearlySummaryPage';

// Settings & System
import CompanySettingsPage from '@/pages/settings/CompanySettingsPage';
import UsersRolesPage from '@/pages/settings/UsersRolesPage';
import SalarySettingsPage from '@/pages/settings/SalarySettingsPage';
import AuditLogsPage from '@/pages/settings/AuditLogsPage';

// User Profile
import ProfilePage from '@/pages/profile/ProfilePage';

export function App() {
  useEffect(() => {
    initializeSeedData();
  }, []);

  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route index element={<DashboardPage />} />

            {/* Profile */}
            <Route path="profile" element={<ProfilePage />} />

            {/* Attendance & Leaves */}
            <Route path="attendance" element={<AttendancePage />} />

            {/* Loans & Advances */}
            <Route path="loans" element={<LoansPage />} />

            {/* Employee Management */}
            <Route path="employees">
              <Route
                index
                element={
                  <ProtectedRoute allowedRoles={['owner', 'admin', 'hr', 'accountant']}>
                    <AllEmployeesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="add"
                element={
                  <ProtectedRoute allowedRoles={['owner', 'admin', 'hr']}>
                    <AddEmployeePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="edit/:id"
                element={
                  <ProtectedRoute allowedRoles={['owner', 'admin', 'hr']}>
                    <EditEmployeePage />
                  </ProtectedRoute>
                }
              />
              <Route path=":id" element={<EmployeeProfilePage />} />
            </Route>

            <Route
              path="departments"
              element={
                <ProtectedRoute allowedRoles={['owner', 'admin', 'hr']}>
                  <DepartmentsPage />
                </ProtectedRoute>
              }
            />

            {/* Payroll Management */}
            <Route path="payroll">
              <Route
                index
                element={
                  <ProtectedRoute allowedRoles={['owner', 'admin', 'accountant']}>
                    <CurrentPayrollPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="generate"
                element={
                  <ProtectedRoute allowedRoles={['owner', 'admin', 'accountant']}>
                    <GeneratePayrollPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="history"
                element={
                  <ProtectedRoute allowedRoles={['owner', 'admin', 'accountant']}>
                    <PayrollHistoryPage />
                  </ProtectedRoute>
                }
              />
              <Route path=":id" element={<PayrollDetailPage />} />
            </Route>

            <Route path="payslips" element={<AllPayslipsPage />} />

            {/* Analytics & Reports */}
            <Route path="reports">
              <Route
                path="salary"
                element={
                  <ProtectedRoute allowedRoles={['owner', 'admin', 'accountant']}>
                    <SalaryReportPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="department"
                element={
                  <ProtectedRoute allowedRoles={['owner', 'admin', 'accountant', 'hr']}>
                    <DepartmentReportPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="payment"
                element={
                  <ProtectedRoute allowedRoles={['owner', 'admin', 'accountant']}>
                    <PaymentReportPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="yearly"
                element={
                  <ProtectedRoute allowedRoles={['owner', 'admin', 'accountant']}>
                    <YearlySummaryPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* System Settings */}
            <Route path="settings">
              <Route
                path="company"
                element={
                  <ProtectedRoute allowedRoles={['owner', 'admin']}>
                    <CompanySettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="users"
                element={
                  <ProtectedRoute allowedRoles={['owner', 'admin']}>
                    <UsersRolesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="salary"
                element={
                  <ProtectedRoute allowedRoles={['owner', 'admin', 'accountant']}>
                    <SalarySettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="audit-logs"
                element={
                  <ProtectedRoute allowedRoles={['owner', 'admin', 'accountant']}>
                    <AuditLogsPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
