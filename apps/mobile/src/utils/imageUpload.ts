import * as ImagePicker from "expo-image-picker";
import { api } from "../../lib/api";

export interface ImageUploadResult {
  url: string;
  path: string;
}

export const uploadImage = async (
  imageUri: string
): Promise<ImageUploadResult> => {
  try {
    const form = new FormData();
    const fileName = imageUri.split("/").pop() || `image-${Date.now()}.jpg`;
    const file = {
      uri: imageUri,
      name: fileName,
      type: "image/jpeg",
    } as unknown as Blob;
    form.append("file", file);

    const token = await api.getAuthToken();
    const result = await fetch(api.getBaseUrl() + "/api/files/upload", {
      method: "POST",
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: form,
    });
    if (!result.ok) {
      const text = await result.text();
      throw new Error(text || "Upload failed");
    }
    const json = (await result.json()) as ImageUploadResult;
    return json;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw new Error("Не удалось загрузить изображение");
  }
};

export const pickImage = async (): Promise<string | null> => {
  try {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      throw new Error("Необходимо разрешение для доступа к галерее");
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: false,
      allowsMultipleSelection: false,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0].uri;
    }

    return null;
  } catch (error) {
    console.error("Error picking image:", error);
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes("permission")) {
        throw new Error("Необходимо разрешение для доступа к галерее");
      } else if (error.message.includes("canceled")) {
        return null;
      }
    }
    throw new Error("Ошибка при выборе изображения из галереи");
  }
};

export const takePhoto = async (): Promise<string | null> => {
  try {
    // Request camera permissions
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      throw new Error("Необходимо разрешение для доступа к камере");
    }

    // Launch camera
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: false,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      return result.assets[0].uri;
    }

    return null;
  } catch (error) {
    console.error("Error taking photo:", error);
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes("permission")) {
        throw new Error("Необходимо разрешение для доступа к камере");
      } else if (error.message.includes("canceled")) {
        return null;
      }
    }
    throw new Error("Ошибка при съемке фотографии");
  }
};
