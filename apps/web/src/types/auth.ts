// Auth types for web app

// ============================================================================
// ORGANIZATION TYPES
// ============================================================================

export interface Organization {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
  subscription_id?: string | null;
  subscription_status?: string | null;
  subscription_ends_at?: string | null;
  owner_id: string;
  // Payments / integrations
  uzum_fastpay_enabled?: boolean;
  uzum_fastpay_merchant_id?: string | null;
  uzum_fastpay_secret_key?: string | null;
  uzum_fastpay_service_id?: string | null;
  uzum_fastpay_merchant_service_user_id?: string | null;
  // E-commerce
  ecommerce_enabled?: boolean;
}

// ============================================================================
// ROLE & PERMISSION TYPES
// ============================================================================

export type Role = "owner" | "cashier";

export const resolveEffectiveRole = (
  user: Pick<AuthUser, "owned_organization" | "membership"> | null | undefined
): Role =>
  user?.owned_organization ? "owner" : (user?.membership?.role ?? "cashier");

/** Ownership derives from the organization owner link, never the role column. */
export const isOwner = (
  user: Pick<AuthUser, "owned_organization"> | null | undefined
): boolean => !!user?.owned_organization;

/** Ownership is the only management signal; cashiers pass only via permissions. */
export const isManager = (
  user: Pick<AuthUser, "owned_organization" | "membership"> | null | undefined
): boolean => isOwner(user);

export type Permission =
  | "POS_ACCESS"
  | "MANAGE_PRODUCTS"
  | "MANAGE_INVENTORY"
  | "VIEW_COST_PRICE"
  | "VIEW_ANALYTICS"
  | "VIEW_DASHBOARD";

// ============================================================================
// USER ORGANIZATION (Membership) TYPES
// ============================================================================

export interface UserOrganization {
  id: string;
  user_id: string;
  organization_id: string;
  store_id: string | null;
  role: Role;
  permissions: Permission[];
  approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserOrganizationWithOrg extends UserOrganization {
  organization: Organization;
}

// ============================================================================
// STORE TYPES
// ============================================================================

export interface Store {
  id: string;
  name: string;
  organization_id: string;
  currency?: string | null;
  loyalty_cashback_percentage?: number;
  address?: string | null;
  phone?: string | null;
  created_at?: string;
  updated_at?: string;
}

// ============================================================================
// USER TYPES
// ============================================================================

export interface AuthUser {
  id: string;
  name?: string | null;
  email: string;
  created_at?: string;
  updated_at?: string;
  push_token?: string | null;
  deleted_at?: string | null;
  membership?: UserOrganizationWithOrg | null;
  owned_organization?: Organization | null;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ============================================================================
// AUTH RESPONSE TYPES
// ============================================================================

export interface AuthResponse {
  token?: string;
  refreshToken?: string;
  user: AuthUser;
  needsOnboarding?: boolean;
}

export interface UserStoreInfo {
  user_id: string;
  store_id: string;
  role: Role;
  approved: boolean;
  store: Store;
  permissions?: Permission[];
}

// ============================================================================
// AUTH PAYLOAD TYPES
// ============================================================================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: Role;
  organization_name?: string;
  store_name?: string;
  address?: string;
  phone?: string;
  currency?: string;
  organization_id?: string;
  invite_token?: string;
}
