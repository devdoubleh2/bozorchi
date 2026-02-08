import { useEffect, useRef } from "react";
import { useNavigationState } from "@react-navigation/native";
import { trackScreen } from "../lib/telemetry";

/**
 * Hook to automatically track screen navigation
 * Add this to your root navigator component
 * 
 * Usage:
 * ```tsx
 * function AppNavigator() {
 *   useNavigationTracking();
 *   return <Stack.Navigator>...</Stack.Navigator>;
 * }
 * ```
 */
export function useNavigationTracking() {
    const routeName = useNavigationState((state) => {
        if (!state || !state.routes || state.routes.length === 0) return undefined;
        const route = state.routes[state.index];
        return route?.name;
    });

    const previousRouteName = useRef<string | undefined>(undefined);

    useEffect(() => {
        if (routeName && routeName !== previousRouteName.current) {
            trackScreen(routeName);
            previousRouteName.current = routeName;
        }
    }, [routeName]);
}

export default useNavigationTracking;
