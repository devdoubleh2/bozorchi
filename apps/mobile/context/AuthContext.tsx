import React, { createContext, useContext, useEffect, useState } from "react";
import { createStore, useStore } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../lib/api";
import { log } from "@/debugging/log";
import { Store } from "@/types";
import {
  AuthUser,
  AuthResponse,
  RegisterData,
  UserStoreInfo
} from "@/types/auth";
import { queryClient } from "@/lib/queries/queryClient";

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  setUser: (user: AuthUser | null) => void;
  userStore: UserStoreInfo | null;
  getStore: () => Promise<UserStoreInfo | null>;
  setLoading: (isLoading: boolean) => void;
  signOut: () => void;
  signUp: (
    data: RegisterData
  ) => Promise<{
    error: Error | null;
    user: AuthUser | null;
  }>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{
    error: Error | null;
    user: AuthUser | null;
  }>;
  switchStore: (
    storeId: string
  ) => Promise<{
    success: boolean;
    error: Error | null;
  }>;
}

const createAuthStore = (initialState: Partial<AuthState> = {}) => {
  return createStore<AuthState>()(
    persist(
      (set, get) => {
        // Bind API client to use this store's state
        api.onAuthFailure = async () => {
          get().signOut();
        };

        return {
          user: null,
          isLoading: true,
          userStore: null,
          setUser: (user) => {
            log.debug("AuthContext", "Setting user", {
              userId: user?.id,
              email: user?.email,
            });
            set({ user });
          },
          setLoading: (isLoading) => {
            log.debug("AuthContext", "Setting loading state", { isLoading });
            set({ isLoading });
          },
          signOut: async () => {
            log.debug("AuthContext", "Starting sign out process");
            try {
              await api.post("/api/auth/logout");
              queryClient.clear();
            } catch (e) {
              log.warn("AuthContext", "Logout API call failed", e);
            }
            set({ user: null, userStore: null });
            log.debug("AuthContext", "Sign out completed");
          },
          signUp: async (data: RegisterData) => {
            try {
              log.debug("AuthContext", "Starting sign up process", { email: data.email });
              const result = await api.post<AuthResponse>(
                "/api/auth/register",
                data
              );
              log.debug("AuthContext", "Sign up API response received", {
                userId: result.user?.id,
              });

              set({ user: result.user });
              log.debug("AuthContext", "Sign up completed successfully");
              return { user: result.user, error: null };
            } catch (error) {
              log.error("AuthContext", "Sign up failed", error);
              return { user: null, error: error as Error };
            }
          },
          signIn: async (email: string, password: string) => {
            try {
              log.debug("AuthContext", "Starting sign in process", { email });
              const result = await api.post<AuthResponse>(
                "/api/auth/login",
                { email, password }
              );
              log.debug("AuthContext", "Sign in API response received", {
                userId: result.user?.id,
                isOwner: !!result.user?.owned_organization,
                hasMembership: !!result.user?.membership,
              });

              set({ user: result.user });
              log.debug("AuthContext", "User set in store");

              try {
                await get().getStore();
              } catch (storeError) {
                log.warn("AuthContext", "Failed to fetch store after sign-in, continuing anyway", storeError);
              }

              log.debug("AuthContext", "Sign in completed successfully");
              return {
                user: result.user,
                error: null,
              };
            } catch (error) {
              log.error("AuthContext", "Failed to sign in", error);
              return {
                user: null,
                error: error as Error,

              };
            }
          },
          getStore: async () => {
            try {
              const user = get().user;
              if (!user) {
                log.debug("AuthContext", "No user found, cannot fetch store");
                set({ userStore: null });
                return null;
              }

              log.debug("AuthContext", "Fetching user store from API");
              // Backend returns { data: Store }, NOT { data: UserStoreInfo }
              // We need to construct UserStoreInfo client-side like the web app does
              const res = await api.get<{ data: Store }>(
                "/api/stores/my-store"
              );

              if (!res.data) {
                log.debug("AuthContext", "No store data returned from API");
                set({ userStore: null });
                return null;
              }

              const storeData = res.data;

              // Extract role and approved from user's membership or ownership (matching web app)
              const membership = user.membership;
              const isOwner = !!user.owned_organization;

              // Ensure role is properly typed
              const role: "admin" | "user" = isOwner
                ? "admin"
                : ((membership?.role ?? "user") as "admin" | "user");

              const userStoreInfo: UserStoreInfo = {
                user_id: user.id,
                store_id: storeData.id,
                role,
                approved: isOwner ? true : membership?.approved ?? false,
                store: storeData,
              };

              log.debug("AuthContext", "User store constructed", {
                storeId: userStoreInfo.store_id,
                storeName: userStoreInfo.store.name,
                userRole: userStoreInfo.role,
              });

              set({ userStore: userStoreInfo });
              return userStoreInfo;
            } catch (error) {
              log.error("AuthContext", "Failed to get user store", error);
              set({ userStore: null });
              return null;
            }
          },
          switchStore: async (storeId: string) => {
            try {
              const user = get().user;
              if (!user) {
                log.error("AuthContext", "Cannot switch store: User not authenticated");
                return {
                  success: false,
                  error: new Error("User not authenticated"),
                };
              }

              // Check if user has permission to switch stores (matching web app)
              const isOwner = !!user.owned_organization;
              const isAdmin = user.membership?.role === "admin";

              if (!isOwner && !isAdmin) {
                log.error("AuthContext", "Cannot switch store: Insufficient permissions");
                return {
                  success: false,
                  error: new Error("Only organization owners and admins can switch stores"),
                };
              }

              log.debug("AuthContext", "Switching to store (session-based)", { storeId });

              // Call NEW session-based endpoint that returns updated session (via cookie/token)
              const result = await api.post<{
                store: Store;
                message: string;
              }>("/api/stores/switch", { storeId });

              if (!result.store) {
                log.error("AuthContext", "Store switch failed: No store returned");
                return {
                  success: false,
                  error: new Error("Store switch failed"),
                };
              }

              // Build userStore from returned data (matching web app)
              const role: "admin" | "user" = isOwner
                ? "admin"
                : ((user.membership?.role ?? "user") as "admin" | "user");

              const userStoreInfo: UserStoreInfo = {
                user_id: user.id,
                store_id: result.store.id,
                role,
                approved: isOwner ? true : user.membership?.approved ?? false,
                store: result.store,
              };

              // Update store state
              set({ userStore: userStoreInfo });

              log.debug("AuthContext", "Store switched successfully (session-based)", {
                storeId: result.store.id,
                storeName: result.store.name,
              });

              return { success: true, error: null };
            } catch (error) {
              log.error("AuthContext", "Failed to switch store", error);
              return {
                success: false,
                error: error as Error,
              };
            }
          },
          ...initialState,
        };
      },
      {
        name: "auth-storage",
        storage: createJSONStorage(() => AsyncStorage),
        partialize: (state) => ({
          // Only persist user object, not tokens (handled by cookies)
          user: state.user,
          userStore: state.userStore,
        }),
      })
  );
};

const AuthStoreContext = createContext<ReturnType<
  typeof createAuthStore
> | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
  initialState?: Partial<AuthState>;
}

export function AuthProvider({ children, initialState }: AuthProviderProps) {
  const [store] = useState(() => createAuthStore(initialState));

  useEffect(() => {
    // Try to restore session by fetching profile
    (async () => {
      try {
        log.debug("AuthContext", "Initializing auth context");
        // We no longer check for a token. We just try to fetch the profile.
        // If the cookie is valid, this will succeed.

        const user = await api.get<AuthUser>("/api/auth/profile");

        if (user) {
          log.debug(
            "AuthContext",
            "Profile restored",
            JSON.stringify(user, null, 2)
          );
          store.getState().setUser(user);

          // Also fetch store on session restore (matching web app pattern)
          try {
            await store.getState().getStore();
          } catch (storeError) {
            log.warn("AuthContext", "Failed to fetch store during session restore, continuing anyway", storeError);
          }
        }
      } catch (err) {
        log.error("AuthContext", "Failed to restore session", err);
        // If profile fetch fails (401), we assume not logged in.
      } finally {
        log.debug("AuthContext", "Auth initialization completed");
        store.getState().setLoading(false);
      }
    })();
  }, []);

  return (
    <AuthStoreContext.Provider value={store}>
      {children}
    </AuthStoreContext.Provider>
  );
}

export function useAuthContext<T>(selector: (state: AuthState) => T): T {
  const store = useContext(AuthStoreContext);
  if (!store) {
    throw new Error("Missing AuthStoreProvider");
  }
  return useStore(store, selector);
}
