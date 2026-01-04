import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import type { Product } from "../api/product.api";
import {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "@/api/product.fn";

export const productKeys = {
  all: ["products"] as const,
  list: () => [...productKeys.all, "list"] as const,
  detail: (id: string) => [...productKeys.all, "detail", id] as const,
};

export function useProducts() {
  const fn = useServerFn(listProducts);
  return useQuery({
    queryKey: productKeys.list(),
    queryFn: () => fn(),
    staleTime: 30_000,
  });
}

export function useProduct(id: string) {
  const fn = useServerFn(getProductById);
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: async () => {
      const p = await fn({ data: { id } });
      if (!p) throw new Error("Product not found");
      return p;
    },
    enabled: Boolean(id),
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  const fn = useServerFn(createProduct);
  return useMutation({
    mutationFn: (input: Omit<Product, "id" | "likes">) => fn({ data: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.all }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  const fn = useServerFn(updateProduct);
  return useMutation({
    mutationFn: (input: { id: string; patch: Partial<Omit<Product, "id">> }) =>
      fn({ data: input }),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: productKeys.list() });
      qc.invalidateQueries({ queryKey: productKeys.detail(v.id) });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  const fn = useServerFn(deleteProduct);
  return useMutation({
    mutationFn: (input: { id: string }) => fn({ data: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.all }),
  });
}
