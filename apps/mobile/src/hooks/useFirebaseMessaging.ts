import { useEffect } from "react";
import { useAuthContext } from "@/context/AuthContext";
import {
  listenForForegroundMessages,
  listenForNotificationOpens,
  listenForTokenRefresh,
  logInitialNotification,
  registerFcmToken,
} from "@/src/lib/firebaseMessaging";
import { log } from "@/debugging/log";

export function useFirebaseMessaging() {
  const user = useAuthContext((state) => state.user);

  useEffect(() => {
    if (!user) {
      return;
    }

    registerFcmToken().catch((error) => {
      log.error("fcm", "Failed to register FCM token", error);
    });

    logInitialNotification().catch((error) => {
      log.error("fcm", "Failed to read initial notification", error);
    });

    const unsubscribeForeground = listenForForegroundMessages();
    const unsubscribeOpen = listenForNotificationOpens();
    const unsubscribeTokenRefresh = listenForTokenRefresh();

    return () => {
      unsubscribeForeground();
      unsubscribeOpen();
      unsubscribeTokenRefresh();
    };
  }, [user?.id]);
}
