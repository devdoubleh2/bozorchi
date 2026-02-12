/**
 * Auth Store - Single source of truth for web app authentication state.
 *
 * Uses Zustand with persistence. Manages user profile and store selection.
 * Authentication tokens are stored in HttpOnly cookies by the backend.
 * The API client sends credentials: 'include' to automatically send cookies.
 */

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { api } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import type {
  AuthResponse,
  AuthUser,
  UserStoreInfo,
  Organization,
  RegisterData,
  Store,
} from "@/types/auth";
import { parseApiError, type ParsedApiError } from "@/lib/utils";
import { toast } from "sonner";

// ============================================================================
// TYPES
// ============================================================================

export interface AuthState {
  // Persisted (only storeId - token is in HttpOnly cookie)
  storeId: string | null;

  // Runtime (fetched from API)
  user: AuthUser | null;
  userStore: UserStoreInfo | null;
  organization: Organization | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  signIn: (
    email: string,
    password: string
  ) => Promise<{
    error: ParsedApiError | null;
    user: AuthUser | null;
  }>;
  signUp: (data: RegisterData) => Promise<{
    error: ParsedApiError | null;
    user: AuthUser | null;
  }>;
  signOut: () => Promise<void>;
  restoreSession: () => Promise<void>;
  fetchProfile: () => Promise<AuthUser | null>;
  fetchUserStore: () => Promise<UserStoreInfo | null>;
  getStore: () => Promise<UserStoreInfo | null>;
  setStoreId: (storeId: string | null) => void;
  switchStore: (storeId: string) => Promise<{
    success: boolean;
    error: ParsedApiError | null;
  }>;
}

const extractOrganization = (user: AuthUser): Organization | null =>
  user.membership?.organization ?? user.owned_organization ?? null;

const storage =
  typeof window !== "undefined"
    ? createJSONStorage(() => localStorage)
    : undefined;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => {
      // Bind API client callbacks
      if (typeof window !== "undefined") {
        api.onAuthFailure = async () => {
          await get().signOut();
          window.location.href = "/login";
        };
      }

      return {
        // Initial state
        storeId: null,
        user: null,
        userStore: null,
        organization: null,
        isLoading: true,
        isAuthenticated: false,

        // Fetch profile from API
        fetchProfile: async () => {
          try {
            const user = await api.get<AuthUser>("/api/auth/profile");
            set({ user, organization: extractOrganization(user), isAuthenticated: true });
            return user;
          } catch {
            set({ user: null, organization: null, isAuthenticated: false });
            return null;
          }
        },

        // Fetch user's store info
        fetchUserStore: async () => {
          try {
            const { user } = get();
            if (!user) {
              set({ userStore: null, storeId: null });
              return null;
            }

            // Get store from backend
            const storeRes = await api.get<{ data: Store }>(
              "/api/stores/my-store"
            );
            if (!storeRes.data) {
              set({ userStore: null, storeId: null });
              return null;
            }

            // Extract role and approved from user's membership or ownership
            const membership = user.membership;
            const isOwner = !!user.owned_organization;

            // Ensure role is properly typed
            const role: "admin" | "user" = isOwner
              ? "admin"
              : ((membership?.role ?? "user") as "admin" | "user");

            const userStoreInfo: UserStoreInfo = {
              user_id: user.id,
              store_id: storeRes.data.id,
              role,
              approved: isOwner ? true : membership?.approved ?? false,
              permissions: isOwner ? [] : membership?.permissions ?? [],
              store: storeRes.data,
            };

            set({ userStore: userStoreInfo, storeId: storeRes.data.id });
            return userStoreInfo;
          } catch (error) {
            console.error("Failed to fetch user store:", error);
            set({ userStore: null, storeId: null });
            return null;
          }
        },

        // Get store - wrapper around fetchUserStore for compatibility
        getStore: async () => {
          return get().fetchUserStore();
        },

        // Restore session from HttpOnly cookie
        restoreSession: async () => {
          set({ isLoading: true });
          try {
            // Try to fetch profile - if cookie is valid, this will work
            const profile = await get().fetchProfile();

            if (!profile) {
              set({ storeId: null, isAuthenticated: false });
              return;
            }

            const store = await get().fetchUserStore();
            const { storeId } = get();
            if (!store && !storeId) {
              toast.info(
                "No store selected. Please select a store to continue."
              );
            }
          } catch {
            set({
              storeId: null,
              user: null,
              userStore: null,
              organization: null,
              isAuthenticated: false,
            });
          } finally {
            set({ isLoading: false });
          }
        },

        // Sign in - cookie is set by backend
        signIn: async (email, password) => {
          try {
            const result = await api.post<AuthResponse>("/api/auth/login", {
              email,
              password,
            });

            set({
              user: result.user,
              organization: extractOrganization(result.user),
              isAuthenticated: true,
            });

            await get()
              .fetchUserStore()
              .catch(() => set({ userStore: null, storeId: null }));
            return { user: result.user, error: null };
          } catch (error) {
            return { user: null, error: parseApiError(error) };
          }
        },

        // Sign up - cookie is set by backend
        signUp: async (data) => {
          try {
            const result = await api.post<AuthResponse>(
              "/api/auth/register",
              data
            );

            set({
              user: result.user,
              organization: extractOrganization(result.user),
              isAuthenticated: true,
            });

            await get()
              .fetchUserStore()
              .catch(() => set({ userStore: null, storeId: null }));
            return { user: result.user, error: null };
          } catch (error) {
            return { user: null, error: parseApiError(error) };
          }
        },

        // Sign out - clear local state, cookie will be cleared/expired by backend
        signOut: async () => {
          try {
            // Call backend to clear the cookie
            await api.post("/api/auth/logout").catch(() => { });
            localStorage.removeItem("sp-web-auth-state");
          } catch { }
          // Clear React Query cache to prevent data leakage between users
          queryClient.clear();
          set({
            storeId: null,
            user: null,
            userStore: null,
            organization: null,
            isAuthenticated: false,
          });
        },

        // Set store ID
        setStoreId: (storeId) => {
          set({ storeId });
          if (storeId) {
            get().fetchUserStore();
          } else {
            set({ userStore: null });
          }
        },

        // Switch store (for admins/owners only) - session-based, returns new JWT
        switchStore: async (storeId: string) => {
          try {
            const { user } = get();
            if (!user) {
              const error = new Error(
                "User not authenticated"
              ) as ParsedApiError;
              error.details = [];
              return {
                success: false,
                error,
              };
            }

            // Check if user has permission to switch stores
            const isOwner = !!user.owned_organization;
            const isAdmin = user.membership?.role === "admin";

            if (!isOwner && !isAdmin) {
              const error = new Error(
                "Only organization owners and admins can switch stores"
              ) as ParsedApiError;
              error.details = [];
              return {
                success: false,
                error,
              };
            }

            // Call session-based endpoint - cookie will be updated by backend
            const result = await api.post<{
              store: Store;
              message: string;
            }>("/api/stores/switch", { storeId });

            if (!result.store) {
              const error = new Error(
                "Store switch failed"
              ) as ParsedApiError;
              error.details = [];
              return {
                success: false,
                error,
              };
            }

            // Build userStore from returned data
            const role: "admin" | "user" = isOwner
              ? "admin"
              : ((user.membership?.role ?? "user") as "admin" | "user");

            const userStoreInfo: UserStoreInfo = {
              user_id: user.id,
              store_id: result.store.id,
              role,
              approved: isOwner ? true : user.membership?.approved ?? false,
              permissions: isOwner ? [] : user.membership?.permissions ?? [],
              store: result.store,
            };

            // Update store state
            set({
              storeId: result.store.id,
              userStore: userStoreInfo,
            });

            return { success: true, error: null };
          } catch (error) {
            return { success: false, error: parseApiError(error) };
          }
        },
      };
    },
    {
      name: "sp-web-auth-state",
      storage,
      partialize: (state) => ({
        storeId: state.storeId,
      }),
      onRehydrateStorage: () => (state) => {
        state?.restoreSession();
      },
    }
  )
);
