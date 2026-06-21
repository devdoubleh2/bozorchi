import React, { useState, useCallback } from "react";
import { NavigationContainer, LinkingOptions } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { Login } from "../screens/Login";
import { Register } from "../screens/Register";
import StoreSetupScreen from "../screens/StoreSetupScreen";
import { RootStackParamList, TabParamList } from "../types/navigation";
import { useTranslation } from "react-i18next";
import { Platform, TouchableOpacity, Dimensions, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import {
  HomeIcon,
  PackageIcon,
  ShoppingCartIcon,
  ListIcon,
  SettingsIcon,
  ScanLine,
  Filter,
} from "lucide-react-native";

import HomeScreen from "../screens/HomeScreen";
import TransactionsScreen, {
  transactionsSearchHandlersRef,
} from "../screens/TransactionsScreen";
import POScreen from "../screens/POSScreen";
import InventoryScreen, {
  inventorySearchHandlersRef,
} from "../screens/InventoryScreen";
import SettingsScreen from "../screens/SettingsScreen";
import CustomersScreen from "../screens/CustomersScreen";
import AddProductScreen from "../screens/AddProductScreen";
import EditProductScreen from "../screens/EditProductScreen";
import { useHaptics } from "../src/hooks/useHaptics";
import StoreTypeSelectionScreen from "@/screens/StoreTypeSelectionScreen";
import { useAuthContext } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import EditProfileScreen from "@/screens/EditProfileScreen";
import ChangePasswordScreen from "@/screens/ChangePasswordScreen";
import RestockScreen from "@/screens/RestockScreen";
import FilterInventory from "@/screens/FilterInventory";
import BarcodeScanner from "@/src/components/BarcodeScanner";
import CustomerDetailsScreen from "@/screens/CustomerDetailsScreen";
import ReportsScreen from "@/screens/ReportsScreen";
import ReportDetailScreen from "@/screens/ReportDetailScreen";
import SuppliersScreen from "@/screens/SuppliersScreen";
import SupplierDetailsScreen from "@/screens/SupplierDetailsScreen";
import WriteOffScreen from "@/screens/WriteOffScreen";
import InventoryAuditScreen from "@/screens/InventoryAuditScreen";
import RepricingScreen from "@/screens/RepricingScreen";
import PriceTagsScreen from "@/screens/PriceTagsScreen";
import ReservationsScreen from "@/screens/ReservationsScreen";
import TransactionEditScreen from "@/screens/TransactionEditScreen";
import StaffScreen from "@/screens/StaffScreen";

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

// Configure linking for web support
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [
    "bozorchi://",
    "https://bozorchi.store",
    "https://app.bozorchi.store",
  ],
  config: {
    screens: {
      Auth: {
        screens: {
          Login: "login",
          Register: "register",
          Welcome: "welcome",
        },
      },
      MainApp: {
        screens: {
          Home: "",
          Products: "products",
          POS: "pos",
          Inventory: "inventory",
          Transactions: "transactions",
          Settings: "settings",
        },
      },
      StoreTypeSelection: "store-type",
      StoreSetup: "store-setup",
      AddProduct: "add-product",
      EditProduct: "edit-product/:productId",
      Suppliers: "suppliers",
      SupplierDetails: "suppliers/:supplierId",
      WriteOff: "write-off",
      InventoryAudit: "inventory-audit",
      Repricing: "repricing",
      PriceTags: "price-tags",
      EditProfile: "profile",
      ChangePassword: "change-password",
      Restock: "restock",
      FilterInventory: "filter-inventory",
      Customers: "customers",
      CustomerDetails: "customers/:customerId",
      Reports: "reports",
      ReportDetail: "reports/:reportType",
      Staff: "staff",
    },
  },
};

// Create a ref to hold search handlers
export const searchHandlersRef = {
  onSearchChange: (text: string) => { },
  onSearchSubmit: (text: string) => { },
  onSearchCancel: () => { },
};

// Create a ref for POS search handlers
export const posSearchHandlersRef = {
  onSearchChange: (text: string) => { },
  onSearchSubmit: (text: string) => { },
  onSearchCancel: () => { },
};

const TabNavigator = () => {
  const { triggerHaptic } = useHaptics();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get("window").width;
  const isLargeScreen = screenWidth > 768;
  const [showTransactionsScanner, setShowTransactionsScanner] = useState(false);
  const [showPOSScanner, setShowPOSScanner] = useState(false);
  const [showInventoryScanner, setShowInventoryScanner] = useState(false);

  const buildSearchBarOptions = useCallback(
    (
      placeholder: string,
      overrides?: NativeStackNavigationOptions["headerSearchBarOptions"]
    ): NativeStackNavigationOptions["headerSearchBarOptions"] => ({
      placeholder,
      textColor: colors.textPrimary,
      headerIconColor: colors.textPrimary,
      tintColor: colors.primary,
      barTintColor: colors.surface,
      cancelButtonText: t("common.cancel"),
      hideNavigationBar: false,
      ...overrides,
    }),
    [colors, t]
  );

  const handleTransactionsBarcodeScanned = (barcode: string) => {
    transactionsSearchHandlersRef.onSearchChange(barcode);
    setShowTransactionsScanner(false);
  };

  const handlePOSBarcodeScanned = (barcode: string) => {
    posSearchHandlersRef.onSearchChange(barcode);
    setShowPOSScanner(false);
  };

  const handleInventoryBarcodeScanned = (barcode: string) => {
    inventorySearchHandlersRef.onSearchChange(barcode);
    setShowInventoryScanner(false);
  };

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          headerShown: true,
          headerTitleStyle: {
            color: colors.textPrimary,
            fontWeight: "600",
          },
          headerStyle: {
            backgroundColor: colors.surface,
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textTertiary,
          tabBarStyle: {
            backgroundColor: colors.surface,
            // Use safe area insets for dynamic height - minimum 60pt + bottom inset
            height: 60 + insets.bottom,
            paddingBottom: insets.bottom,
            paddingTop: 8,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "500",
            marginBottom: Platform.OS === "ios" ? 0 : 4,
          },
          tabBarIconStyle: {
            marginTop: Platform.OS === "ios" ? 0 : 4,
          },
        }}
        initialRouteName="Home"
        backBehavior="firstRoute"
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={({ navigation }) => ({
            tabBarIcon: ({ color, size }) => (
              <HomeIcon size={size} color={color} />
            ),
            headerTitle: t("navigation.home"),
            headerShown: true,
            title: t("navigation.home"),
          })}
          listeners={{
            tabPress: () => {
              triggerHaptic("selection");
            },
          }}
        />
        <Tab.Screen
          name="Products"
          component={TransactionsScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <PackageIcon size={size} color={color} />
            ),
            headerTintColor: colors.textPrimary,
            title: t("navigation.transactions"),
            headerTitle: t("navigation.transactions"),
            headerSearchBarOptions: buildSearchBarOptions(
              t("products.searchPlaceholder"),
              {
                onChangeText: (event: { nativeEvent: { text: string } }) => {
                  transactionsSearchHandlersRef.onSearchChange(
                    event.nativeEvent.text
                  );
                },
                // FIX: use onSearchButtonPress instead of invalid onSubmitEditing
                onSearchButtonPress: (event: {
                  nativeEvent: { text: string };
                }) => {
                  transactionsSearchHandlersRef.onSearchSubmit(
                    event.nativeEvent.text
                  );
                },
              }
            ),
            headerRight: () => (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  paddingRight: 8,
                }}
              >
                <TouchableOpacity
                  onPress={() => transactionsSearchHandlersRef.onFilterPress?.()}
                  style={{ marginRight: 16 }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Filter size={20} color={colors.textPrimary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowTransactionsScanner(true)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <ScanLine size={20} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
            ),
          }}
          listeners={{
            tabPress: () => {
              triggerHaptic("selection");
            },
          }}
        />
        <Tab.Screen
          name="POS"
          component={POScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <ShoppingCartIcon size={size} color={color} />
            ),
            headerTitle: t("navigation.pos"),
            headerTintColor: colors.textPrimary,
            headerSearchBarOptions: buildSearchBarOptions(
              t("products.searchPlaceholder"),
              {
                onChangeText: (event: { nativeEvent: { text: string } }) => {
                  posSearchHandlersRef.onSearchChange(event.nativeEvent.text);
                },
                // FIX: use onSearchButtonPress instead of invalid onSubmitEditing
                onSearchButtonPress: (event: {
                  nativeEvent: { text: string };
                }) => {
                  posSearchHandlersRef.onSearchSubmit(event.nativeEvent.text);
                },
                onCancelButtonPress: () => {
                  posSearchHandlersRef.onSearchCancel();
                },
              }
            ),
            headerRight: () => (
              <TouchableOpacity
                onPress={() => setShowPOSScanner(true)}
                style={{ marginRight: 16 }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <ScanLine size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            ),
          }}
          listeners={{
            tabPress: () => {
              triggerHaptic("selection");
            },
          }}
        />
        <Tab.Screen
          name="Inventory"
          component={InventoryScreen}
          options={({ navigation }) => ({
            tabBarIcon: ({ color, size }) => (
              <ListIcon size={size} color={color} />
            ),
            headerTitle: t("navigation.inventory"),
            title: t("navigation.inventory"),
            headerTintColor: colors.textPrimary,
            headerSearchBarOptions: buildSearchBarOptions(
              t("inventory.searchPlaceholder"),
              {
                onChangeText: (event: { nativeEvent: { text: string } }) => {
                  inventorySearchHandlersRef.onSearchChange(
                    event.nativeEvent.text
                  );
                },
                onSearchButtonPress: (event: {
                  nativeEvent: { text: string };
                }) => {
                  inventorySearchHandlersRef.onSearchSubmit(
                    event.nativeEvent.text
                  );
                },
                onCancelButtonPress: () => {
                  inventorySearchHandlersRef.onSearchCancel();
                },
              }
            ),
            headerRight: () => (
              <TouchableOpacity
                onPress={() => setShowInventoryScanner(true)}
                style={{ marginRight: 16, padding: 8 }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <ScanLine size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            ),
          })}
          listeners={{
            tabPress: () => {
              triggerHaptic("selection");
            },
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <SettingsIcon size={size} color={color} />
            ),
            headerTitle: t("navigation.settings"),
            title: t("navigation.settings"),
          }}
          listeners={{
            tabPress: () => {
              triggerHaptic("selection");
            },
          }}
        />
      </Tab.Navigator>

      <BarcodeScanner
        visible={showTransactionsScanner}
        onClose={() => setShowTransactionsScanner(false)}
        onBarcodeScanned={handleTransactionsBarcodeScanned}
      />

      <BarcodeScanner
        visible={showPOSScanner}
        onClose={() => setShowPOSScanner(false)}
        onBarcodeScanned={handlePOSBarcodeScanned}
      />

      <BarcodeScanner
        visible={showInventoryScanner}
        onClose={() => setShowInventoryScanner(false)}
        onBarcodeScanned={handleInventoryBarcodeScanned}
      />
    </>
  );
};

const AuthStack = () => {
  const { colors } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        contentStyle: {
          backgroundColor: colors.background,
        },
        presentation: "card",
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen
        name="Login"
        component={Login}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Register"
        component={Register}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

const RootNavigator = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const user = useAuthContext((state) => state.user);
  const userStore = useAuthContext((state) => state.userStore);
  const needsOnboarding = useAuthContext((state) => state.needsOnboarding);
  const shouldShowStaffGate =
    !!userStore && userStore.role !== "admin" && userStore.approved === false;

  const buildSearchBarOptions = useCallback(
    (
      placeholder: string,
      overrides?: NativeStackNavigationOptions["headerSearchBarOptions"]
    ): NativeStackNavigationOptions["headerSearchBarOptions"] => ({
      placeholder,
      textColor: colors.textPrimary,
      headerIconColor: colors.textPrimary,
      tintColor: colors.primary,
      barTintColor: colors.surface,
      cancelButtonText: t("common.cancel"),
      hideNavigationBar: false,
      ...overrides,
    }),
    [colors, t]
  );

  return (
    <Stack.Navigator
      screenOptions={{
        contentStyle: {
          backgroundColor: colors.background,
        },
        presentation: "card",
        animation: "slide_from_right",

        headerTitleStyle: {
          color: colors.textPrimary,
          fontWeight: "600",
        },
        headerStyle: {
          backgroundColor: colors.surface,
        },

        headerTintColor: colors.textPrimary,
      }}
    >
      {user ? (
        <>
          {needsOnboarding ? (
            <Stack.Screen
              name="StoreTypeSelection"
              component={StoreTypeSelectionScreen}
              options={{
                headerShown: false,
              }}
            />
          ) : (
            <Stack.Screen
              name="MainApp"
              options={{
                headerShown: false,
              }}
            >
              {() => {
                if (shouldShowStaffGate) {
                  return (
                    <SafeAreaView
                      style={{ flex: 1, backgroundColor: colors.background }}
                    >
                      <StaffScreen />
                    </SafeAreaView>
                  );
                }

                return <TabNavigator />;
              }}
            </Stack.Screen>
          )}
          <Stack.Screen
            name="StoreSetup"
            component={StoreSetupScreen}
            options={{
              headerBackVisible: false,
              headerShown: false,
            }}
          />
          {!needsOnboarding && (
            <Stack.Screen
              name="StoreTypeSelection"
              component={StoreTypeSelectionScreen}
              options={{
                headerBackVisible: false,
                headerShown: false,
              }}
            />
          )}

          <Stack.Screen
            name="AddProduct"
            component={AddProductScreen}
            options={{
              headerShown: true,
              headerTitle: t("products.addProduct"),
              headerBackTitle: t("common.back"),
            }}
          />
          <Stack.Screen
            name="EditProduct"
            component={EditProductScreen}
            options={{
              headerShown: true,
              headerTitle: t("products.editProduct"),
            }}
          />
          <Stack.Screen
            name="EditProfile"
            component={EditProfileScreen}
            options={{
              headerShown: true,
              headerTitle: t("profile.editProfile"),
              headerBackTitle: t("common.back"),
            }}
          />
          <Stack.Screen
            name="ChangePassword"
            component={ChangePasswordScreen}
            options={{
              headerShown: true,
              headerTitle: t("profile.changePassword"),
              headerBackTitle: t("common.back"),
            }}
          />
          <Stack.Screen
            name="Restock"
            component={RestockScreen}
            options={{
              headerShown: true,
              headerTitle: t("inventory.restock"),
              headerTintColor: colors.textPrimary,
              headerBackTitle: t("common.back"),
            }}
          />
          <Stack.Screen
            name="FilterInventory"
            component={FilterInventory}
            options={{
              headerShown: false,
              presentation: Platform.OS === "ios" ? "formSheet" : "modal",
              animation:
                Platform.OS === "ios" ? "slide_from_bottom" : "default",
            }}
          />
          <Stack.Screen
            name="Customers"
            component={CustomersScreen}
            options={{
              headerShown: true,
              headerTitle: t("customers.title"),
              headerTintColor: colors.textPrimary,
              headerBackTitle: t("common.back"),
            }}
          />
          <Stack.Screen
            name="Staff"
            component={StaffScreen}
            options={{
              headerShown: true,
              headerTitle: t("settings.staff"),
              headerTintColor: colors.textPrimary,
              headerBackTitle: t("common.back"),
            }}
          />
          <Stack.Screen
            name="CustomerDetails"
            component={CustomerDetailsScreen}
            options={{
              headerShown: true,
              headerTitle: t("customers.customerDetails"),
              headerTintColor: colors.textPrimary,
              headerBackTitle: t("common.back"),
            }}
          />
          <Stack.Screen
            name="Reports"
            component={ReportsScreen}
            options={{
              headerShown: true,
              headerTitle: t("reports.title"),
              headerTintColor: colors.textPrimary,
              headerBackTitle: t("common.back"),
            }}
          />
          <Stack.Screen
            name="ReportDetail"
            component={ReportDetailScreen}
            options={{
              headerShown: true,
              headerTitle: t("reports.detail"),
            }}
          />
          <Stack.Screen
            name="Suppliers"
            component={SuppliersScreen}
            options={{
              headerShown: true,
              headerTitle: t("supplier.title"),
              headerTintColor: colors.textPrimary,
              headerBackTitle: t("common.back"),
            }}
          />
          <Stack.Screen
            name="SupplierDetails"
            component={SupplierDetailsScreen}
            options={{
              headerShown: true,
              headerTitle: t("supplier.details"),
              headerTintColor: colors.textPrimary,
              headerBackTitle: t("common.back"),
            }}
          />
          <Stack.Screen
            name="WriteOff"
            component={WriteOffScreen}
            options={{
              headerShown: true,
              headerTitle: t("writeOff.title"),
              headerTintColor: colors.textPrimary,
              headerBackTitle: t("common.back"),
            }}
          />
          <Stack.Screen
            name="InventoryAudit"
            component={InventoryAuditScreen}
            options={{
              headerShown: true,
              headerTitle: t("audit.title"),
              headerTintColor: colors.textPrimary,
              headerBackTitle: t("common.back"),
            }}
          />
          <Stack.Screen
            name="Repricing"
            component={RepricingScreen}
            options={{
              headerShown: true,
              headerTitle: t("repricing.title"),
              headerTintColor: colors.textPrimary,
              headerBackTitle: t("common.back"),
            }}
          />
          <Stack.Screen
            name="Reservations"
            component={ReservationsScreen}
            options={{
              headerShown: true,
              headerTitle: t("reservation.title"),
              headerTintColor: colors.textPrimary,
              headerBackTitle: t("common.back"),
            }}
          />
          <Stack.Screen
            name="TransactionEdit"
            component={TransactionEditScreen}
            options={{
              headerShown: true,
              headerTitle: t("transactionEdit.title"),
              headerTintColor: colors.textPrimary,
              headerBackTitle: t("common.back"),
            }}
          />
          <Stack.Screen
            name="PriceTags"
            component={PriceTagsScreen}
            options={{
              headerShown: true,
              headerTitle: t("priceTags.title"),
              headerTintColor: colors.textPrimary,
              headerBackTitle: t("common.back"),
            }}
          />
        </>
      ) : (
        <Stack.Screen
          name="Auth"
          component={AuthStack}
          options={{ headerShown: false }}
        />
      )}
    </Stack.Navigator>
  );
};

export default function AppNavigator() {
  const isLoading = useAuthContext((state) => state.isLoading);

  if (isLoading) {
    return null;
  }

  return (
    <NavigationContainer linking={linking}>
      <RootNavigator />
    </NavigationContainer>
  );
}
