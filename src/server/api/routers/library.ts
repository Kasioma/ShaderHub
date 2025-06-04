import { auth, currentUser } from "@clerk/nextjs/server";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { db } from "@/server/db";
import {
  collectionsTable,
  objectTable,
  requestTable,
  tagTable,
} from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import type { FilePull } from "@/utilities/zod/parsers";
import { nanoid } from "nanoid";
import { visibility } from "@/utilities/types";

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
          visibility: objectTable.visibility,
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
          visibility: row.visibility ?? "private",
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
  updateVisibility: publicProcedure
    .input(
      z.object({
        objectId: z.string(),
        visibility: z.enum(["public", "private"]),
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
        const currentRequest = await db.query.requestTable.findFirst({
          where: and(
            eq(requestTable.userId, parsedUserId),
            eq(requestTable.objectId, input.objectId),
          ),
        });
        const object = await db.query.objectTable.findFirst({
          where: eq(objectTable.id, input.objectId),
        });

        if (input.visibility === "private") {
          await db
            .update(objectTable)
            .set({ visibility: "public" })
            .where(eq(objectTable.id, input.objectId));
          return {
            result: "success",
            message: "Successfully updated visibility.",
          };
        }
        
        if (!currentRequest && object) {
          if (input.visibility === object.visibility)
            return {
              result: "success",
              message: "Visibility already set to same value.",
            };
          await db.insert(requestTable).values({
            id: nanoid(15),
            userId: parsedUserId,
            objectId: input.objectId,
            createdAt: Math.floor(Date.now() / 1000),
          });
          return {
            result: "success",
            message: "Successfully requested publicity.",
          };
        }
        if (currentRequest && currentRequest.status === "pending")
          return {
            result: "fail",
            message: "Request already pending.",
          };
        if (currentRequest && currentRequest.status === "rejected")
          return {
            result: "fail",
            message: "Request already denied.",
          };
        if (currentRequest && currentRequest.status === "accepted") {
          await db
            .update(objectTable)
            .set({ visibility: "public" })
            .where(eq(objectTable.id, input.objectId));
          return {
            result: "success",
            message: "Visibility updated successfully.",
          };
        }
      } catch {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Delete could not be performed.",
        });
      }
    }),
});
