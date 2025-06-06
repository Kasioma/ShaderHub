import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@/env";
import * as schema from "./schema";

/**
 * Cache the database connection in development. This avoids creating a new connection on every HMR
 * update.
 */
const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
};

const conn =
  globalForDb.conn ??
  postgres({
    user: env.POSTGRES_USER,
    password: env.POSTGRES_PASSWORD,
    host: env.DATABASE_HOST,
    port: env.DATABASE_PORT,
    db: env.POSTGRES_DB,
  });
if (env.NODE_ENV !== "production") globalForDb.conn = conn;

export const db = drizzle(conn, { schema, logger: true });
