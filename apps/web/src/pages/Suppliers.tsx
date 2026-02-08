import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  Factory,
  Phone,
  Mail,
  MapPin,
  CalendarDays,
  Search,
  ClipboardList,
  CreditCard,
  MoreHorizontal,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Plus,
  Trash2,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";

interface Supplier {
  id: string;
  name: string;
  contact: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  store_id: string;
  created_at: string;
  updated_at: string;
  _count?: {
    supplier_orders: number;
    supplier_payments: number;
  };
}

type SuppliersResponse = {
  suppliers: Supplier[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
};

type SupplierSummary = {
  totalSuppliers: number;
  withPhone: number;
  withEmail: number;
  totalOrders: number;
  totalPayments: number;
};

const formatDateTime = (isoDate: string, locale: string) => {
  if (!isoDate) return "—";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const SummaryCard = ({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}) => (
  <Card className="border shadow-none">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </CardTitle>
      <Icon className="size-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-semibold text-foreground">{value}</div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
type ContactFilter = "all" | "phone" | "email" | "notes";
type ActivityFilter = "all" | "orders" | "payments" | "inactive";

export default function SuppliersPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const locale = i18n.language || "ru-RU";
  const { userStore, getStore } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [contactFilter, setContactFilter] = useState<ContactFilter>("all");
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("all");
  const [detailSupplier, setDetailSupplier] = useState<Supplier | null>(null);
  const [pagination, setPagination] = useState<{
    pageIndex: number;
    pageSize: number;
  }>({
    pageIndex: 0,
    pageSize: PAGE_SIZE_OPTIONS[0],
  });

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (contactFilter !== "all") count += 1;
    if (activityFilter !== "all") count += 1;

    return count;
  }, [contactFilter, activityFilter]);

  const hasActiveFilters = activeFilterCount > 0;
  const hasSearchQuery = searchQuery.trim().length > 0;

  const storeQuery = useQuery({
    queryKey: ["store"],
    queryFn: async () => {
      const store = await getStore();
      return store;
    },
    initialData: userStore ?? undefined,
    staleTime: 1000 * 60 * 5,
  });

  const storeId = storeQuery.data?.store?.id;

  const suppliersQuery = useQuery({
    queryKey: [
      "suppliers",
      storeId,
      hasSearchQuery ? "search" : "page",
      hasSearchQuery ? searchQuery.trim() : pagination.pageIndex + 1,
      pagination.pageSize,
    ],
    queryFn: async (): Promise<SuppliersResponse> => {
      if (!storeId) {
        return {
          suppliers: [],
          pagination: {
            total: 0,
            limit: pagination.pageSize,
            offset: pagination.pageIndex * pagination.pageSize,
            hasMore: false,
          },
        };
      }
      const params = new URLSearchParams({
        storeId: storeId,
        limit: String(pagination.pageSize),
        offset: String(pagination.pageIndex * pagination.pageSize),
      });
      const response = await api.get<SuppliersResponse>(
        `/api/suppliers?${params.toString()}`
      );

      return response;
    },
    enabled: Boolean(storeId),
    refetchInterval: 1000 * 60,
    refetchIntervalInBackground: true,
  });

  const isLoading =
    storeQuery.isLoading ||
    suppliersQuery.isLoading ||
    suppliersQuery.isFetching;

  const suppliersData = suppliersQuery.data;

  const suppliers = suppliersData?.suppliers ?? [];

  const serverTotal = suppliersData?.pagination?.total ?? suppliers.length;

  const filteredSuppliers = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const shouldSearch = normalizedQuery.length > 0;

    return suppliers
      .filter((supplier) => {
        if (!shouldSearch) {
          return true;
        }
        const haystack = [
          supplier.name,
          supplier.contact,
          supplier.phone,
          supplier.email,
          supplier.address,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(normalizedQuery);
      })
      .filter((supplier) => {
        if (contactFilter === "phone") {
          return Boolean(supplier.phone);
        }
        if (contactFilter === "email") {
          return Boolean(supplier.email);
        }
        if (contactFilter === "notes") {
          return Boolean(supplier.notes);
        }
        return true;
      })
      .filter((supplier) => {
        const orders = supplier._count?.supplier_orders ?? 0;
        const payments = supplier._count?.supplier_payments ?? 0;
        if (activityFilter === "orders") {
          return orders > 0;
        }
        if (activityFilter === "payments") {
          return payments > 0;
        }
        if (activityFilter === "inactive") {
          return orders === 0 && payments === 0;
        }
        return true;
      });
  }, [suppliers, searchQuery, contactFilter, activityFilter]);

  const clearFilters = () => {
    setSearchQuery("");
    setContactFilter("all");
    setActivityFilter("all");

    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  const summaryQuery = useQuery({
    queryKey: ["suppliers-summary", storeId],
    queryFn: async () => {
      if (!storeId) {
        return null;
      }
      try {
        const response = await api.get<{ summary: SupplierSummary }>(
          `/api/suppliers/stats?store_id=${encodeURIComponent(storeId)}`
        );
        return response.summary;
      } catch {
        return null;
      }
    },
    enabled: Boolean(storeId),
    staleTime: 1000 * 60,
  });

  const fallbackSummary = useMemo<SupplierSummary>(() => {
    return filteredSuppliers.reduce(
      (acc, supplier) => {
        acc.totalSuppliers += 1;
        if (supplier.phone) acc.withPhone += 1;
        if (supplier.email) acc.withEmail += 1;
        acc.totalOrders += supplier._count?.supplier_orders ?? 0;
        acc.totalPayments += supplier._count?.supplier_payments ?? 0;
        return acc;
      },
      {
        totalSuppliers: 0,
        withPhone: 0,
        withEmail: 0,
        totalOrders: 0,
        totalPayments: 0,
      }
    );
  }, [filteredSuppliers]);

  const summary = summaryQuery.data ?? fallbackSummary;

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(filteredSuppliers.map((s) => s.id));
      setSelectedIds(allIds);
    } else {
      setSelectedIds(new Set());
    }
  };

  const toggleSelectRow = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setIsBulkDeleting(true);
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) => api.delete(`/api/suppliers/${id}`))
      );

      toast.success(
        t("supplier.bulkDeleteSuccess", {
          defaultValue: "Suppliers deleted successfully",
        })
      );
      setSelectedIds(new Set());
      setShowBulkDeleteConfirm(false);
      suppliersQuery.refetch();
      summaryQuery.refetch();
    } catch (error) {
      console.error("Bulk delete failed", error);
      toast.error(
        t("supplier.bulkDeleteError", {
          defaultValue: "Failed to delete suppliers",
        })
      );
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const isAllSelected =
    filteredSuppliers.length > 0 &&
    selectedIds.size === filteredSuppliers.length;
  const isIndeterminate = selectedIds.size > 0 && !isAllSelected;
  const pageCount = Math.ceil(serverTotal / pagination.pageSize);

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 md:px-6">
        <div>
          <h1 className="text-lg font-medium text-foreground md:text-xl">
            {t("supplier.title", { defaultValue: "Suppliers" })}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("supplier.subtitle", {
              defaultValue: "Track supplier performance and relationships.",
            })}
          </p>
        </div>

        <Button onClick={() => navigate("/suppliers/new")}>
          <Plus className="mr-2 h-4 w-4" />
          {t("supplier.addSupplier", { defaultValue: "Add Supplier" })}
        </Button>
      </header>
      <main className="flex flex-1 min-h-0 flex-col gap-4 overflow-hidden p-4 md:p-6">
        {suppliersQuery.error ? (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {t("supplier.notFound", {
              defaultValue: "Unable to load suppliers.",
            })}
          </div>
        ) : null}
        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title={t("supplier.metrics.totalSuppliers", {
              defaultValue: "Suppliers",
            })}
            value={formatNumber(summary.totalSuppliers, locale)}
            description={t("supplier.metrics.totalSuppliersDescription", {
              defaultValue: "Active partners",
            })}
            icon={Factory}
          />
          <SummaryCard
            title={t("supplier.phone", { defaultValue: "Phone" })}
            value={formatNumber(summary.withPhone, locale)}
            description={t("supplier.metrics.phoneContactsDescription", {
              defaultValue: "Phone contacts",
            })}
            icon={Phone}
          />
          <SummaryCard
            title={t("supplier.email", { defaultValue: "Email" })}
            value={formatNumber(summary.withEmail, locale)}
            description={t("supplier.metrics.emailContactsDescription", {
              defaultValue: "Email contacts",
            })}
            icon={Mail}
          />
          <SummaryCard
            title={t("supplier.orders", { defaultValue: "Orders" })}
            value={formatNumber(summary.totalOrders, locale)}
            description={t("supplier.metrics.ordersDescription", {
              defaultValue: "Recorded orders",
            })}
            icon={ClipboardList}
          />
        </section>
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center rounded-md border bg-card text-sm text-muted-foreground">
            {t("supplier.loading", { defaultValue: "Loading..." })}
          </div>
        ) : (
          <>
            <div className="flex-1 min-h-0 overflow-hidden rounded-md border bg-card">
              <div className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur-sm">
                <div className="flex flex-col gap-4 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      {activeFilterCount > 0 ? (
                        <Badge variant="secondary" className="px-2 py-0">
                          {activeFilterCount}
                        </Badge>
                      ) : null}
                    </div>
                    {hasActiveFilters ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="gap-2 text-muted-foreground hover:text-foreground"
                      >
                        <RotateCcw className="size-4" />
                        {t("common.reset", { defaultValue: "Reset" })}
                      </Button>
                    ) : null}
                    {selectedIds.size > 0 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setShowBulkDeleteConfirm(true)}
                        disabled={isBulkDeleting}
                        className="gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        {t("common.delete", { defaultValue: "Delete" })} (
                        {selectedIds.size})
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                    <div className="col-span-2 space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        {t("supplier.search", { defaultValue: "Search" })}
                      </label>
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={searchQuery}
                          onChange={(event) =>
                            setSearchQuery(event.target.value)
                          }
                          placeholder={t("supplier.searchPlaceholder", {
                            defaultValue: "Search suppliers...",
                          })}
                          className="h-10 pl-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        {t("supplier.filters.contact", {
                          defaultValue: "Contact info",
                        })}
                      </label>
                      <Select
                        value={contactFilter}
                        onValueChange={(value) =>
                          setContactFilter(value as ContactFilter)
                        }
                      >
                        <SelectTrigger className="h-10 w-full">
                          <SelectValue
                            placeholder={t(
                              "supplier.filters.contactPlaceholder",
                              {
                                defaultValue: "All contacts",
                              }
                            )}
                          />
                        </SelectTrigger>
                        <SelectContent align="start">
                          <SelectItem value="all">
                            {t("supplier.filters.contactAll", {
                              defaultValue: "All contacts",
                            })}
                          </SelectItem>
                          <SelectItem value="phone">
                            {t("supplier.filters.contactPhone", {
                              defaultValue: "Phone only",
                            })}
                          </SelectItem>
                          <SelectItem value="email">
                            {t("supplier.filters.contactEmail", {
                              defaultValue: "Email only",
                            })}
                          </SelectItem>
                          <SelectItem value="notes">
                            {t("supplier.filters.contactNotes", {
                              defaultValue: "Has notes",
                            })}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        {t("supplier.filters.activity", {
                          defaultValue: "Activity",
                        })}
                      </label>
                      <Select
                        value={activityFilter}
                        onValueChange={(value) =>
                          setActivityFilter(value as ActivityFilter)
                        }
                      >
                        <SelectTrigger className="h-10 w-full">
                          <SelectValue
                            placeholder={t(
                              "supplier.filters.activityPlaceholder",
                              {
                                defaultValue: "All suppliers",
                              }
                            )}
                          />
                        </SelectTrigger>
                        <SelectContent align="start">
                          <SelectItem value="all">
                            {t("supplier.filters.activityAll", {
                              defaultValue: "All suppliers",
                            })}
                          </SelectItem>
                          <SelectItem value="orders">
                            {t("supplier.filters.activityOrders", {
                              defaultValue: "With orders",
                            })}
                          </SelectItem>
                          <SelectItem value="payments">
                            {t("supplier.filters.activityPayments", {
                              defaultValue: "With payments",
                            })}
                          </SelectItem>
                          <SelectItem value="inactive">
                            {t("supplier.filters.activityInactive", {
                              defaultValue: "No activity",
                            })}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
              <ScrollArea className="h-full">
                <div className="min-w-[880px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40px] px-1">
                          <Checkbox
                            checked={
                              isAllSelected ||
                              (isIndeterminate && "indeterminate")
                            }
                            onCheckedChange={(value) =>
                              toggleSelectAll(!!value)
                            }
                            aria-label="Select all"
                          />
                        </TableHead>
                        <TableHead>{t("supplier.name")}</TableHead>
                        <TableHead>
                          {t("supplier.contactInfo", {
                            defaultValue: "Contact",
                          })}
                        </TableHead>
                        <TableHead>
                          {t("supplier.address", { defaultValue: "Address" })}
                        </TableHead>
                        <TableHead className="text-right">
                          {t("supplier.orders", { defaultValue: "Orders" })}
                        </TableHead>
                        <TableHead className="text-right">
                          {t("supplier.payments", { defaultValue: "Payments" })}
                        </TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSuppliers.length > 0 ? (
                        filteredSuppliers.map((supplier) => {
                          const isSelected = selectedIds.has(supplier.id);
                          return (
                            <TableRow
                              key={supplier.id}
                              data-state={isSelected && "selected"}
                            >
                              <TableCell className="px-1">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={(value) =>
                                    toggleSelectRow(supplier.id, !!value)
                                  }
                                  aria-label="Select row"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                  <span className="font-medium text-foreground">
                                    {supplier.name}
                                  </span>
                                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                    <Badge
                                      variant="outline"
                                      className="flex items-center gap-1"
                                    >
                                      <CalendarDays className="size-3" />
                                      {formatDateTime(
                                        supplier.created_at,
                                        locale
                                      )}
                                    </Badge>
                                    {supplier.notes ? (
                                      <Badge variant="outline">
                                        {supplier.notes}
                                      </Badge>
                                    ) : null}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-2">
                                  {supplier.contact ? (
                                    <Badge variant="outline" className="w-fit">
                                      {supplier.contact}
                                    </Badge>
                                  ) : null}
                                  <div className="flex flex-wrap items-center gap-2">
                                    {supplier.phone ? (
                                      <Badge
                                        variant="outline"
                                        className="flex items-center gap-1"
                                      >
                                        <Phone className="size-3" />
                                        {supplier.phone}
                                      </Badge>
                                    ) : null}
                                    {supplier.email ? (
                                      <Badge
                                        variant="outline"
                                        className="flex items-center gap-1"
                                      >
                                        <Mail className="size-3" />
                                        {supplier.email}
                                      </Badge>
                                    ) : null}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                {supplier.address ? (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="size-3" />
                                    <span>{supplier.address}</span>
                                  </div>
                                ) : (
                                  t("common.notSpecified")
                                )}
                              </TableCell>
                              <TableCell className="text-right font-medium text-foreground">
                                {formatNumber(
                                  supplier._count?.supplier_orders ?? 0,
                                  locale
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex justify-end gap-2">
                                  <Badge
                                    variant="outline"
                                    className="flex items-center gap-1"
                                  >
                                    <CreditCard className="size-3" />
                                    {formatNumber(
                                      supplier._count?.supplier_payments ?? 0,
                                      locale
                                    )}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      className="h-8 w-8 p-0"
                                      aria-label={t("supplier.table.openMenu")}
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>
                                      {t("supplier.table.actions")}
                                    </DropdownMenuLabel>
                                    <DropdownMenuItem
                                      onSelect={() =>
                                        setDetailSupplier(supplier)
                                      }
                                    >
                                      {t("supplier.table.viewDetails")}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onSelect={() =>
                                        navigate(
                                          `/suppliers/${supplier.id}/edit`
                                        )
                                      }
                                    >
                                      {t("common.edit", {
                                        defaultValue: "Edit",
                                      })}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center">
                            <div className="flex flex-col items-center justify-center gap-1 text-sm text-muted-foreground">
                              <span>
                                {t("supplier.noSuppliers", {
                                  defaultValue: "No suppliers yet.",
                                })}
                              </span>
                              <span>
                                {t("supplier.noResults", {
                                  defaultValue: "Try adjusting your filters.",
                                })}
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </ScrollArea>
            </div>
            {/* Pagination Controls */}
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">
                  {t("suppliers.pagination.rowsPerPage", {
                    defaultValue: "Rows per page",
                  })}
                </p>
                <Select
                  value={`${pagination.pageSize}`}
                  onValueChange={(value) => {
                    setPagination((prev) => ({
                      ...prev,
                      pageSize: Number(value),
                      pageIndex: 0,
                    }));
                  }}
                >
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue placeholder={pagination.pageSize} />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {[10, 25, 50].map((pageSize) => (
                      <SelectItem key={pageSize} value={`${pageSize}`}>
                        {pageSize}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                  Page {pagination.pageIndex + 1} of {pageCount}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="hidden h-8 w-8 p-0 lg:flex"
                    onClick={() =>
                      setPagination((prev) => ({ ...prev, pageIndex: 0 }))
                    }
                    disabled={pagination.pageIndex === 0}
                  >
                    <span className="sr-only">Go to first page</span>
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        pageIndex: prev.pageIndex - 1,
                      }))
                    }
                    disabled={pagination.pageIndex === 0}
                  >
                    <span className="sr-only">Go to previous page</span>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        pageIndex: prev.pageIndex + 1,
                      }))
                    }
                    disabled={pagination.pageIndex >= pageCount - 1}
                  >
                    <span className="sr-only">Go to next page</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="hidden h-8 w-8 p-0 lg:flex"
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        pageIndex: pageCount - 1,
                      }))
                    }
                    disabled={pagination.pageIndex >= pageCount - 1}
                  >
                    <span className="sr-only">Go to last page</span>
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog
        open={showBulkDeleteConfirm}
        onOpenChange={setShowBulkDeleteConfirm}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("common.confirmDelete", { defaultValue: "Confirm Deletion" })}
            </DialogTitle>
            <DialogDescription>
              {t("supplier.bulkDeleteConfirm", {
                defaultValue:
                  "Are you sure you want to delete {count} suppliers? This action cannot be undone.",
                count: selectedIds.size,
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBulkDeleteConfirm(false)}
              disabled={isBulkDeleting}
            >
              {t("common.cancel", { defaultValue: "Cancel" })}
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
            >
              {isBulkDeleting
                ? t("common.deleting", { defaultValue: "Deleting..." })
                : t("common.delete", { defaultValue: "Delete" })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog
        open={!!detailSupplier}
        onOpenChange={(open) => !open && setDetailSupplier(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{detailSupplier?.name}</DialogTitle>
            <DialogDescription>
              {t("supplier.detailsDescription", {
                defaultValue: "Supplier details and information.",
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
                {t("supplier.name", { defaultValue: "Name" })}
              </Label>
              <div className="col-span-3 font-medium">
                {detailSupplier?.name}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
                {t("supplier.contact", { defaultValue: "Contact" })}
              </Label>
              <div className="col-span-3">{detailSupplier?.contact || "—"}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
                {t("supplier.phone", { defaultValue: "Phone" })}
              </Label>
              <div className="col-span-3">{detailSupplier?.phone || "—"}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
                {t("supplier.email", { defaultValue: "Email" })}
              </Label>
              <div className="col-span-3">{detailSupplier?.email || "—"}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
                {t("supplier.address", { defaultValue: "Address" })}
              </Label>
              <div className="col-span-3">{detailSupplier?.address || "—"}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
                {t("supplier.notes", { defaultValue: "Notes" })}
              </Label>
              <div className="col-span-3">{detailSupplier?.notes || "—"}</div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
