export type Product = {
  id: string
  name: string
  price: number
  likes: number
  imageUrl: string
}

let db: Product[] = [
  {
    id: '1',
    name: 'MacBook Pro',
    price: 1999,
    likes: 12,
    imageUrl: 'https://picsum.photos/seed/mac/300/180',
  },
]

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export const productApi = {
  async list(): Promise<Product[]> {
    await sleep(100)
    return [...db]
  },

  async getById(id: string): Promise<Product | null> {
    await sleep(80)
    return db.find((p) => p.id === id) ?? null
  },

  async create(input: Omit<Product, 'id' | 'likes'>) {
    await sleep(100)
    const created: Product = {
      id: crypto.randomUUID(),
      likes: 0,
      ...input,
    }
    db = [created, ...db]
    return created
  },

  async update(id: string, patch: Partial<Omit<Product, 'id'>>) {
    await sleep(100)
    const idx = db.findIndex((p) => p.id === id)
    if (idx === -1) throw new Error('Not found')
    db[idx] = { ...db[idx], ...patch }
    return db[idx]
  },

  async remove(id: string) {
    await sleep(100)
    db = db.filter((p) => p.id !== id)
  },
}
