import { ActiveFilters } from "@/screens/FilterInventory";

export type RootStackParamList = {
  Auth: undefined;
  StoreTypeSelection: undefined;
  StoreSetup: { storeType?: string };
  Login: undefined;
  Register: undefined;
  Welcome: undefined;
  MainApp: undefined;
  AddProduct: undefined;
  EditProduct: { productId: string };
  EditProfile: undefined;
  ChangePassword: undefined;
  Restock: undefined;
  FilterInventory: {
    initialFilters: ActiveFilters;
    allColors: string[];
    allUnitValues: string[];
    allProductCategoryColors: string[];
    allCategoryNames: string[];
    priceRange: { min: number; max: number } | null;
    onApply: (filters: ActiveFilters) => void;
  };
  Customers: undefined;
  Staff: undefined;
  CustomerDetails: { customerId: string };
  Reports: undefined;
  ReportDetail: { reportType: string };
  Suppliers: undefined;
  SupplierDetails: { supplierId: string };
  WriteOff: undefined;
  InventoryAudit: undefined;
  Repricing: undefined;
  PriceTags: undefined;
  Counterparties: undefined;
  Reservations: undefined;
  TransactionEdit: { transactionId: string };
};

export type TabParamList = {
  Home: undefined;
  Products: undefined;
  POS: undefined;
  Inventory: undefined;
  Profile: undefined;
  Settings: undefined;
};
