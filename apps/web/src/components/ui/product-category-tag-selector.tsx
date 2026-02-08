import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

interface ProductCategory {
  id: string;
  name: string;
  color: string | null;
}

type ProductCategorySelectorProps = {
  selectedCategoryId?: string;
  onCategorySelect: (categoryId: string) => void;
  error?: string;
};

const categoryColors = [
  "#4fc3f7",
  "#ff6b6b",
  "#4ecdc4",
  "#45b7d1",
  "#96ceb4",
  "#feca57",
  "#ff9ff3",
  "#a29bfe",
  "#fd79a8",
  "#e17055",
  "#81ecec",
  "#74b9ff",
];

export default function ProductCategoryTagSelector({
  selectedCategoryId,
  onCategorySelect,
  error,
}: ProductCategorySelectorProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [newCategoryName, setNewCategoryName] = useState("");
  const [selectedColor, setSelectedColor] = useState("#4fc3f7");
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);

  const { data: productCategories = [], isLoading } = useQuery<
    ProductCategory[]
  >({
    queryKey: ["productCategories"],
    queryFn: async () => {
      const res = await api.get<{ productCategories: ProductCategory[] }>(
        "/api/product-categories"
      );
      return res.productCategories;
    },
    staleTime: 5 * 60 * 1000,
  });


  const createCategoryMutation = useMutation({
    mutationFn: async (data: { name: string; color: string }) => {
      const res = await api.post<{ productCategory: ProductCategory }>(
        "/api/product-categories",
        data
      );
      return res.productCategory;
    },
    onSuccess: (category: ProductCategory) => {
      queryClient.invalidateQueries({ queryKey: ["productCategories"] });
      onCategorySelect(category.id);
      resetForm();
      setIsAddCategoryOpen(false);
    },
    onError: (error: Error) => {
      toast(error.message);
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      await api.delete(`/api/product-categories/${categoryId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productCategories"] });
      toast(t("products.categoryDeletedSuccessfully"));
    },
    onError: (error: Error) => {
      toast(error.message);
    },
  });

  const resetForm = () => {
    setNewCategoryName("");
    setSelectedColor("#4fc3f7");
  };

  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) {
      toast(t("products.categoryNameRequired"));
      return;
    }
    createCategoryMutation.mutate({
      name: newCategoryName.trim(),
      color: selectedColor,
    });
  };

  const handleCloseSheet = () => {
    resetForm();
    setIsAddCategoryOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : (
          <>
            {productCategories.map((category) => (
              <ContextMenu key={category.id}>
                <ContextMenuTrigger asChild>
                  <Badge
                    variant={
                      selectedCategoryId === category.id ? "default" : "outline"
                    }
                    className="cursor-pointer hover:bg-primary/10 transition-colors"
                    style={{
                      backgroundColor:
                        selectedCategoryId === category.id
                          ? category.color || "#4fc3f7"
                          : "transparent",
                      borderColor: category.color || "#4fc3f7",
                      color:
                        selectedCategoryId === category.id
                          ? "white"
                          : category.color || "#4fc3f7",
                    }}
                    onClick={() => onCategorySelect(category.id)}
                  >
                    <div
                      className="w-2 h-2 rounded-full mr-2"
                      style={{
                        backgroundColor: category.color || "#4fc3f7",
                      }}
                    />
                    {category.name}
                  </Badge>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem
                    onClick={() => deleteCategoryMutation.mutate(category.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t("common.delete")}
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ))}
            <Dialog
              open={isAddCategoryOpen}
              onOpenChange={setIsAddCategoryOpen}
            >
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 border-dashed border-primary text-primary hover:bg-primary/10"
                >
                  <Plus size={14} className="mr-1" />
                  {t("products.addCategory")}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{t("products.createCategory")}</DialogTitle>
                  <DialogDescription>
                    {t("products.createCategoryDescription")}
                  </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col space-y-6 mt-6">
                  <div className="space-y-2">
                    <Label htmlFor="category-name">
                      {t("products.categoryName")}
                    </Label>
                    <Input
                      id="category-name"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder={t("products.enterCategoryName")}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>{t("products.selectCategoryColor")}</Label>
                    <div className="flex flex-wrap gap-3">
                      {categoryColors.map((color) => (
                        <button
                          key={color}
                          className={`w-10 h-10 rounded-full border-2 transition-all hover:scale-110 ${selectedColor === color
                            ? "border-foreground"
                            : "border-border"
                            }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setSelectedColor(color)}
                        />
                      ))}
                    </div>
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
                      onClick={handleCreateCategory}
                      disabled={createCategoryMutation.isPending}
                      className="flex-1"
                    >
                      {createCategoryMutation.isPending
                        ? t("common.loading")
                        : t("products.create")}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>

      {error && (
        <div className="text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}