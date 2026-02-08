import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native";
import {
  User,
  Plus,
  Edit,
  Trash2,
  Star,
  Gift,
  Mail,
  Phone,
  X,
  ChevronRight,
} from "lucide-react-native";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import type { RootStackParamList } from "../types/navigation";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuthContext } from "../context/AuthContext";
import { UserStoreInfo } from "@/types";
import { log } from "../debugging/log";
import {
  GestureHandlerRootView,
  Swipeable,
} from "react-native-gesture-handler";
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";

interface LoyaltyCard {
  id: string;
  card_number: string;
  customer_id: string;
  points: number;
  created_at: string;
  updated_at: string;
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

export default function CustomersScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [customerForm, setCustomerForm] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [loyaltyForm, setLoyaltyForm] = useState({
    cardNumber: "",
    points: "0",
  });

  const { isDark, colors } = useTheme();
  const { t } = useTranslation();
  const user = useAuthContext((state) => state.user);
  const queryClient = useQueryClient();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  // Bottom Sheet refs
  const addBottomSheetRef = useRef<BottomSheetModal>(null);
  const editBottomSheetRef = useRef<BottomSheetModal>(null);
  const loyaltyBottomSheetRef = useRef<BottomSheetModal>(null);

  const snapPoints = useMemo(() => ["60%", "90%"], []);

  const { data: userStoreInfo } = useQuery({
    queryKey: ["store", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const res = await api.get<{ data: UserStoreInfo }>(
        "/api/stores/my-store"
      );
      return res.data;
    },
    enabled: !!user?.id,
  });

  const storeId = userStoreInfo?.store?.id;

  const {
    data: customersResponse,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["customers", storeId],
    queryFn: async (): Promise<{ customers: Customer[] }> => {
      if (!storeId) return { customers: [] };
      const res = await api.get<{ customers: Customer[] }>(
        `/api/customers?storeId=${storeId}`
      );
      return res;
    },
    enabled: !!storeId,
  });

  const customers = customersResponse?.customers || [];

  const createCustomerMutation = useMutation({
    mutationFn: async (customerData: {
      name: string;
      email?: string;
      phone?: string;
      store_id: string;
    }) => {
      return await api.post("/api/customers", customerData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers", storeId] });
      addBottomSheetRef.current?.dismiss();
      resetForm();
      Alert.alert(t("common.success"), t("customers.customerAdded"));
    },
    onError: () => {
      Alert.alert(t("common.error"), "Failed to create customer");
    },
  });

  const updateCustomerMutation = useMutation({
    mutationFn: async (data: {
      id: string;
      name: string;
      email?: string;
      phone?: string;
    }) => {
      const { id, ...updateData } = data;
      return await api.put(
        `/api/customers/${id}?storeId=${storeId}`,
        updateData
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers", storeId] });
      editBottomSheetRef.current?.dismiss();
      setSelectedCustomer(null);
      resetForm();
      Alert.alert(t("common.success"), t("customers.customerUpdated"));
    },
    onError: () => {
      Alert.alert(t("common.error"), "Failed to update customer");
    },
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: async (customerId: string) => {
      return await api.delete(
        `/api/customers/${customerId}?storeId=${storeId}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers", storeId] });
      Alert.alert(t("common.success"), t("customers.customerDeleted"));
    },
    onError: () => {
      Alert.alert(t("common.error"), "Failed to delete customer");
    },
  });

  const createLoyaltyCardMutation = useMutation({
    mutationFn: async (data: {
      customer_id: string;
      card_number: string;
      points: number;
    }) => {
      return await api.post("/api/customers/loyalty-cards", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers", storeId] });
      loyaltyBottomSheetRef.current?.dismiss();
      setSelectedCustomer(null);
      resetLoyaltyForm();
      Alert.alert(t("common.success"), t("customers.loyaltyCardAdded"));
    },
    onError: () => {
      Alert.alert(t("common.error"), "Failed to create loyalty card");
    },
  });

  const updateLoyaltyPointsMutation = useMutation({
    mutationFn: async (data: {
      customer_id: string;
      points: number;
      operation: "add" | "subtract";
    }) => {
      return await api.put(
        `/api/customers/${data.customer_id}/loyalty-points`,
        {
          points: data.points,
          operation: data.operation,
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers", storeId] });
      loyaltyBottomSheetRef.current?.dismiss();
      setSelectedCustomer(null);
      resetLoyaltyForm();
      Alert.alert(t("common.success"), t("customers.pointsUpdated"));
    },
    onError: () => {
      Alert.alert(t("common.error"), "Failed to update points");
    },
  });

  const deleteLoyaltyCardMutation = useMutation({
    mutationFn: async (customerId: string) => {
      return await api.delete(`/api/customers/${customerId}/loyalty-card`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers", storeId] });
      Alert.alert(t("common.success"), t("customers.loyaltyCardDeleted"));
    },
    onError: () => {
      Alert.alert(t("common.error"), "Failed to delete loyalty card");
    },
  });

  const resetForm = () => {
    setCustomerForm({ name: "", email: "", phone: "" });
  };

  const resetLoyaltyForm = () => {
    setLoyaltyForm({ cardNumber: "", points: "0" });
  };

  const handleAddCustomer = () => {
    if (!customerForm.name.trim()) {
      Alert.alert(t("common.error"), t("customers.nameRequired"));
      return;
    }

    if (
      customerForm.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerForm.email)
    ) {
      Alert.alert(t("common.error"), t("customers.emailInvalid"));
      return;
    }

    createCustomerMutation.mutate({
      name: customerForm.name.trim(),
      email: customerForm.email.trim() || undefined,
      phone: customerForm.phone.trim() || undefined,
      store_id: storeId!,
    });
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerForm({
      name: customer.name,
      email: customer.email || "",
      phone: customer.phone || "",
    });
    editBottomSheetRef.current?.present();
  };

  const handleUpdateCustomer = () => {
    if (!selectedCustomer || !customerForm.name.trim()) {
      Alert.alert(t("common.error"), t("customers.nameRequired"));
      return;
    }

    if (
      customerForm.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerForm.email)
    ) {
      Alert.alert(t("common.error"), t("customers.emailInvalid"));
      return;
    }

    updateCustomerMutation.mutate({
      id: selectedCustomer.id,
      name: customerForm.name.trim(),
      email: customerForm.email.trim() || undefined,
      phone: customerForm.phone.trim() || undefined,
    });
  };

  const handleDeleteCustomer = (customerId: string) => {
    Alert.alert(
      t("customers.deleteCustomer"),
      t("customers.deleteCustomerConfirm"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: () => deleteCustomerMutation.mutate(customerId),
        },
      ]
    );
  };

  const handleManageLoyaltyCard = (customer: Customer) => {
    setSelectedCustomer(customer);
    if (customer.loyalty_card) {
      setLoyaltyForm({
        cardNumber: customer.loyalty_card.card_number,
        points: customer.loyalty_card.points.toString(),
      });
    } else {
      resetLoyaltyForm();
    }
    loyaltyBottomSheetRef.current?.present();
  };

  const handleSaveLoyaltyCard = () => {
    if (!selectedCustomer) return;

    if (!loyaltyForm.cardNumber.trim()) {
      Alert.alert(t("common.error"), t("customers.cardNumberRequired"));
      return;
    }

    if (selectedCustomer.loyalty_card) {
      // Update points
      const currentPoints = selectedCustomer.loyalty_card.points;
      const newPoints = parseInt(loyaltyForm.points) || 0;
      const diff = newPoints - currentPoints;

      if (diff !== 0) {
        updateLoyaltyPointsMutation.mutate({
          customer_id: selectedCustomer.id,
          points: Math.abs(diff),
          operation: diff > 0 ? "add" : "subtract",
        });
      } else {
        loyaltyBottomSheetRef.current?.dismiss();
        setSelectedCustomer(null);
      }
    } else {
      // Create new loyalty card
      createLoyaltyCardMutation.mutate({
        customer_id: selectedCustomer.id,
        card_number: loyaltyForm.cardNumber.trim(),
        points: parseInt(loyaltyForm.points) || 0,
      });
    }
  };

  const handleDeleteLoyaltyCard = (customerId: string) => {
    Alert.alert(
      t("customers.deleteLoyaltyCard"),
      t("customers.deleteLoyaltyCardConfirm"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: () => deleteLoyaltyCardMutation.mutate(customerId),
        },
      ]
    );
  };

  const handleViewCustomerDetails = (customer: Customer) => {
    navigation.navigate("CustomerDetails", { customerId: customer.id });
  };

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;

    const query = searchQuery.toLowerCase();
    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(query) ||
        customer.email?.toLowerCase().includes(query) ||
        customer.phone?.toLowerCase().includes(query)
    );
  }, [customers, searchQuery]);

  const renderCustomerItem = ({ item }: { item: Customer }) => {
    const renderRightActions = () => (
      <View style={styles.rightActionsContainer}>
        <TouchableOpacity
          style={[styles.swipeAction, styles.editAction]}
          onPress={() => handleEditCustomer(item)}
        >
          <Edit size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.swipeAction, styles.loyaltyAction]}
          onPress={() => handleManageLoyaltyCard(item)}
        >
          <Gift size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.swipeAction, styles.deleteAction]}
          onPress={() => handleDeleteCustomer(item.id)}
        >
          <Trash2 size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    );

    return (
      <Swipeable renderRightActions={renderRightActions}>
        <TouchableOpacity
          style={[styles.customerCard, isDark && styles.customerCardDark]}
          onPress={() => handleViewCustomerDetails(item)}
          activeOpacity={0.7}
        >
          <View style={styles.customerCardLeft}>
            <View
              style={[styles.avatarCircle, isDark && styles.avatarCircleDark]}
            >
              <User size={24} color={isDark ? "#fff" : "#000"} />
            </View>
            <View style={styles.customerInfo}>
              <Text
                style={[styles.customerName, isDark && styles.customerNameDark]}
              >
                {item.name}
              </Text>
              {item.email && (
                <View style={styles.contactRow}>
                  <Mail size={14} color="#6B7280" />
                  <Text
                    style={[
                      styles.contactText,
                      isDark && styles.contactTextDark,
                    ]}
                  >
                    {item.email}
                  </Text>
                </View>
              )}
              {item.phone && (
                <View style={styles.contactRow}>
                  <Phone size={14} color="#6B7280" />
                  <Text
                    style={[
                      styles.contactText,
                      isDark && styles.contactTextDark,
                    ]}
                  >
                    {item.phone}
                  </Text>
                </View>
              )}
              {item.loyalty_card && (
                <View style={styles.loyaltyBadge}>
                  <Star size={12} color="#FFD700" fill="#FFD700" />
                  <Text style={styles.loyaltyPoints}>
                    {item.loyalty_card.points} {t("customers.loyaltyPoints")}
                  </Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.customerCardRight}>
            <View style={styles.statsContainer}>
              <Text
                style={[
                  styles.transactionCount,
                  isDark && styles.transactionCountDark,
                ]}
              >
                {item._count.transactions}
              </Text>
              <Text
                style={[styles.statsLabel, isDark && styles.statsLabelDark]}
              >
                {t("customers.totalTransactions")}
              </Text>
            </View>
            <ChevronRight size={20} color={isDark ? "#3A3A3C" : "#C7C7CC"} />
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  const renderCustomerForm = (isEdit: boolean) => {
    const bottomSheetRef = isEdit ? editBottomSheetRef : addBottomSheetRef;

    return (
      <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>
            {isEdit ? t("customers.editCustomer") : t("customers.addCustomer")}
          </Text>
          <TouchableOpacity onPress={() => bottomSheetRef.current?.dismiss()}>
            <X size={24} color={isDark ? "#fff" : "#000"} />
          </TouchableOpacity>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>
              {t("customers.customerName")} *
            </Text>
            <TextInput
              style={[styles.input, isDark && styles.inputDark]}
              value={customerForm.name}
              onChangeText={(text) =>
                setCustomerForm({ ...customerForm, name: text })
              }
              placeholder={t("customers.enterCustomerName")}
              placeholderTextColor={isDark ? "#666" : "#999"}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>
              {t("customers.customerEmail")}
            </Text>
            <TextInput
              style={[styles.input, isDark && styles.inputDark]}
              value={customerForm.email}
              onChangeText={(text) =>
                setCustomerForm({ ...customerForm, email: text })
              }
              placeholder={t("customers.enterCustomerEmail")}
              placeholderTextColor={isDark ? "#666" : "#999"}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>
              {t("customers.customerPhone")}
            </Text>
            <TextInput
              style={[styles.input, isDark && styles.inputDark]}
              value={customerForm.phone}
              onChangeText={(text) =>
                setCustomerForm({ ...customerForm, phone: text })
              }
              placeholder={t("customers.enterCustomerPhone")}
              placeholderTextColor={isDark ? "#666" : "#999"}
              keyboardType="phone-pad"
            />
          </View>

          <TouchableOpacity
            style={[
              styles.saveButton,
              (createCustomerMutation.isPending ||
                updateCustomerMutation.isPending) &&
              styles.saveButtonDisabled,
            ]}
            onPress={isEdit ? handleUpdateCustomer : handleAddCustomer}
            disabled={
              createCustomerMutation.isPending ||
              updateCustomerMutation.isPending
            }
          >
            {createCustomerMutation.isPending ||
              updateCustomerMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>{t("common.save")}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderLoyaltyForm = () => (
    <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
      <View style={styles.modalHeader}>
        <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>
          {selectedCustomer?.loyalty_card
            ? t("customers.editLoyaltyCard")
            : t("customers.addLoyaltyCard")}
        </Text>
        <TouchableOpacity
          onPress={() => loyaltyBottomSheetRef.current?.dismiss()}
        >
          <X size={24} color={isDark ? "#fff" : "#000"} />
        </TouchableOpacity>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>
            {t("customers.cardNumber")} *
          </Text>
          <TextInput
            style={[styles.input, isDark && styles.inputDark]}
            value={loyaltyForm.cardNumber}
            onChangeText={(text) =>
              setLoyaltyForm({ ...loyaltyForm, cardNumber: text })
            }
            placeholder={t("customers.enterCardNumber")}
            placeholderTextColor={isDark ? "#666" : "#999"}
            editable={!selectedCustomer?.loyalty_card}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>
            {t("customers.pointsAmount")}
          </Text>
          <TextInput
            style={[styles.input, isDark && styles.inputDark]}
            value={loyaltyForm.points}
            onChangeText={(text) =>
              setLoyaltyForm({ ...loyaltyForm, points: text })
            }
            placeholder={t("customers.enterPointsAmount")}
            placeholderTextColor={isDark ? "#666" : "#999"}
            keyboardType="numeric"
          />
        </View>

        <TouchableOpacity
          style={[
            styles.saveButton,
            (createLoyaltyCardMutation.isPending ||
              updateLoyaltyPointsMutation.isPending) &&
            styles.saveButtonDisabled,
          ]}
          onPress={handleSaveLoyaltyCard}
          disabled={
            createLoyaltyCardMutation.isPending ||
            updateLoyaltyPointsMutation.isPending
          }
        >
          {createLoyaltyCardMutation.isPending ||
            updateLoyaltyPointsMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>{t("common.save")}</Text>
          )}
        </TouchableOpacity>

        {selectedCustomer?.loyalty_card && (
          <TouchableOpacity
            style={[styles.deleteCardButton]}
            onPress={() => handleDeleteLoyaltyCard(selectedCustomer.id)}
          >
            <Text style={styles.deleteCardButtonText}>
              {t("customers.deleteLoyaltyCard")}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View
        style={[styles.container, isDark && styles.containerDark]}
        testID="customers-screen"
      >
        <StatusBar
          backgroundColor={isDark ? "#000000" : "#F2F2F7"}
          barStyle={isDark ? "light-content" : "dark-content"}
        />

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={isDark ? "#fff" : "#000"} />
          </View>
        ) : filteredCustomers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <User size={64} color="#9CA3AF" />
            <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
              {searchQuery ? t("common.noData") : t("customers.noCustomers")}
            </Text>
            {!searchQuery && (
              <Text
                style={[styles.emptySubtext, isDark && styles.emptySubtextDark]}
              >
                {t("customers.addFirstCustomer")}
              </Text>
            )}
          </View>
        ) : (
          <FlatList
            data={filteredCustomers}
            renderItem={renderCustomerItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshing={isLoading}
            onRefresh={refetch}
          />
        )}

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            resetForm();
            addBottomSheetRef.current?.present();
          }}
        >
          <Plus size={28} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Add Customer Bottom Sheet */}
      <BottomSheetModal
        ref={addBottomSheetRef}
        snapPoints={snapPoints}
        index={0}
        onDismiss={() => {
          resetForm();
        }}
        backgroundStyle={[
          styles.bottomSheetBackground,
          isDark && styles.bottomSheetBackgroundDark,
        ]}
        handleIndicatorStyle={[
          styles.bottomSheetIndicator,
          isDark && styles.bottomSheetIndicatorDark,
        ]}
        backdropComponent={(props: BottomSheetBackdropProps) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            pressBehavior="close"
          />
        )}
      >
        <BottomSheetScrollView
          contentContainerStyle={styles.bottomSheetContent}
        >
          {renderCustomerForm(false)}
        </BottomSheetScrollView>
      </BottomSheetModal>

      {/* Edit Customer Bottom Sheet */}
      <BottomSheetModal
        ref={editBottomSheetRef}
        snapPoints={snapPoints}
        index={0}
        onDismiss={() => {
          setSelectedCustomer(null);
          resetForm();
        }}
        backgroundStyle={[
          styles.bottomSheetBackground,
          isDark && styles.bottomSheetBackgroundDark,
        ]}
        handleIndicatorStyle={[
          styles.bottomSheetIndicator,
          isDark && styles.bottomSheetIndicatorDark,
        ]}
        backdropComponent={(props: BottomSheetBackdropProps) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            pressBehavior="close"
          />
        )}
      >
        <BottomSheetScrollView
          contentContainerStyle={styles.bottomSheetContent}
        >
          {renderCustomerForm(true)}
        </BottomSheetScrollView>
      </BottomSheetModal>

      {/* Loyalty Card Bottom Sheet */}
      <BottomSheetModal
        ref={loyaltyBottomSheetRef}
        snapPoints={snapPoints}
        index={0}
        onDismiss={() => {
          setSelectedCustomer(null);
          resetLoyaltyForm();
        }}
        backgroundStyle={[
          styles.bottomSheetBackground,
          isDark && styles.bottomSheetBackgroundDark,
        ]}
        handleIndicatorStyle={[
          styles.bottomSheetIndicator,
          isDark && styles.bottomSheetIndicatorDark,
        ]}
        backdropComponent={(props: BottomSheetBackdropProps) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            pressBehavior="close"
          />
        )}
      >
        <BottomSheetScrollView
          contentContainerStyle={styles.bottomSheetContent}
        >
          {renderLoyaltyForm()}
        </BottomSheetScrollView>
      </BottomSheetModal>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  containerDark: {
    backgroundColor: "#000",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 16,
  },
  emptyTextDark: {
    color: "#9CA3AF",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 8,
    textAlign: "center",
  },
  emptySubtextDark: {
    color: "#6B7280",
  },
  listContent: {
    paddingTop: 160,
    paddingBottom: 100,
  },
  customerCard: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E5EA",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  customerCardDark: {
    backgroundColor: "#1C1C1E",
    borderBottomColor: "#38383A",
  },
  customerCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F2F2F7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarCircleDark: {
    backgroundColor: "#2C2C2E",
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  customerNameDark: {
    color: "#fff",
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  contactText: {
    fontSize: 13,
    color: "#6B7280",
  },
  contactTextDark: {
    color: "#9CA3AF",
  },
  loyaltyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  loyaltyPoints: {
    fontSize: 11,
    fontWeight: "600",
    color: "#92400E",
  },
  customerCardRight: {
    alignItems: "flex-end",
    gap: 8,
    flexDirection: "row",
  },
  statsContainer: {
    alignItems: "center",
  },
  transactionCount: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  transactionCountDark: {
    color: "#fff",
  },
  statsLabel: {
    fontSize: 11,
    color: "#6B7280",
  },
  statsLabelDark: {
    color: "#9CA3AF",
  },
  rightActionsContainer: {
    flexDirection: "row",
  },
  swipeAction: {
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    height: "100%",
  },
  editAction: {
    backgroundColor: "#FF9500",
  },
  loyaltyAction: {
    backgroundColor: "#F59E0B",
  },
  deleteAction: {
    backgroundColor: "#FF3B30",
  },
  addButton: {
    position: "absolute",
    bottom: 32,
    right: 32,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  bottomSheetBackground: {
    backgroundColor: "#fff",
  },
  bottomSheetBackgroundDark: {
    backgroundColor: "#1C1C1E",
  },
  bottomSheetIndicator: {
    backgroundColor: "#E5E5EA",
  },
  bottomSheetIndicatorDark: {
    backgroundColor: "#38383A",
  },
  bottomSheetContent: {
    paddingBottom: 40,
  },
  modalContent: {
    backgroundColor: "transparent",
  },
  modalContentDark: {
    backgroundColor: "transparent",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 0,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  modalTitleDark: {
    color: "#fff",
  },
  formContainer: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  inputLabelDark: {
    color: "#D1D5DB",
  },
  input: {
    height: 48,
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#111827",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  inputDark: {
    backgroundColor: "#2C2C2E",
    color: "#fff",
    borderColor: "#3A3A3C",
  },
  saveButton: {
    backgroundColor: "#FF3B30",
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  deleteCardButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#EF4444",
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 12,
  },
  deleteCardButtonText: {
    color: "#EF4444",
    fontSize: 16,
    fontWeight: "600",
  },
});
