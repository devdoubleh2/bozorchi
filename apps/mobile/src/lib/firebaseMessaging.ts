import { PermissionsAndroid, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Device from "expo-device";
import messaging, {
  FirebaseMessagingTypes,
} from "@react-native-firebase/messaging";
import { api } from "@/lib/api";
import { log } from "@/debugging/log";

const FCM_TOKEN_STORAGE_KEY = "mobile_fcm_token";

async function persistFcmToken(token: string | null) {
  if (token) {
    await AsyncStorage.setItem(FCM_TOKEN_STORAGE_KEY, token);
    return;
  }

  await AsyncStorage.removeItem(FCM_TOKEN_STORAGE_KEY);
}

async function requestAndroidNotificationPermission() {
  if (Platform.OS !== "android" || Platform.Version < 33) {
    return true;
  }

  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
  );

  return result === PermissionsAndroid.RESULTS.GRANTED;
}

async function requestMessagingPermission() {
  if (Platform.OS === "ios") {
    const status = await messaging().requestPermission();
    return (
      status === messaging.AuthorizationStatus.AUTHORIZED ||
      status === messaging.AuthorizationStatus.PROVISIONAL
    );
  }

  return requestAndroidNotificationPermission();
}

export async function registerFcmToken() {
  if (!Device.isDevice) {
    log.info("fcm", "Skipping FCM registration on simulator");
    return null;
  }

  const permissionGranted = await requestMessagingPermission();

  if (!permissionGranted) {
    log.warn("fcm", "Notification permission not granted");
    return null;
  }

  await messaging().registerDeviceForRemoteMessages();

  const token = await messaging().getToken();

  await api.post("/api/notifications/token", {
    token,
    provider: "fcm",
    platform: Platform.OS,
    deviceName: Device.deviceName ?? null,
    appVersion: Constants.expoConfig?.version ?? null,
    buildNumber:
      Platform.OS === "ios"
        ? Constants.expoConfig?.ios?.buildNumber ?? null
        : Constants.expoConfig?.android?.versionCode?.toString() ?? null,
  });

  await persistFcmToken(token);

  log.info("fcm", "FCM token registered", {
    platform: Platform.OS,
  });

  return token;
}

export async function unregisterStoredFcmToken() {
  try {
    const token = await AsyncStorage.getItem(FCM_TOKEN_STORAGE_KEY);

    if (!token) {
      return;
    }

    await api.post("/api/notifications/token/remove", { token });
    await persistFcmToken(null);
  } catch (error) {
    log.warn("fcm", "Failed to unregister FCM token", error);
  }
}

export function listenForForegroundMessages() {
  return messaging().onMessage(
    async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
      log.info("fcm", "Foreground message received", {
        messageId: remoteMessage.messageId,
        data: remoteMessage.data,
        notification: remoteMessage.notification,
      });
    }
  );
}

export function listenForNotificationOpens() {
  return messaging().onNotificationOpenedApp(
    (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
      log.info("fcm", "Notification opened from background", {
        messageId: remoteMessage.messageId,
        data: remoteMessage.data,
      });
    }
  );
}

export async function logInitialNotification() {
  const initialNotification = await messaging().getInitialNotification();

  if (!initialNotification) {
    return;
  }

  log.info("fcm", "Notification opened from quit state", {
    messageId: initialNotification.messageId,
    data: initialNotification.data,
  });
}

export function listenForTokenRefresh() {
  return messaging().onTokenRefresh((token) => {
    registerFcmToken().catch((error) => {
      log.error("fcm", "Failed to sync refreshed FCM token", {
        error,
        token,
      });
    });
  });
}
