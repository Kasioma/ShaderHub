import { createTRPCRouter, publicProcedure } from "../trpc";
import { db } from "@/server/db";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { visibility } from "@/utilities/types";
import {
  attributeTypeTable,
  attributeValueObjectRelationTable,
  attributeValueTable,
  collectionsTable,
  objectTable,
  objectTagRelationTable,
  searchHistoryTable,
  tagTable,
  userTable,
} from "@/server/db/schema";
import {
  eq,
  and,
  desc,
  asc,
  lt,
  gt,
  or,
  ilike,
  inArray,
  ne,
} from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { checkStateSchema } from "@/utilities/zod/parsers";

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
        query: z.string().nullish(),
      }),
    )
    .query(async ({ input }) => {
      const limit = input.limit ?? 20;
      const cursor = input.cursor;
      const direction = input.direction;
      const querySplit = input.query?.split(" ") ?? [];
      console.log(querySplit);

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
        .leftJoin(
          objectTagRelationTable,
          eq(objectTable.id, objectTagRelationTable.objectId),
        )
        .leftJoin(tagTable, eq(objectTagRelationTable.tagId, tagTable.id))
        .leftJoin(
          attributeValueObjectRelationTable,
          eq(objectTable.id, attributeValueObjectRelationTable.objectId),
        )
        .leftJoin(
          attributeValueTable,
          eq(
            attributeValueObjectRelationTable.attributeId,
            attributeValueTable.id,
          ),
        )
        .where(
          and(
            eq(objectTable.visibility, visibility.public),
            cursor
              ? direction === "forward"
                ? lt(objectTable.createdAt, cursor)
                : gt(objectTable.createdAt, cursor)
              : undefined,
            input.query
              ? or(
                  ...querySplit.map((item) =>
                    ilike(objectTable.name, `%${item}%`),
                  ),
                  ...querySplit.map((item) =>
                    and(
                      ilike(tagTable.name, `${item}`),
                      eq(tagTable.visibility, visibility.public),
                    ),
                  ),
                  ...querySplit.map((item) =>
                    and(ilike(attributeValueTable.value, `${item}`)),
                  ),
                )
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
      const userId = await isSignedIn();
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

        const favouriteTagId = "tag-5";
        const parsedUserId = z.string().parse(userId);

        const toggleCheck = await db
          .select()
          .from(collectionsTable)
          .where(
            and(
              eq(collectionsTable.objectId, input.objectId),
              eq(collectionsTable.userId, parsedUserId),
              eq(collectionsTable.tagId, favouriteTagId),
            ),
          );

        return { tags, attributes, favourite: toggleCheck.length > 0 };
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
      try {
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
      } catch {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Fetch could not be performed.",
        });
      }
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
  getTagsInformation: publicProcedure
    .input(
      z.object({
        userId: z.string(),
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
          .where(
            or(
              eq(tagTable.userId, input.userId),
              eq(tagTable.visibility, "public"),
            ),
          );
        return tags;
      } catch {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Fetch could not be performed.",
        });
      }
    }),
  toggleFavouriteTag: publicProcedure
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
        const favouriteTagId = "tag-5";
        const whereCondition = and(
          eq(collectionsTable.objectId, input.objectId),
          eq(collectionsTable.userId, parsedUserId),
          eq(collectionsTable.tagId, favouriteTagId),
        );

        const toggleCheck = await db
          .select()
          .from(collectionsTable)
          .where(whereCondition);

        if (toggleCheck.length > 0) {
          await db.delete(collectionsTable).where(whereCondition);
          return false;
        } else {
          await db.insert(collectionsTable).values({
            objectId: input.objectId,
            userId: parsedUserId,
            tagId: favouriteTagId,
          });
          return true;
        }
      } catch {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Failed to add favourite tag.",
        });
      }
    }),
  getAllUserCollections: publicProcedure
    .input(
      z.object({
        objectId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const userId = await isSignedIn();
      if (!userId) {
        return {
          usedTags: [],
          objectTags: [],
        };
      }
      try {
        const parsedUserId = z.string().parse(userId);
        const usedTags = await db
          .select({
            tagId: collectionsTable.tagId,
            tagName: tagTable.name,
          })
          .from(collectionsTable)
          .leftJoin(
            tagTable,
            and(
              eq(collectionsTable.tagId, tagTable.id),
              ne(tagTable.name, "Favourite"),
            ),
          )
          .where(
            and(
              eq(collectionsTable.userId, parsedUserId),
              ne(tagTable.name, "Favourite"),
            ),
          )
          .groupBy(collectionsTable.tagId, tagTable.name);

        const objectTags = await db
          .select({
            tagId: collectionsTable.tagId,
            tagName: tagTable.name,
          })
          .from(collectionsTable)
          .leftJoin(
            tagTable,
            and(
              eq(collectionsTable.tagId, tagTable.id),
              ne(tagTable.name, "Favourite"),
            ),
          )
          .where(
            and(
              eq(collectionsTable.userId, parsedUserId),
              eq(collectionsTable.objectId, input.objectId),
              ne(tagTable.name, "Favourite"),
            ),
          )
          .groupBy(collectionsTable.tagId, tagTable.name);

        return { usedTags, objectTags };
      } catch {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Failed to get all user collections.",
        });
      }
    }),
  addToCollection: publicProcedure
    .input(
      z.object({
        objectId: z.string(),
        checkedTags: checkStateSchema,
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
      if (!input.checkedTags || Object.keys(input.checkedTags).length === 0)
        return;
      try {
        const parsedUserId = z.string().parse(userId);
        if (!input.checkedTags) return;
        const trueTags = Object.entries(input.checkedTags)
          .filter(([_, isChecked]) => isChecked)
          .map(([tagId]) => tagId);

        if (trueTags.length > 0) {
          await db
            .insert(collectionsTable)
            .values(
              trueTags.map((tagId) => ({
                userId: parsedUserId,
                objectId: input.objectId,
                tagId,
              })),
            )
            .onConflictDoNothing();
        }

        const falseTags = Object.entries(input.checkedTags)
          .filter(([_, isChecked]) => !isChecked)
          .map(([tagId]) => tagId);

        if (falseTags.length > 0) {
          await db
            .delete(collectionsTable)
            .where(
              and(
                eq(collectionsTable.userId, parsedUserId),
                eq(collectionsTable.objectId, input.objectId),
                inArray(collectionsTable.tagId, falseTags),
              ),
            );
        }
      } catch {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Failed to add to collection.",
        });
      }
    }),
  createCollection: publicProcedure
    .input(
      z.object({
        objectId: z.string(),
        tagName: z.string(),
        tagColor: z.string(),
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
        const tag = await db
          .select({
            id: tagTable.id,
          })
          .from(tagTable)
          .where(eq(tagTable.name, input.tagName))
          .limit(1);

        await db.transaction(async (tx) => {
          const newTagId = nanoid(15);
          if (tag.length === 0) {
            await tx.insert(tagTable).values({
              id: newTagId,
              name: input.tagName,
              colour: input.tagColor,
              visibility: "private",
              userId: parsedUserId,
            });
          }
          await tx.insert(collectionsTable).values({
            objectId: input.objectId,
            userId: parsedUserId,
            tagId: tag[0] ? tag[0].id : newTagId,
          });
        });
        return true;
      } catch {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Failed to create collection.",
        });
      }
    }),
});
