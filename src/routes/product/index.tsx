import { createFileRoute, Link } from '@tanstack/react-router'
import { z } from 'zod'
import * as React from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table'
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from '../../data/products.queries'
import type { Product } from '../../api/product.api'

const productSearchSchema = z.object({ q: z.string().optional() })

export const Route = createFileRoute('/product/')({
  validateSearch: productSearchSchema,
  component: ProductList,
})

const columnHelper = createColumnHelper<Product>()

function ProductList() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  const { data: products = [], isLoading } = useProducts()
  const createMut = useCreateProduct()
  const updateMut = useUpdateProduct()
  const deleteMut = useDeleteProduct()

  const q = (search.q ?? '').toLowerCase().trim()
  const filtered = q ? products.filter((p) => p.name.toLowerCase().includes(q)) : products

  const [form, setForm] = React.useState({ name: '', price: 0, imageUrl: '' })
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [edit, setEdit] = React.useState({ name: '', price: 0, imageUrl: '' })

  const columns = React.useMemo<ColumnDef<Product, unknown>[]>(() => {
    return [
      columnHelper.display({
        id: 'image',
        header: 'Image',
        cell: ({ row }) => {
          const p = row.original
          const isEditing = editingId === p.id
          return (
            <img
              src={isEditing ? edit.imageUrl || p.imageUrl : p.imageUrl}
              alt={p.name}
              width={72}
              height={40}
              loading="lazy"
              style={{ objectFit: 'cover', borderRadius: 4 }}
            />
          )
        },
      }),
      columnHelper.accessor('name', {
        header: 'Name',
        cell: ({ row, getValue }) => {
          const p = row.original
          const isEditing = editingId === p.id

          if (isEditing) {
            return (
              <input
                value={edit.name}
                onChange={(e) => setEdit((s) => ({ ...s, name: e.target.value }))}
              />
            )
          }

          return (
            <Link to="/product/$id" params={{ id: p.id }}>
              {getValue()}
            </Link>
          )
        },
      }),
      columnHelper.accessor('price', {
        header: 'Price',
        cell: ({ row, getValue }) => {
          const p = row.original
          const isEditing = editingId === p.id

          if (isEditing) {
            return (
              <input
                type="number"
                value={edit.price}
                onChange={(e) => setEdit((s) => ({ ...s, price: Number(e.target.value) }))}
                style={{ width: 120 }}
              />
            )
          }

          const value = getValue()
          return `$${value.toFixed(2)}`
        },
      }),
      columnHelper.accessor('likes', {
        header: 'Likes',
        cell: ({ getValue }) => getValue(),
      }),
      columnHelper.accessor('imageUrl', {
        header: 'Image URL',
        cell: ({ row, getValue }) => {
          const p = row.original
          const isEditing = editingId === p.id

          if (isEditing) {
            return (
              <input
                value={edit.imageUrl}
                onChange={(e) => setEdit((s) => ({ ...s, imageUrl: e.target.value }))}
                style={{ minWidth: 260 }}
              />
            )
          }

          const url = getValue()
          return (
            <a href={url} target="_blank" rel="noreferrer">
              {url}
            </a>
          )
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const p = row.original
          const isEditing = editingId === p.id

          if (!isEditing) {
            return (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(p.id)
                    setEdit({ name: p.name, price: p.price, imageUrl: p.imageUrl })
                  }}
                >
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!window.confirm('Delete this product?')) return
                    deleteMut.mutate(p.id)
                  }}
                  disabled={deleteMut.isPending}
                >
                  Delete
                </button>
              </div>
            )
          }

          return (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  updateMut.mutate({
                    id: p.id,
                    patch: {
                      name: edit.name.trim() || 'Untitled',
                      price: Number(edit.price) || 0,
                      imageUrl: edit.imageUrl.trim() || p.imageUrl,
                    },
                  })
                  setEditingId(null)
                }}
                disabled={updateMut.isPending}
              >
                Save
              </button>

              <button type="button" onClick={() => setEditingId(null)}>
                Cancel
              </button>
            </div>
          )
        },
      }),
    ]
  }, [deleteMut, edit.imageUrl, edit.name, edit.price, editingId, updateMut])

  const table = useReactTable({
    data: filtered,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  if (isLoading) return <div style={{ padding: 16 }}>Loading...</div>

  return (
    <div style={{ padding: 16 }}>
      <h1>Product List</h1>

      <input
        placeholder="Search by name... (q)"
        value={search.q ?? ''}
        onChange={(e) =>
          navigate({
            search: (prev) => ({ ...prev, q: e.target.value }),
            replace: true,
          })
        }
      />

      <form
        onSubmit={(e) => {
          e.preventDefault()
          const name = form.name.trim()
          if (!name) return
          createMut.mutate({
            name,
            price: Number(form.price) || 0,
            imageUrl: form.imageUrl.trim() || 'https://picsum.photos/seed/new/300/180',
          })
          setForm({ name: '', price: 0, imageUrl: '' })
        }}
        style={{ marginTop: 12, marginBottom: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}
      >
        <input
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
        />
        <input
          type="number"
          placeholder="Price"
          value={form.price}
          onChange={(e) => setForm((s) => ({ ...s, price: Number(e.target.value) }))}
          style={{ width: 120 }}
        />
        <input
          placeholder="Image URL"
          value={form.imageUrl}
          onChange={(e) => setForm((s) => ({ ...s, imageUrl: e.target.value }))}
          style={{ minWidth: 260 }}
        />
        <button type="submit" disabled={createMut.isPending}>
          {createMut.isPending ? 'Adding...' : 'Add'}
        </button>
      </form>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid' }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} style={{ padding: 8, borderBottom: '1px solid' }}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && <p>No products found.</p>}
    </div>
  )
}
