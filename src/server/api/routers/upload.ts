import { auth } from "@clerk/nextjs/server";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { db } from "@/server/db";
import {
  attributeTypeTable,
  tagTable,
  attributeTypeTagRelationTable,
} from "@/server/db/schema";
import { eq, or, and } from "drizzle-orm";
import { z } from "zod";

async function isSignedIn() {
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
});
