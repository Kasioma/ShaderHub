import { createTRPCRouter, publicProcedure } from "../trpc";
import { db } from "@/server/db";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { visibility } from "@/utilities/types";

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

      const query = await db.query.objectTable.findMany({
        limit: limit + 1,
        where: (obj, { and, lt, gt, eq }) =>
          and(
            eq(obj.visibility, visibility.public),
            cursor
              ? direction === "forward"
                ? lt(obj.createdAt, cursor)
                : gt(obj.createdAt, cursor)
              : undefined,
          ),
        orderBy: (obj, { asc, desc }) =>
          direction === "forward"
            ? [desc(obj.createdAt)]
            : [asc(obj.createdAt)],
        columns: {
          id: true,
          name: true,
          userId: true,
          createdAt: true,
        },
      });

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
