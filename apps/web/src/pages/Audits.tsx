import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  Loader2,
  RotateCcw,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

interface Audit {
  id: string;
  created_at: string;
  status: "in_progress" | "completed" | "cancelled";
  expected_count: number;
  actual_count?: number;
  items: {
    id: string;
    product_variation_id: string;
    expected_quantity: number;
    counted_quantity?: number;
    discrepancy?: number;
    product_variation?: {
      product?: {
        name: string;
      };
      name: string;
    };
  }[];
  user?: {
    name?: string;
    email: string;
  };
}

interface AuditResponse {
  data: Audit[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

type SortDirection = "asc" | "desc" | null;
type SortableColumn = "created_at" | "status" | "items" | "discrepancies";

interface SortConfig {
  key: SortableColumn | null;
  direction: SortDirection;
}

export default function AuditsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { getStore } = useAuth();

  // State
  const [search, setSearch] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: null,
    direction: null,
  });

  const { data: storeData, isLoading: isStoreLoading } = useQuery({
    queryKey: ["store"],
    queryFn: getStore,
    staleTime: 1000 * 60 * 5,
  });

  const storeId = storeData?.store?.id;

  // Fetch audits
  const { data: auditsResponse, isLoading: isAuditsLoading } = useQuery({
    queryKey: ["audits", storeId, selectedStatuses],
    queryFn: async () => {
      if (!storeId)
        return {
          data: [],
          pagination: { total: 0, page: 1, limit: pageSize, pages: 0 },
        };

      const params = new URLSearchParams();
      if (selectedStatuses.length === 1) {
        params.append("status", selectedStatuses[0]);
      }

      const response = await api.get<AuditResponse>(
        `/api/audit/history${params.toString() ? `?${params.toString()}` : ""}`
      );
      const audits = (response as any).data?.audits || [];
      return {
        data: audits,
        pagination: {
          total: audits.length,
          page: 1,
          limit: pageSize,
          pages: Math.ceil(audits.length / pageSize),
        },
      };
    },
    enabled: !!storeId,
  });

  // Filter, sort, and paginate data
  const filteredAudits = useMemo(() => {
    if (!auditsResponse?.data) return [];

    return auditsResponse.data.filter((audit) => {
      const searchLower = search.toLowerCase();
      const matchesSearch =
        !search ||
        audit.id.toLowerCase().includes(searchLower) ||
        audit.user?.name?.toLowerCase().includes(searchLower) ||
        audit.user?.email?.toLowerCase().includes(searchLower);

      const matchesStatus =
        selectedStatuses.length === 0 ||
        selectedStatuses.includes(audit.status);

      return matchesSearch && matchesStatus;
    });
  }, [auditsResponse?.data, search, selectedStatuses]);

  const sortedData = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return filteredAudits;

    return [...filteredAudits].sort((a, b) => {
      let aValue: number | string = "";
      let bValue: number | string = "";

      switch (sortConfig.key) {
        case "created_at":
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        case "items":
          aValue = (a.items || []).length;
          bValue = (b.items || []).length;
          break;
        case "discrepancies":
          aValue = (a.items || []).filter(
            (item) => item.discrepancy !== 0 && item.discrepancy !== undefined
          ).length;
          bValue = (b.items || []).filter(
            (item) => item.discrepancy !== 0 && item.discrepancy !== undefined
          ).length;
          break;
      }

      if (aValue === bValue) return 0;
      const comparison = aValue > bValue ? 1 : -1;
      return sortConfig.direction === "asc" ? comparison : -comparison;
    });
  }, [filteredAudits, sortConfig]);

  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  // Selection logic
  const toggleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        const allIds = new Set<string>(paginatedData.map((item) => item.id));
        setSelectedIds(allIds);
      } else {
        setSelectedIds(new Set<string>());
      }
    },
    [paginatedData]
  );

  const toggleSelectRow = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const newSelected = new Set(prev);
      if (checked) {
        newSelected.add(id);
      } else {
        newSelected.delete(id);
      }
      return newSelected;
    });
  }, []);

  const isAllSelected =
    paginatedData.length > 0 &&
    paginatedData.every((item) => selectedIds.has(item.id));
  const isSomeSelected =
    paginatedData.some((item) => selectedIds.has(item.id)) && !isAllSelected;

  // Sorting logic
  const handleSort = useCallback((key: SortableColumn) => {
    setSortConfig((current) => {
      if (current.key === key) {
        if (current.direction === "asc") return { key, direction: "desc" };
        if (current.direction === "desc") return { key: null, direction: null };
      }
      return { key, direction: "asc" };
    });
  }, []);

  const SortIcon = ({ columnKey }: { columnKey: SortableColumn }) => {
    if (sortConfig.key !== columnKey)
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    if (sortConfig.direction === "asc")
      return <ArrowUp className="ml-2 h-4 w-4" />;
    return <ArrowDown className="ml-2 h-4 w-4" />;
  };

  // Actions
  const handleCreateAudit = () => navigate("/inventory/audits/new");
  const handleViewAudit = (auditId: string) =>
    navigate(`/inventory/audits/${auditId}`);

  const hasActiveFilters = search.length > 0 || selectedStatuses.length > 0;
  const activeFilterCount = (search ? 1 : 0) + selectedStatuses.length;

  const clearFilters = useCallback(() => {
    setSearch("");
    setSelectedStatuses([]);
    setCurrentPage(1);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300";
      case "in_progress":
        return "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300";
      case "cancelled":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusTranslation = (status: string) => {
    switch (status) {
      case "completed":
        return t("common.completed", { defaultValue: "Completed" });
      case "in_progress":
        return t("common.inProgress", { defaultValue: "In Progress" });
      case "cancelled":
        return t("common.cancelled", { defaultValue: "Cancelled" });
      default:
        return status;
    }
  };

  const isLoading = isStoreLoading || isAuditsLoading;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col w-full max-w-full min-w-0">
      {/* Header */}
      <header className="border-b px-4 py-3 md:px-6 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold leading-tight md:text-xl">
              {t("inventory.audits", { defaultValue: "Inventory Audits" })}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("inventory.auditsDescription", {
                defaultValue: "Track and manage inventory audits",
              })}
            </p>
          </div>
          <Button onClick={handleCreateAudit} className="gap-2">
            <Plus className="h-4 w-4" />
            <span>{t("inventory.newAudit", { defaultValue: "New Audit" })}</span>
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4 md:p-6 max-w-full">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border bg-card max-w-full">
          {/* Toolbar */}
          <div className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur-sm">
            <div className="flex flex-col gap-4 p-4">
              {/* Badges and actions row */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="px-2 py-0">
                      {activeFilterCount}
                    </Badge>
                  )}
                  {selectedIds.size > 0 && (
                    <Badge variant="default" className="gap-1">
                      <span className="text-xs font-semibold">
                        {selectedIds.size}
                      </span>
                      {t("inventory.selected", { defaultValue: "Selected" })}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {selectedIds.size > 0 && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        const selectedAudits = paginatedData.filter((a) =>
                          selectedIds.has(a.id)
                        );
                        if (selectedAudits.length === 1) {
                          handleViewAudit(selectedAudits[0].id);
                        }
                      }}
                      disabled={selectedIds.size !== 1}
                      className="gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      {t("common.view", { defaultValue: "View" })}
                    </Button>
                  )}
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="gap-2 text-muted-foreground hover:text-foreground"
                    >
                      <RotateCcw className="h-4 w-4" />
                      {t("common.reset", { defaultValue: "Reset" })}
                    </Button>
                  )}
                </div>
              </div>

              {/* Filters row */}
              <div className="flex flex-wrap gap-3">
                <div className="min-w-[220px] flex-1">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder={t("common.search", {
                        defaultValue: "Search...",
                      })}
                      className="h-10 pl-9"
                    />
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-10 min-w-[140px]"
                    >
                      {selectedStatuses.length > 0
                        ? `${t("common.status", {
                          defaultValue: "Status",
                        })} (${selectedStatuses.length})`
                        : t("common.status", { defaultValue: "Status" })}
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    <DropdownMenuLabel>
                      {t("common.status", { defaultValue: "Status" })}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {["in_progress", "completed", "cancelled"].map((status) => (
                      <DropdownMenuCheckboxItem
                        key={status}
                        checked={selectedStatuses.includes(status)}
                        onCheckedChange={(checked) => {
                          setSelectedStatuses((prev) =>
                            checked
                              ? [...prev, status]
                              : prev.filter((s) => s !== status)
                          );
                          setCurrentPage(1);
                        }}
                      >
                        {getStatusTranslation(status)}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow>
                  <TableHead className="w-[50px] text-center">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all"
                      className={isSomeSelected ? "opacity-50" : ""}
                    />
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort("created_at")}>
                      {t("common.date", { defaultValue: "Date" })}
                      <SortIcon columnKey="created_at" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort("status")}>
                      {t("common.status", { defaultValue: "Status" })}
                      <SortIcon columnKey="status" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort("items")}>
                      {t("inventory.itemsAudited", {
                        defaultValue: "Items Audited",
                      })}
                      <SortIcon columnKey="items" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("discrepancies")}
                    >
                      {t("inventory.discrepancies", {
                        defaultValue: "Discrepancies",
                      })}
                      <SortIcon columnKey="discrepancies" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    {t("inventory.performedBy", { defaultValue: "Performed By" })}
                  </TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      {t("common.noData", { defaultValue: "No data" })}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((audit) => {
                    const discrepancyCount = (audit.items || []).filter(
                      (item) =>
                        item.discrepancy !== 0 && item.discrepancy !== undefined
                    ).length;

                    return (
                      <TableRow
                        key={audit.id}
                        data-state={selectedIds.has(audit.id) && "selected"}
                        className="cursor-pointer"
                        onClick={() => handleViewAudit(audit.id)}
                      >
                        <TableCell
                          className="text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Checkbox
                            checked={selectedIds.has(audit.id)}
                            onCheckedChange={(checked) =>
                              toggleSelectRow(audit.id, !!checked)
                            }
                            aria-label="Select row"
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {audit.created_at && !isNaN(new Date(audit.created_at).getTime())
                            ? format(new Date(audit.created_at), "PP p")
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(audit.status)}>
                            {getStatusTranslation(audit.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {(audit.items || []).length}{" "}
                          {t("common.items", { defaultValue: "items" })}
                        </TableCell>
                        <TableCell>
                          {discrepancyCount > 0 ? (
                            <Badge
                              variant="outline"
                              className="bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
                            >
                              {discrepancyCount}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {audit.user?.name || audit.user?.email || "-"}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleViewAudit(audit.id)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                {t("common.view", { defaultValue: "View" })}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t px-4 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
              {sortedData.length > 0
                ? t("common.pagination.showing", {
                  start: (currentPage - 1) * pageSize + 1,
                  end: Math.min(currentPage * pageSize, sortedData.length),
                  total: sortedData.length,
                  defaultValue: `Showing ${(currentPage - 1) * pageSize + 1
                    } to ${Math.min(
                      currentPage * pageSize,
                      sortedData.length
                    )} of ${sortedData.length} entries`,
                })
                : t("common.noData", { defaultValue: "No data" })}
            </div>
            <div className="flex items-center space-x-6 lg:space-x-8">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium">
                  {t("common.pagination.rowsPerPage", {
                    defaultValue: "Rows per page",
                  })}
                </p>
                <Select
                  value={`${pageSize}`}
                  onValueChange={(value) => {
                    setPageSize(Number(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue placeholder={pageSize} />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <SelectItem key={size} value={`${size}`}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                {t("common.pagination.pageOf", {
                  current: currentPage,
                  total: totalPages || 1,
                  defaultValue: `Page ${currentPage} of ${totalPages || 1}`,
                })}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  className="hidden h-8 w-8 p-0 lg:flex"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  <span className="sr-only">Go to first page</span>
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <span className="sr-only">Go to previous page</span>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages || 1, p + 1))
                  }
                  disabled={currentPage === (totalPages || 1)}
                >
                  <span className="sr-only">Go to next page</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="hidden h-8 w-8 p-0 lg:flex"
                  onClick={() => setCurrentPage(totalPages || 1)}
                  disabled={currentPage === (totalPages || 1)}
                >
                  <span className="sr-only">Go to last page</span>
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
