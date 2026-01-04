import * as React from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProductForm } from "@/data/products/product.schema";

type FormErrors = Partial<Record<keyof ProductForm, string>>;

type ProductDrawerProps = {
  open: boolean;
  mode: "create" | "edit";
  form: ProductForm;
  formErrors: FormErrors;

  onOpenChange: (open: boolean) => void;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
  setForm: React.Dispatch<React.SetStateAction<ProductForm>>;

  isSubmitting?: boolean;
};

export function ProductDrawer({
  open,
  mode,
  form,
  formErrors,
  onOpenChange,
  onCancel,
  onSubmit,
  setForm,
  isSubmitting = false,
}: ProductDrawerProps) {
  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      direction="right"
      shouldScaleBackground={false}
    >
      <DrawerContent
        className="
          fixed right-0 top-0 bottom-0
          w-[450px] sm:w-[540px]
          rounded-none
          border-l
          bg-white dark:bg-gray-800
        "
      >
        <DrawerHeader className="flex !flex-row items-center justify-between !space-y-0">
          <DrawerTitle className="text-xl">
            {mode === "create" ? "Create Product" : "Edit Product"}
          </DrawerTitle>

          <DrawerClose asChild>
            <button
              type="button"
              aria-label="Close"
              className="text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </DrawerClose>
        </DrawerHeader>

        <form onSubmit={onSubmit} className="px-4 pb-6 space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Product name"
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
            />
            {formErrors.name && (
              <p className="text-sm text-red-600">{formErrors.name}</p>
            )}
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              type="number"
              placeholder="0"
              value={form.price}
              onChange={(e) =>
                setForm((s) => ({ ...s, price: e.target.value as any }))
              }
            />
            {formErrors.price && (
              <p className="text-sm text-red-600">{formErrors.price}</p>
            )}
          </div>

          {/* Image URL */}
          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input
              id="imageUrl"
              placeholder="https://..."
              value={form.imageUrl}
              onChange={(e) =>
                setForm((s) => ({ ...s, imageUrl: e.target.value }))
              }
            />
            {formErrors.imageUrl && (
              <p className="text-sm text-red-600">{formErrors.imageUrl}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>

            <Button type="submit" disabled={isSubmitting}>
              {mode === "create"
                ? isSubmitting
                  ? "Creating..."
                  : "Create"
                : isSubmitting
                ? "Saving..."
                : "Save"}
            </Button>
          </div>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
