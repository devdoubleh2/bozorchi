import * as React from "react";
import { ChevronsUpDown, Plus, Store as StoreIcon, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { usePOSStore } from "@/context/POSStore";
import type { Store } from "@/types/auth";

export function StoreSwitcher() {
  const { isMobile } = useSidebar();
  const { user, userStore, switchStore } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = React.useState(false);

  // Prevent race conditions - store the current switching operation
  const abortControllerRef = React.useRef<AbortController | null>(null);

  const isOwnerRole =
    !!user?.owned_organization;

  // Only organization owners can see/switch stores
  const { data: storesResponse } = useQuery({
    queryKey: ["stores"],
    queryFn: () => api.get<{ stores: Store[] }>("/api/stores"),
    enabled: !!isOwnerRole,
  });

  const stores = React.useMemo(() => {
    if (!isOwnerRole) {
      if (userStore) {
        return [
          {
            id: userStore.store_id,
            name: userStore.store.name,
            role: userStore.role,
            store: userStore.store,
          },
        ];
      }
      return [];
    }

    return (
      storesResponse?.stores.map((store) => ({
        id: store.id,
        name: store.name,
        role: "owner" as const,
        store: store,
      })) || []
    );
  }, [isOwnerRole, userStore, storesResponse]);

  const activeStore = userStore?.store;

  const handleStoreChange = async (storeId: string) => {
    // Prevent multiple concurrent store switches
    if (isLoading) return;

    try {
      setIsLoading(true);

      // Cancel any previous ongoing store switch
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      // Use the AuthStore's switchStore method which handles permissions and backend API
      const { success, error } = await switchStore(storeId);

      if (!success) {
        console.error("Failed to switch store:", error?.message);
        // Optionally: show toast notification to user
        // toast.error(error?.message || t("common.errorSwitchingStore"));
        return;
      }

      // Invalidate store-dependent queries but NOT the store query itself
      // (switchStore already updated Zustand state with new store)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["pos-inventory"] }),
        queryClient.invalidateQueries({ queryKey: ["pos-customers"] }),
        queryClient.invalidateQueries({ queryKey: ["products"] }),
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["inventory"] }),
      ]);

      // Reset POS state to clear cart, sessions, etc.
      usePOSStore.getState().reset();

    } catch (error) {
      // Check if error was due to abort (previous request cancellation)
      if (error instanceof Error && error.name === "AbortError") {
        console.debug("Store switch was cancelled");
        return;
      }

      console.error("Failed to switch store:", error);
      // Optionally: show toast notification to user
      // toast.error(t("common.errorSwitchingStore"));
    } finally {
      setIsLoading(false);
    }
  };

  // For cashiers, just show a non-interactive button
  if (!isOwnerRole) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-default hover:bg-transparent hover:text-sidebar-foreground"
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <StoreIcon className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">
                {activeStore?.name || "Store"}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {userStore?.role === "owner" ? "Owner" : "Cashier"}
              </span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              disabled={isLoading}
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <StoreIcon className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {activeStore?.name || "Select Store"}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  Owner
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              {t("storeSetup.selectStore.title", { defaultValue: "Stores" })}
            </DropdownMenuLabel>
            {stores.map((store) => (
              <DropdownMenuItem
                key={store.id}
                onClick={() => handleStoreChange(store.id)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-sm border">
                  <StoreIcon className="size-4 shrink-0" />
                </div>
                {store.name}
                {activeStore?.id === store.id && (
                  <Check className="ml-auto size-4" />
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 p-2"
              onClick={() => navigate("/stores/new")}
            >
              <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                <Plus className="size-4" />
              </div>
              <div className="font-medium text-muted-foreground">
                {t("storeSetup.create", { defaultValue: "Add store" })}
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
