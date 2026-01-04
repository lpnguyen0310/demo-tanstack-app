import { z } from 'zod'

// Define and validate server environment variables
const envSchema = z.object({
  DATABASE_URL: z.string().min(1), 
//  JWT_SECRET: z.string().min(32),
  DB_MAX_CONNECTIONS: z.coerce.number().int().positive().default(10),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})
// Define and validate client environment variables
// const clientEnvSchema = z.object({
//   VITE_APP_NAME: z.string(),
//   VITE_API_URL: z.string().url(),
//   VITE_AUTH0_DOMAIN: z.string(),
//   VITE_AUTH0_CLIENT_ID: z.string(),
// })

export const serverEnv = envSchema.parse(process.env)
// export const clientEnv = clientEnvSchema.parse(import.meta.env)
