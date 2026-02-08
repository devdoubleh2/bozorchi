import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, RotateCcw, User, Wallet } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";
import { parseApiError } from "@/lib/utils";
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function RepayDebtPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { getStore } = useAuth();

  const [customerId, setCustomerId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const storeQuery = useQuery({
    queryKey: ["store"],
    queryFn: async () => {
      const store = await getStore();
      return store;
    },
    staleTime: 1000 * 60 * 5,
  });

  const storeId = storeQuery.data?.store?.id;

  const customersQuery = useQuery({
    queryKey: ["customers", storeId],
    queryFn: async () => {
      if (!storeId) return [];
      const response = await api.get<{
        customers: Array<{ id: string; name: string }>;
      }>(`/api/customers?store_id=${encodeURIComponent(storeId)}`);
      return response.customers;
    },
    enabled: Boolean(storeId),
    staleTime: 1000 * 60 * 15,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !amount) return;

    const numericAmount = Number.parseFloat(amount);
    if (numericAmount <= 0) {
      toast.warning(t("transactions.invalidAmount"));
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/api/transactions/debt-repayment", {
        customerId,
        amount: numericAmount,
        storeId,
      });

      toast.success(t("transactions.repaymentSuccess", {
        defaultValue: "Debt repayment recorded",
      }));
      navigate("/transactions");
    } catch (error) {
      console.error("Repayment failed", error);
      const parsedError = parseApiError(error);
      toast.error(parsedError.message || t("transactions.repaymentError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          className="gap-2 pl-0 hover:bg-transparent hover:text-primary"
          onClick={() => navigate("/transactions")}
        >
          <ArrowLeft className="size-4" />
          {t("common.back", { defaultValue: "Back" })}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/20">
              <RotateCcw className="size-6" />
            </div>
            <div>
              <CardTitle className="text-xl">
                {t("transactions.repayDebtTitle", {
                  defaultValue: "Repay Debt",
                })}
              </CardTitle>
              <CardDescription>
                {t("transactions.repayDebtDescription", {
                  defaultValue: "Record a debt payment from a customer.",
                })}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="customer">{t("transactions.customer")}</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger id="customer" className="h-12">
                  <div className="flex items-center gap-2">
                    <User className="size-4 text-muted-foreground" />
                    <SelectValue
                      placeholder={t("transactions.selectCustomer", {
                        defaultValue: "Select customer",
                      })}
                    />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {customersQuery.data?.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">{t("transactions.amount")}</Label>
              <div className="relative">
                <Wallet className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={t("transactions.enterAmount", {
                    defaultValue: "Enter amount",
                  })}
                  className="h-12 pl-10"
                />
              </div>
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                className="w-full h-12 text-base"
                disabled={isSubmitting || !customerId || !amount}
              >
                {isSubmitting ? t("common.processing") : t("common.confirm")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
