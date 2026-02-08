import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { ArrowLeft, CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";

import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from 'sonner'
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const customerSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    phone: z.string().optional(),
    language: z.string().optional(),
    gender: z.string().optional(),
    dateOfBirth: z.date().optional(),
    socialLinks: z.object({
        instagram: z.string().optional(),
        telegram: z.string().optional(),
        facebook: z.string().optional(),
    }).optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface Customer {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    language: string | null;
    gender: string | null;
    date_of_birth: string | null;
    social_links: Record<string, string> | null;
    store_id: string;
}

export default function CustomerEditPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { customerId } = useParams();
    const queryClient = useQueryClient();
    const { userStore } = useAuth();

    const storeId = userStore?.store?.id;

    const [form, setForm] = useState<CustomerFormData>({
        name: "",
        email: "",
        phone: "",
        language: "uz",
        gender: "",
        socialLinks: {
            instagram: "",
            telegram: "",
            facebook: "",
        },
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const { data: customer, isLoading: isCustomerLoading } = useQuery({
        queryKey: ["customer", customerId, storeId],
        queryFn: async () => {
            if (!storeId || !customerId) return null;
            const res = await api.get<{ customer: Customer }>(
                `/api/customers/${customerId}?storeId=${encodeURIComponent(storeId)}`
            );
            return res.customer;
        },
        enabled: !!storeId && !!customerId,
    });

    useEffect(() => {
        if (customer) {
            setForm({
                name: customer.name,
                email: customer.email || "",
                phone: customer.phone || "",
                language: customer.language || "uz",
                gender: customer.gender || "",
                dateOfBirth: customer.date_of_birth ? new Date(customer.date_of_birth) : undefined,
                socialLinks: {
                    instagram: customer.social_links?.instagram || "",
                    telegram: customer.social_links?.telegram || "",
                    facebook: customer.social_links?.facebook || "",
                },
            });
        }
    }, [customer]);

    const updateCustomerMutation = useMutation({
        mutationFn: async (data: CustomerFormData) => {
            if (!storeId || !customerId) {
                throw new Error(t("pos.noStoreSelected"));
            }

            await api.put(`/api/customers/${customerId}?storeId=${encodeURIComponent(storeId)}`, {
                name: data.name.trim(),
                email: data.email?.trim() || undefined,
                phone: data.phone?.trim() || undefined,
                language: data.language,
                gender: data.gender,
                date_of_birth: data.dateOfBirth ? data.dateOfBirth.toISOString() : undefined,
                social_links: data.socialLinks,
            });
        },
        onSuccess: async () => {
            if (storeId) {
                await Promise.all([
                    queryClient.invalidateQueries({ queryKey: ["customers", storeId] }),
                    queryClient.invalidateQueries({ queryKey: ["customer", customerId, storeId] }),
                    queryClient.invalidateQueries({ queryKey: ["pos-customers", storeId] }),
                ]);
            }
            toast.success(t("customers.customerUpdated"));
            navigate("/customers");
        },
        onError: (error: unknown) => {
            console.error("Customer update failed", error);
            toast.error(error instanceof Error ? error.message : t("common.error"));
        },
    });

    const handleChange = (field: keyof CustomerFormData, value: any) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleSocialLinkChange = (platform: string, value: string) => {
        setForm((prev) => ({
            ...prev,
            socialLinks: {
                ...prev.socialLinks,
                [platform]: value,
            },
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        try {
            customerSchema.parse(form);
            setErrors({});
            updateCustomerMutation.mutate(form);
        } catch (error) {
            if (error instanceof z.ZodError) {
                const newErrors: Record<string, string> = {};
                (error as any).errors.forEach((err: any) => {
                    if (err.path[0]) {
                        newErrors[err.path[0] as string] = err.message;
                    }
                });
                setErrors(newErrors);
                toast.error(t("common.validationError", { defaultValue: "Please check the form for errors" }));
            }
        }
    };

    const isSubmitting = updateCustomerMutation.isPending;

    if (isCustomerLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                <h2 className="text-xl font-semibold">{t("customers.customerNotFound")}</h2>
                <Button onClick={() => navigate("/customers")}>
                    {t("common.back")}
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-4 md:p-6 max-w-4xl mx-auto w-full">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => navigate("/customers")}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{t("customers.editCustomer")}</h1>
                    <p className="text-muted-foreground">
                        {t("customers.editCustomerDescription", { defaultValue: "Update customer information." })}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>{t("customers.customerDetails")}</CardTitle>
                        <CardDescription>{t("customers.customerSelected", { defaultValue: "Basic information about the customer." })}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">
                                {t("customers.customerName")} <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="name"
                                value={form.name}
                                onChange={(event) => handleChange("name", event.target.value)}
                                placeholder={t("customers.customerName")}
                                className={errors.name ? "border-destructive" : ""}
                            />
                            {errors.name && (
                                <p className="text-sm text-destructive">{errors.name}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email">{t("customers.customerEmail")}</Label>
                                <Input
                                    id="email"
                                    value={form.email}
                                    onChange={(event) => handleChange("email", event.target.value)}
                                    placeholder={t("customers.customerEmail")}
                                    type="email"
                                    className={errors.email ? "border-destructive" : ""}
                                />
                                {errors.email && (
                                    <p className="text-sm text-destructive">{errors.email}</p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="phone">{t("customers.customerPhone")}</Label>
                                <Input
                                    id="phone"
                                    value={form.phone}
                                    onChange={(event) => handleChange("phone", event.target.value)}
                                    placeholder={t("customers.customerPhone")}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="language">{t("common.language", { defaultValue: "Language" })}</Label>
                                <Select
                                    value={form.language}
                                    onValueChange={(value) => handleChange("language", value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={t("common.selectLanguage", { defaultValue: "Select language" })} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="uz">O'zbekcha</SelectItem>
                                        <SelectItem value="ru">Русский</SelectItem>
                                        <SelectItem value="en">English</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="gender">{t("common.gender", { defaultValue: "Gender" })}</Label>
                                <Select
                                    value={form.gender}
                                    onValueChange={(value) => handleChange("gender", value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={t("common.selectGender", { defaultValue: "Select gender" })} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="male">{t("common.male", { defaultValue: "Male" })}</SelectItem>
                                        <SelectItem value="female">{t("common.female", { defaultValue: "Female" })}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label>{t("common.dateOfBirth", { defaultValue: "Date of Birth" })}</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !form.dateOfBirth && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {form.dateOfBirth ? format(form.dateOfBirth, "PPP") : <span>{t("common.pickDate", { defaultValue: "Pick a date" })}</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={form.dateOfBirth}
                                            onSelect={(date) => handleChange("dateOfBirth", date)}
                                            initialFocus
                                            captionLayout="dropdown"
                                            fromYear={1900}
                                            toYear={new Date().getFullYear()}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Label>{t("customers.socialLinks", { defaultValue: "Social Links" })}</Label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="instagram" className="text-xs text-muted-foreground">Instagram</Label>
                                    <Input
                                        id="instagram"
                                        value={form.socialLinks?.instagram || ""}
                                        onChange={(e) => handleSocialLinkChange("instagram", e.target.value)}
                                        placeholder="@username"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="telegram" className="text-xs text-muted-foreground">Telegram</Label>
                                    <Input
                                        id="telegram"
                                        value={form.socialLinks?.telegram || ""}
                                        onChange={(e) => handleSocialLinkChange("telegram", e.target.value)}
                                        placeholder="@username"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="facebook" className="text-xs text-muted-foreground">Facebook</Label>
                                    <Input
                                        id="facebook"
                                        value={form.socialLinks?.facebook || ""}
                                        onChange={(e) => handleSocialLinkChange("facebook", e.target.value)}
                                        placeholder="Profile URL"
                                    />
                                </div>
                            </div>
                        </div>

                    </CardContent>
                </Card>

                <div className="flex items-center justify-end gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate("/customers")}
                    >
                        {t("common.cancel")}
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {t("common.save")}
                    </Button>
                </div>
            </form>
        </div>
    );
}
