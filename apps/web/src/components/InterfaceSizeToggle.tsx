import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Cog } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const UI_SIZES = [
  { value: "xs", label: "XS", scale: 0.85 },
  { value: "sm", label: "SM", scale: 0.95 },
  { value: "md", label: "MD", scale: 1 },
  { value: "lg", label: "LG", scale: 1.1 },
] as const;

const STORAGE_KEY = "sp-ui-size";

type UiSize = (typeof UI_SIZES)[number]["value"];

const applySize = (value: UiSize) => {
  if (typeof window === "undefined") return;
  document.documentElement.dataset.uiSize = value;
};

export function InterfaceSizeToggle() {
  const { t } = useTranslation();
  const [size, setSize] = useState<UiSize>("md");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY) as UiSize | null;
    if (stored) {
      setSize(stored);
      applySize(stored);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    applySize(size);
    window.localStorage.setItem(STORAGE_KEY, size);
  }, [size]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("settings.interfaceSize", {
            defaultValue: "Interface size",
          })}
        >
          <Cog className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-36">
        <DropdownMenuLabel className="text-xs font-medium uppercase text-muted-foreground">
          {t("settings.interfaceSize", { defaultValue: "Interface size" })}
        </DropdownMenuLabel>
        {UI_SIZES.map((option) => (
          <DropdownMenuItem
            key={option.value}
            className="flex items-center justify-between text-sm"
            onClick={() => setSize(option.value)}
          >
            <span>{option.label}</span>
            {option.value === size ? (
              <span className="text-xs text-primary">
                {t("common.active", { defaultValue: "Active" })}
              </span>
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
