import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useTheme, type Theme } from "@/components/providers/ThemeProvider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const THEME_OPTIONS: Array<{
  value: Theme;
  icon: typeof Sun;
  labelKey: string;
  defaultLabel: string;
}> = [
  { value: "light", icon: Sun, labelKey: "common.light", defaultLabel: "Light" },
  { value: "dark", icon: Moon, labelKey: "common.dark", defaultLabel: "Dark" },
  { value: "system", icon: Monitor, labelKey: "common.system", defaultLabel: "System" },
];

type ThemeToggleProps = {
  className?: string;
};

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { t } = useTranslation();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const TriggerIcon = resolvedTheme === "dark" ? Moon : Sun;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={className}
          aria-label={t("settings.theme", { defaultValue: "Theme" })}
        >
          <TriggerIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-40">
        <DropdownMenuLabel className="text-xs font-medium uppercase text-muted-foreground">
          {t("settings.theme", { defaultValue: "Theme" })}
        </DropdownMenuLabel>
        {THEME_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isActive = option.value === theme;

          return (
            <DropdownMenuItem
              key={option.value}
              className="flex items-center justify-between text-sm"
              onClick={() => setTheme(option.value)}
            >
              <span className="flex items-center gap-2">
                <Icon className="size-4" />
                {t(option.labelKey, { defaultValue: option.defaultLabel })}
              </span>
              <Check className={cn("size-4 text-primary", !isActive && "invisible")} />
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
