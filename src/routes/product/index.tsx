import * as React from "react";
import { z } from "zod";

import { createFileRoute } from "@tanstack/react-router";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";

import {
  productKeys,
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from "@/data/products.queries";

import { queryClient } from "@/lib/queryClient";
import { listProducts } from "@/api/product.fn";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MutationError } from "@/components/common/MutationError";
import {Spinner} from "@/components/ui/spinner";
import {
  productFormSchema,
  EMPTY_FORM,
  type ProductForm,
} from "@/data/products/product.schema";
import { ProductDrawer } from "@/components/product/ProductDrawer";
import { ProductTable } from "@/components/product/ProductTable";
import { useProductColumns } from "@/components/product/ProductTableColumns";
import type { Product } from "@/api/product.api";

const productSearchSchema = z.object({ q: z.string().optional() });

export const Route = createFileRoute("/product/")({
  validateSearch: productSearchSchema,
  loader: async () => {
    await queryClient.ensureQueryData({
      queryKey: productKeys.list(),
      queryFn: () => listProducts(),
    });
  },
  component: ProductList,
});

type FormErrors = Partial<Record<keyof ProductForm, string>>;

function ProductList() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const { data: products = [], isLoading, isError, error } = useProducts();
  const createMut = useCreateProduct();
  const updateMut = useUpdateProduct();
  const deleteMut = useDeleteProduct();

  // Sheet state
  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState<"create" | "edit">("create");
  const [editing, setEditing] = React.useState<Product | null>(null);
  const [form, setForm] = React.useState<ProductForm>(EMPTY_FORM);
  const [formErrors, setFormErrors] = React.useState<FormErrors>({});
  const [uiTableLoading, setUiTableLoading] = React.useState(false);
  React.useEffect(() => {
  const t = window.setTimeout(() => setUiTableLoading(false), 2000);
  return () => window.clearTimeout(t);
}, []);
  const openCreate = React.useCallback(() => {
    setMode("create");
    setEditing(null);
    setFormErrors({});
    setForm({
      name: "",
      price: 0,
      imageUrl: "https://picsum.photos/seed/new/300/180",
    });
    setOpen(true);
  }, []);

  const openEdit = React.useCallback((p: Product) => {
    setMode("edit");
    setEditing(p);
    setFormErrors({});
    setForm({
      name: p.name,
      price: p.price,
      imageUrl: p.imageUrl,
    });
    setOpen(true);
  }, []);

  const closeSheet = React.useCallback(() => {
    setOpen(false);
  }, []);

  const onSubmit = React.useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      setFormErrors({});
      const parsed = productFormSchema.safeParse(form);

      if (!parsed.success) {
        const fe = parsed.error.flatten().fieldErrors;
        setFormErrors({
          name: fe.name?.[0],
          price: fe.price?.[0],
          imageUrl: fe.imageUrl?.[0],
        });
        return;
      }

      const values = parsed.data;

      if (mode === "create") {
        createMut.mutate(
          {
            name: values.name,
            price: values.price || 0,
            imageUrl:
              values.imageUrl || "https://picsum.photos/seed/new/300/180",
          },
          {
            onSuccess: () => {
              closeSheet();
              setForm(EMPTY_FORM);
              setFormErrors({});
            },
          }
        );
        return;
      }

      if (!editing) return;
      updateMut.mutate(
        {
          id: editing.id,
          patch: {
            name: values.name,
            price: values.price || 0,
            imageUrl: values.imageUrl || editing.imageUrl,
          },
        },
        {
          onSuccess: () => {
            closeSheet();
            setEditing(null);
            setForm(EMPTY_FORM);
            setFormErrors({});
          },
        }
      );
    },
    [closeSheet, createMut, editing, form, mode, updateMut]
  );

  // search
  const q = (search.q ?? "").toLowerCase().trim();
  const filtered = q
    ? products.filter((p) => p.name.toLowerCase().includes(q))
    : products;

  // columns (tách file)
  const columns = useProductColumns({
    onEdit: openEdit,
    onDelete: (id) => deleteMut.mutate({ id }),
    deletePending: deleteMut.isPending,
  });

  const table = useReactTable({
    data: filtered,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  {uiTableLoading || isLoading ? (
    <div className="mt-4 rounded-md border">
      <div className="flex h-56 items-center justify-center">
        <Spinner className="h-10 w-10 text-muted-foreground" />
      </div>
    </div>
  ) : (
    <ProductTable table={table} />
  )}

  if (isError) {
    return (
      <div style={{ padding: 16, color: "red" }}>
        Failed to load products: {(error as Error).message}
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <h1 style={{ margin: 0 }}>Product List</h1>
        <Button
          type="button"
          onClick={openCreate}
          disabled={createMut.isPending}
        >
          Add Product
        </Button>
      </div>

      <Input
        placeholder="Search by name... (q)"
        value={search.q ?? ""}
        onChange={(e) =>
          navigate({
            search: (prev) => ({ ...prev, q: e.target.value }),
            replace: true,
          })
        }
        className="max-w-sm"
      />

      <MutationError
        show={createMut.isError}
        message="Failed to create product"
      />
      <MutationError
        show={updateMut.isError}
        message="Failed to update product"
      />
      <MutationError
        show={deleteMut.isError}
        message="Failed to delete product"
      />

      <ProductTable table={table} />

      {filtered.length === 0 && <p>No products found.</p>}

      <ProductDrawer
        open={open}
        mode={mode}
        form={form}
        setForm={setForm}
        formErrors={formErrors}
        onSubmit={onSubmit}
        onCancel={closeSheet}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) {
            setEditing(null);
            setForm(EMPTY_FORM);
            setFormErrors({});
          }
        }}
        isSubmitting={createMut.isPending || updateMut.isPending}
      />
    </div>
  );
}
