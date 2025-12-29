import { createFileRoute } from '@tanstack/react-router'
import { useProduct } from '../../data/products.queries'

export const Route = createFileRoute('/product/$id')({
  component: ProductDetail,
})

function ProductDetail() {
  const { id } = Route.useParams()
  const { data: product, isLoading, error } = useProduct(id)

  if (isLoading) return <div style={{ padding: 16 }}>Loading...</div>
  if (error || !product) return <div style={{ padding: 16 }}>Product not found.</div>

  return (
    <div>
      <h1>Product Detail</h1>
      <img
        src={product.imageUrl}
        alt={product.name}
        width={640}
        height={360}
        loading="lazy"
        style={{ maxWidth: '100%', height: 'auto', borderRadius: 8, marginBottom: 12 }}
      />
      <p><b>ID:</b> {product.id}</p>
      <p><b>Name:</b> {product.name}</p>
      <p><b>Price:</b> ${product.price.toFixed(2)}</p>
      <p><b>Likes:</b> {product.likes}</p>
    </div>
  )
}
