import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Animated,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useTranslation } from 'react-i18next';
import { useHaptics } from '../src/hooks/useHaptics';
import {
  CheckCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react-native';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

export default function WelcomeScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { triggerHaptic } = useHaptics();

  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);

  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto navigate after 3 seconds
    const timer = setTimeout(() => {
      handleContinue();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleContinue = () => {
    triggerHaptic('notificationSuccess');
    navigation.replace('MainApp');
  };

  return (
    <SafeAreaView
      style={styles.container}
      testID="welcome-screen"
    >
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.iconContainer}>
          <Sparkles size={80} color="#007AFF" />
        </View>

        <Text style={styles.title}>{t('welcome.title')}</Text>
        <Text style={styles.subtitle}>{t('welcome.subtitle')}</Text>
        <Text style={styles.description}>{t('welcome.description')}</Text>

        <View style={styles.featuresContainer}>
          <View style={styles.feature}>
            <CheckCircle size={20} color="#34C759" />
            <Text style={styles.featureText}>{t('welcome.feature1')}</Text>
          </View>
          <View style={styles.feature}>
            <CheckCircle size={20} color="#34C759" />
            <Text style={styles.featureText}>{t('welcome.feature2')}</Text>
          </View>
          <View style={styles.feature}>
            <CheckCircle size={20} color="#34C759" />
            <Text style={styles.featureText}>{t('welcome.feature3')}</Text>
          </View>
        </View>
      </Animated.View>

      <View style={styles.footer}>
        <TouchableOpacity onPress={handleContinue} style={styles.continueButton}>
          <Text style={styles.continueButtonText}>{t('welcome.continue')}</Text>
          <ArrowRight size={20} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: '#007AFF',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  featuresContainer: {
    width: '100%',
    gap: 16,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    color: 'white',
    fontSize: 16,
    flex: 1,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  continueButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
