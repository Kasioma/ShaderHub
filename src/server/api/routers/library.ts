import { auth } from "@clerk/nextjs/server";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { db } from "@/server/db";
import { collectionsTable, objectTable, tagTable } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import type { FilePull } from "@/utilities/zod/parsers";

export async function isSignedIn() {
  const { sessionClaims } = await auth();
  if (!sessionClaims) return null;
  return sessionClaims.id;
}

export const libraryRouter = createTRPCRouter({
  getLibrary: publicProcedure.query(async () => {
    const userId = await isSignedIn();
    if (!userId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be signed in to use this route.",
      });
    }
    try {
      const parsedUserId = z.string().parse(userId);
      const collections = await db
        .select({
          tagId: collectionsTable.tagId,
          tagName: tagTable.name,
          objectId: collectionsTable.objectId,
          objectName: objectTable.name,
          userId: objectTable.userId,
          uploaderId: objectTable.userId,
        })
        .from(collectionsTable)
        .leftJoin(tagTable, eq(collectionsTable.tagId, tagTable.id))
        .leftJoin(objectTable, eq(collectionsTable.objectId, objectTable.id))
        .where(eq(collectionsTable.userId, parsedUserId));

      const groupedByTag = collections.reduce((acc, row) => {
        acc[row.tagId] ??= {
          tagName: row.tagName ?? "",
          objects: [],
        };
        acc[row.tagId]!.objects.push({
          objectId: row.objectId,
          objectName: row.objectName ?? "",
          userId: row.userId ?? "",
          uploaderId: row.userId ?? "",
        });
        return acc;
      }, {} as FilePull);

      return groupedByTag;
    } catch {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Fetch could not be performed.",
      });
    }
  }),
  getFavourite: publicProcedure
    .input(
      z.object({
        objectId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const userId = await isSignedIn();
      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be signed in to use this route.",
        });
      }
      try {
        const parsedUserId = z.string().parse(userId);
        const favourite = await db
          .select()
          .from(collectionsTable)
          .where(
            and(
              eq(collectionsTable.objectId, input.objectId),
              eq(collectionsTable.userId, parsedUserId),
              eq(collectionsTable.tagId, "tag-5"),
            ),
          );

        if (favourite.length > 0) return true;
        return false;
      } catch {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Fetch could not be performed.",
        });
      }
    }),
  deleteObject: publicProcedure
    .input(
      z.object({
        objectId: z.string(),
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
          .delete(objectTable)
          .where(
            and(
              eq(objectTable.id, input.objectId),
              eq(objectTable.userId, parsedUserId),
            ),
          );
        return true;
      } catch {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Delete could not be performed.",
        });
      }
    }),
});
