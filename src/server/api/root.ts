import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { uploadRouter } from "./routers/upload";
import { mainRouter } from "./routers/main";
import { libraryRouter } from "./routers/library";
import { profileRouter } from "./routers/profile";
import { requestsRouter } from "./routers/requests";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  main: mainRouter,
  upload: uploadRouter,
  library: libraryRouter,
  profile: profileRouter,
  requests: requestsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
