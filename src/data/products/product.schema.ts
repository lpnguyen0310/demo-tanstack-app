import { z } from 'zod'

export const productFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  price: z.coerce.number().min(1, 'Price must be >0'),
  imageUrl: z
    .string()
    .trim()
    .url('Invalid image URL')
    .or(z.literal('')),
})

export type ProductForm = z.infer<typeof productFormSchema>

export const EMPTY_FORM: ProductForm = {
  name: '',
  price: 0,
  imageUrl: '',
}
