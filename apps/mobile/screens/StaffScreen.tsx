import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";
import { useAuthContext } from "../context/AuthContext";
import { useShallow } from "zustand/shallow";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { ShieldCheck, Clock, Trash2, RefreshCcw } from "lucide-react-native";
import { StaffAssignmentsResponse, StaffAssignment } from "@/types";

// Types
type AssignmentAction = "approve" | "remove";

interface ActionButtonConfig {
  backgroundColor: string;
  icon: React.ReactNode;
  text?: string;
  onPress: () => void;
  isLoading?: boolean;
  borderColor?: string;
  borderWidth?: number;
}

// Constants
const CARD_BORDER_RADIUS = 16;
const SMALL_BORDER_RADIUS = 10;
const ICON_SIZE = {
  large: 28,
  medium: 20,
  small: 18,
  xsmall: 16,
} as const;

const QUERY_KEYS = {
  staffAssignments: ["staffAssignments"] as const,
} as const;

// Custom Hooks
const useStaffData = () => {
  const storeData = useAuthContext(useShallow((state) => state.userStore));

  return useMemo(
    () => ({
      storeId: storeData?.store?.id ?? null,
      storeName: storeData?.store?.name?.trim() || null,
      isAdmin: storeData?.role === "admin",
      isApproved: storeData?.approved || storeData?.role === "admin",
      role: storeData?.role,
      storeData,
    }),
    [storeData]
  );
};

const useStaffAssignments = (isAdmin: boolean, storeId: string | null) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.staffAssignments, storeId],
    queryFn: async () =>
      api.get<StaffAssignmentsResponse>("/api/staff/assignments"),
    enabled: isAdmin && !!storeId,
    staleTime: 0,
    gcTime: 300000,
    refetchInterval: isAdmin ? 5000 : false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};

const useStaffMutations = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const invalidateAssignments = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.staffAssignments });
  }, [queryClient]);

  const approveMutation = useMutation({
    mutationFn: (assignmentId: string) =>
      api.post<{ message: string }>(
        `/api/staff/assignments/${assignmentId}/approve`
      ),
    onSuccess: () => {
      invalidateAssignments();
      Alert.alert(t("common.success"), t("staff.approveSuccess"));
    },
    onError: (error: Error) => {
      Alert.alert(t("common.error"), error.message || t("errors.generic"));
    },
  });

  const removeMutation = useMutation({
    mutationFn: (assignmentId: string) =>
      api.delete<{ message: string }>(`/api/staff/assignments/${assignmentId}`),
    onSuccess: () => {
      invalidateAssignments();
      Alert.alert(t("common.success"), t("staff.removeSuccess"));
    },
    onError: (error: Error) => {
      Alert.alert(t("common.error"), error.message || t("errors.generic"));
    },
  });

  return { approveMutation, removeMutation };
};

// Components
const LoadingScreen: React.FC<{ colors: any }> = ({ colors }) => (
  <View style={[styles.centered, { backgroundColor: colors.background }]}>
    <ActivityIndicator size="large" color={colors.primary} />
  </View>
);

const ActionButton: React.FC<ActionButtonConfig & { colors: any }> = ({
  backgroundColor,
  icon,
  text,
  onPress,
  isLoading,
  borderColor,
  borderWidth,
  colors,
}) => (
  <TouchableOpacity
    style={[styles.actionButton, { backgroundColor, borderColor, borderWidth }]}
    onPress={onPress}
    disabled={isLoading}
    activeOpacity={0.7}
  >
    {isLoading ? (
      <ActivityIndicator size="small" color={colors.textInverse} />
    ) : (
      icon
    )}
    {text && (
      <Text style={[styles.actionButtonText, { color: colors.textInverse }]}>
        {text}
      </Text>
    )}
  </TouchableOpacity>
);

interface StaffCardHeaderProps {
  storeName: string;
  role: string;
  isAdmin: boolean;
  onSharePress: () => void;
  colors: any;
  t: any;
}

interface StatusBadgeProps {
  label: string;
  color: string;
  backgroundColor: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  color,
  backgroundColor,
}) => (
  <View style={[styles.statusBadge, { backgroundColor }]}>
    <Text style={[styles.statusBadgeText, { color }]}>{label}</Text>
  </View>
);

interface StoreInfoBoxProps {
  storeId: string;
  statusConfig: {
    label: string;
    color: string;
    background: string;
  };
  colors: any;
  t: any;
}

const StoreInfoBox: React.FC<StoreInfoBoxProps> = ({
  storeId,
  statusConfig,
  colors,
  t,
}) => (
  <View
    style={[
      styles.storeIdBox,
      {
        borderColor: colors.border,
        backgroundColor: colors.surfaceSecondary,
      },
    ]}
  >
    <View style={styles.storeIdContent}>
      <Text style={[styles.storeIdLabel, { color: colors.textSecondary }]}>
        {t("staff.storeId")}
      </Text>
      <Text
        style={[styles.storeIdValue, { color: colors.textPrimary }]}
        selectable
        numberOfLines={1}
      >
        {storeId}
      </Text>
    </View>
    <StatusBadge
      label={statusConfig.label}
      color={statusConfig.color}
      backgroundColor={statusConfig.background}
    />
  </View>
);

interface AssignmentCardProps {
  assignment: StaffAssignment;
  isPending: boolean;
  onApprove: (id: string) => void;
  onRemove: (assignment: StaffAssignment) => void;
  isApproving: boolean;
  isRemoving: boolean;
  colors: any;
  t: any;
  formatDate: (date: string) => string;
}

const AssignmentCard: React.FC<AssignmentCardProps> = ({
  assignment,
  isPending,
  onApprove,
  onRemove,
  isApproving,
  isRemoving,
  colors,
  t,
  formatDate,
}) => (
  <View
    style={[
      styles.assignmentCard,
      {
        borderColor: colors.border,
        backgroundColor: colors.surfaceSecondary,
      },
    ]}
  >
    <View style={styles.assignmentInfo}>
      <Text style={[styles.assignmentEmail, { color: colors.textPrimary }]}>
        {assignment.user.email}
      </Text>
      <Text style={[styles.assignmentMeta, { color: colors.textSecondary }]}>
        {isPending
          ? t("staff.requestedAt", { date: formatDate(assignment.created_at) })
          : t("staff.approvedAt", { date: formatDate(assignment.created_at) })}
      </Text>
    </View>
    <View style={styles.assignmentActions}>
      {isPending ? (
        <>
          <ActionButton
            backgroundColor={colors.success}
            icon={
              <ShieldCheck size={ICON_SIZE.xsmall} color={colors.textInverse} />
            }
            text={t("staff.approve")}
            onPress={() => onApprove(assignment.id)}
            isLoading={isApproving}
            colors={colors}
          />
          <ActionButton
            backgroundColor={colors.error}
            icon={<Trash2 size={ICON_SIZE.xsmall} color={colors.textInverse} />}
            onPress={() => onRemove(assignment)}
            isLoading={isRemoving}
            colors={colors}
          />
        </>
      ) : (
        <ActionButton
          backgroundColor={colors.surface}
          borderColor={colors.border}
          borderWidth={1}
          icon={<Trash2 size={ICON_SIZE.xsmall} color={colors.textPrimary} />}
          onPress={() => onRemove(assignment)}
          isLoading={isRemoving}
          colors={colors}
        />
      )}
    </View>
  </View>
);

interface SectionHeaderProps {
  title: string;
  isLoading?: boolean;
  colors: any;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  isLoading,
  colors,
}) => (
  <View style={styles.sectionHeader}>
    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
      {title}
    </Text>
    {isLoading && <ActivityIndicator size="small" color={colors.primary} />}
  </View>
);

interface EmptyStateProps {
  message: string;
  colors: any;
}

const EmptyState: React.FC<EmptyStateProps> = ({ message, colors }) => (
  <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
    {message}
  </Text>
);

// Main Component
export default function StaffScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const getStore = useAuthContext((state) => state.getStore);
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [loadingStates, setLoadingStates] = useState<
    Record<string, AssignmentAction>
  >({});

  const { storeId, storeName, isAdmin, isApproved, role, storeData } =
    useStaffData();

  const { data: assignments, isFetching, refetch } = useStaffAssignments(
    isAdmin,
    storeId
  );
  const { approveMutation, removeMutation } = useStaffMutations();

  const pendingAssignments = useMemo(
    () => assignments?.pending ?? [],
    [assignments?.pending]
  );

  const activeAssignments = useMemo(
    () => assignments?.approved ?? [],
    [assignments?.approved]
  );

  const formatDate = useCallback(
    (value: string) =>
      new Date(value).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    []
  );

  const handleShareStoreId = useCallback(() => {
    if (!storeId) return;

    Share.share({
      title: t("staff.shareTitle", { storeName }),
      message: t("staff.shareMessage", { storeName, storeId }),
    }).catch((error) => {
      console.error("Share error:", error);
    });
  }, [storeId, storeName, t]);

  const handleApprove = useCallback(
    (assignmentId: string) => {
      setLoadingStates((prev) => ({ ...prev, [assignmentId]: "approve" }));
      approveMutation.mutate(assignmentId, {
        onSettled: () => {
          setLoadingStates((prev) => {
            const newState = { ...prev };
            delete newState[assignmentId];
            return newState;
          });
        },
      });
    },
    [approveMutation]
  );

  const handleRemove = useCallback(
    (assignment: StaffAssignment) => {
      Alert.alert(
        t("staff.removeTitle"),
        t("staff.removeDescription", { email: assignment.user.email }),
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("staff.remove"),
            style: "destructive",
            onPress: () => {
              setLoadingStates((prev) => ({
                ...prev,
                [assignment.id]: "remove",
              }));
              removeMutation.mutate(assignment.id, {
                onSettled: () => {
                  setLoadingStates((prev) => {
                    const newState = { ...prev };
                    delete newState[assignment.id];
                    return newState;
                  });
                },
              });
            },
          },
        ]
      );
    },
    [removeMutation, t]
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (isAdmin) {
        await Promise.all([getStore(), refetch()]);
      } else {
        await getStore();
      }
    } catch (error) {
      Alert.alert(t("common.error"), t("staff.refreshError"));
    } finally {
      setRefreshing(false);
    }
  }, [getStore, isAdmin, queryClient, t]);

  const statusConfig = useMemo(
    () => ({
      label: isApproved ? t("staff.statusApproved") : t("staff.statusPending"),
      color: isApproved ? colors.success : colors.warning,
      background: isApproved ? colors.successLight : colors.warningLight,
    }),
    [colors, isApproved, t]
  );

  useFocusEffect(
    useCallback(() => {
      if (isAdmin) {
        refetch();
      }
    }, [isAdmin, refetch])
  );

  const renderAssignmentsList = useCallback(
    (assignmentsList: StaffAssignment[], isPending: boolean) =>
      assignmentsList.map((assignment) => (
        <AssignmentCard
          key={assignment.id}
          assignment={assignment}
          isPending={isPending}
          onApprove={handleApprove}
          onRemove={handleRemove}
          isApproving={loadingStates[assignment.id] === "approve"}
          isRemoving={loadingStates[assignment.id] === "remove"}
          colors={colors}
          t={t}
          formatDate={formatDate}
        />
      )),
    [handleApprove, handleRemove, loadingStates, colors, t, formatDate]
  );

  if (!storeData) {
    return <LoadingScreen colors={colors} />;
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          colors={[colors.primary]}
          tintColor={colors.primary}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      }
      showsVerticalScrollIndicator={false}
      testID="staff-screen"
    >
      {/* Seller Status Card */}
      {!isAdmin && (
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.cardHeader}>
            <Clock size={ICON_SIZE.medium} color={colors.textPrimary} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              {isApproved
                ? t("staff.sellerApprovedTitle")
                : t("staff.sellerPendingTitle")}
            </Text>
          </View>
          <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
            {isApproved
              ? t("staff.sellerApprovedDescription")
              : t("staff.sellerPendingDescription")}
          </Text>
          {!isApproved && (
            <TouchableOpacity
              style={[
                styles.refreshButton,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.surfaceSecondary,
                },
              ]}
              onPress={handleRefresh}
              activeOpacity={0.7}
            >
              {refreshing ? (
                <ActivityIndicator size="small" color={colors.textPrimary} />
              ) : (
                <>
                  <RefreshCcw
                    size={ICON_SIZE.xsmall}
                    color={colors.textPrimary}
                  />
                  <Text
                    style={[
                      styles.refreshButtonText,
                      { color: colors.textPrimary },
                    ]}
                  >
                    {t("staff.refreshStatus")}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Admin: Pending Requests */}
      {isAdmin && (
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <SectionHeader
            title={t("staff.pendingRequests")}
            isLoading={isFetching}
            colors={colors}
          />
          {pendingAssignments.length === 0 ? (
            <EmptyState message={t("staff.noPending")} colors={colors} />
          ) : (
            renderAssignmentsList(pendingAssignments, true)
          )}
        </View>
      )}

      {/* Admin: Current Staff */}
      {isAdmin && (
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <SectionHeader title={t("staff.currentStaff")} colors={colors} />
          {activeAssignments.length === 0 ? (
            <EmptyState message={t("staff.noStaff")} colors={colors} />
          ) : (
            renderAssignmentsList(activeAssignments, false)
          )}
        </View>
      )}

      {/* Footer Help Text */}
      <Text style={[styles.helperText, { color: colors.textSecondary }]}>
        {t("staff.helpText")}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    borderRadius: CARD_BORDER_RADIUS,
    borderWidth: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: SMALL_BORDER_RADIUS,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  storeIdBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginTop: 16,
    gap: 12,
  },
  storeIdContent: {
    flex: 1,
  },
  storeIdLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  storeIdValue: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 4,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 20,
  },
  refreshButton: {
    marginTop: 16,
    borderRadius: SMALL_BORDER_RADIUS,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  refreshButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  assignmentCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
  assignmentInfo: {
    flex: 1,
  },
  assignmentEmail: {
    fontSize: 15,
    fontWeight: "600",
  },
  assignmentMeta: {
    fontSize: 12,
    marginTop: 4,
  },
  assignmentActions: {
    flexDirection: "row",
    gap: 8,
    marginLeft: 12,
  },
  actionButton: {
    borderRadius: SMALL_BORDER_RADIUS,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  helperText: {
    fontSize: 12,
    textAlign: "center",
  },
});
