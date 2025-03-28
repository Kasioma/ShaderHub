import { z } from "zod";

export const authSchema = z.object({
  id: z.string(),
  username: z.string(),
});

export type Auth = z.infer<typeof authSchema>;
