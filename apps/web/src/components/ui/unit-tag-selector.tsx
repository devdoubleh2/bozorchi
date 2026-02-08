import { useState } from "react";
import { Hash, Plus, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";

interface Unit {
  id: string;
  name: string;
  category_id: string;
}

type UnitTagSelectorProps = {
  units?: Unit[];
  selectedUnitValue?: string;
  onUnitValueSelect: (unitValue: string) => void;
  error?: string;
};

export default function UnitTagSelector({
  units,
  selectedUnitValue,
  onUnitValueSelect,
  error,
}: UnitTagSelectorProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [newUnitName, setNewUnitName] = useState("");
  const [isAddUnitOpen, setIsAddUnitOpen] = useState(false);



  const createUnitMutation = useMutation({
    mutationFn: async (data: { name: string; category_id: string }) => {
      const res = await api.post<{ unit: Unit }>("/api/units", {
        name: data.name,
        category_id: data.category_id,
      });
      return res.unit;
    },
    onSuccess: (unit: Unit) => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
      onUnitValueSelect(unit.id);
      resetForm();
      setIsAddUnitOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteUnitMutation = useMutation({
    mutationFn: async (unitId: string) => {
      await api.delete(`/api/units/${unitId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
      toast.success(t("units.unitDeletedSuccessfully"));
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setNewUnitName("");
  };

  const handleCreateUnit = () => {
    if (!newUnitName.trim()) {
      toast.warning(t("units.unitNameRequired"));
      return;
    }

    // Note: category_id is legacy field, can be removed from backend schema
    createUnitMutation.mutate({
      name: newUnitName.trim(),
      category_id: "", // Legacy field
    });
  };

  const handleCloseSheet = () => {
    resetForm();
    setIsAddUnitOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {units &&
          units.map((unit) => (
            <ContextMenu key={unit.id}>
              <ContextMenuTrigger asChild>
                <Badge
                  variant={selectedUnitValue === unit.id ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/10 transition-colors"
                  onClick={() => onUnitValueSelect(unit.id)}
                >
                  <Hash size={12} className="mr-2" />
                  {unit.name}
                </Badge>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem
                  onClick={() => deleteUnitMutation.mutate(unit.id)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t("common.delete")}
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          ))}

        <Dialog open={isAddUnitOpen} onOpenChange={setIsAddUnitOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 border-dashed border-primary text-primary hover:bg-primary/10"
            >
              <Plus size={14} className="mr-1" />
              {t("units.addUnit")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{t("units.createUnit")}</DialogTitle>
              <DialogDescription>
                {t("units.createUnitDescription")}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col space-y-6 mt-6">
              <div className="space-y-2">
                <Label htmlFor="unit-name">{t("units.unitName")}</Label>
                <Input
                  id="unit-name"
                  value={newUnitName}
                  onChange={(e) => setNewUnitName(e.target.value)}
                  placeholder={t("units.enterUnitName")}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={handleCloseSheet}
                  className="flex-1"
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  onClick={handleCreateUnit}
                  disabled={createUnitMutation.isPending}
                  className="flex-1"
                >
                  {createUnitMutation.isPending
                    ? t("common.loading")
                    : t("common.create")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <div className="text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}