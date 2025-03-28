import { type Config } from "drizzle-kit";

import { env } from "@/env";

export default {
  schema: "src/server/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    user: env.POSTGRES_USER,
    password: env.POSTGRES_PASSWORD,
    host: env.DATABASE_HOST,
    port: env.DATABASE_PORT,
    database: env.POSTGRES_DB,
    ssl: false,
  },
  out: "drizzle",
} satisfies Config;
