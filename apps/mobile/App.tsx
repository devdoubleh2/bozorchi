import React from "react";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";

import { LanguageProvider } from "./context/LanguageContext";
import AppNavigator from "./navigation/AppNavigator";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { SafeAreaProvider } from "react-native-safe-area-context";
// Initialize i18n
import "./lib/i18n";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queries/queryClient";

// Polyfill for structuredClone (React Native does not support it natively)
if (typeof global.structuredClone !== "function") {
  global.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}



const App = () => {

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <BottomSheetModalProvider>
          <LanguageProvider>
            <ThemeProvider>
              <QueryClientProvider client={queryClient}>
                <AuthProvider>
                  <AppNavigator />
                </AuthProvider>
              </QueryClientProvider>
            </ThemeProvider>
          </LanguageProvider>
        </BottomSheetModalProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
};

export default App;
