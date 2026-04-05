import { registerRootComponent } from "expo";
import messaging from "@react-native-firebase/messaging";

// Import edge-to-edge safely to prevent native module errors
try {
  require("react-native-edge-to-edge");
} catch (error) {
  console.warn("react-native-edge-to-edge failed to load:", error);
}

import App from "./App";

messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log("FCM background message received", {
    messageId: remoteMessage.messageId,
    data: remoteMessage.data,
  });
});

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
