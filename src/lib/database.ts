import {drizzle} from "drizzle-orm/node-postgres"
import {Pool} from "pg"
import * as schema from "../../drizzle/schema"
import {serverEnv} from "../config/env"

const pool = new Pool({
    connectionString: serverEnv.DATABASE_URL,
    max: serverEnv.DB_MAX_CONNECTIONS,
    ssl: serverEnv.NODE_ENV === "production" ? {rejectUnauthorized: false} : false,
})
export const db = drizzle(pool, {schema})