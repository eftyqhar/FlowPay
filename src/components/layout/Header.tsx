import React, { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  Search,
  User,
  Settings,
  LogOut,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useEmployeeStore } from '@/stores/employeeStore';
import { getInitials, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser: user, logout } = useAuthStore();
  const { notifications, markAsRead, markAllAsRead, getUnreadCount } = useNotificationStore();
  const { employees } = useEmployeeStore();

  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  const unreadCount = getUnreadCount();

  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return employees
      .filter(
        (emp) =>
          emp.fullName.toLowerCase().includes(q) ||
          emp.employeeId.toLowerCase().includes(q) ||
          emp.department.toLowerCase().includes(q)
      )
      .slice(0, 5);
  }, [employees, searchQuery]);

  const generateBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    if (paths.length === 0) return [{ name: 'Dashboard', path: '/' }];

    const breadcrumbs = [{ name: 'Home', path: '/' }];
    let currentPath = '';

    paths.forEach((path) => {
      currentPath += `/${path}`;
      const name = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');
      breadcrumbs.push({ name, path: currentPath });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-6">
      <div className="flex items-center text-sm text-slate-500">
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={crumb.path}>
            {index > 0 && <ChevronRight className="mx-2 h-4 w-4 text-slate-400" />}
            {index === breadcrumbs.length - 1 ? (
              <span className="font-semibold text-slate-900">{crumb.name}</span>
            ) : (
              <Link to={crumb.path} className="hover:text-indigo-600 transition-colors">
                {crumb.name}
              </Link>
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="flex items-center gap-3">
        {/* Global Search Bar */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search employee or ID..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchResults(true);
            }}
            onFocus={() => setShowSearchResults(true)}
            className="h-9 w-[220px] rounded-md border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />

          {showSearchResults && searchResults.length > 0 && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowSearchResults(false)}
              />
              <div className="absolute left-0 top-11 z-20 w-72 rounded-md border border-slate-200 bg-white py-2 shadow-lg">
                <p className="px-3 pb-1 text-[11px] font-semibold uppercase text-slate-400">
                  Employees ({searchResults.length})
                </p>
                {searchResults.map((emp) => (
                  <button
                    key={emp.id}
                    onClick={() => {
                      navigate(`/employees/${emp.id}`);
                      setShowSearchResults(false);
                      setSearchQuery('');
                    }}
                    className="flex w-full items-center px-3 py-1.5 text-left text-xs hover:bg-slate-50"
                  >
                    <div className="font-medium text-slate-800">{emp.fullName}</div>
                    <span className="ml-auto text-[10px] text-slate-400 font-mono">
                      {emp.employeeId}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Notification Bell with Badge */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100 transition-colors"
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white ring-2 ring-white">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowNotifications(false)}
              />
              <div className="absolute right-0 top-12 z-20 w-80 rounded-md border border-slate-200 bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-900 text-sm">Notifications</span>
                    {unreadCount > 0 && (
                      <Badge variant="secondary" className="bg-red-50 text-red-600 text-[10px]">
                        {unreadCount} new
                      </Badge>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No notifications at this time.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          markAsRead(n.id);
                          if (n.link) navigate(n.link);
                          setShowNotifications(false);
                        }}
                        className={`p-3 text-xs cursor-pointer hover:bg-slate-50 transition-colors ${
                          !n.isRead ? 'bg-indigo-50/40' : ''
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {n.type === 'warning' ? (
                            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                          ) : (
                            <Info className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <p className="font-semibold text-slate-800">{n.title}</p>
                            <p className="text-slate-500 mt-0.5">{n.message}</p>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              {formatDate(n.timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Avatar & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 overflow-hidden bg-indigo-50 text-indigo-700 font-semibold hover:ring-2 hover:ring-indigo-300 transition-all"
          >
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
            ) : (
              getInitials(user?.name || 'User')
            )}
          </button>

          {showDropdown && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowDropdown(false)}
              />
              <div className="absolute right-0 top-12 z-20 w-52 rounded-md border border-slate-200 bg-white py-1 shadow-lg">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                  <Badge variant="outline" className="mt-1 text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50">
                    {user?.role}
                  </Badge>
                </div>

                <Link
                  to="/profile"
                  className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                  onClick={() => setShowDropdown(false)}
                >
                  <User className="mr-2 h-4 w-4 text-slate-500" />
                  My Profile
                </Link>

                {user?.role !== 'employee' && (
                  <Link
                    to="/settings/company"
                    className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    onClick={() => setShowDropdown(false)}
                  >
                    <Settings className="mr-2 h-4 w-4 text-slate-500" />
                    Company Settings
                  </Link>
                )}

                <div className="my-1 border-t border-slate-100" />
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    logout();
                    navigate('/login');
                  }}
                  className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
