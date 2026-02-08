import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Upload, X } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';

interface ImageUploadProps {
  onImageSelect: (uri: string) => void;
  currentImage?: string;
  disabled?: boolean;
}

export default function ImageUpload({
  onImageSelect,
  currentImage,
  disabled = false,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { isDark } = useTheme();
  const { t } = useTranslation();

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraStatus !== 'granted') {
      Alert.alert(t('common.error'), 'Camera permission is required');
      return false;
    }

    if (mediaStatus !== 'granted') {
      Alert.alert(t('common.error'), 'Media library permission is required');
      return false;
    }

    return true;
  };

  const handleTakePhoto = useCallback(async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {return;}

    try {
      setIsUploading(true);
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onImageSelect(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert(t('common.error'), 'Failed to take photo');
    } finally {
      setIsUploading(false);
    }
  }, [onImageSelect, t]);

  const handleImagePick = useCallback(async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {return;}

    try {
      setIsUploading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onImageSelect(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert(t('common.error'), 'Failed to pick image');
    } finally {
      setIsUploading(false);
    }
  }, [onImageSelect, t]);

  const showImageOptions = useCallback(() => {
    Alert.alert(
      t('imageUpload.selectImage'),
      t('imageUpload.selectImageSource'),
      [
        {
          text: t('imageUpload.camera'),
          onPress: handleTakePhoto,
        },
        {
          text: t('imageUpload.gallery'),
          onPress: handleImagePick,
        },
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
      ]
    );
  }, [handleTakePhoto, handleImagePick, t]);

  const removeImage = () => {
    onImageSelect('');
  };

  return (
    <View style={styles.container}>
      {currentImage ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: currentImage }} style={styles.image} />
          {!disabled && (
            <TouchableOpacity style={styles.removeButton} onPress={removeImage}>
              <X size={16} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <TouchableOpacity
          style={[
            styles.uploadButton,
            isDark && styles.uploadButtonDark,
            disabled && styles.disabledButton,
          ]}
          onPress={showImageOptions}
          disabled={disabled || isUploading}
        >
          {isUploading ? (
            <ActivityIndicator color={isDark ? '#007AFF' : '#2D9CDB'} />
          ) : (
            <>
              <Upload size={24} color={isDark ? '#007AFF' : '#2D9CDB'} />
              <Text
                style={[
                  styles.uploadText,
                  isDark && styles.uploadTextDark,
                ]}
              >
                {t('products.uploadProductImage')}
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  uploadButton: {
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#2D9CDB',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  uploadButtonDark: {
    backgroundColor: '#1e1e1e',
    borderColor: '#007AFF',
  },
  disabledButton: {
    opacity: 0.5,
  },
  uploadText: {
    color: '#2D9CDB',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  uploadTextDark: {
    color: '#007AFF',
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
