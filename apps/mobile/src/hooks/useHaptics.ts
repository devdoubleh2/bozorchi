import {useCallback} from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export type HapticType =
  | 'selection'
  | 'impactLight'
  | 'impactMedium'
  | 'impactHeavy'
  | 'notificationSuccess'
  | 'notificationWarning'
  | 'notificationError';

export function useHaptics() {
  const triggerHaptic = useCallback((type: HapticType = 'selection') => {
    try {
      switch (type) {
        case 'selection':
          Haptics.selectionAsync();
          break;
        case 'impactLight':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'impactMedium':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'impactHeavy':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'notificationSuccess':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'notificationWarning':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case 'notificationError':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
        default:
          Haptics.selectionAsync();
      }
    } catch (error) {
      // Silently fail if haptics are not available
      console.warn('Haptics not available:', error);
    }
  }, []);

  return {triggerHaptic};
}
