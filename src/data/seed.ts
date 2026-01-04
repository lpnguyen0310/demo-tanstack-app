import { db } from '@/lib/database'
import { products } from '../../drizzle/schema'

await db.insert(products).values([
  {
    id: crypto.randomUUID(),
    name: 'MacBook Pro',
    price: 1999,
    likes: 12,
    imageUrl: 'https://picsum.photos/seed/mac/300/180',
  },
])
console.log('seeded')
process.exit(0)
