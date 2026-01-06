import { db } from '@/lib/database'
import { products } from '../../drizzle/schema'
import { eq, ilike, inArray, sql, asc } from 'drizzle-orm'
import crypto from 'crypto'

export type Product = {
  id: string
  name: string
  price: number
  likes: number
  imageUrl: string
}

export const productApi = {

  // list all products pagination can be added later
  async list(q?: string): Promise<Product[]> {
    const qq = q?.trim()
    if (!qq) return db.select().from(products)

    return db
      .select()
      .from(products)
      .where(ilike(products.name, `%${qq}%`))
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
  },
  // list all products with pagination
 
async listPaginated(args: {
  q?: string
  pageIndex: number
  pageSize: number
}): Promise<{ items: Product[]; total: number }> {
  const { q, pageIndex, pageSize } = args
  const qq = q?.trim()
  const where = qq ? ilike(products.name, `%${qq}%`) : undefined

  const countQuery = db.select({ count: sql<number>`count(*)` }).from(products)
  if (where) countQuery.where(where)
  const [{ count }] = await countQuery
  const total = Number(count)

  const itemsQuery = db.select().from(products)
  if (where) itemsQuery.where(where)
  const items = await itemsQuery
    .orderBy(asc(products.name))
    .limit(pageSize)
    .offset(pageIndex * pageSize)

  return { items, total }
}
}
