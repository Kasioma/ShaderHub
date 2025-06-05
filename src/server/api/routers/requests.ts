import { auth } from "@clerk/nextjs/server";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { db } from "@/server/db";
import { objectTable, requestTable, userTable } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";

export async function isSignedIn() {
  const { sessionClaims } = await auth();
  if (!sessionClaims) return null;
  if ((sessionClaims.roles as string[]).includes("admin"))
    return sessionClaims.id;
  return null;
}

export const requestsRouter = createTRPCRouter({
  getRequests: publicProcedure.query(async () => {
    const userId = await isSignedIn();
    if (!userId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be signed in to use this route.",
      });
    }
    try {
      const parsedUserId = z.string().parse(userId);
      const requests = await db
        .select({
          id: requestTable.id,
          userId: userTable.id,
          username: userTable.username,
          objectId: objectTable.id,
          objectName: objectTable.name,
          status: requestTable.status,
          createdAt: requestTable.createdAt,
        })
        .from(requestTable)
        .leftJoin(userTable, eq(requestTable.userId, userTable.id))
        .leftJoin(objectTable, eq(requestTable.objectId, objectTable.id))
        .where(
          and(
            eq(requestTable.userId, parsedUserId),
            eq(requestTable.status, "pending"),
          ),
        );
      return requests;
    } catch {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Fetch could not be performed.",
      });
    }
  }),
  setStatus: publicProcedure
    .input(
      z.object({
        id: z.string(),
        objectId: z.string(),
        status: z.enum(["accepted", "rejected", "pending"]),
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
        await db.transaction(async (tx) => {
          await tx
            .update(requestTable)
            .set({ status: input.status })
            .where(eq(requestTable.id, input.id));
          if (input.status === "accepted")
            await tx
              .update(objectTable)
              .set({ visibility: "public" })
              .where(eq(objectTable.id, input.objectId));
        });
        return true;
      } catch {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Delete could not be performed.",
        });
      }
    }),
});
