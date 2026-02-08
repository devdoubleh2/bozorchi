import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  IconCreditCard,
  IconDotsVertical,
  IconLoader,
  IconLogout,
  IconUserCircle,
} from "@tabler/icons-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
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

type NavUserProps = {
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  onLogout?: () => void;
  onAccount?: () => void;
  onBilling?: () => void;
  isBillingLoading?: boolean;
};

export function NavUser({
  name,
  email,
  avatarUrl,
  onLogout,
  onAccount,
  onBilling,
  isBillingLoading,
}: NavUserProps) {
  const { t } = useTranslation();
  const { isMobile } = useSidebar();

  const initials = useMemo(() => {
    if (name && name.trim().length > 0) {
      return name
        .split(" ")
        .map((part) => part.charAt(0).toUpperCase())
        .slice(0, 2)
        .join("");
    }
    if (email) {
      return email.charAt(0).toUpperCase();
    }
    return "US";
  }, [name, email]);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt={name ?? email ?? "User"} />
                ) : null}
                <AvatarFallback className="rounded-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-medium">
                  {name ?? email ?? "User"}
                </span>
                {email ? (
                  <span className="truncate text-xs text-muted-foreground">
                    {email}
                  </span>
                ) : null}
              </div>
              <IconDotsVertical className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  {avatarUrl ? (
                    <AvatarImage
                      src={avatarUrl}
                      alt={name ?? email ?? "User"}
                    />
                  ) : null}
                  <AvatarFallback className="rounded-lg">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {name ?? email ?? "User"}
                  </span>
                  {email ? (
                    <span className="truncate text-xs text-muted-foreground">
                      {email}
                    </span>
                  ) : null}
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={onAccount}>
                <IconUserCircle size={16} />
                {t("settings.account")}
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!onBilling || isBillingLoading}
                onClick={onBilling}
              >
                {isBillingLoading ? (
                  <IconLoader className="animate-spin" size={16} />
                ) : (
                  <IconCreditCard size={16} />
                )}
                {t("settings.subscription")}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              onClick={onLogout}
            >
              <IconLogout size={16} />
              {t("settings.signOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
