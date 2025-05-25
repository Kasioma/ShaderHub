import { createTRPCRouter, publicProcedure } from "../trpc";
import { db } from "@/server/db";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { visibility } from "@/utilities/types";
import {
  attributeTypeTable,
  attributeValueObjectRelationTable,
  attributeValueTable,
  objectTable,
  objectTagRelationTable,
  searchHistoryTable,
  tagTable,
  userTable,
} from "@/server/db/schema";
import { eq, and, desc, asc, lt, gt } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";

export async function isSignedIn() {
  const { sessionClaims } = await auth();
  if (!sessionClaims) return null;
  return sessionClaims.id;
}

export const mainRouter = createTRPCRouter({
  getInfiniteObjects: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        cursor: z.number().nullish(),
        direction: z.enum(["forward", "backward"]).default("forward"),
      }),
    )
    .query(async ({ input }) => {
      const limit = input.limit ?? 20;
      const cursor = input.cursor;
      const direction = input.direction;

      const query = await db
        .select({
          id: objectTable.id,
          name: objectTable.name,
          userId: objectTable.userId,
          createdAt: objectTable.createdAt,
          username: userTable.username,
        })
        .from(objectTable)
        .innerJoin(userTable, eq(objectTable.userId, userTable.id))
        .where(
          and(
            eq(objectTable.visibility, visibility.public),
            cursor
              ? direction === "forward"
                ? lt(objectTable.createdAt, cursor)
                : gt(objectTable.createdAt, cursor)
              : undefined,
          ),
        )
        .orderBy(
          direction === "forward"
            ? desc(objectTable.createdAt)
            : asc(objectTable.createdAt),
        )
        .limit(limit + 1);

      if (direction === "backward") {
        query.reverse();
      }

      let nextCursor: number | undefined;
      let prevCursor: number | undefined;

      if (query.length > limit) {
        const extra = query.pop();

        if (direction === "forward") nextCursor = extra!.createdAt;
        else prevCursor = extra!.createdAt;
      }

      if (query.length > 0) {
        if (direction === "forward")
          nextCursor = query[query.length - 1]!.createdAt;
        else prevCursor = query[0]!.createdAt;
      }

      return {
        query,
        nextCursor,
        prevCursor,
      };
    }),
  getObjectInformation: publicProcedure
    .input(
      z.object({
        objectId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      try {
        const tags = await db
          .select({
            id: tagTable.id,
            name: tagTable.name,
            colour: tagTable.colour,
          })
          .from(tagTable)
          .innerJoin(
            objectTagRelationTable,
            eq(tagTable.id, objectTagRelationTable.tagId),
          )
          .where(eq(objectTagRelationTable.objectId, input.objectId));

        const attributes = await db
          .select({
            id: attributeValueTable.id,
            name: attributeTypeTable.name,
            value: attributeValueTable.value,
          })
          .from(attributeValueTable)
          .innerJoin(
            attributeValueObjectRelationTable,
            eq(
              attributeValueTable.id,
              attributeValueObjectRelationTable.attributeId,
            ),
          )
          .innerJoin(
            attributeTypeTable,
            eq(attributeValueTable.attributeTypeId, attributeTypeTable.id),
          )
          .where(
            eq(attributeValueObjectRelationTable.objectId, input.objectId),
          );

        return { tags, attributes };
      } catch {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Fetch could not be performed.",
        });
      }
    }),
  getUserSearchHistory: publicProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const query = await db
        .select({
          id: searchHistoryTable.id,
          query: searchHistoryTable.query,
          createdAt: searchHistoryTable.createdAt,
        })
        .from(searchHistoryTable)
        .where(eq(searchHistoryTable.userId, input.userId))
        .orderBy(desc(searchHistoryTable.createdAt))
        .limit(5);

      return query;
    }),
  addUserSearchHistory: publicProcedure
    .input(
      z.object({
        query: z.string(),
        userId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        console.log(input);
        if (!input.userId) return;
        await db.insert(searchHistoryTable).values({
          id: nanoid(),
          userId: input.userId,
          query: input.query,
          createdAt: Math.floor(Date.now() / 1000),
        });
      } catch {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Failed to add search history",
        });
      }
    }),
});
