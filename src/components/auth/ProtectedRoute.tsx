import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { usePermissions } from '@/hooks/usePermissions';
import { UserRole } from '@/lib/types';
import { ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  requiredPermissions?: string[];
  allowedRoles?: (UserRole | string)[];
}

export function ProtectedRoute({ children, requiredPermissions, allowedRoles }: ProtectedRouteProps) {
  const { currentUser: user, isAuthenticated } = useAuthStore();
  const location = useLocation();
  const { hasPermission } = usePermissions();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const userRole = (user.role || '').toLowerCase();
  
  // Owner always has full access
  const isOwner = userRole === 'owner';

  const hasRoleAccess = isOwner || !allowedRoles || allowedRoles.some(
    role => role.toLowerCase() === userRole
  );
  
  let hasPermissionAccess = true;
  if (!isOwner && requiredPermissions && requiredPermissions.length > 0) {
    hasPermissionAccess = requiredPermissions.every(permission => hasPermission(permission));
  }

  if (!hasRoleAccess || !hasPermissionAccess) {
    return (
      <div className="flex h-full min-h-[calc(100vh-8rem)] flex-col items-center justify-center rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <ShieldAlert className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="mb-2 text-2xl font-bold text-slate-900">Access Denied</h2>
        <p className="max-w-md text-slate-500">
          You don't have the required permissions to view this page. Please contact your system administrator if you believe this is a mistake.
        </p>
      </div>
    );
  }

  return children ? <>{children}</> : <Outlet />;
}
