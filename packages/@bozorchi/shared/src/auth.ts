// Auth types for web app
export interface AuthUser {
  id: string;
  name: string | null;
  email: string;
  role?: "admin" | "cashier";
  created_at?: string;
  membership?: any;
  owned_organization?: any;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: "admin" | "cashier";
  organization_name?: string;
  store_name?: string;
  address?: string;
  phone?: string;
  currency?: string;
  invite_token?: string;
}
