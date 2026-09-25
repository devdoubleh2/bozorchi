import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "react-i18next";
import type { Role, Permission } from "@/types/auth";
import { isEffectiveAdmin } from "@/types/auth";

interface RequireRoleProps {
  children: React.ReactNode;
  /** Allowed roles - user must have one of these */
  allowedRoles: Role[];
  /** Custom redirect path (default: /) */
  redirectTo?: string;
  /** Show forbidden UI instead of redirecting */
  showForbidden?: boolean;
}

interface RequirePermissionProps {
  children: React.ReactNode;
  /** Required permissions */
  permissions: Permission[];
  /** If true, user must have ALL permissions. If false, user needs at least one. */
  requireAll?: boolean;
  /** Custom redirect path (default: /) */
  redirectTo?: string;
  /** Show forbidden UI instead of redirecting */
  showForbidden?: boolean;
}

interface ForbiddenPageProps {
  permissions?: Permission[];
  requireAllPermissions?: boolean;
  roles?: Role[];
}

const PERMISSION_LABEL_KEYS: Record<Permission, string> = {
  POS_ACCESS: "staff.permissions.posAccess",
  MANAGE_PRODUCTS: "staff.permissions.manageProducts",
  MANAGE_INVENTORY: "staff.permissions.manageInventory",
  VIEW_COST_PRICE: "staff.permissions.viewCostPrice",
  VIEW_ANALYTICS: "staff.permissions.viewAnalytics",
  VIEW_DASHBOARD: "staff.permissions.viewDashboard",
};

/**
 * Forbidden access UI component
 */
const ForbiddenPage = ({
  permissions = [],
  requireAllPermissions = false,
  roles = [],
}: ForbiddenPageProps) => {
  const { t } = useTranslation();
  const permissionLabels = permissions.map((permission) =>
    t(PERMISSION_LABEL_KEYS[permission], { defaultValue: permission })
  );
  const roleLabels = roles.map((role) =>
    role === "admin"
      ? t("auth.roleAdmin", { defaultValue: "Admin" })
      : t("auth.roleCashier", { defaultValue: "Cashier" })
  );

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8">
      <div className="rounded-full bg-destructive/10 p-4">
        <svg
          className="h-12 w-12 text-destructive"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h1 className="text-2xl font-semibold text-foreground">
        {t("auth.accessDenied", "Access Denied")}
      </h1>
      <p className="text-center text-muted-foreground max-w-md">
        {t(
          "auth.accessDeniedMessage",
          "You don't have permission to access this page. Please contact your administrator if you believe this is a mistake."
        )}
      </p>
      {permissionLabels.length > 0 && (
        <p className="text-center text-sm text-muted-foreground max-w-xl">
          {requireAllPermissions
            ? t("auth.requiredAllPermissions", {
              defaultValue: "Required permissions (all): {{permissions}}",
              permissions: permissionLabels.join(", "),
            })
            : t("auth.requiredAnyPermission", {
              defaultValue: "Required permission (any): {{permissions}}",
              permissions: permissionLabels.join(", "),
            })}
        </p>
      )}
      {roleLabels.length > 0 && (
        <p className="text-center text-sm text-muted-foreground max-w-xl">
          {t("auth.requiredRole", {
            defaultValue: "Required role: {{roles}}",
            roles: roleLabels.join(", "),
          })}
        </p>
      )}
    </div>
  );
};

/**
 * Route guard that checks user role.
 *
 * Usage:
 * ```tsx
 * <RequireRole allowedRoles={["admin"]}>
 *   <AdminSettings />
 * </RequireRole>
 * ```
 */
export function RequireRole({
  children,
  allowedRoles,
  redirectTo = "/",
  showForbidden = false,
}: RequireRoleProps) {
  const { userStore, isLoading } = useAuth();
  const location = useLocation();

  // Still loading - don't make decisions yet
  if (isLoading) {
    return null;
  }

  // No store context means no role to check
  if (!userStore) {
    return (
      <Navigate to={redirectTo} state={{ from: location.pathname }} replace />
    );
  }

  const userRole = userStore.role;
  const hasRequiredRole = allowedRoles.includes(userRole);

  if (!hasRequiredRole) {
    if (showForbidden) {
      return <ForbiddenPage roles={allowedRoles} />;
    }
    return (
      <Navigate to={redirectTo} state={{ from: location.pathname }} replace />
    );
  }

  return <>{children}</>;
}

/**
 * Route guard that checks user permissions.
 *
 * For admin users, all permissions are granted automatically.
 *
 * Usage:
 * ```tsx
 * // Require at least one permission
 * <RequirePermission permissions={["VIEW_ANALYTICS", "MANAGE_INVENTORY"]}>
 *   <Reports />
 * </RequirePermission>
 *
 * // Require all permissions
 * <RequirePermission permissions={["MANAGE_PRODUCTS", "VIEW_COST_PRICE"]} requireAll>
 *   <ProductCosts />
 * </RequirePermission>
 * ```
 */
export function RequirePermission({
  children,
  permissions,
  requireAll = false,
  redirectTo = "/",
  showForbidden = false,
}: RequirePermissionProps) {
  const { user, userStore, isLoading } = useAuth();
  const location = useLocation();

  // Still loading - don't make decisions yet
  if (isLoading) {
    return null;
  }

  // No store context
  if (!userStore) {
    return (
      <Navigate to={redirectTo} state={{ from: location.pathname }} replace />
    );
  }

  // Owners and admin memberships hold every permission.
  if (isEffectiveAdmin(user)) {
    return <>{children}</>;
  }

  // Check permissions for non-admin users
  const userPermissions =
    (userStore as { permissions?: Permission[] }).permissions ?? [];

  const hasPermission = requireAll
    ? permissions.every((p) => userPermissions.includes(p))
    : permissions.some((p) => userPermissions.includes(p));

  if (!hasPermission) {
    if (showForbidden) {
      return (
        <ForbiddenPage
          permissions={permissions}
          requireAllPermissions={requireAll}
        />
      );
    }
    return (
      <Navigate to={redirectTo} state={{ from: location.pathname }} replace />
    );
  }

  return <>{children}</>;
}

/**
 * Combined guard for role AND permission checks.
 *
 * Usage:
 * ```tsx
 * <RequireAccess roles={["admin", "cashier"]} permissions={["VIEW_ANALYTICS"]}>
 *   <Analytics />
 * </RequireAccess>
 * ```
 */
export function RequireAccess({
  children,
  roles,
  permissions,
  requireAllPermissions = false,
  redirectTo = "/",
  showForbidden = false,
}: {
  children: React.ReactNode;
  roles?: Role[];
  permissions?: Permission[];
  requireAllPermissions?: boolean;
  redirectTo?: string;
  showForbidden?: boolean;
}) {
  const { user, userStore, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return null;
  }

  if (!userStore) {
    return (
      <Navigate to={redirectTo} state={{ from: location.pathname }} replace />
    );
  }

  // Check role if specified
  if (roles && roles.length > 0) {
    if (!roles.includes(userStore.role)) {
      if (showForbidden) return <ForbiddenPage roles={roles} />;
      return (
        <Navigate to={redirectTo} state={{ from: location.pathname }} replace />
      );
    }
  }

  // Check permissions if specified (owners and admin memberships bypass)
  if (permissions && permissions.length > 0 && !isEffectiveAdmin(user)) {
    const userPermissions =
      (userStore as { permissions?: Permission[] }).permissions ?? [];
    const hasPermission = requireAllPermissions
      ? permissions.every((p) => userPermissions.includes(p))
      : permissions.some((p) => userPermissions.includes(p));

    if (!hasPermission) {
      if (showForbidden) {
        return (
          <ForbiddenPage
            permissions={permissions}
            requireAllPermissions={requireAllPermissions}
            roles={roles}
          />
        );
      }
      return (
        <Navigate to={redirectTo} state={{ from: location.pathname }} replace />
      );
    }
  }

  return <>{children}</>;
}

export { ForbiddenPage };
