import { createTRPCRouter, publicProcedure } from "../trpc";
import { db } from "@/server/db";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { visibility } from "@/utilities/types";
import { objectTable, userTable } from "@/server/db/schema";
import { eq, and, desc, asc, lt, gt } from "drizzle-orm";

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
        if (direction === "forward") nextCursor = query[0]!.createdAt;
        else prevCursor = query[query.length - 1]!.createdAt;
      }

      return {
        query,
        nextCursor,
        prevCursor,
      };
    }),
});
