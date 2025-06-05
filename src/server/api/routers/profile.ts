import { auth } from "@clerk/nextjs/server";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { z } from "zod";
import { db } from "@/server/db";
import { collectionsTable, objectTable, userTable } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export async function isSignedIn() {
  const { sessionClaims } = await auth();
  if (!sessionClaims) return null;
  return sessionClaims.id;
}

export const profileRouter = createTRPCRouter({
  getProfile: publicProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const objectsUploaded = await db
        .select()
        .from(objectTable)
        .where(eq(objectTable.userId, input.userId));

      const collectionNumber = await db
        .selectDistinct()
        .from(collectionsTable)
        .where(eq(collectionsTable.userId, input.userId));

      const favouriteNumber = await db
        .select()
        .from(collectionsTable)
        .where(
          and(
            eq(collectionsTable.userId, input.userId),
            eq(collectionsTable.tagId, "tag-5"),
          ),
        );

      return {
        objectsUploaded: {
          name: "Objects Uploaded",
          value: objectsUploaded.length,
        },
        collectionNumber: {
          name: "Collections",
          value: collectionNumber.length,
        },
        favouriteNumber: {
          name: "Favourite",
          value: favouriteNumber.length,
        },
      };
    }),
  updateCredentials: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        username: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const userId = await isSignedIn();
      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be signed in to use this route.",
        });
      }
      try {
        const parsedUserId = z.string().parse(userId);

        await db
          .update(userTable)
          .set({
            username: input.username,
          })
          .where(eq(userTable.id, parsedUserId));

        return true;
      } catch {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Failed to update credentials.",
        });
      }
    }),
});
