import { z } from "zod";

const passwordSchema = z
  .string()
  .min(1, "Password is required")
  .min(8, "Password must be at least 8 characters long")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/,
    "Password must contain at least one uppercase letter, one lowercase letter, and one number"
  );

const baseRegisterSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please provide a valid email address"),
  password: passwordSchema,
});

const privilegedRegisterSchema = {
  organization_name: z.string().min(1, "Organization name is required"),
  store_name: z.string().min(1, "Store name is required"),
  address: z.string().min(1, "Address is required"),
  currency: z.string().min(1, "Currency is required"),
  phone: z.string().min(1, "Phone is required"),
};

export const registerSchema = z.discriminatedUnion("role", [
  baseRegisterSchema.extend({
    role: z.literal("owner"),
    ...privilegedRegisterSchema,
  }),
  baseRegisterSchema.extend({
    role: z.literal("cashier"),
    invite_token: z.string().min(1, "Invite token is required"),
  }),
]);

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please provide a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const googleLoginSchema = z.object({
  idToken: z.string().min(1, "Google ID token is required"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(1, "New password is required")
    .min(8, "New password must be at least 8 characters long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/,
      "New password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
});

export const updateProfileSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please provide a valid email address"),
  name: z.string().optional().nullable(),
  pushToken: z.string().optional().nullable(),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please provide a valid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: passwordSchema,
});
