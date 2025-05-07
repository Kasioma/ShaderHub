import { createTRPCRouter, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { objectTable } from "@/server/db/schema";
import { db } from "@/server/db";
import { eq, desc } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

export async function isSignedIn() {
  const { sessionClaims } = await auth();
  if (!sessionClaims) return null;
  return sessionClaims.id;
}

export const mainRouter = createTRPCRouter({
  queryInitialObjects: publicProcedure.query(async () => {
    try {
      const objects = await db
        .select({
          id: objectTable.id,
          name: objectTable.name,
          userId: objectTable.userId,
        })
        .from(objectTable)
        .where(eq(objectTable.visibility, "public"))
        .orderBy(desc(objectTable.createdAt))
        .limit(20);
      if (!objects)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Query failed.",
        });
      return objects;
    } catch {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Query failed.",
      });
    }
  }),
});
