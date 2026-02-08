import { z } from "zod";

export const loginSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(1, { message: "Password is required" }),
});

export type LoginSchema = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
    name: z.string().min(1, { message: "Name is required" }),
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters" }),
    confirmPassword: z.string().min(1, { message: "Confirm Password is required" }),
    role: z.enum(["admin", "user"]),

    // Admin fields
    organization_name: z.string().optional(),
    address: z.string().optional(),
    phone: z.string().optional(), // Regex validation can be added here
    currency: z.string().optional(),

    // User fields
    store_id: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
}).refine((data) => {
    if (data.role === "admin") {
        return !!data.organization_name;
    }
    return true;
}, {
    message: "Organization name is required",
    path: ["organization_name"],
}).refine((data) => {
    if (data.role === "admin") {
        return !!data.address;
    }
    return true;
}, {
    message: "Address is required",
    path: ["address"],
}).refine((data) => {
    if (data.role === "admin") {
        return !!data.phone;
    }
    return true;
}, {
    message: "Phone number is required",
    path: ["phone"],
}).refine((data) => {
    if (data.role === "user") {
        return !!data.store_id;
    }
    return true;
}, {
    message: "Store ID is required",
    path: ["store_id"],
});

export type RegisterSchema = z.infer<typeof registerSchema>;
