export type Item = {
  id: string
  name: string
  description: string
  price: number
  imageUrl: string
  likes: number
}

export const ITEMS: Item[] = [
  {
    id: '1',
    name: 'Item 1',
    description: 'This is item 1',
    price: 19.99,
    imageUrl: 'https://placehold.co/640x360?text=Item%201',
    likes: 12,
  },
  {
    id: '2',
    name: 'Item 2',
    description: 'This is item 2',
    price: 49.0,
    imageUrl: 'https://placehold.co/640x360?text=Item%202',
    likes: 87,
  },
  {
    id: '3',
    name: 'Item 3',
    description: 'This is item 3',
    price: 9.5,
    imageUrl: 'https://placehold.co/640x360?text=Item%203',
    likes: 5,
  },
]

export async function getItems() {
  await new Promise((r) => setTimeout(r, 200))
  return ITEMS
}

export async function getItemById(id: string) {
  await new Promise((r) => setTimeout(r, 200))
  const item = ITEMS.find((x) => x.id === id)
  if (!item) throw new Error('Item not found')
  return item
}
