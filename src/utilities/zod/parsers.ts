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

export const attributeInputSchema = z
  .string()
  .max(100)
  .regex(/^[a-z\s]*$/, {
    message: "Only lowercase letters and spaces are allowed",
  })
  .optional();

export const uploadObjectSchema = z.object({
  name: z.string(),
  tags: z.array(z.string()),
  attributes: z.record(z.record(z.string())),
});

export type UploadObject = z.infer<typeof uploadObjectSchema>;

const ThumbnailObjectSchema = z.object({
  id: z.string(),
  url: z.string().url(),
});

export const ThumbnailsResponseSchema = z.array(ThumbnailObjectSchema);
