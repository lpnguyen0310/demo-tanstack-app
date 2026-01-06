import { db } from '@/lib/database'
import { products } from '../../drizzle/schema'
import { eq, inArray} from 'drizzle-orm'
import crypto from 'crypto'

export type Product = {
  id: string
  name: string
  price: number
  likes: number
  imageUrl: string
}

export const productApi = {

  // list all products
  async list(): Promise<Product[]> {
    return db.select().from(products)
  },

  // get a product by id
  async getById(id: string): Promise<Product | null> {
    const rows = await db
      .select()
      .from(products)
      .where(eq(products.id, id))

    return rows[0] ?? null
  },

  // create a new product
  async create(input: Omit<Product, 'id' | 'likes'>) {
    const created: Product = {
      id: crypto.randomUUID(),
      likes: 0,
      ...input,
    }

    await db.insert(products).values(created)
    return created
  },  

  // update a product by id
  async update(id: string, patch: Partial<Omit<Product, 'id'>>) {
    const [updated] = await db
      .update(products)
      .set(patch)
      .where(eq(products.id, id))
      .returning()

    if (!updated) throw new Error('Not found')
    return updated
  },
  // delete a product by id
  async remove(id: string) {
    await db.delete(products).where(eq(products.id, id))
  },
  // delete select multiple products by ids
  async removeMany(ids: string[]) {
    await db.delete(products).where(inArray(products.id, ids))
  }
}
