import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { ChevronDown, Package, Hash } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';

export type UnitType = 'box' | 'piece' | 'kg' | 'liter';

export interface Unit {
  id: string;
  title: string;
  type: UnitType;
  conversionRate?: number; // For box to piece conversion
}

interface UnitSelectorProps {
  selectedUnit: Unit;
  onUnitChange: (unit: Unit) => void;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
}

export default function UnitSelector({
  selectedUnit,
  onUnitChange,
  quantity,
  onQuantityChange,
}: UnitSelectorProps) {
  const [showModal, setShowModal] = useState(false);
  const { isDark } = useTheme();
  const { t } = useTranslation();

  const defaultUnits: Unit[] = [
    { id: '1', title: t('units.box'), type: 'box', conversionRate: 50 },
    { id: '2', title: t('units.piece'), type: 'piece', conversionRate: 1 },
    { id: '3', title: t('units.kg'), type: 'kg', conversionRate: 1 },
    { id: '4', title: t('units.liter'), type: 'liter', conversionRate: 1 },
  ];

  const getUnitIcon = (type: UnitType) => {
    switch (type) {
      case 'box':
        return <Package size={16} color={isDark ? '#007AFF' : '#2D9CDB'} />;
      case 'piece':
        return <Hash size={16} color={isDark ? '#007AFF' : '#2D9CDB'} />;
      default:
        return <Hash size={16} color={isDark ? '#007AFF' : '#2D9CDB'} />;
    }
  };

  const convertQuantity = (
    fromUnit: Unit,
    toUnit: Unit,
    qty: number
  ): number => {
    if (fromUnit.type === toUnit.type) {return qty;}

    // Convert box to pieces
    if (fromUnit.type === 'box' && toUnit.type === 'piece') {
      return qty * (fromUnit.conversionRate || 1);
    }

    // Convert pieces to box
    if (fromUnit.type === 'piece' && toUnit.type === 'box') {
      return qty / (toUnit.conversionRate || 1);
    }

    return qty;
  };

  const handleUnitChange = (newUnit: Unit) => {
    const convertedQuantity = convertQuantity(selectedUnit, newUnit, quantity);
    onQuantityChange(convertedQuantity);
    onUnitChange(newUnit);
    setShowModal(false);
  };

  const getTotalPieces = (): number => {
    if (selectedUnit.type === 'box') {
      return quantity * (selectedUnit.conversionRate || 1);
    }
    return quantity;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.selector, isDark && styles.selectorDark]}
        onPress={() => setShowModal(true)}
      >
        <View style={styles.unitInfo}>
          {getUnitIcon(selectedUnit.type)}
          <Text style={[styles.unitText, isDark && styles.unitTextDark]}>
            {selectedUnit.title}
          </Text>
        </View>
        <ChevronDown size={16} color={isDark ? '#666' : '#888'} />
      </TouchableOpacity>

      {selectedUnit.type === 'box' && (
        <View style={styles.conversionInfo}>
          <Text
            style={[styles.conversionText, isDark && styles.conversionTextDark]}
          >
            {t('units.totalPieces')}: {getTotalPieces()}
          </Text>
        </View>
      )}

      <Modal
        visible={showModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, isDark && styles.modalContentDark]}
          >
            <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>
              {t('units.selectUnit')}
            </Text>
            <ScrollView style={styles.unitList}>
              {defaultUnits.map((unit) => (
                <TouchableOpacity
                  key={unit.id}
                  style={[
                    styles.unitOption,
                    selectedUnit.id === unit.id && styles.selectedUnit,
                    isDark && styles.unitOptionDark,
                  ]}
                  onPress={() => handleUnitChange(unit)}
                >
                  <View style={styles.unitOptionContent}>
                    {getUnitIcon(unit.type)}
                    <Text
                      style={[
                        styles.unitOptionText,
                        isDark && styles.unitOptionTextDark,
                      ]}
                    >
                      {unit.title}
                    </Text>
                  </View>
                  {unit.conversionRate && unit.type === 'box' && (
                    <Text
                      style={[
                        styles.conversionRate,
                        isDark && styles.conversionRateDark,
                      ]}
                    >
                      = {unit.conversionRate} {t('units.pieces')}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[styles.cancelButton, isDark && styles.cancelButtonDark]}
              onPress={() => setShowModal(false)}
            >
              <Text
                style={[
                  styles.cancelButtonText,
                  isDark && styles.cancelButtonTextDark,
                ]}
              >
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#23262F',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2D9CDB',
  },
  selectorDark: {
    backgroundColor: '#13131A',
    borderColor: '#007AFF',
  },
  unitInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unitText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
    fontWeight: '500',
  },
  unitTextDark: {
    color: '#F4F4F6',
  },
  conversionInfo: {
    marginTop: 4,
    paddingHorizontal: 4,
  },
  conversionText: {
    color: '#888',
    fontSize: 12,
    fontStyle: 'italic',
  },
  conversionTextDark: {
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#23262F',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxHeight: '70%',
  },
  modalContentDark: {
    backgroundColor: '#13131A',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalTitleDark: {
    color: '#F4F4F6',
  },
  unitList: {
    maxHeight: 300,
  },
  unitOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  unitOptionDark: {
    backgroundColor: '#18181F',
  },
  selectedUnit: {
    backgroundColor: '#2D9CDB20',
  },
  unitOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unitOptionText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
  },
  unitOptionTextDark: {
    color: '#F4F4F6',
  },
  conversionRate: {
    color: '#888',
    fontSize: 12,
    fontStyle: 'italic',
  },
  conversionRateDark: {
    color: '#666',
  },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#EB5757',
  },
  cancelButtonDark: {
    backgroundColor: '#FF6B6B',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  cancelButtonTextDark: {
    color: '#F4F4F6',
  },
});
