import { useState, useCallback, useEffect, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ShieldCheck, Trash2, RefreshCcw, Clock, MoreHorizontal, Link2, Copy, Check, TicketPlus } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { isOwner } from "@/types/auth";

type PermissionType =
  | "POS_ACCESS"
  | "MANAGE_PRODUCTS"
  | "MANAGE_INVENTORY"
  | "VIEW_COST_PRICE"
  | "VIEW_ANALYTICS"
  | "VIEW_DASHBOARD";

interface StaffAssignment {
  id: string;
  user: {
    email: string;
    name?: string | null;
  };
  role: string;
  approved: boolean;
  permissions: PermissionType[];
  created_at: string;
}

interface StaffAssignmentsResponse {
  pending: StaffAssignment[];
  approved: StaffAssignment[];
}

type InviteStatus = "outstanding" | "used" | "revoked" | "expired";

interface StoreInvite {
  id: string;
  organization_id: string;
  store_id: string;
  store_name: string | null;
  expires_at: string;
  used_at: string | null;
  revoked_at: string | null;
  created_at: string;
  status: InviteStatus;
}

interface InvitesResponse {
  invites: StoreInvite[];
}

interface CreateInviteResponse {
  invite: StoreInvite;
  token: string;
}

const buildInviteLink = (token: string): string =>
  `${window.location.origin}/register?invite=${encodeURIComponent(token)}`;

interface StaffPageProps {
  standalone?: boolean;
}

export default function StaffPage({ standalone = false }: StaffPageProps) {
  const { t } = useTranslation();
  const { userStore, user } = useAuth();
  const queryClient = useQueryClient();

  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<StaffAssignment | null>(null);
  const [freshInvite, setFreshInvite] = useState<{ invite: StoreInvite; token: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const storeId = userStore?.store?.id ?? "";

  const isOwnerRole = isOwner(user);

  const { data: assignments } = useQuery({
    queryKey: ["staffAssignments", storeId],
    queryFn: async () =>
      api.get<StaffAssignmentsResponse>("/api/staff/assignments"),
    enabled: isOwnerRole && Boolean(storeId),
    refetchInterval: isOwnerRole ? 5000 : false,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const pendingAssignments: StaffAssignment[] = (assignments?.pending ?? []).filter(
    (a) => a.user.email !== user?.email
  );
  const activeAssignments: StaffAssignment[] = (assignments?.approved ?? []).filter(
    (a) => a.user.email !== user?.email
  );

  const { data: invitesData } = useQuery({
    queryKey: ["storeInvites"],
    queryFn: async () => api.get<InvitesResponse>("/api/staff/invites"),
    enabled: isOwnerRole,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const outstandingInvites: StoreInvite[] = (invitesData?.invites ?? []).filter(
    (invite) => invite.status === "outstanding"
  );

  const expiredInvites: StoreInvite[] = (invitesData?.invites ?? []).filter(
    (invite) => invite.status === "expired"
  );

  const invalidateInvites = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["storeInvites"] });
  }, [queryClient]);

  const createInviteMutation = useMutation({
    mutationFn: () =>
      api.post<CreateInviteResponse>("/api/staff/invites", {
        store_id: storeId,
      }),
    onSuccess: (result) => {
      setFreshInvite({ invite: result.invite, token: result.token });
      setActionMessage(
        t("staff.invites.created", { defaultValue: "Invite created. Share the link with the new cashier." })
      );
      invalidateInvites();
    },
    onError: (error: Error) => {
      setActionMessage(error.message || t("errors.generic"));
    },
  });

  const revokeInviteMutation = useMutation({
    mutationFn: (inviteId: string) =>
      api.delete<{ message: string }>(`/api/staff/invites/${inviteId}`),
    onSuccess: () => {
      setActionMessage(t("staff.invites.revoked", { defaultValue: "Invite revoked." }));
      invalidateInvites();
    },
    onError: (error: Error) => {
      setActionMessage(error.message || t("errors.generic"));
    },
  });

  const copyInviteLink = useCallback(async (token: string) => {
    try {
      await navigator.clipboard.writeText(buildInviteLink(token));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, []);

  const invalidateAssignments = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ["staffAssignments", storeId],
    });
  }, [queryClient, storeId]);

  const approveMutation = useMutation({
    mutationFn: (data: { assignmentId: string; permissions?: PermissionType[] }) =>
      api.post<{ message: string }>(
        `/api/staff/assignments/${data.assignmentId}/approve`,
        data.permissions ? { permissions: data.permissions } : undefined
      ),
    onSuccess: () => {
      setActionMessage(t("staff.approveSuccess"));
      invalidateAssignments();
    },
    onError: (error: Error) => {
      setActionMessage(error.message || t("errors.generic"));
    },
  });

  const removeMutation = useMutation({
    mutationFn: (assignmentId: string) =>
      api.delete<{ message: string }>(`/api/staff/assignments/${assignmentId}`),
    onSuccess: () => {
      setActionMessage(t("staff.removeSuccess"));
      invalidateAssignments();
    },
    onError: (error: Error) => {
      setActionMessage(error.message || t("errors.generic"));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { assignmentId: string; permissions: PermissionType[] }) =>
      api.put<{ message: string }>(
        `/api/staff/assignments/${data.assignmentId}`,
        {
          permissions: data.permissions,
        }
      ),
    onSuccess: () => {
      setActionMessage(t("staff.updateSuccess"));
      invalidateAssignments();
    },
    onError: (error: Error) => {
      setActionMessage(error.message || t("errors.generic"));
    },
  });

  interface WrapperProps {
    children: ReactNode;
  }

  const Wrapper = ({ children }: WrapperProps) =>
    standalone ? (
      <div className="min-h-screen bg-muted/30 px-4 py-8">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
          {children}
        </div>
      </div>
    ) : (
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6">
        {children}
      </div>
    );

  const renderAssignmentRow = (
    assignment: StaffAssignment,
    isPending: boolean
  ) => {
    const PERMISSION_LABELS: Record<PermissionType, string> = {
      POS_ACCESS: t("staff.permissions.posAccess", { defaultValue: "POS" }),
      MANAGE_PRODUCTS: t("staff.permissions.manageProducts", { defaultValue: "Products" }),
      MANAGE_INVENTORY: t("staff.permissions.manageInventory", { defaultValue: "Inventory" }),
      VIEW_COST_PRICE: t("staff.permissions.viewCostPrice", { defaultValue: "Cost Price" }),
      VIEW_ANALYTICS: t("staff.permissions.viewAnalytics", { defaultValue: "Analytics" }),
      VIEW_DASHBOARD: t("staff.permissions.viewDashboard", { defaultValue: "Dashboard" }),
    };

    return (
      <TableRow key={assignment.id}>
        <TableCell>
          <span className="font-medium">
            {assignment.user.name || "-"}
          </span>
        </TableCell>
        <TableCell>
          <span className="text-muted-foreground">
            {assignment.user.email}
          </span>
        </TableCell>
        <TableCell>
          {isPending ? (
            <Badge variant="secondary">{t("common.pending")}</Badge>
          ) : (
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20">
              {t("common.approved")}
            </Badge>
          )}
        </TableCell>
        <TableCell className="text-sm text-muted-foreground">
          {new Date(assignment.created_at).toLocaleDateString()}
        </TableCell>
        <TableCell>
          <div className="flex flex-wrap gap-1">
            {assignment.permissions.length > 0 ? (
              assignment.permissions.map((perm) => (
                <Badge key={perm} variant="outline" className="text-xs">
                  {PERMISSION_LABELS[perm]}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">{t("staff.noPermissions", { defaultValue: "No permissions" })}</span>
            )}
          </div>
        </TableCell>
        <TableCell className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isPending ? (
                <>
                  <DropdownMenuItem
                    onClick={() => approveMutation.mutate({ assignmentId: assignment.id })}
                    disabled={approveMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    {t("staff.approve")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedAssignment(assignment);
                      setRoleDialogOpen(true);
                    }}
                    className="flex items-center gap-2"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    {t("staff.approveWithPermissions", {
                      defaultValue: "Set permissions & approve",
                    })}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => removeMutation.mutate(assignment.id)}
                    disabled={removeMutation.isPending}
                    className="text-destructive flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    {t("common.remove")}
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedAssignment(assignment);
                      setRoleDialogOpen(true);
                    }}
                    className="flex items-center gap-2"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    {t("staff.assignRole", { defaultValue: "Assign Role" })}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => removeMutation.mutate(assignment.id)}
                    disabled={removeMutation.isPending}
                    className="text-destructive flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    {t("common.remove")}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    );
  };

  if (!userStore) {
    return (
      <Wrapper>
        <Card>
          <CardHeader>
            <CardTitle>{t("common.loading")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{t("common.loading")}</p>
          </CardContent>
        </Card>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      {actionMessage ? (
        <div className="rounded-md border border-border/60 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          {actionMessage}
        </div>
      ) : null}

      {!isOwnerRole && (
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="size-5 text-muted-foreground" />
              {t("staff.sellerPendingTitle", { defaultValue: "Waiting for manager approval" })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {t("staff.sellerPendingDescription", {
                defaultValue:
                  "Your request is with your manager. Once they approve you, till access unlocks.",
              })}
            </p>
          </CardContent>
        </Card>
      )}

      {isOwnerRole && (
        <>
          <Card className="border-border/60">
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="flex items-center gap-2">
                <Link2 className="size-5 text-muted-foreground" />
                {t("staff.invites.title", { defaultValue: "Cashier invites" })}
              </CardTitle>
              <Button
                size="sm"
                onClick={() => {
                  setFreshInvite(null);
                  createInviteMutation.mutate();
                }}
                disabled={createInviteMutation.isPending || !storeId}
              >
                <TicketPlus className="mr-2 size-4" />
                {t("staff.invites.create", { defaultValue: "New invite" })}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t("staff.invites.description", {
                  defaultValue:
                    "Create a single-use invite link for this store and share it with the new cashier. They join as pending until you approve them below.",
                })}
              </p>

              {freshInvite ? (
                <div className="rounded-md border border-border/60 bg-muted/40 px-4 py-3">
                  <p className="text-sm font-medium">
                    {t("staff.invites.shareTitle", { defaultValue: "Share this invite link" })}
                  </p>
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <code className="min-w-0 flex-1 truncate rounded bg-background px-2 py-1.5 text-xs">
                      {buildInviteLink(freshInvite.token)}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyInviteLink(freshInvite.token)}
                    >
                      {copied ? (
                        <Check className="mr-2 size-4" />
                      ) : (
                        <Copy className="mr-2 size-4" />
                      )}
                      {copied
                        ? t("common.copied", { defaultValue: "Copied" })
                        : t("common.copy", { defaultValue: "Copy" })}
                    </Button>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {t("staff.invites.codeLabel", { defaultValue: "Invite code:" })}{" "}
                    <code className="break-all">{freshInvite.token}</code>
                  </p>
                </div>
              ) : null}

              {outstandingInvites.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("staff.invites.none", { defaultValue: "No outstanding invites." })}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("staff.invites.store", { defaultValue: "Store" })}</TableHead>
                        <TableHead>{t("staff.invites.expires", { defaultValue: "Expires" })}</TableHead>
                        <TableHead className="text-right">{t("common.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {outstandingInvites.map((invite) => (
                        <TableRow key={invite.id}>
                          <TableCell>
                            <span className="font-medium">
                              {invite.store_name ?? invite.store_id}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(invite.expires_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive"
                              onClick={() => revokeInviteMutation.mutate(invite.id)}
                              disabled={revokeInviteMutation.isPending}
                            >
                              {t("staff.invites.revoke", { defaultValue: "Revoke" })}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="size-5 text-muted-foreground" />
                {t("staff.invites.expiredTitle", { defaultValue: "Expired invites" })}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t("staff.invites.expiredDescription", {
                  defaultValue:
                    "These invites expired before they were used. Create a new invite above if the cashier still needs access.",
                })}
              </p>

              {expiredInvites.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("staff.invites.noneExpired", { defaultValue: "No expired invites." })}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("staff.invites.store", { defaultValue: "Store" })}</TableHead>
                        <TableHead>{t("staff.invites.expires", { defaultValue: "Expires" })}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expiredInvites.map((invite) => (
                        <TableRow key={invite.id}>
                          <TableCell>
                            <span className="font-medium">
                              {invite.store_name ?? invite.store_id}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(invite.expires_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>{t("staff.pendingRequests")}</CardTitle>
              <Badge variant="outline">
                {pendingAssignments.length} {t("staff.requests")}
              </Badge>
            </CardHeader>
            <CardContent>
              {pendingAssignments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("staff.noPending")}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("common.name", { defaultValue: "Name" })}</TableHead>
                        <TableHead>{t("common.email")}</TableHead>
                        <TableHead>{t("common.status")}</TableHead>
                        <TableHead>{t("common.date")}</TableHead>
                        <TableHead>{t("staff.permissions.title", { defaultValue: "Permissions" })}</TableHead>
                        <TableHead className="text-right">{t("common.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingAssignments.map((assignment) =>
                        renderAssignmentRow(assignment, true)
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>{t("staff.currentStaff")}</CardTitle>
              <Badge variant="outline">
                {activeAssignments.length} {t("staff.members")}
              </Badge>
            </CardHeader>
            <CardContent>
              {activeAssignments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("staff.noStaff")}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("common.name", { defaultValue: "Name" })}</TableHead>
                        <TableHead>{t("common.email")}</TableHead>
                        <TableHead>{t("common.status")}</TableHead>
                        <TableHead>{t("common.date")}</TableHead>
                        <TableHead>{t("staff.permissions.title", { defaultValue: "Permissions" })}</TableHead>
                        <TableHead className="text-right">{t("common.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeAssignments.map((assignment) =>
                        renderAssignmentRow(assignment, false)
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Role Assignment Dialog (permissions at or after approval) */}
          {selectedAssignment && (
            <RoleAssignmentDialog
              key={selectedAssignment.id}
              open={roleDialogOpen}
              onOpenChange={setRoleDialogOpen}
              assignment={selectedAssignment}
              onUpdate={(permissions) => {
                if (!selectedAssignment.approved) {
                  approveMutation.mutate({
                    assignmentId: selectedAssignment.id,
                    permissions,
                  });
                } else {
                  updateMutation.mutate({ assignmentId: selectedAssignment.id, permissions });
                }
                setRoleDialogOpen(false);
              }}
              isUpdating={updateMutation.isPending || approveMutation.isPending}
            />
          )}
        </>
      )}
    </Wrapper>
  );
}

function RoleAssignmentDialog({
  open,
  onOpenChange,
  assignment,
  onUpdate,
  isUpdating,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: StaffAssignment;
  onUpdate: (permissions: PermissionType[]) => void;
  isUpdating: boolean;
}) {
  const { t } = useTranslation();
  const defaultPermissions = (a: StaffAssignment): PermissionType[] =>
    !a.approved && (a.permissions ?? []).length === 0
      ? ["POS_ACCESS"]
      : (a.permissions ?? []);
  const [permissions, setPermissions] = useState<PermissionType[]>(() =>
    defaultPermissions(assignment)
  );

  useEffect(() => {
    setPermissions(defaultPermissions(assignment));
  }, [assignment]);

  const PERMISSION_LIST: { value: PermissionType; label: string; description: string }[] = [
    { value: "POS_ACCESS", label: t("staff.permissions.posAccess", { defaultValue: "POS Access" }), description: t("staff.permissions.posAccessDesc", { defaultValue: "Access to point of sale system" }) },
    { value: "MANAGE_PRODUCTS", label: t("staff.permissions.manageProducts", { defaultValue: "Manage Products" }), description: t("staff.permissions.manageProductsDesc", { defaultValue: "Create, edit, and delete products" }) },
    { value: "MANAGE_INVENTORY", label: t("staff.permissions.manageInventory", { defaultValue: "Manage Inventory" }), description: t("staff.permissions.manageInventoryDesc", { defaultValue: "Manage inventory levels and restocking" }) },
    { value: "VIEW_COST_PRICE", label: t("staff.permissions.viewCostPrice", { defaultValue: "View Cost Price" }), description: t("staff.permissions.viewCostPriceDesc", { defaultValue: "View product cost prices" }) },
    { value: "VIEW_ANALYTICS", label: t("staff.permissions.viewAnalytics", { defaultValue: "View Analytics" }), description: t("staff.permissions.viewAnalyticsDesc", { defaultValue: "View sales analytics and reports" }) },
    { value: "VIEW_DASHBOARD", label: t("staff.permissions.viewDashboard", { defaultValue: "View Dashboard" }), description: t("staff.permissions.viewDashboardDesc", { defaultValue: "View dashboard revenue and KPI cards" }) },
  ];

  const togglePermission = (permission: PermissionType) => {
    setPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission]
    );
  };

  const handleSave = () => {
    onUpdate(permissions);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("staff.assignRole", { defaultValue: "Assign Permissions" })}</DialogTitle>
          <DialogDescription>
            {t("staff.selectPermissionsDesc", { defaultValue: "Select permissions for this staff member" })}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 max-h-96 overflow-y-auto">
          {PERMISSION_LIST.map((permission) => (
            <div
              key={permission.value}
              className="flex items-start gap-3 rounded border border-border/40 p-3 hover:bg-muted/50 cursor-pointer"
              onClick={() => togglePermission(permission.value)}
            >
              <Checkbox
                id={permission.value}
                checked={permissions.includes(permission.value)}
                onCheckedChange={() => togglePermission(permission.value)}
                className="mt-1"
              />
              <div className="flex-1 min-w-0">
                <label
                  htmlFor={permission.value}
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  {permission.label}
                </label>
                <p className="text-xs text-muted-foreground mt-1">
                  {permission.description}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSave} disabled={isUpdating}>
            {isUpdating && <RefreshCcw className="mr-2 size-4 animate-spin" />}
            {t("common.save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
