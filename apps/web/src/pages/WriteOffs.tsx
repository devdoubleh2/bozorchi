import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Loader2,
  TrendingDown,
  PackageMinus,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";

interface WriteOffTransaction {
  id: string;
  write_off_date: string;
  product_variation: {
    product: { name: string };
    name: string;
  };
  quantity: number;
  reason: string;
  notes?: string;
  user?: {
    name?: string;
    email: string;
  };
}

interface WriteOffSummary {
  totalWriteOffs: number;
  totalQuantity: number;
  totalValue: number;
  summaryByReason: Record<
    string,
    {
      count: number;
      totalQuantity: number;
      totalValue: number;
    }
  >;
}

const REASON_COLORS: Record<string, string> = {
  theft: "bg-red-500",
  damage: "bg-orange-500",
  expiry: "bg-purple-500",
  defect: "bg-pink-500",
  other: "bg-gray-500",
};

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

export default function WriteOffsPage() {
  const { t } = useTranslation();
  const { getStore } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0]);

  const storeQuery = useQuery({
    queryKey: ["store"],
    queryFn: getStore,
    staleTime: 1000 * 60 * 5,
  });
  const storeId = storeQuery.data?.store?.id;
  const currency = storeQuery.data?.store?.currency || "UZS";

  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ["write-off-summary", storeId],
    queryFn: async () => {
      if (!storeId) return null;
      const res = await api.get<WriteOffSummary>(
        `/api/write-offs/summary`
      );
      return res;
    },
    enabled: !!storeId,
  });

  const { data: writeOffsResponse, isLoading: isTransactionsLoading } = useQuery({
    queryKey: ["write-offs", storeId],
    queryFn: async () => {
      if (!storeId) return { data: [], pagination: { total: 0, pages: 0 } };
      const res = await api.get<{ data: WriteOffTransaction[]; pagination: any }>(
        `/api/write-offs?limit=1000`
      );
      return res;
    },
    enabled: !!storeId,
  });

  const transactions = writeOffsResponse?.data || [];

  const filteredTransactions = transactions?.filter((tx) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (tx.product_variation?.product?.name &&
        tx.product_variation.product.name.toLowerCase().includes(searchLower)) ||
      (tx.product_variation?.name &&
        tx.product_variation.name.toLowerCase().includes(searchLower)) ||
      (tx.notes && tx.notes.toLowerCase().includes(searchLower)) ||
      (tx.reason && tx.reason.toLowerCase().includes(searchLower))
    );
  });

  const totalTransactions = filteredTransactions?.length || 0;
  const displayedTransactions = useMemo(() => {
    if (totalTransactions === 0) {
      return [];
    }
    const startIndex = (currentPage - 1) * pageSize;
    return (filteredTransactions || []).slice(
      startIndex,
      startIndex + pageSize
    );
  }, [filteredTransactions, currentPage, pageSize, totalTransactions]);

  const totalPages = Math.max(1, Math.ceil(totalTransactions / pageSize));
  const showingFrom =
    totalTransactions === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const showingTo =
    totalTransactions === 0
      ? 0
      : Math.min(
          (currentPage - 1) * pageSize + displayedTransactions.length,
          totalTransactions
        );

  const pageNumbers = useMemo(() => {
    const firstPage = 1;
    const lastPage = totalPages;
    const delta = 1;
    const pages: Array<number | string> = [];

    if (totalPages <= 0) {
      return pages;
    }

    pages.push(firstPage);

    const start = Math.max(firstPage + 1, currentPage - delta);
    const end = Math.min(lastPage - 1, currentPage + delta);

    if (start > firstPage + 1) {
      pages.push("ellipsis-left");
    }

    for (let page = start; page <= end; page += 1) {
      pages.push(page);
    }

    if (end < lastPage - 1) {
      if (end < lastPage - 2) {
        pages.push("ellipsis-right");
      }
      pages.push(lastPage);
    } else if (end === lastPage - 1) {
      pages.push(lastPage);
    }

    return pages;
  }, [currentPage, totalPages]);

  const handlePageSizeChange = (value: string) => {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isNaN(parsed)) {
      setPageSize(parsed);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const maxReasonValue = summary
    ? Math.max(
        ...Object.values(summary.summaryByReason).map((r) => r.totalValue)
      )
    : 0;

  const hasActiveFilters = searchTerm.trim().length > 0;

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("writeOffs.title", { defaultValue: "Write Offs" })}
          </h1>
          <p className="text-muted-foreground">
            {t("writeOffs.subtitle", {
              defaultValue: "Manage and view inventory write-offs.",
            })}
          </p>
        </div>
        <Button onClick={() => navigate("/inventory/write-off/new")}>
          <Plus className="mr-2 h-4 w-4" />
          {t("writeOffs.new", { defaultValue: "New Write Off" })}
        </Button>
      </div>

      <Tabs defaultValue="stats" className="space-y-4">
        <TabsList>
          <TabsTrigger value="stats">
            {t("writeOff.statistics", { defaultValue: "Statistics" })}
          </TabsTrigger>
          <TabsTrigger value="history">
            {t("writeOff.history", { defaultValue: "History" })}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="space-y-4">
          {isSummaryLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : summary ? (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {t("writeOff.totalWriteOffs", {
                        defaultValue: "Total Write Offs",
                      })}
                    </CardTitle>
                    <PackageMinus className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {summary.totalWriteOffs}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {t("writeOff.totalQuantity", {
                        defaultValue: "Total Quantity",
                      })}
                    </CardTitle>
                    <TrendingDown className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {summary.totalQuantity}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {t("writeOff.totalValue", {
                        defaultValue: "Total Value",
                      })}
                    </CardTitle>
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-destructive">
                      {formatCurrency(summary.totalValue, currency)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>
                    {t("writeOff.byReason", {
                      defaultValue: "Breakdown by Reason",
                    })}
                  </CardTitle>
                  <CardDescription>
                    {t("writeOff.byReasonDesc", {
                      defaultValue: "Financial impact by write-off reason",
                    })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {Object.entries(summary.summaryByReason).map(
                    ([reason, data]) => (
                      <div key={reason} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "w-2 h-2 rounded-full",
                                REASON_COLORS[reason] || "bg-gray-500"
                              )}
                            />
                            <span className="font-medium capitalize">
                              {t(`inventory.writeOffReasons.${reason}`, {
                                defaultValue: reason,
                              })}
                            </span>
                            <span className="text-muted-foreground">
                              ({data.count}{" "}
                              {t("writeOff.items", { defaultValue: "items" })})
                            </span>
                          </div>
                          <span className="font-medium text-destructive">
                            {formatCurrency(data.totalValue, currency)}
                          </span>
                        </div>
                        <Progress
                          value={(data.totalValue / maxReasonValue) * 100}
                          className="h-2"
                          indicatorClassName={
                            REASON_COLORS[reason] || "bg-gray-500"
                          }
                        />
                      </div>
                    )
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="flex h-40 items-center justify-center text-muted-foreground">
              {t("common.noData", { defaultValue: "No data available" })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>
                      {t("writeOffs.history", { defaultValue: "History" })}
                    </CardTitle>
                    <CardDescription>
                      {t("writeOffs.found", {
                        defaultValue: "{{count}} write-offs",
                        count: totalTransactions,
                      })}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSearchTerm("")}
                        className="gap-2 text-muted-foreground hover:text-foreground"
                      >
                        <RotateCcw className="h-4 w-4" />
                        {t("common.reset", { defaultValue: "Reset" })}
                      </Button>
                    )}
                  </div>
                </div>
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t("common.search", {
                      defaultValue: "Search...",
                    })}
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              {isTransactionsLoading ? (
                <div className="flex h-40 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <ScrollArea className="flex-1 min-h-0 overflow-hidden rounded-md border">
                    <div className="min-w-[800px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>
                              {t("common.date", { defaultValue: "Date" })}
                            </TableHead>
                            <TableHead>
                              {t("common.product", {
                                defaultValue: "Product",
                              })}
                            </TableHead>
                            <TableHead>
                              {t("common.quantity", {
                                defaultValue: "Quantity",
                              })}
                            </TableHead>
                            <TableHead>
                              {t("common.reason", { defaultValue: "Reason" })}
                            </TableHead>
                            <TableHead>
                              {t("common.user", { defaultValue: "User" })}
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {displayedTransactions.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={5}
                                className="h-24 text-center"
                              >
                                <div className="flex flex-col items-center justify-center gap-1 text-sm text-muted-foreground">
                                  <span>
                                    {t("common.noData", {
                                      defaultValue: "No data found.",
                                    })}
                                  </span>
                                  {hasActiveFilters && (
                                    <span>
                                      {t("common.tryAdjustingFilters", {
                                        defaultValue:
                                          "Try adjusting your filters.",
                                      })}
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : (
                            displayedTransactions.map((tx) => (
                              <TableRow key={tx.id}>
                                <TableCell>
                                  {format(
                                    new Date(tx.write_off_date),
                                    "PP p"
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col">
                                    <span className="font-medium">
                                      {tx.product_variation?.product?.name || "(Unknown Product)"}
                                    </span>
                                    {tx.product_variation?.name && (
                                      <span className="text-xs text-muted-foreground">
                                        {tx.product_variation.name}
                                      </span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>{tx.quantity}</TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className="capitalize"
                                  >
                                    {tx.reason || "-"}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {tx.user?.name || tx.user?.email || "-"}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </ScrollArea>
                  {displayedTransactions.length > 0 && (
                    <div className="flex flex-col gap-4 border-t border-border/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3 text-sm">
                        <label
                          className="text-sm font-medium text-foreground"
                          htmlFor="writeoffs-page-size"
                        >
                          {t("writeOffs.pagination.rowsPerPage", {
                            defaultValue: "Rows per page",
                          })}
                        </label>
                        <select
                          id="writeoffs-page-size"
                          className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                          value={pageSize}
                          onChange={(event) =>
                            handlePageSizeChange(event.target.value)
                          }
                        >
                          {PAGE_SIZE_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col gap-2 sm:items-end">
                        <Pagination className="mx-0 flex w-full justify-center sm:justify-end">
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious
                                href="#"
                                className={
                                  currentPage === 1
                                    ? "pointer-events-none opacity-50"
                                    : undefined
                                }
                                onClick={(event) => {
                                  event.preventDefault();
                                  if (currentPage > 1) {
                                    setCurrentPage(currentPage - 1);
                                  }
                                }}
                              />
                            </PaginationItem>
                            {pageNumbers.map((page) => (
                              <PaginationItem key={page}>
                                {typeof page === "number" ? (
                                  <PaginationLink
                                    href="#"
                                    isActive={page === currentPage}
                                    onClick={(event) => {
                                      event.preventDefault();
                                      setCurrentPage(page);
                                    }}
                                  >
                                    {page}
                                  </PaginationLink>
                                ) : (
                                  <PaginationEllipsis />
                                )}
                              </PaginationItem>
                            ))}
                            <PaginationItem>
                              <PaginationNext
                                href="#"
                                className={
                                  currentPage === totalPages
                                    ? "pointer-events-none opacity-50"
                                    : undefined
                                }
                                onClick={(event) => {
                                  event.preventDefault();
                                  if (currentPage < totalPages) {
                                    setCurrentPage(currentPage + 1);
                                  }
                                }}
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                        <span className="text-xs text-muted-foreground sm:text-right">
                          {t("writeOffs.pagination.showing", {
                            defaultValue:
                              "{{from}}-{{to}} of {{total}} write-offs",
                            from: showingFrom,
                            to: showingTo,
                            total: totalTransactions,
                          })}
                        </span>
                        <span className="text-xs text-muted-foreground sm:text-right">
                          {t("writeOffs.pagination.page", {
                            defaultValue: "Page {{current}} of {{total}}",
                            current: currentPage,
                            total: totalPages,
                          })}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
