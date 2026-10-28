import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Wallet,
  FileText,
  BarChart3,
  Settings,
  ChevronDown,
  LogOut,
  CalendarCheck,
  PiggyBank,
  ShieldCheck,
  Building2,
  FileCheck2,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type SubItem = {
  title: string;
  path: string;
  roles?: string[];
};

type NavItem = {
  title: string;
  icon: React.ElementType;
  path?: string;
  roles?: string[];
  subItems?: SubItem[];
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    label: 'OVERVIEW',
    items: [{ title: 'Dashboard', icon: LayoutDashboard, path: '/' }],
  },
  {
    label: 'MANAGEMENT',
    items: [
      {
        title: 'Employees',
        icon: Users,
        roles: ['owner', 'admin', 'hr', 'accountant'],
        subItems: [
          { title: 'All Employees', path: '/employees', roles: ['owner', 'admin', 'hr', 'accountant'] },
          { title: 'Add Employee', path: '/employees/add', roles: ['owner', 'admin', 'hr'] },
          { title: 'Departments', path: '/departments', roles: ['owner', 'admin', 'hr'] },
        ],
      },
      {
        title: 'Attendance & Leaves',
        icon: CalendarCheck,
        path: '/attendance',
      },
      {
        title: 'Loans & Advances',
        icon: PiggyBank,
        path: '/loans',
      },
      {
        title: 'Payroll',
        icon: Wallet,
        roles: ['owner', 'admin', 'accountant'], // HR restricted from payroll management
        subItems: [
          { title: 'Current Payroll', path: '/payroll' },
          { title: 'Payroll History', path: '/payroll/history' },
          { title: 'Generate Payroll', path: '/payroll/generate' },
        ],
      },
      { title: 'Payslips', icon: FileText, path: '/payslips' },
    ],
  },
  {
    label: 'ANALYTICS & REPORTS',
    items: [
      {
        title: 'Reports',
        icon: BarChart3,
        roles: ['owner', 'admin', 'accountant', 'hr'],
        subItems: [
          { title: 'Salary Report', path: '/reports/salary', roles: ['owner', 'admin', 'accountant'] },
          { title: 'Department Report', path: '/reports/department', roles: ['owner', 'admin', 'accountant', 'hr'] },
          { title: 'Payment Report', path: '/reports/payment', roles: ['owner', 'admin', 'accountant'] },
          { title: 'Yearly Summary', path: '/reports/yearly', roles: ['owner', 'admin', 'accountant'] },
        ],
      },
    ],
  },
  {
    label: 'SYSTEM & SETTINGS',
    items: [
      {
        title: 'Settings',
        icon: Settings,
        roles: ['owner', 'admin', 'accountant'],
        subItems: [
          { title: 'Company Settings', path: '/settings/company', roles: ['owner', 'admin'] },
          { title: 'Users & Roles', path: '/settings/users', roles: ['owner', 'admin'] },
          { title: 'Salary & Tax Rules', path: '/settings/salary', roles: ['owner', 'admin', 'accountant'] },
          { title: 'Audit Logs', path: '/settings/audit-logs', roles: ['owner', 'admin', 'accountant'] },
        ],
      },
    ],
  },
];

export function Sidebar() {
  const { currentUser: user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Employees: true,
    Payroll: true,
    Reports: false,
    Settings: false,
  });

  const toggleGroup = (title: string) => {
    setOpenGroups((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userRole = (user?.role || '').toLowerCase();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-slate-200 bg-white transition-transform">
      <div className="flex h-16 items-center border-b border-slate-200 px-6 gap-2.5">
        <div className="h-9 w-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-base shadow-sm">
          FP
        </div>
        <div>
          <span className="text-lg font-bold text-slate-900 tracking-tight block leading-tight">
            FlowPay
          </span>
          <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
            Payroll Platform
          </span>
        </div>
      </div>

      <div className="h-[calc(100vh-8.5rem)] overflow-y-auto px-4 py-4 scrollbar-thin">
        {navGroups.map((group) => {
          const groupItems = group.items.filter((item) => {
            if (!item.roles) return true;
            if (userRole === 'owner') return true;
            return item.roles.some((r) => r.toLowerCase() === userRole);
          });

          if (groupItems.length === 0) return null;

          return (
            <div key={group.label} className="mb-5">
              <h3 className="mb-2 px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {group.label}
              </h3>
              <ul className="space-y-1">
                {groupItems.map((item) => {
                  const visibleSubItems = item.subItems?.filter((sub) => {
                    if (!sub.roles) return true;
                    if (userRole === 'owner') return true;
                    return sub.roles.some((r) => r.toLowerCase() === userRole);
                  });

                  // If an item has subItems but all of them are hidden for this role, skip item
                  if (item.subItems && visibleSubItems && visibleSubItems.length === 0) {
                    return null;
                  }

                  const isActive = item.path
                    ? location.pathname === item.path
                    : visibleSubItems?.some((sub) => location.pathname === sub.path);
                  const isOpen = openGroups[item.title] || isActive;

                  return (
                    <li key={item.title}>
                      {visibleSubItems && visibleSubItems.length > 0 ? (
                        <div>
                          <button
                            onClick={() => toggleGroup(item.title)}
                            className={cn(
                              'flex w-full items-center justify-between rounded-md px-2.5 py-2 text-xs font-medium transition-colors hover:bg-slate-100',
                              isActive ? 'text-indigo-600 font-semibold' : 'text-slate-600'
                            )}
                          >
                            <div className="flex items-center">
                              <item.icon
                                className={cn(
                                  'mr-2.5 h-4 w-4',
                                  isActive ? 'text-indigo-600' : 'text-slate-400'
                                )}
                              />
                              {item.title}
                            </div>
                            <ChevronDown
                              className={cn(
                                'h-3.5 w-3.5 transition-transform duration-200',
                                isOpen ? 'rotate-180 text-slate-600' : 'text-slate-400'
                              )}
                            />
                          </button>
                          {isOpen && (
                            <ul className="mt-1 space-y-1 pl-7">
                              {visibleSubItems.map((subItem) => {
                                const isSubActive = location.pathname === subItem.path;
                                return (
                                  <li key={subItem.path}>
                                    <NavLink
                                      to={subItem.path}
                                      className={cn(
                                        'block rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-slate-100 hover:text-slate-900',
                                        isSubActive
                                          ? 'bg-indigo-50 text-indigo-700 font-semibold'
                                          : 'text-slate-500'
                                      )}
                                    >
                                      {subItem.title}
                                    </NavLink>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>
                      ) : (
                        <NavLink
                          to={item.path!}
                          className={cn(
                            'flex items-center rounded-md px-2.5 py-2 text-xs font-medium transition-colors hover:bg-slate-100',
                            isActive
                              ? 'bg-indigo-50 text-indigo-700 font-semibold'
                              : 'text-slate-600 hover:text-slate-900'
                          )}
                        >
                          <item.icon
                            className={cn(
                              'mr-2.5 h-4 w-4',
                              isActive ? 'text-indigo-600' : 'text-slate-400'
                            )}
                          />
                          {item.title}
                        </NavLink>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      {/* User Footer Profile */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-white p-3">
        <div className="flex items-center justify-between">
          <div
            className="flex items-center gap-2.5 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate('/profile')}
          >
            <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0 overflow-hidden">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                user?.name?.charAt(0) || 'U'
              )}
            </div>
            <div className="overflow-hidden">
              <p className="truncate text-xs font-semibold text-slate-800 leading-tight">
                {user?.name || 'User'}
              </p>
              <p className="truncate text-[10px] text-slate-400 capitalize">
                {user?.role || 'Guest'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="h-8 w-8 text-slate-400 hover:text-red-600 shrink-0"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
