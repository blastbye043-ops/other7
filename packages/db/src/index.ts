import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.warn(
    "[db] DATABASE_URL is not set — database features (download history, analytics) are disabled. " +
    "Downloading will work normally without a database.",
  );
}

export const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null;

// db is null when DATABASE_URL is not configured.
// All callers must guard with `if (!db)` before use.
export const db = pool ? drizzle(pool, { schema }) : null;

export * from "./schema";
