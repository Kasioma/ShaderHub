import { createTRPCRouter, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { db } from "@/server/db";
import {
  attributeTypeTable,
  tagTable,
  attributeTypeTagRelationTable,
  objectTable,
  objectTagRelationTable,
  attributeValueTable,
  attributeValueObjectRelationTable,
} from "@/server/db/schema";
import { eq, or, and } from "drizzle-orm";
import { z } from "zod";
import { uploadObjectSchema } from "@/utilities/zod/parsers";
import { nanoid } from "nanoid";
import { auth } from "@clerk/nextjs/server";

export async function isSignedIn() {
  const { sessionClaims } = await auth();
  if (!sessionClaims) return null;
  return sessionClaims.id;
}

export const uploadRouter = createTRPCRouter({
  queryTagsAndAttributes: publicProcedure.query(async () => {
    const userId = await isSignedIn();
    if (!userId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be signed in to use this route.",
      });
    }
    try {
      const parsedUserId = z.string().parse(userId);
      const tagsAndAttributes = await db
        .select({
          tag: tagTable,
          attributes: attributeTypeTable,
        })
        .from(attributeTypeTagRelationTable)
        .leftJoin(
          tagTable,
          and(
            eq(attributeTypeTagRelationTable.tagId, tagTable.id),
            or(
              eq(tagTable.userId, parsedUserId),
              eq(tagTable.visibility, "public"),
            ),
          ),
        )
        .leftJoin(
          attributeTypeTable,
          eq(attributeTypeTagRelationTable.attributeId, attributeTypeTable.id),
        );
      if (!tagsAndAttributes)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Query failed.",
        });
      const result = new Map<
        string,
        {
          tag: typeof tagTable.$inferSelect;
          attributes: (typeof attributeTypeTable.$inferSelect)[];
        }
      >();

      for (const entry of tagsAndAttributes) {
        if (!entry.tag || !entry.attributes) continue;

        const existingEntry = result.get(entry.tag.id);
        if (existingEntry) {
          existingEntry.attributes.push(entry.attributes);
        } else {
          result.set(entry.tag.id, {
            tag: entry.tag,
            attributes: [entry.attributes],
          });
        }
      }
      return result;
    } catch {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Fetch could not be performed.",
      });
    }
  }),
  uploadObject: publicProcedure
    .input(uploadObjectSchema)
    .mutation(async ({ input }) => {
      const userId = await isSignedIn();
      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be signed in to use this route.",
        });
      }
      const objectId = nanoid(15);
      try {
        await db.transaction(async (tx) => {
          const parsedUserId = z.string().parse(userId);

          const tagRows = input.tags.map((tagId) => ({
            tagId,
            objectId: objectId,
          }));

          const attributeRows = Object.entries(input.attributes).flatMap(
            ([, tagAttributes]) =>
              Object.entries(tagAttributes).map(([attributeId, value]) => ({
                id: nanoid(15),
                attributeTypeId: attributeId,
                value,
              })),
          );

          const attributeObjectRows = attributeRows.map((attributeRow) => ({
            objectId: objectId,
            attributeId: attributeRow.id,
          }));

          await tx.insert(objectTable).values({
            id: objectId,
            name: input.name,
            userId: parsedUserId,
            createdAt: Math.floor(Date.now() / 1000),
          });

          await tx.insert(objectTagRelationTable).values(tagRows);
          if (attributeRows.length > 0)
            await tx.insert(attributeValueTable).values(attributeRows);
          if (attributeObjectRows.length > 0)
            await tx
              .insert(attributeValueObjectRelationTable)
              .values(attributeObjectRows);
        });
        return objectId;
      } catch (err) {
        console.error("Error during object mutation:", err);

        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Mutation failed: ${err instanceof Error ? err.message : "Unknown error"}`,
          cause: err instanceof Error ? err : undefined,
        });
      }
    }),
});
