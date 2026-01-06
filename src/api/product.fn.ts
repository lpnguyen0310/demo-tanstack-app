import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { productApi } from "./product.api";

// LIST
export const listProducts = createServerFn().handler(() => productApi.list());

// GET BY ID
export const getProductById = createServerFn()
  .inputValidator(z.object({ id: z.string().min(1) }))
  .handler(({ data }) => productApi.getById(data.id));

const productSchemaCreate = z.object({
  name: z.string().min(1),
  price: z.number(),
  imageUrl: z.string().url(),
});

// CREATE
export const createProduct = createServerFn({ method: "POST" })
  .inputValidator(productSchemaCreate)
  .handler(({ data }) => productApi.create(data));

const productSchemaUpdate = z.object({
  id: z.string().min(1),
  patch: z.object({
    name: z.string().min(1).optional(),
    price: z.number().optional(),
    likes: z.number().optional(),
    imageUrl: z.string().url().optional(),
  }),
});

// UPDATE
export const updateProduct = createServerFn({ method: "POST" })
  .inputValidator(productSchemaUpdate)
  .handler(({ data }) => productApi.update(data.id, data.patch));

// DELETE
export const deleteProduct = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().min(1) }))
  .handler(({ data }) => productApi.remove(data.id));

// DELETE MANY
export const deleteManyProducts = createServerFn({ method: "POST" })
  .inputValidator(z.object({ ids: z.array(z.string().min(1)) }))
  .handler(({ data }) => productApi.removeMany(data.ids));