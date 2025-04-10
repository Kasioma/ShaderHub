import { z } from "zod";

export const authSchema = z.object({
  id: z.string(),
  username: z.string(),
});

export type Auth = z.infer<typeof authSchema>;

export const tagSchema = z.object({
  id: z.string(),
  name: z.string(),
  colour: z.string(),
  visibility: z.string(),
  userId: z.string(),
});

export type Tag = z.infer<typeof tagSchema>;

export const attributeTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export type AttributeType = z.infer<typeof attributeTypeSchema>;

