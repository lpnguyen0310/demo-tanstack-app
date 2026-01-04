import { db } from '@/lib/database'
import { products } from '../../drizzle/schema'
import { eq } from 'drizzle-orm'
import crypto from 'crypto'

export type Product = {
  id: string
  name: string
  price: number
  likes: number
  imageUrl: string
}

export const productApi = {
  async list(): Promise<Product[]> {
    return db.select().from(products)
  },

  async getById(id: string): Promise<Product | null> {
    const rows = await db
      .select()
      .from(products)
      .where(eq(products.id, id))

    return rows[0] ?? null
  },

  async create(input: Omit<Product, 'id' | 'likes'>) {
    const created: Product = {
      id: crypto.randomUUID(),
      likes: 0,
      ...input,
    }

    await db.insert(products).values(created)
    return created
  },

  async update(id: string, patch: Partial<Omit<Product, 'id'>>) {
    const [updated] = await db
      .update(products)
      .set(patch)
      .where(eq(products.id, id))
      .returning()

    if (!updated) throw new Error('Not found')
    return updated
  },

  async remove(id: string) {
    await db.delete(products).where(eq(products.id, id))
  },
}
