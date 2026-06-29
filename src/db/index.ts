import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is missing");
}

export const db = drizzle(process.env.DATABASE_URL, { schema } as any);
export type Db = typeof db;
export * from "./schema";
