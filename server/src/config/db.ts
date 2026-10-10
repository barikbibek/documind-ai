import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { env } from './env'
import * as schema from '../db/schema'

const pool = new Pool({ connectionString: env.DATABASE_URL, connectionTimeoutMillis: 5000, idleTimeoutMillis: 30000, max: 10 })

export const db = drizzle(pool, { schema })
