/**
 * Auth types for mobile app
 *
 * These types mirror the web app's auth types to ensure consistency.
 * Based on: apps/web/src/types/auth.ts
 */

import { Store } from './index';

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
}

// ============================================================================
// USER ORGANIZATION (Membership) TYPES
// ============================================================================

export type Role = 'admin' | 'user';

export type Permission =
    | 'POS_ACCESS'
    | 'MANAGE_PRODUCTS'
    | 'MANAGE_INVENTORY'
    | 'VIEW_COST_PRICE'
    | 'VIEW_ANALYTICS';

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
// USER TYPES
// ============================================================================

/** Base user from API */
export interface User {
    id: string;
    name?: string | null;
    email: string;
    created_at: string;
    updated_at: string;
    push_token?: string | null;
    deleted_at?: string | null;
}

/** User with organization relations - auth response type (matches web's AuthUser) */
export interface AuthUser extends User {
    membership?: UserOrganizationWithOrg | null;
    owned_organization?: Organization | null;
}

// ============================================================================
// AUTH RESPONSE TYPES
// ============================================================================

/** Authentication response from /api/auth/login and /api/auth/register */
export interface AuthResponse {
    token: string;
    refreshToken: string;
    user: AuthUser;
}

/** Registration payload */
export interface RegisterData {
    name: string;
    email: string;
    password: string;
    role: 'admin' | 'user';
    organization_name?: string;
    store_name?: string;
    address?: string;
    phone?: string;
    currency?: string;
    organization_id?: string;
    store_id?: string;
}

/** Login payload */
export interface LoginData {
    email: string;
    password: string;
}

// ============================================================================
// STORE INFO TYPES
// ============================================================================

/** User's active store info (matches web's UserStoreInfo) */
export interface UserStoreInfo {
    user_id: string;
    store_id: string;
    role: Role;
    approved: boolean;
    store: Store;
}
