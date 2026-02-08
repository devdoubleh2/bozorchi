import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Search, ExternalLink } from "lucide-react";

export type SearchCommandItem = {
  label: string;
  href: string;
  group?: string;
  keywords?: string[];
  icon?: React.ComponentType<{ className?: string }>;
};

interface SearchCommandProps {
  items: SearchCommandItem[];
  className?: string;
}

export function SearchCommand({ items, className }: SearchCommandProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const groupedItems = useMemo(() => {
    const groups = new Map<string, SearchCommandItem[]>();
    items.forEach((item) => {
      const group =
        item.group ?? t("common.general", { defaultValue: "General" });
      if (!groups.has(group)) {
        groups.set(group, []);
      }
      groups.get(group)!.push(item);
    });
    return Array.from(groups.entries());
  }, [items, t]);

  const handleSelect = (href: string) => {
    setOpen(false);
    navigate(href);
  };

  return (
    <>
      <Button
        variant="outline"
        className={cn(
          "hidden items-center gap-3 rounded-lg border-border/70 bg-background px-4 text-sm text-muted-foreground transition hover:bg-accent/40 md:flex",
          className
        )}
        onClick={() => setOpen(true)}
      >
        <Search className="size-4" />
        <span className="text-sm font-medium text-foreground">
          {t("common.search", { defaultValue: "Search" })}
        </span>
        <kbd className="ml-auto hidden rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline">
          ⌘K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command>
          <CommandInput
            placeholder={t("common.searchPlaceholder", {
              defaultValue: "Type a command or search...",
            })}
          />
          <CommandList>
            <CommandEmpty>
              {t("common.nothingFound", { defaultValue: "No results found." })}
            </CommandEmpty>
            {groupedItems.map(([group, entries]) => (
              <CommandGroup key={group} heading={group} className="px-1">
                {entries.map((item) => (
                  <CommandItem
                    key={item.href}
                    value={[item.label, ...(item.keywords ?? [])].join(" ")}
                    onSelect={() => handleSelect(item.href)}
                    className="flex items-center gap-2 rounded-md px-3 py-2"
                  >
                    {item.icon ? (
                      <item.icon className="size-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <ExternalLink className="size-4 shrink-0 text-muted-foreground" />
                    )}
                    <span className="text-sm text-foreground">
                      {item.label}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
