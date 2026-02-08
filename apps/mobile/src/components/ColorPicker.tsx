import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';

type ColorPickerProps = {
  selectedColor?: string;
  onColorSelect: (color: string) => void;
};

const PREDEFINED_COLORS = [
  '#FFFFFF', // White
  '#000000', // Black
  '#FF0000', // Red
  '#00FF00', // Green
  '#0000FF', // Blue
  '#FFFF00', // Yellow
  '#FF00FF', // Magenta
  '#00FFFF', // Cyan
  '#FFA500', // Orange
  '#800080', // Purple
  '#FFC0CB', // Pink
  '#A52A2A', // Brown
  '#808080', // Gray
  '#C0C0C0', // Silver
  '#FFD700', // Gold
  '#008000', // Dark Green
  '#000080', // Navy
  '#800000', // Maroon
  '#008080', // Teal
  '#808000', // Olive
];

export default function ColorPicker({
  selectedColor,
  onColorSelect,
}: ColorPickerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const { isDark } = useTheme();
  const { t } = useTranslation();

  const handleColorSelect = (color: string) => {
    onColorSelect(color);
    setIsVisible(false);
  };

  const getColorName = (color: string) => {
    switch (color) {
      case '#FFFFFF':
        return t('colors.white');
      case '#000000':
        return t('colors.black');
      case '#FF0000':
        return t('colors.red');
      case '#00FF00':
        return t('colors.green');
      case '#0000FF':
        return t('colors.blue');
      case '#FFFF00':
        return t('colors.yellow');
      case '#FF00FF':
        return t('colors.magenta');
      case '#00FFFF':
        return t('colors.cyan');
      case '#FFA500':
        return t('colors.orange');
      case '#800080':
        return t('colors.purple');
      case '#FFC0CB':
        return t('colors.pink');
      case '#A52A2A':
        return t('colors.brown');
      case '#808080':
        return t('colors.gray');
      case '#C0C0C0':
        return t('colors.silver');
      case '#FFD700':
        return t('colors.gold');
      case '#008000':
        return t('colors.darkGreen');
      case '#000080':
        return t('colors.navy');
      case '#800000':
        return t('colors.maroon');
      case '#008080':
        return t('colors.teal');
      case '#808000':
        return t('colors.olive');
      default:
        return color;
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.colorButton,
          isDark && styles.colorButtonDark,
          { backgroundColor: selectedColor || '#FFFFFF' },
        ]}
        onPress={() => setIsVisible(true)}
      >
        <View style={styles.colorPreview}>
          {selectedColor && (
            <View
              style={[
                styles.colorCircle,
                { backgroundColor: selectedColor },
                selectedColor === '#FFFFFF' && styles.whiteColorBorder,
              ]}
            />
          )}
        </View>
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, isDark && styles.modalContentDark]}
          >
            <View style={styles.modalHeader}>
              <Text
                style={[styles.modalTitle, isDark && styles.modalTitleDark]}
              >
                {t('products.selectColor')}
              </Text>
              <TouchableOpacity
                onPress={() => setIsVisible(false)}
                style={styles.closeButton}
              >
                <X size={24} color={isDark ? '#fff' : '#000'} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.colorGrid}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.colorRow}>
                {PREDEFINED_COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      color === '#FFFFFF' && styles.whiteColorBorder,
                      selectedColor === color && styles.selectedColorOption,
                    ]}
                    onPress={() => handleColorSelect(color)}
                  >
                    {selectedColor === color && (
                      <View style={styles.selectedIndicator}>
                        <Text style={styles.checkmark}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text
              style={[
                styles.selectedColorText,
                isDark && styles.selectedColorTextDark,
              ]}
            >
              {selectedColor
                ? getColorName(selectedColor)
                : t('products.noColorSelected')}
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  colorButton: {
    height: 52,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  colorButtonDark: {
    borderColor: '#333333',
  },
  colorPreview: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  whiteColorBorder: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    margin: 20,
    maxWidth: 320,
    width: '90%',
    maxHeight: '80%',
  },
  modalContentDark: {
    backgroundColor: '#1e293b',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  modalTitleDark: {
    color: '#ffffff',
  },
  closeButton: {
    padding: 4,
  },
  colorGrid: {
    maxHeight: 300,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  colorOption: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    margin: 5,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  selectedColorOption: {
    borderWidth: 3,
    borderColor: '#4fc3f7',
  },
  selectedIndicator: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22.5,
  },
  checkmark: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: '#fff',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  selectedColorText: {
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },
  selectedColorTextDark: {
    color: '#ffffff',
  },
});
