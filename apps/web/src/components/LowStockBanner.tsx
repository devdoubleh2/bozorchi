import { AlertTriangle, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface LowStockBannerProps {
  count: number;
}

export function LowStockBanner({ count }: LowStockBannerProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!count) {
    return null;
  }

  return (
    <Card className="flex items-center justify-between border-amber-400/60 bg-amber-200/50 p-4 dark:bg-amber-950/40">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-full bg-amber-400/30 text-amber-600 dark:bg-amber-800/60 dark:text-amber-300">
          <AlertTriangle className="size-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
            {t("lowStock.alertTitle")}
          </p>
          <p className="text-sm text-amber-800 dark:text-amber-200">
            {count}{" "}
            {count === 1 ? t("lowStock.item") : t("lowStock.items")}{" "}
            {t("lowStock.runningLow")}
          </p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="text-amber-900 hover:bg-amber-400/30 hover:text-amber-900 dark:text-amber-100"
        onClick={() => navigate("/inventory/low-stock")}
      >
        {t("common.view", { defaultValue: "View" })}
        <ChevronRight className="ml-1 size-4" />
      </Button>
    </Card>
  );
}
