import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Mail,
  Phone,
  Gift,
  Search,
  Sparkles,
  MoreHorizontal,
  Pencil,
  Trash2,
  RotateCcw,
  User,
  UserPlus,
  X,
  Eye,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/use-auth";
import { toast } from 'sonner'
import { api } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LoyaltyCard {
  id: string;
  points: number;
}

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  store_id: string;
  created_at: string;
  updated_at: string;
  loyalty_card: LoyaltyCard | null;
  _count: {
    transactions: number;
  };
}

type LoyaltyFilterValue = "all" | "member" | "non-member";
type ContactFilterValue = "all" | "email" | "phone" | "no-contact";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MetricCard = ({
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

export default function CustomersPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const locale = i18n.language || "ru-RU";
  const { userStore, getStore } = useAuth();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLoyaltyFilter, setSelectedLoyaltyFilter] =
    useState<LoyaltyFilterValue>("all");
  const [selectedContactFilter, setSelectedContactFilter] =
    useState<ContactFilterValue>("all");
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [loyaltyCustomer, setLoyaltyCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(
    null
  );
  const [deletingLoyaltyCard, setDeletingLoyaltyCard] =
    useState<Customer | null>(null);
  const [customerForm, setCustomerForm] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [loyaltyForm, setLoyaltyForm] = useState({
    points: "",
  });

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

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

  const customersQuery = useQuery({
    queryKey: ["customers", storeId],
    queryFn: async (): Promise<Customer[]> => {
      if (!storeId) return [];
      const res = await api.get<{ customers: Customer[] }>(
        `/api/customers?storeId=${encodeURIComponent(storeId)}`
      );
      return res.customers ?? [];
    },
    enabled: Boolean(storeId),
    refetchInterval: 1000 * 60 * 5,
  });

  const isLoading =
    storeQuery.isLoading ||
    customersQuery.isLoading ||
    customersQuery.isFetching;

  const customers = useMemo(
    () => customersQuery.data ?? [],
    [customersQuery.data]
  );

  const activeFilterCount =
    (selectedLoyaltyFilter !== "all" ? 1 : 0) +
    (selectedContactFilter !== "all" ? 1 : 0);
  const hasActiveFilters = activeFilterCount > 0;

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedLoyaltyFilter("all");
    setSelectedContactFilter("all");
  };

  const getLoyaltyFilterLabel = (value: LoyaltyFilterValue) => {
    switch (value) {
      case "member":
        return t("customers.filters.loyaltyMembers", {
          defaultValue: "Loyalty members",
        });
      case "non-member":
        return t("customers.filters.loyaltyNonMembers", {
          defaultValue: "No loyalty card",
        });
      default:
        return t("customers.filters.allCustomers", {
          defaultValue: "All customers",
        });
    }
  };

  const getContactFilterLabel = (value: ContactFilterValue) => {
    switch (value) {
      case "email":
        return t("customers.filters.contactEmail", {
          defaultValue: "Has email",
        });
      case "phone":
        return t("customers.filters.contactPhone", {
          defaultValue: "Has phone",
        });
      case "no-contact":
        return t("customers.filters.contactMissing", {
          defaultValue: "Missing contact info",
        });
      default:
        return t("customers.filters.contactAll", {
          defaultValue: "All contact types",
        });
    }
  };

  const getCustomerContactIdentifier = (customer?: Customer | null) =>
    customer?.phone?.trim() || customer?.email?.trim() || "";

  useEffect(() => {
    if (editingCustomer) {
      setCustomerForm({
        name: editingCustomer.name,
        email: editingCustomer.email ?? "",
        phone: editingCustomer.phone ?? "",
      });
    } else {
      setCustomerForm({ name: "", email: "", phone: "" });
    }
  }, [editingCustomer]);

  useEffect(() => {
    if (loyaltyCustomer) {
      setLoyaltyForm({
        points: loyaltyCustomer.loyalty_card
          ? String(loyaltyCustomer.loyalty_card.points)
          : "",
      });
    } else {
      setLoyaltyForm({ points: "" });
    }
  }, [loyaltyCustomer]);

  const updateCustomerMutation = useMutation({
    mutationFn: async ({
      id,
      name,
      email,
      phone,
    }: {
      id: string;
      name: string;
      email?: string;
      phone?: string;
    }) => {
      if (!storeId) {
        throw new Error(
          t("pos.noStoreSelected", {
            defaultValue: "No store selected.",
          })
        );
      }

      await api.put(
        `/api/customers/${id}?storeId=${encodeURIComponent(storeId)}`,
        {
          name,
          email: email ?? undefined,
          phone: phone ?? undefined,
        }
      );
    },
    onSuccess: async () => {
      if (storeId) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["customers", storeId] }),
          queryClient.invalidateQueries({
            queryKey: ["pos-customers", storeId],
          }),
        ]);
      }
      await customersQuery.refetch();
      setEditingCustomer(null);
      toast.success(
        t("customers.customerUpdated", {
          defaultValue: "Customer updated.",
        })
      );
    },
    onError: (error) => {
      console.error("Customer update failed", error);
      toast.error(error instanceof Error ? error.message : t("common.error"));
    },
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: async (customerId: string) => {
      if (!storeId) {
        throw new Error(
          t("pos.noStoreSelected", {
            defaultValue: "No store selected.",
          })
        );
      }

      await api.delete(
        `/api/customers/${customerId}?storeId=${encodeURIComponent(storeId)}`
      );
    },
    onSuccess: async () => {
      if (storeId) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["customers", storeId] }),
          queryClient.invalidateQueries({
            queryKey: ["pos-customers", storeId],
          }),
        ]);
      }
      await customersQuery.refetch();
      setDeletingCustomer(null);
      toast.success(
        t("customers.customerDeleted", {
          defaultValue: "Customer deleted.",
        })
      );
    },
    onError: (error) => {
      console.error("Customer deletion failed", error);
      toast.error(error instanceof Error ? error.message : t("common.error"));
    },
  });

  const loyaltyCardMutation = useMutation({
    mutationFn: async ({
      customerId,
      cardNumber,
      points,
      existingCard,
    }: {
      customerId: string;
      cardNumber: string;
      points: number;
      existingCard: boolean;
    }) => {
      if (!storeId) {
        throw new Error(
          t("pos.noStoreSelected", {
            defaultValue: "No store selected.",
          })
        );
      }

      const response = await api.post<{ loyalty_card: LoyaltyCard }>(
        `/api/customers/loyalty-cards?storeId=${encodeURIComponent(storeId)}`,
        {
          customer_id: customerId,
          card_number: cardNumber,
          points,
        }
      );

      return {
        ...response,
        existingCard,
      };
    },
    onSuccess: async (variables) => {
      if (storeId) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["customers", storeId] }),
          queryClient.invalidateQueries({
            queryKey: ["pos-customers", storeId],
          }),
        ]);
      }
      await customersQuery.refetch();
      setLoyaltyCustomer(null);
      toast.success(
        variables.existingCard
          ? t("customers.loyaltyCardUpdated", {
            defaultValue: "Loyalty card updated.",
          })
          : t("customers.loyaltyCardAdded", {
            defaultValue: "Loyalty card added.",
          })
      );
    },
    onError: (error) => {
      console.error("Loyalty card update failed", error);
      toast.error(error instanceof Error ? error.message : t("common.error"));
    },
  });

  const deleteLoyaltyCardMutation = useMutation({
    mutationFn: async (customerId: string) => {
      if (!storeId) {
        throw new Error(
          t("pos.noStoreSelected", {
            defaultValue: "No store selected.",
          })
        );
      }
      await api.delete(
        `/api/customers/${customerId}/loyalty-card?storeId=${encodeURIComponent(
          storeId
        )}`
      );
    },
    onSuccess: async () => {
      if (storeId) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["customers", storeId] }),
          queryClient.invalidateQueries({
            queryKey: ["pos-customers", storeId],
          }),
        ]);
      }
      await customersQuery.refetch();
      setLoyaltyCustomer(null);
      toast.success(
        t("customers.loyaltyCardDeleted", {
          defaultValue: "Loyalty card removed.",
        })
      );
    },
    onError: (error) => {
      console.error("Loyalty card deletion failed", error);
      toast.error(error instanceof Error ? error.message : t("common.error"));
    },
  });

  const isUpdatingCustomer = updateCustomerMutation.isPending;
  const isSavingLoyalty = loyaltyCardMutation.isPending;

  const handleCustomerFormSubmit = () => {
    if (!editingCustomer) {
      return;
    }

    const trimmedName = customerForm.name.trim();
    const trimmedEmail = customerForm.email.trim();
    const trimmedPhone = customerForm.phone.trim();

    if (!trimmedName) {
      toast.warning(
        t("customers.nameRequired", {
          defaultValue: "Customer name is required.",
        })
      );
      return;
    }

    if (trimmedEmail && !EMAIL_REGEX.test(trimmedEmail)) {
      toast.warning(
        t("customers.emailInvalid", {
          defaultValue: "Invalid email address.",
        })
      );
      return;
    }

    updateCustomerMutation.mutate({
      id: editingCustomer.id,
      name: trimmedName,
      email: trimmedEmail || undefined,
      phone: trimmedPhone || undefined,
    });
  };

  const handleLoyaltyFormSubmit = () => {
    if (!loyaltyCustomer) {
      return;
    }

    const parsedPoints = Number.parseInt(loyaltyForm.points, 10);
    const normalizedPoints = Number.isNaN(parsedPoints)
      ? 0
      : Math.max(0, parsedPoints);

    const contactIdentifier = getCustomerContactIdentifier(loyaltyCustomer);
    if (!contactIdentifier) {
      toast.warning(
        t("customers.contactRequiredForLoyalty", {
          defaultValue:
            "Add an email or phone number before creating a loyalty card.",
        })
      );
      return;
    }

    loyaltyCardMutation.mutate({
      customerId: loyaltyCustomer.id,
      points: normalizedPoints,
      existingCard: Boolean(loyaltyCustomer.loyalty_card),
      cardNumber: contactIdentifier,
    });
  };

  const handleDeleteCustomerConfirm = () => {
    if (!deletingCustomer) {
      return;
    }
    deleteCustomerMutation.mutate(deletingCustomer.id);
  };

  const handleDeleteLoyaltyCard = (customer: Customer) => {
    setDeletingLoyaltyCard(customer);
  };

  const handleDeleteLoyaltyCardConfirm = () => {
    if (!deletingLoyaltyCard) {
      return;
    }
    deleteLoyaltyCardMutation.mutate(deletingLoyaltyCard.id);
    setDeletingLoyaltyCard(null);
  };

  const filteredCustomers = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    return customers.filter((customer) => {
      const haystack = [customer.name, customer.email, customer.phone]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = normalized ? haystack.includes(normalized) : true;
      const matchesLoyalty =
        selectedLoyaltyFilter === "all" ||
        (selectedLoyaltyFilter === "member" &&
          Boolean(customer.loyalty_card)) ||
        (selectedLoyaltyFilter === "non-member" && !customer.loyalty_card);
      const matchesContact =
        selectedContactFilter === "all" ||
        (selectedContactFilter === "email" && Boolean(customer.email)) ||
        (selectedContactFilter === "phone" && Boolean(customer.phone)) ||
        (selectedContactFilter === "no-contact" &&
          !customer.email &&
          !customer.phone);

      return matchesSearch && matchesLoyalty && matchesContact;
    });
  }, [customers, searchQuery, selectedLoyaltyFilter, selectedContactFilter]);

  const totals = useMemo(() => {
    return filteredCustomers.reduce(
      (acc, customer) => {
        acc.count += 1;
        if (customer.email) acc.withEmail += 1;
        if (customer.phone) acc.withPhone += 1;
        if (customer.loyalty_card) {
          acc.loyaltyMembers += 1;
          acc.totalPoints += customer.loyalty_card.points;
        }
        acc.totalTransactions += customer._count?.transactions ?? 0;
        return acc;
      },
      {
        count: 0,
        withEmail: 0,
        withPhone: 0,
        loyaltyMembers: 0,
        totalPoints: 0,
        totalTransactions: 0,
      }
    );
  }, [filteredCustomers]);

  const totalCustomers = filteredCustomers.length;
  const displayedCustomers = useMemo(() => {
    if (totalCustomers === 0) {
      return [];
    }
    const startIndex = (currentPage - 1) * pageSize;
    return filteredCustomers.slice(startIndex, startIndex + pageSize);
  }, [filteredCustomers, currentPage, pageSize, totalCustomers]);

  const totalPages = Math.max(1, Math.ceil(totalCustomers / pageSize));
  const showingFrom =
    totalCustomers === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const showingTo =
    totalCustomers === 0
      ? 0
      : Math.min(
        (currentPage - 1) * pageSize + displayedCustomers.length,
        totalCustomers
      );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, pageSize, selectedLoyaltyFilter, selectedContactFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

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

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(displayedCustomers.map((c) => c.id));
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
        Array.from(selectedIds).map((id) =>
          api.delete(
            `/api/customers/${id}?storeId=${encodeURIComponent(storeId || "")}`
          )
        )
      );

      toast.success(
        t("customers.bulkDeleteSuccess", {
          defaultValue: "Customers deleted successfully",
        })
      );
      setSelectedIds(new Set());
      setShowBulkDeleteConfirm(false);
      customersQuery.refetch();
    } catch (error) {
      console.error("Bulk delete failed", error);
      toast.error(
        t("customers.bulkDeleteError", {
          defaultValue: "Failed to delete customers",
        })
      );
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleAddCustomer = () => {
    navigate("/customers/new");
  };

  const isAllSelected =
    displayedCustomers.length > 0 &&
    selectedIds.size === displayedCustomers.length;
  const isIndeterminate = selectedIds.size > 0 && !isAllSelected;

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 md:px-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t("customers.title", { defaultValue: "Customers" })}
        </h1>
        <Button onClick={handleAddCustomer} className="gap-2">
          <UserPlus className="h-4 w-4" />
          {t("customers.addCustomer", { defaultValue: "Add customer" })}
        </Button>
      </header>

      <main className="flex flex-1 min-h-0 flex-col gap-4 overflow-hidden p-4 md:p-6">
        {customersQuery.error ? (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {t("customers.customerNotFound", {
              defaultValue: "Unable to load customers.",
            })}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title={t("customers.metrics.totalCustomers", {
              defaultValue: "Customers",
            })}
            value={formatNumber(totals.count, locale)}
            description={t("customers.metrics.totalCustomersDescription", {
              defaultValue: "Active profiles",
            })}
            icon={Users}
          />
          <MetricCard
            title={t("customers.loyaltyCard", { defaultValue: "Loyalty" })}
            value={formatNumber(totals.loyaltyMembers, locale)}
            description={t("customers.loyaltyMembers", {
              defaultValue: "Members",
            })}
            icon={Gift}
          />
          <MetricCard
            title={t("customers.customerEmail", { defaultValue: "Email" })}
            value={formatNumber(totals.withEmail, locale)}
            description={t("customers.metrics.emailContactsDescription", {
              defaultValue: "Email contacts",
            })}
            icon={Mail}
          />
          <MetricCard
            title={t("customers.customerPhone", { defaultValue: "Phone" })}
            value={formatNumber(totals.withPhone, locale)}
            description={t("customers.metrics.phoneContactsDescription", {
              defaultValue: "Phone contacts",
            })}
            icon={Phone}
          />
        </section>

        <div className="flex flex-1 min-h-0 flex-col overflow-hidden rounded-md border bg-card shadow-none">
          <div className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur-sm">
            <div className="flex flex-col gap-4 p-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {t("customers.title")}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t("customers.found", {
                    defaultValue: "{{count}} customers",
                    count: totalCustomers,
                  })}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="px-2 py-0 text-xs">
                      {activeFilterCount}
                    </Badge>
                  )}
                </div>
                {hasActiveFilters ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="gap-2 text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw className="h-4 w-4" />
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
              <div className="grid gap-3 md:grid-cols-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-muted-foreground md:block" />
                  <Input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder={t("customers.searchCustomers", {
                      defaultValue: "Search customers...",
                    })}
                    className="pl-3 md:pl-10"
                  />
                </div>
                <Select
                  value={selectedLoyaltyFilter}
                  onValueChange={(value) =>
                    setSelectedLoyaltyFilter(value as LoyaltyFilterValue)
                  }
                >
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue
                      placeholder={t("customers.filters.loyalty", {
                        defaultValue: "Loyalty status",
                      })}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {t("customers.filters.allCustomers", {
                        defaultValue: "All customers",
                      })}
                    </SelectItem>
                    <SelectItem value="member">
                      {t("customers.filters.loyaltyMembers", {
                        defaultValue: "Loyalty members",
                      })}
                    </SelectItem>
                    <SelectItem value="non-member">
                      {t("customers.filters.loyaltyNonMembers", {
                        defaultValue: "No loyalty card",
                      })}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={selectedContactFilter}
                  onValueChange={(value) =>
                    setSelectedContactFilter(value as ContactFilterValue)
                  }
                >
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue
                      placeholder={t("customers.filters.contact", {
                        defaultValue: "Contact info",
                      })}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {t("customers.filters.contactAll", {
                        defaultValue: "All contact types",
                      })}
                    </SelectItem>
                    <SelectItem value="email">
                      {t("customers.filters.contactEmail", {
                        defaultValue: "Has email",
                      })}
                    </SelectItem>
                    <SelectItem value="phone">
                      {t("customers.filters.contactPhone", {
                        defaultValue: "Has phone",
                      })}
                    </SelectItem>
                    <SelectItem value="no-contact">
                      {t("customers.filters.contactMissing", {
                        defaultValue: "Missing contact info",
                      })}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {hasActiveFilters ? (
                <div className="flex flex-wrap gap-2">
                  {selectedLoyaltyFilter !== "all" ? (
                    <Badge className="gap-1.5 px-2.5 py-1 text-xs font-medium">
                      <Gift className="h-3.5 w-3.5" />
                      {getLoyaltyFilterLabel(selectedLoyaltyFilter)}
                      <button
                        onClick={() => setSelectedLoyaltyFilter("all")}
                        className="ml-1 rounded-sm p-0.5 hover:bg-muted"
                        aria-label={t("common.remove", {
                          defaultValue: "Remove",
                        })}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ) : null}
                  {selectedContactFilter !== "all" ? (
                    <Badge className="gap-1.5 px-2.5 py-1 text-xs font-medium">
                      {selectedContactFilter === "phone" ? (
                        <Phone className="h-3.5 w-3.5" />
                      ) : selectedContactFilter === "email" ? (
                        <Mail className="h-3.5 w-3.5" />
                      ) : (
                        <User className="h-3.5 w-3.5" />
                      )}
                      {getContactFilterLabel(selectedContactFilter)}
                      <button
                        onClick={() => setSelectedContactFilter("all")}
                        className="ml-1 rounded-sm p-0.5 hover:bg-muted"
                        aria-label={t("common.remove", {
                          defaultValue: "Remove",
                        })}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
          <div className="flex flex-1 flex-col overflow-hidden">
            {isLoading ? (
              <div className="space-y-2 p-6">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-16 w-full rounded-md" />
                ))}
              </div>
            ) : (
              <>
                <div className="flex-1 min-h-0 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="min-w-[960px]">
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
                            <TableHead>
                              {t("customers.customer", {
                                defaultValue: "Customer",
                              })}
                            </TableHead>
                            <TableHead>
                              {t("customers.contact", {
                                defaultValue: "Contact",
                              })}
                            </TableHead>
                            <TableHead>
                              {t("customers.loyalty", {
                                defaultValue: "Loyalty",
                              })}
                            </TableHead>
                            <TableHead className="text-right">
                              {t("customers.transactions", {
                                defaultValue: "Transactions",
                              })}
                            </TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {displayedCustomers.length > 0 ? (
                            displayedCustomers.map((customer) => {
                              const isSelected = selectedIds.has(customer.id);
                              return (
                                <TableRow
                                  key={customer.id}
                                  data-state={isSelected && "selected"}
                                  className="cursor-pointer hover:bg-muted/50"
                                  onClick={() =>
                                    navigate(`/customers/${customer.id}`, {
                                      state: { customerName: customer.name },
                                    })
                                  }
                                >
                                  <TableCell className="px-1">
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={(value) =>
                                        toggleSelectRow(customer.id, !!value)
                                      }
                                      aria-label="Select row"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex flex-col gap-1">
                                      <span className="font-medium text-foreground">
                                        {customer.name}
                                      </span>
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Badge
                                          variant="outline"
                                          className="flex items-center gap-1"
                                        >
                                          <Sparkles className="size-3" />
                                          {t("customers.joined", {
                                            defaultValue: "Joined",
                                          })}{" "}
                                          {new Date(
                                            customer.created_at
                                          ).toLocaleDateString(locale)}
                                        </Badge>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex flex-col gap-2">
                                      <div className="flex flex-wrap items-center gap-2">
                                        {customer.phone ? (
                                          <Badge
                                            variant="outline"
                                            className="flex items-center gap-1"
                                          >
                                            <Phone className="size-3" />
                                            {customer.phone}
                                          </Badge>
                                        ) : null}
                                        {customer.email ? (
                                          <Badge
                                            variant="outline"
                                            className="flex items-center gap-1"
                                          >
                                            <Mail className="size-3" />
                                            {customer.email}
                                          </Badge>
                                        ) : null}
                                        {!customer.phone && !customer.email && (
                                          <span className="text-sm text-muted-foreground">
                                            —
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {customer.loyalty_card ? (
                                      <div className="flex items-center gap-2">
                                        <Badge
                                          variant="secondary"
                                          className="flex items-center gap-1"
                                        >
                                          <Gift className="size-3" />
                                          {formatNumber(
                                            customer.loyalty_card.points,
                                            locale
                                          )}{" "}
                                          {t("customers.points", {
                                            defaultValue: "pts",
                                          })}
                                        </Badge>
                                      </div>
                                    ) : (
                                      <span className="text-sm text-muted-foreground">
                                        —
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right font-medium">
                                    {formatNumber(
                                      customer._count?.transactions ?? 0,
                                      locale
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger
                                        asChild
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <Button
                                          variant="ghost"
                                          className="h-8 w-8 p-0"
                                        >
                                          <span className="sr-only">
                                            {t("common.openMenu", {
                                              defaultValue: "Open menu",
                                            })}
                                          </span>
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>
                                          {t("common.actions", {
                                            defaultValue: "Actions",
                                          })}
                                        </DropdownMenuLabel>
                                        <DropdownMenuItem
                                          onClick={() =>
                                            navigate(
                                              `/customers/${customer.id}`,
                                              {
                                                state: {
                                                  customerName: customer.name,
                                                },
                                              }
                                            )
                                          }
                                        >
                                          <Eye className="mr-2 h-4 w-4" />
                                          {t("common.viewDetails", {
                                            defaultValue: "View details",
                                          })}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() =>
                                            navigate(
                                              `/customers/${customer.id}/edit`,
                                              {
                                                state: {
                                                  customerName: customer.name,
                                                },
                                              }
                                            )
                                          }
                                        >
                                          <Pencil className="mr-2 h-4 w-4" />
                                          {t("common.edit", {
                                            defaultValue: "Edit",
                                          })}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() =>
                                            setLoyaltyCustomer(customer)
                                          }
                                        >
                                          <Gift className="mr-2 h-4 w-4" />
                                          {customer.loyalty_card
                                            ? t("customers.editLoyalty", {
                                              defaultValue: "Edit loyalty",
                                            })
                                            : t("customers.addLoyalty", {
                                              defaultValue: "Add loyalty",
                                            })}
                                        </DropdownMenuItem>
                                        {customer.loyalty_card && (
                                          <DropdownMenuItem
                                            className="text-destructive focus:text-destructive"
                                            onClick={() =>
                                              handleDeleteLoyaltyCard(customer)
                                            }
                                          >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            {t("customers.deleteLoyalty", {
                                              defaultValue: "Delete loyalty",
                                            })}
                                          </DropdownMenuItem>
                                        )}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          className="text-destructive focus:text-destructive"
                                          onClick={() =>
                                            setDeletingCustomer(customer)
                                          }
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          {t("common.delete", {
                                            defaultValue: "Delete",
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
                              <TableCell
                                colSpan={6}
                                className="h-24 text-center"
                              >
                                <div className="flex flex-col items-center justify-center gap-1 text-sm text-muted-foreground">
                                  <span>
                                    {t("customers.noCustomersFound", {
                                      defaultValue: "No customers found.",
                                    })}
                                  </span>
                                  <span>
                                    {t("customers.tryAdjustingFilters", {
                                      defaultValue:
                                        "Try adjusting your filters.",
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
                <div className="flex flex-col gap-4 border-t border-border/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3 text-sm">
                    <label
                      className="text-sm font-medium text-foreground"
                      htmlFor="customers-page-size"
                    >
                      {t("customers.pagination.rowsPerPage", {
                        defaultValue: "Rows per page",
                      })}
                    </label>
                    <select
                      id="customers-page-size"
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
                      {t("customers.pagination.showing", {
                        defaultValue: "{{from}}-{{to}} of {{total}} customers",
                        from: showingFrom,
                        to: showingTo,
                        total: totalCustomers,
                      })}
                    </span>
                    <span className="text-xs text-muted-foreground sm:text-right">
                      {t("customers.pagination.page", {
                        defaultValue: "Page {{current}} of {{total}}",
                        current: currentPage,
                        total: totalPages,
                      })}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <Dialog
        open={Boolean(editingCustomer)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingCustomer(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t("customers.editCustomer", {
                defaultValue: "Edit customer",
              })}
            </DialogTitle>
            <DialogDescription className="truncate">
              {editingCustomer?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-customer-name">
                {t("customers.customerName", {
                  defaultValue: "Customer name",
                })}
              </Label>
              <Input
                id="edit-customer-name"
                value={customerForm.name}
                onChange={(event) =>
                  setCustomerForm((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
                placeholder={t("customers.enterCustomerName", {
                  defaultValue: "Enter customer name",
                })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-customer-email">
                {t("customers.customerEmail", {
                  defaultValue: "Customer email",
                })}
              </Label>
              <Input
                id="edit-customer-email"
                type="email"
                value={customerForm.email}
                onChange={(event) =>
                  setCustomerForm((prev) => ({
                    ...prev,
                    email: event.target.value,
                  }))
                }
                placeholder={t("customers.enterCustomerEmail", {
                  defaultValue: "Enter customer email",
                })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-customer-phone">
                {t("customers.customerPhone", {
                  defaultValue: "Customer phone",
                })}
              </Label>
              <Input
                id="edit-customer-phone"
                value={customerForm.phone}
                onChange={(event) =>
                  setCustomerForm((prev) => ({
                    ...prev,
                    phone: event.target.value,
                  }))
                }
                placeholder={t("customers.enterCustomerPhone", {
                  defaultValue: "Enter customer phone",
                })}
              />
            </div>
          </div>
          <DialogFooter className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setEditingCustomer(null)}
              disabled={isUpdatingCustomer}
            >
              {t("common.cancel", { defaultValue: "Cancel" })}
            </Button>
            <Button
              onClick={handleCustomerFormSubmit}
              disabled={isUpdatingCustomer}
            >
              {isUpdatingCustomer
                ? t("common.loading", { defaultValue: "Loading..." })
                : t("common.save", { defaultValue: "Save" })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(loyaltyCustomer)}
        onOpenChange={(open) => {
          if (!open) {
            setLoyaltyCustomer(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {loyaltyCustomer?.loyalty_card
                ? t("customers.editLoyaltyCard", {
                  defaultValue: "Edit loyalty card",
                })
                : t("customers.addLoyaltyCard", {
                  defaultValue: "Add loyalty card",
                })}
            </DialogTitle>
            <DialogDescription className="truncate">
              {loyaltyCustomer?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t("customers.loyaltyContactHint", {
                defaultValue:
                  "The loyalty card will be linked to the customer's phone number or email.",
              })}
            </p>
            <div className="space-y-2">
              <Label htmlFor="loyalty-points">
                {t("customers.loyaltyPoints", {
                  defaultValue: "Points",
                })}
              </Label>
              <Input
                id="loyalty-points"
                type="number"
                min="0"
                value={loyaltyForm.points}
                onChange={(event) =>
                  setLoyaltyForm({ points: event.target.value })
                }
                placeholder={t("customers.enterPoints", {
                  defaultValue: "Enter points",
                })}
              />
            </div>
          </div>
          <DialogFooter className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setLoyaltyCustomer(null)}
              disabled={isSavingLoyalty}
            >
              {t("common.cancel", { defaultValue: "Cancel" })}
            </Button>
            <Button
              onClick={handleLoyaltyFormSubmit}
              disabled={isSavingLoyalty}
            >
              {isSavingLoyalty
                ? t("common.loading", { defaultValue: "Loading..." })
                : t("common.save", { defaultValue: "Save" })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={Boolean(deletingCustomer)}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingCustomer(null);
          }
        }}
        title={t("customers.deleteCustomer", {
          defaultValue: "Delete customer",
        })}
        description={t("customers.deleteCustomerConfirm", {
          defaultValue:
            "Are you sure you want to delete this customer? This action cannot be undone.",
        })}
        onConfirm={handleDeleteCustomerConfirm}
        confirmText={t("common.delete", { defaultValue: "Delete" })}
      />

      <ConfirmationDialog
        open={Boolean(deletingLoyaltyCard)}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingLoyaltyCard(null);
          }
        }}
        title={t("customers.deleteLoyaltyCard", {
          defaultValue: "Delete loyalty card",
        })}
        description={t("customers.deleteLoyaltyCardConfirm", {
          defaultValue:
            "Are you sure you want to remove the loyalty card from this customer? Points will be lost.",
        })}
        onConfirm={handleDeleteLoyaltyCardConfirm}
        confirmText={t("common.delete", { defaultValue: "Delete" })}
      />
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
              {t("customers.bulkDeleteConfirm", {
                defaultValue:
                  "Are you sure you want to delete {count} customers? This action cannot be undone.",
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
    </div>
  );
}
