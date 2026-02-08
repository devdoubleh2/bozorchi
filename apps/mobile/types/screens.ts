import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { TabParamList } from './navigation';

export type HomeScreenProps = BottomTabScreenProps<TabParamList, 'Home'>;
export type TransactionsScreenProps = BottomTabScreenProps<
  TabParamList,
  'Products'
>;
export type POSScreenProps = BottomTabScreenProps<TabParamList, 'POS'>;
export type InventoryScreenProps = BottomTabScreenProps<
  TabParamList,
  'Inventory'
>;
export type SettingsScreenProps = BottomTabScreenProps<
  TabParamList,
  'Settings'
>;
