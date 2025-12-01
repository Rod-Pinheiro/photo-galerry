import { Pool } from 'pg'

declare global {
  var __db: Pool | undefined
}

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined')
}

export const db = globalThis.__db ?? new Pool({
  connectionString,
})

if (process.env.NODE_ENV !== 'production') globalThis.__db = db