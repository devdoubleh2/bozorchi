import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Star } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  onRatingChange?: (rating: number) => void;
  showValue?: boolean;
  size?: number;
  interactive?: boolean;
}

export default function StarRating({
  rating,
  maxRating = 5,
  onRatingChange,
  showValue = true,
  size = 20,
  interactive = false,
}: StarRatingProps) {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  const renderStar = (index: number) => {
    const isFilled = index < rating;
    const isHalfFilled = index === Math.floor(rating) && rating % 1 !== 0;

    return (
      <TouchableOpacity
        key={index}
        style={styles.star}
        onPress={() => {
          if (interactive && onRatingChange) {
            onRatingChange(index + 1);
          }
        }}
        disabled={!interactive}
      >
        <Star
          size={size}
          color={isFilled ? '#FFD700' : isDark ? '#666' : '#ccc'}
          fill={isFilled ? '#FFD700' : 'none'}
        />
      </TouchableOpacity>
    );
  };

  const getRatingText = (rating: number) => {
    if (rating >= 4.5) {return t('rating.excellent');}
    if (rating >= 4.0) {return t('rating.veryGood');}
    if (rating >= 3.5) {return t('rating.good');}
    if (rating >= 3.0) {return t('rating.satisfactory');}
    if (rating >= 2.0) {return t('rating.poor');}
    return t('rating.veryPoor');
  };

  return (
    <View style={styles.container}>
      <View style={styles.starsContainer}>
        {Array.from({ length: maxRating }, (_, index) => renderStar(index))}
      </View>
      {showValue && (
        <Text style={[styles.ratingText, isDark && styles.ratingTextDark]}>
          {getRatingText(rating)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  star: {
    padding: 2,
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  ratingTextDark: {
    color: '#888',
  },
});
