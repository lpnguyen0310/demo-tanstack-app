import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { productApi, type Product } from '../api/product.api'

export const productKeys = {
  all: ['products'] as const,
  list: () => [...productKeys.all, 'list'] as const,
  detail: (id: string) => [...productKeys.all, 'detail', id] as const,
}


export function useProducts() {
  return useQuery({
    queryKey: productKeys.list(),
    queryFn: productApi.list,
  })
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: async () => {
      const p = await productApi.getById(id)
      if (!p) throw new Error('Product not found')
      return p
    },
  })
}

export function useCreateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: Omit<Product, 'id' | 'likes'>) => productApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.all }),
  })
}

export function useUpdateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Omit<Product, 'id'>> }) =>
      productApi.update(id, patch),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: productKeys.list() })
      qc.invalidateQueries({ queryKey: productKeys.detail(v.id) })
    },
  })
}

export function useDeleteProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => productApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.all }),
  })
}
