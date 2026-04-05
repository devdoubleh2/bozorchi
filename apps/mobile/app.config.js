import "dotenv/config";

export default {
  name: "Bozorchi",
  slug: process.env.APP_SLUG || "bozorchi",
  version: "2.4.6",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  assetBundlePatterns: ["**/*"],
  updates: {
    enabled: false,
  },
  plugins: [
    "expo-dev-client",
    [
      "react-native-edge-to-edge",
      {
        android: {
          parentTheme: "Default",
          enforceNavigationBarContrast: false,
        },
      },
    ],
    "@react-native-firebase/app",
    "@react-native-firebase/messaging",
    [
      "expo-build-properties",
      {
        ios: {
          buildReactNativeFromSource: true,
        },
      },
    ],
  ],
  android: {
    package: "com.doubleh.bozorchi",
    googleServicesFile:
      process.env.GOOGLE_SERVICES_JSON || "./google-services.json",
    versionCode: 246,
    adaptiveIcon: {
      foregroundImage: "./assets/android.png",
      backgroundColor: "#ffffff",
    },
    edgeToEdgeEnabled: true,
    permissions: [
      "android.permission.ACCESS_NETWORK_STATE",
      "android.permission.CAMERA",
      "android.permission.INTERNET",
      "android.permission.MODIFY_AUDIO_SETTINGS",
      "android.permission.RECORD_AUDIO",
      "android.permission.SYSTEM_ALERT_WINDOW",
      "android.permission.WAKE_LOCK",
      "android.permission.BLUETOOTH",
      "android.permission.POST_NOTIFICATIONS",
      "android.permission.VIBRATE",
    ],
    softwareKeyboardLayoutMode: "pan",
    usesCleartextTraffic: true,
    networkSecurityConfig:
      "./android/app/src/main/res/xml/network_security_config.xml",
    jsEngine: "hermes", // Added for platform-specific Hermes configuration
  },
  ios: {
    bundleIdentifier: "com.doubleh.bozorchi",
    googleServicesFile:
      process.env.GOOGLE_SERVICES_INFO_PLIST || "./GoogleService-Info.plist",
    buildNumber: "246",
    supportsTablet: true,
    bitcode: false,
    infoPlist: {
      NSCameraUsageDescription:
        "This app uses the camera to scan product barcodes for quick search and inventory management.",
      NSPhotoLibraryUsageDescription:
        "This app accesses your photo library to upload product images for your store inventory. For example, when adding a new product, you can select an image from your photo library to display as the product photo in your store's catalog and POS system.",
      NSPhotoLibraryAddUsageDescription:
        "This app needs permission to save product images to your photo library for backup and sharing purposes.",
      NSUserNotificationsUsageDescription:
        "This app uses notifications to alert you about important transactions and store updates.",
      NSMicrophoneUsageDescription:
        "This app uses the microphone for voice commands and AI assistant features to help you manage your store hands-free.",
      NSSpeechRecognitionUsageDescription:
        "This app uses speech recognition to understand your voice commands and provide intelligent assistance for inventory and sales management.",
      NSAppTransportSecurity: {
        NSAllowsArbitraryLoads: true,
        NSExceptionDomains: {
          "minio.bozorchi.store": {
            NSExceptionAllowsInsecureHTTPLoads: true,
          },
        },
      },
    },
    jsEngine: "hermes", // Added for platform-specific Hermes configuration
  },
  extra: {
    API_URL:
      process.env.EXPO_PUBLIC_API_URL ||
      (process.env.NODE_ENV === "production"
        ? "https://app.bozorchi.store"
        : "https://bozorchi-devbackend-ikzdd4-b4a788-46-62-221-217.traefik.me"),
    eas: {
      projectId:
        process.env.EAS_PROJECT_ID || "dc5deb9c-ba03-4fdc-b347-76428ebd3982",
    },
  },
};
