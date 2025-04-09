import { auth } from "@clerk/nextjs/server";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { db } from "@/server/db";
import { tagTable } from "@/server/db/schema";

async function isSignedIn() {
  const { sessionClaims } = await auth();
  if (!sessionClaims) return false;
  return true;
}

export const uploadRouter = createTRPCRouter({
  queryTagsAndAttributes: publicProcedure.query(async () => {
    if (!(await isSignedIn())) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be signed in to use this route.",
      });
    }
    try {
      const tags = await db.select().from(tagTable);
      if (!tags)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Query failed.",
        });

      return tags;
    } catch {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Fetch could not be performed.",
      });
    }
  }),
});
