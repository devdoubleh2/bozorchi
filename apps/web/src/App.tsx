import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
  Outlet,
  useLocation,
  useNavigate,
  Link,
} from "react-router-dom";
import { lazy, Suspense, Fragment, useMemo, type ComponentType } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  Boxes,
  LayoutDashboard,
  Receipt,
  Users,
  Truck,
  BarChart3,
  ShoppingCart,
  ShieldCheck,
  ClipboardX,
  type LucideIcon,
} from "lucide-react";

import { ThemeProvider } from "@/components/providers/ThemeProvider";
import LanguageToggle from "@/components/LanguageToggle";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { NavUser } from "@/components/NavUser";
import { InterfaceSizeToggle } from "@/components/InterfaceSizeToggle";
import { SearchCommand, type SearchCommandItem } from "@/components/SearchCommand";
import Toaster from "@/components/Toaster";
import { StoreSwitcher } from "@/components/StoreSwitcher";
import { usePOSStore } from "@/context/POSStore";
import { Paywall } from "@/components/Paywall";
import { CurrencyDropdown } from "@/components/CurrencyDropdown";
import { NavMain, type NavItem } from "@/components/nav-main";
import { RequireAccess } from "@/components/auth";
import type { Permission, Role } from "@/types/auth";
import { cn } from "./lib/utils";
import { FaroRoutes } from "@grafana/faro-react";
import SeoManager from "@/components/SeoManager";
import Landing from "./pages/Landing";

// =============================================================================
// TYPES
// =============================================================================

type RouteConfig = {
  path: string;
  component: ComponentType;
  roles?: Role[];
  permissions?: Permission[];
  requireAllPermissions?: boolean;
};

type ReportDefinition = {
  id: string;
  icon: LucideIcon;
  color: string;
  accent: string;
  titleKey: string;
  descriptionKey: string;
  fallbackTitle: string;
  fallbackDescription: string;
};

// =============================================================================
// CONSTANTS
// =============================================================================

const REPORT_DEFINITIONS: ReportDefinition[] = [
  {
    id: "sellers",
    icon: Users,
    color: "text-sky-500",
    accent: "bg-sky-500/10",
    titleKey: "reports.sellers.title",
    descriptionKey: "reports.sellers.description",
    fallbackTitle: "Sellers",
    fallbackDescription: "Sales performance by sellers and staff members.",
  },
  {
    id: "products",
    icon: BarChart3,
    color: "text-violet-500",
    accent: "bg-violet-500/10",
    titleKey: "reports.products.title",
    descriptionKey: "reports.products.description",
    fallbackTitle: "Products",
    fallbackDescription: "Top movers, slow sellers, and contribution margins across products.",
  },
];

const BREADCRUMB_T_KEYS: Record<string, string> = {
  "/": "navigation.home",
  "/inventory": "navigation.inventory",
  "/inventory/products": "navigation.products",
  "/inventory/products/new": "navigation.newProduct",
  "/inventory/products/bulk": "navigation.bulkCreate",
  "/inventory/restock": "inventory.restock",
  "/inventory/write-offs": "inventory.writeOffs",
  "/inventory/audits": "inventory.audits",
  "/customers": "navigation.customers",
  "/customers/new": "navigation.newCustomer",
  "/suppliers": "navigation.suppliers",
  "/suppliers/new": "navigation.newSupplier",
  "/transactions": "navigation.transactions",
  "/reports": "navigation.reports",
  "/pos": "navigation.pos",
  "/account": "settings.account",
  "/account/edit": "navigation.accountEdit",
  "/staff": "navigation.staff",
  "/stores/new": "storeSetup.create",
};

const PERMISSION_SETS = {
  pos: ["POS_ACCESS"] as Permission[],
  manageProducts: ["MANAGE_PRODUCTS"] as Permission[],
  manageInventory: ["MANAGE_INVENTORY"] as Permission[],
  viewAnalytics: ["VIEW_ANALYTICS"] as Permission[],
  viewDashboard: ["VIEW_DASHBOARD"] as Permission[],
  inventoryOrProducts: ["MANAGE_INVENTORY", "MANAGE_PRODUCTS"] as Permission[],
};

// =============================================================================
// LAZY LOADED PAGES (grouped by domain)
// =============================================================================

const lazyPage = (importFn: () => Promise<{ default: ComponentType }>) => lazy(importFn);

// Auth
const Login = lazyPage(() => import("./pages/Login"));
const Register = lazyPage(() => import("./pages/Register"));
const ForgotPasswordPage = lazyPage(() => import("./pages/ForgotPassword"));
const ResetPasswordPage = lazyPage(() => import("./pages/ResetPassword"));

// Core
const ResourcesPage = lazyPage(() => import("./pages/Resources"));
const Dashboard = lazyPage(() => import("./pages/Dashboard"));

// Inventory
const InventoryPage = lazyPage(() => import("@/pages/Inventory"));
const ProductCreatePage = lazyPage(() => import("@/pages/ProductCreate"));
const ProductBulkCreatePage = lazyPage(() => import("@/pages/ProductBulkCreate"));
const ProductEditPage = lazyPage(() => import("@/pages/ProductEdit"));
const WriteOffPage = lazyPage(() => import("@/pages/WriteOff"));
const WriteOffsPage = lazyPage(() => import("@/pages/WriteOffs"));
const AuditsPage = lazyPage(() => import("@/pages/Audits"));
const AuditDetailPage = lazyPage(() => import("@/pages/AuditDetail"));
const NewAuditPage = lazyPage(() => import("@/pages/NewAudit"));
const LowStockPage = lazyPage(() => import("@/pages/LowStock"));
const RestockPage = lazyPage(() => import("@/pages/Restock"));
const BulkEditPage = lazyPage(() => import("@/pages/BulkEdit"));

// Customers
const CustomersPage = lazyPage(() => import("@/pages/Customers"));
const CustomerCreatePage = lazyPage(() => import("@/pages/CustomerCreate"));
const CustomerEditPage = lazyPage(() => import("@/pages/CustomerEdit"));
const CustomerDetailsPage = lazyPage(() => import("@/pages/CustomerDetails"));

// Suppliers
const SuppliersPage = lazyPage(() => import("@/pages/Suppliers"));
const SupplierCreatePage = lazyPage(() => import("@/pages/SupplierCreate"));
const SupplierEditPage = lazyPage(() => import("@/pages/SupplierEdit"));

// Transactions
const TransactionsPage = lazyPage(() => import("@/pages/Transactions"));
const RepayDebtPage = lazyPage(() => import("./pages/RepayDebt"));
const ExchangePage = lazyPage(() => import("./pages/Exchange"));

// POS
const POSPage = lazyPage(() => import("@/pages/POS"));

// Reports
const ReportDetailPage = lazyPage(() => import("./pages/ReportDetail"));

// Store
const StoreCreatePage = lazyPage(() => import("@/pages/StoreCreate"));
// FISCALIZATION DISABLED - const FiscalSettingsPage = lazyPage(() => import("@/pages/FiscalSettings"));

// Account & Settings
const AccountPage = lazyPage(() => import("@/pages/Account"));
const AccountEditPage = lazyPage(() => import("@/pages/AccountEdit"));
const ReceiptDesignPage = lazyPage(() => import("@/pages/ReceiptDesign"));
const StaffPage = lazyPage(() => import("@/pages/Staff"));
const SubscriptionPage = lazyPage(() => import("@/pages/Subscription"));
const MobilePaywallPage = lazyPage(() => import("@/pages/MobilePaywall"));

// Ecommerce
const EcommerceCatalogPage = lazyPage(() => import("@/pages/EcommerceCatalog"));

const ProductsRedirect = () => <Navigate to="/inventory" replace />;

// =============================================================================
// ROUTE CONFIGURATIONS
// =============================================================================

const PROTECTED_ROUTES: RouteConfig[] = [
  { path: "/stores/new", component: StoreCreatePage },
  {
    path: "/inventory",
    component: InventoryPage,
    permissions: PERMISSION_SETS.inventoryOrProducts,
  },
  {
    path: "/inventory/products",
    component: ProductsRedirect,
    permissions: PERMISSION_SETS.manageProducts,
  },
  {
    path: "/inventory/products/new",
    component: ProductCreatePage,
    permissions: PERMISSION_SETS.manageProducts,
  },
  {
    path: "/inventory/products/bulk",
    component: ProductBulkCreatePage,
    permissions: PERMISSION_SETS.manageProducts,
  },
  {
    path: "/inventory/products/edit/:productId",
    component: ProductEditPage,
    permissions: PERMISSION_SETS.manageProducts,
  },
  {
    path: "/inventory/write-offs",
    component: WriteOffsPage,
    permissions: PERMISSION_SETS.manageInventory,
  },
  {
    path: "/inventory/write-off/:productId",
    component: WriteOffPage,
    permissions: PERMISSION_SETS.manageInventory,
  },
  {
    path: "/inventory/audits",
    component: AuditsPage,
    permissions: PERMISSION_SETS.manageInventory,
  },
  {
    path: "/inventory/audits/new",
    component: NewAuditPage,
    permissions: PERMISSION_SETS.manageInventory,
  },
  {
    path: "/inventory/audits/:auditId",
    component: AuditDetailPage,
    permissions: PERMISSION_SETS.manageInventory,
  },
  {
    path: "/inventory/low-stock",
    component: LowStockPage,
    permissions: PERMISSION_SETS.manageInventory,
  },
  {
    path: "/inventory/restock",
    component: RestockPage,
    permissions: PERMISSION_SETS.manageInventory,
  },
  {
    path: "/inventory/restock/:productId",
    component: RestockPage,
    permissions: PERMISSION_SETS.manageInventory,
  },
  {
    path: "/inventory/bulk-edit",
    component: BulkEditPage,
    permissions: PERMISSION_SETS.manageProducts,
  },
  {
    path: "/customers",
    component: CustomersPage,
    permissions: PERMISSION_SETS.pos,
  },
  {
    path: "/customers/new",
    component: CustomerCreatePage,
    permissions: PERMISSION_SETS.pos,
  },
  {
    path: "/customers/:customerId/edit",
    component: CustomerEditPage,
    permissions: PERMISSION_SETS.pos,
  },
  {
    path: "/customers/:customerId",
    component: CustomerDetailsPage,
    permissions: PERMISSION_SETS.pos,
  },
  {
    path: "/suppliers",
    component: SuppliersPage,
    permissions: PERMISSION_SETS.manageProducts,
  },
  {
    path: "/suppliers/new",
    component: SupplierCreatePage,
    permissions: PERMISSION_SETS.manageProducts,
  },
  {
    path: "/suppliers/:supplierId/edit",
    component: SupplierEditPage,
    permissions: PERMISSION_SETS.manageProducts,
  },
  { path: "/pos", component: POSPage, permissions: PERMISSION_SETS.pos },
  {
    path: "/transactions",
    component: TransactionsPage,
    permissions: PERMISSION_SETS.viewAnalytics,
  },
  {
    path: "/repay-debt",
    component: RepayDebtPage,
    permissions: PERMISSION_SETS.pos,
  },
  {
    path: "/transactions/:id/exchange",
    component: ExchangePage,
    permissions: PERMISSION_SETS.pos,
  },
  // FISCALIZATION DISABLED - { path: "/fiscal-settings", component: FiscalSettingsPage },
  {
    path: "/reports/:reportId",
    component: ReportDetailPage,
    permissions: PERMISSION_SETS.viewAnalytics,
  },
  { path: "/account", component: AccountPage },
  { path: "/account/edit", component: AccountEditPage },
  { path: "/account/receipt-design", component: ReceiptDesignPage },
  { path: "/staff", component: StaffPage, roles: ["admin"] },
  { path: "/subscription", component: SubscriptionPage },
  { path: "/mobile-paywall", component: MobilePaywallPage },
  {
    path: "/dashboard",
    component: Dashboard,
    permissions: PERMISSION_SETS.viewDashboard,
  },
];

const PUBLIC_ROUTES: RouteConfig[] = [
  { path: "/login", component: Login },
  { path: "/", component: Landing },
  { path: "/resources", component: ResourcesPage },
  { path: "/register", component: Register },
  { path: "/forgot-password", component: ForgotPasswordPage },
  { path: "/reset-password", component: ResetPasswordPage },
  { path: "/:retailName", component: EcommerceCatalogPage },
];

// =============================================================================
// UTILITIES
// =============================================================================

const humanize = (s: string) => s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/** Wraps a component with Suspense and the fullscreen loader */
const withSuspense = (Component: ComponentType) => (
  <Suspense fallback={<FullScreenLoader />}>
    <Component />
  </Suspense>
);

// =============================================================================
// COMPONENTS
// =============================================================================

const FullScreenLoader = () => {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
        <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
      </div>
    </div>
  );
};

// =============================================================================
// AUTH GUARDS
// =============================================================================

const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <FullScreenLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <>{children}</>;
};

const RequireStaffApproval = ({ children }: { children: React.ReactNode }) => {
  const { userStore, getStore } = useAuth();
  const navigate = useNavigate();
  const isPending = !!userStore && userStore.role !== "admin" && userStore.approved === false;

  // Poll for approval status when user is pending
  useQuery({
    queryKey: ["staff-approval-check"],
    queryFn: async () => {
      const result = await getStore();
      // If user is now approved, redirect to dashboard
      if (result?.approved) {
        navigate("/dashboard", { replace: true });
      }
      return result;
    },
    enabled: isPending,
    refetchInterval: 5000, // Check every 5 seconds
    refetchOnWindowFocus: true,
  });

  if (isPending) {
    return withSuspense(StaffPage);
  }

  return <>{children}</>;
};

const ProtectedLayout = () => (
  <RequireAuth>
    <RequireStaffApproval>
      <Paywall>
        <AppLayout />
      </Paywall>
    </RequireStaffApproval>
  </RequireAuth>
);

// =============================================================================
// ROUTES
// =============================================================================

const AppRoutes = () => {
  return (
    <FaroRoutes routesComponent={Routes}>
      {/* Protected routes with layout */}
      <Route element={<ProtectedLayout />}>
        {PROTECTED_ROUTES.map(
          ({
            path,
            component: Component,
            roles,
            permissions,
            requireAllPermissions,
          }) => {
            const element = withSuspense(Component);
            const guardedElement =
              (roles && roles.length > 0) ||
              (permissions && permissions.length > 0) ? (
                <RequireAccess
                  roles={roles}
                  permissions={permissions}
                  requireAllPermissions={requireAllPermissions}
                  showForbidden
                >
                  {element}
                </RequireAccess>
              ) : (
                element
              );

            return <Route key={path} path={path} element={guardedElement} />;
          }
        )}
        <Route path="/reports" element={<Navigate to="/" replace />} />
      </Route>

      {/* Public routes */}
      {PUBLIC_ROUTES.map(({ path, component: Component }) => (
        <Route key={path} path={path} element={withSuspense(Component)} />
      ))}

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </FaroRoutes>
  );
};

// =============================================================================
// NAVIGATION HOOKS
// =============================================================================

const useNavItems = (): NavItem[] => {
  const { t } = useTranslation();
  const { userStore } = useAuth();

  return useMemo(() => {
    const canAccess = (permissions: Permission[]) => {
      if (userStore?.role === "admin") return true;
      const userPermissions = userStore?.permissions ?? [];
      return permissions.some((permission) => userPermissions.includes(permission));
    };

    const canPOS = canAccess(PERMISSION_SETS.pos);
    const canManageProducts = canAccess(PERMISSION_SETS.manageProducts);
    const canManageInventory = canAccess(PERMISSION_SETS.manageInventory);
    const canViewAnalytics = canAccess(PERMISSION_SETS.viewAnalytics);
    const canViewDashboard = canAccess(PERMISSION_SETS.viewDashboard);
    const homeUrl = canViewDashboard
      ? "/dashboard"
      : canPOS
        ? "/pos"
        : canManageProducts || canManageInventory
          ? "/inventory"
          : canViewAnalytics
            ? "/transactions"
            : "/account";

    const items: NavItem[] = [
      { title: t("navigation.home"), url: homeUrl, icon: LayoutDashboard },
    ];

    if (canManageProducts || canManageInventory) {
      items.push({
        title: t("navigation.inventory"),
        url: "/inventory",
        icon: Boxes,
      });
    }

    if (canManageInventory) {
      items.push({
        title: t("navigation.writeOffs", { defaultValue: "Write Offs" }),
        url: "/inventory/write-offs",
        icon: ClipboardX,
      });
      items.push({
        title: t("inventory.audits", { defaultValue: "Audits" }),
        url: "/inventory/audits",
        icon: Boxes,
      });
    }

    if (canPOS) {
      items.push({
        title: t("navigation.pos", { defaultValue: "POS" }),
        url: "/pos",
        icon: ShoppingCart,
      });
      items.push({
        title: t("navigation.customers"),
        url: "/customers",
        icon: Users,
      });
    }

    if (canViewAnalytics) {
      items.push({
        title: t("navigation.transactions", { defaultValue: "Transactions" }),
        url: "/transactions",
        icon: Receipt,
      });
      items.push({
        title: t("navigation.reports", { defaultValue: "Reports" }),
        url: "/reports",
        icon: BarChart3,
        items: REPORT_DEFINITIONS.map((report) => ({
          title: t(report.titleKey, { defaultValue: report.fallbackTitle }),
          url: `/reports/${report.id}`,
        })),
      });
    }

    if (canManageProducts) {
      items.push({
        title: t("navigation.suppliers", { defaultValue: "Suppliers" }),
        url: "/suppliers",
        icon: Truck,
      });
    }

    if (userStore?.role === "admin") {
      items.push({ title: t("navigation.staff", { defaultValue: "Staff" }), url: "/staff", icon: ShieldCheck });
      // FISCALIZATION DISABLED - items.push({ title: t("navigation.fiscal", { defaultValue: "Fiscal Integration" }), url: "/fiscal-settings", icon: Printer });
    }

    return items;
  }, [t, userStore?.permissions, userStore?.role]);
};

const useBreadcrumbs = (navItems: NavItem[]) => {
  const { t } = useTranslation();
  const location = useLocation();

  const restockProductName = useMemo(() => {
    if (location.state && typeof location.state === "object") {
      return (location.state as { restockProductName?: string })?.restockProductName;
    }
    return undefined;
  }, [location.state]);

  const customerName = useMemo(() => {
    if (location.state && typeof location.state === "object") {
      return (location.state as { customerName?: string })?.customerName;
    }
    return undefined;
  }, [location.state]);

  const storeQuery = useQuery({
    queryKey: ["store"],
    queryFn: async () => {
      const { getStore } = useAuth.getState();
      return getStore();
    },
    staleTime: 1000 * 60 * 5,
  });

  const storeId = storeQuery.data?.store?.id;
  const customerIdMatch = location.pathname.match(/^\/customers\/([^/]+)/);
  const customerId = customerIdMatch ? customerIdMatch[1] : null;

  const customerQuery = useQuery({
    queryKey: ["customer-breadcrumb", customerId, storeId],
    queryFn: async () => {
      if (!customerId || customerId === "new" || !storeId) return null;
      try {
        const res = await api.get<{ customer: { name: string } }>(
          `/api/customers/${customerId}?storeId=${encodeURIComponent(storeId)}`
        );
        return res.customer;
      } catch {
        return null;
      }
    },
    enabled: !!customerId && customerId !== "new" && !!storeId,
    staleTime: 1000 * 60 * 5,
  });

  const productIdMatch = location.pathname.match(/^\/inventory\/write-off\/([^/]+)/);
  const productId = productIdMatch ? productIdMatch[1] : null;

  const productQuery = useQuery({
    queryKey: ["product-breadcrumb", productId],
    queryFn: async () => {
      if (!productId || productId === "new") return null;
      try {
        const res = await api.get<{ product: { name: string }; name: string }>(
          `/api/product-variations/${productId}`
        );
        return res;
      } catch {
        return null;
      }
    },
    enabled: !!productId && productId !== "new",
    staleTime: 1000 * 60 * 5,
  });

  const labelForHref = (href: string, segment: string) => {
    const tKey = BREADCRUMB_T_KEYS[href];
    if (tKey) return t(tKey);

    if (/^\/reports\/[^/]+$/.test(href)) {
      const id = href.split("/").pop()!;
      return t("breadcrumbs.reportDetail", { id, defaultValue: `Report ${id}` });
    }

    if (/^\/customers\/[^/]+$/.test(href)) {
      if (customerName) return customerName;
      if (customerQuery.data?.name && customerId && href.includes(customerId)) {
        return customerQuery.data.name;
      }
    }

    if (/^\/inventory\/write-off\/[^/]+$/.test(href)) {
      if (productQuery.data?.product?.name && productId && href.includes(productId)) {
        return `${productQuery.data.product.name} ${productQuery.data.name ? `(${productQuery.data.name})` : ""}`;
      }
    }

    if (/^\/inventory\/restock\/[^/]+$/.test(href)) {
      if (href === location.pathname && restockProductName) return restockProductName;
      return t("inventory.restock", { defaultValue: "Restock" });
    }

    const slugKey = `breadcrumbs.segment.${segment}`;
    const tr = t(slugKey, { defaultValue: "" });
    if (tr) return tr;

    return humanize(segment);
  };

  return useMemo(() => {
    const segments = location.pathname.split("/").filter(Boolean);
  const homeHref = navItems[0]?.url ?? "/dashboard";
    const crumbs: Array<{ href: string; label: string }> = [
      { href: homeHref, label: t("navigation.home") },
    ];

    segments.forEach((segment, index) => {
      const href = `/${segments.slice(0, index + 1).join("/")}`;
      if (href === homeHref) return;

      const matchedNav = navItems.find((item) => item.url === href);
      if (matchedNav) {
        crumbs.push({ href, label: matchedNav.title });
        return;
      }

      crumbs.push({ href, label: labelForHref(href, segment) });
    });

    return crumbs;
  }, [location.pathname, navItems, t, restockProductName, customerName, customerQuery.data, productQuery.data]);
};

const useSearchItems = (navItems: NavItem[]): SearchCommandItem[] => {
  const { t } = useTranslation();

  return useMemo(() => {
    const flattenNavItems = (items: NavItem[]): SearchCommandItem[] => {
      const result: SearchCommandItem[] = [];
      items.forEach((item) => {
        result.push({
          label: item.title,
          href: item.url,
          icon: item.icon,
          group: t("navigation.title", { defaultValue: "Navigation" }),
        });
        item.items?.forEach((subItem) => {
          result.push({ label: subItem.title, href: subItem.url, group: item.title });
        });
      });
      return result;
    };

    return [
      ...flattenNavItems(navItems),
      { label: t("settings.account", { defaultValue: "Account" }), href: "/account", group: t("settings.title", { defaultValue: "Settings" }) },
      { label: t("settings.editProfile", { defaultValue: "Edit profile" }), href: "/account/edit", group: t("settings.title", { defaultValue: "Settings" }) },
    ];
  }, [navItems, t]);
};

// =============================================================================
// APP LAYOUT
// =============================================================================

const AppLayout = () => {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = useNavItems();
  const breadcrumbItems = useBreadcrumbs(navItems);
  const searchItems = useSearchItems(navItems);

  const isPOSPage = location.pathname === "/pos";

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <StoreSwitcher />
        </SidebarHeader>
        <SidebarContent>
          <NavMain items={navItems} />
        </SidebarContent>
        <SidebarFooter>
          <NavUser
            name={user?.email?.split("@")[0]}
            email={user?.email ?? undefined}
            onAccount={() => navigate("/account")}
            onBilling={() => navigate("/subscription")}
            onLogout={() => {
              usePOSStore.getState().clearCart();
              signOut();
            }}
          />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset id="sidebar-inset">

        <header
          className={cn(
            "sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border/60 px-4 justify-between",
            isPOSPage ? "bg-background" : "bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60"
          )}
        >
          <div className="flex flex-1 items-center gap-3 min-w-0">
            <SidebarTrigger className="md:hidden" aria-label={t("common.menu", { defaultValue: "Menu" })} />
            <Breadcrumb className="flex-1">
              <BreadcrumbList>
                {breadcrumbItems.map((item, index) => {
                  const isLast = index === breadcrumbItems.length - 1;
                  return (
                    <Fragment key={item.href || index}>
                      <BreadcrumbItem>
                        {isLast ? (
                          <BreadcrumbPage>{item.label}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink asChild>
                            <Link to={item.href}>{item.label}</Link>
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                      {!isLast && <BreadcrumbSeparator />}
                    </Fragment>
                  );
                })}
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex items-center gap-3 md:justify-end">
            <SearchCommand items={searchItems} className="hidden md:inline-flex h-10 min-w-[220px]" />
            <InterfaceSizeToggle />
            <CurrencyDropdown className="hidden md:flex" />
            <LanguageToggle className="hidden md:flex" />
          </div>
        </header>

        <main id="main-scroll-container" className="flex-1 overflow-auto bg-background relative min-w-0">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

// =============================================================================
// APP ENTRY
// =============================================================================

export default function App() {
  return (
    <ThemeProvider>
      <Toaster />
      <Router>
        <SeoManager />
        <AppRoutes />
      </Router>
    </ThemeProvider>
  );
}
