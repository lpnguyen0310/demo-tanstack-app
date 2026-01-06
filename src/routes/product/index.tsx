import * as React from "react";
import { z } from "zod";
import { createFileRoute } from "@tanstack/react-router";
import {
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import {
  productKeys,
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useDeleteManyProducts,
} from "@/data/products.queries";

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

const DEFAULT_IMAGE_URL = "https://picsum.photos/seed/new/300/180";
const INITIAL_PAGINATION = { pageIndex: 0, pageSize: 10 };
const productSearchSchema = z
  .object({
    q: z.string().optional(),
  })
  .catch({ q: undefined });

export const Route = createFileRoute("/product/")({
  validateSearch: productSearchSchema,
  loaderDeps: ({ search }) => ({ q: (search.q ?? "").trim() }),
  loader: async ({ context, deps }) => {
    await context.queryClient.ensureQueryData({
      queryKey: productKeys.list(
        deps.q,
        INITIAL_PAGINATION.pageIndex,
        INITIAL_PAGINATION.pageSize
      ),
      queryFn: () =>
        listProducts({
          data: {
            q: deps.q || undefined,
            pageIndex: INITIAL_PAGINATION.pageIndex,
            pageSize: INITIAL_PAGINATION.pageSize,
          },
        }),
    });
  },
  component: ProductList,
});

type FormErrors = Partial<Record<keyof ProductForm, string>>;

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = React.useState<T>(value);

  React.useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(t);
  }, [value, delayMs]);

  return debounced;
}

function ProductList() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const qc = useQueryClient();

  const urlQ = (search.q ?? "").trim();

  // Local input (for smooth typing) + debounced push to URL
  const [searchText, setSearchText] = React.useState(search.q ?? "");
  const debouncedSearchText = useDebouncedValue(searchText, 300);
  const [pagination, setPagination] = React.useState(INITIAL_PAGINATION);
  // Sync local input when user navigates via back/forward or external link
  React.useEffect(() => {
    setSearchText(search.q ?? "");
  }, [search.q]);

  // Push debounced input -> URL
  React.useEffect(() => {
    const nextQ = (debouncedSearchText ?? "").trim();
    if (nextQ === urlQ) return;

    navigate({
      search: (prev) => ({
        ...prev,
        q: nextQ ? nextQ : undefined,
      }),
      replace: true,
    });
  }, [debouncedSearchText, navigate, urlQ]);

  // Data

  // Mutations
  const createMut = useCreateProduct();
  const updateMut = useUpdateProduct();
  const deleteMut = useDeleteProduct();
  const deleteManyMut = useDeleteManyProducts();

  // Pagination
  const { data, isLoading, isError, error } = useProducts(
    urlQ,
    pagination.pageIndex,
    pagination.pageSize
  );

  const products = data?.items ?? [];
  const total = data?.total ?? 0;

  const pageCount = Math.max(1, Math.ceil(total / pagination.pageSize));

  const prefetchPage = React.useCallback(
    (pageIndex: number) => {
      if (pageIndex < 0 || pageIndex >= pageCount) return;

      return qc.prefetchQuery({
        queryKey: productKeys.list(urlQ, pageIndex, pagination.pageSize),
        queryFn: () =>
          listProducts({
            data: {
              q: urlQ || undefined,
              pageIndex,
              pageSize: pagination.pageSize,
            },
          }),
        staleTime: 30_000,
      });
    },
    [pageCount, pagination.pageSize, qc, urlQ]
  );
  // Drawer
  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState<"create" | "edit">("create");
  const [editing, setEditing] = React.useState<Product | null>(null);
  const [form, setForm] = React.useState<ProductForm>(EMPTY_FORM);
  const [formErrors, setFormErrors] = React.useState<FormErrors>({});

  // Selection
  const [rowSelection, setRowSelection] = React.useState<
    Record<string, boolean>
  >({});

  // Confirm bulk delete
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const openCreate = React.useCallback(() => {
    setMode("create");
    setEditing(null);
    setFormErrors({});
    setForm({
      name: "",
      price: 0,
      imageUrl: DEFAULT_IMAGE_URL,
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

  const closeDrawer = React.useCallback(() => {
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
            imageUrl: values.imageUrl || DEFAULT_IMAGE_URL,
          },
          {
            onSuccess: () => {
              toast.success("Created product successfully", {
                description: `Product "${values.name}" has been created.`,
              });
              closeDrawer();
              setForm(EMPTY_FORM);
              setFormErrors({});
            },
            onError: () => {
              toast.error("Failed to create product");
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
            toast.success("Updated product successfully", {
              description: `Product "${values.name}" has been updated.`,
            });
            closeDrawer();
            setEditing(null);
            setForm(EMPTY_FORM);
            setFormErrors({});
          },
          onError: () => {
            toast.error("Failed to update product");
          },
        }
      );
    },
    [closeDrawer, createMut, editing, form, mode, updateMut]
  );

  // Reset paging + selection when query changes
  React.useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }));
    setRowSelection({});
    setConfirmOpen(false);
  }, [urlQ]);

  const handleDeleteOne = React.useCallback(
    (id: string) => {
      const found = products.find((p) => p.id === id);
      deleteMut.mutate(
        { id },
        {
          onSuccess: () => {
            toast.success("Deleted product successfully", {
              description: found
                ? `Product "${found.name}" has been deleted.`
                : undefined,
            });
          },
          onError: () => {
            toast.error("Failed to delete product");
          },
        }
      );
    },
    [deleteMut, products]
  );

  const columns = useProductColumns({
    onEdit: openEdit,
    onDelete: handleDeleteOne,
    deletePending: deleteMut.isPending,
  });

  const table = useReactTable({
    data: products,
    columns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount,
    onPaginationChange: setPagination,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    state: { pagination, rowSelection },
  });


  const selectedIds = React.useMemo(() => {
    return table.getSelectedRowModel().rows.map((r) => r.original.id);
  }, [rowSelection]);

  const handleConfirmDelete = React.useCallback(() => {
    if (selectedIds.length === 0) return;

    deleteManyMut.mutate(
      { ids: selectedIds },
      {
        onSuccess: () => {
          toast.success("Deleted products successfully", {
            description: `Deleted ${selectedIds.length} product(s).`,
          });
          table.resetRowSelection();
          setConfirmOpen(false);
        },
        onError: () => {
          toast.error("Failed to delete selected products");
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
      <div className="p-4 text-red-600">
        Failed to load products: {(error as Error).message}
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h1 className="mr-2 text-xl font-semibold">Product List</h1>

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

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search by name... (q)"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
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
          Page {pagination.pageIndex + 1} / {pageCount} • Total {total}{" "}
          {products.length}
        </p>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => table.previousPage()}
            onMouseEnter={() => prefetchPage(pagination.pageIndex - 1)}
            onFocus={() => prefetchPage(pagination.pageIndex - 1)}
            disabled={!table.getCanPreviousPage()}
          >
            Prev
          </Button>
          <Button
            variant="outline"
            onClick={() => table.nextPage()}
            onMouseEnter={() => prefetchPage(pagination.pageIndex + 1)}
            onFocus={() => prefetchPage(pagination.pageIndex + 1)}
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
