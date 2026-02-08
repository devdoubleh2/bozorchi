import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Package, Clock, TrendingUp } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';

interface ProductMemory {
  id: string;
  name: string;
  usageCount: number;
  lastUsed: Date;
  category?: string;
}

interface SmartProductMemoryProps {
  onProductSelect: (product: ProductMemory) => void;
  maxItems?: number;
}

export default function SmartProductMemory({
  onProductSelect,
  maxItems = 10,
}: SmartProductMemoryProps) {
  const [productMemory, setProductMemory] = useState<ProductMemory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isDark } = useTheme();
  const { t } = useTranslation();

  useEffect(() => {
    loadProductMemory();
  }, []);

  const loadProductMemory = async () => {
    try {
      // Simulate loading from storage
      // In a real app, this would load from AsyncStorage or a database
      const stored = await getStoredProductMemory();
      setProductMemory(stored);
    } catch (error) {
      console.error('Error loading product memory:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStoredProductMemory = async (): Promise<ProductMemory[]> => {
    // Mock data - in real app, load from AsyncStorage
    return [
      {
        id: '1',
        name: 'Coca Cola 0.5L',
        usageCount: 15,
        lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        category: 'Beverages',
      },
      {
        id: '2',
        name: 'Bread White',
        usageCount: 8,
        lastUsed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        category: 'Bakery',
      },
      {
        id: '3',
        name: 'Milk 1L',
        usageCount: 12,
        lastUsed: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        category: 'Dairy',
      },
    ];
  };

  const updateProductUsage = (productId: string) => {
    setProductMemory((prev) =>
      prev
        .map((product) =>
          product.id === productId
            ? {
                ...product,
                usageCount: product.usageCount + 1,
                lastUsed: new Date(),
              }
            : product
        )
        .sort((a, b) => b.usageCount - a.usageCount)
    );
  };

  const clearMemory = () => {
    Alert.alert(
      t('smartMemory.clearMemory'),
      t('smartMemory.clearMemoryConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('smartMemory.clear'),
          style: 'destructive',
          onPress: () => setProductMemory([]),
        },
      ]
    );
  };

  const getUsageText = (count: number) => {
    if (count >= 10) {return `${count} times`;}
    if (count >= 5) {return `${count} times`;}
    return `${count} time${count > 1 ? 's' : ''}`;
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {return 'Just now';}
    if (diffInHours < 24) {return `${diffInHours}h ago`;}
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const renderProductItem = ({ item }: { item: ProductMemory }) => (
    <TouchableOpacity
      style={[
        styles.productItem,
        isDark && styles.productItemDark,
      ]}
      onPress={() => {
        updateProductUsage(item.id);
        onProductSelect(item);
      }}
    >
      <View style={styles.productInfo}>
        <View style={styles.productHeader}>
          <Package size={16} color={isDark ? '#007AFF' : '#2D9CDB'} />
          <Text
            style={[
              styles.productName,
              isDark && styles.productNameDark,
            ]}
          >
            {item.name}
          </Text>
        </View>
        {item.category && (
          <Text
            style={[
              styles.productCategory,
              isDark && styles.productCategoryDark,
            ]}
          >
            {item.category}
          </Text>
        )}
        <View style={styles.productStats}>
          <View style={styles.statItem}>
            <TrendingUp size={12} color={isDark ? '#666' : '#888'} />
            <Text
              style={[
                styles.statText,
                isDark && styles.statTextDark,
              ]}
            >
              {getUsageText(item.usageCount)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Clock size={12} color={isDark ? '#666' : '#888'} />
            <Text
              style={[
                styles.statText,
                isDark && styles.statTextDark,
              ]}
            >
              {getTimeAgo(item.lastUsed)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={[styles.title, isDark && styles.titleDark]}>
          Smart Memory
        </Text>
        <Text style={[styles.loadingText, isDark && styles.loadingTextDark]}>
          {t('common.loading')}...
        </Text>
      </View>
    );
  }

  if (productMemory.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.title, isDark && styles.titleDark]}>
            Smart Memory
          </Text>
          <TouchableOpacity onPress={clearMemory}>
            <Text style={[styles.clearButton, isDark && styles.clearButtonDark]}>
              {t('common.clear')}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
          No products in memory yet
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, isDark && styles.titleDark]}>
          Smart Memory
        </Text>
        <TouchableOpacity onPress={clearMemory}>
          <Text style={[styles.clearButton, isDark && styles.clearButtonDark]}>
            {t('common.clear')}
          </Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={productMemory.slice(0, maxItems)}
        renderItem={renderProductItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D9CDB',
  },
  titleDark: {
    color: '#007AFF',
  },
  clearButton: {
    fontSize: 14,
    color: '#EB5757',
    fontWeight: '500',
  },
  clearButtonDark: {
    color: '#FF6B6B',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  loadingTextDark: {
    color: '#888',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  emptyTextDark: {
    color: '#888',
  },
  listContainer: {
    paddingBottom: 8,
  },
  productItem: {
    backgroundColor: '#23262F',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2D9CDB20',
  },
  productItemDark: {
    backgroundColor: '#13131A',
    borderColor: '#007AFF20',
  },
  productInfo: {
    flex: 1,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
    flex: 1,
  },
  productNameDark: {
    color: '#F4F4F6',
  },
  productCategory: {
    fontSize: 12,
    color: '#888',
    marginLeft: 24,
    marginBottom: 8,
  },
  productCategoryDark: {
    color: '#666',
  },
  productStats: {
    flexDirection: 'row',
    marginLeft: 24,
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#888',
  },
  statTextDark: {
    color: '#666',
  },
});
