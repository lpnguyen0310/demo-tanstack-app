import * as React from "react";
import { z } from "zod";

import { createFileRoute } from "@tanstack/react-router";
import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  productKeys,
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useDeleteManyProducts,
} from "@/data/products.queries";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

import { queryClient } from "@/lib/queryClient";
import { listProducts } from "@/api/product.fn";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MutationError } from "@/components/common/MutationError";

import {
  productFormSchema,
  EMPTY_FORM,
  type ProductForm,
} from "@/data/products/product.schema";

import { ProductDrawer } from "@/components/product/ProductDrawer";
import { ProductTable } from "@/components/product/ProductTable";
import { useProductColumns } from "@/components/product/ProductTableColumns";
import type { Product } from "@/api/product.api";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
const productSearchSchema = z.object({
  q: z.string().catch(""),
});
export const Route = createFileRoute("/product/")({
  validateSearch: productSearchSchema,
  loaderDeps: () => [{}],
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
  // data mutations
  const { data: products = [], isLoading, isError, error } = useProducts();
  const createMut = useCreateProduct();
  const updateMut = useUpdateProduct();
  const deleteMut = useDeleteProduct();
  const deleteManyMut = useDeleteManyProducts();
  // pagination state
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  // drawer state
  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState<"create" | "edit">("create");
  const [editing, setEditing] = React.useState<Product | null>(null);
  const [form, setForm] = React.useState<ProductForm>(EMPTY_FORM);
  const [formErrors, setFormErrors] = React.useState<FormErrors>({});
  // selection
  const [rowSelection, setRowSelection] = React.useState({});

  // comfirm dialog handlers
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  // drawer handlers
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
  // edit handler
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
  // close handler
  const closeDrawer = React.useCallback(() => {
    setOpen(false);
  }, []);
  // submit handler
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
              closeDrawer();
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
            closeDrawer();
            setEditing(null);
            setForm(EMPTY_FORM);
            setFormErrors({});
          },
        }
      );
    },
    [closeDrawer, createMut, editing, form, mode, updateMut]
  );

  const q = (search.q ?? "").toLowerCase().trim();
  const filtered = q
    ? products.filter((p) => p.name.toLowerCase().includes(q))
    : products;

  React.useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, [q]);

  const columns = useProductColumns({
    onEdit: openEdit,
    onDelete: (id) => deleteMut.mutate({ id }),
    deletePending: deleteMut.isPending,
  });

  const table = useReactTable({
    data: filtered,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    state: { pagination, rowSelection },
  });

  const pageCount = table.getPageCount();
  // delected ids
  const selectedIds = React.useMemo(
    () => table.getSelectedRowModel().rows.map((r) => r.original.id),
    [rowSelection, table]
  );

  const handleConfirmDelete = React.useCallback(() => {
    if (selectedIds.length === 0) return;

    deleteManyMut.mutate(
      { ids: selectedIds },
      {
        onSuccess: () => {
          table.resetRowSelection();
          setConfirmOpen(false);
        },
      }
    );
  }, [deleteManyMut, selectedIds, table]);
  if (isLoading) {
    return (
      <div className="p-4">
        <div className="rounded-md border">
          <div className="flex h-56 items-center justify-center">
            <span className="text-sm text-muted-foreground">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

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
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          variant="destructive"
          title="Confirm deletion"
          description={
            <>
              You are about to permanently delete{" "}
              <strong>{selectedIds.length}</strong> product(s). This action
              cannot be undone.
            </>
          }
          trigger={
            <Button variant="destructive" disabled={selectedIds.length === 0}>
              Delete Selected ({selectedIds.length})
            </Button>
          }
          confirmText={
            deleteManyMut.isPending ? "Deleting..." : "Confirm delete"
          }
          cancelDisabled={deleteManyMut.isPending}
          confirmDisabled={deleteManyMut.isPending}
          onConfirm={handleConfirmDelete}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
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

        <select
          className="h-10 rounded-md border bg-background px-3 text-sm"
          value={pagination.pageSize}
          onChange={(e) =>
            setPagination({
              pageIndex: 0,
              pageSize: Number(e.target.value),
            })
          }
        >
          <option value={10}>10 / page</option>
          <option value={20}>20 / page</option>
          <option value={50}>50 / page</option>
        </select>
      </div>

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

      <MutationError
        show={deleteManyMut.isError}
        message="Failed to delete selected products"
      />
      <ProductTable table={table} />

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Page {pagination.pageIndex + 1} / {pageCount} • Total{" "}
          {filtered.length}
        </p>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Prev
          </Button>
          <Button
            variant="outline"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>

      <ProductDrawer
        open={open}
        mode={mode}
        form={form}
        setForm={setForm}
        formErrors={formErrors}
        onSubmit={onSubmit}
        onCancel={closeDrawer}
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
